# Sprint 01 计划 - Schema可视化编辑器 MVP

## Sprint 信息

**Sprint编号**: Sprint-01  
**Sprint目标**: 完成Schema可视化编辑器的MVP版本  
**开始日期**: 2026-01-20  
**结束日期**: 2026-02-02 (2周)  
**Sprint时长**: 2周 / 10个工作日  
**团队规模**: 2-3人  
**可用工时**: 120-180小时

---

## Sprint 目标

### 主要目标
实现Schema可视化编辑器的核心功能，让领域专家能够通过图形化界面设计本体模型，无需编写代码。

### 成功标准
- [ ] 用户可以拖拽创建实体类型
- [ ] 用户可以为实体类型添加和配置属性
- [ ] 用户可以创建实体间的关系类型
- [ ] Schema可以保存和加载
- [ ] 提供基础的可视化展示（画布、节点、连线）

### 不包含在本Sprint
- 复杂的约束定义（留待下个Sprint）
- 关系特性设置（对称性、传递性等）
- 继承关系（留待下个Sprint）
- 模板功能

---

## 用户故事列表

### ✅ 已选入本Sprint的故事

#### 🎯 US-1.1: 拖拽创建实体类型 (高优先级)
**描述**: 作为领域专家，我想要通过拖拽方式快速创建实体类型，以便无需编写代码就能构建本体模型

**任务分解**:
- [ ] Task 1.1.1: 设计SchemaEditor主组件结构 (4h)
  - 创建基础布局（工具栏+画布+属性面板）
  - 状态管理设计
  
- [ ] Task 1.1.2: 实现SchemaCanvas画布组件 (6h)
  - 使用react-konva或react-flow
  - 支持拖拽、缩放、平移
  - 网格背景和辅助线
  
- [ ] Task 1.1.3: 实现EntityTypeNode节点组件 (4h)
  - 节点渲染（图标、名称、边框）
  - 选中效果
  - 拖拽移动
  
- [ ] Task 1.1.4: 实现工具栏和创建流程 (4h)
  - "添加实体"按钮
  - 点击画布创建节点
  - 节点ID生成和管理

**验收标准**:
- [ ] 点击"添加实体"按钮，在画布上点击可创建新节点
- [ ] 节点显示名称和图标
- [ ] 可以拖拽移动节点
- [ ] 点击节点可选中（高亮显示）
- [ ] 支持撤销/重做

**估算工时**: 18小时  
**分配给**: 前端开发 A

---

#### 🎯 US-1.2: 定义实体属性 (高优先级)
**描述**: 作为领域专家，我想要为实体类型添加和配置属性，以便详细描述实体的特征

**任务分解**:
- [ ] Task 1.2.1: 设计属性数据结构 (2h)
  - 定义Property接口
  - 支持的类型：String, Integer, Float, Boolean, Date, Enum, Text
  
- [ ] Task 1.2.2: 实现PropertyPanel属性面板 (6h)
  - 侧边栏布局
  - EntityTypeEditor表单
  - 实体基本信息编辑（名称、描述、颜色）
  
- [ ] Task 1.2.3: 实现PropertyList属性列表 (8h)
  - 属性列表展示
  - 添加属性按钮
  - 属性编辑对话框
  - 删除属性功能
  
- [ ] Task 1.2.4: 实现约束配置（基础版） (6h)
  - 必填选项（required checkbox）
  - 唯一性选项（unique checkbox）
  - 默认值输入
  - Enum类型的枚举值配置

**验收标准**:
- [ ] 选中节点后右侧显示属性面板
- [ ] 可以编辑实体名称、描述
- [ ] 可以添加新属性（名称、类型、描述）
- [ ] 支持7种属性类型选择
- [ ] 可以设置必填和唯一约束
- [ ] 可以删除属性
- [ ] 属性变更实时反映在节点上

**估算工时**: 22小时  
**分配给**: 前端开发 A + 前端开发 B

---

#### 🎯 US-1.4: 可视化创建关系类型 (高优先级)
**描述**: 作为领域专家，我想要定义实体之间的关系类型，以便表达领域知识中的关联关系

**任务分解**:
- [ ] Task 1.4.1: 设计关系数据结构 (2h)
  - 定义RelationType接口
  - domain和range定义
  
