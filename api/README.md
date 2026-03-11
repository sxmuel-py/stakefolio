# FastAPI Backend for Betting Management

Professional FastAPI backend providing advanced analytics, ML predictions, and betting insights.

## Features

- 🤖 **ML Predictions** - Random Forest & Gradient Boosting models
- 📊 **Advanced Analytics** - Performance metrics, trends, value bets
- 💰 **Kelly Criterion** - Optimal stake calculator
- 📈 **Trend Analysis** - Win rate by day, bet type performance
- 🎯 **Value Bet Finder** - Identify positive EV opportunities
- 🔥 **Streak Tracking** - Win/loss streak analysis

## Quick Start

### 1. Install Dependencies

```bash
cd api
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Run the Server

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Endpoints

### Analytics

```
GET /api/analytics/performance?user_id={id}&days=30
GET /api/analytics/trends?user_id={id}&days=90
GET /api/analytics/value-bets?user_id={id}&min_edge=0.05
GET /api/analytics/streaks?user_id={id}
```

### Predictions

```
POST /api/predictions/outcome
POST /api/predictions/train?user_id={id}
POST /api/predictions/optimal-stake
GET  /api/predictions/model-status
```

## Usage Examples

### Get Performance Analytics

```bash
curl "http://localhost:8000/api/analytics/performance?user_id=123&days=30"
```

### Predict Bet Outcome

```bash
curl -X POST "http://localhost:8000/api/predictions/outcome?user_id=123" \
  -H "Content-Type: application/json" \
  -d '{
    "stake": 100,
    "odds": 2.5,
    "bet_type": "single",
    "bookie_id": "abc-123"
  }'
```

### Calculate Optimal Stake (Kelly Criterion)

```bash
curl -X POST "http://localhost:8000/api/predictions/optimal-stake?user_id=123" \
  -H "Content-Type: application/json" \
  -d '{
    "win_probability": 0.6,
    "odds": 2.0
  }'
```

## ML Model Training

The ML model requires at least 50 settled bets to train:

```bash
curl -X POST "http://localhost:8000/api/predictions/train?user_id=123"
```

## Integration with Frontend

Add to your Next.js frontend:

```typescript
// lib/fastapi.ts
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export const fastapiClient = {
  analytics: {
    getPerformance: (userId: string, days: number = 30) =>
      fetch(`${FASTAPI_URL}/api/analytics/performance?user_id=${userId}&days=${days}`),
  },
  predictions: {
    predictOutcome: (userId: string, data: any) =>
      fetch(`${FASTAPI_URL}/api/predictions/outcome?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },
};
```

## Tech Stack

- **FastAPI** - Modern Python web framework
- **scikit-learn** - Machine learning
- **pandas** - Data analysis
- **Supabase** - Database integration

## Development

Run with auto-reload:

```bash
uvicorn main:app --reload --port 8000
```

## Production

For production deployment:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Or use Docker:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
