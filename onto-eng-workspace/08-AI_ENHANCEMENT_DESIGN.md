# 🤖 AI增强功能 - 详细设计

## 📋 模块概述

本模块提供AI原生的智能辅助能力，包括知识图谱嵌入、自然语言查询、智能推荐和自动知识抽取。

**核心目标**:
- 图嵌入训练和应用
- NL转SPARQL自然语言查询
- 智能推荐和关系预测
- 自动实体关系抽取

---

## 🎯 AI服务架构

```
┌─────────────────────────────────────┐
│         React前端                    │
│  - NL查询界面                        │
│  - 推荐展示                          │
│  - 向量可视化                        │
└─────────────┬───────────────────────┘
              │ REST API
┌─────────────▼───────────────────────┐
│      Express API网关                │
│   - 请求路由                         │
│   - 认证授权                         │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│      Python AI服务 (Flask/FastAPI) │
├─────────────────────────────────────┤
│  模块1: 图嵌入                       │
│  - Node2Vec                          │
│  - TransE                            │
│  - 向量存储(FAISS)                   │
├─────────────────────────────────────┤
│  模块2: 自然语言处理                 │
│  - LLM集成(OpenAI/本地)              │
│  - NL→SPARQL                         │
│  - 问答系统                          │
├─────────────────────────────────────┤
│  模块3: 推荐系统                     │
│  - 协同过滤                          │
│  - 关系预测                          │
│  - 知识补全                          │
├─────────────────────────────────────┤
│  模块4: 知识抽取                     │
│  - NER(命名实体识别)                 │
│  - RE(关系抽取)                      │
│  - 实体链接                          │
└─────────────────────────────────────┘
```

---

## 1. 知识图谱嵌入

### 1.1 Python AI服务搭建

```python
# ai_service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

# 全局模型管理器
from models import EmbeddingManager

embedding_manager = EmbeddingManager()

@app.route('/api/ai/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'AI Service'})

@app.route('/api/ai/embedding/train', methods=['POST'])
def train_embedding():
    """训练图嵌入模型"""
    data = request.json
    graph_data = data['graph']
    algorithm = data.get('algorithm', 'node2vec')
    params = data.get('params', {})
    
    result = embedding_manager.train(
        graph_data=graph_data,
        algorithm=algorithm,
        **params
    )
    
    return jsonify({
        'success': True,
        'model_id': result['model_id'],
        'metrics': result['metrics']
    })

@app.route('/api/ai/embedding/query', methods=['POST'])
def query_similar():
    """查询相似节点"""
    data = request.json
    node_id = data['node_id']
    top_k = data.get('top_k', 10)
    
    similar = embedding_manager.find_similar(node_id, top_k)
    
    return jsonify({
        'success': True,
        'similar_nodes': similar
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 1.2 Node2Vec实现

```python
# ai_service/models/node2vec_model.py
import numpy as np
from gensim.models import Word2Vec
from node2vec import Node2Vec as N2V
import networkx as nx

