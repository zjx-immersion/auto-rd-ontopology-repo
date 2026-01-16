# 核心领域模型知识图谱数据说明

> **版本**: 1.0.0  
> **创建日期**: 2026-01-16  
> **状态**: ✅ 完整实现

---

## 一、概述

本知识图谱数据基于**MX-2026车型项目**的完整领域模型设计，涵盖了从车型项目到代码交付的全生命周期追溯链。

### 数据文件

| 文件 | 说明 | 实体数 | 关系数 |
|------|------|--------|--------|
| `core-domain-schema.json` | 本体Schema定义 | 22种实体类型 | 20种关系类型 |
| `core-domain-data.json` | 完整知识图谱数据 | 69个节点 | 74条边 |

---

## 二、七大领域架构

### 2.1 领域1: 车型项目域（8个实体）

**实体清单**:
- **1个VehicleProject**: `vp-mx-2026` - MX-2026车型项目
- **1个VehicleModel**: `model-mx-2026` - MX-2026车型定义
- **3个LifecycleNode**: ET节点、PPC节点、SOP节点
- **3个Baseline**: ET基线、PPC基线、SOP基线

**核心关系**:
```
VehicleProject 
  ├─ has_lifecycle_node → LifecycleNode (ET/PPC/SOP)
  │   └─ has_baseline → Baseline
  └─ has_domain_project → DomainProject (智驾/座舱/电子电器)
```

---

### 2.2 领域2: 领域项目域（9个实体）⭐ 核心

**实体清单**:
- **3个DomainProject**: 
  - `dp-mx-2026-adas` - 智能驾驶领域项目
  - `dp-mx-2026-cockpit` - 智能座舱领域项目
  - `dp-mx-2026-eea` - 电子电器领域项目
- **3个PIPlanning**: 
  - `pi-adas-2026-q1` - 智驾Q1 PI规划
  - `pi-adas-2026-q2` - 智驾Q2 PI规划
  - `pi-cockpit-2026-q1` - 座舱Q1 PI规划
- **3个Sprint**: 
  - `spt-2026-q1-1` - Sprint 1 (已完成)
  - `spt-2026-q1-2` - Sprint 2 (进行中)
  - `spt-2026-q1-3` - Sprint 3 (计划中)

**核心关系**:
```
DomainProject 
  ├─ has_pi_planning → PIPlanning
  │   ├─ has_sprint → Sprint
  │   └─ targets_node → LifecycleNode
  └─ belongs_to_domain ← FeatureRequirement
```

---

### 2.3 领域3: 需求管理域（19个实体）⭐ 核心

**实体清单**:
- **3个Epic**: 
  - `epic-highway-driving` - 高速公路智能驾驶
  - `epic-parking-assist` - 智能泊车辅助
  - `epic-voice-interaction` - 智能语音交互
- **6个FeatureRequirement**: 
  - `fr-001-lane-keeping` - 高速车道保持功能
  - `fr-002-auto-lane-change` - 自动变道功能
  - `fr-003-adaptive-cruise` - 自适应巡航功能
  - `fr-004-parking-vertical` - 垂直泊车功能
  - `fr-005-noa-hmi` - NOA HMI交互界面
  - `fr-006-voice-control` - 自然语音控制
- **2个PRDDocument**: 
  - `prd-lane-keeping-001` - 车道保持PRD
  - `prd-auto-lane-change-001` - 自动变道PRD
- **4个SSTS**: 
  - `ssts-001-straight-lane` - 直道车道保持场景
  - `ssts-002-curve-lane` - 弯道车道保持场景
  - `ssts-003-lane-change-left` - 左变道场景
  - `ssts-004-lane-change-right` - 右变道场景
- **4个ModuleRequirement**: 
  - `mr-001-lane-detection` - 车道线识别模块需求
  - `mr-002-vehicle-positioning` - 车辆定位模块需求
  - `mr-003-lateral-control` - 横向控制模块需求
  - `mr-004-lane-change-decision` - 变道决策模块需求