- [ ] Task 1.4.2: 实现RelationArrow连线组件 (6h)
  - 箭头渲染
  - 标签显示
  - 选中效果
  
- [ ] Task 1.4.3: 实现创建关系流程 (8h)
  - "添加关系"模式
  - 从源节点拖拽到目标节点
  - 关系类型命名
  - 自动连接到节点边缘
  
- [ ] Task 1.4.4: 实现RelationTypeEditor编辑器 (6h)
  - 关系名称、描述编辑
  - domain和range选择
  - 方向性设置（单向/双向）

**验收标准**:
- [ ] 可以从一个节点拖拽连线到另一个节点
- [ ] 连线上显示关系类型名称
- [ ] 点击连线可以编辑关系属性
- [ ] 可以设置关系的域和值域
- [ ] 可以删除关系

**估算工时**: 22小时  
**分配给**: 前端开发 B

---

#### 🔧 Backend: Schema管理API (必需)
**描述**: 实现后端Schema管理接口，支持Schema的CRUD操作

**任务分解**:
- [ ] Task B.1: 设计Schema存储结构 (2h)
  - JSON文件格式定义
  - 内存缓存机制
  
- [ ] Task B.2: 实现SchemaService (6h)
  - loadSchema()
  - saveSchema()
  - updateEntityType()
  - updateRelationType()
  
- [ ] Task B.3: 实现API路由 (4h)
  - GET /schema
  - PUT /schema
  - POST /schema/entity-types
  - PUT /schema/entity-types/:id
  - DELETE /schema/entity-types/:id
  - POST /schema/relation-types
  - PUT /schema/relation-types/:id
  - DELETE /schema/relation-types/:id
  
- [ ] Task B.4: API测试 (4h)
  - 单元测试
  - 集成测试
  - Postman测试集

**验收标准**:
- [ ] 所有API接口正常工作
- [ ] Schema修改持久化到文件
- [ ] API响应时间 < 100ms
- [ ] 错误处理完善
- [ ] 单元测试覆盖率 > 80%

**估算工时**: 16小时  
**分配给**: 后端开发 C

---

#### 🎨 UI/UX优化 (中优先级)
**描述**: 优化用户界面和交互体验

**任务分解**:
- [ ] Task UI.1: 设计组件样式 (4h)
  - 节点样式设计（颜色、边框、阴影）
  - 连线样式设计
  - 属性面板样式
  
- [ ] Task UI.2: 实现交互反馈 (4h)
  - Hover效果
  - Loading状态
  - Toast提示
  - 确认对话框
  
- [ ] Task UI.3: 响应式适配 (4h)
  - 不同屏幕尺寸适配
  - 侧边栏可折叠

**估算工时**: 12小时  
**分配给**: 前端开发 A

---

#### 🧪 测试和修复 (必需)
**描述**: 全面测试功能并修复Bug

**任务分解**:
- [ ] Task T.1: 功能测试 (4h)
  - 创建测试用例
  - 手动功能测试
  - 记录Bug
  
- [ ] Task T.2: Bug修复 (8h)
  - 修复发现的问题
  - 回归测试
  
- [ ] Task T.3: 代码审查 (4h)
  - Code Review
  - 代码重构
  - 性能优化

**估算工时**: 16小时  
**分配给**: 全团队

---

## 总工时估算

| 用户故事 / 任务 | 估算工时 | 分配 |
|----------------|---------|------|
| US-1.1: 拖拽创建实体类型 | 18h | 前端 A |
| US-1.2: 定义实体属性 | 22h | 前端 A+B |
| US-1.4: 创建关系类型 | 22h | 前端 B |
| Backend: Schema管理API | 16h | 后端 C |
| UI/UX优化 | 12h | 前端 A |
| 测试和修复 | 16h | 全团队 |
| **总计** | **106小时** | |

**风险缓冲**: 14小时 (13%)  
**Sprint总容量**: 120小时

---

## Sprint Backlog

### Day 1-2 (周一-周二): 基础框架
- [ ] 搭建SchemaEditor主组件
- [ ] 实现画布基础功能
- [ ] 设计数据结构
- [ ] 创建API路由骨架

### Day 3-4 (周三-周四): 核心功能实现
- [ ] 实现节点创建和拖拽
- [ ] 实现属性面板
- [ ] 实现Backend API
- [ ] 开始关系创建功能

