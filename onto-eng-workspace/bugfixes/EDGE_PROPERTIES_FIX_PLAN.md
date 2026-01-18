# 对象属性问题修复方案

## 问题确认

### 根本原因
**图谱数据生成时，边的属性数据没有被保留**

1. ✅ **原始数据源有属性**：`core-domain-data.json` 中的边有 `data` 字段
2. ❌ **生成的图谱数据没有属性**：`graph_67f3055ddb.json` 中所有边的 `data` 都是 `{}`
3. ❌ **创建脚本问题**：`create-v2-graphs.js` 的 `createEdges()` 函数硬编码使用 `data: {}`

### 验证结果
```bash
# 检查图谱数据中边的属性
cat data/graphs/graph_67f3055ddb.json | jq '.data.edges | map(select(.data != {})) | length'
# 结果: 0 （所有153条边的data都是空对象）

# 检查原始数据中的边属性
cat data/sample/core-domain-data.json | jq '.edges[0].data'
# 结果: {"relationship": "车型项目包含车型定义"}
```

---

## 修复方案

### 方案1: 修改 create-v2-graphs.js（推荐）

**问题**：`createEdges()` 函数只从节点推断关系，没有从原始数据中读取边的属性。

**修复**：
1. 修改 `createEdges()` 函数，接受原始边数据作为参数
2. 创建边时，从原始边数据中查找匹配的边并保留其 `data` 属性
3. 如果找不到匹配的边，使用空对象（向后兼容）

### 方案2: 修改数据导入逻辑

如果数据是通过前端导入的，确保导入时保留边的属性数据。

### 方案3: 在Schema中定义关系属性

即使数据为空，也能显示Schema中定义的关系属性结构。

---

## 实施步骤

### 步骤1: 修改 createEdges 函数

需要修改 `backend/scripts/create-v2-graphs.js`：

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

### 步骤2: 修改 processGraph 函数

需要从源文件中提取边的数据：

```javascript
function processGraph(graphName, sourceFile, outputFile) {
  // ... 现有代码 ...
  
  // 如果源文件是JSON格式，尝试读取边的数据
  let sourceEdges = [];
  if (sourceFile.endsWith('.json')) {
    try {
      const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
      sourceEdges = sourceData.edges || [];
    } catch (error) {
      console.warn('无法读取源文件中的边数据:', error.message);
    }
  }
  
  // 创建边时传入原始边数据
  const edges = createEdges(nodes, sourceEdges);
  
  // ... 其余代码 ...
}
```

### 步骤3: 重新生成图谱数据

运行创建脚本重新生成图谱数据。

---

## 验证步骤

1. 修改脚本后，重新生成图谱数据
2. 检查生成的图谱文件中边的 `data` 字段
3. 使用Playwright验证前端显示

---

## 注意事项

1. **向后兼容**：如果找不到匹配的原始边，使用空对象
2. **数据格式**：确保原始数据中的边格式与生成的边格式匹配
3. **Schema定义**：考虑在Schema中定义关系类型的properties，以便前端正确显示
