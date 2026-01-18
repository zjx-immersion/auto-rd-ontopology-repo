# 本体建模可复用Prompt模板

**版本**: v1.0  
**日期**: 2026-01-18  
**用途**: 使用AI辅助进行本体建模，生成符合OAG知识图谱标准的Schema定义

---

## 一、Prompt设计原则

### 1.1 结构化输入
- 清晰的输入格式要求
- 示例和模板
- 约束和验证规则

### 1.2 迭代优化
- 支持多轮对话
- 反馈和修正机制
- 质量评估标准

### 1.3 可复用性
- 模板化设计
- 参数化配置
- 领域无关的核心结构

---

## 二、核心Prompt模板

### 2.1 本体建模主Prompt

```markdown
# 任务：基于领域需求生成OAG知识图谱Schema

## 角色定义
你是一位经验丰富的本体建模专家，精通Palantir Foundry的本体论实践和知识图谱工程。你的任务是基于提供的领域需求，生成符合OAG（Ontology-Aware Graph）标准的Schema定义。

## 输入要求

### 1. 领域需求文档
请提供以下信息：

**业务背景**：
[描述领域的基本信息和业务目标]

**核心实体**（名词）：
- [实体1名称]： [描述]
- [实体2名称]： [描述]
- ...

**核心关系**（动词）：
- [实体A] [关系名称] [实体B]： [描述]
- ...

**核心操作**（动作，可选）：
- [操作1名称]： [描述]
- ...

**业务规则**：
- [规则1]
- [规则2]
- ...

**用例场景**：
- [场景1描述]
- [场景2描述]
- ...

### 2. 数据源信息（可选）
如果已有数据源，请提供：
- 数据源名称和类型
- Schema定义
- 权威性标识

### 3. 现有Schema（可选）
如果已有Schema，请提供：
- Schema文件或描述
- 版本信息
- 兼容性要求

## 输出要求

请生成以下内容：

### 1. Schema定义（JSON格式）

必须符合以下结构：

```json
{
  "version": "2.0.0",
  "name": "{domain}-schema-v2",
  "description": "{领域描述}",
  "domain": "{领域名称}",
  "created": "{日期}",
  "entityTypes": {
    "{EntityName}": {
      "label": "{中文标签}",
      "description": "{详细描述}",
      "properties": {
        "{propertyName}": {
          "type": "{String|Integer|Float|Date|Enum|Boolean|Text}",
          "required": true|false,
          "description": "{属性描述}",
          "example": "{示例值}"
        }
      },
      "links": [
        {
          "type": "{relationTypeName}",
          "target": "{TargetEntityName}",
          "cardinality": "{one-to-one|one-to-many|many-to-many}"
        }
      ]
    }
  },
  "relationTypes": {
    "{relationTypeName}": {
      "label": "{中文标签}",
      "description": "{详细描述}",
      "from": ["{SourceEntityName}"],
      "to": ["{TargetEntityName}"],
      "properties": {
        "{propertyName}": {
          "type": "{类型}",
          "description": "{描述}",
          "example": "{示例}"
        }
      }
    }
  }
}
```

### 2. Schema文档（Markdown格式）

包含：
- Schema概述
- 实体类型说明
- 关系类型说明
- 使用示例
- 数据字典

### 3. 验证检查清单

- [ ] 所有核心实体都有定义
- [ ] 所有核心关系都有定义
- [ ] 所有属性都有类型和描述
- [ ] 命名约定一致
- [ ] 符合业务规则

## 设计原则

请遵循以下原则：

1. **业务价值优先**：确保Schema支持业务决策和用例场景
2. **最小且清晰**：只包含必要的实体和属性
3. **稳定实体**：对象类型应表示稳定的业务实体
4. **明确关系**：使用关系类型而非隐藏的外键
5. **治理优先**：考虑权限、审计、版本控制
6. **可扩展性**：支持未来扩展和演进

## 参考标准

- Palantir Foundry Ontology最佳实践
- OAG知识图谱标准
- 领域驱动设计（DDD）原则

## 输出格式

请按以下顺序输出：

1. **Schema定义**（JSON代码块）
2. **Schema文档**（Markdown代码块）
3. **验证报告**（Markdown代码块）
4. **改进建议**（如有）

---

请开始分析提供的领域需求，并生成Schema定义。
```

---

## 三、专用Prompt变体

### 3.1 实体类型定义Prompt

```markdown
# 任务：为特定实体生成详细的Schema定义

## 实体信息
- **实体名称**： [名称]
- **业务描述**： [描述]
- **核心属性**： [属性列表]
- **相关实体**： [相关实体列表]

## 要求
1. 定义完整的属性列表（包括类型、描述、示例）
2. 定义与其他实体的关系
3. 考虑业务规则和约束
4. 提供使用示例

## 输出格式
```json
{
  "{EntityName}": {
    "label": "{中文标签}",
    "description": "{详细描述}",
    "properties": { ... },
    "links": [ ... ]
  }
}
```
```

### 3.2 关系类型定义Prompt

```markdown
# 任务：为特定关系生成详细的Schema定义

## 关系信息
- **关系名称**： [名称]
- **源实体**： [SourceEntity]
- **目标实体**： [TargetEntity]
- **业务描述**： [描述]
- **基数**： [one-to-one|one-to-many|many-to-many]
- **关系属性**： [属性列表，如优先级、创建时间等]

## 要求
1. 定义关系的语义和方向
2. 定义关系的属性（如果有）
3. 考虑业务规则和约束
4. 提供使用示例

## 输出格式
```json
{
  "{relationTypeName}": {
    "label": "{中文标签}",
    "description": "{详细描述}",
    "from": ["{SourceEntity}"],
    "to": ["{TargetEntity}"],
    "properties": { ... }
  }
}
```
```

