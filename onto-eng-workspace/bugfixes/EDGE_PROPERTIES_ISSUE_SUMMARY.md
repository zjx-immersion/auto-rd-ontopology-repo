# 对象属性问题总结报告

## 问题确认

### 用户反馈
- ✅ 追溯执行链路成功
- ❌ 对象的属性没有数据（关系/对象属性表格中显示"0个"）

### 根本原因

**图谱数据生成时，边的属性数据没有被保留**

#### 数据对比

**原始数据源** (`core-domain-data.json`):
- 61条边，**全部都有 `data` 属性** ✅
- 例如：`{"relationship": "车型项目包含车型定义"}`

**生成的图谱数据** (`graph_67f3055ddb.json`):
- 153条边，**全部都是 `data: {}`** ❌
- 所有边的属性数据都丢失了

#### 问题定位

图谱的metadata显示：
```json
{
  "tags": ["v2", "auto-generated", "EE"]
}
```

**`"auto-generated"` 标签说明图谱是通过脚本生成的**，问题在 `backend/scripts/create-v2-graphs.js`：

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

---

## 解决方案

### 方案1: 修改 create-v2-graphs.js（推荐）

修改 `createEdges()` 函数，使其能够从原始数据源（如 `core-domain-data.json`）中读取并保留边的属性：

1. 修改 `createEdges()` 函数，接受原始边数据作为参数
2. 创建边时，从原始边数据中查找匹配的边并保留其 `data` 属性
3. 如果找不到匹配的边，使用空对象（向后兼容）

### 方案2: 在Schema中定义关系属性

在Schema中定义关系类型的 `properties`，即使数据为空，也能显示Schema定义的结构。

---

## 验证步骤

### 1. 检查原始数据
```bash
cat data/sample/core-domain-data.json | jq '.edges | map(select(.data != {})) | length'
# 结果: 61 （所有边都有属性数据）
```

### 2. 检查生成的图谱数据
```bash
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

---

## 相关文件

- `backend/scripts/create-v2-graphs.js` - 需要修改的脚本
- `data/sample/core-domain-data.json` - 原始数据源（有边的属性）
- `data/graphs/graph_67f3055ddb.json` - 生成的图谱数据（边的属性丢失）
- `data/schemaVersions/core-domain-schema-v2.json` - Schema定义（可添加关系属性定义）
