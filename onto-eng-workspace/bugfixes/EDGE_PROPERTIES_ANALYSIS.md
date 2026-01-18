# 对象属性问题分析报告

## 问题描述
关系/对象属性表格中，所有关系的"对象属性"列都显示"0个"，展开后显示"该关系没有对象属性"。

## 根本原因分析

### 1. 数据源检查

#### 原始数据源 (`core-domain-data.json`)
```json
{
  "id": "e-vp-dp-adas",
  "source": "vp-mx-2026",
  "target": "dp-mx-2026-adas",
  "type": "has_domain_project",
  "data": {
    "relationship": "车型项目包含智驾领域项目"
  }
}
```
✅ **原始数据源有属性数据**

#### 生成的图谱数据 (`graph_67f3055ddb.json`)
```json
{
  "id": "edge_14f55fa960",
  "source": "VEH-001",
  "target": "DP-EE-001",
  "type": "has_domain_project",
  "data": {}
}
```
❌ **生成的图谱数据中所有边的data都是空对象**

### 2. 问题定位

**问题在 `create-v2-graphs.js` 脚本**：

1. **`createEdges()` 函数**只从节点数据推断关系
2. 创建边时**硬编码使用 `data: {}`**
3. **没有从原始数据源中读取边的属性数据**

```javascript
// 当前代码（有问题）
function createEdges(nodes) {
  // ...
  edges.push({
    id: edgeId(),
    source: data.vehicleId,
    target: node.id,
    type: 'has_domain_project',
    data: {}  // ❌ 硬编码为空对象
  });
}
```

### 3. 数据流程

1. **原始数据** (`core-domain-data.json`) → 有边的属性数据 ✅
2. **创建脚本** (`create-v2-graphs.js`) → 只读取节点，忽略边的属性 ❌
3. **生成的图谱** (`graph_67f3055ddb.json`) → 所有边的data都是空对象 ❌
4. **前端显示** → 正确显示"0个"（因为数据确实是空的）✅

### 4. Schema检查

Schema中定义了关系类型，但**没有定义关系类型的properties**：
```json
{
  "relationTypes": {
    "has_domain_project": {
      "label": "包含领域项目",
      "from": ["Vehicle"],
      "to": ["DomainProject"],
      "description": "车型包含多个领域项目"
      // ❌ 缺少 "properties" 定义
    }
  }
}
```

## 解决方案

### 方案1: 修改创建脚本（推荐）
修改 `create-v2-graphs.js`，使其从原始数据源中读取边的属性数据。

### 方案2: 修改导入逻辑
如果数据是通过导入功能导入的，修改导入逻辑以保留边的属性。

### 方案3: 在Schema中定义关系属性
在Schema中定义关系类型的properties，即使数据为空也能显示Schema定义。

## 验证

### 检查图谱数据
```bash
# 检查所有边的data字段
cat data/graphs/graph_67f3055ddb.json | jq '.data.edges | map(select(.data != {})) | length'
# 结果: 0 （所有边的data都是空对象）
```

### 检查原始数据
```bash
# 检查原始数据中的边属性
cat data/sample/core-domain-data.json | jq '.edges[0].data'
# 结果: {"relationship": "车型项目包含智驾领域项目"}
```

## 结论

**问题根源**：图谱数据生成时，边的属性数据没有被保留。

**不是以下问题**：
- ❌ 不是查询加载问题（数据确实不存在）
- ❌ 不是显示问题（前端正确显示了空数据）
- ✅ 是数据生成问题（创建脚本没有保留边的属性）

## 下一步

1. 修改 `create-v2-graphs.js` 脚本
2. 重新生成图谱数据
3. 验证对象属性是否正确显示
