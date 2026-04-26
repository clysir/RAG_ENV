"""
这个用来连接mysql数据库 并获取session对象
"""

from sqlalchemy.ext.asyncio import create_async_engine,async_sessionmaker,AsyncSession
from backend.config.cfg import settings
ASYNC_ENGINE_URL = settings.DATABASE_URL


# 创建异步引擎
async_engine = create_async_engine(
    ASYNC_ENGINE_URL,
    echo = True # 用于在终端 同步显示 数据库里面的数据
)


# 创建异步对话工厂
async_session = async_sessionmaker(
    bind = async_engine,
    class_ = AsyncSession, # 这个参数的作用是 指定使用异步会话对象
    expire_on_commit = False # 这个参数的作用是 当提交事务后 不会自动过期session对象 这样就可以继续使用这个session对象进行其他操作
)


# 获取数据库会话的依赖项
async def get_db():
    async with async_session() as session:
        try:
            yield session
            #await session.commit() # 提交事务  在service端去提供提交 防止重复提交 这里就只提供对话！
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()