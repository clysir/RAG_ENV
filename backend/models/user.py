from sqlalchemy.orm import (
    Mapped,
    mapped_column
)
from sqlalchemy import (
    Integer,
    String
)
from backend.models.base import Base

class User(Base):
    __tablename__ = "users" # 这个参数的作用是 指定这个模型对应的数据库表名

    id: Mapped[int] = mapped_column(Integer, primary_key = True)
    username: Mapped[str] = mapped_column(String(50), unique = True, nullable = False, comment = "用户名")
    email: Mapped[str] = mapped_column(String(100), unique = True, nullable = False, comment = "邮箱")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable = False, comment = "哈希密码")
    is_active: Mapped[bool] = mapped_column(default=True, nullable = False, comment = "是否激活")
    is_superuser: Mapped[bool] = mapped_column(default=False, nullable = False, comment = "是否为超级用户")

