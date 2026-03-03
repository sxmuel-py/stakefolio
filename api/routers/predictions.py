from fastapi import APIRouter, HTTPException
from models.schemas import PredictionRequest, PredictionResponse
from services.ml_service import predictor
from services.supabase_client import get_supabase
from utils.calculations import calculate_kelly_criterion, calculate_expected_value

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.post("/outcome", response_model=PredictionResponse)
async def predict_bet_outcome(request: PredictionRequest, user_id: str):
    """
    Predict bet outcome using ML model
    
    Returns:
    - Predicted outcome (win/loss)
    - Win probability
    - Confidence score
    - Expected value
    - Recommended stake (Kelly Criterion)
    """
    # Get prediction from ML model
    prediction = predictor.predict_outcome(
        stake=request.stake,
        odds=request.odds,
        bet_type=request.bet_type,
        bookie_id=request.bookie_id
    )
    
    if "error" in prediction:
        raise HTTPException(status_code=400, detail=prediction["error"])
    
    win_probability = prediction['win_probability']
    
    # Calculate expected value
    ev = calculate_expected_value(
        stake=request.stake,
        odds=request.odds,
        win_probability=win_probability
    )
    
    # Get user's bankroll for Kelly Criterion
    supabase = get_supabase()
    bankroll_response = supabase.table('bankroll_transactions')\
        .select('balance_after')\
        .eq('user_id', user_id)\
        .order('created_at', desc=True)\
        .limit(1)\
        .execute()
    
    bankroll = 1000.0  # Default
    if bankroll_response.data:
        bankroll = float(bankroll_response.data[0]['balance_after'])
    
    # Calculate Kelly Criterion stake
    kelly_stake = calculate_kelly_criterion(
        win_probability=win_probability,
        odds=request.odds,
        bankroll=bankroll
    )
    
    return PredictionResponse(
        predicted_outcome=prediction['predicted_outcome'],
        confidence=prediction['confidence'],
        expected_value=ev,
        recommended_stake=kelly_stake if kelly_stake > 0 else None,
        kelly_criterion=kelly_stake / bankroll if bankroll > 0 else None
    )


@router.post("/train")
async def train_model(user_id: str):
    """
    Train the ML model with user's historical bet data
    
    Requires at least 50 settled bets
    """
    supabase = get_supabase()
    
    # Fetch all settled bets
    response = supabase.table('bets')\
        .select('*')\
        .eq('user_id', user_id)\
        .in_('status', ['won', 'lost'])\
        .execute()
    
    if not response.data:
        raise HTTPException(
            status_code=400,
            detail="No settled bets found for training"
        )
    
    # Train the model
    result = predictor.train(response.data)
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    
    return {
        "message": "Model trained successfully",
        "metrics": {
            "outcome_accuracy": result['outcome_accuracy'],
            "profit_r2_score": result['profit_r2_score'],
            "training_samples": result['training_samples']
        }
    }


@router.get("/model-status")
async def get_model_status():
    """Check if ML model is trained and ready"""
    return {
        "is_trained": predictor.is_trained,
        "model_path": predictor.model_path
    }


@router.post("/optimal-stake")
async def calculate_optimal_stake(
    win_probability: float,
    odds: float,
    user_id: str
):
    """
    Calculate optimal stake using Kelly Criterion
    
    Args:
    - win_probability: Your estimated probability of winning (0-1)
    - odds: Decimal odds
    - user_id: For fetching current bankroll
    """
    if not (0 < win_probability < 1):
        raise HTTPException(
            status_code=400,
            detail="Win probability must be between 0 and 1"
        )
    
    if odds <= 1.0:
        raise HTTPException(
            status_code=400,
            detail="Odds must be greater than 1.0"
        )
    
    # Get user's bankroll
    supabase = get_supabase()
    response = supabase.table('bookies')\
        .select('current_balance')\
        .eq('user_id', user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="No bookies found")
    
    total_bankroll = sum(float(b['current_balance']) for b in response.data)
    
    # Calculate Kelly stake
    kelly_stake = calculate_kelly_criterion(
        win_probability=win_probability,
        odds=odds,
        bankroll=total_bankroll
    )
    
    kelly_percentage = (kelly_stake / total_bankroll * 100) if total_bankroll > 0 else 0
    
    # Calculate expected value
    ev = calculate_expected_value(
        stake=kelly_stake,
        odds=odds,
        win_probability=win_probability
    )
    
    return {
        "optimal_stake": kelly_stake,
        "kelly_percentage": kelly_percentage,
        "total_bankroll": total_bankroll,
        "expected_value": ev,
        "recommendation": "Bet" if kelly_stake > 0 else "Skip - No edge"
    }
