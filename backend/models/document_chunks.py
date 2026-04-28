from backend.models.base import Base
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)
from sqlalchemy import (
    Integer,
    String,
    ForeignKey,
    Text,
    JSON,
    Index,
    UniqueConstraint
)
from typing import Any


class DocumentChunk(Base):

    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key = True) 
    document_id: Mapped[int] = mapped_column(Integer, ForeignKey("documents.id"), nullable = False)
    knowledge_base_id: Mapped[int] = mapped_column(Integer, ForeignKey("knowledge_base.id"), nullable = False)
    chunk_index : Mapped[int] = mapped_column(Integer, nullable = False, comment = "chunk在当前文档中的顺序")
    content: Mapped[str] = mapped_column(Text, nullable = False, comment = "chunk文本内容")
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable = False, comment = "chunk元数据， 比如页码、soucre、doc_id、kb_id等")
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False,comment="chunk内容hash")
    vector_id: Mapped[str] = mapped_column(String(128), nullable=False,unique=True,comment="向量库中的ID")

    vector_store: Mapped[str] = mapped_column(String(50), nullable=False,default="chroma",comment="向量库存储类型")

    document = relationship("Documents",back_populates="chunks")
    # 第一行是 dc_id ck_index 必须全局唯一
    # 这个可以用来 查询dc_id 就可以获取 一堆的数据 ---> 这是索引的作用 同样的 查 kb_id也可以获取一堆数据
    __table_args__ = (
        UniqueConstraint(
            "document_id",
            "chunk_index",
            name="uq_document_chunk_index",
        ),
        Index("idx_document_chunks_document_id", "document_id"),
        Index("idx_document_chunks_kb_id", "knowledge_base_id"),
    )