"""
    谁问的
    问了什么
    用了哪个模型
    检索到了哪些 chunks
    回答是什么
    耗时多少
    成功还是失败
"""

from sqlalchemy import  Integer, String, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base

class RagRun(Base):
    __tablename__ = "rag_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index = True)
    knowledge_base_id: Mapped[int | None] = mapped_column(
        Integer, 
        ForeignKey("knowledge_base.id"), 
        nullable=True, 
        index = True, 
        comment = "单知识库请求时记录kb_id 多知识库请求时可为null")
    
    kb_ids_json : Mapped[list[int] | None] = mapped_column(JSON, nullable=True, comment="本次实际查询的kb_id列表")

    run_type: Mapped[str] = mapped_column(String(50), nullable=False, default = "chat", comment = "chat/query")

    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)

    model_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    top_k: Mapped[int] = mapped_column(Integer, default=3)
    document_ids_json: Mapped[list[int] | None] = mapped_column(JSON, nullable=True, comment="本次查询实际涉及的document_id列表")
    sources_json: Mapped[dict | None] = mapped_column(JSON, nullable=True, comment="本次查询的来源信息列表")

    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True,  comment = "本次请求的总耗时，单位毫秒")
    status: Mapped[str] = mapped_column(String(50), default="success", comment = "success/failure")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True, comment = "失败原因")