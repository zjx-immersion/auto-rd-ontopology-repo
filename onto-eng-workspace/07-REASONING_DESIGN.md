# 🧠 知识推理能力 - 详细设计

## 📋 模块概述

本模块提供完整的知识推理和查询分析能力，包括SPARQL查询引擎、推理引擎和图分析算法。

**核心目标**:
- SPARQL 1.1标准查询支持
- 传递性、对称性推理
- 自定义规则引擎
- 常用图分析算法

---

## 🎯 功能架构

```
知识推理模块
├── SPARQL查询引擎
│   ├── RDF存储（N3.js）
│   ├── 查询执行（Comunica）
│   ├── 查询优化
│   └── 查询模板
│
├── 推理引擎
│   ├── 传递性推理
│   ├── 对称性推理
│   ├── 自定义规则
│   └── 推理解释
│
└── 图分析算法
    ├── PageRank
    ├── 社区发现
    ├── 最短路径
    └── 中心性分析
```

---

## 1. SPARQL查询引擎

### 1.1 RDF存储层

```javascript
// backend/src/services/RDFStore.js
const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode, literal, quad } = DataFactory;

class RDFStore {
  constructor() {
    this.store = new N3.Store();
    this.prefix = 'http://ontology.example.com/';
  }

  // 从图数据构建RDF三元组
  async loadFromGraph(graphData) {
    this.store = new N3.Store();
    
    // 添加节点三元组
    graphData.nodes.forEach(node => {
      // 类型三元组: <node> rdf:type <Type>
      this.store.addQuad(
        namedNode(this.prefix + node.id),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode(this.prefix + node.type)
      );

      // 标签: <node> rdfs:label "Label"
      if (node.label) {
        this.store.addQuad(
          namedNode(this.prefix + node.id),
          namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
          literal(node.label)
        );
      }

      // 属性三元组
      Object.entries(node.data || {}).forEach(([key, value]) => {
        this.store.addQuad(
          namedNode(this.prefix + node.id),
          namedNode(this.prefix + key),
          this.createLiteral(value)
        );
      });
    });

    // 添加边三元组
    graphData.edges.forEach(edge => {
      this.store.addQuad(
        namedNode(this.prefix + edge.source),
        namedNode(this.prefix + edge.type),
        namedNode(this.prefix + edge.target)
      );

      // 边属性（reification）
      if (edge.data && Object.keys(edge.data).length > 0) {
        const edgeNode = namedNode(this.prefix + edge.id);
        
        // 标记为Statement
        this.store.addQuad(
          edgeNode,
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Statement')
        );

        // subject, predicate, object
        this.store.addQuad(
          edgeNode,
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#subject'),
          namedNode(this.prefix + edge.source)
        );
        
        this.store.addQuad(
          edgeNode,
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#predicate'),
          namedNode(this.prefix + edge.type)
        );
        
        this.store.addQuad(
          edgeNode,
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#object'),
          namedNode(this.prefix + edge.target)
        );

        // 边属性
        Object.entries(edge.data).forEach(([key, value]) => {
          this.store.addQuad(
            edgeNode,
            namedNode(this.prefix + key),
            this.createLiteral(value)
          );
        });
      }
    });

    return {
      tripleCount: this.store.size,
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length
    };
  }

  createLiteral(value) {
    if (typeof value === 'number') {
      return literal(value.toString(), namedNode('http://www.w3.org/2001/XMLSchema#integer'));
    } else if (typeof value === 'boolean') {
      return literal(value.toString(), namedNode('http://www.w3.org/2001/XMLSchema#boolean'));
    } else if (value instanceof Date) {
      return literal(value.toISOString(), namedNode('http://www.w3.org/2001/XMLSchema#dateTime'));
    } else {
      return literal(String(value));
    }
  }

  getStore() {
    return this.store;
  }

  // 导出为Turtle格式
  async exportToTurtle() {
    const writer = new N3.Writer({ prefixes: { '': this.prefix } });
    const quads = this.store.getQuads(null, null, null, null);
    
    return new Promise((resolve, reject) => {
      writer.addQuads(quads);
      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }
}

module.exports = RDFStore;
```