### 3.3 Schema优化Prompt

```markdown
# 任务：优化现有Schema定义

## 输入
- **现有Schema**： [Schema JSON]
- **问题或需求**： [描述需要优化的方面]

## 优化方向
1. **性能优化**：减少冗余、优化关系设计
2. **可扩展性**：添加接口、支持多态
3. **一致性**：统一命名、类型定义
4. **完整性**：补充缺失的属性或关系

## 要求
1. 保持向后兼容性（如需要）
2. 提供变更说明
3. 提供迁移建议（如需要）

## 输出格式
1. **优化后的Schema**（JSON）
2. **变更说明**（Markdown）
3. **迁移指南**（如有）
```

### 3.4 Schema验证Prompt

```markdown
# 任务：验证Schema定义的质量和完整性

## 输入
- **Schema定义**： [Schema JSON]
- **领域需求**： [需求文档]

## 验证维度
1. **完整性**：所有需求是否都有对应的Schema定义
2. **一致性**：命名、类型定义是否一致
3. **准确性**：是否准确反映业务领域
4. **可维护性**：文档是否清晰、版本控制是否完善

## 输出格式
1. **验证报告**（Markdown）
2. **问题清单**（如有）
3. **改进建议**（如有）
```

---

## 四、Prompt使用流程

### 4.1 初始建模流程

```
Step 1: 使用主Prompt生成初始Schema
  ↓
Step 2: 使用实体类型Prompt细化每个实体
  ↓
Step 3: 使用关系类型Prompt细化每个关系
  ↓
Step 4: 使用Schema验证Prompt验证质量
  ↓
Step 5: 使用Schema优化Prompt优化（如需要）
  ↓
Step 6: 最终验证和文档生成
```

### 4.2 迭代优化流程

```
Step 1: 识别需要优化的方面
  ↓
Step 2: 使用Schema优化Prompt
  ↓
Step 3: 评估优化结果
  ↓
Step 4: 应用优化（如满意）
  ↓
Step 5: 更新文档和版本
```

---

## 五、Prompt参数化配置

### 5.1 领域特定配置

```yaml
domain_config:
  name: "智能驾驶研发"
  language: "zh-CN"
  naming_convention: "PascalCase"
  property_naming: "camelCase"
  relation_naming: "snake_case"
```

### 5.2 Schema版本配置

```yaml
schema_config:
  version: "2.0.0"
  base_schema: "core-domain-schema-v2.json"
  compatibility_mode: true
```

### 5.3 输出格式配置

```yaml
output_config:
  include_examples: true
  include_documentation: true
  include_validation: true
  format: "json"
```

---

## 六、Prompt质量评估

### 6.1 评估标准

1. **完整性**：是否覆盖所有需求
2. **准确性**：是否准确反映业务领域
3. **一致性**：命名和结构是否一致
4. **可读性**：文档是否清晰易懂
5. **可维护性**：是否易于扩展和修改

### 6.2 评估Prompt

```markdown
# 任务：评估Schema定义的质量

## 输入
- **Schema定义**： [Schema JSON]
- **领域需求**： [需求文档]
- **参考标准**： [Palantir最佳实践]

## 评估维度
请从以下维度评估：

1. **完整性**（0-10分）
   - 所有核心实体都有定义？
   - 所有核心关系都有定义？
   - 所有属性都有类型和描述？

2. **准确性**（0-10分）
   - 准确反映业务领域？
   - 属性类型正确？
   - 关系定义正确？

3. **一致性**（0-10分）
   - 命名约定一致？
   - 类型定义一致？
   - 描述格式一致？

4. **可读性**（0-10分）
   - 文档清晰？
   - 示例丰富？
   - 易于理解？

5. **可维护性**（0-10分）
   - 版本控制？
   - 变更历史？
   - 扩展性？

## 输出格式
1. **评分**（每个维度0-10分）
2. **问题清单**（如有）
3. **改进建议**（如有）
```

---

## 七、Prompt优化建议

### 7.1 基于Palantir实践的优化

1. **添加决策中心思维**：强调理解业务决策点
2. **添加治理要求**：权限、审计、版本控制
3. **添加数据血缘**：属性到数据源的映射
4. **添加操作类型**：支持业务操作建模
5. **添加函数定义**：支持业务规则和模型集成

### 7.2 基于实际应用的优化

1. **添加性能考虑**：关系密度、索引需求
2. **添加扩展性考虑**：接口、多态支持
3. **添加兼容性考虑**：向后兼容、迁移策略
4. **添加工具集成**：可视化、查询、分析工具

---

## 八、使用示例

### 8.1 完整建模示例

**输入**：
```markdown
## 领域需求：智能驾驶研发

### 核心实体
- Vehicle（车型）
- DomainProject（领域项目）
- Feature（特性）

### 核心关系
- Vehicle has_domain_project DomainProject
- DomainProject has_feature Feature

### 业务规则
- 每个Vehicle必须至少有一个DomainProject
- Feature的优先级必须是HIGH/MEDIUM/LOW之一
```

**输出**：参见 `04-EXAMPLE_OUTPUT.md`

---

**下一步**：参见 `04-PROMPT_EVALUATION.md` 了解如何评估和优化Prompt质量。
