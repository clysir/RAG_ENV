from typing import Any

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="用户的问题")
    top_k: int = Field(3, ge=1, le=10, description="返回的相关 chunk 数量")
    document_ids: list[int] | None = Field(None, description="可选的文档 ID 列表，用于限定检索范围")  
    score_threshold: float | None = Field(None, description="可选的分数阈值，用于过滤检索结果")

class RetrievedChunk(BaseModel):
    content: str = Field(..., description="chunk 的文本内容")
    source: dict[str, Any] = Field(..., description="chunk 的元数据, 给前端展示用的")
    score: float | None = None


class QueryResponse(BaseModel):
    kb_id: int
    question: str
    top_k: int
    chunks: list[RetrievedChunk]


class MultiKbQueryRequest(BaseModel):
    question: str 
    top_k: int = Field(5, ge=1, le=10, description="每个知识库返回的相关 chunk 数量")
    kb_ids: list[int] = Field(..., description="要检索的知识库 ID 列表")
    score_threshold: float | None = None


"""
    chat相关的请求和响应模型
"""

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="用户的问题")
    top_k: int = Field(3, ge=1, le=10, description="返回的相关 chunk 数量")
    document_ids: list[int] | None = None
    score_threshold: float | None = None
    chat_model_name: str | None = None


class ChatSource(BaseModel):
    doc_id: int | None = None
    kb_id: int | None = None
    file_name: str | None = None
    file_path: str | None = None
    chunk_index: int | None = None
    page: int | None = None
    title: str | None = None
    score: float | None = None


class ChatResponse(BaseModel):
    kb_id: int
    question: str
    answer: str
    sources: list[ChatSource]
    model: str