class Node2VecModel:
    def __init__(self, dimensions=128, walk_length=80, num_walks=10):
        self.dimensions = dimensions
        self.walk_length = walk_length
        self.num_walks = num_walks
        self.model = None
        self.graph = None
    
    def train(self, graph_data):
        """
        训练Node2Vec模型
        
        Args:
            graph_data: { nodes: [...], edges: [...] }
        """
        # 构建NetworkX图
        G = nx.DiGraph()
        
        for node in graph_data['nodes']:
            G.add_node(node['id'], **node['data'])
        
        for edge in graph_data['edges']:
            G.add_edge(edge['source'], edge['target'], **edge['data'])
        
        self.graph = G
        
        # 初始化Node2Vec
        node2vec = N2V(
            G,
            dimensions=self.dimensions,
            walk_length=self.walk_length,
            num_walks=self.num_walks,
            workers=4
        )
        
        # 生成随机游走
        model = node2vec.fit(
            window=10,
            min_count=1,
            batch_words=4
        )
        
        self.model = model
        
        return {
            'node_count': G.number_of_nodes(),
            'edge_count': G.number_of_edges(),
            'dimensions': self.dimensions
        }
    
    def get_embedding(self, node_id):
        """获取节点嵌入向量"""
        if self.model is None:
            raise ValueError("模型未训练")
        
        try:
            return self.model.wv[node_id]
        except KeyError:
            return None
    
    def find_similar(self, node_id, top_k=10):
        """查找最相似的节点"""
        if self.model is None:
            raise ValueError("模型未训练")
        
        try:
            similar = self.model.wv.most_similar(node_id, topn=top_k)
            return [
                {
                    'node_id': node,
                    'similarity': float(score)
                }
                for node, score in similar
            ]
        except KeyError:
            return []
    
    def visualize_embeddings(self, method='tsne'):
        """可视化嵌入（降维到2D）"""
        from sklearn.manifold import TSNE
        from umap import UMAP
        
        if self.model is None:
            raise ValueError("模型未训练")
        
        # 获取所有嵌入
        node_ids = list(self.model.wv.index_to_key)
        embeddings = np.array([self.model.wv[n] for n in node_ids])
        
        # 降维
        if method == 'tsne':
            reducer = TSNE(n_components=2, random_state=42)
        else:
            reducer = UMAP(n_components=2, random_state=42)
        
        embeddings_2d = reducer.fit_transform(embeddings)
        
        return {
            'nodes': node_ids,
            'coordinates': embeddings_2d.tolist()
        }
```

### 1.3 向量存储(FAISS)

```python
# ai_service/models/vector_store.py
import faiss
import numpy as np
import pickle

class VectorStore:
    def __init__(self, dimension=128):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.id_map = []  # node_id列表
    
    def add_vectors(self, node_ids, vectors):
        """添加向量到索引"""
        vectors_np = np.array(vectors).astype('float32')
        self.index.add(vectors_np)
        self.id_map.extend(node_ids)
    
    def search(self, query_vector, k=10):
        """搜索最相似的向量"""
        query_np = np.array([query_vector]).astype('float32')
        distances, indices = self.index.search(query_np, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.id_map):
                results.append({
                    'node_id': self.id_map[idx],
                    'distance': float(dist),
                    'similarity': float(1 / (1 + dist))  # 转换为相似度
                })
        
        return results
    
    def save(self, filepath):
        """保存索引"""
        faiss.write_index(self.index, f"{filepath}.index")
        with open(f"{filepath}.map", 'wb') as f:
            pickle.dump(self.id_map, f)
    
    def load(self, filepath):
        """加载索引"""
        self.index = faiss.read_index(f"{filepath}.index")
        with open(f"{filepath}.map", 'rb') as f:
            self.id_map = pickle.load(f)
```

---

## 2. 自然语言查询

### 2.1 NL转SPARQL

```python
# ai_service/nl_query/nl_to_sparql.py
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

class NLToSPARQL:
    def __init__(self, api_key=None):
        self.llm = OpenAI(
            api_key=api_key,
            model_name="gpt-4",
            temperature=0
        )
        
        self.prompt = PromptTemplate(
            input_variables=["schema", "question"],
            template="""
你是一个SPARQL查询专家。根据给定的本体Schema和用户问题，生成对应的SPARQL查询。

Schema信息:
{schema}

用户问题: {question}

请生成SPARQL查询（只返回查询语句，不要解释）:
"""
        )
        
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)
    
    def convert(self, question, schema):
        """将自然语言问题转换为SPARQL查询"""
        
        # 格式化Schema信息
        schema_text = self._format_schema(schema)
        
        # 生成SPARQL
        sparql = self.chain.run(
            schema=schema_text,
            question=question
        )
        
        # 清理和验证
        sparql = self._clean_sparql(sparql)
        
        return {
            'sparql': sparql,
            'question': question
        }
    
    def _format_schema(self, schema):
        """格式化Schema为文本"""
        lines = []
        
        # 实体类型
        lines.append("实体类型:")
        for type_id, type_def in schema.get('entityTypes', {}).items():
            lines.append(f"  - {type_def['label']} ({type_id})")
            if type_def.get('properties'):
                for prop, prop_def in type_def['properties'].items():
                    lines.append(f"    属性: {prop} ({prop_def['type']})")
        
        # 关系类型
        lines.append("\n关系类型:")
        for rel_id, rel_def in schema.get('relationTypes', {}).items():
            lines.append(f"  - {rel_def['label']} ({rel_id})")
            lines.append(f"    从: {rel_def.get('from', [])} 到: {rel_def.get('to', [])}")
        
        return "\n".join(lines)
    
    def _clean_sparql(self, sparql):
        """清理SPARQL查询"""
        # 移除markdown代码块标记
        sparql = sparql.replace('```sparql', '').replace('```', '')
        # 去除前后空白
        sparql = sparql.strip()
        return sparql
