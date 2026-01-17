# 多图谱管理功能使用指南

**版本**: v2.0  
**更新日期**: 2026-01-17  
**状态**: ✅ Phase 1 完成

---

## 🎉 新功能概览

系统已升级支持**多图谱管理**功能！现在您可以：
- 📊 创建和管理多个知识图谱
- 🔄 在不同图谱间快速切换
- 📁 为每个图谱独立配置Schema
- 🎯 复制、导出、删除图谱
- 🔍 搜索和筛选图谱

---

## 🚀 快速开始

### 1. 启动系统

```bash
# 方式1: 使用一键启动脚本
./start.sh

# 方式2: 手动启动
cd backend && npm start    # 启动后端（端口8090）
cd frontend && npm start   # 启动前端（端口8080）
```

### 2. 访问图谱列表

打开浏览器访问：`http://localhost:8080`

系统会自动跳转到图谱列表页 (`/graphs`)

---

## 📖 功能说明

### 图谱列表页

**功能**:
- 📋 查看所有图谱的卡片列表
- 🔍 搜索图谱（按名称或描述）
- 🏷️ 按状态筛选（全部/活跃/已归档）
- 📄 分页浏览
- ➕ 创建新图谱

**操作**:
- **查看图谱**: 点击卡片或点击操作菜单中的"查看"
- **编辑图谱**: 点击操作菜单中的"编辑"
- **复制图谱**: 点击操作菜单中的"复制"
- **导出图谱**: 点击操作菜单中的"导出"（JSON格式）
- **删除图谱**: 点击操作菜单中的"删除"（需确认）

---

### 创建图谱流程

点击"创建图谱"按钮，按照4个步骤完成：

#### 步骤1: 基本信息
- **图谱名称** (必填): 为图谱起一个有意义的名称
- **描述** (可选): 简要说明图谱的用途
- **标签** (可选): 添加标签便于分类

#### 步骤2: 选择Schema
- 查看当前系统的Schema信息
- 选择Schema版本（目前支持v1.0.0）
- 查看实体类型预览

#### 步骤3: 导入数据
- **上传JSON文件**: 上传包含nodes和edges的JSON数据
- **创建空图谱**: 或者创建空图谱后手动添加数据

JSON数据格式示例：
```json
{
  "nodes": [
    {
      "id": "node1",
      "label": "节点1",
      "type": "VehicleProject",
      "properties": {}
    }
  ],
  "edges": [
    {
      "source": "node1",
      "target": "node2",
      "type": "manages"
    }
  ]
}
```

#### 步骤4: 确认创建
- 查看创建摘要
- 确认信息无误后点击"创建图谱"

---

### 图谱查看页

点击图谱卡片进入图谱查看页，可以：

- **多视图浏览**: 图谱、表格、树形、矩阵、仪表盘、Schema
- **数据操作**: 添加、编辑、删除节点和关系
- **追溯查询**: 需求追溯和影响分析
- **导入数据**: 导入Markdown、Excel、JSON数据

**导航**:
- 顶部显示面包屑：图谱列表 > 当前图谱名称
- 点击"图谱列表"可返回列表页

---

## 🔧 数据迁移

如果您之前使用的是单图谱版本，系统已自动迁移数据。

### 手动迁移（如需要）

```bash
cd backend
node scripts/migrate-to-multi-graph.js
```

迁移脚本会：
- ✅ 读取现有的 `sample-data.json`
- ✅ 创建默认图谱
- ✅ 生成索引文件
- ✅ 备份原始文件

---

## 📂 数据存储结构

```
data/
├── graphs/
│   ├── index.json              # 图谱索引（元数据）
│   ├── graph_xxx.json         # 图谱数据文件
│   └── graph_yyy.json
├── schema.json                 # Schema定义（保留）
└── sample-data.backup.json     # 备份文件（迁移时创建）
```

---

## 🔌 API接口

### 图谱管理API

```http
# 获取图谱列表
GET /api/v1/graphs?page=1&pageSize=20&search=智能驾驶

# 创建图谱
POST /api/v1/graphs
{
  "name": "新图谱",
  "description": "...",
  "schemaId": "default",
  "schemaVersion": "1.0.0",
  "data": { "nodes": [], "edges": [] },
  "tags": ["标签1"]
}

# 获取图谱详情
GET /api/v1/graphs/:id

# 更新图谱
PUT /api/v1/graphs/:id
{
  "name": "更新的名称",
  "description": "...",
  "tags": ["标签1", "标签2"]
}

# 删除图谱
DELETE /api/v1/graphs/:id

# 复制图谱
POST /api/v1/graphs/:id/duplicate
{
  "newName": "副本图谱"
}

# 导出图谱
GET /api/v1/graphs/:id/export

# 验证图谱
POST /api/v1/graphs/:id/validate

# 获取统计信息
GET /api/v1/graphs/:id/statistics
```

完整API文档见: [API.md](docs/API.md)

---

## 🎯 使用场景

### 场景1: 多项目管理
为不同的车型项目创建独立的知识图谱：
- GOP项目图谱
- GOOE项目图谱
- 智能驾驶图谱

### 场景2: 环境隔离
为不同环境创建图谱：
- 开发环境图谱
- 测试环境图谱
- 生产环境图谱

### 场景3: 版本管理
为不同版本创建图谱：
- v1.0 图谱
- v2.0 图谱
- 实验性图谱

---

## 💡 最佳实践

### 命名规范
- 使用有意义的图谱名称，如"岚图GOP-Q1季度规划"
- 添加描述说明图谱的用途和范围
- 使用标签进行分类（如"研发"、"测试"、"GOP"）

### 数据管理
- 定期备份重要图谱（导出为JSON）
- 为大型图谱添加描述性标签
- 及时归档不再使用的图谱（状态改为archived）

### 性能优化
- 单个图谱节点数建议不超过1000个
- 大数据集建议拆分为多个图谱
- 定期清理无用的图谱

---

## 🐛 故障排除

### 问题1: 图谱列表为空
**原因**: 可能是首次启动或数据迁移失败  
**解决**: 
```bash
node backend/scripts/migrate-to-multi-graph.js
```

### 问题2: 无法创建图谱
**原因**: Schema加载失败  
**解决**: 确保 `data/schema.json` 文件存在且格式正确

### 问题3: 导入数据失败
**原因**: JSON格式不正确  
**解决**: 检查JSON文件包含nodes和edges字段

### 问题4: 图谱查看页空白
**原因**: 图谱ID不存在或数据损坏  
**解决**: 返回图谱列表，选择其他图谱或重新创建

---

## 📚 相关文档

- [实施计划](MULTI_GRAPH_IMPLEMENTATION_PLAN.md) - 完整的技术实施计划
- [进度报告](PHASE1_PROGRESS_REPORT.md) - Phase 1进度详情
- [架构演进](onto-eng-workspace/ARCHITECTURE_EVOLUTION_ANALYSIS.md) - 架构设计原理
- [API文档](docs/API.md) - 完整的API接口说明

---

## 🔮 后续计划（Phase 2）

即将推出的功能：
- 📋 Schema版本管理
- 🔄 Schema列表页
- 📝 Schema在线编辑
- 📊 Schema版本历史和对比
- 🔗 图谱-Schema关联管理

敬请期待！

---

## 📞 技术支持

如有问题或建议，请：
- 查看文档: [onto-eng-workspace/](onto-eng-workspace/)
- 提交Issue: GitHub Issues
- 联系团队: 岚图智能驾驶研发团队

---

**文档版本**: v2.0  
**最后更新**: 2026-01-17  
**维护者**: 开发团队
