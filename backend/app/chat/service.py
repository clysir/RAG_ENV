from sqlalchemy.ext.asyncio import AsyncSession
from backend.schemas.chat import (
    QueryResponse,
    QueryRequest,
    RetrievedChunk
)
from backend.app.knowledge_base.crud import KbCrud
from fastapi import HTTPException
from backend.app.chat.retriever import retrieve_chunks_for_kb

async def query_kb(
    kb_id: int,
    req: QueryRequest,
    user_id: int,
    db: AsyncSession
) -> QueryResponse:
    """
        此接口只做检索 不做llm 回答
    """

    kb = await KbCrud(db).get_owned_kb(user_id, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail=f"知识库(ID: {kb_id})不存在或您无权限访问")

    chunks = await retrieve_chunks_for_kb(
        kb_id,
        req.question,
        req.top_k,
    )

    return QueryResponse(
        kb_id = kb.id,
        question = req.question,
        top_k = req.top_k,
        chunks = [
            RetrievedChunk(
                content = chunk["content"],
                source = build_source(chunk["metadata"]),
                score = chunk["score"]
            )
            for chunk in chunks
        ]
    )

 
def build_source(metadata: dict) -> dict:
    return {
        "doc_id": metadata.get("doc_id"),
        "kb_id": metadata.get("kb_id"),
        "file_name": metadata.get("file_name"),
        "file_path": metadata.get("file_path"),
        "chunk_index": metadata.get("chunk_index"),
        "page": metadata.get("page"),
        "vector_id": metadata.get("vector_id"),
        "title": metadata.get("title")
    }