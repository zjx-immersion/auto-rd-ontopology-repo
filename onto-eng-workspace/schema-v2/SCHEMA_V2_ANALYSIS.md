# Schema V2.0 扩展需求分析

**日期**: 2026-01-17  
**目标**: 支持3个实例化图谱（智能驾驶、智能座舱、电子电器）  
**源文档**: 18-实例化数据-智能驾驶领域.md, 19-实例化数据-智能座舱领域.md, 20-实例化数据-电子电器领域.md  
**领域模型**: 17-全局完整领域建模图.md

---

## 一、实体类型对比

### 1.1 当前Schema V1.0 实体类型（23个）

| 序号 | 实体类型 | 中文名 | 用途 |
|------|---------|--------|------|
| 1 | VehicleProject | 车型项目 | ✅保留 |
| 2 | VehicleModel | 车型定义 | ⚠️合并到Vehicle |
| 3 | LifecycleNode | 生命周期节点 | ⚠️重命名为ProjectMilestone |
| 4 | Baseline | 基线 | ✅保留 |
| 5 | DomainProject | 领域项目 | ✅保留 |
| 6 | PIPlanning | PI规划 | ⚠️重命名为PI |
| 7 | Sprint | 冲刺 | ✅保留 |
| 8 | Epic | Epic需求 | ✅保留 |
| 9 | FeatureRequirement | 特性需求 | ✅保留 |
| 10 | PRDDocument | PRD文档 | ✅保留 |
| 11 | SSTS | 场景需求子条目 | ✅保留 |
| 12 | ModuleRequirement | 模块需求 | ✅保留 |
| 13 | Module | 模块定义 | ✅保留 |
| 14 | Task | 开发任务 | ⚠️重命名为WorkItem |
| 15 | Repository | 代码仓库 | ✅保留 |
| 16 | Commit | 代码提交 | ⚠️重命名为CodeCommit |
| 17 | Build | 构建 | ✅保留 |
| 18 | Artifact | 制品 | ✅保留 |
| 19 | Deployment | 部署 | ✅保留 |
| 20 | ProductLine | 产品线 | ✅保留 |
| 21 | Product | 产品 | ✅保留 |
| 22 | FeatureAsset | 特性资产 | ⚠️重命名为Feature |
| 23 | ModuleAsset | 模块资产 | ⚠️重命名为Asset |

### 1.2 源文档需要的实体类型（47个）

#### 🎯 项目管理域（4个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| Vehicle | 车型 | ❌缺失 | 🆕新增 |
| DomainProject | 领域项目 | ✅存在 | ✅保留 |
| ProjectMilestone | 项目里程碑 | ❌缺失（有LifecycleNode） | 🔄重命名 |
| Baseline | 基线 | ✅存在 | ✅保留 |

#### 🎯 产品管理域（8个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| ProductLine | 产品线 | ✅存在 | ✅保留 |
| Product | 产品 | ✅存在 | ✅保留 |
| ProductVersion | 产品版本 | ❌缺失 | 🆕新增 |
| Feature | 特性（业务架构） | ❌缺失（有FeatureAsset） | 🔄调整 |
| Module | 模块（业务架构） | ✅存在 | ✅保留 |
| FeaturePackage | 特性包 | ❌缺失 | 🆕新增 |
| FeaturePackageVersion | 特性包版本 | ❌缺失 | 🆕新增 |

#### 🎯 需求管理域（6个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| Epic | Epic需求 | ✅存在 | ✅保留 |
| FeatureRequirement | 特性需求 | ✅存在 | ✅保留 |
| ModuleRequirement | 模块需求 | ✅存在 | ✅保留 |
| SSTS | 系统需求 | ✅存在 | ✅保留 |
| FeatureRequirementVersion | 特性需求版本 | ❌缺失 | 🆕新增 |
| ModuleRequirementVersion | 模块需求版本 | ❌缺失 | 🆕新增 |

#### 🎯 资产管理域（4个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| Asset | 资产 | ❌缺失 | 🆕新增 |
| AssetVersion | 资产版本 | ❌缺失 | 🆕新增 |
| AssetUsage | 资产使用 | ❌缺失 | 🆕新增 |
| AssetDependency | 资产依赖 | ❌缺失 | 🆕新增 |

#### ⚙️ 规划管理域（4个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| PI | 规划增量 | ❌缺失（有PIPlanning） | 🔄重命名 |
| Sprint | 迭代 | ✅存在 | ✅保留 |
| SprintBacklog | Sprint待办 | ❌缺失 | 🆕新增 |
| TeamCapacity | 团队容量 | ❌缺失 | 🆕新增 |