### Day 5-6 (周五-下周一): 功能完善
- [ ] 完成关系创建功能
- [ ] 属性编辑功能
- [ ] API集成和联调

### Day 7-8 (周二-周三): UI优化
- [ ] 样式优化
- [ ] 交互反馈
- [ ] 响应式适配

### Day 9-10 (周四-周五): 测试和修复
- [ ] 功能测试
- [ ] Bug修复
- [ ] Code Review
- [ ] Sprint Review准备

---

## 技术栈

### 前端
- **图形库**: React-Flow (推荐) 或 React-Konva
  - React-Flow: 更适合图形编辑，内置节点连线功能
  - React-Konva: 更底层，灵活性高但需要更多实现
- **UI组件**: Ant Design 5
- **状态管理**: React Hooks (useState, useContext)
- **表单**: Ant Design Form
- **颜色选择器**: react-colorful

### 后端
- **框架**: Express (现有)
- **存储**: JSON文件 + 内存缓存
- **验证**: Joi 或 Yup

### 开发工具
- **代码编辑器**: VSCode
- **API测试**: Postman
- **版本控制**: Git
- **任务管理**: GitHub Issues / Jira

---

## Definition of Done (完成定义)

一个用户故事被认为完成，需要满足：

- [ ] 代码已实现并提交到Git
- [ ] 通过所有验收标准
- [ ] 代码经过Code Review
- [ ] 无已知的Critical或High优先级Bug
- [ ] 集成到主分支（feature/ontology-engineering）
- [ ] 在本地环境测试通过
- [ ] 相关文档已更新

---

## 风险和依赖

### 风险
| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| React-Flow学习曲线 | 中 | 中 | 提前2天完成技术预研 |
| 拖拽交互复杂度超预期 | 中 | 高 | 简化MVP功能，复杂交互推迟到下个Sprint |
| API设计需要调整 | 低 | 中 | 前后端提前对齐接口规范 |
| 团队成员请假 | 低 | 高 | 交叉培训，确保每个模块至少2人了解 |

### 依赖
- 无外部依赖
- 后端API需要在Day 4前完成基础版本，供前端集成

---

## Daily Standup

每天早上 10:00 进行站会，每人回答：
1. 昨天完成了什么？
2. 今天计划做什么？
3. 遇到了什么障碍？

---

## Sprint Review

**时间**: 2026-02-02 15:00  
**参与者**: 开发团队 + 产品经理 + 利益相关者

**演示内容**:
1. Schema可视化编辑器整体介绍
2. 演示创建实体类型
3. 演示添加属性
4. 演示创建关系
5. 演示保存和加载Schema
6. 讨论下一步计划

---

## Sprint Retrospective

**时间**: 2026-02-02 16:00  
**参与者**: 开发团队

**讨论话题**:
1. 哪些做得好？
2. 哪些需要改进？
3. 下个Sprint的改进行动项

---

## 下一个Sprint预告

**Sprint 02 (2周)**: 
- 实体继承关系
- 关系特性设置（传递性、对称性）
- 复杂约束定义
- 数据一致性检查（基础版）

---

## 附录：快速开始

### 环境搭建
```bash
# 前端
cd frontend
npm install react-flow-renderer
npm install react-colorful
npm install joi

# 后端
cd backend
npm install joi

# 启动开发服务器
npm run dev
```

### 目录结构
```
frontend/src/
  components/
    SchemaEditor/
      SchemaEditor.js
      SchemaCanvas.js
      SchemaToolbar.js
      EntityTypeNode.js
      RelationArrow.js
      PropertyPanel/
        PropertyPanel.js
        EntityTypeEditor.js
        PropertyList.js
        PropertyDialog.js
        
backend/src/
  services/
    SchemaService.js
  routes/
    schema.js
  validators/
    schemaValidator.js
```

### API示例

```javascript
// 获取Schema
GET /schema

// 更新Schema
PUT /schema
{
  "entityTypes": {...},
  "relationTypes": {...}
}

// 创建实体类型
POST /schema/entity-types
{
  "label": "Epic",
  "description": "...",
  "properties": {...}
}
```

---

**Sprint负责人**: [指定负责人]  
**创建日期**: 2026-01-16  
**最后更新**: 2026-01-16
