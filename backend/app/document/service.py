from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.documents import Documents
from fastapi import (
    UploadFile,
    HTTPException,
    status
)
from backend.app.knowledge_base.crud import KbCrud
from backend.app.document.crud import DocCrud
from backend.db.minio.client import get_minio_client
from typing import List
import hashlib
from io import BytesIO
from uuid import uuid4
from minio.error import S3Error
from backend.config.cfg import settings

"""
    当前版本简化流程
    1.检查是否存在这个kb库
    2. 如果存在把文件上传至 minio里去
    3. 把文件信息 存储到数据库里去
"""
async def upload_kb_documents(
    kb_id: int,
    files: list[UploadFile],
    user_id: int,
    db: AsyncSession
) -> List[Documents]: 
    repo = KbCrud(db)
    kb = await repo.get_owned_kb(user_id, kb_id)
    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"知识库(ID:{kb_id})不存在或您无权上传文件"
        )
    
    minio_client = get_minio_client()
    saved_docs: list[Documents] = []

    for file in files:
        if not file.filename:
            raise HTTPException(status_code=400, detail="文件名不能为空")

        file_content = await file.read()
        if not file_content:
            raise HTTPException(status_code=400, detail=f"文件 {file.filename} 为空")

        file_size = len(file_content)
        file_hash = hashlib.sha256(file_content).hexdigest()
        content_type = file.content_type or "application/octet-stream"

        # 避免同名文件冲突
        object_name = f"kb_{kb_id}/{uuid4().hex}_{file.filename}"

        # 2. 上传到 MinIO
        try:
            minio_client.put_object(
                bucket_name=settings.minio_bucket_name,
                object_name=object_name,
                data=BytesIO(file_content),
                length=file_size,
                content_type=content_type,
            )
        except S3Error as e:
            raise HTTPException(status_code=500, detail=f"上传到 MinIO 失败: {e}") from e

        # 3. 写入 documents 表
        doc = Documents(
            knowledge_base_id=kb_id,
            file_name=file.filename,
            file_path=object_name,
            file_size=file_size,
            content_type=content_type,
            file_hash=file_hash,
            status="uploaded",
        )
        db.add(doc)
        saved_docs.append(doc)

    await db.commit()

    for doc in saved_docs:
        await db.refresh(doc)

    return saved_docs


async def process_kb_documents(
    kb_id: int,
    doc_id: int,
    user_id: int,
    db: AsyncSession
):
    """
        目前此函数只负责返回 任务正在处理 不执行具体的处理任务逻辑
    """
    kb = await KbCrud(db).get_owned_kb(user_id, kb_id)
    if not kb:
        raise HTTPException(
            status_code=404,
            detail=f"知识库ID:{kb_id}不存在或您无权限访问",
        )

    doc = await DocCrud(db).get_doc_by_id(doc_id)
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"文档(ID:{doc_id})不存在",
        )

    if doc.knowledge_base_id != kb_id:
        raise HTTPException(
            status_code=400,
            detail="文档不属于当前知识库",
        )

    if doc.status == "processing":
        raise HTTPException(status_code = 400, detail = "文档处理中，请勿重复提交。")

    # 1. 标记 processing
    doc.status = "processing"
    await db.commit()
    
    return {
        "doc_id":doc.id,
        "kb_id": kb.id,
        "status": doc.status,
        "message": "文档处理任务提交成功！"
    }


async def get_kb_documents_status(
    kb_id: int,
    doc_id: int,
    user_id: int,
    db: AsyncSession
):
    """
        查询文档状态
    """
    kb = await KbCrud(db).get_owned_kb(user_id, kb_id)
    if not kb:
        raise HTTPException(status_code= 404, detail = f"知识库(ID:{kb.id})不存在或您无权限访问")

    doc = await DocCrud(db).get_doc_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code= 404, detail = f"文档(ID:{doc.id})不存在")
    
    if doc.knowledge_base_id != kb_id:
        raise HTTPException(status_code=400,detail="文档不属于当前知识库")

    return {
        "doc_id": doc.id,
        "kb_id": kb_id,
        "file_name": doc.file_name,
        "status": doc.status
    }