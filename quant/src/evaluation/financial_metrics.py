"""
financial_metrics.py
---------------------------------------------------------------------
Financial evaluation layer for trading model assessment.

Computes realistic trading metrics beyond classification accuracy:
    - Sharpe Ratio (risk-adjusted returns)
    - Max Drawdown (worst peak-to-trough decline)
    - Profit Factor (gross profit / gross loss)
    - Win Rate and Average Win/Loss
    - Calmar Ratio (return / max drawdown)
    - Simulated PnL with transaction costs

Usage:
    evaluator = FinancialMetrics(transaction_cost_bps=10)
    metrics = evaluator.evaluate(y_true, y_pred, returns)
"""

import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class TradingMetrics:
    """Container for all trading performance metrics"""
    accuracy: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    calmar_ratio: float
    profit_factor: float
    win_rate: float
    avg_win: float
    avg_loss: float
    total_return: float
    annualized_return: float
    num_trades: int
    avg_holding_period: float
    alpha: float = 0.0
    benchmark_sharpe: float = 0.0
    long_ratio: float = 0.0
    balanced_accuracy: float = 0.0
    hit_rate: float = 0.0
    sharpe_tstat: float = 0.0

    def to_dict(self) -> Dict:
        return {
            'accuracy': self.accuracy,
            'balanced_accuracy': self.balanced_accuracy,
            'hit_rate': self.hit_rate,
            'sharpe_tstat': self.sharpe_tstat,
            'sharpe_ratio': self.sharpe_ratio,
            'sortino_ratio': self.sortino_ratio,
            'max_drawdown': self.max_drawdown,
            'calmar_ratio': self.calmar_ratio,
            'profit_factor': self.profit_factor,
            'win_rate': self.win_rate,
            'avg_win': self.avg_win,
            'avg_loss': self.avg_loss,
            'total_return': self.total_return,
            'annualized_return': self.annualized_return,
            'num_trades': self.num_trades,
            'avg_holding_period': self.avg_holding_period,
            'alpha': self.alpha,
            'benchmark_sharpe': self.benchmark_sharpe,
            'long_ratio': self.long_ratio
        }

    def summary(self) -> str:
        return (
            f"Sharpe: {self.sharpe_ratio:.2f} | "
            f"MaxDD: {self.max_drawdown*100:.1f}% | "
            f"WinRate: {self.win_rate*100:.1f}% | "
            f"PF: {self.profit_factor:.2f} | "
            f"Return: {self.total_return*100:.1f}% | "
            f"α: {self.alpha:.2f}"
        )


