# Prompt输出示例

**版本**: v1.0  
**日期**: 2026-01-18  
**示例领域**: 智能驾驶研发

---

## 一、输入示例

### 1.1 领域需求文档

```markdown
# 领域需求：智能驾驶研发

## 业务背景
岚图汽车智能驾驶部门需要管理智能驾驶研发流程，包括车型、项目、特性、需求等核心实体。

## 核心实体
1. **Vehicle（车型）**：最高层级的项目管理单元
2. **DomainProject（领域项目）**：车型下的领域级研发项目
3. **Feature（特性）**：产品的业务特性
4. **Module（模块）**：特性的模块
5. **FeatureRequirement（特性需求）**：Epic在某个领域的实现需求
6. **ModuleRequirement（模块需求）**：从特性需求拆解的模块级需求

## 核心关系
1. Vehicle has_domain_project DomainProject（车型包含领域项目）
2. DomainProject has_feature Feature（领域项目包含特性）
3. Feature has_module Module（特性包含模块）
4. FeatureRequirement relates_to Feature（特性需求关联特性）
5. ModuleRequirement relates_to Module（模块需求关联模块）

## 核心操作
1. **CreateVehicle**：创建新的车型
2. **ApproveProject**：批准项目
3. **CreateFeature**：创建特性

## 业务规则
1. 每个Vehicle必须至少有一个DomainProject
2. Feature的优先级必须是HIGH/MEDIUM/LOW之一
3. ModuleRequirement必须关联到一个Module

## 用例场景
1. **场景1**：创建新车型并关联领域项目
2. **场景2**：查看车型的所有相关项目和特性
3. **场景3**：追溯特性需求到模块需求
```

---

## 二、输出示例

### 2.1 Schema定义（JSON）

