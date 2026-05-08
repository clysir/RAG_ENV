"""
    author: chenly
    date: 2026/5/8 13:23
    description: 模型工厂类，负责根据配置创建不同的模型实例
"""
from backend.config.cfg import settings
from langchain_openai import ChatOpenAI


def build_chat_model():
    """
        创建聊天模型
        当前支持：
        1. DeepSeek OpenAI-compatible-API
        2. ...
    """
    provider = settings.chat_provider.lower()
    if provider == "deepseek":
        if not settings.deepseek_api_key:
            raise RuntimeError("缺少DEEPSEEK_API_KEY配置项，请检查环境变量设置")
        # 这里setting太绝对了 之后要改成 一个通用的接口
        return ChatOpenAI(
            model = settings.deepseek_chat_model,
            api_key = settings.deepseek_api_key,
            base_url = settings.deepseek_base_url,
            temperature = settings.deepseek_temperature,
            max_tokens = settings.deepseek_max_tokens
        )

    raise ValueError(f"暂不支持的模型提供商: {settings.chat_provider}")