# 岚图智能驾驶研发知识图谱系统

基于本体建模的可视化知识图谱系统，用于智能驾驶研发场景的需求追溯、影响分析和数据关联。

## 📋 系统特性

### 核心功能
- ✅ **多视图展示**：图谱、表格、树形、矩阵、仪表盘 5种视图
- ✅ **数据导入支持**：支持 JSON、Markdown、Excel 文件导入
- ✅ **智能追溯查询**：向上/向下追溯链路分析，影响范围评估
- ✅ **Schema管理**：可视化查看、导出、未定义类型检测
- ✅ **性能优化**：矩阵视图分页渲染，支持大规模数据
- ✅ **RESTful API**：完整的后端 API 支持数据查询和追溯

### 最新增强（2026-01-17）
- ✅ **树形视图**：类层次和实例树展示，支持搜索和右键菜单
- ✅ **矩阵视图**：关系矩阵热力图，性能提升10倍，支持缩放平移
- ✅ **仪表盘**：统计分析和可视化图表
- ✅ **Schema查看器**：完整的Schema可视化和管理
- ✅ **关系类型分析**：交互式表格展示，支持实例查看

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

### 一键启动（推荐）

```bash
# 启动所有服务（前端8080 + 后端8090）
./start.sh

# 查看服务状态
./status.sh

# 查看日志
./logs.sh

# 停止所有服务
./stop.sh
```

### 手动启动

```bash
# 1. 安装依赖（首次运行）
cd backend && npm install
cd ../frontend && npm install

# 2. 启动后端服务（端口：8090）
cd backend && npm start

# 3. 启动前端应用（端口：8080）
cd frontend && npm start
```

访问 http://localhost:8080 查看系统

### Docker部署（可选）

```bash
# 启动第三方服务（Elasticsearch, Redis, Neo4j等）
./docker-start.sh

# 停止Docker服务
./docker-stop.sh
```

详见 [Docker部署指南](docs/DOCKER_DEPLOYMENT_GUIDE.md)

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

## 📚 文档导航

### 用户文档
- 📖 [快速开始指南](docs/QUICK_START.md) - 系统安装和使用指南
- 🎯 [使用示例](docs/USAGE_EXAMPLES.md) - 常见场景和操作示例
- 🔧 [API文档](docs/API.md) - RESTful API接口说明
- 🏗️ [架构说明](docs/ARCHITECTURE.md) - 系统架构和技术栈
- 🐳 [Docker部署](docs/DOCKER_DEPLOYMENT_GUIDE.md) - Docker容器化部署

### 开发文档
- 📋 [本体工程能力规划](onto-eng-workspace/README.md) - 完整的产品规划和路线图
- 📊 [项目进度总结](onto-eng-workspace/PROJECT_STATUS_SUMMARY.md) - 当前进度和待实施任务
- 🏗️ [架构演进方案](onto-eng-workspace/EVOLUTION_EXECUTIVE_SUMMARY.md) - 多图谱和Schema版本管理
- 📝 [Sprint交付文档](onto-eng-workspace/) - Sprint 01/02完成情况

### 设计文档
- 📐 [需求分析](onto-eng-workspace/01-REQUIREMENTS.md) - 完整功能需求
- 👥 [用户故事](onto-eng-workspace/02-USER_STORIES.md) - 60+敏捷故事
- 🎨 [设计规格](onto-eng-workspace/03-DESIGN_SPEC.md) - 技术设计方案
- 🗺️ [实施路线图](onto-eng-workspace/04-IMPLEMENTATION_ROADMAP.md) - 6阶段规划

## 📝 开发计划

### 已完成 ✅
- [x] Phase 1：基础架构搭建
- [x] Phase 2：数据导入功能
- [x] Phase 3：图谱可视化
- [x] Phase 4：追溯查询 API
- [x] Sprint 01：多视图展示（树形、矩阵、仪表盘）
- [x] Sprint 02：性能优化与交互增强
- [x] 架构演进方案设计

### 待实施 ⏳
- [ ] 阶段一：Schema可视化编辑器 + 数据验证
- [ ] 阶段二：SPARQL查询 + 推理引擎
- [ ] 阶段三：版本控制 + 权限管理
- [ ] 阶段四：AI增强（NL查询、图嵌入）
- [ ] 阶段五：企业级能力（性能、插件）

详见 [实施路线图](onto-eng-workspace/04-IMPLEMENTATION_ROADMAP.md)

## 📄 许可证

Copyright © 2026 岚图汽车智能驾驶团队
