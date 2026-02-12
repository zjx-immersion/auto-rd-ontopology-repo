"""
FastAPI 主应用入口
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import uuid
import json

from app.config import settings
from app.graph.workflow import agent_graph
import structlog

# 配置日志
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="基于LangGraph的本体图谱Agent服务"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应配置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== 请求/响应模型 ==============

class ChatRequest(BaseModel):
    """聊天请求"""
    message: str
    session_id: Optional[str] = None
    context: Optional[dict] = {}


class ChatResponse(BaseModel):
    """聊天响应"""
    session_id: str
    response: str
    intent: Optional[str] = None
    entities: Optional[list] = []
    oag_data: Optional[dict] = None


class OAGGenerateRequest(BaseModel):
    """OAG生成请求"""
    description: str
    schema_id: Optional[str] = "default"
    session_id: Optional[str] = None


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    version: str


# ============== API端点 ==============

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION
    )


@app.post("/api/v1/agent/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Agent对话接口
    
    接收用户消息，返回Agent处理结果
    """
    session_id = request.session_id or str(uuid.uuid4())
    
    logger.info(
        "Chat request received",
        session_id=session_id,
        message=request.message
    )
    
    try:
        # 执行Agent图
        result = await agent_graph.run(session_id, request.message)
        
        return ChatResponse(
            session_id=session_id,
            response=result.get("final_response", "处理完成"),
            intent=result.get("intent"),
            entities=result.get("entities", []),
            oag_data={
                "entities": [
                    {"id": e.id, "type": e.type, "label": e.label}
                    for e in result.get("entities_to_create", [])
                ],
                "relations": [
                    {"source": r.source, "target": r.target, "type": r.type}
                    for r in result.get("relations_to_create", [])
                ]
            } if result.get("entities_to_create") else None
        )
        
    except Exception as e:
        logger.error("Chat processing error", error=str(e), session_id=session_id)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/agent/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    流式对话接口
    
    使用SSE返回流式响应
    """
    session_id = request.session_id or str(uuid.uuid4())
    
    async def generate() -> AsyncGenerator[str, None]:
        try:
            # 发送开始标记
            yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"
            
            # 执行Agent图
            result = await agent_graph.run(session_id, request.message)
            
            # 分段发送响应
            response = result.get("final_response", "")
            chunk_size = 20  # 每20个字符一个片段
            
            for i in range(0, len(response), chunk_size):
                chunk = response[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            
            # 发送完成标记
            yield f"data: {json.dumps({'type': 'end', 'intent': result.get('intent')})}\n\n"
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            logger.error("Stream error", error=str(e))
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/api/v1/oag/generate")
async def generate_oag(request: OAGGenerateRequest):
    """
    直接生成OAG接口
    
    根据描述直接生成OAG数据
    """
    session_id = request.session_id or str(uuid.uuid4())
    
    logger.info(
        "OAG generation request",
        session_id=session_id,
        description=request.description[:100]
    )
    
    try:
        # 构建生成指令
        instruction = f"创建一个OAG图谱: {request.description}"
        
        result = await agent_graph.run(session_id, instruction)
        
        return {
            "success": not bool(result.get("error")),
            "session_id": session_id,
            "entities": [
                {
                    "id": e.id,
                    "type": e.type,
                    "label": e.label,
                    "properties": e.properties
                }
                for e in result.get("entities_to_create", [])
            ],
            "relations": [
                {
                    "source": r.source,
                    "target": r.target,
                    "type": r.type,
                    "label": r.label,
                    "properties": r.properties
                }
                for r in result.get("relations_to_create", [])
            ],
            "explanation": result.get("agent_results", {}).get("oag_generator", {}).get("explanation", "")
        }
        
    except Exception as e:
        logger.error("OAG generation error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/schema/{schema_id}")
async def get_schema(schema_id: str):
    """获取Schema定义"""
    # 实际应从主后端服务获取
    return {
        "id": schema_id,
        "version": "1.0.0",
        "entityTypes": {},
        "relationTypes": {}
    }


# ============== 启动事件 ==============

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info(
        f"{settings.APP_NAME} starting",
        version=settings.APP_VERSION,
        debug=settings.DEBUG
    )


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info(f"{settings.APP_NAME} shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
