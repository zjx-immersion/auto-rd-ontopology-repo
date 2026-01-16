# 知识图谱对象属性设计方案

> **设计日期**: 2026-01-16  
> **版本**: 1.0.0  
> **状态**: 设计阶段

---

## 一、对象属性概述

### 1.1 什么是对象属性？

在知识图谱和本体论（Ontology）中，属性分为两类：

| 属性类型 | 英文 | 说明 | 示例 |
|---------|------|------|------|
| **数据属性** | Data Properties | 实体的字面值属性 | name: "张三", age: 30, status: "active" |
| **对象属性** | Object Properties | 实体之间的关系/关联 | Epic → splits_to → FeatureRequirement |

**对象属性 = 边（Edge）= 关系（Relation）**

### 1.2 为什么需要对象属性？

```
完整的知识图谱 = 实体（Entities） + 对象属性（Object Properties）

没有对象属性：
  Epic [name="高速驾驶"]
  FR [name="车道保持"]
  ❌ 无法表达它们之间的关系

有对象属性：
  Epic [name="高速驾驶"] --splits_to--> FR [name="车道保持"]
  ✅ 清晰表达"拆分"关系
```

### 1.3 对象属性的特征

基于OWL（Web Ontology Language）标准，对象属性可以有以下特征：

| 特征 | 说明 | 示例 |
|------|------|------|
| **功能性** | Functional | 每个主体只能有一个对象 |
| **反函数** | Inverse Functional | 每个对象只能有一个主体 |
| **传递性** | Transitive | A→B, B→C ⇒ A→C |
| **对称性** | Symmetric | A→B ⇒ B→A |
| **反对称** | Asymmetric | A→B ⇒ ¬(B→A) |
| **反射性** | Reflexive | A→A |
| **逆属性** | Inverse | hasParent ↔ hasChild |

---

## 二、Schema增强设计

### 2.1 增强的RelationType定义

```json
{
  "relationTypes": {
    "splits_to_fr": {
      // 基本信息
      "label": "拆分为特性需求",
      "description": "Epic跨领域拆分为FR",
      
      // 域和值域约束
      "domain": ["Epic"],
      "range": ["FeatureRequirement"],
      
      // OWL对象属性特征
      "characteristics": {
        "functional": false,
        "inverseFunctional": false,
        "transitive": false,
        "symmetric": false,
        "asymmetric": true,
        "reflexive": false
      },
      
      // 逆属性
      "inverseOf": "fr_from_epic",
      
      // 基数约束
      "cardinality": {
        "min": 1,
        "max": null  // null表示无限制
      },
      
      // 语义
      "semantics": {
        "type": "decomposition",  // 分解关系
        "strength": "strong"       // 强关联
      },
      
      // 可视化
      "visualization": {
        "color": "#1890ff",
        "width": 2,
        "style": "solid",  // solid, dashed, dotted
        "arrow": "triangle"
      },
      
      // 元数据
      "metadata": {
        "createdBy": "system",
        "createdAt": "2026-01-16",
        "version": "1.0"
      }
    }
  }
}
```

### 2.2 对象属性分类

```json
{
  "objectPropertyCategories": {
    "structural": {
      "label": "结构关系",
      "description": "表示层次结构、包含关系",
      "properties": [
        "has_domain_project",
        "has_lifecycle_node",
        "has_baseline",
        "has_pi_planning",
        "has_sprint"
      ],
      "color": "#1890ff"
    },
    "decomposition": {
      "label": "分解关系",
      "description": "表示需求拆解、转换",
      "properties": [
        "splits_to_fr",
        "splits_to_ssts",
        "splits_to_mr",
        "converts_to_task"
      ],
      "color": "#52c41a"
    },
    "association": {
      "label": "关联关系",
      "description": "表示归属、绑定",
      "properties": [
        "belongs_to_domain",
        "in_sprint",
        "in_baseline",
        "binds_to_feature_asset"
      ],
      "color": "#faad14"
    },
    "implementation": {
      "label": "实现关系",
      "description": "表示开发、构建、部署",
      "properties": [
        "implements",
        "triggers_build",
        "produces_artifact",
        "deploys"
      ],
      "color": "#722ed1"
    },
    "traceability": {
      "label": "追溯关系",
      "description": "表示追溯链路",
      "properties": [
        "traces_to",
        "derived_from",
        "verified_by"
      ],
      "color": "#eb2f96"
    }
  }
}
```

---

## 三、前端界面设计

### 3.1 对象属性浏览器

**位置**: 侧边栏新增"对象属性"标签