**核心关系**:
```
Epic 
  └─ splits_to_fr → FeatureRequirement
      ├─ belongs_to_domain → DomainProject
      ├─ has_prd → PRDDocument (可选)
      ├─ splits_to_ssts → SSTS
      │   └─ splits_to_mr → ModuleRequirement
      └─ in_baseline → Baseline
```

---

### 2.4 领域4: 迭代执行域（4个实体）

**实体清单**:
- **4个Task**: 
  - `task-001-lanenet-impl` - 实现LaneNet算法 (进行中)
  - `task-002-image-preprocess` - 图像预处理模块 (已完成)
  - `task-003-positioning-fusion` - 多传感器定位融合 (进行中)
  - `task-004-lateral-controller` - 横向PID控制器实现 (评审中)

**核心关系**:
```
ModuleRequirement 
  └─ converts_to_task → Task
      └─ in_sprint → Sprint
```

---

### 2.5 领域5: DevOps交付域（9个实体）

**实体清单**:
- **2个Repository**: 
  - `repo-adas-perception` - 感知仓库
  - `repo-adas-decision` - 决策仓库
- **2个Commit**: 
  - `commit-abc123` - LaneNet算法实现
  - `commit-def456` - 图像预处理模块
- **2个Build**: 
  - `build-001` - 构建成功
  - `build-002` - 构建成功
- **2个Artifact**: 
  - `artifact-001` - adas-perception-v1.2.3
  - `artifact-002` - adas-perception-v1.2.2
- **1个Deployment**: 
  - `deploy-001` - 测试环境部署

**核心关系**:
```
Task 
  └─ implements ← Commit
      ├─ in_repository → Repository
      └─ triggers_build → Build
          └─ produces_artifact → Artifact
              └─ deploys → Deployment
```

---

### 2.6 领域6: 产品资产域（4个实体）

**实体清单**:
- **1个ProductLine**: `productline-adas` - 智驾平台
- **1个Product**: `product-l2plus` - L2+智驾系统
- **1个FeatureAsset**: `feature-asset-lka-001` - 车道保持辅助特性
- **1个ModuleAsset**: `module-asset-perception-001` - 车道线识别模块

**核心关系**:
```
ProductLine 
  └─ has_product → Product
      └─ has_feature → FeatureAsset
          ├─ has_module → ModuleAsset
          ├─ binds_to_feature_asset ← FeatureRequirement
          └─ binds_to_module_asset ← ModuleRequirement
```

---

## 三、完整追溯链示例 ⭐

### 3.1 端到端追溯路径（10层）

```
Epic (需求池)
  └─ epic-highway-driving "高速公路智能驾驶"
      │
      ├─ FeatureRequirement (特性需求)
      │   └─ fr-001-lane-keeping "高速车道保持功能"
      │       │
      │       ├─ DomainProject (领域项目)
      │       │   └─ dp-mx-2026-adas "智能驾驶领域项目"
      │       │       │
      │       │       └─ PIPlanning (PI规划)
      │       │           └─ pi-adas-2026-q1 "2026-Q1 PI规划"
      │       │               │
      │       │               ├─ Sprint (冲刺)
      │       │               │   └─ spt-2026-q1-2 "Sprint 2"
      │       │               │       │
      │       │               │       └─ Task (任务)
      │       │               │           └─ task-001-lanenet-impl "实现LaneNet算法"
      │       │               │               │
      │       │               │               └─ Commit (代码提交)
      │       │               │                   └─ commit-abc123 "feat: 实现LaneNet车道线检测算法"
      │       │               │                       │
      │       │               │                       └─ Build (构建)
      │       │               │                           └─ build-001 "构建成功"
      │       │               │                               │
      │       │               │                               └─ Artifact (制品)
      │       │               │                                   └─ artifact-001 "adas-perception-v1.2.3"
      │       │               │                                       │
      │       │               │                                       └─ Deployment (部署)
      │       │               │                                           └─ deploy-001 "测试环境部署"
      │       │               │
      │       │               └─ targets_node → LifecycleNode
      │       │                   └─ node-mx-et "ET节点"
      │       │                       │
      │       │                       └─ Baseline
      │       │                           └─ baseline-mx-et-001 "ET基线"
      │       │
      │       ├─ PRDDocument (PRD文档)
      │       │   └─ prd-lane-keeping-001 "高速车道保持功能PRD"
      │       │
      │       ├─ SSTS (场景需求子条目)
      │       │   └─ ssts-001-straight-lane "直道车道保持场景"
      │       │       │
      │       │       └─ ModuleRequirement (模块需求)
      │       │           └─ mr-001-lane-detection "车道线识别模块需求"
      │       │               │
      │       │               └─ ModuleAsset (模块资产)
      │       │                   └─ module-asset-perception-001 "车道线识别模块"
      │       │
      │       └─ FeatureAsset (特性资产)
      │           └─ feature-asset-lka-001 "车道保持辅助特性"
      │
      └─ VehicleProject (车型项目)
          └─ vp-mx-2026 "MX-2026车型项目"
```

