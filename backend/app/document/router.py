from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.document.service import (get_kb_documents_status,
                                          process_kb_documents,
                                          upload_kb_documents)
from backend.app.document.tasks import run_process_document_task
from backend.app.v1.auth.service import get_current_user
from backend.db.my_sql.connect import get_db
from backend.models.user import User
from backend.schemas.documents import (DocumentProcessResponse,
                                       DocumentsResponse,
                                       DocumentStatusResponse)

# 这是子路由 嵌套到父路由上 ---> knowledge_base
doc_router = APIRouter(prefix="/api/knowledge_base", tags=["documents"])


# 提交文档接口
@doc_router.post("/{kb_id}/documents/upload", response_model=List[DocumentsResponse])
async def upload_kb_documents_endpoint(
    kb_id: int,
    # 不添加这句 会导致 swagger 文档里无法正确显示上传文件的请求体格式 ---> 加了也很丑
    # files: list[UploadFile] = File(..., description="选择要上传的文件列表"),
    files: UploadFile = File(..., description="选择要上传的文件列表"),
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    return await upload_kb_documents(
        kb_id,
        [
            files
        ],  # 若改成[files] 就可以解决 多文件上传时 swagger无法显示 上传文件格式问题 --> 但这样就会导致只能上传一个文件
        cur_user.id,
        db,
    )


# 文档处理接口
@doc_router.post(
    "/{kb_id}/documents/{doc_id}/process", response_model=DocumentProcessResponse
)
async def process_kb_documents_endpoint(
    kb_id: int,
    doc_id: int,
    background_task: BackgroundTasks,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    接口会立即返回 不会等待 embedding完成
    """
    result = await process_kb_documents(kb_id, doc_id, cur_user.id, db)
    background_task.add_task(run_process_document_task, kb_id, doc_id)
    return result


#  查询文档状态接口
@doc_router.post(
    "/{kb_id}/documents/{doc_id}/status", response_model=DocumentStatusResponse
)
async def get_kb_documents_status_endpoint(
    kb_id: int,
    doc_id: int,
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await get_kb_documents_status(kb_id, doc_id, cur_user.id, db)
    return result
