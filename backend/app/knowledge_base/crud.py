from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.knowledge import Knowledge
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException,status
class KbCrud:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db


    async def get_owned_list_kb(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Knowledge]:
        """
            获取用户自己的知识库列表
        """
        stmt = select(Knowledge).where(Knowledge.user_id == user_id).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()   

    async def get_owned_kb(self, user_id: int, kb_id: int) -> Knowledge | None:
        """
            按用户 与 数据库 id 获取用户自己的知识库
        """
        stmt = select(Knowledge).where(Knowledge.user_id == user_id, Knowledge.id == kb_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_owned_kb(self, user_id: int, kb_id: int) -> bool:
        """
            删除用户自己的知识库
        """
        kb = await self.get_owned_kb(user_id, kb_id)
        if not kb:
            raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"知识库(ID:{kb_id})不存在或您无权修改"
        )
        await self.db.delete(kb)
        await self.db.commit()
        return True

    async def get_owned_kb_details(self, kb_id: int, user_id: int) -> Knowledge | None:
        """
            获取用户自己的知识库详情 包括文件信息 
        """
        stmt = select(Knowledge).where(Knowledge.user_id == user_id, Knowledge.id == kb_id).options(selectinload(Knowledge.documents))
        result = await self.db.execute(stmt)
        return result.scalars().first()