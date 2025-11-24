import pandas as pd
from datetime import datetime


def generate_live_predictions(raw_predictions, prices, volatilities, raw_data):
    """Generate live predictions from SageMaker model outputs"""
    predictions = []
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for ticker, pred_data in raw_predictions.items():
        if not pred_data or ticker not in prices or 'error' in pred_data:
            continue

        pred = pred_data['class'][0]
        probabilities = pred_data['probabilities'][0]
        prob_down, prob_neutral, prob_up = probabilities[0], probabilities[1], probabilities[2]
        current_price = prices[ticker]

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

        signal_map = {-1: "SELL", 0: "NEUTRAL", 1: "BUY"}
        signal = signal_map.get(pred, "NEUTRAL")
        confidence = max(prob_up, prob_neutral, prob_down)

        if atr and pred != 0:
            take_profit = current_price + \
                (1.5 * atr) if pred == 1 else current_price - (1.5 * atr)
            stop_loss = current_price - \
                (1.0 * atr) if pred == 1 else current_price + (1.0 * atr)
        else:
            take_profit = stop_loss = None

        should_trade = confidence >= 0.64 and pred != 0

        predictions.append({
            'ticker': ticker,
            'timestamp': timestamp,
            'current_price': round(current_price, 2),
            'signal': signal,
            'confidence': round(confidence, 10),
            'prob_up': round(prob_up, 10),
            'prob_neutral': round(prob_neutral, 10),
            'prob_down': round(prob_down, 10),
            'should_trade': should_trade,
            'take_profit': round(take_profit, 2) if take_profit else '',
            'stop_loss': round(stop_loss, 2) if stop_loss else '',
            'atr': round(atr, 2) if atr else ''
        })

    return predictions
