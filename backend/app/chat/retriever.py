"""
    此模块：
    根据问题 去 chroma 检索相关chunks

"""
from typing import Any
from backend.app.document.process import get_vector_store
import asyncio

def metadata_safe(
    metadata: dict[str, Any] | None
) -> dict[str, Any]:
    """
        由于 chunk 的 metadata 是用户自定义的，可能会有各种奇怪的结构。
        这个函数的作用是把它转换成一个“安全”的版本，至少保证它是一个 dict[str, Any]。
        这样我们后面在处理 metadata 的时候就不需要担心它的结构了。
    """
    if metadata is None:
        return {}
    return dict(metadata)


async def retrieve_chunks_for_kb(
    kb_id: int,
    question: str,
    top_k: int = 3   
) -> list[dict[str, Any]]:
    """
        在指定的 知识库 中的 chroma 检索相关chunks
    """
    def search():
        """
            由于 get_vector_store 里面配置了 Ollama 的 embedding，
            因此 similarity_search_with_score 会自动调用 Ollama 的 embedding 来把 question 转换成向量，
            然后再去 chroma 检索相关的 chunks。
        """
        vector_store = get_vector_store(kb_id)
        return vector_store.similarity_search_with_score(
            query=question,
            k=top_k
        )

    results = await asyncio.to_thread(search)

    chunks: list[dict[str, Any]] = []
    for doc, score in results:
        chunks.append(
            {
                "content": doc.page_content,
                "metadata": metadata_safe(doc.metadata),
                "score": float(score) if score else None
            }
        )

    return chunks