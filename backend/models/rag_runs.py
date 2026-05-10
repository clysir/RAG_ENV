"""
    谁问的
    问了什么
    用了哪个模型
    检索到了哪些 chunks
    回答是什么
    耗时多少
    成功还是失败
"""

from sqlalchemy import  Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base

class RagRun(Base):
    __tablename__ = "rag_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    knowledge_base_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)

    model_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    top_k: Mapped[int] = mapped_column(Integer, default=3)
    sources_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="success")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)