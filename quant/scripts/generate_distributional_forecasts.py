"""
Generate distributional forecasts from model predictions

Outputs: volatility bands, magnitude categories, conviction levels

Updated to work with new optimized model structure and paths

Usage: python3 scripts/generate_distributional_forecasts.py
"""

import pandas as pd
import numpy as np
from scipy.stats import norm
from datetime import datetime
import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))


def calculate_conviction(prob_up, prob_down, prob_neutral):
    """
    Calculate conviction level based on probability distribution

    Returns:
        tuple: (conviction_level, conviction_score)
    """
    max_prob = max(prob_up, prob_down, prob_neutral)

    # Check concentration of probability
    entropy = -(prob_up * np.log(prob_up + 1e-10) +
                prob_down * np.log(prob_down + 1e-10) +
                prob_neutral * np.log(prob_neutral + 1e-10))
    max_entropy = np.log(3)  # Maximum entropy for 3 outcomes

    # Normalized conviction: 0 = max entropy (uniform), 1 = concentrated
    conviction_score = 1 - (entropy / max_entropy)

    if conviction_score >= 0.5:
        conviction = "High"
    elif conviction_score >= 0.3:
        conviction = "Medium"
    else:
        conviction = "Low"

    return conviction, conviction_score


def calculate_magnitude_probabilities(prob_up, prob_down, historical_vol):
    """
    Calculate probability distribution across magnitude categories

    Categories:
    - large_up: >2%
    - mild_up: 0.5% to 2%
    - flat: ±0.5%
    - mild_down: -2% to -0.5%
    - large_down: <-2%
    """
    # Expected return from directional probabilities
    expected_return_pct = (prob_up - prob_down) * historical_vol * 100

    # Standard deviation (daily volatility)
    std_pct = historical_vol * 100

    # Define category boundaries (in %)
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
    """
    Calculate expected price range for tomorrow

    Returns:
        tuple: (expected_range_pct, upper_bound, lower_bound, directional_bias)
    """
    expected_return = (prob_up - prob_down) * historical_vol

    vol_forecast = historical_vol
    expected_range_pct = vol_forecast * 100

    # Calculate bounds (1 std dev)
    expected_center = current_price * (1 + expected_return)
    upper_bound = expected_center * (1 + vol_forecast)
    lower_bound = expected_center * (1 - vol_forecast)

    # Directional bias
    if expected_return > 0.005:
        directional_bias = "Bullish"
    elif expected_return < -0.005:
        directional_bias = "Bearish"
    else:
        directional_bias = "Neutral"

    return expected_range_pct, upper_bound, lower_bound, directional_bias


def calculate_percentiles(current_price, historical_vol, prob_up, prob_down):
    """
    Calculate price percentiles (10th, 50th, 90th)

    Returns:
        tuple: (p10, p50, p90)
    """
    expected_return = (prob_up - prob_down) * historical_vol
    std = historical_vol

    expected_price = current_price * (1 + expected_return)

    # 10th percentile (10% chance below this)
    z_10 = norm.ppf(0.10)
    p10 = expected_price * (1 + z_10 * std)

    # 50th percentile (median)
    p50 = expected_price

    # 90th percentile (10% chance above this)
    z_90 = norm.ppf(0.90)
    p90 = expected_price * (1 + z_90 * std)

    return p10, p50, p90


def generate_forecasts(predictions_df, historical_volatilities):
    """
    Convert binary predictions to distributional forecasts

    Args:
        predictions_df: DataFrame with columns [ticker, prob_up, prob_down, prob_neutral, current_price]
        historical_volatilities: Dict mapping ticker -> daily volatility (20-day)

    Returns:
        DataFrame with distributional forecasts
    """
    forecasts = []

    for _, row in predictions_df.iterrows():
        ticker = row['ticker']
        current_price = row['current_price']
        prob_up = row['prob_up']
        prob_down = row['prob_down']
        prob_neutral = row.get('prob_neutral', 0.0)

        # Get historical volatility (or use default)
        hist_vol = historical_volatilities.get(
            ticker, 0.02)

        # Calculate conviction
        conviction, conviction_score = calculate_conviction(
            prob_up, prob_down, prob_neutral)

        # Calculate magnitude probabilities
        mag_probs, most_likely_category = calculate_magnitude_probabilities(
            prob_up, prob_down, hist_vol
        )

        # Calculate volatility bands
        expected_range_pct, upper_bound, lower_bound, directional_bias = \
            calculate_volatility_bands(
                current_price, hist_vol, prob_up, prob_down)

        # Calculate percentiles
        p10, p50, p90 = calculate_percentiles(
            current_price, hist_vol, prob_up, prob_down)

        forecast = {
            'ticker': ticker,
            'current_price': round(current_price, 2),
            'timestamp': row.get('timestamp', datetime.now().isoformat()),

            # Volatility bands
            'expected_range_pct': round(expected_range_pct, 1),
            'upper_bound': round(upper_bound, 2),
            'lower_bound': round(lower_bound, 2),
            'directional_bias': directional_bias,

            # Conviction
            'conviction': conviction,
            'conviction_score': round(conviction_score, 3),

            # Magnitude categories
            'most_likely_category': most_likely_category,
            'prob_large_up': round(mag_probs['large_up'], 3),
            'prob_mild_up': round(mag_probs['mild_up'], 3),
            'prob_flat': round(mag_probs['flat'], 3),
            'prob_mild_down': round(mag_probs['mild_down'], 3),
            'prob_large_down': round(mag_probs['large_down'], 3),

            # Percentiles
            'p10': round(p10, 2),
            'p50': round(p50, 2),
            'p90': round(p90, 2),
        }

        forecasts.append(forecast)

    return pd.DataFrame(forecasts)


