from typing import Any
import time

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.chat.chains import (build_context_from_chunks,
                                     build_rag_answer_chain)
from backend.app.chat.retriever import (retrieve_chunks_for_kb,
                                        retrieve_chunks_for_kbs)
from backend.app.chat.run_crud import RagRunCrud
from backend.app.knowledge_base.crud import KbCrud
from backend.config.cfg import settings
from backend.core.model_factory import build_chat_model
from backend.schemas.chat import (ChatRequest, ChatResponse, 
                                  ChatSource, MultiKbChatRequest,
                                  QueryRequest, QueryResponse, 
                                  RetrievedChunk, MultiKbQueryRequest,
                                  RetrievedSource, RetrievedChunk)


def build_source(metadata: dict) -> RetrievedSource:
    return RetrievedSource(
        doc_id=metadata.get("doc_id"),
        kb_id=metadata.get("kb_id"),
        file_name=metadata.get("file_name"),
        file_path=metadata.get("file_path"),
        chunk_index=metadata.get("chunk_index"),
        page=metadata.get("page"),
        vector_id=metadata.get("vector_id"),
        title=metadata.get("title"),
    )


def build_query_chunks(chunks: list[dict]) -> list[RetrievedChunk]:
    return [
        RetrievedChunk(
            content=chunk["content"],
            source=build_source(chunk["metadata"]),
            score=chunk["score"],
        )
        for chunk in chunks
    ]


def build_chat_sources(chunks: list[dict]) -> list[ChatSource]:
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


def sources_to_json(sources: list[ChatSource]) -> list[dict[str, Any]]:
    return [source.model_dump() for source in sources]


async def ensure_owned_kb(kb_id: int, user_id: int, db: AsyncSession):
    kb = await KbCrud(db).get_owned_kb(user_id, kb_id)
    if not kb:
        raise HTTPException(
            status_code=404, detail=f"知识库(ID: {kb_id})不存在或您无权限访问"
        )
    return kb


async def ensure_owned_kbs(kb_ids: list[int], user_id: int, db: AsyncSession):
    if not kb_ids:
        raise HTTPException(status_code=400, detail="kb_ids 不能为空")
    kbs = []

    for kb_id in kb_ids:
        kb = await ensure_owned_kb(kb_id, user_id, db)
        kbs.append(kb)

    return kbs


async def query_kb(
    kb_id: int, req: QueryRequest, user_id: int, db: AsyncSession
) -> QueryResponse:
    """
    此接口只做检索 不做llm 回答
    """
    start = time.perf_counter()

    kb = await ensure_owned_kb(kb_id, user_id, db)

    chunks = await retrieve_chunks_for_kb(
        kb_id,
        req.question,
        req.top_k,
        req.document_ids,
        req.score_threshold,
    )

    latency_ms = int((time.perf_counter() - start) * 1000)
    query_chunks = build_query_chunks(chunks)

    rag_run = await RagRunCrud(db).create_rag_run(
        user_id=user_id,
        knowledge_base_id=kb.id,
        kb_ids = [kb.id],
        run_type="query",
        question=req.question,
        top_k=req.top_k,
        latency_ms=latency_ms,
        document_ids = req.document_ids,
        sources = [chunk.model_dump() for chunk in query_chunks],
        status = "success"
    )

    return QueryResponse(
        kb_id=kb.id,
        kb_ids=[kb.id],
        question=req.question,
        top_k=req.top_k,
        chunks=query_chunks,
        document_ids=req.document_ids,
        run_id = rag_run.id
    )


async def query_kbs(
    req: MultiKbQueryRequest, user_id: int, db: AsyncSession
) -> QueryResponse:
    """
    跨多个知识库检索接口。
    """
    start = time.perf_counter()

    await ensure_owned_kbs(req.kb_ids, user_id, db)

    chunks = await retrieve_chunks_for_kbs(
        req.kb_ids,
        req.question,
        req.top_k,
        req.document_ids,
        req.score_threshold,
    )
    latency_ms = int((time.perf_counter() - start) * 1000)

    query_chunks = build_query_chunks(chunks)
    rag_run = await RagRunCrud(db).create_rag_run(
        user_id=user_id,
        knowledge_base_id=None,
        kb_ids=req.kb_ids,
        run_type="query",
        question=req.question,
        top_k=req.top_k,
        latency_ms=latency_ms,
        document_ids=req.document_ids,
        sources=[chunk.model_dump() for chunk in query_chunks],
        status="success"
    )

    return QueryResponse(
        kb_id=None,
        kb_ids=req.kb_ids,
        question=req.question,
        top_k=req.top_k,
        chunks=query_chunks,
        document_ids=req.document_ids,
        run_id=rag_run.id
    )