### 1.2 SPARQL查询执行

```javascript
// backend/src/services/SPARQLService.js
const { QueryEngine } = require('@comunica/query-sparql-rdfjs');

class SPARQLService {
  constructor(rdfStore) {
    this.engine = new QueryEngine();
    this.rdfStore = rdfStore;
  }

  async executeQuery(sparqlQuery) {
    const startTime = Date.now();

    try {
      const bindingsStream = await this.engine.queryBindings(sparqlQuery, {
        sources: [this.rdfStore.getStore()],
      });

      const bindings = await bindingsStream.toArray();
      const results = bindings.map(binding => {
        const row = {};
        binding.forEach((value, key) => {
          row[key.value] = this.formatValue(value);
        });
        return row;
      });

      return {
        success: true,
        results,
        count: results.length,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  formatValue(term) {
    if (term.termType === 'NamedNode') {
      return term.value.replace(this.rdfStore.prefix, '');
    } else if (term.termType === 'Literal') {
      return term.value;
    }
    return term.value;
  }

  // 查询模板
  getTemplates() {
    return {
      'findByType': {
        name: '按类型查找实例',
        sparql: `PREFIX : <http://ontology.example.com/>
SELECT ?instance ?label
WHERE {
  ?instance a :{{TYPE}} ;
            rdfs:label ?label .
}
LIMIT {{LIMIT}}`,
        params: ['TYPE', 'LIMIT']
      },
      
      'findRelations': {
        name: '查找关系',
        sparql: `PREFIX : <http://ontology.example.com/>
SELECT ?source ?relation ?target
WHERE {
  ?source :{{RELATION}} ?target .
}
LIMIT {{LIMIT}}`,
        params: ['RELATION', 'LIMIT']
      },

      'pathQuery': {
        name: '路径查询',
        sparql: `PREFIX : <http://ontology.example.com/>
SELECT ?intermediate
WHERE {
  :{{START}} (:{{RELATION}})+ ?intermediate .
  ?intermediate (:{{RELATION}})+ :{{END}} .
}`,
        params: ['START', 'RELATION', 'END']
      },

      'aggregation': {
        name: '聚合查询',
        sparql: `PREFIX : <http://ontology.example.com/>
SELECT ?type (COUNT(?instance) AS ?count)
WHERE {
  ?instance a ?type .
}
GROUP BY ?type
ORDER BY DESC(?count)`,
        params: []
      }
    };
  }

  // 应用模板
  applyTemplate(templateId, params) {
    const template = this.getTemplates()[templateId];
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    let sparql = template.sparql;
    Object.entries(params).forEach(([key, value]) => {
      sparql = sparql.replace(`{{${key}}}`, value);
    });

    return sparql;
  }
}

module.exports = SPARQLService;
```

### 1.3 前端SPARQL编辑器

```jsx
// SPARQLEditor.js
import React, { useState } from 'react';
import { Card, Button, Table, Tabs, message, Select, Space } from 'antd';
import { PlayCircleOutlined, SaveOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';

const SPARQLEditor = () => {
  const [query, setQuery] = useState(`PREFIX : <http://ontology.example.com/>
