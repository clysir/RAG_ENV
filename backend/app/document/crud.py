from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.documents import Documents
from sqlalchemy import select

class DocCrud:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_doc_by_id(self, doc_id: int) -> Documents | None:
        stmt = select(Documents).where(Documents.id == doc_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()