# 知识图谱对象属性 - 一页纸总结

> **目标读者**: 快速理解什么是对象属性及其在知识图谱中的作用

---

## 📌 核心概念

### 什么是对象属性？

**对象属性 = 实体之间的关系**

```
数据属性 vs 对象属性：

❌ 数据属性（Data Property）:
   Epic { title: "高速驾驶", priority: "P0", status: "implementing" }
   描述实体自身的特征（字符串、数字、日期等）

✅ 对象属性（Object Property）:
   Epic --splits_to--> FeatureRequirement
   描述实体之间的关系（关联、依赖、包含等）
```

### 在我们的系统中

| 概念 | 在系统中的表现 | 示例 |
|------|---------------|------|
| **实体（Entity）** | 节点（Node） | Epic, FR, Task |
| **对象属性（Object Property）** | 边（Edge）/ 关系（Relation） | splits_to, belongs_to |
| **数据属性（Data Property）** | 节点的data字段 | title, priority, status |

---

## 🎯 为什么需要？

### 1. 语义清晰

```
❌ 没有对象属性：
   只知道Epic和FR，不知道它们的关系

✅ 有对象属性：
   Epic --splits_to--> FR
   明确表达"拆分"的语义
```

### 2. 约束验证

```javascript
// 对象属性定义了约束
splits_to_fr: {
  domain: ["Epic"],        // 只能从Epic出发
  range: ["FR"],           // 只能到达FR
  cardinality: {min: 1}    // 每个Epic至少拆分1个FR
}

// 系统自动验证
Task --splits_to--> FR   ❌ 错误！Task不在domain中
Epic --splits_to--> Task ❌ 错误！Task不在range中
```

### 3. 推理能力

```
传递性推理：
  A --contains--> B
  B --contains--> C
  ⇒ A --contains--> C （自动推导）

逆属性推理：
  Epic --splits_to--> FR
  ⇒ FR --fr_from--> Epic （自动生成反向关系）
```

---

## 📊 对象属性的特征

### OWL标准特征

| 特征 | 说明 | 示例 |
|------|------|------|
| **传递性** (Transitive) | A→B, B→C ⇒ A→C | 包含关系 |
| **对称性** (Symmetric) | A→B ⇒ B→A | 协作关系 |
| **非对称** (Asymmetric) | A→B ⇒ ¬(B→A) | 拆分关系 |
| **函数性** (Functional) | 每个主体只能有一个对象 | 唯一归属 |
| **逆属性** (Inverse) | hasParent ↔ hasChild | 双向映射 |

### 实际应用

```json
{
  "splits_to_fr": {
    "domain": ["Epic"],
    "range": ["FeatureRequirement"],
    "characteristics": {
      "asymmetric": true,    // Epic→FR，不可能FR→Epic
      "transitive": false    // Epic拆分不具有传递性
    },
    "cardinality": {
      "min": 1,              // 每个Epic至少拆分1个FR
      "max": null            // 无上限
    }
  }
}
```

---

## 🚀 快速上手

### 第一步：定义对象属性（Schema）

```json
// data/core-domain-schema.json
{
  "relationTypes": {
    "splits_to_fr": {
      "label": "拆分为特性需求",
      "domain": ["Epic"],
      "range": ["FeatureRequirement"],
      "characteristics": { "asymmetric": true },
      "visualization": { "color": "#52c41a" }
    }
  }
}
```

### 第二步：创建实例（Data）

```json
// data/core-domain-data.json
{
  "edges": [
    {
      "id": "e1",
      "source": "epic-001",
      "target": "fr-001",
      "type": "splits_to_fr"    // 使用定义的对象属性
    }
  ]
}
```

### 第三步：可视化展示

```javascript
// 在图谱中，边会自动使用对象属性的配置
Epic --[splits_to_fr]--> FR
     绿色线条（#52c41a）
     箭头表示方向
```

---

## 💡 实际应用场景

### 场景1: 需求追溯

```
Epic --splits_to--> FR --splits_to--> SSTS --splits_to--> MR
                                                  ↓
                                              converts_to
                                                  ↓
                                                Task
```

**价值**: 通过对象属性链，完整追溯需求分解过程

### 场景2: 约束验证

```javascript
// 添加边时自动验证
addEdge({
  source: "task-001",
  target: "fr-001",
  type: "splits_to_fr"
});
// ❌ 错误：Task不能splits_to FR（domain约束）
```

**价值**: 保证数据一致性，防止错误关系

### 场景3: 智能推荐