```
┌─────────────────────────────────────────┐
│ 知识图谱系统                             │
├─────────────────────────────────────────┤
│ [图谱视图] [表格视图] [对象属性]        │
├─────────────────────────────────────────┤
│                                          │
│  对象属性浏览器                          │
│  ─────────────────────                  │
│                                          │
│  [搜索对象属性...]                       │
│                                          │
│  ▼ 结构关系 (5)                         │
│    ├─ has_domain_project                │
│    │   VehicleProject → DomainProject   │
│    │   5个实例                           │
│    │                                     │
│    ├─ has_lifecycle_node                │
│    │   VehicleProject → LifecycleNode   │
│    │   3个实例                           │
│    └─ ...                                │
│                                          │
│  ▼ 分解关系 (4)                         │
│    ├─ splits_to_fr                      │
│    │   Epic → FeatureRequirement        │
│    │   ✓ 非对称  ✓ 1:N                  │
│    │   6个实例                           │
│    │                                     │
│    └─ ...                                │
│                                          │
│  ▼ 关联关系 (5)                         │
│    └─ ...                                │
│                                          │
└─────────────────────────────────────────┘
```

### 3.2 对象属性详情面板

点击某个对象属性时，显示详细信息：

```
┌─────────────────────────────────────────┐
│ splits_to_fr - 拆分为特性需求        [×]│
├─────────────────────────────────────────┤
│                                          │
│ 基本信息                                 │
│ ──────                                   │
│ 标签: 拆分为特性需求                     │
│ 类型: decomposition (分解关系)          │
│ 描述: Epic跨领域拆分为FR                │
│                                          │
│ 域和值域                                 │
│ ──────                                   │
│ Domain:  Epic                            │
│ Range:   FeatureRequirement              │
│                                          │
│ 对象属性特征                             │
│ ────────────                            │
│ ✓ 非对称 (Asymmetric)                   │
│ ✗ 传递性 (Transitive)                   │
│ ✗ 对称性 (Symmetric)                    │
│ ✗ 反射性 (Reflexive)                    │
│                                          │
│ 基数约束                                 │
│ ──────                                   │
│ 最小: 1 (每个Epic至少拆分1个FR)         │
│ 最大: ∞ (无限制)                        │
│                                          │
│ 逆属性                                   │
│ ────                                     │
│ fr_from_epic (来自Epic)                 │
│                                          │
│ 实例统计                                 │
│ ──────                                   │
│ 总实例数: 6个                           │
│ 查看所有实例 →                          │
│                                          │
│ 可视化设置                               │
│ ────────                                │
│ 颜色: [■ #1890ff]                       │
│ 线宽: 2                                  │
│ 样式: ──── (实线)                       │
│ 箭头: ▶ (三角形)                        │
│                                          │
│ [编辑] [删除] [导出]                    │
│                                          │
└─────────────────────────────────────────┘
```

### 3.3 图谱中的对象属性增强

**在图谱边上显示更多信息**：

```
原来的边显示：
  Epic ────splits_to───▶ FR

增强后的边显示：
  Epic ════splits_to══▶ FR
       ↑              ↑
       加粗线条        类型标签
       
鼠标悬停时显示：
┌─────────────────────┐
│ splits_to_fr        │
│ ─────────────────── │
│ 类型: 分解关系       │
│ Epic → FR           │
│ 非对称、1:N         │
│ 6个实例             │
└─────────────────────┘
```

---

## 四、功能实现

### 4.1 对象属性管理

#### 1) 创建对象属性

**前端组件**: `ObjectPropertyEditor.js`

```javascript
const ObjectPropertyEditor = ({ onSave, onCancel }) => {
  const [property, setProperty] = useState({
    id: '',
    label: '',
    description: '',
    domain: [],
    range: [],
    characteristics: {
      functional: false,
      inverseFunctional: false,
      transitive: false,
      symmetric: false,
      asymmetric: false,
      reflexive: false
    },
    cardinality: {
      min: 0,
      max: null
    }
  });

  return (
    <Form>
      <Form.Item label="属性ID">
        <Input value={property.id} onChange={...} />
      </Form.Item>
      
      <Form.Item label="标签">
        <Input value={property.label} onChange={...} />
      </Form.Item>
      
      <Form.Item label="域（Domain）">
        <Select mode="multiple" value={property.domain}>
          {entityTypes.map(type => (
            <Option key={type}>{type}</Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item label="值域（Range）">
        <Select mode="multiple" value={property.range}>
          {entityTypes.map(type => (
            <Option key={type}>{type}</Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item label="对象属性特征">
        <Checkbox checked={property.characteristics.transitive}>
          传递性 (Transitive)
        </Checkbox>
        <Checkbox checked={property.characteristics.symmetric}>
          对称性 (Symmetric)
        </Checkbox>
        <Checkbox checked={property.characteristics.asymmetric}>
          非对称 (Asymmetric)
        </Checkbox>
        {/* 其他特征... */}
      </Form.Item>
      
      <Form.Item label="基数约束">
        <InputNumber placeholder="最小" value={property.cardinality.min} />
        <InputNumber placeholder="最大" value={property.cardinality.max} />
      </Form.Item>
      
      <Button type="primary" onClick={onSave}>保存</Button>
      <Button onClick={onCancel}>取消</Button>
    </Form>
  );
};
```

