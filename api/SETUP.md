# FastAPI Backend - Quick Setup Guide

## Installation

1. **Navigate to API directory:**
```bash
cd api
```

2. **Create virtual environment (recommended):**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
copy .env.example .env
# Edit .env and add your Supabase credentials
```

5. **Run the server:**
```bash
python main.py
```

The API will be running at **http://localhost:8000**

## Test the API

Visit http://localhost:8000/docs for interactive API documentation!

## Quick Test Commands

```bash
# Health check
curl http://localhost:8000/health

# API info
curl http://localhost:8000/api/info

# Get performance analytics (replace USER_ID)
curl "http://localhost:8000/api/analytics/performance?user_id=YOUR_USER_ID&days=30"
```

## Next Steps

1. Copy your Supabase URL and keys to `.env`
2. Train the ML model with your bet data
3. Start making predictions!

See README.md for full documentation.
