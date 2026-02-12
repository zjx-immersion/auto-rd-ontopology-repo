"""
LLM 客户端 - 直接使用HTTP调用Kimi API，不依赖LangChain
"""
import httpx
import json
from typing import AsyncGenerator, Dict, List, Any, Optional
from app.config import settings
import structlog

logger = structlog.get_logger()


class Message:
    """消息类"""
    def __init__(self, role: str, content: str, **kwargs):
        self.role = role
        self.content = content
        self.extra = kwargs
    
    def to_dict(self) -> Dict[str, Any]:
        base = {"role": self.role, "content": self.content}
        base.update(self.extra)
        return base


class LLMResponse:
    """LLM响应类"""
    def __init__(
        self,
        content: str,
        usage: Optional[Dict] = None,
        model: str = "",
        finish_reason: str = "",
        tool_calls: Optional[List] = None
    ):
        self.content = content
        self.usage = usage or {}
        self.model = model
        self.finish_reason = finish_reason
        self.tool_calls = tool_calls or []


class KimiClient:
    """Kimi API 客户端 - 使用连接池复用HTTP连接"""
    
    _client: Optional[httpx.AsyncClient] = None
    
    def __init__(self):
        self.api_key = settings.KIMI_API_KEY
        self.base_url = settings.KIMI_BASE_URL
        self.model = settings.KIMI_MODEL
        self.max_tokens = settings.KIMI_MAX_TOKENS
        self.temperature = settings.KIMI_TEMPERATURE
        self.timeout = settings.KIMI_REQUEST_TIMEOUT
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    @classmethod
    def get_client(cls) -> httpx.AsyncClient:
        """获取共享的HTTP客户端（连接池）"""
        if cls._client is None:
            # 创建带连接池的客户端
            limits = httpx.Limits(
                max_keepalive_connections=20,  # 最大保持连接数
                max_connections=100,            # 最大连接数
                keepalive_expiry=30.0          # 连接保持时间（秒）
            )
            cls._client = httpx.AsyncClient(
                limits=limits,
                timeout=httpx.Timeout(60.0, connect=10.0)
            )
        return cls._client
    
    @classmethod
    async def close_client(cls):
        """关闭HTTP客户端"""
        if cls._client is not None:
            await cls._client.aclose()
            cls._client = None
    
    async def chat(
        self,
        messages: List[Message],
        tools: Optional[List[Dict]] = None,
        stream: bool = False,
        temperature: Optional[float] = None,
        **kwargs
    ) -> LLMResponse:
        """
        发送聊天请求
        
        Args:
            messages: 消息列表
            tools: 工具定义
            stream: 是否流式输出
            temperature: 温度参数
            
        Returns:
            LLMResponse
        """
        url = f"{self.base_url}/chat/completions"
        
        payload = {
            "model": self.model,
            "messages": [m.to_dict() for m in messages],
            "max_tokens": self.max_tokens,
            "temperature": temperature or self.temperature,
            "stream": stream,
            **kwargs
        }
        
        if tools:
            payload["tools"] = tools
        
        client = self.get_client()
        try:
            response = await client.post(
                url,
                headers=self.headers,
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            
            choice = data["choices"][0]
            message = choice["message"]
            
            return LLMResponse(
                content=message.get("content", ""),
                usage=data.get("usage", {}),
                model=data.get("model", self.model),
                finish_reason=choice.get("finish_reason", ""),
                tool_calls=message.get("tool_calls", [])
            )
            
        except httpx.HTTPError as e:
            logger.error("Kimi API request failed", error=str(e))
            raise
        except Exception as e:
            logger.error("Unexpected error in Kimi chat", error=str(e))
            raise
    
    async def chat_stream(
        self,
        messages: List[Message],
        tools: Optional[List[Dict]] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        流式聊天
        
        Args:
            messages: 消息列表
            tools: 工具定义
            temperature: 温度参数
            
        Yields:
            内容片段
        """
        url = f"{self.base_url}/chat/completions"
        
        payload = {
            "model": self.model,
            "messages": [m.to_dict() for m in messages],
            "max_tokens": self.max_tokens,
            "temperature": temperature or self.temperature,
            "stream": True,
            **kwargs
        }
        
        if tools:
            payload["tools"] = tools
        
        client = self.get_client()
        async with client.stream(
            "POST",
            url,
            headers=self.headers,
            json=payload,
            timeout=self.timeout
        ) as response:
            response.raise_for_status()
            
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    
                    try:
                        data = json.loads(data_str)
                        delta = data["choices"][0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                        except json.JSONDecodeError:
                            continue
                        except Exception as e:
                            logger.warning("Error parsing stream data", error=str(e))
                            continue
    
    async def function_call(
        self,
        messages: List[Message],
        tools: List[Dict],
        tool_choice: str = "auto"
    ) -> LLMResponse:
        """
        函数调用
        
        Args:
            messages: 消息列表
            tools: 工具定义
            tool_choice: 工具选择策略
            
        Returns:
            LLMResponse (包含tool_calls)
        """
        url = f"{self.base_url}/chat/completions"
        
        payload = {
            "model": self.model,
            "messages": [m.to_dict() for m in messages],
            "tools": tools,
            "tool_choice": tool_choice,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                url,
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            choice = data["choices"][0]
            message = choice["message"]
            
            return LLMResponse(
                content=message.get("content", ""),
                usage=data.get("usage", {}),
                model=data.get("model", self.model),
                finish_reason=choice.get("finish_reason", ""),
                tool_calls=message.get("tool_calls", [])
            )


# 全局客户端实例
kimi_client = KimiClient()