#### 2) 验证对象属性约束

**后端服务**: `ObjectPropertyService.js`

```javascript
class ObjectPropertyService {
  /**
   * 验证边是否满足对象属性约束
   */
  validateEdge(edge, schema) {
    const property = schema.relationTypes[edge.type];
    if (!property) {
      throw new Error(`未定义的对象属性: ${edge.type}`);
    }

    // 验证domain
    const sourceNode = this.getNodeById(edge.source);
    if (!property.domain.includes(sourceNode.type)) {
      throw new Error(
        `源节点类型错误: 期望${property.domain}, 实际${sourceNode.type}`
      );
    }

    // 验证range
    const targetNode = this.getNodeById(edge.target);
    if (!property.range.includes(targetNode.type)) {
      throw new Error(
        `目标节点类型错误: 期望${property.range}, 实际${targetNode.type}`
      );
    }

    // 验证基数约束
    if (property.cardinality) {
      const existingEdges = this.getEdges({
        source: edge.source,
        type: edge.type
      });

      if (property.cardinality.max !== null && 
          existingEdges.length >= property.cardinality.max) {
        throw new Error(
          `超过最大基数限制: 最多${property.cardinality.max}个`
        );
      }
    }

    // 验证函数性
    if (property.characteristics?.functional) {
      const existing = this.getEdges({
        source: edge.source,
        type: edge.type
      });
      if (existing.length > 0) {
        throw new Error('违反函数性约束: 已存在目标对象');
      }
    }

    // 验证对称性
    if (property.characteristics?.symmetric) {
      // 自动创建反向边
      this.addEdge({
        source: edge.target,
        target: edge.source,
        type: edge.type
      });
    }

    return true;
  }

  /**
   * 推理传递关系
   */
  inferTransitiveRelations(property) {
    if (!property.characteristics?.transitive) {
      return [];
    }

    const newEdges = [];
    const edges = this.getEdges({ type: property.id });

    // A→B, B→C ⇒ A→C
    edges.forEach(edge1 => {
      edges.forEach(edge2 => {
        if (edge1.target === edge2.source) {
          // 检查A→C是否已存在
          const exists = this.getEdges({
            source: edge1.source,
            target: edge2.target,
            type: property.id
          });

          if (exists.length === 0) {
            newEdges.push({
              source: edge1.source,
              target: edge2.target,
              type: property.id,
              inferred: true
            });
          }
        }
      });
    });

    return newEdges;
  }
}
```

### 4.2 对象属性查询

#### SPARQL风格查询

```javascript
// 查询所有Epic拆分的FR
const query = {
  subject: { type: 'Epic' },
  property: 'splits_to_fr',
  object: { type: 'FeatureRequirement' }
};

// 查询FR归属的领域项目
const query = {
  subject: { id: 'fr-001-lane-keeping' },
  property: 'belongs_to_domain',
  object: {}
};

// 查询传递闭包（所有下游）
const query = {
  subject: { id: 'epic-highway-driving' },
  property: '*',  // 所有关系
  object: {},
  closure: 'transitive'  // 传递闭包
};
```

#### API接口

```javascript
// GET /api/v1/properties/:propertyId
// 获取对象属性详情
app.get('/api/v1/properties/:propertyId', (req, res) => {
  const property = schema.relationTypes[req.params.propertyId];
  
  // 统计实例
  const instances = edges.filter(e => e.type === req.params.propertyId);
  
  res.json({
    property: property,
    instances: instances.length,
    statistics: {
      byDomain: countByDomain(instances),
      byRange: countByRange(instances)
    }
  });
});

// GET /api/v1/properties/:propertyId/instances
// 获取对象属性的所有实例
app.get('/api/v1/properties/:propertyId/instances', (req, res) => {
  const instances = edges.filter(e => e.type === req.params.propertyId);
  
  res.json({
    total: instances.length,
    instances: instances.map(e => ({
      id: e.id,
      source: nodes.find(n => n.id === e.source),
      target: nodes.find(n => n.id === e.target),
      data: e.data
    }))
  });
});

// POST /api/v1/properties/validate
// 验证边是否满足对象属性约束
app.post('/api/v1/properties/validate', (req, res) => {
  const { edge } = req.body;
  
  try {
    const isValid = propertyService.validateEdge(edge, schema);
    res.json({ valid: true });
  } catch (error) {
    res.json({
      valid: false,
      error: error.message
    });
  }
});
```

