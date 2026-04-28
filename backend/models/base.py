from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column
)
from sqlalchemy import (
    DateTime,
    func
)
from datetime import datetime


class Base(DeclarativeBase):
    """
        这个类的作用是 作为所有ORM模型的基类 这样就可以在这个类里面 定义一些公共的属性和方法
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default = func.now(), # 这个参数的作用是 当创建对象时 自动设置为当前时间
        nullable = False ,# 这个参数的作用是 这个字段不能为空
        comment = "创建时间" # 这个参数的作用是 给这个字段添加注释
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default = func.now(), # 这个参数的作用是 当创建对象时 自动设置
        onupdate = func.now(), # 这个参数的作用是 当更新对象时 自动设置为当前时间
        nullable = False ,# 这个参数的作用是 这个字段不能为空
        comment = "更新时间" # 这个参数的作用是 给这个字段添加注释
    )