from fastapi import FastAPI
from contextlib import asynccontextmanager
from backend.db.my_sql.connect import async_engine
from backend.models.base import Base # 必须导入Base，且确保Base加载了User模型
from backend.app.v1.auth.router import auth_router
from backend.app.knowledge_base.router import kb_router 
from backend.app.document.router import doc_router
import backend.models 
from backend.db.minio.init_bucket import init_minio_bucket # 导入MinIO桶初始化函数
#定义生命周期
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
        这个函数用来处理应用的生命周期事件
        比如说建立数据库表等操作
    """
    print("正在连接数据库中...")
    # 建表
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("数据库表结构初始化成功")

    #----------------------------------------------

    print("正在初始化MinIO桶...")
    init_minio_bucket() # 初始化MinIO桶
    print("MinIO桶初始化成功")
    yield #yield 之前是初始化 连接 + 建表 之后是关闭数据库连接

    # 关闭时执行：断开数据库连接
    await async_engine.dispose()
    print("数据库连接已断开。")

app = FastAPI(lifespan = lifespan, title = "My RAG API", description = "这是一个基于FastAPI的RAG系统后端API", version = "0.0.1")

# 注册路由
app.include_router(auth_router)
app.include_router(kb_router)
app.include_router(doc_router) # 将文档相关的子路由嵌套到知识库路由中
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="127.0.0.1", port=8000, reload = True)