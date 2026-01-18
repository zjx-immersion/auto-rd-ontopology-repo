# 对象属性问题最终分析报告

## 问题确认

### 用户反馈
- ✅ 追溯执行链路成功
- ❌ 对象的属性没有数据（关系/对象属性表格中显示"0个"）

### 根本原因

**图谱数据生成时，边的属性数据没有被保留**

#### 1. 原始数据源检查
```bash
# 原始数据源 core-domain-data.json
cat data/sample/core-domain-data.json | jq '.edges[0]'
```
**结果**：
```json
{
  "id": "e-vp-model",
  "source": "vp-mx-2026",
  "target": "model-mx-2026",
  "type": "has_model",
  "data": {
    "relationship": "车型项目包含车型定义"  // ✅ 有属性数据
  }
}
```

#### 2. 生成的图谱数据检查
```bash
# 生成的图谱数据 graph_67f3055ddb.json
cat data/graphs/graph_67f3055ddb.json | jq '.data.edges[0]'
```
**结果**：
```json
{
  "id": "edge_14f55fa960",
  "source": "VEH-001",
  "target": "DP-EE-001",
  "type": "has_domain_project",
  "data": {}  // ❌ 空对象，属性数据丢失
}
```

#### 3. 统计检查
```bash
# 检查所有边的data字段
cat data/graphs/graph_67f3055ddb.json | jq '.data.edges | map(select(.data != {})) | length'
# 结果: 0 （所有153条边的data都是空对象）
```

---

## 问题根源

### create-v2-graphs.js 脚本问题

**`createEdges()` 函数**只从节点数据推断关系，创建边时硬编码使用 `data: {}`：

```javascript
// 当前代码（有问题）
function createEdges(nodes) {
  // ...
  edges.push({
    id: edgeId(),
    source: data.vehicleId,
    target: node.id,
    type: 'has_domain_project',
    data: {}  // ❌ 硬编码为空对象，没有从原始数据中读取
  });
}
```

**问题**：
1. 脚本只处理节点数据，不处理边的数据
2. 创建边时没有从原始数据源中查找匹配的边并保留其属性
3. 所有边都被初始化为空对象

---

## 数据流程分析

### 当前流程
1. **原始数据** (`core-domain-data.json`) → 有边的属性数据 ✅
2. **创建脚本** (`create-v2-graphs.js`) → 只读取节点，忽略边的属性 ❌
3. **生成的图谱** (`graph_67f3055ddb.json`) → 所有边的data都是空对象 ❌
4. **前端显示** → 正确显示"0个"（因为数据确实是空的）✅

### 问题环节
**第2步**：创建脚本没有保留边的属性数据

---

## 解决方案

### 方案1: 修改 create-v2-graphs.js（推荐）

修改 `createEdges()` 函数，使其能够从原始数据源中读取并保留边的属性：

```javascript
function createEdges(nodes, sourceEdges = []) {
  const edges = [];
  const edgeId = () => `edge_${uuidv4().replace(/-/g, '').substring(0, 10)}`;
  
  // 创建边索引，用于查找原始边的属性
  const sourceEdgeMap = new Map();
  sourceEdges.forEach(edge => {
    const key = `${edge.source}-${edge.type}-${edge.target}`;
    sourceEdgeMap.set(key, edge);
  });
  
  nodes.forEach(node => {
    const data = node.data;
    
    // Vehicle -> DomainProject
    if (node.type === 'DomainProject' && data.vehicleId) {
      const key = `${data.vehicleId}-has_domain_project-${node.id}`;
      const sourceEdge = sourceEdgeMap.get(key);
      
      edges.push({
        id: edgeId(),
        source: data.vehicleId,
        target: node.id,
        type: 'has_domain_project',
        // ✅ 保留原始边的属性数据
        data: sourceEdge?.data || {}
      });
    }
    // ... 其他关系类型类似处理
  });
  
  return edges;
}
```

### 方案2: 修改数据导入逻辑

如果数据是通过前端导入的，确保导入时保留边的属性数据。检查 `MultiGraphService.createGraph()` 是否正确处理边的 `data` 字段。

### 方案3: 在Schema中定义关系属性

在Schema中定义关系类型的 `properties`，即使数据为空，也能显示Schema定义的结构。

---

## 验证步骤

### 1. 检查原始数据
```bash
# 检查原始数据中边的属性
cat data/sample/core-domain-data.json | jq '.edges | map(select(.data != {})) | length'
# 预期: > 0
```

### 2. 检查生成的图谱数据
```bash
# 检查生成的图谱数据中边的属性
cat data/graphs/graph_67f3055ddb.json | jq '.data.edges | map(select(.data != {})) | length'
# 当前: 0
# 修复后预期: > 0
```

### 3. 前端验证
- 打开关系/对象属性表格
- 展开关系行
- 验证对象属性是否正确显示

---

## 结论

**问题根源**：图谱数据生成时，边的属性数据没有被保留。

**不是以下问题**：
- ❌ 不是查询加载问题（数据确实不存在）
- ❌ 不是显示问题（前端正确显示了空数据）
- ✅ 是数据生成问题（创建脚本没有保留边的属性）

**修复优先级**：
1. **高优先级**：修改 `create-v2-graphs.js` 脚本，保留边的属性数据
2. **中优先级**：在Schema中定义关系类型的properties
3. **低优先级**：修改导入逻辑（如果数据是通过导入功能导入的）

---

## 相关文件

- `backend/scripts/create-v2-graphs.js` - 需要修改的脚本
- `data/sample/core-domain-data.json` - 原始数据源（有边的属性）
- `data/graphs/graph_67f3055ddb.json` - 生成的图谱数据（边的属性丢失）
- `data/schemaVersions/core-domain-schema-v2.json` - Schema定义（可添加关系属性定义）
