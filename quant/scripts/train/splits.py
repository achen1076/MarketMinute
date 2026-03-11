"""Time-series splitting with embargo and purging."""

import numpy as np

from .config import FORWARD_PERIODS


def time_split_with_embargo(X, y, forward_returns, embargo_periods=None):
    """
    Time-series split with embargo gap to prevent label leakage.

    The embargo drops samples at split boundaries where labels would
    "look into" the next period's data.

    Args:
        X: Features DataFrame
        y: Labels
        forward_returns: Forward returns array
        embargo_periods: Gap size (defaults to FORWARD_PERIODS)

    Returns:
        X_train, X_val, X_test, y_train, y_val, y_test, fwd_ret_train, fwd_ret_val, fwd_ret_test
    """
    if embargo_periods is None:
        embargo_periods = FORWARD_PERIODS

    n = len(X)

    # Split points: 64% train, 16% val, 20% test
    train_end = int(n * 0.64)
    val_end = int(n * 0.80)

    # Apply embargo: drop last `embargo_periods` from train before val starts
    # and drop last `embargo_periods` from val before test starts
    train_end_clean = train_end - embargo_periods
    val_start = train_end
    val_end_clean = val_end - embargo_periods
    test_start = val_end

    X_train = X.iloc[:train_end_clean]
    y_train = y.iloc[:train_end_clean]
    fwd_ret_train = forward_returns[:train_end_clean]

    X_val = X.iloc[val_start:val_end_clean]
    y_val = y.iloc[val_start:val_end_clean]
    fwd_ret_val = forward_returns[val_start:val_end_clean]

    X_test = X.iloc[test_start:]
    y_test = y.iloc[test_start:]
    fwd_ret_test = forward_returns[test_start:]

    return X_train, X_val, X_test, y_train, y_val, y_test, fwd_ret_train, fwd_ret_val, fwd_ret_test


def walk_forward_split(X, y, forward_returns, n_splits=5, min_train_size=0.4, embargo_periods=None):
    """
    Walk-forward validation with expanding training window and purging.

    Each fold:
    - Training: All data from start up to fold boundary (minus embargo)
    - Purging: Remove training samples whose forward return window overlaps
      with the test period (de Prado-style purged cross-validation)
    - Test: Next chunk of data

    This simulates realistic model retraining over time.

    Args:
        X: Features DataFrame
        y: Labels Series
        forward_returns: Forward returns array
        n_splits: Number of test folds
        min_train_size: Minimum fraction of data for first training set
        embargo_periods: Gap between train and test (default: FORWARD_PERIODS * 2)

    Yields:
        (X_train, X_test, y_train, y_test, fwd_ret_train, fwd_ret_test, fold_info)
    """
    if embargo_periods is None:
        embargo_periods = FORWARD_PERIODS * 2

    n = len(X)
    min_train_idx = int(n * min_train_size)

    # Divide remaining data into n_splits test chunks
    test_chunk_size = (n - min_train_idx) // n_splits

    for fold in range(n_splits):
        # Test window for this fold
        test_start = min_train_idx + (fold * test_chunk_size)
        test_end = test_start + test_chunk_size if fold < n_splits - 1 else n

        # Purge + embargo: remove training samples whose forward return
        # window overlaps with test period. A sample at index i has a
        # forward window of [i, i + FORWARD_PERIODS]. To prevent leakage,
        # drop any training sample where i + FORWARD_PERIODS >= test_start.
        purge_cutoff = test_start - FORWARD_PERIODS - embargo_periods

        if purge_cutoff <= 0:
            continue

        X_train = X.iloc[:purge_cutoff]
        y_train = y.iloc[:purge_cutoff]
        fwd_ret_train = forward_returns[:purge_cutoff]

        X_test = X.iloc[test_start:test_end]
        y_test = y.iloc[test_start:test_end]
        fwd_ret_test = forward_returns[test_start:test_end]

        fold_info = {
            "fold": fold + 1,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "train_end_idx": purge_cutoff,
            "test_start_idx": test_start,
            "embargo_gap": embargo_periods,
            "purge_gap": FORWARD_PERIODS
        }

        yield X_train, X_test, y_train, y_test, fwd_ret_train, fwd_ret_test, fold_info
