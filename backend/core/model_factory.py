"""
author: chenly
date: 2026/5/8 13:23
description: 模型工厂类，负责根据配置创建不同的模型实例
"""

from langchain_openai import ChatOpenAI
from langchain_ollama import OllamaEmbeddings

from backend.config.cfg import settings


def build_embedding_model():
    """
    创建向量化模型
    当前支持：
    1. Ollama Embeddings
    2. ...
    """
    provider = settings.embedding_provider.lower()
    if provider == "ollama":
        return OllamaEmbeddings(
            model=settings.embedding_model,
            base_url=settings.embedding_base_url,
        )

    raise ValueError(f"暂不支持的向量化模型提供商: {settings.embedding_provider}")


def build_chat_model():
    """
    创建聊天模型
    当前支持：
    1. DeepSeek OpenAI-compatible-API
    2. ...
    """
    provider = settings.chat_model_provider.lower()
    if provider == "deepseek":
        if not settings.chat_model_api_key:
            raise RuntimeError("缺少CHAT_MODEL_API_KEY配置项，请检查环境变量设置")
        return ChatOpenAI(
            model=settings.chat_model_name,
            api_key=settings.chat_model_api_key,
            base_url=settings.chat_model_base_url,
            temperature=settings.chat_model_temperature,
            max_tokens=settings.chat_model_max_tokens,
        )

    raise ValueError(f"暂不支持的模型提供商: {settings.chat_provider}")
