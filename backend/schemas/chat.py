from pydantic import (
    BaseModel,
    Field
)
from typing import Any

class QueryRequest(BaseModel):
    question: str = Field(..., min_length = 1, description="用户的问题")
    top_k: int = Field(3, ge = 1, le = 10, description="返回的相关 chunk 数量")

class RetrievedChunk(BaseModel):
    content: str = Field(..., description="chunk 的文本内容")
    source: dict[str, Any] = Field(..., description="chunk 的元数据, 给前端展示用的")
    score: float | None = None 

class QueryResponse(BaseModel):
    kb_id: int
    question: str
    top_k: int
    chunks: list[RetrievedChunk]

"""
    chat相关的请求和响应模型
"""


class ChatRequest(BaseModel):
    question: str = Field(..., min_length = 1, description="用户的问题")
    top_k: int = Field(3, ge = 1, le = 10, description="返回的相关 chunk 数量")

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

