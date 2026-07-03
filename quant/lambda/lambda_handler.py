import json
import os
import boto3
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
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
LAMBDA_API_KEY = os.environ.get('LAMBDA_API_KEY', '')


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
        today = datetime.now().strftime("%Y-%m-%d")
        print(f"[Lambda] Processing news at {news_url} for date: {today}")

        response = requests.post(
            news_url,
            json={
                'tickers': TICKERS,
                'from': today,
                'to': today
            },
            timeout=int(os.environ.get('NEWS_TIMEOUT', '20'))
        )
        response.raise_for_status()

        data = response.json()
        print(
            f"[Lambda] News processed: {data.get('processed', 0)} tickers, {data.get('saved', 0)} items saved")

        return {
            'status': 'success',
            'processed': data.get('processed', 0),
            'saved': data.get('saved', 0),
            'sentiment_data': data.get('sentiment_data', [])
        }
    except Exception as e:
        print(f"[Lambda] News processing error: {str(e)}")
        return {'status': 'error', 'error': str(e)}


def process_sentiment_alerts(sentiment_data=None):
    """Process sentiment alerts for all tickers"""
    if not WEBAPP_URL:
        print("[Lambda] WEBAPP_URL not configured, skipping sentiment alerts")
        return {'status': 'skipped', 'reason': 'No WEBAPP_URL configured'}

    try:
        alerts_url = f"{WEBAPP_URL}/api/cron/process-sentiment-alerts"
        print(f"[Lambda] Processing sentiment alerts at {alerts_url}")

        payload = {}
        if sentiment_data:
            payload['symbols'] = sentiment_data

        response = requests.post(
            alerts_url,
            json=payload,
            headers={'x-api-key': LAMBDA_API_KEY} if LAMBDA_API_KEY else {},
            timeout=int(os.environ.get('SENTIMENT_TIMEOUT', '20'))
        )
        response.raise_for_status()

        data = response.json()
        print(
            f"[Lambda] Sentiment alerts: {data.get('alertsCreated', 0)} alerts created")

        return {
            'status': 'success',
            'processed': data.get('processed', 0),
            'alertsCreated': data.get('alertsCreated', 0)
        }
    except Exception as e:
        print(f"[Lambda] Sentiment alerts error: {str(e)}")
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

            # Step 2: Process sentiment alerts based on news
            sentiment_data = news_result.get('sentiment_data', [])
            alerts_result = process_sentiment_alerts(sentiment_data)

            # Step 3: Fetch market data and generate predictions
            features, prices, volatilities, raw_data = fetch_market_data()
            raw_predictions = get_predictions(features)
            live_predictions = generate_live_predictions(
                raw_predictions, prices, volatilities, raw_data, webapp_url=WEBAPP_URL, lambda_api_key=LAMBDA_API_KEY)
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
                    'sentiment_alerts': alerts_result,
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


FMP_FETCH_WORKERS = int(os.environ.get("FMP_FETCH_WORKERS", "32"))


def _fetch_one_ticker(ticker, fmp_client, feature_engine, from_date, to_date, exclude_cols):
    """Worker: fetch + compute features for a single ticker. Returns dict or None on failure."""
    try:
        df = fmp_client.fetch_aggregates(
            ticker=ticker,
            timespan="day",
            from_date=from_date,
            to_date=to_date,
        )
        if df.empty:
            return None

        df_features = feature_engine.calculate_all(df)
        if df_features.empty:
            return None

        feature_cols = [
            c for c in df_features.columns if c not in exclude_cols]
        last_row = df_features[feature_cols].iloc[-1]
        return {
            "ticker": ticker,
            "raw": df,
            "volatility": calculate_historical_volatility(df),
            "price": float(df["close"].iloc[-1]),
            "features": {col: float(last_row[col]) for col in feature_cols},
        }
    except Exception as e:
        print(f"[Lambda] Error processing {ticker}: {str(e)[:200]}")
        return None


def fetch_market_data():
    """Fetch market data from FMP API and generate features (parallelized)."""
    fmp_api_key = get_fmp_api_key()
    fmp_client = FMPDataFetcher(api_key=fmp_api_key)
    feature_engine = FeatureEngine()

    features, prices, volatilities, raw_data = {}, {}, {}, {}
    exclude_cols = [
        "timestamp", "open", "high", "low", "close", "volume", "ticker",
        "label", "forward_ret", "return_at_label",
        "rolling_vol", "neutral_thresh", "strong_thresh", "dyn_thresh"
    ]

    # Inference only needs ~252 trading days for the longest rolling feature
    # (52-week high/low, mom_200, etc). 3 years gives a healthy buffer while
    # keeping each FMP response small enough for Lambda to fetch all 512
    # tickers within its timeout window.
    fetch_years = int(os.environ.get("FMP_FETCH_YEARS", "3"))
    from_date = (datetime.now() - timedelta(days=365 *
                 fetch_years)).strftime("%Y-%m-%d")
    to_date = datetime.now().strftime("%Y-%m-%d")

    print(
        f"[Lambda] Fetching data from {from_date} to {to_date} "
        f"for {len(TICKERS)} tickers using {FMP_FETCH_WORKERS} workers"
    )

    fetch_start = datetime.now()
    completed = 0
    with ThreadPoolExecutor(max_workers=FMP_FETCH_WORKERS) as ex:
        futures = {
            ex.submit(
                _fetch_one_ticker, t, fmp_client, feature_engine,
                from_date, to_date, exclude_cols,
            ): t
            for t in TICKERS
        }
        for fut in as_completed(futures):
            completed += 1
            result = fut.result()
            if not result:
                continue
            t = result["ticker"]
            raw_data[t] = result["raw"]
            volatilities[t] = result["volatility"]
            prices[t] = result["price"]
            features[t] = result["features"]
            # Light progress log every 50 completions
            if completed % 50 == 0:
                print(f"[Lambda] Progress: {completed}/{len(TICKERS)} fetched")

    elapsed = (datetime.now() - fetch_start).total_seconds()
    print(
        f"[Lambda] Successfully processed {len(features)}/{len(TICKERS)} tickers "
        f"in {elapsed:.1f}s"
    )
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