```

### 2.2 问答系统

```python
# ai_service/nl_query/qa_system.py
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

class QASystem:
    def __init__(self, llm, sparql_executor):
        self.llm = llm
        self.sparql_executor = sparql_executor
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
    
    def answer(self, question, context=None):
        """回答问题"""
        
        # 1. 将问题转换为SPARQL
        sparql_result = self.nl_to_sparql.convert(question, context['schema'])
        sparql = sparql_result['sparql']
        
        # 2. 执行SPARQL查询
        query_result = self.sparql_executor.execute(sparql)
        
        # 3. 用LLM生成自然语言答案
        answer_prompt = f"""
基于以下查询结果回答用户问题:

问题: {question}
查询结果: {query_result}

请用自然语言回答:
"""
        answer = self.llm(answer_prompt)
        
        # 4. 保存到对话历史
        self.memory.save_context(
            {"input": question},
            {"output": answer}
        )
        
        return {
            'answer': answer,
            'sparql': sparql,
            'results': query_result,
            'confidence': 0.8
        }
```

---

## 3. 智能推荐

### 3.1 关系预测

```python
# ai_service/recommendation/relation_predictor.py
import torch
import torch.nn as nn
from torch_geometric.nn import GCNConv

class RelationPredictor(nn.Module):
    """基于GNN的关系预测模型"""
    
    def __init__(self, num_nodes, num_relations, embedding_dim=64):
        super().__init__()
        
        self.num_nodes = num_nodes
        self.num_relations = num_relations
        self.embedding_dim = embedding_dim
        
        # 节点嵌入
        self.node_embedding = nn.Embedding(num_nodes, embedding_dim)
        
        # GCN层
        self.conv1 = GCNConv(embedding_dim, embedding_dim)
        self.conv2 = GCNConv(embedding_dim, embedding_dim)
        
        # 关系分类器
        self.relation_classifier = nn.Sequential(
            nn.Linear(embedding_dim * 2, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_relations)
        )
    
    def forward(self, edge_index, head, tail):
        # 获取节点嵌入
        x = self.node_embedding.weight
        
        # GCN传播
        x = self.conv1(x, edge_index)
        x = torch.relu(x)
        x = self.conv2(x, edge_index)
        
        # 获取头尾节点表示
        head_embed = x[head]
        tail_embed = x[tail]
        
        # 拼接并分类
        edge_embed = torch.cat([head_embed, tail_embed], dim=1)
        relation_scores = self.relation_classifier(edge_embed)
        
        return relation_scores
    
    def predict(self, source_id, target_id, top_k=3):
        """预测两个节点间最可能的关系"""
        self.eval()
        
        with torch.no_grad():
            scores = self.forward(
                edge_index=self.graph_structure,
                head=torch.tensor([source_id]),
                tail=torch.tensor([target_id])
            )
            
            # Top-K关系
            top_scores, top_indices = torch.topk(scores, k=top_k)
            
            return [
                {
                    'relation_id': int(idx),
                    'confidence': float(score)
                }
                for score, idx in zip(top_scores[0], top_indices[0])
            ]
