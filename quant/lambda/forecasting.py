import numpy as np
from scipy.stats import norm
from datetime import datetime


def calculate_conviction(prob_up, prob_down, prob_neutral):
    """Calculate conviction level based on probability distribution"""
    max_prob = max(prob_up, prob_down, prob_neutral)

    entropy = -(prob_up * np.log(prob_up + 1e-10) +
                prob_down * np.log(prob_down + 1e-10) +
                prob_neutral * np.log(prob_neutral + 1e-10))
    max_entropy = np.log(3)
    conviction_score = 1 - (entropy / max_entropy)

    if conviction_score >= 0.5:
        conviction = "High"
    elif conviction_score >= 0.3:
        conviction = "Medium"
    else:
        conviction = "Low"

    return conviction, conviction_score


def calculate_magnitude_probabilities(prob_up, prob_down, historical_vol):
    """Calculate probability distribution across magnitude categories"""
    expected_return_pct = (prob_up - prob_down) * historical_vol * 100
    std_pct = historical_vol * 100

    boundaries = {
        "large_down": (-100, -2.0),
        "mild_down": (-2.0, -0.5),
        "flat": (-0.5, 0.5),
        "mild_up": (0.5, 2.0),
        "large_up": (2.0, 100)
    }

    probabilities = {}
    for category, (lower, upper) in boundaries.items():
        z_lower = (lower - expected_return_pct) / (std_pct + 1e-10)
        z_upper = (upper - expected_return_pct) / (std_pct + 1e-10)
        prob = norm.cdf(z_upper) - norm.cdf(z_lower)
        probabilities[category] = prob

    total = sum(probabilities.values())
    if total > 0:
        probabilities = {k: v/total for k, v in probabilities.items()}

    most_likely = max(probabilities, key=probabilities.get)
    return probabilities, most_likely


def calculate_volatility_bands(current_price, historical_vol, prob_up, prob_down):
    """Calculate expected price range for tomorrow"""
    expected_return = (prob_up - prob_down) * historical_vol
    vol_forecast = historical_vol
    expected_range_pct = vol_forecast * 100

    expected_center = current_price * (1 + expected_return)
    upper_bound = expected_center * (1 + vol_forecast)
    lower_bound = expected_center * (1 - vol_forecast)

    if expected_return > 0.005:
        directional_bias = "Bullish"
    elif expected_return < -0.005:
        directional_bias = "Bearish"
    else:
        directional_bias = "Neutral"

    return expected_range_pct, upper_bound, lower_bound, directional_bias


def calculate_percentiles(current_price, historical_vol, prob_up, prob_down):
    """Calculate price percentiles (10th, 50th, 90th)"""
    expected_return = (prob_up - prob_down) * historical_vol
    std = historical_vol
    expected_price = current_price * (1 + expected_return)

    z_10 = norm.ppf(0.10)
    p10 = expected_price * (1 + z_10 * std)
    p50 = expected_price
    z_90 = norm.ppf(0.90)
    p90 = expected_price * (1 + z_90 * std)

    return p10, p50, p90


def calculate_historical_volatility(df, lookback=20):
    """Calculate historical volatility from price data"""
    if len(df) >= lookback:
        returns = df['close'].pct_change()
        recent_vol = returns.tail(lookback).std()
        return recent_vol if not np.isnan(recent_vol) else 0.02
    return 0.02


def generate_distributional_forecasts(raw_predictions, prices, volatilities):
    """Generate distributional forecasts from SageMaker model outputs"""
    forecasts = []
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for ticker, pred_data in raw_predictions.items():
        if not pred_data or ticker not in prices or 'error' in pred_data:
            continue

        pred = pred_data['class'][0]
        probabilities = pred_data['probabilities'][0]
        prob_down, prob_neutral, prob_up = probabilities[0], probabilities[1], probabilities[2]

        current_price = prices[ticker]
        hist_vol = volatilities.get(ticker, 0.02)

        conviction, conviction_score = calculate_conviction(
            prob_up, prob_down, prob_neutral)
        mag_probs, most_likely_category = calculate_magnitude_probabilities(
            prob_up, prob_down, hist_vol)
        expected_range_pct, upper_bound, lower_bound, directional_bias = calculate_volatility_bands(
            current_price, hist_vol, prob_up, prob_down)
        p10, p50, p90 = calculate_percentiles(
            current_price, hist_vol, prob_up, prob_down)

        forecasts.append({
            'ticker': ticker,
            'current_price': round(current_price, 2),
            'timestamp': timestamp,
            'expected_range_pct': round(expected_range_pct, 1),
            'upper_bound': round(upper_bound, 2),
            'lower_bound': round(lower_bound, 2),
            'directional_bias': directional_bias,
            'conviction': conviction,
            'conviction_score': round(conviction_score, 3),
            'most_likely_category': most_likely_category,
            'prob_large_up': round(mag_probs['large_up'], 3),
            'prob_mild_up': round(mag_probs['mild_up'], 3),
            'prob_flat': round(mag_probs['flat'], 3),
            'prob_mild_down': round(mag_probs['mild_down'], 3),
            'prob_large_down': round(mag_probs['large_down'], 3),
            'p10': round(p10, 2),
            'p50': round(p50, 2),
            'p90': round(p90, 2)
        })

    return forecasts
