from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str = ""
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    # External APIs
    odds_api_key: str = ""
    sports_api_key: str = ""
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # ML
    ml_model_path: str = "./models/trained"
    prediction_confidence_threshold: float = 0.7
    
    # Reports
    reports_dir: str = "./reports"
    max_report_age_days: int = 30
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
