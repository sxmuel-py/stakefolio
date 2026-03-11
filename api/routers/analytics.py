from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from services.supabase_client import get_supabase
from models.schemas import AnalyticsResponse
from utils.calculations import (
    calculate_roi,
    calculate_variance,
    calculate_sharpe_ratio,
    calculate_win_streak,
    identify_value_bets
)
import pandas as pd

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/performance", response_model=AnalyticsResponse)
async def get_advanced_performance(
    user_id: str,
    days: Optional[int] = 30
):
    """
    Get advanced performance analytics
    
    Includes:
    - Win rate, ROI, total profit
    - Best/worst performing bet types
    - Variance and Sharpe ratio
    - Streaks analysis
    """
    supabase = get_supabase()
    
    # Calculate date range
    date_from = datetime.now() - timedelta(days=days)
    
    # Fetch bets
    response = supabase.table('bets')\        .select('*')\
        .eq('user_id', user_id)\
        .gte('placed_at', date_from.isoformat())\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="No bets found")
    
    bets = response.data
    df = pd.DataFrame(bets)
    
    # Filter settled bets
    settled = df[df['status'].isin(['won', 'lost'])]
    
    if len(settled) == 0:
        raise HTTPException(status_code=404, detail="No settled bets found")
    
    # Calculate metrics
    total_bets = len(settled)
    won_bets = len(settled[settled['status'] == 'won'])
    win_rate = (won_bets / total_bets) * 100 if total_bets > 0 else 0
    
    total_staked = settled['stake'].sum()
    total_profit = settled['profit'].fillna(0).sum()
    roi = calculate_roi(total_profit, total_staked)
    
    average_odds = settled['odds'].mean()
    
    # Best/worst bet types
    by_type = settled.groupby('bet_type')['profit'].sum()
    best_bet_type = by_type.idxmax() if len(by_type) > 0 else None
    worst_bet_type = by_type.idxmin() if len(by_type) > 0 else None
    
    return AnalyticsResponse(
        total_bets=total_bets,
        win_rate=win_rate,
        total_profit=float(total_profit),
        roi=roi,
        average_odds=float(average_odds),
        best_bet_type=best_bet_type,
        worst_bet_type=worst_bet_type
    )


@router.get("/trends")
async def get_betting_trends(
    user_id: str,
    days: int = 90
):
    """
    Analyze betting trends over time
    
    Returns:
    - Daily profit/loss
    - Win rate by day of week
    - Performance by bet type
    - Bankroll growth
    """
    supabase = get_supabase()
    
    date_from = datetime.now() - timedelta(days=days)
    
    response = supabase.table('bets')\
        .select('*')\
        .eq('user_id', user_id)\
        .gte('placed_at', date_from.isoformat())\
        .execute()
    
    if not response.data:
        return {"message": "No data available"}
    
    df = pd.DataFrame(response.data)
    df['placed_at'] = pd.to_datetime(df['placed_at'])
    df['date'] = df['placed_at'].dt.date
    df['day_of_week'] = df['placed_at'].dt.day_name()
    
    # Daily profit
    daily_profit = df.groupby('date')['profit'].sum().reset_index()
    daily_profit['cumulative'] = daily_profit['profit'].cumsum()
    
    # Win rate by day of week
    settled = df[df['status'].isin(['won', 'lost'])]
    win_rate_by_day = settled.groupby('day_of_week').apply(
        lambda x: (x['status'] == 'won').sum() / len(x) * 100
    ).to_dict()
    
    # Performance by bet type
    by_type = settled.groupby('bet_type').agg({
        'profit': 'sum',
        'stake': 'sum'
    })
    by_type['roi'] = (by_type['profit'] / by_type['stake'] * 100).fillna(0)
    
    return {
        "daily_profit": daily_profit.to_dict('records'),
        "win_rate_by_day": win_rate_by_day,
        "performance_by_type": by_type.to_dict('index'),
        "total_days": days,
        "total_bets": len(df)
    }


@router.get("/value-bets")
async def find_value_bets(
    user_id: str,
    min_edge: float = 0.05
):
    """
    Identify potential value bets based on historical performance
    
    Compares user's historical win rate for similar bets
    against bookmaker's implied probability
    """
    supabase = get_supabase()
    
    # Get historical data
    response = supabase.table('bets')\
        .select('*')\
        .eq('user_id', user_id)\
        .in_('status', ['won', 'lost'])\
        .execute()
    
    if not response.data or len(response.data) < 20:
        raise HTTPException(
            status_code=400,
            detail="Need at least 20 settled bets for analysis"
        )
    
    df = pd.DataFrame(response.data)
    
    # Calculate win rate by bet type
    win_rates = df.groupby('bet_type').apply(
        lambda x: (x['status'] == 'won').sum() / len(x)
    ).to_dict()
    
    # Get pending bets to analyze
    pending_response = supabase.table('bets')\
        .select('*')\
        .eq('user_id', user_id)\
        .eq('status', 'pending')\
        .execute()
    
    value_bets = []
    
    for bet in pending_response.data:
        bet_type = bet['bet_type']
        odds = bet['odds']
        
        if bet_type in win_rates:
            estimated_prob = win_rates[bet_type]
            analysis = identify_value_bets(estimated_prob, odds, min_edge)
            
            if analysis['is_value_bet']:
                value_bets.append({
                    "bet_id": bet['id'],
                    "description": bet['description'],
                    "odds": odds,
                    "edge": analysis['edge'],
                    "estimated_probability": analysis['estimated_probability'],
                    "implied_probability": analysis['implied_probability']
                })
    
    return {
        "value_bets": value_bets,
        "total_pending": len(pending_response.data),
        "value_count": len(value_bets)
    }


@router.get("/streaks")
async def get_streaks_analysis(user_id: str):
    """Analyze winning and losing streaks"""
    supabase = get_supabase()
    
    response = supabase.table('bets')\
        .select('*')\
        .eq('user_id', user_id)\
        .in_('status', ['won', 'lost'])\
        .order('placed_at')\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="No settled bets found")
    
    results = [bet['status'] for bet in response.data]
    streaks = calculate_win_streak(results)
    
    return streaks
