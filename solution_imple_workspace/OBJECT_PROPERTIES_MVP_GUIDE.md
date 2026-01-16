# 对象属性功能 MVP 版本使用指南

## 概述

对象属性（Object Properties）是本体论中定义实体间关系的重要概念。在知识图谱中，对象属性不仅表示节点之间的连接关系，还可以携带额外的语义信息，描述关系的特性和约束。

MVP版本实现了对象属性的核心功能：
- ✅ 在Schema中定义对象属性
- ✅ 在图谱可视化中显示对象属性
- ✅ 在节点详情面板中查看对象属性
- ✅ 编辑和更新对象属性

## 功能特性

### 1. Schema定义

在 `core-domain-schema.json` 中，关系类型现在支持定义对象属性：

```json
{
  "relationTypes": {
    "has_domain_project": {
      "label": "包含领域项目",
      "from": ["VehicleProject"],
      "to": ["DomainProject"],
      "description": "车型项目包含多个领域项目",
      "properties": {
        "priority": {
          "type": "Enum",
          "values": ["高", "中", "低"],
          "description": "优先级"
        },
        "allocation_date": {
          "type": "Date",
          "description": "分配日期"
        }
      }
    }
  }
}
```

**支持的属性类型：**
- `String` - 字符串
- `Text` - 长文本
- `Integer` - 整数
- `Float` - 浮点数
- `Boolean` - 布尔值
- `Date` / `DateTime` - 日期/时间
- `Enum` - 枚举值

### 2. 图谱可视化

在图谱视图中，边的标签现在会显示关键的对象属性：

**显示规则：**
- 优先显示：priority、status、progress、completion_percentage、complexity
- 最多显示2个属性，避免标签过于拥挤
- 属性值会根据类型自动格式化

**示例：**
```
包含领域项目
优先级: 高
分配日期: 2026-01-01
```

### 3. 节点详情面板

点击节点后，在右侧的详情面板中新增了"对象属性关系"部分：

**功能：**
- 查看节点的所有出边关系（Outgoing）
- 查看节点的所有入边关系（Incoming）
- 显示每个关系的类型、目标/源节点
- 显示关系的对象属性值
- 点击"编辑"按钮可以修改对象属性

### 4. 对象属性编辑

点击关系卡片上的"编辑"按钮，打开对象属性编辑器：

**功能：**
- 根据Schema定义自动生成表单
- 支持所有属性类型的编辑
- 实时验证和保存
- 保存后自动刷新显示

## 快速开始

### 第一步：导入测试数据

我们提供了包含对象属性的测试数据：

```bash
# 文件位置
data/object-properties-test-data.json
```

**导入步骤：**
1. 启动应用
2. 点击顶部的"导入数据"按钮
3. 切换到"JSON"标签
4. 选择 `object-properties-test-data.json` 文件
5. 点击"导入"

### 第二步：查看对象属性

**在图谱中查看：**
1. 导入数据后，图谱会自动加载
2. 观察边的标签，可以看到对象属性信息
3. 例如："包含领域项目\n优先级: 高\n分配日期: 2026-01-01"

**在详情面板中查看：**
1. 点击任意节点（例如：vp-test-001）
2. 在右侧详情面板中找到"对象属性关系"部分
3. 展开"出边关系"或"入边关系"
4. 查看每个关系的详细属性

### 第三步：编辑对象属性

1. 在节点详情面板的"对象属性关系"部分
2. 找到想要编辑的关系
3. 点击关系卡片右上角的"编辑"按钮
4. 在弹出的编辑器中修改属性值
5. 点击"确定"保存

**示例操作：**
- 修改"包含领域项目"关系的优先级从"高"改为"中"
- 更新"拆分为特性需求"关系的拆分占比
- 编辑"转换为任务"关系的复杂度评估

## 核心概念

### 对象属性 vs 数据属性

| 特性 | 对象属性 (Object Properties) | 数据属性 (Data Properties) |
|------|---------------------------|--------------------------|
| 定义位置 | 关系/边上 | 节点上 |
| 描述对象 | 两个实体之间的关系 | 单个实体的属性 |
| 示例 | "优先级：高" (车型项目→领域项目) | "状态：进行中" (领域项目) |
| 语义作用 | 描述关系的性质和约束 | 描述实体的特征 |

### 已实现的对象属性

MVP版本为以下关系类型添加了对象属性：

1. **has_domain_project** (车型项目 → 领域项目)
   - priority: 优先级
   - allocation_date: 分配日期

2. **splits_to_fr** (Epic → 特性需求)
   - split_ratio: 拆分占比(%)
   - priority_inherit: 是否继承优先级
   - split_date: 拆分日期

3. **converts_to_task** (模块需求 → 开发任务)
   - conversion_date: 转换日期
   - estimated_effort: 预估工作量(人天)
   - complexity: 复杂度

4. **implements** (代码提交 → 任务)
   - completion_percentage: 完成百分比
   - lines_changed: 代码行数变更
   - implementation_note: 实现说明

5. **in_baseline** (特性需求 → 基线)
   - baseline_version: 基线版本号
   - freeze_date: 冻结日期
   - change_allowed: 是否允许变更

## API 接口

### 后端API

```javascript
// 获取边的详细信息
GET /api/v1/graph/edges/:id

// 更新边的对象属性
PUT /api/v1/graph/edges/:id
Body: {
  "data": {
    "priority": "高",
    "allocation_date": "2026-01-01"
  }
}

// 获取节点的对象属性关系
GET /api/v1/graph/nodes/:id/object-properties
```

