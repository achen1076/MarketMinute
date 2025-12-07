import pandas as pd
import os
import requests
import numpy as np
from datetime import datetime, timedelta
from src.news.bayesian_update import bayesian_update


def load_news_from_db(ticker, webapp_url):
    """Load news items from database via webapp API"""
    if not webapp_url:
        return []

    try:
        url = f"{webapp_url}/api/news/get?ticker={ticker}&days=2"
        response = requests.get(url, timeout=5)

        if not response.ok:
            return []

        data = response.json()
        news_items = []

        for item in data.get('news', []):
            sentiment = item.get('sentiment')
            relevance = item.get('relevance')
            category = item.get('category', 'noise')

            if sentiment is not None and relevance is not None:
                news_items.append({
                    'sentiment': float(sentiment),
                    'relevance': float(relevance),
                    'category': category
                })

        return news_items
    except Exception as e:
        print(f"[Lambda] Error loading news for {ticker}: {e}")
        return []


def generate_live_predictions(raw_predictions, prices, volatilities, raw_data, webapp_url=None):
    """Generate live predictions from SageMaker model outputs with optional news adjustment"""
    predictions = []
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for ticker, pred_data in raw_predictions.items():
        if not pred_data or ticker not in prices or 'error' in pred_data:
            continue

        pred = pred_data['class'][0]
        probabilities = pred_data['probabilities'][0]
        prob_down, prob_neutral, prob_up = probabilities[0], probabilities[1], probabilities[2]
        current_price = prices[ticker]

        # Store raw model outputs
        raw_prob_up = prob_up
        raw_prob_down = prob_down
        raw_prob_neutral = prob_neutral

        signal_map = {-1: "SELL", 0: "NEUTRAL", 1: "BUY"}
        raw_signal = signal_map.get(pred, "NEUTRAL")
        raw_confidence = max(prob_down, prob_neutral, prob_up)

        # Apply Bayesian update if webapp_url provided
        news_count = 0
        if webapp_url:
            news_items = load_news_from_db(ticker, webapp_url)

            if news_items:
                prior = {"up": prob_up, "down": prob_down,
                         "neutral": prob_neutral}
                posterior = bayesian_update(prior, news_items)

                prob_up = posterior["up"]
                prob_down = posterior["down"]
                prob_neutral = posterior["neutral"]
                news_count = len(news_items)

                # Recalculate signal based on news-adjusted probabilities
                news_probs = [prob_down, prob_neutral, prob_up]
                news_pred = np.argmax(news_probs) - 1
                signal = signal_map.get(news_pred, "NEUTRAL")
                confidence = max(news_probs)
            else:
                signal = raw_signal
                confidence = raw_confidence
        else:
            signal = raw_signal
            confidence = raw_confidence

        df = raw_data.get(ticker)
        if df is not None and len(df) >= 14:
            high_low = df['high'] - df['low']
            high_close = abs(df['high'] - df['close'].shift(1))
            low_close = abs(df['low'] - df['close'].shift(1))
            tr = pd.concat([high_low, high_close, low_close],
                           axis=1).max(axis=1)
            atr = tr.rolling(14).mean().iloc[-1]
        else:
            atr = None

        if atr and pred != 0:
            take_profit = current_price + \
                (1.5 * atr) if pred == 1 else current_price - (1.5 * atr)
            stop_loss = current_price - \
                (1.0 * atr) if pred == 1 else current_price + (1.0 * atr)
        else:
            take_profit = stop_loss = None

        should_trade = confidence >= 0.64 and signal != "NEUTRAL"

        predictions.append({
            'ticker': ticker,
            'timestamp': timestamp,
            'current_price': round(current_price, 2),
            # Raw model outputs (before news)
            'raw_signal': raw_signal,
            'raw_confidence': round(raw_confidence, 10),
            'raw_prob_up': round(raw_prob_up, 10),
            'raw_prob_neutral': round(raw_prob_neutral, 10),
            'raw_prob_down': round(raw_prob_down, 10),
            # News-adjusted outputs (after Bayesian update)
            'signal': signal,
            'confidence': round(confidence, 10),
            'prob_up': round(prob_up, 10),
            'prob_neutral': round(prob_neutral, 10),
            'prob_down': round(prob_down, 10),
            'news_count': news_count,
            'should_trade': should_trade,
            'take_profit': round(take_profit, 2) if take_profit else '',
            'stop_loss': round(stop_loss, 2) if stop_loss else '',
            'atr': round(atr, 2) if atr else ''
        })

    return predictions
