from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.v1.auth.service import (get_current_user, login_access_token,
                                         user_register)
from backend.db.my_sql.connect import get_db
from backend.models.user import User
from backend.schemas.user import TokenResponse, UserCreate, UserResponse

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


# 注册
@auth_router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):

    user = await user_register(user_in, db)
    return user


# 登录
@auth_router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):

    return await login_access_token(form_data.username, form_data.password, db)


# 访问个人信息 用于测试token是否有效 后续可以改成访问其他需要认证的接口
@auth_router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):

    return current_user
