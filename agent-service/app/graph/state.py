"""
LangGraph 状态定义
"""
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from dataclasses import dataclass, field
import operator


@dataclass
class Message:
    """对话消息"""
    role: str  # system, user, assistant, tool
    content: str
    name: Optional[str] = None  # 用于区分不同agent
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None


@dataclass
class Entity:
    """实体"""
    id: str
    type: str
    label: str
    properties: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Relation:
    """关系"""
    id: str
    source: str
    target: str
    type: str
    label: str = ""
    properties: Dict[str, Any] = field(default_factory=dict)


class AgentState(TypedDict):
    """
    Agent状态定义
    
    这是LangGraph的主状态，贯穿整个执行流程
    """
    # 对话相关
    messages: Annotated[List[Message], operator.add]
    session_id: str
    
    # 用户输入
    user_input: str
    
    # NLU解析结果
    intent: Optional[str]
    entities: List[Dict[str, Any]]
    slots: Dict[str, Any]
    
    # 当前活跃Agent
    current_agent: Optional[str]
    
    # Agent执行结果
    agent_results: Dict[str, Any]
    
    # OAG相关
    oag_id: Optional[str]
    schema_id: Optional[str]
    entities_to_create: List[Entity]
    relations_to_create: List[Relation]
    
    # 工具调用
    tool_calls: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]
    
    # 执行控制
    iteration_count: int
    max_iterations: int
    should_continue: bool
    
    # 输出
    final_response: Optional[str]
    error: Optional[str]


def create_initial_state(session_id: str, user_input: str) -> AgentState:
    """创建初始状态"""
    return AgentState(
        messages=[Message(role="user", content=user_input)],
        session_id=session_id,
        user_input=user_input,
        intent=None,
        entities=[],
        slots={},
        current_agent=None,
        agent_results={},
        oag_id=None,
        schema_id=None,
        entities_to_create=[],
        relations_to_create=[],
        tool_calls=[],
        tool_results=[],
        iteration_count=0,
        max_iterations=10,
        should_continue=True,
        final_response=None,
        error=None
    )
