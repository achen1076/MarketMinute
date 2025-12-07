"""
Bayesian updating module for adjusting ML model directional probabilities
based on news sentiment and relevance.

Takes prior probabilities from ML model and updates them based on news items
using Bayesian inference.
"""

from typing import Dict, List, Tuple
import math


# Category weight multipliers
CATEGORY_WEIGHTS = {
    "company": 1.0,
    "sector": 0.7,
    "macro": 0.4,
    "noise": 0.1
}


def calculate_likelihood(sentiment: float, relevance: float, category: str) -> Dict[str, float]:
    """
    Calculate likelihood ratios for up/down/neutral based on news item.

    Args:
        sentiment: Sentiment score in [-1, +1] where -1=bearish, +1=bullish
        relevance: Relevance score in [0, 1] where 1=highly relevant
        category: News category ('company', 'sector', 'macro', 'noise')

    Returns:
        Dictionary with likelihood values for 'up', 'down', 'neutral'

    Logic:
        - Zero relevance → uniform likelihood (no effect)
        - Neutral sentiment → slight preference to neutral
        - Strong sentiment + high relevance → strong directional shift
        - Category modifies the strength of the signal
    """
    # Get category weight
    category_weight = CATEGORY_WEIGHTS.get(category, 0.1)

    # Zero relevance = no information, return uniform likelihood
    if relevance < 0.01:
        return {"up": 1.0, "down": 1.0, "neutral": 1.0}

    # Effective signal strength combines relevance and category weight
    signal_strength = relevance * category_weight

    # Base likelihood starts at 1.0 (no effect)
    # We'll modify based on sentiment and signal strength

    # Sentiment close to zero → favor neutral
    sentiment_abs = abs(sentiment)

    if sentiment_abs < 0.1:
        # Very neutral sentiment → favor neutral outcome
        neutral_boost = 1.0 + (signal_strength * 0.5)
        return {
            "up": 1.0 - (signal_strength * 0.2),
            "down": 1.0 - (signal_strength * 0.2),
            "neutral": neutral_boost
        }

    # Directional sentiment
    # Positive sentiment → increase up likelihood, decrease down
    # Negative sentiment → increase down likelihood, decrease up

    # Scale factor: how much to shift probabilities
    # Max shift is 2x in one direction, 0.5x in opposite
    shift_factor = 1.0 + (signal_strength * sentiment_abs * 1.5)

    if sentiment > 0:
        # Bullish news
        likelihood_up = shift_factor
        likelihood_down = 1.0 / shift_factor
        likelihood_neutral = 1.0 - (signal_strength * sentiment_abs * 0.3)
    else:
        # Bearish news
        likelihood_up = 1.0 / shift_factor
        likelihood_down = shift_factor
        likelihood_neutral = 1.0 - (signal_strength * sentiment_abs * 0.3)

    # Ensure all values are positive
    likelihood_up = max(0.1, likelihood_up)
    likelihood_down = max(0.1, likelihood_down)
    likelihood_neutral = max(0.1, likelihood_neutral)

    return {
        "up": likelihood_up,
        "down": likelihood_down,
        "neutral": likelihood_neutral
    }


def bayesian_update(prior_probs: Dict[str, float], news_items: List[Dict]) -> Dict[str, float]:
    """
    Update prior probabilities using Bayesian inference based on news items.

    Args:
        prior_probs: Dictionary with 'up', 'down', 'neutral' prior probabilities
        news_items: List of news dictionaries with keys:
            - sentiment: float in [-1, +1]
            - relevance: float in [0, 1]
            - category: str ('company', 'sector', 'macro', 'noise')

    Returns:
        Dictionary with posterior probabilities for 'up', 'down', 'neutral'

    Method:
        posterior ∝ prior × Π(likelihood_i) for all news items

        For multiple news items, multiply likelihoods sequentially:
        posterior = prior × L1 × L2 × ... × Ln

    Edge cases:
        - No news → posterior = prior
        - Conflicting news → probabilities move toward neutral
    """
    # Validate prior probabilities
    total = prior_probs.get("up", 0) + prior_probs.get("down",
                                                       0) + prior_probs.get("neutral", 0)
    if abs(total - 1.0) > 0.01:
        raise ValueError(f"Prior probabilities must sum to 1.0, got {total}")

    # No news = no update
    if not news_items:
        return prior_probs.copy()

    # Start with prior probabilities
    posterior_up = prior_probs["up"]
    posterior_down = prior_probs["down"]
    posterior_neutral = prior_probs["neutral"]

    # Apply each news item's likelihood sequentially
    for news in news_items:
        sentiment = news.get("sentiment", 0.0)
        relevance = news.get("relevance", 0.0)
        category = news.get("category", "noise")

        # Calculate likelihood for this news item
        likelihood = calculate_likelihood(sentiment, relevance, category)

        # Multiply prior by likelihood (Bayes' rule numerator)
        posterior_up *= likelihood["up"]
        posterior_down *= likelihood["down"]
        posterior_neutral *= likelihood["neutral"]

        # Normalize after each update to keep values manageable
        total = posterior_up + posterior_down + posterior_neutral
        if total > 0:
            posterior_up /= total
            posterior_down /= total
            posterior_neutral /= total

    # Final normalization (should already be normalized, but ensure precision)
    total = posterior_up + posterior_down + posterior_neutral

    return {
        "up": posterior_up / total,
        "down": posterior_down / total,
        "neutral": posterior_neutral / total
    }


def get_directional_shift(prior_probs: Dict[str, float], posterior_probs: Dict[str, float]) -> Dict[str, float]:
    """
    Calculate the shift in probabilities from prior to posterior.

    Utility function to see how much news impacted each direction.

    Args:
        prior_probs: Prior probabilities
        posterior_probs: Posterior probabilities after news update

    Returns:
        Dictionary with change in probability for each direction
    """
    return {
        "up": posterior_probs["up"] - prior_probs["up"],
        "down": posterior_probs["down"] - prior_probs["down"],
        "neutral": posterior_probs["neutral"] - prior_probs["neutral"]
    }


# Example usage
if __name__ == "__main__":
    # Test case from requirements
    prior = {"up": 0.52, "down": 0.31, "neutral": 0.17}

    news_items = [
        {"sentiment": -0.62, "relevance": 0.87, "category": "company"},
        {"sentiment": -0.12, "relevance": 0.65, "category": "sector"}
    ]

    print("Prior probabilities:")
    print(f"  Up: {prior['up']:.3f}")
    print(f"  Down: {prior['down']:.3f}")
    print(f"  Neutral: {prior['neutral']:.3f}")
    print()

    posterior = bayesian_update(prior, news_items)

    print("Posterior probabilities after news:")
    print(f"  Up: {posterior['up']:.3f}")
    print(f"  Down: {posterior['down']:.3f}")
    print(f"  Neutral: {posterior['neutral']:.3f}")
    print()

    shift = get_directional_shift(prior, posterior)
    print("Probability shifts:")
    print(f"  Up: {shift['up']:+.3f}")
    print(f"  Down: {shift['down']:+.3f}")
    print(f"  Neutral: {shift['neutral']:+.3f}")
    print()

    # Verify normalization
    total = sum(posterior.values())
    print(f"Sum of posteriors: {total:.6f} (should be 1.0)")
