from pydantic_settings import BaseSettings,SettingsConfigDict


class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str 
    
    # JWT配置
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # MinIO 配置
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket_name: str
    minio_secure: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )


settings = Settings()