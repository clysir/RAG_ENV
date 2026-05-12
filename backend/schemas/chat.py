from typing import Any

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="用户的问题")
    top_k: int = Field(3, ge=1, le=10, description="返回的相关 chunk 数量")
    document_ids: list[int] | None = Field(None, description="可选的文档 ID 列表，用于限定检索范围")  
    score_threshold: float | None = Field(None, description="可选的分数阈值，用于过滤检索结果")


class RetrievedSource(BaseModel):
    doc_id: int | None = None
    kb_id: int | None = None
    file_name: str | None = None
    file_path: str | None = None
    chunk_index: int | None = None
    page: int | None = None
    title: str | None = None
    vector_id: str | None = None


class RetrievedChunk(BaseModel):
    content: str = Field(..., description="chunk 的文本内容")
    source: RetrievedSource 
    score: float | None = None


class QueryResponse(BaseModel):
    kb_id: int | None = None
    kb_ids: list[int] | None = None
    question: str
    top_k: int
    document_ids: list[int] | None = None  
    chunks: list[RetrievedChunk]
    run_id: int | None = None


class MultiKbQueryRequest(BaseModel):
    question: str 
    kb_ids: list[int] | None = None
    document_ids: list[int] | None = Field(None, description="可选的文档 ID 列表")
    top_k: int = Field(5, ge=1, le=10, description="每个知识库返回的相关 chunk 数量")
    score_threshold: float | None = None
    

"""
    chat相关的请求和响应模型
"""

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="用户的问题")
    top_k: int = Field(3, ge=1, le=10, description="返回的相关 chunk 数量")
    document_ids: list[int] | None = None
    score_threshold: float | None = None
    

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
    kb_id: int | None = None
    kb_ids: list[int] | None = None
    question: str
    answer: str
    sources: list[ChatSource]
    model: str
    provider: str | None = None
    run_id: int | None = None


class MultiKbChatRequest(BaseModel):
    question: str
    kb_ids: list[int] | None = None
    document_ids: list[int] | None = None
    top_k: int = Field(5, ge=1, le=10, description="每个知识库返回的相关 chunk 数量")
    score_threshold: float | None = None
    
