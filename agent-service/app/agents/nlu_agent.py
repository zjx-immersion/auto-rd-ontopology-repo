"""
NLU Agent - 自然语言理解
"""
import json
from app.graph.state import AgentState, Message
from app.core.llm_client import kimi_client, Message as LLMMessage
from app.prompts import load_prompt
import structlog

logger = structlog.get_logger()


class NLUAgent:
    """NLU解析Agent"""
    
    def __init__(self):
        self.name = "nlu_agent"
    
    async def run(self, state: AgentState) -> AgentState:
        """
        解析用户意图
        
        Args:
            state: 当前状态
            
        Returns:
            更新后的状态
        """
        logger.info("NLU Agent running", session_id=state["session_id"])
        
        user_input = state["user_input"]
        
        # 加载Prompt
        prompt = load_prompt(
            "nlu_parser",
            user_input=user_input,
            context=json.dumps(state.get("slots", {})),
            entity_types="Vehicle, Domain, Project, Epic, Feature, Task",
            relation_types="belongs_to, depends_on, contains, relates_to"
        )
        
        # 调用LLM
        messages = [
            LLMMessage(role="system", content="你是一个专业的自然语言理解助手。"),
            LLMMessage(role="user", content=prompt)
        ]
        
        try:
            response = await kimi_client.chat(messages)
            
            # 解析结果
            result = json.loads(response.content)
            
            # 更新状态
            state["intent"] = result.get("intent", "general_chat")
            state["entities"] = result.get("entities", [])
            state["slots"].update(result.get("slots", {}))
            state["agent_results"]["nlu"] = result
            
            # 添加助手消息
            state["messages"].append(Message(
                role="assistant",
                content=f"意图识别: {result.get('intent')}",
                name=self.name
            ))
            
            logger.info(
                "NLU parsing completed",
                intent=result.get("intent"),
                confidence=result.get("confidence")
            )
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse NLU result", error=str(e))
            state["intent"] = "general_chat"
            state["error"] = f"NLU解析失败: {str(e)}"
            
        except Exception as e:
            logger.error("NLU Agent error", error=str(e))
            state["intent"] = "general_chat"
            state["error"] = str(e)
        
        return state
