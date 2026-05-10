from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.chat.service import chat_kb, query_kb
from backend.app.v1.auth.service import get_current_user
from backend.db.my_sql.connect import get_db
from backend.models.user import User
from backend.schemas.chat import (ChatRequest, ChatResponse, QueryRequest,
                                  QueryResponse)

chat_router = APIRouter(prefix="/api/knowledge_base", tags=["chat"])


@chat_router.post("/{kb_id}/query", response_model=QueryResponse)
async def query_kb_endpoint(
    kb_id: int,
    req: QueryRequest,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await query_kb(kb_id, req, cur_user.id, db)


@chat_router.post("/{kb_id}/chat", response_model=ChatResponse)
async def chat_kb_endpoint(
    kb_id: int,
    req: ChatRequest,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await chat_kb(kb_id, req, cur_user.id, db)

