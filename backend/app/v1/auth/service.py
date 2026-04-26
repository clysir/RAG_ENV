from fastapi import Depends,HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.my_sql.connect import get_db
from backend.schemas.user import UserCreate
from backend.models.user import User
from backend.app.v1.auth.crud import UserCrud
from backend.core.security import password_hash,password_verify,create_access_token,oauth2_scheme
from datetime import timedelta
from typing import Any, Dict
import jwt
from backend.config.cfg import settings
async def user_register(user_in : UserCreate, db: AsyncSession) -> User:
    """
        用户注册处理函数
    """
    repo = UserCrud(db)

    # 检查用户名是否已存在
    if await repo.get_user_by_username(user_in.username):
        raise ValueError("用户名已存在")
    # 检查邮箱是否已存在
    if await repo.get_user_by_email(user_in.email):
        raise ValueError("邮箱已存在")
    hashed_password = password_hash(user_in.password) # 对密码进行哈希处理
    # 创建用户对象
    user = User(
        username = user_in.username,
        email = user_in.email,
        hashed_password = hashed_password # 这里应该对密码进行哈希处理 后续处理
    )

    await repo.add_user(user)
    await db.commit() # 提交事务
    await db.refresh(user) # 刷新用户对象 获取数据库生成的ID等信息
    return user


async def login_access_token(username: str, password: str, db: AsyncSession) -> Dict[str, Any]:
    """
        用户登录处理函数
    """
    repo = UserCrud(db)
    user = await repo.get_user_by_username(username)
    if not user or not password_verify(password, user.hashed_password):
        raise ValueError("用户名或密码错误")
    if not user.is_active:
        raise ValueError("用户已被禁用")
    
    # 访问令牌过期时间 这里设置为30分钟 后续可以改成配置项
    access_token_expire = timedelta(minutes=30) 
    # 生成访问令牌
    access_token = create_access_token(
        data = {"sub": user.username}, expires_delta = access_token_expire
    )
    return {"access_token": access_token, "token_type": "bearer"}

# 注意这个不是服务层函数 这个函数是一个依赖项 用于获取当前用户
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """
        获取当前用户的函数
    """
    #从 JWT Token 中解析出当前用户
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据，请检查 Token 是否有效或已过期",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # 解析 JWT Token 获取用户名
    try: 
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    # 根据用户名获取用户对象
    user = await UserCrud(db).get_user_by_username(username)

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户未激活",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user