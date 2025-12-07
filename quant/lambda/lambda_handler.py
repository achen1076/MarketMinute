import json
import os
import boto3
import requests
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import traceback

# Local modules
from src.data.fmp_data import FMPDataFetcher
from src.data.features.feature_engine import FeatureEngine
from predictions import generate_live_predictions
from forecasting import generate_distributional_forecasts, calculate_historical_volatility
from tickers import TICKERS

CODE_VERSION = "v1.4.0-secrets-manager"
print(f"[INIT] Lambda handler loaded - {CODE_VERSION}")

sagemaker_runtime = boto3.client('sagemaker-runtime')
secretsmanager = boto3.client('secretsmanager')

SAGEMAKER_ENDPOINT = os.environ.get(
    'SAGEMAKER_ENDPOINT_NAME', 'marketminute-dev-endpoint')
WEBAPP_URL = os.environ.get('WEBAPP_URL', '')


def get_fmp_api_key():
    """Retrieve FMP API key from AWS Secrets Manager"""
    secret_arn = os.environ.get('FMP_SECRET_ARN')

    if not secret_arn:
        print("[Lambda] FMP_SECRET_ARN not set, trying FMP_API_KEY environment variable")
        # Fallback to environment variable for backwards compatibility
        return os.environ.get('FMP_API_KEY', 'YOUR_FMP_API_KEY_HERE')

    try:
        response = secretsmanager.get_secret_value(SecretId=secret_arn)
        secret_data = json.loads(response['SecretString'])
        api_key = secret_data.get('FMP_API_KEY')
        print("[Lambda] Successfully retrieved FMP API key from Secrets Manager")
        return api_key
    except Exception as e:
        print(f"[Lambda] Error retrieving secret from Secrets Manager: {e}")
        # Fallback to environment variable
        return os.environ.get('FMP_API_KEY', 'YOUR_FMP_API_KEY_HERE')


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


def process_news_for_all_tickers():
    """Process news before generating predictions"""
    if not WEBAPP_URL:
        print("[Lambda] WEBAPP_URL not configured, skipping news processing")
        return {'status': 'skipped', 'reason': 'No WEBAPP_URL configured'}

    try:
        news_url = f"{WEBAPP_URL}/api/news/process-batch"
        print(f"[Lambda] Processing news at {news_url}")

        response = requests.post(
            news_url,
            json={'tickers': TICKERS},
            timeout=120
        )
        response.raise_for_status()

        data = response.json()
        print(
            f"[Lambda] News processed: {data.get('processed', 0)} tickers, {data.get('saved', 0)} items saved")

        return {
            'status': 'success',
            'processed': data.get('processed', 0),
            'saved': data.get('saved', 0)
        }
    except Exception as e:
        print(f"[Lambda] News processing error: {str(e)}")
        return {'status': 'error', 'error': str(e)}


def handler(event, context):
    """Lambda orchestrator for daily market analysis"""
    print(f"[Lambda] Starting analysis at {datetime.now().isoformat()}")

    try:
        task = event.get('task', 'daily_analysis')
        print(f"[Lambda] Task: {task}")

        if task == 'daily_analysis':
            # Step 1: Process news FIRST
            news_result = process_news_for_all_tickers()

            # Step 2: Fetch market data and generate predictions
            features, prices, volatilities, raw_data = fetch_market_data()
            raw_predictions = get_predictions(features)
            live_predictions = generate_live_predictions(
                raw_predictions, prices, volatilities, raw_data, webapp_url=WEBAPP_URL)
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
                    'news_processing': news_result,
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


def fetch_market_data():
    """Fetch market data from FMP API and generate features"""
    fmp_api_key = get_fmp_api_key()
    fmp_client = FMPDataFetcher(api_key=fmp_api_key)
    feature_engine = FeatureEngine()

    features, prices, volatilities, raw_data = {}, {}, {}, {}
    exclude_cols = [
        "timestamp", "open", "high", "low", "close", "volume", "ticker",
        "label", "forward_ret", "return_at_label",
        "rolling_vol", "neutral_thresh", "strong_thresh", "dyn_thresh"
    ]

    # Fetch 30 years of historical data (FMP premium supports 30 years)
    from_date = (datetime.now() - timedelta(days=365*30)).strftime("%Y-%m-%d")
    to_date = datetime.now().strftime("%Y-%m-%d")

    print(f"[Lambda] Fetching data from {from_date} to {to_date}")

    for ticker in TICKERS:
        try:
            df = fmp_client.fetch_aggregates(
                ticker=ticker,
                timespan="day",
                from_date=from_date,
                to_date=to_date
            )

            if df.empty:
                print(f"[Lambda] No data for {ticker}")
                continue

            raw_data[ticker] = df
            volatilities[ticker] = calculate_historical_volatility(df)
            prices[ticker] = float(df['close'].iloc[-1])

            df_features = feature_engine.calculate_all(df)
            if df_features.empty:
                print(f"[Lambda] No features generated for {ticker}")
                continue

            feature_cols = [
                col for col in df_features.columns if col not in exclude_cols]
            features[ticker] = [
                df_features[feature_cols].iloc[-1].values.tolist()]

        except Exception as e:
            print(f"[Lambda] Error processing {ticker}: {str(e)}")
            continue

    print(f"[Lambda] Successfully processed {len(features)} tickers")
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