async def chat_kb(
    kb_id: int, req: ChatRequest, user_id: int, db: AsyncSession
) -> ChatResponse:
    """
    RAG Chat 接口：
    1. 校验知识库权限
    2. 根据 question 检索 chunks
    3. 拼 context
    4. 使用 LCEL chain 调 LLM
    5. 返回 answer + sources
    """
    start = time.perf_counter()
    kb = await ensure_owned_kb(kb_id, user_id, db)

    chunks = await retrieve_chunks_for_kb(
        kb_id,
        req.question,
        req.top_k,
        req.document_ids,
        req.score_threshold,
    )
    sources = build_chat_sources(chunks)
    
    if not chunks:
        answer = "我在知识库中没有找到相关的信息，无法回答这个问题。"
        lantency_ms = int((time.perf_counter() - start) * 1000)

        rag_run = await RagRunCrud(db).create_rag_run(
            user_id=user_id,
            knowledge_base_id=kb.id,
            kb_ids=[kb.id],
            run_type="chat",
            question=req.question,
            top_k=req.top_k,
            latency_ms=lantency_ms,
            document_ids=req.document_ids,
            sources=sources_to_json(sources),
            answer=answer,
            model_provider=settings.chat_model_provider,
            model_name=settings.chat_model_name,
            status="success"
        )

        return ChatResponse(
            kb_id=kb.id,
            kb_ids=[kb.id],
            question=req.question,
            answer=answer,
            sources=sources,
            model=settings.chat_model_name,
            provider=settings.chat_model_provider,
            run_id=rag_run.id
        )

    context = build_context_from_chunks(chunks)
    llm = build_chat_model()
    chain = build_rag_answer_chain(llm)

    answer = await chain.ainvoke(
        {
            "context": context, "question": req.question
        }
    )
    lantency_ms = int((time.perf_counter() - start) * 1000)
    rag_run = await RagRunCrud(db).create_rag_run(
        user_id=user_id,
        knowledge_base_id=kb.id,
        kb_ids=[kb.id],
        run_type="chat",
        question=req.question,
        top_k=req.top_k,
        latency_ms=lantency_ms,
        document_ids=req.document_ids,
        sources=sources_to_json(sources),
        answer=answer,
        model_provider=settings.chat_model_provider,
        model_name=settings.chat_model_name,
        status="success"
    )

    return ChatResponse(
        kb_id=kb.id,
        kb_ids=[kb.id],
        question=req.question,
        answer=answer,
        sources=sources,
        model=settings.chat_model_name,
        provider=settings.chat_model_provider,
        run_id=rag_run.id
    )


async def chat_kbs(
    req: MultiKbChatRequest, user_id: int, db: AsyncSession
) -> ChatResponse:
    """
    跨多个知识库的 RAG Chat 接口。
    """
    start = time.perf_counter()

    await ensure_owned_kbs(req.kb_ids, user_id, db)

    chunks = await retrieve_chunks_for_kbs(
        req.kb_ids,
        req.question,
        req.top_k,
        req.document_ids,
        req.score_threshold,
    )
    sources = build_chat_sources(chunks)

    if not chunks:
        answer = "我在知识库中没有找到相关的信息，无法回答这个问题。"
        lantency_ms = int((time.perf_counter() - start) * 1000)

        rag_run = await RagRunCrud(db).create_rag_run(
            user_id=user_id,
            knowledge_base_id=None,
            kb_ids=req.kb_ids,
            run_type="chat",
            question=req.question,
            top_k=req.top_k,
            latency_ms=lantency_ms,
            document_ids=req.document_ids,
            sources=sources_to_json(sources),
            answer=answer,
            model_provider=settings.chat_model_provider,
            model_name=settings.chat_model_name,
            status="success"
        )

        return ChatResponse(
            kb_id=None,
            kb_ids=req.kb_ids,
            question=req.question,
            answer=answer,
            sources=sources,
            model=settings.chat_model_name,
            provider=settings.chat_model_provider,
            run_id=rag_run.id
        )

    context = build_context_from_chunks(chunks)
    llm = build_chat_model()
    chain = build_rag_answer_chain(llm)

    answer = await chain.ainvoke(
        {
            "context": context, "question": req.question
        }
    )
    lantency_ms = int((time.perf_counter() - start) * 1000)
    rag_run = await RagRunCrud(db).create_rag_run(
        user_id=user_id,
        knowledge_base_id=None,
        kb_ids=req.kb_ids,
        run_type="chat",
        question=req.question,
        top_k=req.top_k,
        latency_ms=lantency_ms,
        document_ids=req.document_ids,
        sources=sources_to_json(sources),
        answer=answer,
        model_provider=settings.chat_model_provider,
        model_name=settings.chat_model_name,
        status="success"
    )

    return ChatResponse(
        kb_id = None,
        kb_ids = req.kb_ids,
        question=req.question,
        answer=answer,  
        sources=sources,
        model=settings.chat_model_name,
        provider=settings.chat_model_provider,
        run_id=rag_run.id
    )
