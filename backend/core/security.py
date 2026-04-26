import bcrypt
from datetime import datetime, timedelta, timezone
import jwt  
from fastapi.security import OAuth2PasswordBearer
from backend.config.cfg import settings 
# 这个是为了在 swager文档中显示登录接口的请求体格式  
# 因为前端发送的post请求 是一个 from_date 而不是json类型
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def password_hash(password: str) -> str:
    """
        密码哈希处理函数
    """
    # 这里可以使用bcrypt等库进行密码哈希处理 后续处理
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed_password.decode('utf-8') # 将字节类型转换为字符串类型


def password_verify(plain_password: str, hashed_password: str) -> bool:
    """
        密码验证函数
    """
    # 这里可以使用bcrypt等库进行密码验证 后续处理
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# 根据jwt生成token函数
def create_access_token(data : dict, expires_delta: timedelta | None = None) -> str:
    """
        生成JWT访问令牌的函数

        JWT 结构：Header. Payload. Signature
    - Header: {"alg": "HS256", "typ": "JWT"}
    - Payload: {"sub": username, "exp": 过期时间戳}
    - Signature: HMAC-SHA256(Header.Payload, SECRET_KEY)
    """
    # 1. 定义东八区 (UTC+8)
    tz_bj = timezone(timedelta(hours=8)) # 设置北京时间时区
    # 2. 获取当前的东八区时间（比如现在是广州的晚上 20:00）
    now_bj = datetime.now(tz_bj)

    to_encode = data.copy()
    if expires_delta:
        expire = now_bj + expires_delta
    else:
        expire = now_bj + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) # 默认15分钟过期
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM) #

    return encoded_jwt