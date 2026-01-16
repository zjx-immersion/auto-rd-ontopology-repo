# API 文档

岚图智能驾驶知识图谱系统 - RESTful API 接口文档

**基础URL**: `http://localhost:3001/api/v1`

## 图谱数据 API

### 获取完整图谱数据

```http
GET /graph/data
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "edges": [...],
    "statistics": {
      "total_nodes": 22,
      "total_edges": 22
    }
  }
}
```

### 获取 Schema

```http
GET /graph/schema
```

**响应**: 返回本体模型定义

### 获取节点列表

```http
GET /graph/nodes?type=SWR&ids=SWR_5001,SWR_5002
```

**查询参数**:
- `type` (可选): 过滤节点类型
- `ids` (可选): 节点ID列表，逗号分隔

### 获取单个节点

```http
GET /graph/nodes/{id}
```

**路径参数**:
- `id`: 节点ID

### 创建节点

```http
POST /graph/nodes
Content-Type: application/json

{
  "id": "SWR_5004",
  "type": "SWR",
  "data": {
    "title": "新的软件需求",
    "owner": "张三",
    "status": "待下发"
  }
}
```

### 更新节点

```http
PUT /graph/nodes/{id}
Content-Type: application/json

{
  "data": {
    "status": "开发中"
  }
}
```

### 删除节点

```http
DELETE /graph/nodes/{id}
```

### 搜索节点

```http
GET /graph/search?keyword=泊车
```

**查询参数**:
- `keyword`: 搜索关键词

### 获取边列表

```http
GET /graph/edges?type=manages&source=PROJ_001
```

**查询参数**:
- `type` (可选): 关系类型
- `source` (可选): 源节点ID
- `target` (可选): 目标节点ID

### 创建边

```http
POST /graph/edges
Content-Type: application/json

{
  "source": "SWR_5001",
  "target": "PF_OD",
  "type": "guides",
  "data": {
    "confidence": 1.0
  }
}
```

## 追溯查询 API

### 需求追溯

```http
POST /ontology/trace
Content-Type: application/json

{
  "entity_id": "SWR_5001",
  "query_type": "full_trace",
  "depth": 3
}
```

**请求参数**:
- `entity_id` (必填): 实体ID
- `query_type` (可选): 查询类型
  - `full_trace`: 完整追溯（默认）
  - `impact_analysis`: 影响分析
  - `downstream_tasks`: 下游任务
- `depth` (可选): 追溯深度，1-5，默认3

**响应示例**:
```json
{
  "success": true,
  "data": {
    "query_entity": {
      "id": "SWR_5001",
      "type": "SWR",
      "title": "OD模型训练精度提升至96%"
    },
    "upstream_chain": [
      {
        "level": 1,
        "entity_type": "SYS_2_5",
        "entity_id": "SYS_2001",
        "title": "超声波雷达感知融合架构"
      }
    ],
    "downstream_chain": [
      {
        "level": 1,
        "entity_type": "PerceptionFusion",
        "entity_id": "PF_OD",
        "module_name": "目标检测模块"
      }
    ],
    "test_coverage": {
      "total_test_cases": 1,
      "passed": 0,
      "failed": 1,
      "issues": [...]
    }
  },
  "performance": {
    "duration_ms": 45,
    "query_time": "2026-01-15T10:30:00.000Z"
  }
}
```

### 获取实体路径

```http
GET /ontology/path/{entityId}
```

**响应**: 返回从项目到当前实体的所有路径

### 获取测试覆盖

```http
GET /ontology/coverage/{entityId}
```

**响应**: 返回实体的测试覆盖情况

### 批量追溯查询

```http
POST /ontology/trace/batch
Content-Type: application/json

{
  "entity_ids": ["SWR_5001", "SWR_5002"],
  "query_type": "full_trace",
  "depth": 3
}
```

## 数据导入 API

### 导入 Markdown 表格

```http
POST /import/markdown
Content-Type: application/json

{
  "content": "| 实体A | 关系 | 实体B |...",
  "type": "triples"
}
```

### 导入 Excel 数据

```http
POST /import/excel
Content-Type: application/json

{
  "data": [
    ["实体A", "关系", "实体B", ...],
    ["PROJ_001", "管理", "SSTS_1001", ...]
  ],
  "type": "triples"
}
```

### 导入 JSON 数据

```http
POST /import/json
Content-Type: application/json

{
  "nodes": [...],
  "edges": [...]
}
```

### 清空所有数据

```http
DELETE /import/clear
```

⚠️ **警告**: 此操作会删除所有图谱数据，不可恢复！

## 错误响应

所有API在失败时返回统一格式的错误响应：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  }
}
```

常见错误码：
- `INVALID_PARAMETER`: 参数错误
- `ENTITY_NOT_FOUND`: 实体不存在
- `INVALID_TRACE_DEPTH`: 追溯深度超出范围
- `IMPORT_ERROR`: 数据导入失败
- `INTERNAL_ERROR`: 服务器内部错误

## 性能指标

- 图谱查询响应时间: < 100ms
- 追溯查询响应时间: < 800ms (P95)
- 数据导入速度: ~1000条三元组/秒
- 并发支持: 100 QPS

## 认证与授权

当前版本为开发版本，暂未实现认证功能。

生产环境建议：
- 使用OAuth2或JWT进行认证
- 实现基于角色的访问控制(RBAC)
- 添加API限流和防护
