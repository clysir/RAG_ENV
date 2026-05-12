from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession 

from backend.models.rag_runs import RagRun
from backend.schemas.rag_run import RagRunSummary, RagRunDetail, RagRunListResponse 
from backend.app.chat.run_crud import RagRunCrud


def build_answer_preview(
    answer: str | None, max_length: int = 40
) -> str | None:
    if not answer:
        return None
    
    if len(answer) <= max_length:
        return answer

    return answer[:max_length] + "..."


def build_list_item(rag_run: RagRun) -> RagRunSummary:
    return RagRunSummary(
        id=rag_run.id,
        run_type=rag_run.run_type,
        user_id=rag_run.user_id,
        knowledge_base_id=rag_run.knowledge_base_id,
        kb_ids=rag_run.kb_ids_json,
        document_ids=rag_run.document_ids_json,
        question=rag_run.question,
        answer_preview=build_answer_preview(rag_run.answer),
        model_provider=rag_run.model_provider,
        model_name=rag_run.model_name,
        top_k=rag_run.top_k,
        latency_ms=rag_run.latency_ms,
        status=rag_run.status,
        created_at=getattr(rag_run, "created_at", None),
    )

def build_detail(rag_run: RagRun) -> RagRunDetail:
    return RagRunDetail(
        id=rag_run.id,
        run_type=rag_run.run_type,
        user_id=rag_run.user_id,
        knowledge_base_id=rag_run.knowledge_base_id,
        kb_ids=rag_run.kb_ids_json,
        document_ids=rag_run.document_ids_json,
        question=rag_run.question,
        answer=rag_run.answer,
        model_provider=rag_run.model_provider,
        model_name=rag_run.model_name,
        top_k=rag_run.top_k,
        latency_ms=rag_run.latency_ms,
        status=rag_run.status,
        error_message=rag_run.error_message,
        created_at=getattr(rag_run, "created_at", None),
        updated_at=getattr(rag_run, "updated_at", None),
    )


async def get_list_rag_runs(
    user_id: int,
    db: AsyncSession,
    page: int = 1, 
    page_size: int = 20, 
    run_type: str | None = None, 
    status: str | None = None
):
    rag_runs = await RagRunCrud(db).list_rag_runs_by_user(
        user_id=user_id,
        page=page,
        page_size=page_size,
        run_type=run_type,
        status=status
    )

    has_more = len(rag_runs) > page_size
    items = rag_runs[:page_size]

    return RagRunListResponse(
        page=page,
        page_size=page_size,
        has_more=has_more,
        items=[build_list_item(rag_run) for rag_run in items],
    )


async def get_rag_run_detail(
    run_id: int,
    user_id: int,
    db: AsyncSession,
) -> RagRunDetail:
    rag_run = await RagRunCrud(db).get_rag_run_by_id_for_user(
        run_id=run_id,
        user_id=user_id,
    )

    if not rag_run:
        raise HTTPException(
            status_code=404,
            detail=f"RAG Run(ID:{run_id}) 不存在或无权限访问",
        )

    return build_detail(rag_run)