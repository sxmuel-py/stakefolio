import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from typing import Dict, List, Tuple
import joblib
from pathlib import Path


class BettingPredictor:
    """Machine learning model for betting outcome predictions"""
    
    def __init__(self, model_path: str = None):
        self.outcome_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.profit_model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.model_path = model_path
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
    
    def prepare_features(self, bets_data: List[Dict]) -> pd.DataFrame:
        """
        Prepare features from bet data
        
        Features:
        - stake
        - odds
        - bet_type (encoded)
        - bookie_id (encoded)
        - day_of_week
        - hour_of_day
        - historical_win_rate (for user)
        - average_odds (for user)
        """
        df = pd.DataFrame(bets_data)
        
        # Encode categorical variables
        df['bet_type_encoded'] = self.label_encoder.fit_transform(df['bet_type'])
        df['bookie_encoded'] = self.label_encoder.fit_transform(df['bookie_id'])
        
        # Time-based features
        df['placed_at'] = pd.to_datetime(df['placed_at'])
        df['day_of_week'] = df['placed_at'].dt.dayofweek
        df['hour'] = df['placed_at'].dt.hour
        
        # Select features
        features = [
            'stake', 'odds', 'bet_type_encoded', 'bookie_encoded',
            'day_of_week', 'hour'
        ]
        
        return df[features]
    
    def train(self, bets_data: List[Dict]) -> Dict:
        """
        Train the prediction models
        
        Returns training metrics
        """
        if len(bets_data) < 50:
            return {
                "success": False,
                "message": "Need at least 50 bets to train model"
            }
        
        df = pd.DataFrame(bets_data)
        
        # Filter only settled bets
        df = df[df['status'].isin(['won', 'lost'])]
        
        if len(df) < 50:
            return {
                "success": False,
                "message": "Need at least 50 settled bets"
            }
        
        # Prepare features
        X = self.prepare_features(bets_data)
        
        # Outcome prediction (win/loss)
        y_outcome = (df['status'] == 'won').astype(int)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_outcome, test_size=0.2, random_state=42
        )
        
        self.outcome_model.fit(X_train, y_train)
        outcome_score = self.outcome_model.score(X_test, y_test)
        
        # Profit prediction
        y_profit = df['profit'].fillna(0)
        self.profit_model.fit(X_train, y_profit.iloc[X_train.index])
        profit_score = self.profit_model.score(
            X_test, y_profit.iloc[X_test.index]
        )
        
        self.is_trained = True
        
        # Save model
        if self.model_path:
            self.save_model(self.model_path)
        
        return {
            "success": True,
            "outcome_accuracy": float(outcome_score),
            "profit_r2_score": float(profit_score),
            "training_samples": len(df)
        }
    
    def predict_outcome(
        self,
        stake: float,
        odds: float,
        bet_type: str,
        bookie_id: str
    ) -> Dict:
        """
        Predict bet outcome and expected profit
        
        Returns:
        - predicted_outcome: 'win' or 'loss'
        - win_probability: float (0-1)
        - confidence: float (0-1)
        - expected_profit: float
        """
        if not self.is_trained:
            return {
                "error": "Model not trained yet",
                "predicted_outcome": "uncertain",
                "win_probability": 0.5,
                "confidence": 0.0
            }
        
        # Prepare single prediction
        features = pd.DataFrame([{
            'stake': stake,
            'odds': odds,
            'bet_type': bet_type,
            'bookie_id': bookie_id,
            'day_of_week': pd.Timestamp.now().dayofweek,
            'hour': pd.Timestamp.now().hour
        }])
        
        X = self.prepare_features([{
            'stake': stake,
            'odds': odds,
            'bet_type': bet_type,
            'bookie_id': bookie_id,
            'placed_at': pd.Timestamp.now()
        }])
        
        # Predict outcome
        win_prob = self.outcome_model.predict_proba(X)[0][1]
        predicted_outcome = 'win' if win_prob > 0.5 else 'loss'
        
        # Predict profit
        expected_profit = self.profit_model.predict(X)[0]
        
        # Calculate confidence (distance from 0.5)
        confidence = abs(win_prob - 0.5) * 2
        
        return {
            "predicted_outcome": predicted_outcome,
            "win_probability": float(win_prob),
            "confidence": float(confidence),
            "expected_profit": float(expected_profit)
        }
    
    def save_model(self, path: str):
        """Save trained model to disk"""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            'outcome_model': self.outcome_model,
            'profit_model': self.profit_model,
            'label_encoder': self.label_encoder,
            'is_trained': self.is_trained
        }, path)
    
    def load_model(self, path: str):
        """Load trained model from disk"""
        data = joblib.load(path)
        self.outcome_model = data['outcome_model']
        self.profit_model = data['profit_model']
        self.label_encoder = data['label_encoder']
        self.is_trained = data['is_trained']


# Global predictor instance
predictor = BettingPredictor()
