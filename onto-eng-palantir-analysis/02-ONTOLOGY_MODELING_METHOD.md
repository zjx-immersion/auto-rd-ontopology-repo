# 本体建模核心方法

**基于Palantir Foundry实践设计**  
**版本**: v1.0  
**日期**: 2026-01-18

---

## 一、方法概述

本文档定义了一个系统化的本体建模方法，用于构建OAG（Ontology-Aware Graph）知识图谱。该方法基于Palantir Foundry的本体论实践，结合领域驱动设计（DDD）和知识图谱工程最佳实践。

### 1.1 核心目标

1. **语义一致性**：确保本体模型准确反映业务领域
2. **可扩展性**：支持未来扩展和演进
3. **可重用性**：支持跨领域和跨项目的重用
4. **可维护性**：清晰的文档和版本控制
5. **工程化**：支持自动化生成和验证

---

## 二、输入要求

### 2.1 领域需求文档（Domain Requirements）

**必需内容**：
- **业务背景**：领域的基本信息和业务目标
- **核心实体**：领域中的核心实体列表（名词）
- **核心关系**：实体之间的重要关系（动词）
- **核心操作**：领域中的关键操作和流程（动作）
- **业务规则**：重要的业务规则和约束
- **用例场景**：典型的使用场景和决策点

**格式要求**：
- Markdown格式
- 结构化描述（列表、表格）
- 包含示例和场景

**示例结构**：
```markdown
# 领域：智能驾驶研发

## 业务背景
...

## 核心实体
1. Vehicle（车型）
2. DomainProject（领域项目）
3. Feature（特性）
...

## 核心关系
1. Vehicle has_domain_project DomainProject
2. DomainProject has_feature Feature
...

## 核心操作
1. CreateVehicle
2. ApproveProject
...

## 业务规则
- 每个Vehicle必须至少有一个DomainProject
- Feature的优先级必须是HIGH/MEDIUM/LOW之一
...
```

### 2.2 数据源清单（Data Source Inventory）

**必需内容**：
- **数据源列表**：所有相关数据源
- **Schema定义**：每个数据源的schema
- **权威性标识**：哪个数据源是哪个属性的权威来源
- **数据质量**：数据质量评估
- **更新频率**：数据更新频率

**格式要求**：
- JSON或Markdown格式
- 包含数据源元数据

**示例结构**：
```json
{
  "dataSources": [
    {
      "name": "vehicle-management-system",
      "type": "database",
      "schema": {
        "vehicles": {
          "vehicle_id": "string",
          "name": "string",
          "status": "enum"
        }
      },
      "authoritativeFor": ["Vehicle.vehicleId", "Vehicle.name"],
      "updateFrequency": "daily",
      "dataQuality": "high"
    }
  ]
}
```

### 2.3 现有Schema（如果存在）

**必需内容**：
- **现有Schema定义**：JSON格式的Schema定义
- **版本信息**：Schema版本
- **兼容性要求**：是否需要向后兼容

**格式要求**：
- JSON格式（符合core-domain-schema-v2.json结构）

---

## 三、输出要求

### 3.1 本体Schema定义（Ontology Schema）

**必需内容**：

#### 3.1.1 对象类型（Entity Types）

```json
{
  "entityTypes": {
    "Vehicle": {
      "label": "车型",
      "description": "车型定义，是最高层级的项目管理单元",
      "properties": {
        "vehicleId": {
          "type": "String",
          "required": true,
          "description": "车型唯一标识",
          "example": "VEH-001"
        },
        "name": {
          "type": "String",
          "required": true,
          "description": "车型名称",
          "example": "岚图梦想家"
        },
        "status": {
          "type": "Enum",
          "values": ["PLANNING", "DEVELOPING", "LAUNCHED"],
          "description": "车型状态"
        },
        "createdAt": {
          "type": "Date",
          "description": "创建时间"
        }
      },
      "links": [
        {
          "type": "has_domain_project",
          "target": "DomainProject",
          "cardinality": "one-to-many"
        }
      ]
    }
  }
}
```

#### 3.1.2 关系类型（Relation Types）

```json
{
  "relationTypes": {
    "has_domain_project": {
      "label": "包含领域项目",
      "description": "车型包含多个领域项目",
      "from": ["Vehicle"],
      "to": ["DomainProject"],
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
}
```

#### 3.1.3 接口定义（Interfaces，可选）

```json
{
  "interfaces": {
    "PricingEntity": {
      "label": "定价实体",
      "description": "具有价格信息的实体",
      "properties": {
        "unitPrice": {
          "type": "Float",
          "description": "单价"
        },
        "currency": {
          "type": "String",
          "description": "货币"
        }
      },
      "implementedBy": ["Material", "PurchaseOrderItem"]
    }
  }
}
```

#### 3.1.4 操作类型（Action Types，可选）