```

### 3.2 知识补全

```python
# ai_service/recommendation/knowledge_completion.py
class KnowledgeCompletion:
    def __init__(self, embedding_model, relation_predictor):
        self.embedding_model = embedding_model
        self.relation_predictor = relation_predictor
    
    def suggest_missing_edges(self, threshold=0.7):
        """建议缺失的边"""
        suggestions = []
        
        # 遍历所有节点对
        nodes = self.get_all_nodes()
        
        for i, source in enumerate(nodes):
            for target in nodes[i+1:]:
                # 检查是否已存在边
                if self.edge_exists(source, target):
                    continue
                
                # 预测关系
                predictions = self.relation_predictor.predict(source, target)
                
                # 如果置信度高，加入建议
                for pred in predictions:
                    if pred['confidence'] > threshold:
                        suggestions.append({
                            'source': source,
                            'target': target,
                            'relation': pred['relation_id'],
                            'confidence': pred['confidence'],
                            'reason': 'PREDICTION'
                        })
        
        # 按置信度排序
        suggestions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return suggestions[:100]  # 返回Top 100
```

---

## 4. 自动知识抽取

### 4.1 命名实体识别(NER)

```python
# ai_service/extraction/ner_extractor.py
from transformers import pipeline
import spacy

class NERExtractor:
    def __init__(self):
        # 加载预训练模型
        self.nlp = spacy.load("zh_core_web_sm")  # 中文
        self.ner_pipeline = pipeline(
            "ner",
            model="bert-base-chinese",
            aggregation_strategy="simple"
        )
    
    def extract_entities(self, text):
        """从文本中提取实体"""
        
        # 使用spaCy
        doc = self.nlp(text)
        spacy_entities = [
            {
                'text': ent.text,
                'label': ent.label_,
                'start': ent.start_char,
                'end': ent.end_char
            }
            for ent in doc.ents
        ]
        
        # 使用Transformers（更准确）
        bert_entities = self.ner_pipeline(text)
        
        # 合并结果
        entities = self._merge_entities(spacy_entities, bert_entities)
        
        return entities
    
    def _merge_entities(self, entities1, entities2):
        """合并两个NER结果"""
        # 去重和合并逻辑
        merged = {}
        
        for ent in entities1 + entities2:
            key = (ent['start'], ent['end'])
            if key not in merged:
                merged[key] = ent
        
        return list(merged.values())
```

### 4.2 关系抽取(RE)

```python
# ai_service/extraction/relation_extractor.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

class RelationExtractor:
    def __init__(self, model_name="bert-base-chinese"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=10  # 关系类型数量
        )
        
        self.relation_types = [
            'depends_on', 'implements', 'contains', 'related_to',
            'parent_of', 'similar_to', 'part_of', 'assigned_to',
            'created_by', 'none'
        ]
    
    def extract_relations(self, text, entities):
        """从文本和实体中抽取关系"""
        relations = []
        
        # 遍历实体对
        for i, ent1 in enumerate(entities):
            for ent2 in entities[i+1:]:
                # 构造输入
                input_text = f"{ent1['text']} [SEP] {ent2['text']} [SEP] {text}"
                
                # 预测关系
                relation = self._predict_relation(input_text)
                
                if relation['type'] != 'none' and relation['confidence'] > 0.7:
                    relations.append({
                        'source': ent1['text'],
                        'target': ent2['text'],
                        'relation': relation['type'],
                        'confidence': relation['confidence'],
                        'context': text
                    })
        
        return relations
    
    def _predict_relation(self, text):
        """预测两个实体间的关系"""
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512
        )
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=1)[0]
            
            max_prob, max_idx = torch.max(probs, dim=0)
            
            return {
                'type': self.relation_types[max_idx],
                'confidence': float(max_prob)
            }
