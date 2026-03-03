import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta


def calculate_kelly_criterion(
    win_probability: float,
    odds: float,
    bankroll: float
) -> float:
    """
    Calculate optimal bet size using Kelly Criterion
    
    Kelly % = (bp - q) / b
    where:
    - b = odds - 1 (decimal odds minus 1)
    - p = probability of winning
    - q = probability of losing (1 - p)
    """
    if win_probability <= 0 or win_probability >= 1:
        return 0.0
    
    b = odds - 1
    p = win_probability
    q = 1 - p
    
    kelly_percentage = (b * p - q) / b
    
    # Never bet more than 25% of bankroll (fractional Kelly)
    kelly_percentage = max(0, min(kelly_percentage, 0.25))
    
    return bankroll * kelly_percentage


def calculate_expected_value(
    stake: float,
    odds: float,
    win_probability: float
) -> float:
    """Calculate expected value of a bet"""
    win_amount = stake * odds
    loss_amount = stake
    
    ev = (win_probability * win_amount) - ((1 - win_probability) * loss_amount)
    return ev


def calculate_roi(
    total_profit: float,
    total_staked: float
) -> float:
    """Calculate Return on Investment percentage"""
    if total_staked == 0:
        return 0.0
    return (total_profit / total_staked) * 100


def calculate_variance(profits: List[float]) -> float:
    """Calculate variance of profits"""
    if not profits:
        return 0.0
    return float(np.var(profits))


def calculate_sharpe_ratio(
    profits: List[float],
    risk_free_rate: float = 0.0
) -> float:
    """
    Calculate Sharpe ratio for betting performance
    Higher is better (risk-adjusted returns)
    """
    if not profits or len(profits) < 2:
        return 0.0
    
    mean_return = np.mean(profits)
    std_return = np.std(profits)
    
    if std_return == 0:
        return 0.0
    
    return (mean_return - risk_free_rate) / std_return


def identify_value_bets(
    estimated_probability: float,
    bookmaker_odds: float,
    threshold: float = 0.05
) -> Dict:
    """
    Identify if a bet has positive expected value
    
    Returns dict with:
    - is_value_bet: bool
    - edge: float (percentage edge over bookmaker)
    - implied_probability: float (bookmaker's implied probability)
    """
    implied_prob = 1 / bookmaker_odds
    edge = estimated_probability - implied_prob
    
    return {
        "is_value_bet": edge > threshold,
        "edge": edge * 100,  # Convert to percentage
        "implied_probability": implied_prob,
        "estimated_probability": estimated_probability
    }


def calculate_win_streak(results: List[str]) -> Dict:
    """
    Calculate current and best win/loss streaks
    
    Args:
        results: List of bet results ('won', 'lost', 'void')
    
    Returns:
        Dict with current_streak, best_win_streak, worst_loss_streak
    """
    if not results:
        return {
            "current_streak": 0,
            "best_win_streak": 0,
            "worst_loss_streak": 0
        }
    
    current_streak = 0
    best_win_streak = 0
    worst_loss_streak = 0
    temp_streak = 0
    
    for i, result in enumerate(results):
        if result == 'won':
            if i == 0 or results[i-1] == 'won':
                temp_streak += 1
            else:
                temp_streak = 1
            best_win_streak = max(best_win_streak, temp_streak)
            if i == len(results) - 1:
                current_streak = temp_streak
        elif result == 'lost':
            if i == 0 or results[i-1] == 'lost':
                temp_streak -= 1
            else:
                temp_streak = -1
            worst_loss_streak = min(worst_loss_streak, temp_streak)
            if i == len(results) - 1:
                current_streak = temp_streak
        else:  # void
            temp_streak = 0
    
    return {
        "current_streak": current_streak,
        "best_win_streak": best_win_streak,
        "worst_loss_streak": abs(worst_loss_streak)
    }
