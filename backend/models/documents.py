from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)
from sqlalchemy import (
    Integer,
    String,
    ForeignKey
)
from backend.models.base import Base

class Documents(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key = True)
    knowledge_base_id: Mapped[int] = mapped_column(Integer, ForeignKey("knowledge_base.id"), nullable = False, comment = "和数据库id绑定")
    file_name: Mapped[str] = mapped_column(String(255), nullable = False, comment = "文件名")
    file_path: Mapped[str] = mapped_column(String(255), nullable = False, comment = "文件路径")
    file_size: Mapped[int] = mapped_column(Integer, nullable = False, comment = "文件大小")
    content_type: Mapped[str] = mapped_column(String(100), nullable = False, comment = "文件类型")
    file_hash: Mapped[str] = mapped_column(String(255), nullable = False, comment = "文件哈希值")
    status: Mapped[str] = mapped_column(String(50), nullable = False, comment = "文件状态", default = "uploaded") # uploaded, processing, completed, failed

    # 这里报waring是正常的 因为我们在knowledge模型里面也有引用documents模型 但是这是sqlalchemy的正常用法 不会有问题的
    knowledge: Mapped["Knowledge"] = relationship(
        "Knowledge", 
        back_populates = "documents") 

    chunks: Mapped[list["DocumentChunk"]] = relationship(
        "DocumentChunk",
        back_populates = "document",
        cascade = "all, delete-orphan"
    )
