from pydantic import BaseModel,ConfigDict,Field
from datetime import datetime
from typing import List
from backend.schemas.documents import DocumentsResponse
 
# knowldge 基础类型 传入的
class KnowledgeBase(BaseModel):
    name: str
    description: str | None = None 

class KnowledgeBaseCreate(KnowledgeBase):
    """创建知识库请求体"""
    pass
class KnowledgeBaseUpdate(KnowledgeBase):
    """更新知识库请求体"""
    pass
# 
class KnowledgeDetailResponse(KnowledgeBase):
    """ 
    返回给前端的知识库列表响应格式 
    注意 和 KnowledgeResponse的区别 这个是细节的格式 有documents字段
    因为列表接口返回 documents字段 会由于异步操作 去进行一个同步的操作（懒操作） 导致报错！！！ 
    """
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    documents: List[DocumentsResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True) # 自动适配orm里面的配置

class KnowledgeResponse(KnowledgeBase):
    """ 返回给前端的响应格式 """
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    #documents: List[DocumentsResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True) # 自动适配orm里面的配置