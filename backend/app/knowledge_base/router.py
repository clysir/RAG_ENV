from fastapi import APIRouter,Depends
from backend.db.my_sql.connect import get_db
from backend.app.v1.auth.service import get_current_user
from backend.models.user import User
from backend.schemas.knowledge import (
    KnowledgeResponse,
    KnowledgeBaseCreate,
    KnowledgeDetailResponse,
    KnowledgeBaseUpdate
)
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.knowledge_base.service import (
    create_kb,
    list_kb,
    get_kb_detail,
    update_kb,
    delete_kb
)
from typing import List
from backend.app.document.router import doc_router # 导入文档相关的子路由


kb_router = APIRouter(prefix = "/api/knowledge_base", tags = ["knowledge_base"])

#kb_router.include_router(doc_router) # 将文档相关的子路由嵌套到知识库路由中

# 创建知识库接口
@kb_router.post("/create", response_model=KnowledgeResponse)
async def create_kb_endpoint(
    kb_in: KnowledgeBaseCreate,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await create_kb(kb_in, cur_user.id, db)
    except Exception as e:
        raise e
    

# 获取知识库列表接口 不会显示文件信息
@kb_router.get("/list", response_model=List[KnowledgeResponse])
async def list_kb_endpoint(
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip : int = 0,
    limit : int = 100
):
    try:
        # 这里后续再进行分页等功能的实现 先占位
        return await list_kb(cur_user.id, db, skip, limit)
    except Exception as e:
        raise e

# 获取知识库详情接口  会显示文件信息
@kb_router.get("/{kb_id}", response_model=KnowledgeDetailResponse)
async def get_kb_detail_endpoint(
    kb_id: int,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_kb_detail(kb_id, cur_user.id, db)
    except Exception as e:
        raise e


# 更新知识库接口  这里也会导致 异步环境下的懒加载冲突 因此返回格式 换成 KnowledgeListResponse  不返回Documents的格式
@kb_router.put("/{kb_id}", response_model=KnowledgeResponse)
async def update_kb_endpoint(
    kb_id: int,
    kb_in: KnowledgeBaseUpdate,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await update_kb(kb_id, kb_in, cur_user.id, db)
    except Exception as e:
        raise e

@kb_router.delete("/{kb_id}", description="删除知识库接口, 会删除知识库下的所有文件,当前版本无法去解决 文件 和 MinIO之间的关联问题")
async def delete_kb_endpoint(
    kb_id: int,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await delete_kb(kb_id, cur_user.id, db)
    except Exception as e:
        raise e