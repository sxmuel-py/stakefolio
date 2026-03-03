from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config.settings import settings
from routers import analytics, predictions
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="Betting Management API",
    description="Advanced analytics and ML predictions for betting management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analytics.router)
app.include_router(predictions.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Betting Management API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2026-02-03T21:58:00Z"
    }


@app.get("/api/info")
async def api_info():
    """Get API information and available endpoints"""
    return {
        "endpoints": {
            "analytics": {
                "performance": "GET /api/analytics/performance",
                "trends": "GET /api/analytics/trends",
                "value_bets": "GET /api/analytics/value-bets",
                "streaks": "GET /api/analytics/streaks"
            },
            "predictions": {
                "outcome": "POST /api/predictions/outcome",
                "train": "POST /api/predictions/train",
                "optimal_stake": "POST /api/predictions/optimal-stake",
                "status": "GET /api/predictions/model-status"
            }
        },
        "features": [
            "Advanced performance analytics",
            "ML-based outcome predictions",
            "Kelly Criterion stake calculator",
            "Value bet identification",
            "Trend analysis",
            "Streak tracking"
        ]
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.api_reload else "An error occurred"
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )
