from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select,delete

from backend.models.document_chunks import DocumentChunk
class ChunkCrud:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_vector_ids_by_doc_id(self, doc_id: int) -> list[str]: 
        """
            通过doc_id 获取他的一堆 vector_id
        """
        stmt = select(DocumentChunk.vector_id).where(
            DocumentChunk.document_id == doc_id
        )  
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_by_doc_id(self, doc_id : int) -> None: 
        """
            通过doc_id 删除 Chunk
        """
        stmt = delete(DocumentChunk).where(
            DocumentChunk.document_id == doc_id
        )
        await self.db.execute(stmt)


    async def add_chunks(self, chunks: list[DocumentChunk]) -> None:
        self.db.add_all(chunks)