from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.user import User
from sqlalchemy import select

class UserCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_user_by_username(self, username: str) -> User | None:
        """
            根据用户名 获取用户对象
        """
        stmt = select(User).where(User.username == username)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_user_by_email(self, email: str) -> User | None:
        """
            根据邮箱 获取用户对象
        """
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalars().first()
    
    async def get_user_by_id(self, user_id: int) -> User | None:
        """
            根据用户ID 获取用户对象
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def add_user(self, user: User) -> None:
        """
            添加用户对象到数据库
        """
        self.db.add(user)
