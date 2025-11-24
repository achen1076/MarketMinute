import json
import os
import boto3
import traceback
import requests
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Local modules
from src.data.schwab_data import SchwabDataFetcher
from src.data.features.feature_engine import FeatureEngine
from predictions import generate_live_predictions
from forecasting import generate_distributional_forecasts, calculate_historical_volatility
from tickers import TICKERS

CODE_VERSION = "v1.2.0-real-probabilities"
print(f"[INIT] Lambda handler loaded - {CODE_VERSION}")

sagemaker_runtime = boto3.client('sagemaker-runtime')
SAGEMAKER_ENDPOINT = os.environ.get(
    'SAGEMAKER_ENDPOINT_NAME', 'marketminute-dev-endpoint')
WEBAPP_URL = os.environ.get('WEBAPP_URL', '')


def save_results_to_db(live_predictions, distributional_forecasts):
    """Save predictions and forecasts to database via webapp API"""
    if not WEBAPP_URL:
        print("[Lambda] WEBAPP_URL not configured, skipping database save")
        return {'status': 'skipped', 'reason': 'No WEBAPP_URL configured'}

    try:
        save_url = f"{WEBAPP_URL}/api/quant/save-results"
        print(f"[Lambda] Saving results to database at {save_url}")

        response = requests.post(
            save_url,
            json={
                'live_predictions': live_predictions,
                'distributional_forecasts': distributional_forecasts,
                'timestamp': datetime.now().isoformat()
            },
            timeout=30
        )
        response.raise_for_status()

        data = response.json()
        print(f"[Lambda] Saved to DB: {data.get('saved', {})}")

        return {
            'status': 'success',
            'saved': data.get('saved', {})
        }
    except Exception as e:
        print(f"[Lambda] Database save error: {str(e)}")
        return {'status': 'error', 'error': str(e)}


def trigger_sentinel_agent():
    """Trigger Sentinel agent via webapp API"""
    if not WEBAPP_URL:
        print("[Lambda] WEBAPP_URL not configured, skipping Sentinel")
        return {'status': 'skipped', 'reason': 'No WEBAPP_URL configured'}

    try:
        sentinel_url = f"{WEBAPP_URL}/api/sentinel"
        print(f"[Lambda] Triggering Sentinel agent at {sentinel_url}")

        response = requests.post(sentinel_url, timeout=60)
        response.raise_for_status()

        data = response.json()
        print(f"[Lambda] Sentinel completed: {data.get('ok', False)}")

        return {
            'status': 'success',
            'report_id': data.get('reportId'),
            'timestamp': data.get('timestamp')
        }
    except Exception as e:
        print(f"[Lambda] Sentinel error: {str(e)}")
        return {'status': 'error', 'error': str(e)}


def handler(event, context):
    """Lambda orchestrator for daily market analysis"""
    print(f"[Lambda] Starting analysis at {datetime.now().isoformat()}")

    try:
        task = event.get('task', 'daily_analysis')
        print(f"[Lambda] Task: {task}")

        if task == 'daily_analysis':
            features, prices, volatilities, raw_data = fetch_market_data()
            raw_predictions = get_predictions(features)
            live_predictions = generate_live_predictions(
                raw_predictions, prices, volatilities, raw_data)
            distributional_forecasts = generate_distributional_forecasts(
                raw_predictions, prices, volatilities)

            print(f"[Lambda] Generated {len(live_predictions)} predictions")

            # Save results to database via webapp API
            save_result = save_results_to_db(
                live_predictions, distributional_forecasts)

            # Trigger Sentinel agent if webapp URL is configured
            sentinel_result = trigger_sentinel_agent()

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'live_predictions': live_predictions,
                    'distributional_forecasts': distributional_forecasts,
                    'sentinel': sentinel_result,
                    'saved_to_db': save_result,
                    'timestamp': datetime.now().isoformat(),
                    'task': task,
                    'tickers_analyzed': len(live_predictions)
                })
            }

        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Unknown task: {task}'})
            }

    except Exception as e:
        print(f"[Lambda] Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'errors': [str(e)],
                'timestamp': datetime.now().isoformat()
            })
        }


def get_schwab_token():
    """Retrieve Schwab OAuth token from AWS Secrets Manager"""
    sm_client = boto3.client('secretsmanager', region_name='us-east-1')
    secret_name = f"{os.environ.get('PROJECT_NAME', 'marketminute')}-{os.environ.get('ENVIRONMENT', 'dev')}-schwab-token"

    response = sm_client.get_secret_value(SecretId=secret_name)
    token_data = json.loads(response['SecretString'])

    token_path = '/tmp/schwab_token.json'
    with open(token_path, 'w') as f:
        json.dump(token_data, f)

    return token_path, secret_name


def save_schwab_token(token_path, secret_name):
    """Save refreshed Schwab token back to Secrets Manager"""
    sm_client = boto3.client('secretsmanager', region_name='us-east-1')

    with open(token_path, 'r') as f:
        token_data = json.load(f)

    sm_client.put_secret_value(
        SecretId=secret_name,
        SecretString=json.dumps(token_data)
    )


def fetch_market_data():
    """Fetch market data from Schwab API and generate features"""
    token_path, secret_name = get_schwab_token()

    schwab_client = SchwabDataFetcher(
        app_key=os.environ.get('SCHWAB_APP_KEY'),
        app_secret=os.environ.get('SCHWAB_APP_SECRET'),
        token_path=token_path
    )
    feature_engine = FeatureEngine()

    features, prices, volatilities, raw_data = {}, {}, {}, {}
    exclude_cols = [
        "timestamp", "open", "high", "low", "close", "volume", "ticker",
        "label", "forward_ret", "return_at_label",
        "rolling_vol", "neutral_thresh", "strong_thresh", "dyn_thresh"
    ]

    for ticker in TICKERS:
        try:
            df = schwab_client.fetch_aggregates(
                ticker=ticker,
                timespan="day",
                from_date=(datetime.now() - timedelta(days=60)
                           ).strftime("%Y-%m-%d"),
                to_date=datetime.now().strftime("%Y-%m-%d")
            )

            if df.empty:
                continue

            raw_data[ticker] = df
            volatilities[ticker] = calculate_historical_volatility(df)
            prices[ticker] = float(df['close'].iloc[-1])

            df_features = feature_engine.calculate_all(df)
            if df_features.empty:
                continue

            feature_cols = [
                col for col in df_features.columns if col not in exclude_cols]
            features[ticker] = [
                df_features[feature_cols].iloc[-1].values.tolist()]

        except Exception as e:
            print(f"[Lambda] Error processing {ticker}: {str(e)}")
            continue

    save_schwab_token(token_path, secret_name)
    return features, prices, volatilities, raw_data


def get_predictions(features):
    """Call SageMaker endpoint with market features"""
    response = sagemaker_runtime.invoke_endpoint(
        EndpointName=SAGEMAKER_ENDPOINT,
        ContentType='application/json',
        Body=json.dumps(
            {'tickers': list(features.keys()), 'features': features})
    )
    return json.loads(response['Body'].read().decode()).get('predictions', {})
