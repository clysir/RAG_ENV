"""
此模块：
根据问题 去 chroma 检索相关chunks

"""

import asyncio
from typing import Any

from backend.core.vector_store_factory import get_vector_store


def metadata_safe(metadata: dict[str, Any] | None) -> dict[str, Any]:
    """
    由于 chunk 的 metadata 是用户自定义的，可能会有各种奇怪的结构。
    这个函数的作用是把它转换成一个“安全”的版本，至少保证它是一个 dict[str, Any]。
    这样我们后面在处理 metadata 的时候就不需要担心它的结构了。
    """
    if metadata is None:
        return {}
    return dict(metadata)


async def retrieve_chunks_for_kb(
    kb_id: int, question: str, top_k: int = 3, document_ids: list[int] | None = None, score_threshold: float | None = None
) -> list[dict[str, Any]]:
    """
    在指定的 知识库 中的 chroma 检索相关chunks --> 修改为可检索不同Doc_id的chunk
    """

    def search():
        """
        由于 get_vector_store 里面配置了 Ollama 的 embedding，
        因此 similarity_search_with_score 会自动调用 Ollama 的 embedding 来把 question 转换成向量，
        然后再去 chroma 检索相关的 chunks。
        """
        vector_store = get_vector_store(kb_id)
        search_k = top_k 
        if document_ids:
            search_k = top_k * 5  # 如果指定了 document_ids，适当增加 k 的数量，以保证每个文档都能有机会被检索到
        return vector_store.similarity_search_with_score(query=question, k=search_k)

    results = await asyncio.to_thread(search)

    chunks: list[dict[str, Any]] = []
    for doc, score in results:
        metadata = metadata_safe(doc.metadata)
        doc_id = metadata.get("doc_id")

        # 如果指定了 document_ids，但当前 chunk 的 doc_id 不在其中，则跳过
        if document_ids and doc_id not in document_ids:
            continue  
        # 如果指定了 score_threshold，但当前 chunk 的 score 不满足条件，则跳过
        # 注意：chroma 的 score 是距离，距离越小表示越相关，因此这里是 score > threshold 时跳过 
        if score_threshold is not None and float(score) > score_threshold:
            continue
        chunks.append(
            {
                "content": doc.page_content,
                "metadata": metadata,
                "score": float(score) if score else None,
            }
        )

    return chunks


async def retrieve_chunks_for_kbs(
    kb_ids: list[int], question:str, top_k: int = 5, score_threshold: float | None = None
) -> list[dict[str, Any]]:
    """
    在多个知识库中检索相关 chunks
    """
    all_chunks: list[dict[str, Any]] = []
    for kb_id in kb_ids:
        chunks = await retrieve_chunks_for_kb(kb_id, question, top_k, None, score_threshold)
        all_chunks.extend(chunks)

    # 对所有检索到的 chunks 按 score 进行排序，取 top_k 个
    all_chunks.sort(key=lambda x: x["score"] if x["score"] is not None else float("inf"))
    return all_chunks[:top_k]