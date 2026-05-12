from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.chat.run_service import (
    get_list_rag_runs,
    get_rag_run_detail,
)
from backend.app.v1.auth.service import get_current_user
from backend.db.my_sql.connect import get_db
from backend.models.user import User
from backend.schemas.rag_run import (
    RagRunDetail,
    RagRunListResponse,
)
from backend.schemas.chat import (MultiKbChatRequest, MultiKbQueryRequest,
                                  ChatResponse, QueryResponse)
from backend.app.chat.service import chat_kbs, query_kbs

rag_run_router = APIRouter(
    prefix="/api/rag/runs",tags=["rag-runs"],
)


@rag_run_router.post("/query", response_model=QueryResponse)
async def query_kbs_endpoint(
    req: MultiKbQueryRequest,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await query_kbs(req, cur_user.id, db)


@rag_run_router.post("/chat", response_model=ChatResponse)
async def chat_kbs_endpoint(
    req: MultiKbChatRequest,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await chat_kbs(req, cur_user.id, db)


@rag_run_router.get("", response_model=RagRunListResponse)
async def get_list_rag_runs_endpoint(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    run_type: str | None = Query(default=None, description="query / chat"),
    status: str | None = Query(default=None, description="success / failed"),
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_list_rag_runs(
        user_id=cur_user.id,
        db=db,
        page=page,
        page_size=page_size,
        run_type=run_type,
        status=status,
    )


@rag_run_router.get("/{run_id}", response_model=RagRunDetail)
async def get_rag_run_detail_endpoint(
    run_id: int,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_rag_run_detail(
        run_id=run_id,
        user_id=cur_user.id,
        db=db,
    )