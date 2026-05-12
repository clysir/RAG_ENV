"""
    用于RagRun的curd操作
"""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.rag_runs import RagRun


class RagRunCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    
    async def create_rag_run(
            self,
            *,
            user_id: int,
            run_type: str,
            question: str,
            top_k: int,
            knowledge_base_id: int | None = None,
            kb_ids: list[int] | None = None,
            document_ids: list[int] | None = None,
            answer: str | None = None,
            model_provider: str | None = None,
            model_name: str | None = None,
            sources: list[dict[str, Any]] | None = None,
            latency_ms: int | None = None,
            status: str = "success",
            error_message: str | None = None,
        ) -> RagRun:
            rag_run = RagRun(
                user_id=user_id,
                knowledge_base_id=knowledge_base_id,
                kb_ids_json=kb_ids,
                run_type=run_type,
                question=question,
                answer=answer,
                model_provider=model_provider,
                model_name=model_name,
                top_k=top_k,
                document_ids_json=document_ids,
                sources_json=sources,
                latency_ms=latency_ms,
                status=status,
                error_message=error_message,
            )

            self.db.add(rag_run)
            await self.db.commit()
            await self.db.refresh(rag_run)

            return rag_run


    async def list_rag_runs_by_user(
        self,
        *,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        run_type: str | None = None,
        status: str | None = None,
    ) -> list[RagRun]:
        offset = (page - 1) * page_size

        stmt = select(RagRun).where(RagRun.user_id == user_id)

        if run_type:
            stmt = stmt.where(RagRun.run_type == run_type)

        if status:
            stmt = stmt.where(RagRun.status == status)

        stmt = (
            stmt.order_by(RagRun.id.desc()) #按照run.id倒序排列，最新的在前面
            .offset(offset)
            .limit(page_size + 1)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_rag_run_by_id_for_user(
        self,
        *,
        run_id: int,
        user_id: int,
    ) -> RagRun | None:
        stmt = select(RagRun).where(
            RagRun.id == run_id,
            RagRun.user_id == user_id,
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()