def calculate_historical_volatility_from_data(ticker, lookback_days=20):
    """
    Calculate historical volatility from actual price data.

    Args:
        ticker: Stock symbol
        lookback_days: Number of days to calculate volatility over

    Returns:
        float: Daily volatility (std dev of returns)
    """
    try:
        data_file = Path(f"data/processed/{ticker.lower()}_processed.csv")
        if data_file.exists():
            df = pd.read_csv(data_file)
            if len(df) >= lookback_days:
                df['return'] = df['close'].pct_change()
                recent_vol = df['return'].tail(lookback_days).std()
                return recent_vol
    except Exception:
        pass

    # Fallback to estimates

    # Volatility estimates (annualized -> daily)
    volatility_estimates = {
        # Low volatility stocks
        'KO': 0.15 / np.sqrt(252),
        'PG': 0.14 / np.sqrt(252),
        'JNJ': 0.13 / np.sqrt(252),

        # Medium volatility stocks
        'AAPL': 0.25 / np.sqrt(252),
        'MSFT': 0.24 / np.sqrt(252),
        'GOOGL': 0.26 / np.sqrt(252),

        # High volatility stocks
        'TSLA': 0.50 / np.sqrt(252),
        'NVDA': 0.45 / np.sqrt(252),
        'AMD': 0.48 / np.sqrt(252),

        # Crypto
        'BTC': 0.80 / np.sqrt(252),
        'ETH': 0.90 / np.sqrt(252),
    }

    return volatility_estimates.get(ticker, 0.30 / np.sqrt(252))


def main():
    """Generate distributional forecasts from existing predictions"""

    # Get project root
    project_root = Path(__file__).parent.parent

    # Paths - updated for new structure
    predictions_path = project_root / "outputs" / "live_predictions.csv"
    output_path = project_root / "outputs" / "distributional_forecasts.csv"

    # Create outputs directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print("PROGRESS:10:Loading predictions...", flush=True)
    predictions_df = pd.read_csv(predictions_path)

    print("PROGRESS:30:Calculating historical volatilities...", flush=True)
    tickers = predictions_df['ticker'].unique()
    total_tickers = len(tickers)
    historical_vols = {}

    for i, ticker in enumerate(tickers):
        historical_vols[ticker] = calculate_historical_volatility_from_data(
            ticker)
        # Update progress every 10 tickers
        if i % 10 == 0:
            progress = 30 + int((i / total_tickers) * 30)
            print(
                f"PROGRESS:{progress}:Processing {i}/{total_tickers} tickers...", flush=True)

    print("PROGRESS:60:Generating distributional forecasts...", flush=True)
    forecasts_df = generate_forecasts(predictions_df, historical_vols)

    print("PROGRESS:90:Saving forecasts...", flush=True)
    # Save to CSV
    forecasts_df.to_csv(output_path, index=False)

    print("PROGRESS:100:Complete!", flush=True)
    print(f"\n✅ Forecasts saved to: {output_path}")
    print(f"Generated {len(forecasts_df)} forecasts")
    print("\nSample forecast:")
    print(forecasts_df.iloc[0].to_dict())
    # Print summary statistics
    print("\n📊 Summary Statistics:")
    print(
        f"High conviction: {len(forecasts_df[forecasts_df['conviction'] == 'High'])}")
    print(
        f"Medium conviction: {len(forecasts_df[forecasts_df['conviction'] == 'Medium'])}")
    print(
        f"Low conviction: {len(forecasts_df[forecasts_df['conviction'] == 'Low'])}")

    print("\nMost common categories:")
    print(forecasts_df['most_likely_category'].value_counts())


if __name__ == "__main__":
    main()