### 前端API

```javascript
import { 
  fetchEdgeById, 
  updateEdge, 
  fetchObjectProperties 
} from '../services/api';

// 获取边
const edge = await fetchEdgeById('e-vp-dp-001');

// 更新对象属性
await updateEdge('e-vp-dp-001', {
  data: {
    priority: '中',
    allocation_date: '2026-02-01'
  }
});

// 获取节点的对象属性关系
const objProps = await fetchObjectProperties('vp-test-001');
// 返回：{ nodeId, outgoing: [...], incoming: [...] }
```

## 数据格式

### 边数据格式

```json
{
  "id": "e-vp-dp-001",
  "source": "vp-test-001",
  "target": "dp-test-adas",
  "type": "has_domain_project",
  "data": {
    "priority": "高",
    "allocation_date": "2026-01-01"
  }
}
```

### 对象属性关系响应格式

```json
{
  "nodeId": "vp-test-001",
  "outgoing": [
    {
      "relationId": "e-vp-dp-001",
      "relationType": "has_domain_project",
      "relationLabel": "包含领域项目",
      "targetNode": {
        "id": "dp-test-adas",
        "type": "DomainProject",
        "data": {...}
      },
      "properties": {
        "priority": "高",
        "allocation_date": "2026-01-01"
      }
    }
  ],
  "incoming": [...]
}
```

## 使用场景

### 1. 需求优先级管理

通过对象属性标记需求的优先级传递：
- Epic拆分为FR时，记录是否继承优先级
- 跟踪优先级变化的历史

### 2. 工作量估算

记录需求转换为任务时的工作量评估：
- 预估工作量（人天）
- 复杂度等级
- 实际完成时间对比

### 3. 基线管理

记录需求进入基线的关键信息：
- 基线版本号
- 冻结日期
- 变更控制规则

### 4. 追溯分析

利用对象属性进行更精细的追溯：
- 分析高优先级需求的流转路径
- 识别高复杂度任务的分布
- 评估基线变更的影响范围

## 最佳实践

### 1. Schema设计

- ✅ 为关键关系定义对象属性
- ✅ 使用枚举类型限制属性值，保证数据一致性
- ✅ 添加描述字段，提高可读性
- ❌ 避免定义过多属性，保持简洁

### 2. 属性命名

- ✅ 使用小写字母和下划线：`allocation_date`
- ✅ 包含类型信息的后缀：`_date`, `_percentage`, `_count`
- ✅ 语义清晰：`priority` 而非 `p`
- ❌ 避免使用缩写和简写

### 3. 数据导入

- ✅ 确保对象属性值符合Schema定义
- ✅ 日期格式使用ISO 8601：`YYYY-MM-DD`
- ✅ 枚举值与Schema定义完全一致
- ❌ 避免空值或undefined，使用null表示未设置

## 故障排查

### 问题1：对象属性不显示

**可能原因：**
- Schema中未定义对象属性
- 边的data字段为空或缺失

**解决方案：**
1. 检查 `core-domain-schema.json` 中关系类型的properties定义
2. 检查边数据中的data字段

### 问题2：编辑器无法保存

**可能原因：**
- 属性值类型不匹配
- 必填字段未填写
- 网络请求失败

**解决方案：**
1. 检查浏览器控制台的错误信息
2. 验证属性值是否符合Schema定义
3. 检查后端服务是否正常运行

### 问题3：图谱中边标签显示不全

**说明：**
这是正常的。为了避免图谱过于拥挤，边标签最多显示2个关键属性。

**查看完整属性：**
点击节点 → 在详情面板中查看"对象属性关系"

## 下一步计划

MVP版本之后的增强功能：

- [ ] 批量编辑对象属性
- [ ] 对象属性的历史版本跟踪
- [ ] 基于对象属性的高级查询和过滤
- [ ] 对象属性的统计和分析
- [ ] 对象属性的导入导出
- [ ] 自定义对象属性的显示规则

## 技术架构

```
┌─────────────────┐
│   前端层        │
├─────────────────┤
│ GraphView       │ ← 显示边标签（含对象属性）
│ NodeDetailPanel │ ← 显示和管理对象属性
│ ObjPropEditor   │ ← 编辑对象属性
└────────┬────────┘
         │
    API Client
         │
┌────────▼────────┐
│   后端层        │
├─────────────────┤
│ graph.js routes │ ← API路由
│ GraphService    │ ← 数据管理
└────────┬────────┘
         │
┌────────▼────────┐
│   数据层        │
├─────────────────┤
│ schema.json     │ ← 对象属性定义
│ *.json (data)   │ ← 图谱数据（含对象属性值）
└─────────────────┘
```

## 参考资料

- [OBJECT_PROPERTIES_DESIGN.md](./OBJECT_PROPERTIES_DESIGN.md) - 完整设计文档
- [OBJECT_PROPERTIES_SUMMARY.md](./OBJECT_PROPERTIES_SUMMARY.md) - 概念总结
- [core-domain-schema.json](./data/core-domain-schema.json) - Schema定义
- [object-properties-test-data.json](./data/object-properties-test-data.json) - 测试数据

## 反馈与支持

如有问题或建议，请联系开发团队。

---

**版本：** MVP 1.0  
**更新日期：** 2026-01-16  
**状态：** ✅ 已完成
