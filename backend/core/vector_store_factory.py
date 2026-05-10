from langchain_chroma import Chroma

from backend.config.cfg import settings
from backend.core.model_factory import build_embedding_model


def get_vector_store(kb_id: int):
    provider = settings.vector_store_provider.lower()

    if provider == "chroma":
        return Chroma(
            collection_name=f"kb_{kb_id}",
            embedding_function=build_embedding_model(),
            persist_directory=settings.chroma_persist_directory,
        )

    raise ValueError(f"暂不支持的向量库提供商: {settings.vector_store_provider}")