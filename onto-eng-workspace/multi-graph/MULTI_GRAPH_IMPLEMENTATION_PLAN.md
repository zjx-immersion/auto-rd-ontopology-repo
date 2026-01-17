# 多图谱管理和Schema版本管理 - 实施计划

**分支**: feature/multi-graph-eng  
**开始日期**: 2026-01-17  
**预计周期**: 6-8周  
**状态**: 🚀 Phase 1 进行中

---

## 📋 目录

1. [总体目标](#总体目标)
2. [Phase 1: 多图谱管理](#phase-1-多图谱管理)
3. [Phase 2: Schema版本管理](#phase-2-schema版本管理)
4. [技术架构](#技术架构)
5. [数据模型设计](#数据模型设计)
6. [API设计](#api设计)
7. [前端组件设计](#前端组件设计)
8. [测试计划](#测试计划)

---

## 🎯 总体目标

### 需求1: 多图谱管理
**目标**: 支持创建、管理、切换多个知识图谱

**核心功能**:
- ✅ 图谱列表页（查看所有图谱）
- ✅ 创建图谱（选择Schema + 上传数据 + 验证）
- ✅ 图谱查看页（复用现有所有视图组件）
- ✅ 图谱操作（编辑元信息、复制、删除、导出）
- ✅ 图谱切换（快速切换当前查看的图谱）

**价值**:
- 支持多项目管理
- 每个图谱独立配置Schema
- 数据隔离和安全

---

### 需求2: Schema版本管理
**目标**: Schema可通过列表页管理，支持版本控制

**核心功能**:
- ✅ Schema列表页（查看所有Schema）
- ✅ Schema详情页（查看/编辑Schema定义）
- ✅ 版本管理（创建版本、查看历史、版本对比、回滚）
- ✅ 图谱关联（创建图谱时选择Schema版本）
- ✅ Schema导入导出

**价值**:
- 规范化Schema管理
- 支持Schema演进
- 版本追溯和回滚

---

## 📅 Phase 1: 多图谱管理（2-3周）

### Week 1: 后端基础 ✅ 进行中

#### 任务1.1: 数据模型设计 (2小时)
**状态**: 🚀 进行中

**Graph数据模型**:
```javascript
{
  id: 'graph_001',                     // 唯一ID (UUID)
  name: '岚图智能驾驶图谱v1',          // 名称
  description: '...',                   // 描述
  schemaId: 'schema_001',              // 关联的Schema ID
  schemaVersion: '1.0.0',              // 使用的Schema版本
  data: {                              // 图谱数据
    nodes: [...],                      // 节点数组
    edges: [...]                       // 边数组
  },
  metadata: {
    created: '2026-01-17T10:00:00Z',   // 创建时间
    updated: '2026-01-17T12:00:00Z',   // 更新时间
    createdBy: 'admin',                // 创建者
    tags: ['智能驾驶', '研发'],        // 标签
    status: 'active',                  // 状态: active, archived
    statistics: {                      // 统计信息
      nodeCount: 20,
      edgeCount: 80,
      lastAccessed: '2026-01-17T12:00:00Z'
    }
  }
}
```

**文件存储结构**:
```
data/
├── graphs/
│   ├── index.json                    # 图谱索引（元数据）
│   ├── graph_001.json               # 图谱数据
│   ├── graph_002.json
│   └── ...
└── schemas/                          # Schema目录（Phase 2）
```

**index.json结构**:
```json
{
  "graphs": {
    "graph_001": {
      "id": "graph_001",
      "name": "岚图智能驾驶图谱v1",
      "schemaId": "schema_001",
      "schemaVersion": "1.0.0",
      "created": "2026-01-17T10:00:00Z",
      "updated": "2026-01-17T12:00:00Z",
      "status": "active"
    }
  }
}
```

---

#### 任务1.2: 后端服务实现 (6小时)
**状态**: ⏳ 待开始

**文件**: `backend/src/services/MultiGraphService.js`

**核心方法**:
```javascript
class MultiGraphService {
  constructor() {
    this.graphsDir = path.join(__dirname, '../../../data/graphs');
    this.index = {};
    this.init();
  }

  // 初始化
  async init() {
    await this.ensureDirectories();
    await this.loadIndex();
  }

  // 图谱CRUD
  async createGraph(graphData)      // 创建图谱
  async getGraph(id)                 // 获取图谱详情
  async getGraphs(filter)            // 获取图谱列表（支持搜索、分页）
  async updateGraph(id, updates)     // 更新图谱
  async deleteGraph(id)              // 删除图谱
  
  // 图谱操作
  async duplicateGraph(id, newName)  // 复制图谱
  async exportGraph(id, format)      // 导出图谱（JSON/Excel）
  async validateGraph(id, schemaId)  // 验证图谱数据
  
  // 索引管理
  async updateIndex(graph)           // 更新索引
  async loadIndex()                  // 加载索引
  async saveIndex()                  // 保存索引
}
```

---

#### 任务1.3: API路由实现 (4小时)
**状态**: ⏳ 待开始

**文件**: `backend/src/routes/graphs.js`

**API端点**:
```javascript
// 图谱管理
GET    /api/v1/graphs              // 获取图谱列表
POST   /api/v1/graphs              // 创建图谱
GET    /api/v1/graphs/:id          // 获取图谱详情
PUT    /api/v1/graphs/:id          // 更新图谱
DELETE /api/v1/graphs/:id          // 删除图谱

// 图谱操作
POST   /api/v1/graphs/:id/duplicate   // 复制图谱
POST   /api/v1/graphs/:id/export      // 导出图谱
POST   /api/v1/graphs/:id/validate    // 验证图谱
GET    /api/v1/graphs/:id/statistics  // 获取统计信息
```

**请求/响应示例**:
```javascript
// 创建图谱
POST /api/v1/graphs
Request:
{
  "name": "岚图智能驾驶图谱v2",
  "description": "GOP项目知识图谱",
  "schemaId": "schema_001",
  "schemaVersion": "1.0.0",
  "data": {
    "nodes": [...],
    "edges": [...]
  },
  "tags": ["GOP", "智能驾驶"]
}

Response:
{
  "success": true,
  "data": {
    "id": "graph_002",
    "name": "岚图智能驾驶图谱v2",
    ...
  }
}

// 获取图谱列表
GET /api/v1/graphs?page=1&pageSize=20&search=智能驾驶&status=active

Response:
{
  "success": true,
  "data": {
    "graphs": [...],
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

---

#### 任务1.4: 数据验证 (2小时)
**状态**: ⏳ 待开始

**文件**: `backend/src/validators/graphValidator.js`

**验证规则**:
- 图谱名称必填且唯一
- Schema ID必须存在
- 数据格式验证（nodes/edges结构）
- Schema符合性检查

---

### Week 2: 前端核心 ⏳ 待开始

#### 任务2.1: 安装依赖和配置路由 (2小时)

**安装依赖**:
```bash
cd frontend
npm install react-router-dom@6
```

**配置路由**:
```javascript
// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/graphs" />} />
          <Route path="/graphs" element={<GraphListPage />} />
          <Route path="/graphs/:id" element={<GraphViewPage />} />
          <Route path="/schemas" element={<SchemaListPage />} />
          <Route path="/schemas/:id" element={<SchemaDetailPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
```

---

#### 任务2.2: 状态管理（Context API）(4小时)

**文件**: `frontend/src/contexts/GraphsContext.js`

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { getGraphs, getGraph, createGraph, updateGraph, deleteGraph } from '../services/api';

const GraphsContext = createContext();

export const GraphsProvider = ({ children }) => {
  const [graphs, setGraphs] = useState([]);
  const [currentGraph, setCurrentGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const loadGraphs = async (filter) => {
    setLoading(true);
    try {
      const data = await getGraphs(filter);
      setGraphs(data.graphs);
    } catch (error) {
      console.error('Failed to load graphs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadGraph = async (id) => {
    setLoading(true);
    try {
      const graph = await getGraph(id);
      setCurrentGraph(graph);
    } catch (error) {
      console.error('Failed to load graph:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ... 其他方法
  
  return (
    <GraphsContext.Provider value={{
      graphs,
      currentGraph,
      loading,
      loadGraphs,
      loadGraph,
      createGraph: handleCreateGraph,
      updateGraph: handleUpdateGraph,
      deleteGraph: handleDeleteGraph
    }}>
      {children}
    </GraphsContext.Provider>
  );
};

export const useGraphs = () => {
  const context = useContext(GraphsContext);
  if (!context) {
    throw new Error('useGraphs must be used within GraphsProvider');
  }
  return context;
};
```

---

#### 任务2.3: 图谱列表页 (8小时)

**文件**: `frontend/src/pages/GraphListPage.js`

**功能**:
- 图谱卡片列表展示
- 搜索和筛选
- 分页
- 创建图谱按钮
- 操作菜单（查看、编辑、复制、删除、导出）

**UI设计**:
```javascript
const GraphListPage = () => {
  return (
    <PageContainer>
      <PageHeader
        title="图谱管理"
        extra={[
          <Button type="primary" onClick={handleCreate}>
            创建图谱
          </Button>
        ]}
      />
      
      <SearchBar
        placeholder="搜索图谱..."
        onSearch={handleSearch}
      />
      
      <FilterBar
        filters={['全部', '活跃', '已归档']}
        onChange={handleFilterChange}
      />
      
      <Row gutter={[16, 16]}>
        {graphs.map(graph => (
          <Col xs={24} sm={12} lg={8} xl={6}>
            <GraphCard
              graph={graph}
              onView={() => navigate(`/graphs/${graph.id}`)}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onExport={handleExport}
            />
          </Col>
        ))}
      </Row>
      
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
      />
    </PageContainer>
  );
};
```

---

#### 任务2.4: 创建图谱流程 (6小时)

**文件**: `frontend/src/components/CreateGraphModal.js`

**步骤**:
1. 基本信息（名称、描述、标签）
2. 选择Schema（列表选择 + 版本选择）
3. 导入数据（上传JSON/Excel，或空图谱）
4. 验证数据（显示验证结果）
5. 确认创建

**UI设计**:
```javascript
const CreateGraphModal = ({ visible, onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  return (
    <Modal
      title="创建新图谱"
      visible={visible}
      width={800}
      footer={null}
    >
      <Steps current={step}>
        <Step title="基本信息" />
        <Step title="选择Schema" />
        <Step title="导入数据" />
        <Step title="验证" />
      </Steps>
      
      <div style={{ marginTop: 24 }}>
        {step === 1 && <BasicInfoForm />}
        {step === 2 && <SchemaSelector />}
        {step === 3 && <DataUploader />}
        {step === 4 && <ValidationReport />}
      </div>
      
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        {step > 1 && (
          <Button onClick={handlePrev}>上一步</Button>
        )}
        {step < 4 && (
          <Button type="primary" onClick={handleNext}>
            下一步
          </Button>
        )}
        {step === 4 && (
          <Button type="primary" onClick={handleCreate}>
            创建图谱
          </Button>
        )}
      </div>
    </Modal>
  );
};
```

---

### Week 3: 功能完善 ⏳ 待开始

#### 任务3.1: 图谱查看页重构 (6小时)

**文件**: `frontend/src/pages/GraphViewPage.js`

**功能**:
- 从URL获取graphId
- 加载对应的图谱数据和Schema
- 复用现有所有视图组件
- 添加面包屑导航
- 添加图谱切换器

```javascript
const GraphViewPage = () => {
  const { id } = useParams();
  const { currentGraph, loadGraph } = useGraphs();
  const { schema, loadSchema } = useSchemas();
  
  useEffect(() => {
    loadGraph(id);
  }, [id]);
  
  useEffect(() => {
    if (currentGraph) {
      loadSchema(currentGraph.schemaId, currentGraph.schemaVersion);
    }
  }, [currentGraph]);
  
  if (!currentGraph || !schema) {
    return <Loading />;
  }
  
  return (
    <PageContainer>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Link to="/graphs">图谱列表</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{currentGraph.name}</Breadcrumb.Item>
      </Breadcrumb>
      
      <PageHeader
        title={currentGraph.name}
        subTitle={currentGraph.description}
        extra={[
          <GraphSwitcher />,
          <Button onClick={handleEdit}>编辑</Button>,
          <Button onClick={handleExport}>导出</Button>
        ]}
      />
      
      {/* 复用现有视图组件 */}
      <ViewSwitcher />
      {viewMode === 'graph' && <GraphView data={currentGraph.data} schema={schema} />}
      {viewMode === 'table' && <TableView data={currentGraph.data} schema={schema} />}
      {viewMode === 'tree' && <TreeView data={currentGraph.data} schema={schema} />}
      {viewMode === 'matrix' && <MatrixView data={currentGraph.data} schema={schema} />}
      {viewMode === 'dashboard' && <Dashboard data={currentGraph.data} schema={schema} />}
    </PageContainer>
  );
};
```

---

#### 任务3.2: 图谱操作功能 (4小时)

**功能**:
- 编辑图谱元信息（名称、描述、标签）
- 复制图谱
- 删除图谱（带确认）
- 导出图谱（JSON/Excel）

---

#### 任务3.3: 测试和优化 (4小时)

**测试内容**:
- 创建图谱流程测试
- 图谱列表加载测试
- 图谱切换测试
- 数据验证测试
- 错误处理测试

---

## 📅 Phase 2: Schema版本管理（2-3周）

### Week 1: Schema管理基础 ⏳ 待开始

#### 任务4.1: Schema数据模型 (2小时)

**Schema模型**:
```javascript
{
  id: 'schema_001',
  name: '岚图智能驾驶本体模型',
  description: '...',
  currentVersion: '1.2.0',
  content: {                          // Schema定义内容
    version: '1.2.0',
    entityTypes: { ... },
    relationTypes: { ... }
  },
  metadata: {
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-17T10:00:00Z',
    author: 'admin',
    status: 'stable',                 // draft, stable, deprecated
    usedByGraphs: ['graph_001', 'graph_002']
  }
}
```

**Schema Version模型**:
```javascript
{
  id: 'version_001',
  schemaId: 'schema_001',
  version: '1.2.0',
  content: { ... },                   // 该版本的完整内容
  metadata: {
    created: '2026-01-17T10:00:00Z',
    author: 'admin',
    changeLog: '新增5个实体类型，优化关系定义',
    tag: 'stable',                    // draft, stable, deprecated
    previousVersion: '1.1.0'
  }
}
```

---

#### 任务4.2: Schema后端服务 (6小时)

**文件**: `backend/src/services/SchemaService.js`

**核心方法**:
```javascript
class SchemaService {
  // Schema CRUD
  async createSchema(schemaData)
  async getSchema(id)
  async getSchemas(filter)
  async updateSchema(id, updates)
  async deleteSchema(id)
  
  // 版本管理
  async createVersion(schemaId, content, changeLog)
  async getVersions(schemaId)
  async getVersion(schemaId, version)
  async rollbackVersion(schemaId, version)
  async compareVersions(schemaId, v1, v2)
  
  // Schema使用
  async getSchemaUsage(schemaId)
  async migrateGraph(graphId, newSchemaId, newVersion)
}
```

---

#### 任务4.3: Schema API路由 (4小时)

**API端点**:
```javascript
// Schema管理
GET    /api/v1/schemas              // 获取Schema列表
POST   /api/v1/schemas              // 创建Schema
GET    /api/v1/schemas/:id          // 获取Schema详情
PUT    /api/v1/schemas/:id          // 更新Schema
DELETE /api/v1/schemas/:id          // 删除Schema

// 版本管理
GET    /api/v1/schemas/:id/versions          // 获取版本历史
POST   /api/v1/schemas/:id/versions          // 创建新版本
GET    /api/v1/schemas/:id/versions/:version // 获取特定版本
POST   /api/v1/schemas/:id/versions/:version/rollback  // 回滚版本
GET    /api/v1/schemas/:id/versions/compare  // 对比版本

// 使用情况
GET    /api/v1/schemas/:id/usage    // 获取使用该Schema的图谱
```

---

### Week 2: Schema前端页面 ⏳ 待开始

#### 任务5.1: Schema列表页 (4小时)

**文件**: `frontend/src/pages/SchemaListPage.js`

**功能**:
- Schema卡片列表
- 搜索和筛选
- 创建Schema按钮
- 操作菜单（查看、编辑、版本管理、复制、删除、导出）

---

#### 任务5.2: Schema详情页 (8小时)

**文件**: `frontend/src/pages/SchemaDetailPage.js`

**功能**:
- 基本信息展示
- 实体类型列表（可展开查看属性）
- 关系类型列表
- 版本历史
- 使用情况（哪些图谱在使用）
- 编辑模式

**Tabs设计**:
- 基本信息
- 实体类型
- 关系类型
- 版本历史
- 使用情况

---

#### 任务5.3: 版本管理功能 (6小时)

**功能**:
- 版本历史列表
- 版本对比（Diff视图）
- 创建新版本（带变更日志）
- 回滚到历史版本
- 版本标签管理

---

### Week 3: 集成和测试 ⏳ 待开始

#### 任务6.1: 图谱-Schema集成 (4小时)

**功能**:
- 创建图谱时选择Schema和版本
- 显示图谱使用的Schema版本
- Schema迁移工具（升级到新版本）
- 兼容性检查

---

#### 任务6.2: 数据迁移和兼容性 (4小时)

**功能**:
- 现有数据迁移到新结构
- 默认图谱创建（基于现有data）
- 默认Schema创建（基于现有schema.json）
- 向后兼容性处理

---

#### 任务6.3: 测试和文档 (6小时)

**测试**:
- 单元测试
- 集成测试
- E2E测试

**文档**:
- API文档更新
- 用户使用指南
- 开发者文档

---

## 🏗️ 技术架构

### 前端架构

```
App (Router + Providers)
├── GraphsProvider (图谱状态)
├── SchemasProvider (Schema状态)
└── Routes
    ├── /graphs (图谱列表)
    ├── /graphs/:id (图谱查看)
    ├── /schemas (Schema列表)
    └── /schemas/:id (Schema详情)
```

### 后端架构

```
Express API
├── routes/
│   ├── graphs.js          # 图谱路由
│   └── schemas.js         # Schema路由
├── services/
│   ├── MultiGraphService.js   # 图谱服务
│   └── SchemaService.js       # Schema服务
└── validators/
    ├── graphValidator.js      # 图谱验证
    └── schemaValidator.js     # Schema验证
```

### 数据存储

```
data/
├── graphs/
│   ├── index.json        # 图谱索引
│   ├── graph_001.json
│   └── graph_002.json
└── schemas/
    ├── index.json        # Schema索引
    ├── schema_001/
    │   ├── current.json  # 当前版本
    │   ├── metadata.json # 元数据
    │   └── versions/
    │       ├── 1.0.0.json
    │       ├── 1.1.0.json
    │       └── history.json
    └── schema_002/
```

---

## 📈 进度追踪

### Phase 1: 多图谱管理

| 任务 | 工时 | 状态 | 完成度 |
|------|------|------|--------|
| 数据模型设计 | 2h | 🚀 进行中 | 100% |
| 后端服务实现 | 6h | ⏳ 待开始 | 0% |
| API路由实现 | 4h | ⏳ 待开始 | 0% |
| 数据验证 | 2h | ⏳ 待开始 | 0% |
| 前端路由配置 | 2h | ⏳ 待开始 | 0% |
| Context状态管理 | 4h | ⏳ 待开始 | 0% |
| 图谱列表页 | 8h | ⏳ 待开始 | 0% |
| 创建图谱流程 | 6h | ⏳ 待开始 | 0% |
| 图谱查看页重构 | 6h | ⏳ 待开始 | 0% |
| 图谱操作功能 | 4h | ⏳ 待开始 | 0% |
| 测试和优化 | 4h | ⏳ 待开始 | 0% |
| **小计** | **48h** | | **2%** |

### Phase 2: Schema版本管理

| 任务 | 工时 | 状态 | 完成度 |
|------|------|------|--------|
| Schema数据模型 | 2h | ⏳ 待开始 | 0% |
| Schema后端服务 | 6h | ⏳ 待开始 | 0% |
| Schema API路由 | 4h | ⏳ 待开始 | 0% |
| Schema列表页 | 4h | ⏳ 待开始 | 0% |
| Schema详情页 | 8h | ⏳ 待开始 | 0% |
| 版本管理功能 | 6h | ⏳ 待开始 | 0% |
| 图谱-Schema集成 | 4h | ⏳ 待开始 | 0% |
| 数据迁移 | 4h | ⏳ 待开始 | 0% |
| 测试和文档 | 6h | ⏳ 待开始 | 0% |
| **小计** | **44h** | | **0%** |

### 总计

**总工时**: 92小时  
**预计周期**: 6-8周（按每周12-16工作小时）  
**当前进度**: 2%

---

## 📝 关键决策

### 决策1: 数据存储方案 ✅
**选择**: 文件系统（Phase 1）
**理由**: 
- 快速实现MVP
- 易于调试
- 无额外依赖
- 后续可升级到SQLite

### 决策2: 前端状态管理 ✅
**选择**: React Context API
**理由**:
- 无需引入Redux，降低复杂度
- 足够支持多图谱管理
- 与现有代码风格一致

### 决策3: 路由方案 ✅
**选择**: React Router v6
**理由**:
- 成熟稳定
- 社区支持好
- API简洁

---

## 🚨 风险和挑战

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 数据迁移问题 | 中 | 高 | 提供迁移脚本，保留备份 |
| 性能问题 | 低 | 中 | 分页、懒加载、缓存 |
| 状态管理复杂度 | 中 | 中 | 良好的Context设计，必要时引入Redux |
| 向后兼容性 | 中 | 高 | 保留旧API，渐进式迁移 |

---

## 📚 相关文档

- [架构演进详细分析](onto-eng-workspace/ARCHITECTURE_EVOLUTION_ANALYSIS.md)
- [演进方案执行摘要](onto-eng-workspace/EVOLUTION_EXECUTIVE_SUMMARY.md)
- [项目进度总结](onto-eng-workspace/PROJECT_STATUS_SUMMARY.md)

---

**分支**: feature/multi-graph-eng  
**创建日期**: 2026-01-17  
**最后更新**: 2026-01-17  
**负责人**: [待指定]