#### ⚙️ 执行管理域（6个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| WorkItem | 工作项 | ❌缺失（有Task） | 🔄重命名 |
| WorkLog | 工作日志 | ❌缺失 | 🆕新增 |
| CodeCommit | 代码提交 | ❌缺失（有Commit） | 🔄重命名 |
| Build | 构建 | ✅存在 | ✅保留 |
| WorkItemDependency | 工作项依赖 | ❌缺失 | 🆕新增 |
| WorkItemAttachment | 工作项附件 | ❌缺失 | 🆕新增 |

#### ⚙️ 质量管理域（4个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| TestPlan | 测试计划 | ❌缺失 | 🆕新增 |
| TestCase | 测试用例 | ❌缺失 | 🆕新增 |
| TestExecution | 测试执行 | ❌缺失 | 🆕新增 |
| Defect | 缺陷 | ❌缺失 | 🆕新增 |

#### 🔧 交付管理域（3个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| Artifact | 制品 | ✅存在 | ✅保留 |
| Release | 发布 | ❌缺失 | 🆕新增 |
| Deployment | 部署 | ✅存在 | ✅保留 |

#### 🔧 度量管理域（3个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| MetricSet | 度量集 | ❌缺失 | 🆕新增 |
| Metric | 度量指标 | ❌缺失 | 🆕新增 |
| MetricValue | 度量数据 | ❌缺失 | 🆕新增 |

#### 🔧 用户管理域（5个）

| 实体类型 | 中文名 | 当前状态 | 操作 |
|---------|--------|---------|------|
| User | 用户 | ❌缺失 | 🆕新增 |
| Team | 团队 | ❌缺失 | 🆕新增 |
| TeamMember | 团队成员 | ❌缺失 | 🆕新增 |
| Role | 角色 | ❌缺失 | 🆕新增 |
| UserRole | 用户角色 | ❌缺失 | 🆕新增 |

---

## 二、统计与决策

### 2.1 实体类型统计

| 类别 | 数量 | 说明 |
|------|------|------|
| ✅ 保留（完全兼容） | 14个 | DomainProject, Baseline, Sprint, Epic, FeatureRequirement, SSTS, ModuleRequirement, Module, Repository, Build, Artifact, Deployment, ProductLine, Product |
| 🔄 重命名（概念相同） | 6个 | Vehicle, ProjectMilestone, PI, WorkItem, CodeCommit, Feature |
| 🆕 新增（完全缺失） | 27个 | ProductVersion, FeaturePackage, FeaturePackageVersion, FeatureRequirementVersion, ModuleRequirementVersion, Asset, AssetVersion, AssetUsage, AssetDependency, SprintBacklog, TeamCapacity, WorkLog, WorkItemDependency, WorkItemAttachment, TestPlan, TestCase, TestExecution, Defect, Release, MetricSet, Metric, MetricValue, User, Team, TeamMember, Role, UserRole |
| **总计** | **47个** | **完整的10个领域** |

### 2.2 决策选项

#### 选项A：扩展Schema V1.0 → V2.0（推荐）✅

**优点**：
- 完整支持47个实体类型
- 支持完整的10个领域
- 与领域建模图完全一致
- 支持端到端的数据流
- 更好的语义表达

**缺点**：
- Schema文件较大（~3000行）
- 需要迁移现有数据

**实施方案**：
1. 创建 `core-domain-schema-v2.json`（47个实体类型）
2. 保留 `core-domain-schema.json`（23个实体类型，标记为V1.0）
3. 创建数据迁移脚本：V1.0 → V2.0
4. 新的3个图谱使用V2.0

#### 选项B：复用现有Schema V1.0（不推荐）❌

**优点**：
- 不需要修改Schema
- 现有数据无需迁移

**缺点**：
- 实体类型命名不一致（Vehicle vs VehicleProject）
- 缺失27个核心实体类型
- 无法支持完整的数据流
- 无法支持资产管理、质量管理、度量管理、用户管理等领域

---

## 三、Schema V2.0 设计原则

### 3.1 命名规范

| 规则 | 说明 | 示例 |
|------|------|------|
| **实体命名** | 使用英文单词，驼峰命名 | `ProductLine`, `FeatureRequirement` |
| **中文标签** | 使用简洁的中文名称 | "产品线", "特性需求" |
| **描述** | 详细说明实体用途和职责 | "产品线资产，管理多个产品" |
| **Code** | 使用简短的代码标识 | `ProductLine`, `FeatureReq` |

### 3.2 属性设计

| 属性类型 | 命名规范 | 示例 |
|---------|---------|------|
| **主键** | id | `"id": "PROD-001"` |
| **外键** | {实体}Id | `"productLineId": "PL-001"` |
| **枚举** | 大写+下划线 | `"status": "IN_PROGRESS"` |
| **日期** | Date/DateTime | `"createdAt": "2026-01-17T10:00:00Z"` |

### 3.3 关系类型

保留并扩展V1.0的关系类型，新增：

