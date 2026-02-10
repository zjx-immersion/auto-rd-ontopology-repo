# Schema 可视化编辑器 - 技术设计文档

**版本**: v1.0  
**日期**: 2026-02-10  
**状态**: 🚧 开发中  
**分支**: `feature/schema-editor`

---

## 1. 架构概述

### 1.1 技术栈
- **画布引擎**: @xyflow/react (React Flow v12)
- **状态管理**: Zustand
- **UI 组件**: Ant Design 5
- **样式**: CSS Modules

### 1.2 组件架构
```
SchemaEditor (页面)
├── SchemaToolbar (工具栏)
│   ├── 模式选择 (选择/实体/关系)
│   ├── 保存按钮
│   └── 撤销/重做
├── SchemaCanvas (画布)
│   ├── ReactFlow 画布
│   ├── EntityTypeNode (实体类型节点)
│   └── RelationTypeEdge (关系类型边)
└── PropertyPanel (属性面板)
    ├── EntityTypeEditor
    ├── RelationTypeEditor
    └── PropertyConfig
```

---

## 2. 数据结构

### 2.1 编辑器状态
```typescript
interface SchemaEditorState {
  // Schema 数据
  schema: {
    entityTypes: Record<string, EntityType>;
    relationTypes: Record<string, RelationType>;
  };
  
  // UI 状态
  selectedItem: SelectedItem | null;
  editorMode: 'select' | 'addEntity' | 'addRelation';
  
  // 历史记录 (用于撤销/重做)
  history: SchemaHistory[];
  historyIndex: number;
}

interface EntityType {
  id: string;
  label: string;
  description?: string;
  color: string;
  properties: Record<string, PropertyDef>;
  parentType?: string;
  isAbstract?: boolean;
  // React Flow 位置
  position: { x: number; y: number };
}

interface RelationType {
  id: string;
  label: string;
  description?: string;
  from: string[];  // 源实体类型ID列表
  to: string[];    // 目标实体类型ID列表
  properties?: Record<string, PropertyDef>;
  bidirectional?: boolean;
}

interface PropertyDef {
  type: 'String' | 'Integer' | 'Float' | 'Boolean' | 'Date' | 'Enum' | 'Text';
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}
```

### 2.2 React Flow 节点/边数据
```typescript
// 实体类型节点
interface EntityTypeNodeData {
  type: 'entityType';
  entityType: EntityType;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// 关系类型边
interface RelationTypeEdgeData {
  type: 'relationType';
  relationType: RelationType;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

---

## 3. 路由设计

### 3.1 新增路由
```javascript
// App.js 路由配置
<Route path="/schema-editor" element={<SchemaEditorPage />} />
<Route path="/schema-editor/:graphId" element={<SchemaEditorPage />} />
```

### 3.2 入口点
1. **独立入口**: `/schema-editor` - 创建/编辑全局 Schema
2. **图谱关联入口**: `/graphs/:id` → SchemaViewer → [编辑] → `/schema-editor/:graphId`

---

## 4. 核心功能实现

### 4.1 实体类型创建
1. 点击工具栏 [➕ 实体] 按钮
2. 鼠标变为十字准星
3. 点击画布空白处
4. 创建默认实体类型节点
5. 自动打开属性面板

### 4.2 关系类型创建
1. 点击工具栏 [➡️ 关系] 按钮
2. 从源实体节点拖拽连线
3. 放到目标实体节点上
4. 弹出关系类型配置弹窗
5. 确认后创建关系类型

### 4.3 属性配置
- 支持动态增删属性
- 属性类型选择器
- 约束条件动态显示
- 实时验证

### 4.4 保存与加载
```javascript
// 保存 Schema
POST /api/v1/schema/save
{
  entityTypes: {...},
  relationTypes: {...}
}

// 加载 Schema
GET /api/v1/schema/load?graphId=xxx
```

---

## 5. UI 设计

### 5.1 布局
```
┌────────────────────────────────────────────────────────────┐
│  [🏠] 本体图谱编辑器                    [💾保存] [↩️撤销] [↪️重做]  │
├──────────┬─────────────────────────────────────┬───────────┤
│          │                                     │           │
│  工具栏   │           画布区域                  │  属性面板  │
│          │         (React Flow)               │           │
│  🔘选择  │                                     │  [选中项]  │
│  ➕实体  │    ┌─────┐      ┌─────┐           │  ───────── │
│  ➡️关系  │    │需求 │──────│模块 │           │  名称:     │
│          │    └──┬──┘      └─────┘           │  [______] │
│  ───────  │       │                           │           │
│          │    ┌──┴──┐                        │  属性:     │
│  图例    │    │功能 │                        │  • name ✕  │
│  🟦实体  │    └─────┘                        │  • desc ✕  │
│  ➡️关系  │                                     │  [+添加]   │
│          │                                     │           │
│          │                                     │  [保存]    │
│          │                                     │           │
└──────────┴─────────────────────────────────────┴───────────┘
```

### 5.2 节点样式
- **实体类型节点**: 圆角矩形，背景色 = 实体类型 color
- **选中状态**: 红色边框 + 阴影
- **悬停状态**: 轻微放大 + 操作按钮显示

### 5.3 边样式
- **关系类型边**: 带箭头的贝塞尔曲线
- **标签**: 关系名称，放置在边中部
- **选中状态**: 红色 + 加粗

---

## 6. API 接口

### 6.1 新增后端接口
```javascript
// 保存 Schema
POST /api/v1/schema/save
Request: {
  graphId?: string;  // 可选，关联图谱
  schema: {
    entityTypes: Record<string, EntityType>;
    relationTypes: Record<string, RelationType>;
  }
}
Response: { success: true, message: '保存成功' }

// 加载 Schema
GET /api/v1/schema/load?graphId=xxx
Response: {
  success: true;
  data: {
    entityTypes: {...};
    relationTypes: {...};
  }
}

// 验证 Schema
POST /api/v1/schema/validate
Request: { schema: {...} }
Response: {
  success: true;
  data: {
    valid: boolean;
    errors: ValidationError[];
  }
}
```

---

## 7. 开发计划

### Day 1: 基础框架
- [x] 创建 feature 分支
- [x] 安装 React Flow 依赖
- [x] 创建技术设计文档
- [ ] 创建 SchemaEditor 页面组件
- [ ] 配置路由

### Day 2: 实体类型
- [ ] EntityTypeNode 组件
- [ ] 拖拽创建实体
- [ ] 实体类型基础属性编辑

### Day 3: 关系类型
- [ ] RelationTypeEdge 组件
- [ ] 连线创建关系
- [ ] 关系类型配置

### Day 4: 属性配置
- [ ] PropertyPanel 组件
- [ ] 属性增删改
- [ ] 属性类型选择器

### Day 5: 保存/加载
- [ ] 后端 API 实现
- [ ] 前端保存逻辑
- [ ] 加载现有 Schema

---

**最后更新**: 2026-02-10