SELECT ?epic ?name ?priority
WHERE {
  ?epic a :Epic ;
        :name ?name ;
        :priority "High" .
}`);
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);

  const executeQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sparql/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setExecutionTime(data.executionTime);
        message.success(`查询成功，返回 ${data.count} 条结果`);
      } else {
        message.error(`查询失败: ${data.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = results.length > 0
    ? Object.keys(results[0]).map(key => ({
        title: key,
        dataIndex: key,
        key: key,
        ellipsis: true
      }))
    : [];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Card
        title="SPARQL查询"
        extra={
          <Space>
            <Select
              placeholder="选择模板"
              style={{ width: 200 }}
              onChange={(value) => {
                // 加载模板
              }}
            >
              <Select.Option value="findByType">按类型查找</Select.Option>
              <Select.Option value="findRelations">查找关系</Select.Option>
              <Select.Option value="pathQuery">路径查询</Select.Option>
            </Select>
            
            <Button icon={<SaveOutlined />}>保存</Button>
            
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={executeQuery}
              loading={loading}
            >
              执行
            </Button>
          </Space>
        }
        bodyStyle={{ padding: 0, height: '400px' }}
      >
        <Editor
          height="400px"
          language="sparql"
          theme="vs-dark"
          value={query}
          onChange={setQuery}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false
          }}
        />
      </Card>

      <Card
        title={`查询结果 (${results.length}条, ${executionTime}ms)`}
        style={{ flex: 1, marginTop: 16 }}
      >
        <Table
          dataSource={results}
          columns={columns}
          rowKey={(_, index) => index}
          pagination={{ pageSize: 20 }}
          scroll={{ x: true, y: 400 }}
        />
      </Card>
    </div>
  );
};

export default SPARQLEditor;
```

---

## 2. 推理引擎

### 2.1 推理服务实现

```javascript
// backend/src/services/InferenceEngine.js
class InferenceEngine {
  constructor(graphService) {
    this.graphService = graphService;
    this.rules = [];
    this.inferredEdges = [];
  }

  // 执行推理
  async infer() {
    this.inferredEdges = [];
    
    const nodes = await this.graphService.getAllNodes();
    const edges = await this.graphService.getAllEdges();
    const schema = await this.graphService.getSchema();

    // 1. 传递性推理
    await this.inferTransitive(edges, schema);

    // 2. 对称性推理
    await this.inferSymmetric(edges, schema);

    // 3. 自定义规则推理
    await this.applyCustomRules(nodes, edges);

    return {
      inferredCount: this.inferredEdges.length,
      inferred: this.inferredEdges
    };
  }

  // 传递性推理 (Floyd-Warshall算法)
  async inferTransitive(edges, schema) {
    // 找出所有传递性关系类型
    const transitiveRels = Object.entries(schema.relationTypes)
      .filter(([_, rel]) => rel.characteristics?.transitive)
      .map(([type]) => type);

    for (const relType of transitiveRels) {
      const graph = this.buildGraph(edges, relType);
      const closure = this.transitiveClosureFW(graph);

      // 生成推断边
      for (const [source, targets] of Object.entries(closure)) {
        for (const target of targets) {
          const exists = edges.find(e =>
            e.source === source && e.target === target && e.type === relType
          );

          if (!exists) {
            this.inferredEdges.push({
              id: `inferred_${source}_${relType}_${target}`,
              source,
              target,
              type: relType,
              inferred: true,
              inferenceType: 'TRANSITIVE',
              confidence: 1.0
            });
          }
        }
      }
    }
  }

  buildGraph(edges, relType) {
    const graph = {};
    edges.filter(e => e.type === relType).forEach(edge => {
      if (!graph[edge.source]) graph[edge.source] = new Set();
      graph[edge.source].add(edge.target);
    });
    return graph;
  }

  transitiveClosureFW(graph) {
    const closure = {};
    const nodes = new Set([
      ...Object.keys(graph),
      ...Object.values(graph).flatMap(set => [...set])
    ]);

    // 初始化闭包
    for (const node of nodes) {
      closure[node] = new Set(graph[node] || []);
    }

    // Floyd-Warshall
    for (const k of nodes) {
      for (const i of nodes) {
        if (closure[i]?.has(k)) {
          for (const j of nodes) {
            if (closure[k]?.has(j)) {
              if (!closure[i]) closure[i] = new Set();
              closure[i].add(j);
            }
          }
        }
      }
    }

    return closure;
  }

