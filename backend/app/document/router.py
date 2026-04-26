from backend.schemas.documents import DocumentsResponse
from fastapi import Depends, UploadFile, APIRouter,File
from backend.db.my_sql.connect import get_db
from backend.app.v1.auth.service import get_current_user
from backend.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.document.service import _upload_kb_documents
from typing import List

# 这是子路由 嵌套到父路由上 ---> knowledge_base
doc_router = APIRouter(prefix = "/api/knowledge_base" ,tags=["documents"])

# 提交文档接口
@doc_router.post("/{kb_id}/documents/upload", response_model=List[DocumentsResponse])
async def upload_kb_documents(
    kb_id: int,
    # 不添加这句 会导致 swagger 文档里无法正确显示上传文件的请求体格式 ---> 加了也很丑
    files: list[UploadFile] = File(..., description="选择要上传的文件列表"),
    #files: UploadFile = File(..., description="选择要上传的文件列表"),
    cur_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):   
    try:
        return await _upload_kb_documents(kb_id, files, cur_user.id, db)
    except Exception as e:
        raise e