```json
{
  "actionTypes": {
    "CreateVehicle": {
      "label": "创建车型",
      "description": "创建新的车型对象",
      "parameters": {
        "name": {
          "type": "String",
          "required": true
        },
        "model": {
          "type": "String",
          "required": true
        }
      },
      "permissions": ["vehicle_manager"],
      "effects": {
        "creates": ["Vehicle"],
        "triggers": ["sendNotification"]
      }
    }
  }
}
```

#### 3.1.5 函数定义（Functions，可选）

```json
{
  "functions": {
    "calculateProjectValue": {
      "label": "计算项目价值",
      "description": "基于项目属性和关系计算项目总价值",
      "input": "DomainProject",
      "output": "Float",
      "logic": "sum(feature.businessValue for feature in project.features)",
      "type": "business_rule"
    }
  }
}
```

### 3.2 Schema文档结构

**完整Schema文件应包含**：

```json
{
  "version": "2.0.0",
  "name": "core-domain-schema-v2",
  "description": "核心领域模型Schema定义",
  "domain": "智能驾驶研发",
  "created": "2026-01-18",
  "entityTypes": { ... },
  "relationTypes": { ... },
  "interfaces": { ... },
  "actionTypes": { ... },
  "functions": { ... },
  "metadata": {
    "author": "...",
    "lastUpdated": "...",
    "versionHistory": [...]
  }
}
```

### 3.3 输出文件清单

1. **Schema定义文件**：`{domain}-schema-v{version}.json`
2. **Schema文档**：`{domain}-schema-doc.md`
3. **数据字典**：`{domain}-data-dictionary.md`
4. **验证报告**：`{domain}-schema-validation.md`

---

## 四、建模流程

### 4.1 阶段1：需求分析（1-2天）

**输入**：
- 领域需求文档
- 利益相关者访谈记录
- 现有系统文档

**活动**：
1. 识别核心实体（名词）
2. 识别核心关系（动词）
3. 识别核心操作（动作）
4. 识别业务规则
5. 识别用例场景

**输出**：
- 实体清单
- 关系清单
- 操作清单
- 业务规则清单

### 4.2 阶段2：数据源分析（1-2天）

**输入**：
- 数据源清单
- 数据样本
- 数据质量报告

**活动**：
1. 分析数据源Schema
2. 识别权威数据源
3. 评估数据质量
4. 识别数据映射关系

**输出**：
- 数据源映射表
- 权威性矩阵
- 数据质量评估报告

### 4.3 阶段3：Schema设计（2-3天）

**输入**：
- 实体清单
- 关系清单
- 数据源映射表

**活动**：
1. 定义对象类型和属性
2. 定义关系类型和属性
3. 定义接口（如需要）
4. 定义操作类型（如需要）
5. 定义函数（如需要）

**输出**：
- Schema定义（JSON）
- Schema文档（Markdown）

### 4.4 阶段4：验证和优化（1-2天）

**输入**：
- Schema定义
- 用例场景
- 数据样本

**活动**：
1. Schema完整性检查
2. 用例场景验证
3. 数据映射验证
4. 性能考虑
5. 可扩展性评估

**输出**：
- 验证报告
- 优化建议
- 最终Schema

### 4.5 阶段5：文档和交付（1天）

**输入**：
- 最终Schema
- 验证报告

**活动**：
1. 编写Schema文档
2. 编写数据字典
3. 创建示例数据
4. 准备交付包

**输出**：
- 完整文档包
- 示例数据
- 交付报告

---

## 五、质量标准

### 5.1 Schema质量标准

1. **完整性**：
   - ✅ 所有核心实体都有定义
   - ✅ 所有核心关系都有定义
   - ✅ 所有属性都有类型和描述

2. **一致性**：
   - ✅ 命名约定一致
   - ✅ 类型定义一致
   - ✅ 描述格式一致

3. **准确性**：
   - ✅ 准确反映业务领域
   - ✅ 属性类型正确
   - ✅ 关系定义正确

4. **可维护性**：
   - ✅ 清晰的文档
   - ✅ 版本控制
   - ✅ 变更历史

### 5.2 文档质量标准

1. **完整性**：覆盖所有Schema元素
2. **清晰性**：易于理解
3. **示例丰富**：包含足够的示例
4. **可搜索性**：良好的索引和交叉引用

---

## 六、工具支持

### 6.1 推荐工具

1. **Schema编辑器**：VS Code + JSON Schema插件
2. **文档生成**：Markdown + 模板
3. **验证工具**：JSON Schema验证器
4. **可视化工具**：Mermaid图表

### 6.2 自动化脚本

- Schema验证脚本
- 文档生成脚本
- 示例数据生成脚本

---

## 七、交付物清单

### 7.1 必需交付物

1. ✅ Schema定义文件（JSON）
2. ✅ Schema文档（Markdown）
3. ✅ 数据字典（Markdown）
4. ✅ 验证报告（Markdown）

### 7.2 可选交付物

1. 示例数据（JSON）
2. 可视化图表（Mermaid/PNG）
3. 迁移指南（如需要）
4. 最佳实践文档

---

**下一步**：参见 `03-ONTOLOGY_MODELING_PROMPT.md` 了解如何使用AI Prompt进行本体建模。