class FinancialMetrics:
    """
    Financial evaluation layer for trading models.

    Simulates trading based on model predictions and computes
    realistic performance metrics including transaction costs.
    """

    def __init__(
        self,
        transaction_cost_bps: float = 10.0,
        risk_free_rate: float = 0.05,
        trading_days_per_year: int = 252,
        position_sizing: str = "equal"
    ):
        """
        Initialize financial metrics evaluator.

        Args:
            transaction_cost_bps: Round-trip transaction cost in basis points
            risk_free_rate: Annual risk-free rate for Sharpe calculation
            trading_days_per_year: Trading days per year (252 for stocks)
            position_sizing: "equal" for equal-weight, "kelly" for Kelly criterion
        """
        self.transaction_cost = transaction_cost_bps / 10000
        self.risk_free_rate = risk_free_rate
        self.trading_days = trading_days_per_year
        self.position_sizing = position_sizing

    def evaluate(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        forward_returns: np.ndarray,
        holding_period: int = 1
    ) -> TradingMetrics:
        """
        Evaluate model predictions using financial metrics.

        Args:
            y_true: Actual labels (-1, 0, 1)
            y_pred: Predicted labels (-1, 0, 1)
            forward_returns: Actual forward returns for each period
            holding_period: Average holding period in days

        Returns:
            TradingMetrics object with all computed metrics
        """
        y_true = np.array(y_true).flatten()
        y_pred = np.array(y_pred).flatten()
        forward_returns = np.array(forward_returns).flatten()

        # Classification accuracy
        accuracy = np.mean(y_true == y_pred)

        # Balanced accuracy: mean per-class recall. Honest under class
        # imbalance, where plain accuracy is dominated by the neutral class.
        classes = np.unique(y_true)
        recalls = [np.mean(y_pred[y_true == c] == c)
                   for c in classes if np.sum(y_true == c) > 0]
        balanced_accuracy = float(np.mean(recalls)) if recalls else 0.0

        # Directional hit rate: among bars where the model trades, how often
        # the sign of the realized forward return matches the position
        # (pre-cost, the rawest measure of predictive edge).
        signal_mask = y_pred != 0
        if np.sum(signal_mask) > 0:
            fwd_clean = np.nan_to_num(forward_returns, nan=0.0)
            hit_rate = float(np.mean(
                np.sign(fwd_clean[signal_mask]) == y_pred[signal_mask]))
        else:
            hit_rate = 0.0

        # Simulate trading returns
        strategy_returns, trade_returns = self._simulate_trading(
            y_pred, forward_returns, holding_period
        )

        # Store holding period for annualization
        self._holding_period = holding_period

        # Risk-adjusted metrics on TRADE-LEVEL returns only (no idle-bar dilution)
        sharpe = self._sharpe_ratio(trade_returns, holding_period)
        sortino = self._sortino_ratio(trade_returns, holding_period)

        # Equity-curve metrics on full series
        max_dd = self._max_drawdown(strategy_returns)
        calmar = self._calmar_ratio(trade_returns, max_dd, holding_period)

        # Trade-level metrics (same cooldown-filtered trades)
        pf, win_rate, avg_win, avg_loss = self._trade_metrics(trade_returns)

        # Return metrics
        total_ret = self._total_return(trade_returns)
        annual_ret = self._annualized_return(trade_returns, holding_period)

        # Count actual trades (after cooldown)
        num_trades = len(trade_returns)

        # Sharpe t-statistic: how distinguishable from zero the per-trade
        # edge is given the sample size. |t| > 2 ≈ statistically meaningful.
        clean_trades = trade_returns[~np.isnan(
            trade_returns) & ~np.isinf(trade_returns)]
        if len(clean_trades) >= 2 and np.std(clean_trades, ddof=1) > 1e-12:
            sharpe_tstat = float(np.clip(
                np.mean(clean_trades) / np.std(clean_trades, ddof=1)
                * np.sqrt(len(clean_trades)), -50, 50))
        else:
            sharpe_tstat = 0.0

        # Benchmark: buy-and-hold (always long) on same bar-level series
        benchmark_returns = np.nan_to_num(
            forward_returns, nan=0.0, posinf=0.0, neginf=0.0)
        benchmark_comparison = self.compare_to_benchmark(
            strategy_returns, benchmark_returns)
        alpha = benchmark_comparison['alpha']
        benchmark_sharpe = benchmark_comparison['benchmark_sharpe']

        # Long/short ratio of actual traded positions
        long_count = np.sum(y_pred == 1)
        short_count = np.sum(y_pred == -1)
        total_signals = long_count + short_count
        long_ratio = float(
            long_count / total_signals) if total_signals > 0 else 0.0

        return TradingMetrics(
            accuracy=accuracy,
            sharpe_ratio=sharpe,
            sortino_ratio=sortino,
            max_drawdown=max_dd,
            calmar_ratio=calmar,
            profit_factor=pf,
            win_rate=win_rate,
            avg_win=avg_win,
            avg_loss=avg_loss,
            total_return=total_ret,
            annualized_return=annual_ret,
            num_trades=num_trades,
            avg_holding_period=holding_period,
            alpha=alpha,
            benchmark_sharpe=benchmark_sharpe,
            long_ratio=long_ratio,
            balanced_accuracy=balanced_accuracy,
            hit_rate=hit_rate,
            sharpe_tstat=sharpe_tstat
        )

    def _simulate_trading(
        self,
        predictions: np.ndarray,
        forward_returns: np.ndarray,
        holding_period: int
    ) -> np.ndarray:
        """
        Simulate trading based on predictions with position overlap handling.

        For multi-day holding periods, new signals during an active hold are
        ignored to prevent double-counting overlapping positions. Each trade
        locks out new entries for `holding_period` bars.

        Position:
            +1 prediction -> Long (benefit from positive returns)
            -1 prediction -> Short (benefit from negative returns)
             0 prediction -> No position (zero return)
        """
        # Handle NaN/inf in forward returns
        forward_returns = np.nan_to_num(
            forward_returns, nan=0.0, posinf=0.0, neginf=0.0)

        n = len(predictions)
        positions = np.zeros(n)
        cooldown_until = 0

        for i in range(n):
            if i >= cooldown_until and predictions[i] != 0:
                positions[i] = 1.0 if predictions[i] == 1 else -1.0
                cooldown_until = i + holding_period
            # else: positions[i] stays 0 (in cooldown or neutral prediction)

        gross_returns = positions * forward_returns

        # Apply transaction costs on position changes
        position_changes = np.abs(np.diff(positions, prepend=0))
        costs = position_changes * self.transaction_cost

        strategy_returns = gross_returns - costs

        # Extract trade-level returns (only bars where a trade was entered)
        trade_mask = positions != 0
        trade_returns = strategy_returns[trade_mask]

        return strategy_returns, trade_returns

    def _sharpe_ratio(self, returns: np.ndarray, holding_period: int = None) -> float:
        """Calculate annualized Sharpe ratio, scaled by holding period."""
        # Filter out NaN/inf values
        returns = returns[~np.isnan(returns) & ~np.isinf(returns)]

        if len(returns) < 2:
            return 0.0

        hp = holding_period or getattr(self, '_holding_period', 1)
        periods_per_year = self.trading_days / hp
        rf_per_period = self.risk_free_rate / periods_per_year

        excess_returns = returns - rf_per_period

        mean_excess = np.mean(excess_returns)
        std_excess = np.std(excess_returns, ddof=1)

        # Use minimum threshold to avoid division by near-zero
        if std_excess < 1e-8 or np.isnan(std_excess):
            return 0.0

        period_sharpe = mean_excess / std_excess
        annual_sharpe = period_sharpe * np.sqrt(periods_per_year)

        # Clip to reasonable range
        return float(np.clip(annual_sharpe, -10, 10))

    def _sortino_ratio(self, returns: np.ndarray, holding_period: int = None) -> float:
        """Calculate Sortino ratio (downside deviation only), scaled by holding period."""
        # Filter out NaN/inf values
        returns = returns[~np.isnan(returns) & ~np.isinf(returns)]

        if len(returns) < 2:
            return 0.0

        hp = holding_period or getattr(self, '_holding_period', 1)
        periods_per_year = self.trading_days / hp
        rf_per_period = self.risk_free_rate / periods_per_year

        excess_returns = returns - rf_per_period
        mean_excess = np.mean(excess_returns)

        # Downside deviation
        downside_returns = excess_returns[excess_returns < 0]
        if len(downside_returns) == 0:
            # No downside observations: cap at the clip ceiling (keeps JSON-safe)
            return 10.0 if mean_excess > 0 else 0.0

        downside_std = np.std(downside_returns, ddof=1)

        if downside_std == 0 or np.isnan(downside_std):
            return 0.0

        period_sortino = mean_excess / downside_std
        annual_sortino = period_sortino * np.sqrt(periods_per_year)

        # Clip to reasonable range
        return float(np.clip(annual_sortino, -10, 10))

    def _max_drawdown(self, returns: np.ndarray) -> float:
        """Calculate maximum drawdown"""
        # Filter out NaN/inf values
        returns = returns[~np.isnan(returns) & ~np.isinf(returns)]

        if len(returns) < 2:
            return 0.0

        # Cumulative returns
        cumulative = np.cumprod(1 + returns)

        # Handle edge cases
        if np.any(cumulative <= 0) or np.any(np.isnan(cumulative)):
            return 0.0

        # Running maximum
        running_max = np.maximum.accumulate(cumulative)

        # Drawdown series
        drawdown = (cumulative - running_max) / running_max

        max_dd = np.min(drawdown)

        # Clip to reasonable range (0 to 1)
        return float(np.clip(abs(max_dd), 0, 1))

    def _calmar_ratio(self, returns: np.ndarray, max_dd: float, holding_period: int = 1) -> float:
        """Calculate Calmar ratio (annual return / max drawdown)"""
        if max_dd == 0 or np.isnan(max_dd):
            return 0.0

        annual_ret = self._annualized_return(returns, holding_period)

        return float(annual_ret / max_dd) if max_dd > 0 else 0.0

    def _trade_metrics(
        self,
        trade_returns: np.ndarray
    ) -> Tuple[float, float, float, float]:
        """
        Calculate trade-level metrics from cooldown-filtered trade returns.

        Args:
            trade_returns: Returns from actual trades (already filtered by cooldown,
                           with transaction costs applied)

        Returns:
            (profit_factor, win_rate, avg_win, avg_loss)
        """
        if len(trade_returns) == 0:
            return 0.0, 0.0, 0.0, 0.0

        wins = trade_returns[trade_returns > 0]
        losses = trade_returns[trade_returns < 0]

        # Win rate
        win_rate = len(wins) / \
            len(trade_returns) if len(trade_returns) > 0 else 0.0

        # Average win/loss
        avg_win = np.mean(wins) if len(wins) > 0 else 0.0
        avg_loss = np.mean(np.abs(losses)) if len(losses) > 0 else 0.0

        # Profit factor = gross profit / gross loss
        gross_profit = np.sum(wins) if len(wins) > 0 else 0.0
        gross_loss = np.sum(np.abs(losses)) if len(losses) > 0 else 0.0

        profit_factor = gross_profit / gross_loss if gross_loss > 0 else (
            10.0 if gross_profit > 0 else 0.0)
        profit_factor = min(profit_factor, 10.0)

        return float(profit_factor), float(win_rate), float(avg_win), float(avg_loss)

    def _total_return(self, returns: np.ndarray) -> float:
        """Calculate total cumulative return"""
        if len(returns) == 0:
            return 0.0
        return float(np.prod(1 + returns) - 1)

    def _annualized_return(self, returns: np.ndarray, holding_period: int = 1) -> float:
        """Calculate annualized return.

        Args:
            returns: Return series (bar-level or trade-level).
            holding_period: Days per return entry. For trade-level returns,
                each entry spans holding_period trading days.
        """
        if len(returns) < 2:
            return 0.0

        total_ret = self._total_return(returns)
        # Each return entry spans holding_period trading days
        n_years = len(returns) * holding_period / self.trading_days

        if n_years <= 0:
            return 0.0

        if total_ret <= -1:
            return -1.0  # wiped out; fractional power of a negative base is complex
        annual_ret = (1 + total_ret) ** (1 / n_years) - 1

        return float(annual_ret)

    def compare_to_benchmark(
        self,
        strategy_returns: np.ndarray,
        benchmark_returns: np.ndarray
    ) -> Dict:
        """
        Compare strategy performance to benchmark (e.g., buy & hold).

        Returns:
            Dictionary with alpha, beta, information ratio, etc.
        """
        if len(strategy_returns) != len(benchmark_returns):
            raise ValueError("Strategy and benchmark must have same length")

        _zero = {'alpha': 0.0, 'beta': 0.0, 'information_ratio': 0.0,
                 'tracking_error': 0.0, 'strategy_sharpe': 0.0, 'benchmark_sharpe': 0.0}

        # Guard: need at least 2 non-constant observations
        if (len(strategy_returns) < 2 or
                np.std(strategy_returns) < 1e-12 or
                np.std(benchmark_returns) < 1e-12):
            _zero['benchmark_sharpe'] = self._sharpe_ratio(benchmark_returns)
            return _zero

        # Alpha and Beta via linear regression
        cov_matrix = np.cov(strategy_returns, benchmark_returns)

        # Guard against complex or NaN from numerical instability
        if np.any(np.isnan(cov_matrix)) or np.any(np.iscomplex(cov_matrix)):
            _zero['benchmark_sharpe'] = self._sharpe_ratio(benchmark_returns)
            return _zero

        beta = cov_matrix[0, 1] / cov_matrix[1,
                                             1] if cov_matrix[1, 1] != 0 else 0

        alpha_daily = np.mean(strategy_returns) - beta * \
            np.mean(benchmark_returns)
        alpha_annual = alpha_daily * self.trading_days

        # Information ratio
        tracking_error = np.std(strategy_returns - benchmark_returns)
        info_ratio = (np.mean(strategy_returns - benchmark_returns) / tracking_error
                      if tracking_error > 0 else 0)
        info_ratio_annual = info_ratio * np.sqrt(self.trading_days)

        return {
            'alpha': float(np.real(alpha_annual)),
            'beta': float(np.real(beta)),
            'information_ratio': float(np.real(info_ratio_annual)),
            'tracking_error': float(np.real(tracking_error * np.sqrt(self.trading_days))),
            'strategy_sharpe': self._sharpe_ratio(strategy_returns),
            'benchmark_sharpe': self._sharpe_ratio(benchmark_returns)
        }
