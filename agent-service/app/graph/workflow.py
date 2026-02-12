"""
LangGraph 工作流定义
主图定义和节点路由
"""
from langgraph.graph import StateGraph, END
from app.graph.state import AgentState
from app.agents.nlu_agent import NLUAgent
from app.agents.oag_generator_agent import OAGGeneratorAgent
import structlog

logger = structlog.get_logger()


class OntologyAgentGraph:
    """本体图谱Agent主图"""
    
    def __init__(self):
        self.nlu_agent = NLUAgent()
        self.oag_generator = OAGGeneratorAgent()
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """构建LangGraph"""
        
        # 创建状态图
        workflow = StateGraph(AgentState)
        
        # 添加节点
        workflow.add_node("nlu", self.nlu_agent.run)
        workflow.add_node("oag_generator", self.oag_generator.run)
        workflow.add_node("router", self._router)
        workflow.add_node("response", self._generate_response)
        
        # 定义边
        workflow.set_entry_point("nlu")
        
        workflow.add_edge("nlu", "router")
        
        # 条件路由
        workflow.add_conditional_edges(
            "router",
            self._route_by_intent,
            {
                "create_oag": "oag_generator",
                "update_oag": "oag_generator",
                "general_chat": "response",
                "end": END
            }
        )
        
        workflow.add_edge("oag_generator", "response")
        workflow.add_edge("response", END)
        
        return workflow.compile()
    
    async def _router(self, state: AgentState) -> AgentState:
        """路由器节点"""
        logger.info("Routing", intent=state.get("intent"))
        state["iteration_count"] += 1
        
        # 检查最大迭代次数
        if state["iteration_count"] >= state["max_iterations"]:
            logger.warning("Max iterations reached")
            state["should_continue"] = False
        
        return state
    
    def _route_by_intent(self, state: AgentState) -> str:
        """根据意图路由"""
        intent = state.get("intent", "general_chat")
        
        if state.get("error") or not state["should_continue"]:
            return "end"
        
        routing_map = {
            "create_oag": "create_oag",
            "update_oag": "update_oag",
            "query_oag": "general_chat",  # 暂不支持
            "validate_schema": "general_chat",  # 暂不支持
            "general_chat": "general_chat"
        }
        
        return routing_map.get(intent, "general_chat")
    
    async def _generate_response(self, state: AgentState) -> AgentState:
        """生成最终响应"""
        
        if state.get("error"):
            state["final_response"] = f"抱歉，处理过程中出现错误: {state['error']}"
            return state
        
        intent = state.get("intent")
        
        if intent == "create_oag" and "oag_generator" in state["agent_results"]:
            result = state["agent_results"]["oag_generator"]
            entity_count = len(result.get("entities", []))
            relation_count = len(result.get("relations", []))
            explanation = result.get("explanation", "")
            
            state["final_response"] = (
                f"✅ 已成功生成OAG图谱！\n\n"
                f"📊 统计:\n"
                f"- 实体数量: {entity_count}\n"
                f"- 关系数量: {relation_count}\n\n"
                f"📝 说明:\n{explanation}"
            )
        
        elif intent == "general_chat":
            state["final_response"] = (
                "您好！我是本体图谱助手，可以帮助您:\n"
                "- 创建OAG图谱\n"
                "- 分析业务领域\n"
                "- 验证Schema定义\n\n"
                "请告诉我您想做什么？"
            )
        
        else:
            state["final_response"] = "处理完成。"
        
        return state
    
    async def run(self, session_id: str, user_input: str) -> AgentState:
        """
        运行Agent图
        
        Args:
            session_id: 会话ID
            user_input: 用户输入
            
        Returns:
            最终状态
        """
        from app.graph.state import create_initial_state
        
        initial_state = create_initial_state(session_id, user_input)
        
        logger.info(
            "Starting workflow",
            session_id=session_id,
            user_input=user_input
        )
        
        result = await self.graph.ainvoke(initial_state)
        
        logger.info(
            "Workflow completed",
            session_id=session_id,
            intent=result.get("intent"),
            iterations=result.get("iteration_count")
        )
        
        return result


# 全局图实例
agent_graph = OntologyAgentGraph()
