from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict
)

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



    # Chat LLM
    chat_provider:str = "deepseek" # 默认使用 deepseek 作为聊天模型提供商 后续可以添加其他模型提供商的配置项

    deepseek_api_key:str 
    deepseek_base_url:str 
    deepseek_chat_model: str

    deepseek_temperature: float 
    deepseek_max_tokens: int 
    

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )


settings = Settings()