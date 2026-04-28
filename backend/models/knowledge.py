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

class Knowledge(Base):
    
    __tablename__ = "knowledge_base"

    id: Mapped[int] = mapped_column(Integer, primary_key = True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable = False, comment = "和user表绑定")  # 因为我user写的table_name 是 users
    name: Mapped[str] = mapped_column(String(255), nullable = False, comment = "数据库名字") # unique要去掉 其实应该是用户的 数据库名字唯一 
    description: Mapped[str] = mapped_column(String(255), nullable = True, comment = "数据库描述")

    # cascade参数的作用是 当删除知识库时 同时删除这个知识库下的所有文档
    documents: Mapped[list["Documents"]] = relationship(
        "Documents", 
        back_populates = "knowledge", #这个值是填 Documents模型里面的 relationship 的对应名称 （注意是小写）
        cascade = "all, delete-orphan") 