  // 对称性推理
  async inferSymmetric(edges, schema) {
    const symmetricRels = Object.entries(schema.relationTypes)
      .filter(([_, rel]) => rel.characteristics?.symmetric)
      .map(([type]) => type);

    for (const relType of symmetricRels) {
      edges.filter(e => e.type === relType).forEach(edge => {
        const reverseExists = edges.find(e =>
          e.source === edge.target &&
          e.target === edge.source &&
          e.type === relType
        );

        if (!reverseExists) {
          this.inferredEdges.push({
            id: `inferred_${edge.target}_${relType}_${edge.source}`,
            source: edge.target,
            target: edge.source,
            type: relType,
            inferred: true,
            inferenceType: 'SYMMETRIC',
            basedOn: edge.id,
            confidence: 1.0
          });
        }
      });
    }
  }

  // 自定义规则推理
  async applyCustomRules(nodes, edges) {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const matches = this.matchPattern(rule.pattern, nodes, edges);
      
      for (const match of matches) {
        const inference = this.executeAction(rule.action, match);
        if (inference) {
          inference.inferenceType = 'RULE';
          inference.ruleId = rule.id;
          inference.confidence = rule.confidence || 0.8;
          this.inferredEdges.push(inference);
        }
      }
    }
  }

  matchPattern(pattern, nodes, edges) {
    // 简化的模式匹配
    // 实际实现需要更复杂的图模式匹配算法
    const matches = [];
    
    // TODO: 实现完整的模式匹配逻辑
    
    return matches;
  }

  executeAction(action, bindings) {
    if (action.type === 'CREATE_EDGE') {
      return {
        id: `inferred_${Date.now()}`,
        source: bindings[action.source],
        target: bindings[action.target],
        type: action.relationType,
        inferred: true,
        data: action.properties || {}
      };
    }
    return null;
  }

  // 推理解释
  explainInference(edgeId) {
    const edge = this.inferredEdges.find(e => e.id === edgeId);
    if (!edge) return null;

    switch (edge.inferenceType) {
      case 'TRANSITIVE':
        return this.explainTransitive(edge);
      case 'SYMMETRIC':
        return this.explainSymmetric(edge);
      case 'RULE':
        return this.explainRule(edge);
      default:
        return null;
    }
  }

  explainTransitive(edge) {
    // 查找传递路径
    // A -> B -> C 推断出 A -> C
    return {
      type: 'TRANSITIVE',
      conclusion: edge,
      steps: [
        // TODO: 找出实际路径
      ],
      confidence: edge.confidence
    };
  }

  explainSymmetric(edge) {
    return {
      type: 'SYMMETRIC',
      conclusion: edge,
      basedOn: edge.basedOn,
      description: `由于关系 ${edge.type} 是对称的，从 ${edge.basedOn} 推断出反向关系`,
      confidence: 1.0
    };
  }
}

module.exports = InferenceEngine;
```

---

## 3. 图分析算法

### 3.1 PageRank算法

```javascript
// backend/src/services/GraphAnalytics.js
class GraphAnalytics {
  // PageRank算法
  async pagerank(edges, options = {}) {
    const {
      dampingFactor = 0.85,
      maxIterations = 100,
      tolerance = 1e-6
    } = options;

    // 构建邻接表
    const inLinks = {};
    const outDegree = {};
    const nodes = new Set();

    edges.forEach(edge => {
      nodes.add(edge.source);
      nodes.add(edge.target);
      
      if (!inLinks[edge.target]) inLinks[edge.target] = [];
      inLinks[edge.target].push(edge.source);
      
      outDegree[edge.source] = (outDegree[edge.source] || 0) + 1;
    });

    const nodeArray = Array.from(nodes);
    const n = nodeArray.length;
    
    // 初始化PR值
    let pr = {};
    nodeArray.forEach(node => {
      pr[node] = 1 / n;
    });

    // 迭代计算
    for (let iter = 0; iter < maxIterations; iter++) {
      const newPr = {};
      let diff = 0;

      nodeArray.forEach(node => {
        let sum = 0;
        const incoming = inLinks[node] || [];
        
        incoming.forEach(source => {
          sum += pr[source] / (outDegree[source] || 1);
        });

        newPr[node] = (1 - dampingFactor) / n + dampingFactor * sum;
        diff += Math.abs(newPr[node] - pr[node]);
      });

      pr = newPr;

      if (diff < tolerance) {
        console.log(`PageRank收敛于第 ${iter + 1} 次迭代`);
        break;
      }
    }

    // 排序返回
    return nodeArray
      .map(node => ({ node, score: pr[node] }))
      .sort((a, b) => b.score - a.score);
  }

