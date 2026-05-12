from typing import Any
from datetime import datetime

from pydantic import BaseModel


class RagRunSummary(BaseModel):
    """
        RagRun的摘要信息 用于列表展示
    """
    id: int 
    run_type: str | None = None

    user_id: int
    knowledge_base_id: int | None = None
    kb_ids: list[int] | None = None
    document_ids: list[int] | None = None

    question: str
    answer_preview: str | None = None
    model_provider: str | None = None
    model_name: str | None = None

    top_k: int
    
    latency_ms: int | None = None
    status: str
    created_at: datetime | None = None


class RagRunListResponse(BaseModel):
    """
    分页查询 RAG Run。

    has_more 表示是否还有下一页。
    """
    page: int
    page_size: int
    has_more: bool
    items: list[RagRunSummary]


class RagRunDetail(BaseModel):

    id: int 
    run_type: str | None = None

    user_id: int
    knowledge_base_id: int | None = None
    kb_ids: list[int] | None = None
    document_ids: list[int] | None = None

    question: str
    answer: str | None = None

    model_provider: str | None = None
    model_name: str | None = None

    top_k: int
    
    latency_ms: int | None = None
    status: str
    error_message: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None