### 3.2 追溯链表格

| 层级 | 实体类型 | 实体ID | 实体名称 | 关系类型 |
|------|---------|--------|---------|---------|
| **L1** | Epic | epic-highway-driving | 高速公路智能驾驶 | splits_to_fr → |
| **L2** | FeatureRequirement | fr-001-lane-keeping | 高速车道保持功能 | splits_to_ssts → |
| **L3** | SSTS | ssts-001-straight-lane | 直道车道保持场景 | splits_to_mr → |
| **L4** | ModuleRequirement | mr-001-lane-detection | 车道线识别模块需求 | converts_to_task → |
| **L5** | Task | task-001-lanenet-impl | 实现LaneNet算法 | implements ← |
| **L6** | Commit | commit-abc123 | feat: 实现LaneNet | triggers_build → |
| **L7** | Build | build-001 | 构建成功 | produces_artifact → |
| **L8** | Artifact | artifact-001 | adas-perception-v1.2.3 | deploys → |
| **L9** | Deployment | deploy-001 | 测试环境部署 | - |

**横向关联**:
- FR → DomainProject → PIPlanning → Sprint (管理维度)
- FR → Baseline → LifecycleNode → VehicleProject (交付维度)
- FR → FeatureAsset, MR → ModuleAsset (资产维度)

---

## 四、数据统计

### 4.1 实体数量统计

| 领域 | 实体类型 | 数量 |
|------|---------|------|
| **车型项目域** | VehicleProject | 1 |
| | VehicleModel | 1 |
| | LifecycleNode | 3 |
| | Baseline | 3 |
| **领域项目域** | DomainProject | 3 |
| | PIPlanning | 3 |
| | Sprint | 3 |
| **需求管理域** | Epic | 3 |
| | FeatureRequirement | 6 |
| | PRDDocument | 2 |
| | SSTS | 4 |
| | ModuleRequirement | 4 |
| **迭代执行域** | Task | 4 |
| **DevOps交付域** | Repository | 2 |
| | Commit | 2 |
| | Build | 2 |
| | Artifact | 2 |
| | Deployment | 1 |
| **产品资产域** | ProductLine | 1 |
| | Product | 1 |
| | FeatureAsset | 1 |
| | ModuleAsset | 1 |
| **总计** | **22种实体类型** | **69个节点** |

### 4.2 关系数量统计

| 关系类型 | 数量 | 说明 |
|---------|------|------|
| has_domain_project | 3 | 车型项目包含领域项目 |
| has_lifecycle_node | 3 | 车型项目包含生命周期节点 |
| has_baseline | 3 | 节点包含基线 |
| has_pi_planning | 3 | 领域项目包含PI规划 |
| has_sprint | 3 | PI包含Sprint |
| targets_node | 1 | PI交付到节点 |
| splits_to_fr | 6 | Epic拆分为FR |
| belongs_to_domain | 4 | FR归属领域项目 |
| has_prd | 2 | FR有PRD文档 |
| splits_to_ssts | 4 | FR拆分为SSTS |
| splits_to_mr | 4 | SSTS拆分为MR |
| converts_to_task | 4 | MR转换为Task |
| in_sprint | 4 | Task在Sprint中 |
| in_baseline | 2 | FR在基线中 |
| implements | 2 | Commit实现Task |
| in_repository | 2 | Commit在仓库中 |
| triggers_build | 2 | Commit触发构建 |
| produces_artifact | 2 | Build产出制品 |
| deploys | 1 | 制品部署 |
| binds_to_feature_asset | 1 | FR绑定特性资产 |
| binds_to_module_asset | 1 | MR绑定模块资产 |
| has_product | 1 | 产品线包含产品 |
| has_feature | 1 | 产品包含特性 |
| has_module | 1 | 特性包含模块 |
| **总计** | **74条边** | **20种关系类型** |

