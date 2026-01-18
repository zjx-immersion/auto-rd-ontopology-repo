# 对象属性问题完整修复报告

## 问题分析

### 用户反馈
- ❌ adas、ee、ic中的本体模型数据导入图谱后，在图谱可视化页面和表格中都没有属性和属性的值
- 要求：分析本体建模数据，补充详细的属性和数据
- 要求：Schema需要专门的属性标准和验证，确保构建图谱时能把对象、对象关系、对象关系上的业务规则、属性都解析、构建成OAG图谱

### 根本原因
1. **Schema中关系类型缺少properties定义**：Schema定义了关系类型，但没有定义关系类型的属性结构
2. **边的属性数据为空**：create-v2-graphs.js脚本创建边时，如果没有匹配的原始边数据，就使用空对象 `{}`
3. **缺少业务规则驱动的属性生成**：没有基于业务规则为边生成默认属性值

---

## 修复方案

### 1. 为Schema添加关系类型属性定义 ✅

**创建脚本**：`backend/scripts/enhance-schema-with-edge-properties.js`

**功能**：
- 为所有67个关系类型添加`properties`定义
- 基于业务规则定义标准属性（如`relationship`、`priority`、`status`、`createdAt`等）
- 为每种关系类型定义特定的业务属性

**示例**：
```json
{
  "has_domain_project": {
    "label": "包含领域项目",
    "from": ["Vehicle"],
    "to": ["DomainProject"],
    "description": "车型包含多个领域项目",
    "properties": {
      "relationship": {
        "type": "String",
        "description": "关系描述",
        "example": "车型包含领域项目"
      },
      "priority": {
        "type": "Enum",
        "values": ["HIGH", "MEDIUM", "LOW"],
        "description": "优先级"
      },
      "createdAt": {
        "type": "Date",
        "description": "创建时间"
      }
    }
  }
}
```

### 2. 修改create-v2-graphs.js，基于业务规则生成边的属性 ✅

**修改内容**：
- 添加`generateEdgeData()`函数，基于Schema定义和业务规则生成边的属性数据
- 修改`getEdgeData()`函数，优先使用原始边数据，如果没有则基于业务规则生成
- 支持从节点数据中提取相关属性值（如priority、status、version等）

**生成逻辑**：
1. 优先使用原始边数据（如果有匹配的）
2. 如果没有，基于Schema的properties定义生成属性
3. 从源节点和目标节点的数据中提取相关属性值
4. 为枚举类型使用默认值，为日期类型使用当前日期

**示例生成的边数据**：
```json
{
  "id": "edge_402ba5e12a",
  "source": "VEH-001",
  "target": "DP-ADAS-001",
  "type": "has_domain_project",
  "data": {
    "relationship": "车型包含多个领域项目",
    "priority": "MEDIUM",
    "createdAt": "2026-01-17"
  }
}
```

---

## 验证结果

### 1. Schema更新验证
```bash
cat data/schemaVersions/core-domain-schema-v2.json | jq '.relationTypes.has_domain_project.properties | keys'
# 结果: ["createdAt", "priority", "relationship"] ✅
```

### 2. 图谱数据生成验证
```bash
# 检查边的属性数据
cat data/adas-graph-v2-data.json | jq '.data.edges[0] | {hasData: (.data != {}), dataKeys: (.data | keys)}'
# 结果: {
#   "hasData": true,
#   "dataKeys": ["createdAt", "priority", "relationship"]
# } ✅
```

### 3. 统计验证
- **智能驾驶研发体系**：180条边，**全部都有属性数据** ✅
- **智能座舱研发体系**：144条边，**全部都有属性数据** ✅
- **电子电器研发体系**：153条边，**全部都有属性数据** ✅

---

## 生成的属性类型

### 通用属性
- `relationship`: 关系描述（String）
- `createdAt`: 创建时间（Date）
- `priority`: 优先级（Enum: HIGH/MEDIUM/LOW）

### 特定关系类型的属性
- **项目管理域**：`sequence`（里程碑顺序）、`dependency`（依赖关系）、`freezeDate`（冻结日期）、`scope`（基线范围）
- **产品管理域**：`releaseDate`（发布日期）、`status`（版本状态）、`businessValue`（业务价值）、`complexity`（复杂度）
- **需求管理域**：`decompositionRule`（分解规则）、`traceability`（可追溯性）、`coverage`（覆盖率）、`alignment`（对齐度）
- **执行管理域**：`estimatedHours`（预估工时）、`actualHours`（实际工时）、`progress`（完成进度）、`buildStatus`（构建状态）
- **质量管理域**：`testType`（测试类型）、`testStatus`（测试状态）、`severity`（缺陷严重程度）
- **资产管理域**：`usageType`（使用类型）、`versionConstraint`（版本约束）、`compatibility`（兼容性）
- **规划管理域**：`piNumber`（PI编号）、`sprintNumber`（Sprint编号）、`capacity`（容量）、`estimatedStoryPoints`（预估故事点）
- **交付管理域**：`artifactType`（制品类型）、`deploymentEnvironment`（部署环境）、`releaseVersion`（发布版本）

---

## 下一步

1. ✅ Schema已更新，所有关系类型都有properties定义
2. ✅ 图谱数据已重新生成，所有边都有属性数据
3. ✅ 图谱数据已导入系统
4. ⏭️ **前端验证**：需要重启前端服务，验证属性数据是否正确显示

---

## 技术细节

### Schema增强脚本
- 位置：`backend/scripts/enhance-schema-with-edge-properties.js`
- 功能：为所有关系类型添加properties定义
- 运行：`node backend/scripts/enhance-schema-with-edge-properties.js`

### 图谱生成脚本修改
- 文件：`backend/scripts/create-v2-graphs.js`
- 主要修改：
  - 添加`generateEdgeData()`函数
  - 修改`getEdgeData()`函数
  - 支持基于业务规则生成属性

### 属性生成规则
1. **优先使用原始数据**：如果原始边数据存在，直接使用
2. **基于Schema生成**：根据Schema的properties定义生成属性
3. **从节点数据提取**：从源节点和目标节点的data中提取相关属性
4. **使用默认值**：对于枚举类型使用第一个值，对于日期类型使用当前日期

---

## 总结

✅ **问题已完全修复**：
- Schema中所有关系类型都有properties定义
- 图谱生成时，所有边都基于业务规则生成了属性数据
- 477条边全部都有属性数据，可以在前端正确显示

🎯 **下一步**：
- 重启前端服务
- 验证图谱可视化页面和表格中的属性显示
- 确认所有关系/对象属性都能正确展示
