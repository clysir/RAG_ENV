from sqlalchemy.ext.asyncio import AsyncSession
from backend.schemas.chat import (
    QueryResponse,
    QueryRequest,
    RetrievedChunk,
    ChatSource,
    ChatRequest,
    ChatResponse
)
from backend.app.knowledge_base.crud import KbCrud
from fastapi import HTTPException
from backend.app.chat.retriever import retrieve_chunks_for_kb
from backend.config.cfg import settings
from backend.core.model_factory import build_chat_model
from backend.app.chat.chains import (
    build_context_from_chunks,
    build_rag_answer_chain
)
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

def build_chat_source(chunks: list[dict]) -> list[ChatSource]:
    sources: list[ChatSource] = []
    for chunk in chunks:
        metadata = chunk.get("metadata") or chunk.get("source") or {}

        sources.append(
            ChatSource(
                doc_id=metadata.get("doc_id"),
                kb_id=metadata.get("kb_id"),
                file_name=metadata.get("file_name"),
                file_path=metadata.get("file_path"),
                chunk_index=metadata.get("chunk_index"),
                page=metadata.get("page"),
                title=metadata.get("title"),
                score=chunk.get("score"),
            )
        )

    return sources

async def chat_kb(
    kb_id: int,
    req: ChatRequest,
    user_id: int,
    db: AsyncSession
) -> ChatResponse:
    """
        RAG Chat 接口：
        1. 校验知识库权限
        2. 根据 question 检索 chunks
        3. 拼 context
        4. 使用 LCEL chain 调 LLM
        5. 返回 answer + sources
    """
    kb = await KbCrud(db).get_owned_kb(user_id, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail=f"知识库(ID: {kb_id})不存在或您无权限访问")

    chunks = await retrieve_chunks_for_kb(
        kb_id,
        req.question,
        req.top_k,
    )
    if not chunks:
        return ChatResponse(
            kb_id = kb.id,
            question = req.question,
            answer = "我在知识库中没有找到相关的信息，无法回答这个问题。",
            sources = [],
            model = settings.deepseek_chat_model
        )


    context = build_context_from_chunks(chunks)
    llm = build_chat_model()

    chain = build_rag_answer_chain(llm)
    
    answer = await chain.ainvoke(
        {
            "context": context,
            "question": req.question
        }
    )

    return ChatResponse(
        kb_id = kb.id,
        question = req.question,
        answer = answer,
        sources = build_chat_source(chunks),
        model = settings.deepseek_chat_model
    )