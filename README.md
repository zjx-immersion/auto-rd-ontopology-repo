# 岚图智能驾驶研发知识图谱系统

基于本体建模的可视化知识图谱系统，用于智能驾驶研发场景的需求追溯、影响分析和数据关联。

## 📋 系统特性

- ✅ **可视化图谱展示**：基于 Cytoscape.js 的交互式知识图谱可视化
- ✅ **数据导入支持**：支持 Markdown 表格和 Excel 文件导入
- ✅ **智能追溯查询**：向上/向下追溯链路分析，影响范围评估
- ✅ **标准化 Schema**：基于岚图智能驾驶研发本体模型 V0.1
- ✅ **RESTful API**：完整的后端 API 支持数据查询和追溯
- ✅ **多实体类型**：支持车型项目、系统需求、软件需求、模型版本等

## 🏗️ 系统架构

```
auto-rd-ontopology-repo/
├── frontend/          # React 前端应用
│   ├── src/
│   │   ├── components/    # UI组件
│   │   ├── services/      # API服务
│   │   ├── utils/         # 工具函数
│   │   └── App.js         # 主应用
│   └── package.json
├── backend/           # Node.js 后端服务
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── services/      # 业务逻辑
│   │   ├── parsers/       # 数据解析器
│   │   └── server.js      # 服务入口
│   └── package.json
├── data/              # 示例数据
│   ├── schema.json        # 本体Schema定义
│   ├── sample-data.json   # 样本三元组数据
│   └── ontology.xlsx      # Excel数据模板
└── README.md
```

## 🚀 快速启动

### 环境要求

- Node.js >= 16.x
- npm >= 8.x

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动服务

```bash
# 启动后端服务（端口：3001）
cd backend
npm start

# 启动前端应用（端口：3000）
cd frontend
npm start
```

访问 http://localhost:3000 查看系统

## 📊 核心功能

### 1. 数据导入

支持两种数据源格式：

**Markdown 表格**：
- 实体属性表（本体 Schema）
- 三元组关系表（知识图谱数据）

**Excel 文件**：
- 标准化三元组格式
- 支持批量导入

### 2. 可视化图谱

- **节点类型**：车型项目、系统需求、软件需求、模型版本等
- **关系类型**：管理、拆解为、指导、产出、验证于等
- **交互功能**：点击节点查看详情、拖拽调整布局、缩放平移

### 3. 追溯查询 API

**需求追溯**：
```http
POST /api/v1/ontology/trace
{
  "entity_id": "SWR_5001",
  "query_type": "full_trace",
  "depth": 3
}
```

**影响分析**：
```http
POST /api/v1/ontology/trace
{
  "entity_id": "SYS_2001",
  "query_type": "impact_analysis"
}
```

**下游任务查询**：
```http
POST /api/v1/ontology/trace
{
  "entity_id": "SSTS_1001",
  "query_type": "downstream_tasks"
}
```

## 📖 本体模型

基于岚图智能驾驶研发场景设计的本体 Schema V0.1：

### 核心实体类

| 实体类 | 代码 | 说明 |
|--------|------|------|
| 车型项目 | VehicleProject | GOP/GOOE平台项目 |
| 系统需求 | SSTS | 系统级功能需求 |
| 系统架构 | SYS_2_5 | 系统架构设计 |
| 软件需求 | SWR | 软件开发需求 |
| 感知融合模块 | PerceptionFusion | OD/PD/Lane等模块 |
| 模型版本 | ModelVersion | 算法模型版本 |
| 发布包 | ReleasePackage | Daily/MRD构建包 |
| 测试用例 | TestCase | 测试覆盖 |

### 核心关系

- `管理`：车型项目 → 系统需求
- `拆解为`：系统需求 → 系统架构 → 软件需求
- `指导`：软件需求 → 开发模块
- `产出`：开发模块 → 模型版本/代码提交
- `集成于`：模型版本 → 发布包
- `验证于`：软件需求 → 测试用例
- `发现`：测试用例 → 问题

## 🔧 配置说明

### 后端配置

`backend/src/config.js`：
```javascript
{
  port: 3001,
  dataDir: '../data',
  maxTraceDepth: 5
}
```

### 前端配置

`frontend/src/config.js`：
```javascript
{
  apiBaseUrl: 'http://localhost:3001/api/v1'
}
```

## 📈 业务价值

- **追溯效率提升**：500+ 需求追溯时间从 2 小时 → 2 秒
- **可视化展示**：清晰展示需求、架构、开发、测试全链路
- **风险预警**：自动识别变更影响范围，提前预警风险
- **跨系统整合**：统一玄武平台、模型仓库、GitLab 等多源数据

## 📝 开发计划

- [x] Phase 1：基础架构搭建
- [x] Phase 2：数据导入功能
- [x] Phase 3：图谱可视化
- [x] Phase 4：追溯查询 API
- [ ] Phase 5：Neo4j 集成（可选）
- [ ] Phase 6：权限管理和多用户支持

## 📄 许可证

Copyright © 2026 岚图汽车智能驾驶团队
