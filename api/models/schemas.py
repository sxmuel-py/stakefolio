from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BetData(BaseModel):
    """Bet data model"""
    id: str
    user_id: str
    bookie_id: str
    description: str
    bet_type: str
    stake: float
    odds: float
    status: str
    profit: Optional[float] = None
    placed_at: datetime
    settled_at: Optional[datetime] = None


class AnalyticsResponse(BaseModel):
    """Analytics response model"""
    total_bets: int
    win_rate: float
    total_profit: float
    roi: float
    average_odds: float
    best_bet_type: Optional[str] = None
    worst_bet_type: Optional[str] = None


class PredictionRequest(BaseModel):
    """Prediction request model"""
    stake: float = Field(..., gt=0, description="Bet stake amount")
    odds: float = Field(..., gt=1.0, description="Bet odds")
    bet_type: str = Field(..., description="Type of bet (single, accumulator, etc.)")
    bookie_id: str = Field(..., description="Bookie ID")
    historical_win_rate: Optional[float] = Field(None, ge=0, le=1)


class PredictionResponse(BaseModel):
    """Prediction response model"""
    predicted_outcome: str  # 'win', 'loss', 'uncertain'
    confidence: float = Field(..., ge=0, le=1)
    expected_value: float
    recommended_stake: Optional[float] = None
    kelly_criterion: Optional[float] = None


class OddsComparison(BaseModel):
    """Odds comparison model"""
    event_id: str
    event_name: str
    bookies: List[dict]  # List of {bookie_name, odds, margin}
    best_odds: float
    best_bookie: str
    arbitrage_opportunity: bool = False


class ReportRequest(BaseModel):
    """Report generation request"""
    report_type: str = Field(..., description="Type of report (pdf, excel)")
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    include_charts: bool = True
    bookie_ids: Optional[List[str]] = None


class ReportResponse(BaseModel):
    """Report generation response"""
    report_id: str
    download_url: str
    expires_at: datetime