---

## 五、高级功能

### 5.1 对象属性推理

```javascript
class PropertyReasoner {
  /**
   * 执行推理，生成隐含的关系
   */
  reason(nodes, edges, schema) {
    const inferredEdges = [];

    // 1. 传递性推理
    Object.values(schema.relationTypes).forEach(property => {
      if (property.characteristics?.transitive) {
        inferredEdges.push(
          ...this.inferTransitive(edges, property.id)
        );
      }
    });

    // 2. 对称性推理
    Object.values(schema.relationTypes).forEach(property => {
      if (property.characteristics?.symmetric) {
        inferredEdges.push(
          ...this.inferSymmetric(edges, property.id)
        );
      }
    });

    // 3. 逆属性推理
    Object.values(schema.relationTypes).forEach(property => {
      if (property.inverseOf) {
        inferredEdges.push(
          ...this.inferInverse(edges, property.id, property.inverseOf)
        );
      }
    });

    // 4. 属性链推理（例如：祖先关系）
    // hasParent ∘ hasParent → hasGrandparent
    inferredEdges.push(
      ...this.inferPropertyChains(edges, schema.propertyChains)
    );

    return inferredEdges;
  }

  inferTransitive(edges, propertyId) {
    const result = [];
    const propertyEdges = edges.filter(e => e.type === propertyId);

    for (const e1 of propertyEdges) {
      for (const e2 of propertyEdges) {
        if (e1.target === e2.source) {
          result.push({
            id: `inferred-${e1.id}-${e2.id}`,
            source: e1.source,
            target: e2.target,
            type: propertyId,
            data: { inferred: true, from: [e1.id, e2.id] }
          });
        }
      }
    }

    return result;
  }
}
```

### 5.2 对象属性可视化

```javascript
// 可视化对象属性的分布
const PropertyDistribution = ({ schema, edges }) => {
  const data = Object.keys(schema.relationTypes).map(propId => ({
    name: schema.relationTypes[propId].label,
    count: edges.filter(e => e.type === propId).length
  }));

  return (
    <div>
      <h3>对象属性分布</h3>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="count" fill="#1890ff" />
      </BarChart>
    </div>
  );
};

// 对象属性关系矩阵
const PropertyMatrix = ({ entityTypes, relationTypes, edges }) => {
  // 计算每对实体类型之间的关系数量
  const matrix = {};
  
  entityTypes.forEach(from => {
    matrix[from] = {};
    entityTypes.forEach(to => {
      matrix[from][to] = edges.filter(e => {
        const source = nodes.find(n => n.id === e.source);
        const target = nodes.find(n => n.id === e.target);
        return source?.type === from && target?.type === to;
      }).length;
    });
  });

  return (
    <table>
      <thead>
        <tr>
          <th></th>
          {entityTypes.map(type => <th key={type}>{type}</th>)}
        </tr>
      </thead>
      <tbody>
        {entityTypes.map(from => (
          <tr key={from}>
            <td>{from}</td>
            {entityTypes.map(to => (
              <td key={to} style={{
                backgroundColor: matrix[from][to] > 0 ? '#1890ff' : '#f0f0f0'
              }}>
                {matrix[from][to] || '-'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### 5.3 对象属性约束检查

```javascript
class PropertyConstraintChecker {
  /**
   * 检查所有对象属性约束
   */
  checkAll(nodes, edges, schema) {
    const violations = [];

    // 1. 检查domain约束
    edges.forEach(edge => {
      const property = schema.relationTypes[edge.type];
      const sourceNode = nodes.find(n => n.id === edge.source);
      
      if (!property.domain.includes(sourceNode.type)) {
        violations.push({
          type: 'domain_violation',
          edge: edge.id,
          message: `源节点类型 ${sourceNode.type} 不在域 ${property.domain} 中`
        });
      }
    });

    // 2. 检查range约束
    edges.forEach(edge => {
      const property = schema.relationTypes[edge.type];
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!property.range.includes(targetNode.type)) {
        violations.push({
          type: 'range_violation',
          edge: edge.id,
          message: `目标节点类型 ${targetNode.type} 不在值域 ${property.range} 中`
        });
      }
    });

