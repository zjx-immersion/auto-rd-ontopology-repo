"""
配置管理
"""
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """应用配置"""
    
    # 应用信息
    APP_NAME: str = "Ontology Agent Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 3002
    
    # Kimi API 配置
    KIMI_API_KEY: str = ""
    KIMI_BASE_URL: str = "https://api.moonshot.cn/v1"
    KIMI_MODEL: str = "kimi-k2-5"
    KIMI_MAX_TOKENS: int = 8192
    KIMI_TEMPERATURE: float = 0.7
    KIMI_REQUEST_TIMEOUT: int = 60
    
    # 速率限制
    KIMI_RATE_LIMIT_PER_MINUTE: int = 60
    
    # Vector Store 配置
    VECTOR_STORE_PATH: str = "./data/vectors"
    EMBEDDING_DIMENSION: int = 1536
    
    # Redis 配置 (用于对话记忆)
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_TTL: int = 3600  # 1小时
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # 主后端服务地址
    BACKEND_API_URL: str = "http://localhost:8090/api/v1"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 全局配置实例
settings = Settings()


# Agent 配置
AGENT_CONFIG = {
    "max_iterations": 10,
    "timeout_seconds": 120,
    "max_history_messages": 20,
}

# 工具配置
TOOL_CONFIG = {
    "oag_generator": {
        "max_entities": 50,
        "max_relations": 100,
    },
    "schema_validator": {
        "strict_mode": True,
    },
    "search": {
        "top_k": 10,
        "min_score": 0.7,
    }
}