```json
{
  "version": "2.0.0",
  "name": "adas-rd-schema-v2",
  "description": "智能驾驶研发领域Schema定义",
  "domain": "智能驾驶研发",
  "created": "2026-01-18",
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
          "required": true,
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
    },
    "DomainProject": {
      "label": "领域项目",
      "description": "车型下的领域级研发项目",
      "properties": {
        "projectId": {
          "type": "String",
          "required": true,
          "description": "项目唯一标识",
          "example": "DP-ADAS-001"
        },
        "name": {
          "type": "String",
          "required": true,
          "description": "项目名称",
          "example": "梦想家智能驾驶项目"
        },
        "domain": {
          "type": "Enum",
          "values": ["ADAS", "CABIN", "EE"],
          "required": true,
          "description": "所属领域"
        },
        "status": {
          "type": "Enum",
          "values": ["PLANNING", "IN_PROGRESS", "COMPLETED"],
          "description": "项目状态"
        },
        "createdAt": {
          "type": "Date",
          "description": "创建时间"
        }
      },
      "links": [
        {
          "type": "has_feature",
          "target": "Feature",
          "cardinality": "one-to-many"
        }
      ]
    },
    "Feature": {
      "label": "特性",
      "description": "产品的业务特性",
      "properties": {
        "featureId": {
          "type": "String",
          "required": true,
          "description": "特性唯一标识",
          "example": "FEAT-NOA-001"
        },
        "name": {
          "type": "String",
          "required": true,
          "description": "特性名称",
          "example": "城市NOA"
        },
        "priority": {
          "type": "Enum",
          "values": ["HIGH", "MEDIUM", "LOW"],
          "required": true,
          "description": "优先级"
        },
        "status": {
          "type": "Enum",
          "values": ["PLANNING", "DEVELOPING", "COMPLETED"],
          "description": "特性状态"
        },
        "createdAt": {
          "type": "Date",
          "description": "创建时间"
        }
      },
      "links": [
        {
          "type": "has_module",
          "target": "Module",
          "cardinality": "one-to-many"
        }
      ]
    },
    "Module": {
      "label": "模块",
      "description": "特性的模块",
      "properties": {
        "moduleId": {
          "type": "String",
          "required": true,
          "description": "模块唯一标识",
          "example": "MOD-NOA-001"
        },
        "name": {
          "type": "String",
          "required": true,
          "description": "模块名称",
          "example": "感知融合模块"
        },
        "status": {
          "type": "Enum",
          "values": ["PLANNING", "DEVELOPING", "COMPLETED"],
          "description": "模块状态"
        },
        "createdAt": {
          "type": "Date",
          "description": "创建时间"
        }
      }
    },
    "FeatureRequirement": {
      "label": "特性需求",
      "description": "Epic在某个领域的实现需求",
      "properties": {
        "requirementId": {
          "type": "String",
          "required": true,
          "description": "需求唯一标识",
          "example": "FR-NOA-001"
        },
        "name": {
          "type": "String",
          "required": true,
          "description": "需求名称",
          "example": "城市NOA感知需求"
        },
        "priority": {
          "type": "Enum",
          "values": ["HIGH", "MEDIUM", "LOW"],
          "required": true,
          "description": "优先级"
        },
        "status": {
          "type": "Enum",
          "values": ["DRAFT", "APPROVED", "IMPLEMENTING", "COMPLETED"],
          "description": "需求状态"
        },
        "createdAt": {
          "type": "Date",
          "description": "创建时间"
        }
      },
      "links": [
        {
          "type": "relates_to_feature",
          "target": "Feature",
          "cardinality": "many-to-one"
        }
      ]
    },
    "ModuleRequirement": {
      "label": "模块需求",
      "description": "从特性需求拆解的模块级需求",
      "properties": {
        "requirementId": {
          "type": "String",
          "required": true,
          "description": "需求唯一标识",
          "example": "MR-NOA-001"
        },
        "name": {
          "type": "String",
          "required": true,
          "description": "需求名称",
          "example": "摄像头感知算法需求"
        },
        "status": {
          "type": "Enum",
          "values": ["DRAFT", "APPROVED", "IMPLEMENTING", "COMPLETED"],
          "description": "需求状态"
        },
        "createdAt": {
          "type": "Date",
          "description": "创建时间"
        }
      },
      "links": [
        {
          "type": "relates_to_module",
          "target": "Module",
          "cardinality": "many-to-one"
        }
      ]
    }
  },
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
    },
    "has_feature": {
      "label": "包含特性",
      "description": "领域项目包含多个特性",
      "from": ["DomainProject"],
      "to": ["Feature"],
      "properties": {
        "relationship": {
          "type": "String",
          "description": "关系描述",
          "example": "领域项目包含特性"
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
    },
    "has_module": {
      "label": "包含模块",
      "description": "特性包含多个模块",
      "from": ["Feature"],
      "to": ["Module"],
      "properties": {
        "relationship": {
          "type": "String",
          "description": "关系描述",
          "example": "特性包含模块"
        },
        "createdAt": {
          "type": "Date",
          "description": "创建时间"
        }
      }
    },
    "relates_to_feature": {
      "label": "关联特性",
      "description": "特性需求关联到特性",
      "from": ["FeatureRequirement"],
      "to": ["Feature"],
      "properties": {
        "relationship": {
          "type": "String",
          "description": "关系描述",
          "example": "特性需求承载特性"
        },
        "coverage": {
          "type": "Float",
          "description": "覆盖率（0-1）",
          "example": 0.8
        },
        "createdAt": {
          "type": "Date",
          "description": "创建时间"
        }
      }
    },
    "relates_to_module": {
      "label": "关联模块",
      "description": "模块需求关联到模块",
      "from": ["ModuleRequirement"],
      "to": ["Module"],
      "properties": {
        "relationship": {
          "type": "String",
          "description": "关系描述",
          "example": "模块需求承载模块"
        },
        "implementationStatus": {
          "type": "Enum",
          "values": ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
          "description": "实现状态"
        },
        "createdAt": {
          "type": "Date",
          "description": "创建时间"
        }
      }
    }
  },
  "actionTypes": {
    "CreateVehicle": {
      "label": "创建车型",
      "description": "创建新的车型对象",
      "parameters": {
        "name": {
          "type": "String",
          "required": true,
          "description": "车型名称"
        },
        "model": {
          "type": "String",
          "required": true,
          "description": "车型型号"
        }
      },
      "permissions": ["vehicle_manager"],
      "effects": {
        "creates": ["Vehicle"],
        "triggers": ["sendNotification"]
      }
    },
    "ApproveProject": {
      "label": "批准项目",
      "description": "批准领域项目",
      "parameters": {
        "projectId": {
          "type": "String",
          "required": true,
          "description": "项目ID"
        },
        "approverId": {
          "type": "String",
          "required": true,
          "description": "批准人ID"
        }
      },
      "permissions": ["project_manager"],
      "effects": {
        "updates": ["DomainProject.status"],
        "triggers": ["sendNotification"]
      }
    }
  },
  "metadata": {
    "author": "AI Assistant",
    "lastUpdated": "2026-01-18",
    "versionHistory": [
      {
        "version": "2.0.0",
        "date": "2026-01-18",
        "changes": ["初始版本"]
      }
    ]
  }
}
```

### 2.2 Schema文档（Markdown）