  // 社区发现（Louvain算法）
  async detectCommunities(nodes, edges) {
    // 简化实现，实际应使用成熟的图算法库
    const communities = new Map();
    let communityId = 0;

    // 初始化：每个节点是一个社区
    nodes.forEach(node => {
      communities.set(node.id, communityId++);
    });

    // TODO: 实现完整的Louvain算法

    return communities;
  }

  // 最短路径（Dijkstra）
  async shortestPath(sourceId, targetId, edges) {
    const graph = this.buildWeightedGraph(edges);
    const distances = {};
    const previous = {};
    const unvisited = new Set();

    // 初始化
    Object.keys(graph).forEach(node => {
      distances[node] = Infinity;
      previous[node] = null;
      unvisited.add(node);
    });
    distances[sourceId] = 0;

    while (unvisited.size > 0) {
      // 找到距离最小的未访问节点
      let current = null;
      let minDist = Infinity;
      
      for (const node of unvisited) {
        if (distances[node] < minDist) {
          minDist = distances[node];
          current = node;
        }
      }

      if (current === null || current === targetId) break;

      unvisited.delete(current);

      // 更新邻居距离
      const neighbors = graph[current] || [];
      neighbors.forEach(({ target, weight }) => {
        const alt = distances[current] + weight;
        if (alt < distances[target]) {
          distances[target] = alt;
          previous[target] = current;
        }
      });
    }

    // 重建路径
    const path = [];
    let current = targetId;
    
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    return {
      path,
      distance: distances[targetId],
      found: distances[targetId] !== Infinity
    };
  }

  buildWeightedGraph(edges) {
    const graph = {};
    
    edges.forEach(edge => {
      if (!graph[edge.source]) graph[edge.source] = [];
      graph[edge.source].push({
        target: edge.target,
        weight: edge.weight || 1
      });
    });

    return graph;
  }
}

module.exports = GraphAnalytics;
```

---

## 📋 API接口汇总

```javascript
// SPARQL查询
POST /api/sparql/query
Request: { query: "SELECT ..." }
Response: { success: true, results: [...], executionTime: 45 }

GET /api/sparql/templates
Response: { templates: {...} }

// 推理
POST /api/inference/execute
Response: { inferredCount: 15, inferred: [...] }

GET /api/inference/explain/:edgeId
Response: { type: "TRANSITIVE", steps: [...] }

// 图分析
POST /api/analytics/pagerank
Response: { rankings: [{ node: "id", score: 0.15 }] }

POST /api/analytics/shortest-path
Request: { source: "A", target: "B" }
Response: { path: ["A", "C", "B"], distance: 2 }

POST /api/analytics/communities
Response: { communities: {...} }
```

---

## 📊 交付清单

### Sprint 03: SPARQL查询
- [ ] RDF存储实现
- [ ] SPARQL执行引擎
- [ ] Monaco编辑器集成
- [ ] 10+查询模板
- [ ] 性能测试

### Sprint 04: 推理引擎
- [ ] 传递性推理
- [ ] 对称性推理
- [ ] 推理解释功能
- [ ] 推理可视化
- [ ] 单元测试

### Sprint 05: 图分析
- [ ] PageRank实现
- [ ] 社区发现
- [ ] 最短路径
- [ ] 分析报告

---

**文档版本**: v1.0  
**创建日期**: 2026-01-16  
**状态**: ✅ 就绪
