from sqlalchemy.ext.asyncio import AsyncSession
from backend.schemas.knowledge import (
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate
)
from backend.models.knowledge import Knowledge
from fastapi import (
    HTTPException,
    status
)
from backend.app.knowledge_base.crud import KbCrud

# 服务层不需要Depends 直接传入参数即可
async def create_kb(kb_in: KnowledgeBaseCreate, user_id: int, db: AsyncSession ) -> Knowledge:
    """
        内部函数：创建知识库
    """
    kb = Knowledge(
        user_id = user_id,
        name = kb_in.name,
        description = kb_in.description
    )
    db.add(kb)
    await db.commit()
    await db.refresh(kb)
    return kb
    
async def list_kb(user_id: int, db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Knowledge]:
    """
        内部函数：获取知识库列表
    """
    # 这里后续再进行分页等功能的实现 先占位
    repo = KbCrud(db)
    return await repo.get_owned_list_kb(user_id, skip, limit)    


async def get_kb_detail(kb_id: int, user_id: int, db: AsyncSession) -> Knowledge | None:
    """
        内部函数：获取知识库详情 包括文件信息
    """
    repo = KbCrud(db)
    return await repo.get_owned_kb_details(kb_id, user_id)


async def update_kb(kb_id: int, kb_in: KnowledgeBaseUpdate, user_id: int, db: AsyncSession) -> Knowledge | None:
    repo = KbCrud(db)
    kb = await repo.get_owned_kb(user_id, kb_id)
    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"知识库(ID:{kb_id})不存在或您无权修改"
        )
    # kb_in.model_dump(exclude_unset=True) 这个方法会返回一个字典 包含了所有字段的值 但是如果字段没有被更新 那么这个字段的值就是 None 所以我们需要过滤掉这些值

    for var, value in kb_in.model_dump(exclude_unset=True).items():
        setattr(kb, var, value)  # setattr() 函数用于设置对象属性值
    db.add(kb)
    await db.commit()
    await db.refresh(kb)
    return kb

async def delete_kb(kb_id: int, user_id: int, db: AsyncSession) -> bool:
    repo = KbCrud(db)
    return await repo.delete_owned_kb(user_id, kb_id)