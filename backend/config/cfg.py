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

    # Ingest/chunk 设置
    ingest_max_chunks: int | None = 3
    ingest_batch_size: int = 1
    chunk_size: int = 2000
    chunk_overlap: int = 300

    #Embedding
    embedding_provider: str = "ollama" 
    embedding_model: str = "nomic-embed-text"
    embedding_base_url: str = "http://localhost:11434"

    # Vector Store
    vector_store_provider: str = "chroma"
    chroma_persist_directory: str = "./data/chroma"
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None
    
    # Chat Model
    chat_model_provider: str = "deepseek" # 默认使用 deepseek 作为聊天模型提供商 后续可以添加其他模型提供商的配置项
    chat_model_name: str = "deepseek-v4-flash"
    chat_model_api_key: str | None = None
    chat_model_base_url: str = "https://api.deepseek.com"
    chat_model_temperature: float = 0.2
    chat_model_max_tokens: int = 2048
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )

settings = Settings()