```markdown
# 智能驾驶研发领域Schema文档

## Schema概述

本Schema定义了智能驾驶研发领域的核心实体、关系和操作，支持从车型到模块需求的完整研发流程管理。

**版本**: 2.0.0  
**创建日期**: 2026-01-18  
**领域**: 智能驾驶研发

## 实体类型说明

### Vehicle（车型）

**描述**：车型定义，是最高层级的项目管理单元。

**属性**：
- `vehicleId` (String, 必需): 车型唯一标识，格式：VEH-XXX
- `name` (String, 必需): 车型名称
- `status` (Enum, 必需): 车型状态，可选值：PLANNING, DEVELOPING, LAUNCHED
- `createdAt` (Date): 创建时间

**关系**：
- `has_domain_project` → DomainProject（一对多）

**示例**：
```json
{
  "vehicleId": "VEH-001",
  "name": "岚图梦想家",
  "status": "LAUNCHED",
  "createdAt": "2026-01-18"
}
```

### DomainProject（领域项目）

**描述**：车型下的领域级研发项目。

**属性**：
- `projectId` (String, 必需): 项目唯一标识
- `name` (String, 必需): 项目名称
- `domain` (Enum, 必需): 所属领域，可选值：ADAS, CABIN, EE
- `status` (Enum): 项目状态
- `createdAt` (Date): 创建时间

**关系**：
- `has_feature` → Feature（一对多）

**示例**：
```json
{
  "projectId": "DP-ADAS-001",
  "name": "梦想家智能驾驶项目",
  "domain": "ADAS",
  "status": "IN_PROGRESS",
  "createdAt": "2026-01-18"
}
```

[其他实体类型说明...]

## 关系类型说明

### has_domain_project

**描述**：车型包含多个领域项目。

**源实体**：Vehicle  
**目标实体**：DomainProject  
**基数**：一对多

**属性**：
- `relationship` (String): 关系描述
- `priority` (Enum): 优先级，可选值：HIGH, MEDIUM, LOW
- `createdAt` (Date): 创建时间

**示例**：
```json
{
  "source": "VEH-001",
  "target": "DP-ADAS-001",
  "type": "has_domain_project",
  "data": {
    "relationship": "车型包含领域项目",
    "priority": "HIGH",
    "createdAt": "2026-01-18"
  }
}
```

[其他关系类型说明...]

## 使用示例

### 示例1：创建车型并关联领域项目

```json
{
  "vehicle": {
    "vehicleId": "VEH-001",
    "name": "岚图梦想家",
    "status": "LAUNCHED"
  },
  "domainProjects": [
    {
      "projectId": "DP-ADAS-001",
      "name": "梦想家智能驾驶项目",
      "domain": "ADAS"
    }
  ],
  "relationships": [
    {
      "source": "VEH-001",
      "target": "DP-ADAS-001",
      "type": "has_domain_project",
      "data": {
        "priority": "HIGH"
      }
    }
  ]
}
```

[更多示例...]

## 数据字典

[完整的数据字典...]
```

### 2.3 验证报告（Markdown）

```markdown
# Schema验证报告

**验证日期**: 2026-01-18  
**Schema版本**: 2.0.0  
**验证状态**: ✅ 通过

## 完整性检查

- [x] 所有核心实体都有定义（6个实体）
- [x] 所有核心关系都有定义（5个关系）
- [x] 所有核心操作都有定义（2个操作）
- [x] 所有业务规则都有体现
- [x] 所有用例场景都有支持

## 准确性检查

- [x] 准确反映业务领域
- [x] 属性类型正确
- [x] 关系定义正确
- [x] 业务规则正确

## 一致性检查

- [x] 命名约定一致（PascalCase实体，snake_case关系）
- [x] 类型定义一致
- [x] 描述格式一致

## 可维护性检查

- [x] 文档完整
- [x] 版本控制
- [x] 变更历史

## 评分

- **完整性**: 10/10
- **准确性**: 9/10
- **一致性**: 10/10
- **可维护性**: 9/10
- **总分**: 9.5/10

## 改进建议

1. 考虑添加更多操作类型
2. 考虑添加接口定义（如需要）
3. 考虑添加函数定义（如需要）
```

---

## 三、Prompt使用流程示例

### 3.1 完整流程

```
Step 1: 提供领域需求文档
  ↓
Step 2: 使用主Prompt生成初始Schema
  ↓
Step 3: 使用实体类型Prompt细化每个实体
  ↓
Step 4: 使用关系类型Prompt细化每个关系
  ↓
Step 5: 使用Schema验证Prompt验证质量
  ↓
Step 6: 使用Schema优化Prompt优化（如需要）
  ↓
Step 7: 最终验证和文档生成
```

---

**下一步**：参见 `07-SUMMARY.md` 了解完整总结。