    // 3. 检查基数约束
    Object.values(schema.relationTypes).forEach(property => {
      if (property.cardinality) {
        nodes.forEach(node => {
          const outEdges = edges.filter(e => 
            e.source === node.id && e.type === property.id
          );

          if (property.cardinality.min && outEdges.length < property.cardinality.min) {
            violations.push({
              type: 'cardinality_min_violation',
              node: node.id,
              message: `节点 ${node.id} 缺少必需的 ${property.label} 关系`
            });
          }

          if (property.cardinality.max && outEdges.length > property.cardinality.max) {
            violations.push({
              type: 'cardinality_max_violation',
              node: node.id,
              message: `节点 ${node.id} 的 ${property.label} 关系超过最大数量`
            });
          }
        });
      }
    });

    return violations;
  }
}
```

---

## 六、实施步骤

### 阶段1: Schema增强（1-2天）

- [ ] 扩展relationTypes定义，添加OWL特征
- [ ] 添加对象属性分类
- [ ] 更新core-domain-schema.json

### 阶段2: 后端API（2-3天）

- [ ] 实现ObjectPropertyService
- [ ] 添加对象属性查询API
- [ ] 实现约束验证
- [ ] 添加推理引擎基础

### 阶段3: 前端界面（3-4天）

- [ ] 创建对象属性浏览器组件
- [ ] 创建对象属性详情面板
- [ ] 增强图谱边的显示
- [ ] 添加对象属性编辑器

### 阶段4: 高级功能（3-5天）

- [ ] 实现推理功能
- [ ] 添加约束检查
- [ ] 实现对象属性可视化
- [ ] 添加SPARQL风格查询

### 阶段5: 测试和文档（2-3天）

- [ ] 单元测试
- [ ] 集成测试
- [ ] 编写用户文档
- [ ] 性能优化

**总计**: 约11-17天

---

## 七、数据示例

### 7.1 增强的Schema示例

```json
{
  "relationTypes": {
    "splits_to_fr": {
      "label": "拆分为特性需求",
      "description": "Epic跨领域拆分为FR",
      "domain": ["Epic"],
      "range": ["FeatureRequirement"],
      "characteristics": {
        "functional": false,
        "inverseFunctional": false,
        "transitive": false,
        "symmetric": false,
        "asymmetric": true,
        "reflexive": false
      },
      "inverseOf": "fr_from_epic",
      "cardinality": {
        "min": 1,
        "max": null
      },
      "category": "decomposition",
      "visualization": {
        "color": "#52c41a",
        "width": 2,
        "style": "solid",
        "arrow": "triangle"
      }
    },
    "fr_from_epic": {
      "label": "来自Epic",
      "description": "FR来自Epic的拆分",
      "domain": ["FeatureRequirement"],
      "range": ["Epic"],
      "inverseOf": "splits_to_fr",
      "characteristics": {
        "functional": true,
        "asymmetric": true
      },
      "cardinality": {
        "min": 1,
        "max": 1
      }
    }
  }
}
```

### 7.2 带推理的边数据

```json
{
  "edges": [
    {
      "id": "e1",
      "source": "epic-001",
      "target": "fr-001",
      "type": "splits_to_fr",
      "data": {
        "createdAt": "2026-01-16",
        "createdBy": "user1"
      }
    },
    {
      "id": "e1-inverse",
      "source": "fr-001",
      "target": "epic-001",
      "type": "fr_from_epic",
      "data": {
        "inferred": true,
        "inferredFrom": "e1",
        "inferenceRule": "inverse"
      }
    }
  ]
}
```

---

## 八、总结

### 核心价值

1. **语义完整性**: 完整的OWL对象属性特征，支持本体推理
2. **约束验证**: 自动验证domain、range、基数等约束
3. **可视化**: 直观展示对象属性的分布和特征
4. **推理能力**: 支持传递性、对称性、逆属性等推理
5. **易用性**: 图形化界面管理对象属性

### 参考资源

- [OWL Web Ontology Language](https://www.w3.org/TR/owl-features/)
- [RDFS: RDF Schema](https://www.w3.org/TR/rdf-schema/)
- [Protégé Ontology Editor](https://protege.stanford.edu/)

---

**设计日期**: 2026-01-16  
**设计者**: AI Assistant  
**状态**: 设计完成，待实施
