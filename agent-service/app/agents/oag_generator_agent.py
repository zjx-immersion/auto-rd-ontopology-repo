"""
OAG Generator Agent - OAG图谱生成
"""
import json
from app.graph.state import AgentState, Message, Entity, Relation
from app.core.llm_client import kimi_client, Message as LLMMessage
from app.prompts import load_prompt
import structlog

logger = structlog.get_logger()


class OAGGeneratorAgent:
    """OAG生成Agent"""
    
    def __init__(self):
        self.name = "oag_generator"
    
    async def run(self, state: AgentState) -> AgentState:
        """
        生成OAG图谱
        
        Args:
            state: 当前状态
            
        Returns:
            更新后的状态
        """
        logger.info("OAG Generator Agent running", session_id=state["session_id"])
        
        # 获取必要信息
        description = state["slots"].get("description", state["user_input"])
        schema_id = state["slots"].get("schema_id", "default")
        
        # 模拟获取Schema (实际应从后端API获取)
        schema = {
            "entityTypes": {
                "Project": {"code": "Project", "label": "项目"},
                "Domain": {"code": "Domain", "label": "领域"},
                "Epic": {"code": "Epic", "label": "史诗"},
                "Feature": {"code": "Feature", "label": "特性"}
            },
            "relationTypes": {
                "contains": {"id": "contains", "label": "包含", "from": ["Project"], "to": ["Domain"]},
                "has_epic": {"id": "has_epic", "label": "有史诗", "from": ["Domain"], "to": ["Epic"]},
                "has_feature": {"id": "has_feature", "label": "有特性", "from": ["Epic"], "to": ["Feature"]}
            }
        }
        
        # 加载Prompt
        prompt = load_prompt(
            "oag_generator",
            schema=json.dumps(schema, ensure_ascii=False),
            description=description
        )
        
        # 调用LLM
        messages = [
            LLMMessage(role="system", content="你是一个专业的本体图谱工程师。"),
            LLMMessage(role="user", content=prompt)
        ]
        
        try:
            response = await kimi_client.chat(messages)
            
            # 解析结果
            result = json.loads(response.content)
            
            # 转换为内部数据模型
            entities = []
            for e in result.get("entities", []):
                entities.append(Entity(
                    id=e["id"],
                    type=e["type"],
                    label=e["label"],
                    properties=e.get("properties", {})
                ))
            
            relations = []
            for r in result.get("relations", []):
                relations.append(Relation(
                    id=f"{r['source']}_{r['type']}_{r['target']}",
                    source=r["source"],
                    target=r["target"],
                    type=r["type"],
                    label=r.get("label", ""),
                    properties=r.get("properties", {})
                ))
            
            # 更新状态
            state["entities_to_create"] = entities
            state["relations_to_create"] = relations
            state["agent_results"]["oag_generator"] = {
                "entities": result.get("entities", []),
                "relations": result.get("relations", []),
                "explanation": result.get("explanation", "")
            }
            
            # 添加助手消息
            entity_count = len(entities)
            relation_count = len(relations)
            state["messages"].append(Message(
                role="assistant",
                content=f"已生成OAG图谱: {entity_count}个实体, {relation_count}个关系。{result.get('explanation', '')}",
                name=self.name
            ))
            
            logger.info(
                "OAG generation completed",
                entity_count=entity_count,
                relation_count=relation_count
            )
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse OAG result", error=str(e))
            state["error"] = f"OAG生成结果解析失败: {str(e)}"
            
        except Exception as e:
            logger.error("OAG Generator Agent error", error=str(e))
            state["error"] = str(e)
        
        return state
