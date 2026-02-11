# AGENT-002: LLM服务集成 (Kimi 2.5)

## 目标
集成Kimi 2.5 (Moonshot AI) 作为Agent的核心LLM服务。

## Kimi 2.5 特性
- **模型能力**: 支持128K上下文，强大的中文理解能力
- **函数调用**: 支持tool use/function calling
- **流式输出**: 支持SSE流式响应
- **知识截止**: 2024年

## 技术方案

### 1. 基础封装

```python
# app/core/llm.py
from openai import AsyncOpenAI
from typing import AsyncGenerator, List, Dict, Any

class KimiService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.KIMI_API_KEY,
            base_url="https://api.moonshot.cn/v1"
        )
        self.model = "kimi-k2-5"  # Kimi 2.5模型
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict] = None,
        stream: bool = False,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """
        与Kimi对话
        
        Args:
            messages: 对话历史 [{"role": "user", "content": "..."}]
            tools: 可用工具定义
            stream: 是否流式输出
            temperature: 创造性参数
        """
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=tools,
            stream=stream,
            temperature=temperature
        )
        
        if stream:
            async for chunk in response:
                yield chunk.choices[0].delta.content or ""
        else:
            yield response.choices[0].message.content
    
    async def function_call(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict]
    ) -> Dict[str, Any]:
        """调用工具/函数"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        if message.tool_calls:
            return {
                "type": "tool_call",
                "tool_calls": message.tool_calls
            }
        return {
            "type": "text",
            "content": message.content
        }
```

### 2. 提示词工程

```python
# app/core/prompts.py

# OAG生成提示词
OAG_GENERATION_PROMPT = """
你是一个专业的本体图谱工程师。请根据用户的业务描述，生成结构化的OAG图谱数据。

可用实体类型: {entity_types}
可用关系类型: {relation_types}

用户描述: {user_description}

请生成以下JSON格式的响应:
{{
  "entities": [
    {{
      "id": "唯一标识",
      "type": "实体类型代码",
      "label": "显示名称",
      "properties": {{}}
    }}
  ],
  "relations": [
    {{
      "source": "源实体ID",
      "target": "目标实体ID",
      "type": "关系类型代码",
      "properties": {{}}
    }}
  ],
  "explanation": "生成逻辑说明"
}}

要求:
1. 实体ID使用小写字母和下划线
2. 所有实体和关系必须符合Schema定义
3. 生成5-10个核心实体
4. explanation用中文说明生成思路
"""

# Schema生成提示词
SCHEMA_GENERATION_PROMPT = """
根据业务描述提取本体Schema，包含实体类型和关系类型。

业务描述: {description}

输出格式:
{{
  "entity_types": [
    {{
      "code": "类型代码",
      "label": "显示名称",
      "description": "类型描述",
      "properties": [...]
    }}
  ],
  "relation_types": [
    {{
      "code": "关系代码",
      "label": "显示名称",
      "source_type": "源实体类型",
      "target_type": "目标实体类型"
    }}
  ]
}}
"""

# 检索提示词
SEARCH_PROMPT = """
将用户的自然语言查询转换为图谱查询条件。

用户查询: {query}

可用实体类型: {entity_types}
可用属性: {properties}

输出:
{{
  "intent": "查询意图 (find/aggregate/path)",
  "entity_type": "目标实体类型",
  "filters": {{"属性": "值"}},
  "keywords": ["关键词"]
}}
"""
```

### 3. 流式响应处理

```python
# app/api/v1/agent.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """流式对话接口"""
    
    async def generate():
        kimi = KimiService()
        messages = await build_messages(request)
        
        async for chunk in kimi.chat(messages, stream=True):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

### 4. 前端集成

```typescript
// frontend/src/services/agentApi.ts
export class AgentService {
  async *chatStream(message: string): AsyncGenerator<string> {
    const response = await fetch('/api/v1/agent/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.content) yield data.content;
        }
      }
    }
  }
}
```

## 配置

```python
# app/config.py
class Settings:
    KIMI_API_KEY: str = os.getenv("KIMI_API_KEY")
    KIMI_BASE_URL: str = "https://api.moonshot.cn/v1"
    KIMI_MODEL: str = "kimi-k2-5"
    
    # 速率限制
    KIMI_RATE_LIMIT: int = 60  # 每分钟请求数
    KIMI_MAX_TOKENS: int = 8192
```

## 工作量估算
- **总工时**: 24h
- **API封装**: 8h
- **提示词工程**: 8h
- **流式响应**: 4h
- **前端集成**: 4h

## 验收标准
- [ ] 与Kimi API通信成功
- [ ] 流式响应正常
- [ ] 函数调用正常
- [ ] 错误处理完善
- [ ] 速率限制生效

## 依赖
- Kimi API Key (需要申请)
- OpenAI Python SDK