```javascript
// 当创建FR时，系统推荐可能的关系
FR创建后 → 系统提示：
  - "是否需要splits_to SSTS？"
  - "是否需要belongs_to 领域项目？"
  - "是否需要in_baseline 基线？"
```

**价值**: 辅助用户建立完整的关系网络

---

## 📈 系统增强

### 当前系统（基础版）

```
✅ 有边（Edge）
✅ 有关系类型（RelationType）
✅ 可以可视化展示

❌ 没有约束验证
❌ 没有推理能力
❌ 没有对象属性管理界面
```

### 增强后系统（完整版）

```
✅ 完整的对象属性定义（OWL标准）
✅ 自动约束验证
✅ 推理引擎（传递性、逆属性等）
✅ 对象属性浏览器
✅ 可视化管理界面
✅ 统计分析功能
```

---

## 🎨 可视化示例

### 对象属性浏览器

```
┌─────────────────────────────────────┐
│ 对象属性列表                         │
├─────────────────────────────────────┤
│                                      │
│ ● splits_to_fr        [6个实例]     │
│   Epic → FR                          │
│   分解关系 | 非对称 | 1:N            │
│                                      │
│ ● belongs_to_domain   [4个实例]     │
│   FR → DomainProject                 │
│   关联关系 | 函数性 | N:1            │
│                                      │
│ ● has_pi_planning     [3个实例]     │
│   DomainProject → PIPlanning         │
│   结构关系 | 1:N                     │
│                                      │
└─────────────────────────────────────┘
```

### 关系矩阵

```
         Epic  FR  SSTS  MR  Task
Epic      -    6    -    -    -
FR        -    -    4    -    -
SSTS      -    -    -    8    -
MR        -    -    -    -    4
Task      -    -    -    -    -
```

---

## 🔧 技术实现

### 最小实现（MVP）

```javascript
// 1. 后端API（30分钟）
GET  /api/v1/properties           // 列表
GET  /api/v1/properties/:id       // 详情
GET  /api/v1/properties/:id/instances  // 实例

// 2. 前端组件（1小时）
<PropertyBrowser />  // 对象属性浏览器

// 3. Schema增强（30分钟）
添加 domain, range, characteristics, cardinality 字段
```

### 完整实现（2-3周）

```javascript
// + 对象属性编辑器
<PropertyEditor />

// + 约束验证器
PropertyValidator.validate(edge, schema)

// + 推理引擎
PropertyReasoner.infer(edges, schema)

// + 可视化分析
<PropertyMatrix />
<PropertyDistribution />
```

---

## 📚 参考资源

### 标准规范
- [OWL 2 Web Ontology Language](https://www.w3.org/TR/owl2-overview/)
- [RDF Schema](https://www.w3.org/TR/rdf-schema/)

### 工具
- [Protégé](https://protege.stanford.edu/) - 本体编辑器
- [GraphDB](https://www.ontotext.com/products/graphdb/) - 支持推理的图数据库

### 文档
- [详细设计方案](./OBJECT_PROPERTIES_DESIGN.md)
- [快速实施指南](./OBJECT_PROPERTIES_QUICK_IMPL.md)

---

## 🎯 关键要点

### ✅ DO
1. 为每个对象属性定义清晰的domain和range
2. 使用OWL特征增强语义（传递性、对称性等）
3. 设置合理的基数约束
4. 提供可视化配置
5. 实现约束验证

### ❌ DON'T
1. 不要过度设计（从简单开始）
2. 不要忽略约束验证
3. 不要混淆对象属性和数据属性
4. 不要创建循环依赖的属性链
5. 不要忽略性能（大规模推理）

---

## 🚦 实施建议

### 阶段1: 基础（1-2天）⭐ 推荐先做
- [ ] Schema增强：添加domain, range等
- [ ] API开发：对象属性查询接口
- [ ] 前端：对象属性浏览器

### 阶段2: 增强（1周）
- [ ] 约束验证
- [ ] 对象属性编辑器
- [ ] 可视化优化

### 阶段3: 高级（2-3周）
- [ ] 推理引擎
- [ ] SPARQL查询
- [ ] 高级分析

---

**总结**: 对象属性是知识图谱的"粘合剂"，将独立的实体连接成有意义的知识网络。通过完善的对象属性设计，可以大幅提升系统的语义表达能力、数据质量和智能化水平。

---

**创建日期**: 2026-01-16  
**建议阅读时间**: 5-10分钟  
**适用对象**: 所有团队成员
