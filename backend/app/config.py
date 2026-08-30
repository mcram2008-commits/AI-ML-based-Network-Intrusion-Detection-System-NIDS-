import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NIDS - Network Intrusion Detection System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # JWT Auth Config
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "nids_super_secret_cybersecurity_key_2026_x89f")
    JWT_REFRESH_SECRET_KEY: str = os.getenv("JWT_REFRESH_SECRET_KEY", "nids_super_secret_refresh_key_2026_z99k")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database Config
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nids_database.db")
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOADS_DIR: str = os.path.join(BASE_DIR, "uploads")
    MODELS_DIR: str = os.path.join(BASE_DIR, "saved_models")
    
    class Config:
        case_sensitive = True

settings = Settings()

os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)
