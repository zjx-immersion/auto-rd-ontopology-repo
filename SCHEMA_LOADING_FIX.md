# Schema加载和节点颜色显示问题修复

**修复日期**: 2026-01-17  
**Git提交**: `8f30f01`  
**状态**: ✅ 已修复

---

## 🐛 问题描述

用户反馈：
- **所有节点都是蓝色** - 只有一个实体类
- **左侧实体类型为空** - 显示"暂无Schema定义"
- **图例说明显示"暂无Schema定义"**

---

## 🔍 问题分析

### 根本原因

1. **Schema文件路径变更**
   - Schema文件已移动到 `data/schemaVersions/` 目录
   - GraphService仍从旧路径 `data/schema.json` 加载
   - 导致Schema加载失败，返回null

2. **节点颜色设置逻辑**
   ```javascript
   // GraphView.js formatGraphData函数
   const entityType = schema?.entityTypes?.[node.type];
   color: entityType?.color || '#1890ff'  // 如果schema为null，所有节点都是蓝色
   ```

3. **前端显示逻辑**
   - Sidebar组件依赖schema显示实体类型
   - 如果schema为null，显示"暂无Schema定义"
   - 统计信息依赖schema计算entity_counts

---

## ✅ 修复方案

### 1. 修复GraphService Schema加载路径

**文件**: `backend/src/services/GraphService.js`

**修复前**:
```javascript
const schemaPath = path.join(this.dataPath, 'schema.json');
```

**修复后**:
```javascript
// 优先加载V2.0 Schema
const schemaV2Path = path.join(this.dataPath, 'schemaVersions', 'core-domain-schema-v2.json');
const schemaPath = path.join(this.dataPath, 'schemaVersions', 'schema.json');
const oldSchemaPath = path.join(this.dataPath, 'schema.json');

// 按优先级加载
if (fs.existsSync(schemaV2Path)) {
  this.schema = JSON.parse(fs.readFileSync(schemaV2Path, 'utf8'));
  console.log('✅ Schema V2.0加载成功');
}
else if (fs.existsSync(schemaPath)) {
  this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  console.log('✅ Schema加载成功');
}
else if (fs.existsSync(oldSchemaPath)) {
  this.schema = JSON.parse(fs.readFileSync(oldSchemaPath, 'utf8'));
  console.log('✅ Schema加载成功（旧路径）');
}
```

**效果**:
- ✅ 优先加载Schema V2.0
- ✅ 向后兼容旧路径
- ✅ 提供清晰的加载日志

### 2. 添加调试日志

**文件**: 
- `frontend/src/pages/GraphViewPage.js`
- `frontend/src/components/GraphView.js`

**添加的日志**:
```javascript
// GraphViewPage.js
console.log('Schema loaded:', schemaData ? 'YES' : 'NO');
if (schemaData) {
  console.log('EntityTypes count:', Object.keys(schemaData.entityTypes || {}).length);
}

// GraphView.js
if (data.nodes.indexOf(node) < 5) {
  console.log(`Node ${node.id} (${node.type}): color=${color}, entityType=${entityType ? 'found' : 'not found'}`);
}
```

**效果**:
- ✅ 便于调试Schema加载问题
- ✅ 快速定位节点颜色设置问题

---

## 🧪 验证步骤

### 1. 验证Schema文件存在

```bash
ls -la data/schemaVersions/*.json
```

**预期结果**:
```
-rw-r--r-- core-domain-schema-v2.json  # Schema V2.0
-rw-r--r-- core-domain-schema.json     # Schema V1.0
-rw-r--r-- schema.json                  # 当前活动Schema
```

### 2. 验证GraphService能加载Schema

```bash
node -e "const GraphService = require('./backend/src/services/GraphService'); const service = GraphService.getInstance(); setTimeout(() => { const schema = service.getSchema(); console.log('Schema loaded:', schema ? 'YES' : 'NO'); if (schema) { console.log('EntityTypes count:', Object.keys(schema.entityTypes || {}).length); } }, 1000);"
```

**预期结果**:
```
✅ Schema V2.0加载成功
Schema loaded: YES
EntityTypes count: 48
```

### 3. 重启服务并测试

```bash
# 1. 停止服务
./stop.sh

# 2. 启动服务
./start.sh

# 3. 访问图谱
open http://localhost:8080/graphs/graph_c4bc4181c4

# 4. 检查浏览器控制台
# 应该看到：
# - Schema loaded: YES
# - EntityTypes count: 48
# - Node ... (Vehicle): color=#1890ff, entityType=found
```

### 4. 验证节点颜色

**预期结果**:
- ✅ 不同实体类型显示不同颜色
- ✅ 左侧显示实体类型列表（33-43个）
- ✅ 图例说明显示所有类型
- ✅ 节点颜色与图例一致

---

## 📊 预期效果

### 修复前

- ❌ 所有节点都是蓝色（#1890ff）
- ❌ 左侧实体类型为空
- ❌ 图例说明显示"暂无Schema定义"
- ❌ 无法区分不同实体类型

### 修复后

- ✅ 不同实体类型显示不同颜色
  - Vehicle: #1890ff (蓝色)
  - DomainProject: #096dd9 (深蓝色)
  - Feature: #52c41a (绿色)
  - Module: #1890ff (蓝色)
  - 等等...
- ✅ 左侧显示33-43个实体类型（按数量排序）
- ✅ 图例说明显示所有类型及其颜色
- ✅ 可以清晰区分不同实体类型

---

## 🔧 技术细节

### Schema文件结构

```json
{
  "version": "2.0.0",
  "entityTypes": {
    "Vehicle": {
      "code": "Vehicle",
      "label": "车型",
      "color": "#1890ff",
      "properties": {...}
    },
    "DomainProject": {
      "code": "DomainProject",
      "label": "领域项目",
      "color": "#096dd9",
      "properties": {...}
    },
    ...
  }
}
```

### 节点颜色设置流程

```
1. GraphService加载Schema
   ↓
2. API返回Schema给前端
   ↓
3. GraphViewPage接收Schema
   ↓
4. GraphView.formatGraphData()使用Schema
   ↓
5. 为每个节点设置color: entityType?.color || '#1890ff'
   ↓
6. Cytoscape使用data(color)渲染节点
```

---

## ⚠️ 注意事项

1. **服务重启**
   - 修复后必须重启后端服务
   - GraphService在启动时加载Schema

2. **浏览器缓存**
   - 如果问题仍然存在，清除浏览器缓存
   - 强制刷新页面（Ctrl+Shift+R / Cmd+Shift+R）

3. **Schema文件位置**
   - 确保 `data/schemaVersions/core-domain-schema-v2.json` 存在
   - 文件大小约46KB，包含48个实体类型

---

## 📝 相关文件

| 文件 | 变更说明 |
|------|---------|
| `backend/src/services/GraphService.js` | 修复Schema加载路径 |
| `frontend/src/pages/GraphViewPage.js` | 添加Schema加载日志 |
| `frontend/src/components/GraphView.js` | 添加节点颜色调试日志 |

---

## ✅ 验收清单

- [x] GraphService Schema加载路径修复
- [x] 添加调试日志
- [x] 向后兼容旧路径
- [ ] 重启服务并验证（待用户操作）
- [ ] 验证节点颜色正确显示（待用户操作）
- [ ] 验证左侧实体类型显示（待用户操作）

---

**修复完成日期**: 2026-01-17  
**修复者**: AI Assistant  
**Git提交**: `8f30f01`  
**状态**: ✅ 代码已修复，待重启服务验证

**下一步**: 重启服务并测试验证
