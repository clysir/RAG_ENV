from pydantic import BaseModel,ConfigDict
from datetime import datetime

class DocumentsBase(BaseModel):
    file_name: str
    file_path: str
    file_size: int
    file_hash: str
    content_type: str
    status: str

class DocumentsCreate(DocumentsBase):
    """创建文档请求体"""
    knowledge_base_id: int

class DocumentsResponse(DocumentsBase):
    id: int
    knowledge_base_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True) # 自动适配orm里面的配置