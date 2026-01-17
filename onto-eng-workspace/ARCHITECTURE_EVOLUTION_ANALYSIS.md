# 系统架构演进可行性分析报告

**日期**: 2026-01-17  
**版本**: v1.0  
**状态**: ✅ 分析完成

---

## 📋 目录

1. [当前架构分析](#当前架构分析)
2. [演进需求分析](#演进需求分析)
3. [可行性评估](#可行性评估)
4. [演进方案设计](#演进方案设计)
5. [实施路径](#实施路径)
6. [风险评估](#风险评估)

---

## 1. 当前架构分析

### 1.1 前端架构

#### 状态管理
```javascript
// App.js - 当前状态管理
function App() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] }); // 单一图谱数据
  const [schema, setSchema] = useState(null);                            // 单一Schema
  const [viewMode, setViewMode] = useState('graph');                     // 视图模式
  
  // 数据加载 - 全局单例
  const loadData = async () => {
    const [data, schemaData] = await Promise.all([
      fetchGraphData(),   // 加载唯一的图谱数据
      fetchSchema()       // 加载唯一的Schema
    ]);
  };
}
```

**特点**:
- ✅ 简单直观
- ✅ 适合单图谱场景
- ❌ 无法管理多个图谱
- ❌ 无法切换Schema

#### 组件架构
```
App (根组件)
├── Header (导航栏)
├── Sidebar (侧边栏 - 仅graph视图)
└── Content (主内容区)
    ├── GraphView (图谱视图)
    ├── TableView (表格视图)
    ├── TreeView (树形视图)
    ├── MatrixView (矩阵视图)
    ├── Dashboard (仪表盘)
    └── SchemaViewer (Schema查看器)
```

**特点**:
- ✅ 组件化良好
- ✅ 视图切换灵活
- ✅ 组件复用性高
- ✅ 数据通过props传递

#### 数据流
```
API Service
    ↓
  App State (useState)
    ↓
  Props传递
    ↓
各个View组件
```

**特点**:
- ✅ 单向数据流
- ✅ 清晰可追踪
- ❌ 缺少集中式状态管理
- ❌ 跨组件通信困难

---

### 1.2 后端架构

#### 数据存储
```javascript
// GraphService.js
class GraphService {
  constructor() {
    this.nodes = [];        // 内存中的节点数据
    this.edges = [];        // 内存中的边数据
    this.schema = null;     // 内存中的Schema
    this.dataPath = path.join(__dirname, '../../../data');
    this.loadData();
  }
  
  loadData() {
    // 从文件系统加载
    this.schema = JSON.parse(fs.readFileSync('schema.json'));
    const data = JSON.parse(fs.readFileSync('sample-data.json'));
    this.nodes = data.nodes;
    this.edges = data.edges;
  }
}
```

**文件结构**:
```
data/
├── schema.json          # 单一Schema文件
└── sample-data.json     # 单一数据文件
```

**特点**:
- ✅ 简单直接
- ✅ 适合原型和小规模数据
- ❌ 单一数据源
- ❌ 无数据库支持
- ❌ 无并发控制
- ❌ 无版本管理

#### API设计
```javascript
// 当前API端点
GET  /api/v1/graph       # 获取图谱数据
GET  /api/v1/schema      # 获取Schema
POST /api/v1/import      # 导入数据（覆盖式）
POST /api/v1/trace       # 追溯查询
```

**特点**:
- ✅ RESTful设计
- ✅ 接口简洁
- ❌ 无图谱管理接口
- ❌ 无Schema管理接口

---

### 1.3 Schema应用方式

#### 当前使用方式
```javascript
// 各组件中的Schema使用
const Dashboard = ({ data, schema }) => {
  // 1. 查找类型定义
  const typeDef = schema?.entityTypes?.[node.type];
  const label = typeDef?.label || node.type;
  
  // 2. 验证属性
  const properties = typeDef?.properties;
  
  // 3. 获取颜色配置
  const color = typeDef?.color;
  
  // 4. 查找关系定义
  const relationDef = schema?.relationTypes?.[edge.type];
};
```

**Schema结构**:
```json
{
  "version": "0.1.0",
  "name": "岚图智能驾驶研发本体模型",
  "entityTypes": {
    "VehicleProject": {
      "label": "车型项目",
      "properties": { ... },
      "color": "#1890ff"
    }
  },
  "relationTypes": {
    "manages": {
      "label": "管理",
      "from": ["VehicleProject"],
      "to": ["SSTS"]
    }
  }
}
```

**特点**:
- ✅ 类型系统完整
- ✅ 支持属性定义
- ✅ 支持关系约束
- ❌ 单一版本
- ❌ 无版本历史
- ❌ 无多Schema支持

---

## 2. 演进需求分析

### 需求1: 多图谱数据管理

**描述**: 
> 上传JSON数据后，基于指定schema进行验证，并可视化显示，是一条图谱数据，可以通过一个图谱页进行管理、查看等操作

**细化需求**:

#### 2.1 图谱列表管理
```
功能：
- 查看所有图谱列表
- 创建新图谱
- 删除图谱
- 编辑图谱元信息（名称、描述、标签）
- 搜索和过滤图谱
```

#### 2.2 图谱数据导入
```
功能：
- 选择目标Schema进行验证
- 上传JSON数据
- 实时验证数据格式
- 显示验证报告
- 选择性导入（全部/部分）
```

#### 2.3 图谱切换
```
功能：
- 快速切换当前查看的图谱
- 保留每个图谱的视图状态
- 对比多个图谱
```

#### 2.4 图谱操作
```
功能：
- 复制图谱
- 合并图谱
- 导出图谱
- 分享图谱
```

---

### 需求2: Schema版本管理

**描述**:
> schema可以通过列表页管理，支持上传查看、更新单个schema、也可以查看单个schema的详细内容，并进行更新、修改保存到版本，选择版本加载查看

**细化需求**:

#### 2.1 Schema列表管理
```
功能：
- 查看所有Schema列表
- 创建新Schema
- 删除Schema
- 复制Schema
- 搜索和过滤Schema
```

#### 2.2 Schema详情管理
```
功能：
- 查看Schema完整定义
- 在线编辑Schema
- 实时验证Schema格式
- 预览Schema变更影响
```

#### 2.3 Schema版本控制
```
功能：
- 保存版本（带版本号和说明）
- 查看版本历史
- 对比版本差异
- 回滚到历史版本
- 标记版本（stable, draft, deprecated）
```

#### 2.4 Schema应用
```
功能：
- 选择Schema创建图谱
- 切换图谱使用的Schema版本
- 迁移图谱到新Schema版本
- 验证图谱数据与Schema兼容性
```

---

## 3. 可行性评估

### 3.1 技术可行性：✅ 高度可行

#### 前端技术栈
| 技术 | 现状 | 需要 | 难度 | 评估 |
|------|------|------|------|------|
| React | ✅ 已使用 | 状态管理增强 | ⭐⭐ | 可行 |
| Ant Design | ✅ 已使用 | 新增组件 | ⭐ | 可行 |
| API调用 | ✅ Axios | 新增接口 | ⭐ | 可行 |
| 路由管理 | ❌ 无 | React Router | ⭐⭐ | 需添加 |
| 状态管理 | ⚠️ 简单 | Context/Redux | ⭐⭐⭐ | 建议升级 |

#### 后端技术栈
| 技术 | 现状 | 需要 | 难度 | 评估 |
|------|------|------|------|------|
| Node.js | ✅ 已使用 | 无变更 | - | 可行 |
| Express | ✅ 已使用 | 新增路由 | ⭐ | 可行 |
| 数据存储 | ⚠️ 文件系统 | 数据库 | ⭐⭐⭐⭐ | 需升级 |
| 身份认证 | ❌ 无 | JWT/Session | ⭐⭐⭐ | 可选 |

---

### 3.2 架构兼容性：✅ 良好

#### 现有组件复用性
```
✅ 可直接复用（90%）：
- GraphView        # 只需传入不同的data/schema
- TableView        # 只需传入不同的data/schema
- TreeView         # 只需传入不同的data/schema
- MatrixView       # 只需传入不同的data/schema
- Dashboard        # 只需传入不同的data/schema
- SchemaViewer     # 已支持schema查看

⚠️ 需要调整（10%）：
- App              # 需要路由和多数据状态管理
- Header           # 需要添加图谱/Schema切换器
- ImportModal      # 需要支持选择Schema和目标图谱
```

**评估**: 现有组件设计良好，高度可复用，无需重写

---

### 3.3 数据迁移：⚠️ 需要方案

#### 当前数据结构
```json
{
  "nodes": [...],
  "edges": [...],
  "version": "0.1.0",
  "lastUpdate": "2026-01-17"
}
```

#### 新数据结构（提议）
```json
{
  "id": "graph_001",
  "name": "岚图智能驾驶图谱v1",
  "schemaId": "schema_001",
  "schemaVersion": "1.0.0",
  "data": {
    "nodes": [...],
    "edges": [...]
  },
  "metadata": {
    "created": "2026-01-17",
    "updated": "2026-01-17",
    "tags": ["智能驾驶", "研发"],
    "description": "..."
  }
}
```

**迁移策略**:
1. 保留旧文件作为备份
2. 提供迁移工具自动转换
3. 支持导入旧格式数据

---

### 3.4 性能影响：⚠️ 需要优化

#### 潜在性能问题

| 场景 | 当前性能 | 预期影响 | 优化方案 |
|------|----------|----------|----------|
| 图谱列表加载 | N/A | 中 | 分页+虚拟滚动 |
| Schema列表加载 | N/A | 低 | 缓存+按需加载 |
| 图谱切换 | N/A | 高 | 懒加载+预加载 |
| 数据验证 | N/A | 中高 | Web Worker |
| 版本对比 | N/A | 中 | 增量对比算法 |

**评估**: 需要关注性能优化，但不构成阻碍

---

## 4. 演进方案设计

### 4.1 整体架构设计

#### 新架构图
```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                             │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  App Router (React Router)                        │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  /graphs          - 图谱列表页                     │  │
│  │  /graphs/:id      - 图谱查看页（现有视图）         │  │
│  │  /schemas         - Schema列表页                   │  │
│  │  /schemas/:id     - Schema详情页                   │  │
│  │  /schemas/:id/versions/:ver - Schema版本查看       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  State Management (React Context / Redux)         │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  - GraphsContext      (图谱列表、当前图谱)         │  │
│  │  - SchemasContext     (Schema列表、当前Schema)     │  │
│  │  - UIContext          (视图状态、用户偏好)         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Components (复用现有 + 新增)                      │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  复用：GraphView, TableView, TreeView, etc.       │  │
│  │  新增：GraphList, SchemaList, SchemaEditor, etc.  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     Backend API                          │
├─────────────────────────────────────────────────────────┤
│  GET    /api/v1/graphs              # 获取图谱列表       │
│  POST   /api/v1/graphs              # 创建图谱          │
│  GET    /api/v1/graphs/:id          # 获取图谱详情      │
│  PUT    /api/v1/graphs/:id          # 更新图谱          │
│  DELETE /api/v1/graphs/:id          # 删除图谱          │
│  POST   /api/v1/graphs/:id/validate # 验证图谱数据      │
│                                                           │
│  GET    /api/v1/schemas             # 获取Schema列表     │
│  POST   /api/v1/schemas             # 创建Schema        │
│  GET    /api/v1/schemas/:id         # 获取Schema详情    │
│  PUT    /api/v1/schemas/:id         # 更新Schema        │
│  DELETE /api/v1/schemas/:id         # 删除Schema        │
│                                                           │
│  GET    /api/v1/schemas/:id/versions      # 版本列表    │
│  POST   /api/v1/schemas/:id/versions      # 创建版本    │
│  GET    /api/v1/schemas/:id/versions/:ver # 获取版本    │
│  POST   /api/v1/schemas/:id/versions/:ver/rollback      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Data Storage                           │
├─────────────────────────────────────────────────────────┤
│  方案A: 文件系统 (Phase 1 - MVP)                         │
│  ├── data/                                               │
│  │   ├── graphs/                                         │
│  │   │   ├── graph_001.json                             │
│  │   │   ├── graph_002.json                             │
│  │   │   └── index.json (元数据索引)                     │
│  │   └── schemas/                                        │
│  │       ├── schema_001/                                 │
│  │       │   ├── current.json                            │
│  │       │   └── versions/                               │
│  │       │       ├── 1.0.0.json                          │
│  │       │       ├── 1.1.0.json                          │
│  │       │       └── history.json                        │
│  │       └── index.json                                  │
│                                                           │
│  方案B: SQLite (Phase 2 - Production)                    │
│  ├── Tables:                                             │
│  │   ├── graphs (id, name, schema_id, data, metadata)   │
│  │   ├── schemas (id, name, content, metadata)          │
│  │   └── schema_versions (id, schema_id, version, ...)  │
│                                                           │
│  方案C: MongoDB (Phase 3 - Scale)                        │
│  ├── Collections:                                        │
│  │   ├── graphs                                          │
│  │   ├── schemas                                         │
│  │   └── schema_versions                                 │
└─────────────────────────────────────────────────────────┘
```

---

### 4.2 前端组件设计

#### 新增页面组件

**1. GraphListPage - 图谱列表页**
```javascript
const GraphListPage = () => {
  return (
    <PageLayout title="图谱管理">
      <SearchBar />
      <FilterBar />
      <CreateGraphButton />
      <GraphTable
        columns={[
          '图谱名称',
          'Schema',
          '节点数',
          '关系数',
          '创建时间',
          '操作'
        ]}
        actions={[
          'view',      // 查看
          'edit',      // 编辑元信息
          'duplicate', // 复制
          'export',    // 导出
          'delete'     // 删除
        ]}
      />
      <Pagination />
    </PageLayout>
  );
};
```

**2. GraphViewPage - 图谱查看页（重构现有App）**
```javascript
const GraphViewPage = () => {
  const { graphId } = useParams();
  const { graph, schema } = useGraph(graphId);
  
  return (
    <PageLayout
      title={graph.name}
      breadcrumb={['图谱管理', graph.name]}
      extra={<GraphActions />}
    >
      {/* 复用现有的所有视图组件 */}
      <ViewSwitcher />
      <GraphView data={graph.data} schema={schema} />
      <TableView data={graph.data} schema={schema} />
      {/* ... 其他视图 */}
    </PageLayout>
  );
};
```

**3. SchemaListPage - Schema列表页**
```javascript
const SchemaListPage = () => {
  return (
    <PageLayout title="Schema管理">
      <CreateSchemaButton />
      <SchemaTable
        columns={[
          'Schema名称',
          '版本',
          '实体类型数',
          '关系类型数',
          '使用图谱数',
          '更新时间',
          '操作'
        ]}
        actions={[
          'view',       // 查看
          'edit',       // 编辑
          'versions',   // 版本管理
          'duplicate',  // 复制
          'export',     // 导出
          'delete'      // 删除
        ]}
      />
    </PageLayout>
  );
};
```

**4. SchemaDetailPage - Schema详情页**
```javascript
const SchemaDetailPage = () => {
  const { schemaId } = useParams();
  const [editMode, setEditMode] = useState(false);
  
  return (
    <PageLayout
      title="Schema详情"
      extra={<EditModeSwitch />}
    >
      <Tabs>
        <TabPane tab="基本信息">
          <SchemaMetadataForm />
        </TabPane>
        <TabPane tab="实体类型">
          <EntityTypeEditor editable={editMode} />
        </TabPane>
        <TabPane tab="关系类型">
          <RelationTypeEditor editable={editMode} />
        </TabPane>
        <TabPane tab="版本历史">
          <VersionHistory />
        </TabPane>
        <TabPane tab="使用情况">
          <SchemaUsageList />
        </TabPane>
      </Tabs>
      
      {editMode && (
        <SaveBar
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </PageLayout>
  );
};
```

**5. CreateGraphModal - 创建图谱弹窗**
```javascript
const CreateGraphModal = ({ visible, onClose }) => {
  const [step, setStep] = useState(1);
  
  return (
    <Modal
      title="创建新图谱"
      visible={visible}
      width={800}
    >
      <Steps current={step}>
        <Step title="基本信息" />
        <Step title="选择Schema" />
        <Step title="导入数据" />
        <Step title="验证" />
      </Steps>
      
      {step === 1 && <GraphMetadataForm />}
      {step === 2 && <SchemaSelector />}
      {step === 3 && <DataUploader />}
      {step === 4 && <ValidationReport />}
    </Modal>
  );
};
```

---

### 4.3 状态管理设计

#### 使用 React Context API

```javascript
// contexts/GraphsContext.js
export const GraphsContext = createContext();

export const GraphsProvider = ({ children }) => {
  const [graphs, setGraphs] = useState([]);
  const [currentGraph, setCurrentGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const loadGraphs = async () => {
    const data = await api.getGraphs();
    setGraphs(data);
  };
  
  const loadGraph = async (id) => {
    const graph = await api.getGraph(id);
    setCurrentGraph(graph);
  };
  
  const createGraph = async (graphData) => {
    const newGraph = await api.createGraph(graphData);
    setGraphs([...graphs, newGraph]);
    return newGraph;
  };
  
  const updateGraph = async (id, updates) => {
    await api.updateGraph(id, updates);
    await loadGraphs();
  };
  
  const deleteGraph = async (id) => {
    await api.deleteGraph(id);
    setGraphs(graphs.filter(g => g.id !== id));
  };
  
  return (
    <GraphsContext.Provider value={{
      graphs,
      currentGraph,
      loading,
      loadGraphs,
      loadGraph,
      createGraph,
      updateGraph,
      deleteGraph
    }}>
      {children}
    </GraphsContext.Provider>
  );
};

// Hook使用
const useGraphs = () => {
  const context = useContext(GraphsContext);
  if (!context) {
    throw new Error('useGraphs must be used within GraphsProvider');
  }
  return context;
};
```

```javascript
// contexts/SchemasContext.js
export const SchemasProvider = ({ children }) => {
  const [schemas, setSchemas] = useState([]);
  const [currentSchema, setCurrentSchema] = useState(null);
  const [versions, setVersions] = useState([]);
  
  const loadSchemas = async () => { /* ... */ };
  const loadSchema = async (id) => { /* ... */ };
  const createSchema = async (data) => { /* ... */ };
  const updateSchema = async (id, data) => { /* ... */ };
  const deleteSchema = async (id) => { /* ... */ };
  
  const loadVersions = async (schemaId) => { /* ... */ };
  const createVersion = async (schemaId, data) => { /* ... */ };
  const rollbackVersion = async (schemaId, version) => { /* ... */ };
  
  return (
    <SchemasContext.Provider value={{ /* ... */ }}>
      {children}
    </SchemasContext.Provider>
  );
};
```

#### App.js 重构
```javascript
// 新的App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <GraphsProvider>
      <SchemasProvider>
        <Router>
          <Layout>
            <AppHeader />
            <Routes>
              {/* 图谱管理 */}
              <Route path="/" element={<GraphListPage />} />
              <Route path="/graphs" element={<GraphListPage />} />
              <Route path="/graphs/:id" element={<GraphViewPage />} />
              
              {/* Schema管理 */}
              <Route path="/schemas" element={<SchemaListPage />} />
              <Route path="/schemas/:id" element={<SchemaDetailPage />} />
              <Route path="/schemas/:id/versions/:version" element={<SchemaVersionPage />} />
              
              {/* 其他路由 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </SchemasProvider>
    </GraphsProvider>
  );
}
```

---

### 4.4 后端API设计

#### 数据模型

**Graph Model**
```javascript
{
  id: 'graph_001',                    // 唯一ID
  name: '岚图智能驾驶图谱v1',         // 名称
  description: '...',                  // 描述
  schemaId: 'schema_001',             // 关联的Schema ID
  schemaVersion: '1.0.0',             // 使用的Schema版本
  data: {                             // 图谱数据
    nodes: [...],
    edges: [...]
  },
  metadata: {
    created: '2026-01-17T10:00:00Z',
    updated: '2026-01-17T12:00:00Z',
    createdBy: 'user_001',
    tags: ['智能驾驶', '研发'],
    status: 'active',                 // active, archived
    statistics: {
      nodeCount: 20,
      edgeCount: 80
    }
  }
}
```

**Schema Model**
```javascript
{
  id: 'schema_001',
  name: '岚图智能驾驶本体模型',
  description: '...',
  currentVersion: '1.2.0',
  content: {                          // Schema定义内容
    entityTypes: { ... },
    relationTypes: { ... }
  },
  metadata: {
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-17T10:00:00Z',
    author: 'user_001',
    status: 'stable',                 // draft, stable, deprecated
    usedByGraphs: ['graph_001', 'graph_002']
  }
}
```

**Schema Version Model**
```javascript
{
  id: 'version_001',
  schemaId: 'schema_001',
  version: '1.2.0',
  content: { ... },                   // 该版本的完整内容
  metadata: {
    created: '2026-01-17T10:00:00Z',
    author: 'user_001',
    changeLog: '新增5个实体类型，优化关系定义',
    tag: 'stable',                    // draft, stable, deprecated
    previousVersion: '1.1.0'
  }
}
```

#### API实现

**GraphController.js**
```javascript
class GraphController {
  // 获取图谱列表
  async getGraphs(req, res) {
    const { page = 1, pageSize = 20, search, tags } = req.query;
    const graphs = await graphService.getGraphs({ page, pageSize, search, tags });
    res.json({ data: graphs, total: graphs.length });
  }
  
  // 获取图谱详情
  async getGraph(req, res) {
    const { id } = req.params;
    const graph = await graphService.getGraph(id);
    if (!graph) return res.status(404).json({ error: 'Graph not found' });
    res.json(graph);
  }
  
  // 创建图谱
  async createGraph(req, res) {
    const { name, description, schemaId, schemaVersion, data } = req.body;
    
    // 验证数据
    const schema = await schemaService.getSchemaVersion(schemaId, schemaVersion);
    const validation = await validationService.validate(data, schema);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    // 创建图谱
    const graph = await graphService.createGraph({
      name,
      description,
      schemaId,
      schemaVersion,
      data
    });
    
    res.status(201).json(graph);
  }
  
  // 更新图谱
  async updateGraph(req, res) {
    const { id } = req.params;
    const updates = req.body;
    const graph = await graphService.updateGraph(id, updates);
    res.json(graph);
  }
  
  // 删除图谱
  async deleteGraph(req, res) {
    const { id } = req.params;
    await graphService.deleteGraph(id);
    res.status(204).send();
  }
  
  // 验证图谱数据
  async validateGraph(req, res) {
    const { id } = req.params;
    const { schemaVersion } = req.query;
    const result = await validationService.validateGraph(id, schemaVersion);
    res.json(result);
  }
}
```

**SchemaController.js**
```javascript
class SchemaController {
  // 获取Schema列表
  async getSchemas(req, res) {
    const schemas = await schemaService.getSchemas();
    res.json(schemas);
  }
  
  // 获取Schema详情
  async getSchema(req, res) {
    const { id } = req.params;
    const schema = await schemaService.getSchema(id);
    res.json(schema);
  }
  
  // 创建Schema
  async createSchema(req, res) {
    const { name, description, content } = req.body;
    const schema = await schemaService.createSchema({ name, description, content });
    res.status(201).json(schema);
  }
  
  // 更新Schema
  async updateSchema(req, res) {
    const { id } = req.params;
    const { content, changeLog } = req.body;
    
    // 创建新版本
    const newVersion = await schemaService.createVersion(id, content, changeLog);
    res.json(newVersion);
  }
  
  // 获取版本历史
  async getVersions(req, res) {
    const { id } = req.params;
    const versions = await schemaService.getVersions(id);
    res.json(versions);
  }
  
  // 获取特定版本
  async getVersion(req, res) {
    const { id, version } = req.params;
    const versionData = await schemaService.getVersion(id, version);
    res.json(versionData);
  }
  
  // 回滚版本
  async rollbackVersion(req, res) {
    const { id, version } = req.params;
    const result = await schemaService.rollbackVersion(id, version);
    res.json(result);
  }
}
```

---

### 4.5 数据存储方案

#### Phase 1: 文件系统（MVP - 快速实现）

**目录结构**:
```
data/
├── graphs/
│   ├── index.json                    # 图谱索引
│   ├── graph_001.json               # 图谱数据
│   ├── graph_002.json
│   └── ...
├── schemas/
│   ├── index.json                    # Schema索引
│   ├── schema_001/
│   │   ├── current.json             # 当前版本
│   │   ├── metadata.json            # 元数据
│   │   └── versions/
│   │       ├── 1.0.0.json
│   │       ├── 1.1.0.json
│   │       ├── 1.2.0.json
│   │       └── history.json         # 版本历史索引
│   └── schema_002/
│       └── ...
└── backup/                           # 备份目录
    └── ...
```

**实现**:
```javascript
// services/FileStorageService.js
class FileStorageService {
  constructor() {
    this.dataPath = path.join(__dirname, '../../../data');
    this.ensureDirectories();
  }
  
  // 图谱操作
  async saveGraph(graph) {
    const filePath = path.join(this.dataPath, 'graphs', `${graph.id}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(graph, null, 2));
    await this.updateGraphIndex(graph);
  }
  
  async loadGraph(id) {
    const filePath = path.join(this.dataPath, 'graphs', `${id}.json`);
    const content = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }
  
  // Schema操作
  async saveSchema(schema) {
    const dirPath = path.join(this.dataPath, 'schemas', schema.id);
    await fs.promises.mkdir(dirPath, { recursive: true });
    
    const filePath = path.join(dirPath, 'current.json');
    await fs.promises.writeFile(filePath, JSON.stringify(schema, null, 2));
  }
  
  async saveSchemaVersion(schemaId, version, content) {
    const versionPath = path.join(
      this.dataPath,
      'schemas',
      schemaId,
      'versions',
      `${version}.json`
    );
    await fs.promises.mkdir(path.dirname(versionPath), { recursive: true });
    await fs.promises.writeFile(versionPath, JSON.stringify(content, null, 2));
  }
  
  // 索引操作
  async updateGraphIndex(graph) {
    const indexPath = path.join(this.dataPath, 'graphs', 'index.json');
    const index = await this.loadIndex(indexPath);
    index[graph.id] = {
      id: graph.id,
      name: graph.name,
      schemaId: graph.schemaId,
      created: graph.metadata.created,
      updated: graph.metadata.updated
    };
    await fs.promises.writeFile(indexPath, JSON.stringify(index, null, 2));
  }
}
```

**优点**:
- ✅ 快速实现
- ✅ 无额外依赖
- ✅ 便于调试
- ✅ 易于备份

**缺点**:
- ❌ 并发控制弱
- ❌ 查询性能差
- ❌ 不适合大规模数据

---

#### Phase 2: SQLite（生产环境）

**数据库设计**:
```sql
-- 图谱表
CREATE TABLE graphs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  schema_id TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  data TEXT NOT NULL,              -- JSON格式存储
  metadata TEXT NOT NULL,           -- JSON格式存储
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (schema_id) REFERENCES schemas(id)
);

-- Schema表
CREATE TABLE schemas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  current_version TEXT NOT NULL,
  content TEXT NOT NULL,            -- JSON格式存储
  metadata TEXT NOT NULL,           -- JSON格式存储
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Schema版本表
CREATE TABLE schema_versions (
  id TEXT PRIMARY KEY,
  schema_id TEXT NOT NULL,
  version TEXT NOT NULL,
  content TEXT NOT NULL,            -- JSON格式存储
  change_log TEXT,
  tag TEXT DEFAULT 'draft',         -- draft, stable, deprecated
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (schema_id) REFERENCES schemas(id),
  UNIQUE(schema_id, version)
);

-- 索引
CREATE INDEX idx_graphs_schema ON graphs(schema_id);
CREATE INDEX idx_schema_versions ON schema_versions(schema_id, version);
```

**实现**:
```javascript
// services/SQLiteStorageService.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

class SQLiteStorageService {
  async init() {
    this.db = await open({
      filename: './data/knowledge-graph.db',
      driver: sqlite3.Database
    });
    await this.createTables();
  }
  
  async saveGraph(graph) {
    await this.db.run(`
      INSERT OR REPLACE INTO graphs 
      (id, name, description, schema_id, schema_version, data, metadata, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      graph.id,
      graph.name,
      graph.description,
      graph.schemaId,
      graph.schemaVersion,
      JSON.stringify(graph.data),
      JSON.stringify(graph.metadata)
    ]);
  }
  
  async getGraphs({ page, pageSize, search }) {
    let query = 'SELECT * FROM graphs';
    const params = [];
    
    if (search) {
      query += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);
    
    const rows = await this.db.all(query, params);
    return rows.map(row => ({
      ...row,
      data: JSON.parse(row.data),
      metadata: JSON.parse(row.metadata)
    }));
  }
}
```

**优点**:
- ✅ 性能好
- ✅ 支持事务
- ✅ 查询灵活
- ✅ 零配置

**缺点**:
- ⚠️ 单机限制
- ⚠️ 并发写入有限制

---

## 5. 实施路径

### 5.1 Phase 1: 多图谱管理（2-3周）

#### Week 1: 后端基础
```
□ Day 1-2: 数据模型设计
  - 定义Graph和Schema数据结构
  - 设计文件存储方案
  
□ Day 3-4: API开发
  - 实现GraphController
  - 实现图谱CRUD接口
  - 添加数据验证
  
□ Day 5: 测试和文档
  - 单元测试
  - API文档
```

#### Week 2: 前端核心
```
□ Day 1-2: 路由和状态管理
  - 安装React Router
  - 实现GraphsContext
  - 重构App.js
  
□ Day 3-4: 图谱列表页
  - GraphListPage组件
  - 图谱表格
  - 搜索和筛选
  
□ Day 5: 图谱查看页重构
  - 从URL获取graphId
  - 加载指定图谱数据
  - 复用现有视图组件
```

#### Week 3: 功能完善
```
□ Day 1-2: 创建图谱流程
  - CreateGraphModal
  - Schema选择器
  - 数据上传和验证
  
□ Day 3-4: 图谱操作
  - 编辑元信息
  - 复制图谱
  - 删除图谱
  - 导出图谱
  
□ Day 5: 测试和优化
  - 集成测试
  - 性能优化
  - Bug修复
```

**里程碑**: ✅ 用户可以创建、查看、管理多个图谱

---

### 5.2 Phase 2: Schema版本管理（2-3周）

#### Week 1: Schema管理基础
```
□ Day 1-2: 后端API
  - SchemaController实现
  - 版本存储方案
  - 版本历史查询
  
□ Day 3-4: Schema列表页
  - SchemaListPage
  - Schema表格
  - 创建Schema
  
□ Day 5: Schema详情页
  - SchemaDetailPage基础
  - 查看Schema内容
```

#### Week 2: 版本控制
```
□ Day 1-2: 版本创建
  - 保存新版本
  - 版本号管理
  - 变更日志
  
□ Day 3-4: 版本历史
  - 版本列表
  - 版本对比
  - 版本回滚
  
□ Day 5: Schema编辑器
  - 实体类型编辑
  - 关系类型编辑
  - 实时验证
```

#### Week 3: 集成和优化
```
□ Day 1-2: 图谱-Schema关联
  - 创建图谱时选择Schema版本
  - 查看图谱使用的Schema
  - Schema迁移工具
  
□ Day 3-4: 测试和文档
  - 版本管理测试
  - 用户文档
  
□ Day 5: 发布准备
  - Bug修复
  - 性能优化
```

**里程碑**: ✅ 用户可以管理Schema版本，图谱可关联不同Schema版本

---

### 5.3 Phase 3: 优化和增强（1-2周）

```
□ 性能优化
  - 懒加载
  - 数据缓存
  - 虚拟滚动
  
□ 用户体验
  - 加载状态优化
  - 错误处理增强
  - 快捷键支持
  
□ 高级功能
  - 图谱对比
  - 批量操作
  - 数据导入导出增强
  - Schema自动生成
```

---

## 6. 风险评估

### 6.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 状态管理复杂度 | 中 | 中 | 使用成熟的Context模式，必要时引入Redux |
| 数据迁移问题 | 低 | 高 | 提供迁移工具，保留备份 |
| 性能问题 | 中 | 中 | 分页、懒加载、虚拟滚动 |
| 并发控制 | 低 | 中 | 乐观锁，版本号机制 |

### 6.2 业务风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 需求变更 | 中 | 中 | 分阶段实施，快速迭代 |
| 用户学习成本 | 中 | 低 | 提供详细文档和向导 |
| 数据丢失 | 低 | 高 | 自动备份，版本控制 |

### 6.3 时间风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 开发延期 | 中 | 中 | 留有缓冲时间，优先核心功能 |
| 测试不充分 | 中 | 高 | 自动化测试，分阶段发布 |

---

## 7. 总结

### 7.1 可行性结论

✅ **高度可行**

- 当前架构设计良好，组件复用性高
- 技术栈成熟稳定
- 演进路径清晰
- 风险可控

### 7.2 关键成功因素

1. **渐进式演进** - 不破坏现有功能
2. **组件复用** - 充分利用现有投入
3. **分阶段实施** - 降低风险，快速交付
4. **完善测试** - 保证质量

### 7.3 预期收益

#### 功能收益
- ✅ 支持多图谱管理
- ✅ Schema版本控制
- ✅ 更灵活的数据管理
- ✅ 更好的协作能力

#### 技术收益
- ✅ 更规范的架构
- ✅ 更好的可扩展性
- ✅ 更强的可维护性

#### 用户收益
- ✅ 更强大的功能
- ✅ 更好的用户体验
- ✅ 更高的工作效率

---

## 8. 建议

### 8.1 立即行动

1. **确认需求优先级** - 明确Phase 1-3的优先级
2. **准备开发环境** - 安装依赖，准备测试数据
3. **启动Phase 1** - 多图谱管理是基础

### 8.2 长期规划

1. **Phase 1完成后评估** - 收集用户反馈
2. **根据反馈调整Phase 2-3** - 灵活调整计划
3. **考虑数据库升级** - 当数据量增长时切换到SQLite/MongoDB

---

**报告完成日期**: 2026-01-17  
**报告作者**: AI Assistant  
**审核状态**: Pending Review  
**建议决策**: ✅ 批准演进计划，启动Phase 1开发
