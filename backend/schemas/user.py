from pydantic import BaseModel,EmailStr,field_validator,ConfigDict
from datetime import datetime

# User基础的类型 
class UserBase (BaseModel):
    username: str
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False

# 创建用户的类型 继承自UserBase 
class UserCreate (UserBase):
    password: str

    # 简单验证密码长度
    @field_validator('password') # 这个装饰器的作用是 指定这个方法是用来验证password字段的
    @classmethod
    def validate_password(cls, value: str) -> str:  
        if len(value) < 6:
            raise ValueError("密码长度必须至少为6个字符")
        return value


# 返回给前端的 用户响应类型 无密码
class UserResponse (UserBase):
    id: int
    created_at: datetime
    updated_at: datetime  

    model_config = ConfigDict(from_attributes=True) # 自动适配orm里面的配置

# 登录成功后返回给前端的 token响应类型
class TokenResponse(BaseModel):

    access_token: str
    token_type: str = "bearer"