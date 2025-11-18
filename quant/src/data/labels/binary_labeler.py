"""
Binary labeling for clearer signal detection.
Focus on strong directional moves only.
"""
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class BinaryLabeler:
    """Binary classification with configurable thresholds."""
    
    def __init__(
        self,
        forward_periods: int = 10,
        threshold_pct: float = 0.02,  # 2% move threshold
        mode: str = 'strong_moves'  # 'strong_moves' or 'directional'
    ):
        """
        Initialize binary labeler.
        
        Args:
            forward_periods: How many periods ahead to look
            threshold_pct: Minimum move percentage to classify (e.g., 0.02 = 2%)
            mode: 'strong_moves' (only label strong signals) or 'directional' (label all)
        """
        self.forward_periods = forward_periods
        self.threshold_pct = threshold_pct
        self.mode = mode
    
    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply binary labeling.
        
        Args:
            df: DataFrame with OHLCV data
            
        Returns:
            DataFrame with label column added
        """
        logger.info(f"Applying binary labels (mode={self.mode}, threshold={self.threshold_pct*100}%, forward={self.forward_periods})")
        
        df = df.copy()
        
        # Calculate forward returns
        df['forward_ret'] = df['close'].shift(-self.forward_periods) / df['close'] - 1
        
        if self.mode == 'strong_moves':
            # Only label strong moves, ignore weak moves
            # UP (1) if return > +threshold
            # DOWN (-1) if return < -threshold
            # No label (NaN) if |return| < threshold
            df['label'] = np.nan
            df.loc[df['forward_ret'] > self.threshold_pct, 'label'] = 1.0
            df.loc[df['forward_ret'] < -self.threshold_pct, 'label'] = -1.0
            
        elif self.mode == 'directional':
            # Label everything as UP or DOWN based on direction
            # UP (1) if return > 0
            # DOWN (-1) if return <= 0
            df['label'] = np.where(df['forward_ret'] > 0, 1.0, -1.0)
        
        else:
            raise ValueError(f"Unknown mode: {self.mode}")
        
        # Store actual return for analysis
        df['return_at_label'] = df['forward_ret']
        
        # Mark last N rows as NaN (no forward data)
        df.loc[df.index[-self.forward_periods:], 'label'] = np.nan
        df.loc[df.index[-self.forward_periods:], 'return_at_label'] = np.nan
        
        # Summary
        label_counts = df['label'].value_counts().sort_index()
        total_labeled = label_counts.sum()
        total_samples = len(df) - self.forward_periods
        
        logger.info(f"Labels: DOWN={label_counts.get(-1.0, 0)}, UP={label_counts.get(1.0, 0)}")
        logger.info(f"Labeled: {total_labeled}/{total_samples} ({total_labeled/total_samples*100:.1f}%)")
        
        # Log return statistics for labeled samples
        labeled_returns = df[df['label'].notna()]['forward_ret']
        logger.info(f"Forward return stats: mean={labeled_returns.mean():.4f}, std={labeled_returns.std():.4f}")
        
        return df
