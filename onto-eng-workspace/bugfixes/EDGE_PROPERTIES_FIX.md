# 对象属性问题修复方案

## 问题确认

### 根本原因
**图谱数据生成时，边的属性数据没有被保留**

1. ✅ **原始数据源有属性**：`core-domain-data.json` 中的61条边都有 `data` 字段
2. ❌ **生成的图谱数据没有属性**：`graph_67f3055ddb.json` 中所有153条边的 `data` 都是 `{}`
3. ❌ **创建脚本问题**：`create-v2-graphs.js` 的 `createEdges()` 函数硬编码使用 `data: {}`

### 验证结果
```bash
# 原始数据
cat data/sample/core-domain-data.json | jq '.edges | map(select(.data != {})) | length'
# 结果: 61 （所有边都有属性数据）

# 生成的图谱数据
cat data/graphs/graph_67f3055ddb.json | jq '.data.edges | map(select(.data != {})) | length'
# 结果: 0 （所有边的data都是空对象）
```

---

## 修复方案

### 方案1: 修改 create-v2-graphs.js（适用于脚本生成的数据）

**问题**：脚本只从节点推断关系，没有从原始数据中读取边的属性。

**修复步骤**：
1. 修改 `createEdges()` 函数，接受原始边数据作为参数
2. 创建边时，从原始边数据中查找匹配的边并保留其 `data` 属性
3. 如果找不到匹配的边，使用空对象（向后兼容）

**注意**：此方案适用于通过脚本生成的数据，但如果数据是通过前端导入的，需要检查导入流程。

### 方案2: 检查数据导入流程（适用于前端导入的数据）

如果数据是通过前端"导入数据"功能导入的：
1. 检查 `CreateGraphModal` 是否正确传递边的 `data` 字段
2. 检查 `MultiGraphService.createGraph()` 是否正确保存边的 `data` 字段
3. 确保导入时边的属性数据被完整保留

### 方案3: 在Schema中定义关系属性

在Schema中定义关系类型的 `properties`，即使数据为空，也能显示Schema定义的结构。

---

## 实施建议

### 优先级1: 检查数据导入流程

如果用户是通过前端导入 `core-domain-data.json` 创建图谱的，需要检查：
1. 前端是否正确读取并传递边的 `data` 字段
2. 后端是否正确保存边的 `data` 字段

### 优先级2: 修改创建脚本

如果数据是通过脚本生成的，需要修改 `create-v2-graphs.js`。

### 优先级3: Schema定义

在Schema中定义关系类型的properties，提供更好的用户体验。

---

## 验证步骤

1. 检查图谱数据文件中边的 `data` 字段
2. 如果数据是通过导入创建的，检查导入流程
3. 如果数据是通过脚本生成的，修改脚本并重新生成
4. 使用Playwright验证前端显示