```

### 4.3 实体链接

```python
# ai_service/extraction/entity_linker.py
class EntityLinker:
    def __init__(self, embedding_model, existing_entities):
        self.embedding_model = embedding_model
        self.existing_entities = existing_entities
        self.entity_embeddings = self._compute_embeddings()
    
    def _compute_embeddings(self):
        """计算现有实体的嵌入"""
        embeddings = {}
        
        for entity_id, entity in self.existing_entities.items():
            # 使用BERT或其他模型计算文本嵌入
            text = entity['label'] + ' ' + entity.get('description', '')
            embedding = self.embedding_model.encode(text)
            embeddings[entity_id] = embedding
        
        return embeddings
    
    def link(self, extracted_entity, threshold=0.8):
        """将抽取的实体链接到知识图谱中的实体"""
        
        # 计算抽取实体的嵌入
        entity_embedding = self.embedding_model.encode(
            extracted_entity['text']
        )
        
        # 计算与所有现有实体的相似度
        similarities = []
        
        for entity_id, existing_embedding in self.entity_embeddings.items():
            similarity = cosine_similarity(entity_embedding, existing_embedding)
            
            if similarity > threshold:
                similarities.append({
                    'entity_id': entity_id,
                    'similarity': float(similarity),
                    'entity': self.existing_entities[entity_id]
                })
        
        # 排序
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        
        return similarities[:5]  # Top 5候选

def cosine_similarity(a, b):
    """计算余弦相似度"""
    import numpy as np
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

---

## 📋 API接口汇总

```python
# 图嵌入
POST /api/ai/embedding/train
Request: { graph: {...}, algorithm: "node2vec", params: {...} }
Response: { model_id: "xxx", metrics: {...} }

POST /api/ai/embedding/query
Request: { node_id: "epic_001", top_k: 10 }
Response: { similar_nodes: [...] }

# 自然语言查询
POST /api/ai/nl-query/convert
Request: { question: "找出所有高优先级的Epic", schema: {...} }
Response: { sparql: "SELECT ...", confidence: 0.9 }

POST /api/ai/qa/ask
Request: { question: "...", context: {...} }
Response: { answer: "...", sparql: "...", confidence: 0.8 }

# 推荐
POST /api/ai/recommend/relations
Request: { source: "A", target: "B" }
Response: { predictions: [{ relation: "depends_on", confidence: 0.85 }] }

POST /api/ai/recommend/complete
Response: { suggestions: [{ source, target, relation, confidence }] }

# 知识抽取
POST /api/ai/extract/entities
Request: { text: "..." }
Response: { entities: [...] }

POST /api/ai/extract/relations
Request: { text: "...", entities: [...] }
Response: { relations: [...] }

POST /api/ai/extract/link
Request: { entity: {...} }
Response: { candidates: [...] }
```

---

## 📊 部署方案

### Docker容器化

```dockerfile
# ai_service/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 下载模型
RUN python -m spacy download zh_core_web_sm

# 复制代码
COPY . .

# 启动服务
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### 依赖管理

```txt
# requirements.txt
flask==2.3.0
flask-cors==4.0.0
numpy==1.24.0
torch==2.0.0
torch-geometric==2.3.0
transformers==4.30.0
spacy==3.5.0
networkx==3.1
gensim==4.3.0
faiss-cpu==1.7.4
langchain==0.0.200
openai==0.27.0
scikit-learn==1.2.2
umap-learn==0.5.3
```

---

## 📋 交付清单

### Sprint 06: 图嵌入
- [ ] Python AI服务搭建
- [ ] Node2Vec实现
- [ ] TransE实现
- [ ] FAISS向量存储
- [ ] 相似度搜索API
- [ ] 向量可视化

### Sprint 07: NL查询
- [ ] LLM集成
- [ ] NL→SPARQL转换
- [ ] 问答系统
- [ ] 对话管理
- [ ] 查询界面

### Sprint 08: 推荐
- [ ] 关系预测模型
- [ ] 知识补全算法
- [ ] 推荐API
- [ ] 评估报告

### Sprint 09: 知识抽取
- [ ] NER模型集成
- [ ] 关系抽取
- [ ] 实体链接
- [ ] 批量处理

---

**文档版本**: v1.0  
**创建日期**: 2026-01-16  
**状态**: ✅ 就绪