- `has_milestone` - 项目包含里程碑
- `has_product_version` - 产品有版本
- `has_feature` - 产品包含特性
- `has_module` - 特性包含模块
- `has_sprint_backlog` - Sprint有待办
- `has_team_capacity` - Sprint有容量
- `has_work_item` - Sprint包含工作项
- `logs_work` - 用户记录工时
- `has_test_plan` - 模块需求有测试计划
- `has_test_case` - 测试计划包含用例
- `executes_test` - 构建执行测试
- `has_defect` - 测试执行发现缺陷
- `produces_release` - 制品发布
- `has_metric` - 度量集包含指标
- `measures` - 指标有度量数据
- `belongs_to_team` - 用户属于团队
- `has_role` - 用户有角色

### 3.4 颜色分配

按领域分配颜色系：

| 领域 | 颜色系 | 示例 |
|------|--------|------|
| 项目管理域 | 蓝色系 | #1890ff, #096dd9, #13c2c2 |
| 产品管理域 | 紫色系 | #9254de, #b37feb, #d3adf7 |
| 需求管理域 | 红/橙色系 | #f5222d, #fa8c16, #ff7a45 |
| 资产管理域 | 青色系 | #13c2c2, #36cfc9, #5cdbd3 |
| 规划管理域 | 紫色系 | #722ed1, #eb2f96 |
| 执行管理域 | 绿色系 | #52c41a, #a0d911, #d3f261 |
| 质量管理域 | 黄色系 | #faad14, #fadb14, #ffe58f |
| 交付管理域 | 蓝色系 | #40a9ff, #69c0ff, #91d5ff |
| 度量管理域 | 灰色系 | #8c8c8c, #bfbfbf, #d9d9d9 |
| 用户管理域 | 绿色系 | #73d13d, #95de64, #b7eb8f |

---

## 四、实施计划

### 4.1 Phase 1: 创建Schema V2.0（2小时）

1. ✅ 分析源文档，提取实体类型
2. ⬜ 设计47个实体类型的完整定义
3. ⬜ 设计关系类型（扩展到50+个）
4. ⬜ 创建 `core-domain-schema-v2.json`
5. ⬜ 验证Schema完整性

### 4.2 Phase 2: 构造实例化数据（6小时）

1. ⬜ 提取智能驾驶领域数据（18-实例化数据-智能驾驶领域.md）
2. ⬜ 提取智能座舱领域数据（19-实例化数据-智能座舱领域.md）
3. ⬜ 提取电子电器领域数据（20-实例化数据-电子电器领域.md）
4. ⬜ 构造3个完整的JSON数据文件
5. ⬜ 验证数据与Schema的一致性

### 4.3 Phase 3: 数据迁移（2小时）

1. ⬜ 创建迁移脚本（V1.0 → V2.0）
2. ⬜ 迁移现有图谱数据
3. ⬜ 验证迁移结果

### 4.4 Phase 4: 系统集成（2小时）

1. ⬜ 前端适配Schema V2.0
2. ⬜ 后端支持多Schema版本
3. ⬜ 导入3个新图谱
4. ⬜ 完整测试

---

## 五、风险与建议

### 5.1 风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Schema过大 | 性能下降 | 按需加载、分页查询 |
| 数据迁移复杂 | 数据丢失 | 充分测试、备份数据 |
| 前端适配工作量大 | 延期 | 优先支持核心功能 |

### 5.2 建议

1. ✅ **采用Schema V2.0方案**：完整支持10个领域，47个实体类型
2. ✅ **保留V1.0兼容性**：通过版本号区分，支持多Schema共存
3. ✅ **渐进式迁移**：先迁移核心域（产品、需求、项目），再迁移其他域
4. ✅ **数据验证**：创建完整的Schema验证工具

---

## 六、下一步行动

### 立即执行

1. **创建Schema V2.0**
   - 文件：`data/core-domain-schema-v2.json`
   - 内容：47个实体类型 + 50+个关系类型
   
2. **构造3个实例化图谱数据**
   - 文件1：`data/adas-domain-instance.json`（智能驾驶）
   - 文件2：`data/cabin-domain-instance.json`（智能座舱）
   - 文件3：`data/eea-domain-instance.json`（电子电器）

3. **创建数据导入脚本**
   - 脚本：`backend/scripts/import-v2-graphs.js`
   - 功能：自动导入3个图谱到系统

---

**总结**：

当前Schema V1.0只有23个实体类型，远不足以支持完整的10个领域和端到端数据流。**强烈建议扩展为Schema V2.0**，包含47个实体类型，完整支持：

✅ 10个领域（项目、产品、需求、资产、规划、执行、质量、交付、度量、用户）  
✅ 端到端价值流（从车型立项到度量分析）  
✅ 完整的版本管理（产品版本、需求版本、资产版本）  
✅ 完整的团队协作（用户、团队、角色）  

这将为系统提供完整的领域模型支持，为后续功能扩展奠定坚实基础。
