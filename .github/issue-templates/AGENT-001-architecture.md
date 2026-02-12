# AGENT-001: Agent架构搭建

## 目标
搭建图谱Agent助手的整体架构，支持智能生成、验证、检索能力。

## 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Service (Python/FastAPI)            │
│  Port: 3002                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Core Layer                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   NLU Engine │  │ LLM Service  │  │   Memory     │  │   │
│  │  │              │  │              │  │   (Redis)    │  │   │
│  │  │ • 意图识别   │  │ • Kimi 2.5   │  │              │  │   │
│  │  │ • 实体抽取   │  │ • 流式输出   │  │ • 对话历史   │  │   │
│  │  │ • 槽位填充   │  │ • 函数调用   │  │ • 上下文缓存 │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Tool Registry                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ OAGGen   │ │ Validate │ │  Search  │ │  Analyze │   │   │
│  │  │ Tool     │ │   Tool   │ │   Tool   │ │   Tool   │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Knowledge Layer                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Schema     │  │     OAG      │  │   Vector     │  │   │
│  │  │   Store      │  │    Store     │  │   Store      │  │   │
│  │  │              │  │              │  │   (FAISS)    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 技术栈

| 组件 | 技术选择 | 版本 |
|------|----------|------|
| Web框架 | FastAPI | 0.104+ |
| LLM API | Kimi 2.5 (Moonshot) | latest |
| 向量检索 | FAISS | 1.7+ |
| 缓存 | Redis | 7+ |
| 任务队列 | Celery | 5.3+ |

## 项目结构

```
agent-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI入口
│   ├── config.py            # 配置管理
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── agent.py     # Agent对话API
│   │   │   ├── generate.py  # 生成API
│   │   │   ├── search.py    # 检索API
│   │   │   └── tools.py     # 工具API
│   │   └── deps.py          # 依赖注入
│   ├── core/
│   │   ├── __init__.py
│   │   ├── nlu.py           # NLU引擎
│   │   ├── llm.py           # LLM服务封装
│   │   └── memory.py        # 对话记忆
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── base.py          # 工具基类
│   │   ├── oag_generator.py # OAG生成工具
│   │   ├── validator.py     # 验证工具
│   │   ├── searcher.py      # 检索工具
│   │   └── analyzer.py      # 分析工具
│   ├── services/
│   │   ├── __init__.py
│   │   ├── schema_service.py
│   │   ├── oag_service.py
│   │   └── vector_service.py
│   └── models/
│       ├── __init__.py
│       ├── requests.py      # 请求模型
│       └── responses.py     # 响应模型
├── tests/
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## API端点设计

```python
# Agent对话
POST /api/v1/agent/chat
Request: {
  "session_id": "uuid",
  "message": "创建一个智能驾驶研发体系图谱",
  "context": {
    "schema_id": "optional",
    "oag_id": "optional"
  }
}

# 工具调用
POST /api/v1/agent/tools/call
Request: {
  "tool_name": "oag_generator",
  "parameters": {
    "description": "智能驾驶研发体系",
    "schema_id": "core-domain-schema-v2"
  }
}
```

## 工作量估算
- **总工时**: 40h
- **项目搭建**: 8h
- **NLU引擎**: 8h
- **LLM服务封装**: 8h
- **Tool Registry**: 8h
- **API实现**: 8h

## 依赖
- Kimi 2.5 API Key
- Redis服务
- 向量存储(FAISS)

## 验收标准
- [ ] FastAPI服务启动成功
- [ ] /health端点返回healthy
- [ ] 与主后端服务通信正常
- [ ] Docker容器化部署成功
- [ ] API文档(Swagger)可访问

## 集成点
- 主后端: `backend/src/server.js` (通过HTTP调用)
- 前端: `frontend/src/services/agentApi.js` (新建)