---

## 五、使用方法

### 5.1 在前端界面加载数据

1. 启动后端服务：
```bash
cd backend
npm start
```

2. 启动前端服务：
```bash
cd frontend
npm start
```

3. 在前端界面导入数据：
   - 点击顶部"导入数据"按钮
   - 选择"JSON文件"选项
   - 上传 `data/core-domain-data.json`
   - 系统会自动加载schema和数据

### 5.2 通过API导入数据

```bash
# 加载schema
curl -X POST http://localhost:3001/api/v1/graph/schema \
  -H "Content-Type: application/json" \
  -d @data/core-domain-schema.json

# 加载数据
curl -X POST http://localhost:3001/api/v1/import/json \
  -H "Content-Type: application/json" \
  -d @data/core-domain-data.json
```

### 5.3 查询示例

**1. 追溯Epic到Deployment**:
```
GET /api/v1/trace/{entityId}?type=full_trace&depth=10

示例: /api/v1/trace/epic-highway-driving?type=full_trace&depth=10
```

**2. 查询FR的所有下游任务**:
```
GET /api/v1/trace/{entityId}?type=downstream_tasks&depth=5

示例: /api/v1/trace/fr-001-lane-keeping?type=downstream_tasks&depth=5
```

**3. 影响分析（某个MR变更会影响哪些上游）**:
```
GET /api/v1/trace/{entityId}?type=impact_analysis&depth=5

示例: /api/v1/trace/mr-001-lane-detection?type=impact_analysis&depth=5
```

---

## 六、数据特点

### 6.1 核心优势

✅ **完整性** - 覆盖7大领域，22种实体类型，69个真实节点  
✅ **追溯性** - 完整的10层追溯链，从Epic到Deployment  
✅ **真实性** - 基于汽车研发真实场景设计  
✅ **灵活性** - 支持PRD可选、Epic跨领域拆分  
✅ **可扩展** - 易于扩展新的实体类型和关系  

### 6.2 关键设计决策

| 决策 | 理由 | 价值 |
|------|------|------|
| **引入DomainProject层** | 支持多领域并行开发 | 符合真实组织架构 |
| **Epic跨领域拆分** | 一个需求可能涉及多个领域 | 灵活性、解耦 |
| **PRD可选** | 复杂特性用PRD，简单特性简化描述 | 敏捷、实用 |
| **SSTS场景化** | 基于场景拆解需求 | 清晰、可测试 |
| **完整追溯链** | 从需求到代码全链路 | 可追溯、透明 |
| **资产绑定** | FR和MR绑定到产品资产 | 资产复用 |

---

## 七、后续扩展

### 7.1 可扩展的数据点

- **更多Epic**: 可添加更多领域的Epic（如：底盘、车身、动力等）
- **更多DomainProject**: 可添加底盘架构、车身控制、动力系统等领域项目
- **更多Sprint**: 可添加更多季度的PI和Sprint
- **测试数据**: 可添加TestCase、TestExecution、Defect等测试相关实体
- **团队数据**: 可添加Team、TeamMember、TeamBacklog等团队管理实体
- **依赖关系**: 可添加FR/SSTS/Task之间的依赖关系

### 7.2 性能优化建议

- 当节点数超过200个时，建议使用分页或分级加载
- 当追溯深度超过8层时，建议使用异步加载
- 建议添加缓存机制来优化查询性能

---

## 八、参考文档

- [核心领域建模文档](../docs/CORE_DOMAIN_MODEL.md)
- [API文档](../docs/API.md)
- [架构设计文档](../docs/ARCHITECTURE.md)

---

**创建日期**: 2026-01-16  
**维护者**: 自动化研发平台团队  
**状态**: ✅ 生产可用
