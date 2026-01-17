# 本体图谱系统 - 功能设计规格说明书

## 文档说明
本文档详细描述核心功能的技术设计方案，包括架构设计、接口定义、数据结构、交互流程等。

---

## 目录
1. [Schema可视化编辑器](#1-schema可视化编辑器)
2. [数据一致性检查](#2-数据一致性检查)
3. [SPARQL查询引擎](#3-sparql查询引擎)
4. [推理引擎](#4-推理引擎)
5. [版本控制系统](#5-版本控制系统)
6. [权限管理系统](#6-权限管理系统)

---

## 1. Schema可视化编辑器

### 1.1 功能概述
提供图形化界面让用户设计本体Schema，包括实体类型、关系类型、属性和约束的定义。

### 1.2 架构设计

```
┌─────────────────────────────────────────────┐
│          SchemaEditor (主组件)               │
│  ┌─────────────┐  ┌──────────────────┐     │
│  │  Toolbar    │  │  Canvas          │     │
│  │  工具栏     │  │  画布（拖拽区域） │     │
│  └─────────────┘  └──────────────────┘     │
│  ┌──────────────────────────────────────┐  │
│  │  PropertyPanel (属性面板)            │  │
│  │  - EntityTypeEditor                  │  │
│  │  - RelationTypeEditor                │  │
│  │  - PropertyEditor                    │  │
│  │  - ConstraintEditor                  │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 1.3 数据结构

#### Schema数据模型
```json
{
  "entityTypes": {
    "EntityTypeId": {
      "id": "EntityTypeId",
      "label": "实体类型名称",
      "description": "描述",
      "icon": "icon-name",
      "color": "#1890ff",
      "parentType": "父类型ID（可选）",
      "isAbstract": false,
      "properties": {
        "propertyName": {
          "type": "String|Integer|Float|Boolean|Date|Enum|Text",
          "label": "属性标签",
          "description": "属性描述",
          "required": true,
          "unique": false,
          "defaultValue": null,
          "constraints": {
            "min": null,
            "max": null,
            "pattern": null,
            "enum": []
          }
        }
      },
      "position": { "x": 100, "y": 200 }
    }
  },
  "relationTypes": {
    "RelationTypeId": {
      "id": "RelationTypeId",
      "label": "关系类型名称",
      "description": "描述",
      "from": ["EntityType1", "EntityType2"],
      "to": ["EntityType3"],
      "bidirectional": false,
      "inverseOf": "逆关系ID（可选）",
      "characteristics": {
        "symmetric": false,
        "transitive": false,
        "reflexive": false,
        "functional": false,
        "inverseFunctional": false
      },
      "cardinality": {
        "min": 0,
        "max": null
      },
      "properties": {
        "propertyName": {
          "type": "...",
          "label": "...",
          "..."
        }
      }
    }
  }
}
```

### 1.4 核心组件设计

#### 1.4.1 SchemaEditor.js
```javascript
import React, { useState, useEffect } from 'react';
import { Layout, message } from 'antd';
import SchemaCanvas from './SchemaCanvas';
import SchemaToolbar from './SchemaToolbar';
import PropertyPanel from './PropertyPanel';
import { loadSchema, saveSchema } from '../../services/api';

const SchemaEditor = () => {
  const [schema, setSchema] = useState({ entityTypes: {}, relationTypes: {} });
  const [selectedItem, setSelectedItem] = useState(null);
  const [mode, setMode] = useState('select'); // select, addEntity, addRelation

  useEffect(() => {
    loadSchemaData();
  }, []);

  const loadSchemaData = async () => {
    try {
      const data = await loadSchema();
      setSchema(data);
    } catch (error) {
      message.error('加载Schema失败');
    }
  };

  const handleSave = async () => {
    try {
      await saveSchema(schema);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleAddEntityType = (position) => {
    const newId = `entity_${Date.now()}`;
    const newEntity = {
      id: newId,
      label: '新实体类型',
      description: '',
      properties: {},
      position
    };
    setSchema({
      ...schema,
      entityTypes: {
        ...schema.entityTypes,
        [newId]: newEntity
      }
    });
  };

  const handleUpdateEntityType = (id, updates) => {
    setSchema({
      ...schema,
      entityTypes: {
        ...schema.entityTypes,
        [id]: {
          ...schema.entityTypes[id],
          ...updates
        }
      }
    });
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <SchemaToolbar
        mode={mode}
        onModeChange={setMode}
        onSave={handleSave}
      />
      <Layout>
        <SchemaCanvas
          schema={schema}
          selectedItem={selectedItem}
          mode={mode}
          onSelectItem={setSelectedItem}
          onAddEntityType={handleAddEntityType}
          onMoveEntity={(id, position) => 
            handleUpdateEntityType(id, { position })
          }
        />
        {selectedItem && (
          <PropertyPanel
            item={selectedItem}
            schema={schema}
            onUpdate={(updates) => {
              if (selectedItem.type === 'entity') {
                handleUpdateEntityType(selectedItem.id, updates);
              } else {
                // handle relation update
              }
            }}
          />
        )}
      </Layout>
    </Layout>
  );
};

export default SchemaEditor;
```

#### 1.4.2 SchemaCanvas.js
```javascript
import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Arrow } from 'react-konva';
import EntityTypeNode from './EntityTypeNode';
import RelationArrow from './RelationArrow';

const SchemaCanvas = ({
  schema,
  selectedItem,
  mode,
  onSelectItem,
  onAddEntityType,
  onMoveEntity
}) => {
  const stageRef = useRef(null);

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      if (mode === 'addEntity') {
        const position = e.target.getRelativePointerPosition();
        onAddEntityType(position);
      } else {
        onSelectItem(null);
      }
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth - 300}
      height={window.innerHeight - 64}
      onClick={handleCanvasClick}
      draggable={mode === 'select'}
    >
      <Layer>
        {/* 渲染实体类型节点 */}
        {Object.values(schema.entityTypes).map(entity => (
          <EntityTypeNode
            key={entity.id}
            entity={entity}
            isSelected={selectedItem?.id === entity.id}
            onSelect={() => onSelectItem({ type: 'entity', ...entity })}
            onDragEnd={(e) => {
              onMoveEntity(entity.id, {
                x: e.target.x(),
                y: e.target.y()
              });
            }}
          />
        ))}

        {/* 渲染关系箭头 */}
        {Object.values(schema.relationTypes).map(relation => (
          <RelationArrow
            key={relation.id}
            relation={relation}
            entityTypes={schema.entityTypes}
            isSelected={selectedItem?.id === relation.id}
            onSelect={() => onSelectItem({ type: 'relation', ...relation })}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default SchemaCanvas;
```

#### 1.4.3 EntityTypeEditor.js
```javascript
import React from 'react';
import { Form, Input, Select, ColorPicker, Switch } from 'antd';

const EntityTypeEditor = ({ entityType, onUpdate }) => {
  const [form] = Form.useForm();

  const handleValuesChange = (changedValues, allValues) => {
    onUpdate(allValues);
  };

  return (
    <Form
      form={form}
      initialValues={entityType}
      onValuesChange={handleValuesChange}
      layout="vertical"
    >
      <Form.Item label="类型名称" name="label" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="描述" name="description">
        <Input.TextArea rows={3} />
      </Form.Item>

      <Form.Item label="父类型" name="parentType">
        <Select allowClear>
          {/* 列出所有可选的父类型 */}
        </Select>
      </Form.Item>

      <Form.Item label="抽象类" name="isAbstract" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item label="图标" name="icon">
        <Select>
          <Select.Option value="user">用户</Select.Option>
          <Select.Option value="file">文件</Select.Option>
          <Select.Option value="project">项目</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label="颜色" name="color">
        <ColorPicker />
      </Form.Item>
    </Form>
  );
};

export default EntityTypeEditor;
```

### 1.5 API接口

#### 1.5.1 Schema管理接口
```javascript
// GET /schema - 获取当前Schema
{
  success: true,
  data: { entityTypes: {...}, relationTypes: {...} }
}

// PUT /schema - 更新Schema
Request: { entityTypes: {...}, relationTypes: {...} }
Response: { success: true, message: "Schema更新成功" }

// POST /schema/entity-types - 创建实体类型
Request: { label: "...", description: "...", ... }
Response: { success: true, data: { id: "...", ... } }

// PUT /schema/entity-types/:id - 更新实体类型
Request: { label: "...", properties: {...}, ... }
Response: { success: true, data: { id: "...", ... } }

// DELETE /schema/entity-types/:id - 删除实体类型
Response: { success: true, message: "删除成功" }

// POST /schema/relation-types - 创建关系类型
// PUT /schema/relation-types/:id - 更新关系类型
// DELETE /schema/relation-types/:id - 删除关系类型
```

### 1.6 交互流程

#### 创建实体类型流程
```
1. 用户点击工具栏"添加实体"按钮
2. 鼠标变为"+"光标，模式切换为 addEntity
3. 用户在画布点击位置
4. 在该位置创建新实体类型节点
5. 自动选中该节点，右侧显示属性面板
6. 用户编辑实体名称、属性等
7. 实时保存到state
8. 用户点击"保存"按钮，持久化到后端
```

#### 定义属性流程
```
1. 选中实体类型节点
2. 属性面板显示"属性列表"
3. 点击"添加属性"按钮
4. 弹出属性编辑对话框
5. 输入：属性名、类型、约束
6. 确认后添加到属性列表
7. 可以拖拽排序、编辑、删除属性
```

### 1.7 验证规则

- **实体类型名称**: 必填，唯一，1-50字符
- **属性名称**: 必填，类型内唯一，符合标识符规范
- **继承关系**: 不能形成循环
- **关系域和值域**: 必须是已定义的实体类型
- **基数约束**: min <= max，min >= 0

---

## 2. 数据一致性检查

### 2.1 功能概述
验证图谱数据是否符合Schema定义，检测数据质量问题。

### 2.2 检查项列表

#### 2.2.1 Schema符合性检查
| 检查项 | 描述 | 错误级别 |
|--------|------|----------|
| 未定义类型 | 节点类型不在Schema中 | ERROR |
| 未定义属性 | 节点属性不在类型定义中 | WARNING |
| 未定义关系 | 边类型不在Schema中 | ERROR |
| 类型不匹配 | 属性值类型与定义不符 | ERROR |
| 必填项缺失 | 必填属性为空 | ERROR |
| 唯一性冲突 | 唯一属性值重复 | ERROR |
| 值域超限 | 数值超出min/max范围 | ERROR |
| 枚举值无效 | 枚举属性值不在允许列表中 | ERROR |

#### 2.2.2 引用完整性检查
| 检查项 | 描述 | 错误级别 |
|--------|------|----------|
| 悬空边 | 边的source或target节点不存在 | ERROR |
| 孤立节点 | 节点没有任何连接 | WARNING |
| 域值域不匹配 | 边的source/target类型不符合domain/range | ERROR |
| 基数约束违反 | 关系数量超出基数约束 | ERROR |

#### 2.2.3 逻辑一致性检查
| 检查项 | 描述 | 错误级别 |
|--------|------|----------|
| 循环继承 | 类继承形成环 | ERROR |
| 对称性违反 | 对称关系缺少反向边 | WARNING |
| 传递性不完整 | 传递关系未闭包 | WARNING |

### 2.3 数据结构

#### 验证报告
```json
{
  "timestamp": "2026-01-16T10:00:00Z",
  "summary": {
    "totalNodes": 1000,
    "totalEdges": 1500,
    "errors": 5,
    "warnings": 12,
    "passed": 2483
  },
  "issues": [
    {
      "id": "issue_001",
      "level": "ERROR",
      "category": "SCHEMA_CONFORMANCE",
      "type": "UNDEFINED_TYPE",
      "message": "节点 'node_123' 的类型 'InvalidType' 未在Schema中定义",
      "location": {
        "nodeId": "node_123",
        "edgeId": null
      },
      "suggestion": "请检查类型名称是否正确，或在Schema中添加该类型",
      "canAutoFix": false
    },
    {
      "id": "issue_002",
      "level": "ERROR",
      "category": "REQUIRED_FIELD",
      "type": "MISSING_REQUIRED_PROPERTY",
      "message": "节点 'node_456' 缺少必填属性 'name'",
      "location": {
        "nodeId": "node_456",
        "property": "name"
      },
      "suggestion": "为该节点添加 'name' 属性",
      "canAutoFix": false
    },
    {
      "id": "issue_003",
      "level": "WARNING",
      "category": "REFERENTIAL_INTEGRITY",
      "type": "ORPHAN_NODE",
      "message": "节点 'node_789' 没有任何关系连接",
      "location": {
        "nodeId": "node_789"
      },
      "suggestion": "考虑删除该孤立节点或建立关系",
      "canAutoFix": true,
      "autoFixAction": "DELETE_NODE"
    }
  ],
  "statistics": {
    "byLevel": {
      "ERROR": 5,
      "WARNING": 12
    },
    "byCategory": {
      "SCHEMA_CONFORMANCE": 8,
      "REFERENTIAL_INTEGRITY": 6,
      "LOGIC_CONSISTENCY": 3
    }
  }
}
```

### 2.4 核心服务实现

#### ValidationService.js
```javascript
class ValidationService {
  constructor(graphService, schemaService) {
    this.graphService = graphService;
    this.schemaService = schemaService;
  }

  async validateAll() {
    const issues = [];
    
    // 1. Schema符合性检查
    issues.push(...await this.validateSchemaConformance());
    
    // 2. 引用完整性检查
    issues.push(...await this.validateReferentialIntegrity());
    
    // 3. 逻辑一致性检查
    issues.push(...await this.validateLogicConsistency());
    
    return this.generateReport(issues);
  }

  async validateSchemaConformance() {
    const issues = [];
    const schema = await this.schemaService.getSchema();
    const nodes = await this.graphService.getAllNodes();
    
    for (const node of nodes) {
      // 检查类型是否定义
      if (!schema.entityTypes[node.type]) {
        issues.push({
          level: 'ERROR',
          category: 'SCHEMA_CONFORMANCE',
          type: 'UNDEFINED_TYPE',
          message: `节点 '${node.id}' 的类型 '${node.type}' 未在Schema中定义`,
          location: { nodeId: node.id }
        });
        continue;
      }

      const entityType = schema.entityTypes[node.type];

      // 检查必填属性
      for (const [propName, propDef] of Object.entries(entityType.properties || {})) {
        if (propDef.required && !node.data[propName]) {
          issues.push({
            level: 'ERROR',
            category: 'REQUIRED_FIELD',
            type: 'MISSING_REQUIRED_PROPERTY',
            message: `节点 '${node.id}' 缺少必填属性 '${propName}'`,
            location: { nodeId: node.id, property: propName }
          });
        }

        // 检查类型匹配
        if (node.data[propName]) {
          const isValid = this.validatePropertyType(
            node.data[propName],
            propDef.type
          );
          if (!isValid) {
            issues.push({
              level: 'ERROR',
              category: 'SCHEMA_CONFORMANCE',
              type: 'TYPE_MISMATCH',
              message: `节点 '${node.id}' 的属性 '${propName}' 类型不匹配，期望 ${propDef.type}`,
              location: { nodeId: node.id, property: propName }
            });
          }
        }

        // 检查值域约束
        if (propDef.constraints) {
          const constraintIssue = this.validateConstraints(
            node.id,
            propName,
            node.data[propName],
            propDef.constraints
          );
          if (constraintIssue) {
            issues.push(constraintIssue);
          }
        }
      }

      // 检查未定义的属性（警告）
      for (const propName of Object.keys(node.data || {})) {
        if (!entityType.properties[propName]) {
          issues.push({
            level: 'WARNING',
            category: 'SCHEMA_CONFORMANCE',
            type: 'UNDEFINED_PROPERTY',
            message: `节点 '${node.id}' 的属性 '${propName}' 未在类型定义中`,
            location: { nodeId: node.id, property: propName }
          });
        }
      }
    }

    return issues;
  }

  validatePropertyType(value, expectedType) {
    switch (expectedType) {
      case 'String':
      case 'Text':
        return typeof value === 'string';
      case 'Integer':
        return Number.isInteger(value);
      case 'Float':
        return typeof value === 'number';
      case 'Boolean':
        return typeof value === 'boolean';
      case 'Date':
        return !isNaN(Date.parse(value));
      case 'Enum':
        return typeof value === 'string';
      default:
        return true;
    }
  }

  validateConstraints(nodeId, propName, value, constraints) {
    // 检查 min/max
    if (constraints.min !== undefined && value < constraints.min) {
      return {
        level: 'ERROR',
        category: 'CONSTRAINT_VIOLATION',
        type: 'VALUE_OUT_OF_RANGE',
        message: `节点 '${nodeId}' 的属性 '${propName}' 值 ${value} 小于最小值 ${constraints.min}`,
        location: { nodeId, property: propName }
      };
    }
    // ... 其他约束检查
    return null;
  }

  async validateReferentialIntegrity() {
    const issues = [];
    const nodes = await this.graphService.getAllNodes();
    const edges = await this.graphService.getAllEdges();
    const nodeIds = new Set(nodes.map(n => n.id));

    // 检查悬空边
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        issues.push({
          level: 'ERROR',
          category: 'REFERENTIAL_INTEGRITY',
          type: 'DANGLING_EDGE',
          message: `边 '${edge.id}' 的源节点 '${edge.source}' 不存在`,
          location: { edgeId: edge.id }
        });
      }
      if (!nodeIds.has(edge.target)) {
        issues.push({
          level: 'ERROR',
          category: 'REFERENTIAL_INTEGRITY',
          type: 'DANGLING_EDGE',
          message: `边 '${edge.id}' 的目标节点 '${edge.target}' 不存在`,
          location: { edgeId: edge.id }
        });
      }
    }

    // 检查孤立节点
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    for (const node of nodes) {
      if (!connectedNodes.has(node.id)) {
        issues.push({
          level: 'WARNING',
          category: 'REFERENTIAL_INTEGRITY',
          type: 'ORPHAN_NODE',
          message: `节点 '${node.id}' 没有任何关系连接`,
          location: { nodeId: node.id },
          canAutoFix: true,
          autoFixAction: 'DELETE_NODE'
        });
      }
    }

    return issues;
  }

  generateReport(issues) {
    const summary = {
      errors: issues.filter(i => i.level === 'ERROR').length,
      warnings: issues.filter(i => i.level === 'WARNING').length,
      totalIssues: issues.length
    };

    return {
      timestamp: new Date().toISOString(),
      summary,
      issues,
      statistics: this.calculateStatistics(issues)
    };
  }

  calculateStatistics(issues) {
    const byLevel = {};
    const byCategory = {};
    
    issues.forEach(issue => {
      byLevel[issue.level] = (byLevel[issue.level] || 0) + 1;
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
    });

    return { byLevel, byCategory };
  }
}

module.exports = ValidationService;
```

### 2.5 API接口

```javascript
// POST /graph/validate - 执行完整验证
Response: {
  success: true,
  data: { /* 验证报告 */ }
}

// POST /graph/validate/schema - 只验证Schema符合性
// POST /graph/validate/integrity - 只验证引用完整性
// POST /graph/validate/logic - 只验证逻辑一致性

// GET /graph/validation-report/:id - 获取历史验证报告

// POST /graph/fix-issues - 自动修复问题
Request: {
  issueIds: ["issue_001", "issue_003"]
}
Response: {
  success: true,
  fixed: 2,
  failed: 0
}
```

### 2.6 前端组件

#### ValidationPanel.js
```javascript
import React, { useState } from 'react';
import { Button, Table, Tag, Drawer, Alert, Statistic, Row, Col } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';

const ValidationPanel = ({ onValidate }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const handleValidate = async () => {
    setLoading(true);
    try {
      const result = await onValidate();
      setReport(result);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level) => (
        <Tag color={level === 'ERROR' ? 'red' : 'orange'}>
          {level === 'ERROR' ? <CloseCircleOutlined /> : <WarningOutlined />}
          {level}
        </Tag>
      )
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: '问题描述',
      dataIndex: 'message',
      key: 'message'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => setSelectedIssue(record)}>
            查看详情
          </Button>
          {record.canAutoFix && (
            <Button type="link" onClick={() => handleAutoFix(record.id)}>
              自动修复
            </Button>
          )}
        </>
      )
    }
  ];

  return (
    <div>
      <Button
        type="primary"
        onClick={handleValidate}
        loading={loading}
        icon={<CheckCircleOutlined />}
      >
        执行验证
      </Button>

      {report && (
        <>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Statistic
                title="错误"
                value={report.summary.errors}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="警告"
                value={report.summary.warnings}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="总问题"
                value={report.summary.totalIssues}
              />
            </Col>
          </Row>

          <Table
            dataSource={report.issues}
            columns={columns}
            rowKey="id"
            style={{ marginTop: 16 }}
          />
        </>
      )}

      <Drawer
        title="问题详情"
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
      >
        {selectedIssue && (
          <div>
            <p><strong>级别:</strong> {selectedIssue.level}</p>
            <p><strong>类别:</strong> {selectedIssue.category}</p>
            <p><strong>类型:</strong> {selectedIssue.type}</p>
            <p><strong>描述:</strong> {selectedIssue.message}</p>
            <p><strong>建议:</strong> {selectedIssue.suggestion}</p>
            {selectedIssue.location && (
              <p><strong>位置:</strong> {JSON.stringify(selectedIssue.location)}</p>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ValidationPanel;
```

---

## 3. SPARQL查询引擎

### 3.1 功能概述
提供SPARQL查询接口，支持标准SPARQL 1.1语法，查询知识图谱数据。

### 3.2 技术方案

#### 3.2.1 图数据转RDF三元组
```javascript
// 节点转三元组
Node: { id: "node_001", type: "Epic", data: { name: "功能A", priority: "High" } }

RDF:
<node_001> rdf:type :Epic .
<node_001> :name "功能A" .
<node_001> :priority "High" .

// 边转三元组
Edge: { id: "edge_001", source: "node_001", target: "node_002", type: "splits_to_fr" }

RDF:
<node_001> :splits_to_fr <node_002> .
```

#### 3.2.2 RDF存储（使用N3.js）
```javascript
const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode, literal, quad } = DataFactory;

class RDFStore {
  constructor() {
    this.store = new N3.Store();
    this.prefix = 'http://ontology.example.com/';
  }

  // 加载图数据到RDF存储
  loadGraphData(nodes, edges) {
    this.store = new N3.Store();

    // 添加节点三元组
    nodes.forEach(node => {
      // 类型三元组
      this.store.addQuad(
        namedNode(this.prefix + node.id),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode(this.prefix + node.type)
      );

      // 属性三元组
      Object.entries(node.data || {}).forEach(([key, value]) => {
        this.store.addQuad(
          namedNode(this.prefix + node.id),
          namedNode(this.prefix + key),
          literal(value)
        );
      });
    });

    // 添加边三元组
    edges.forEach(edge => {
      this.store.addQuad(
        namedNode(this.prefix + edge.source),
        namedNode(this.prefix + edge.type),
        namedNode(this.prefix + edge.target)
      );

      // 边属性作为reified statements（可选）
      if (edge.data && Object.keys(edge.data).length > 0) {
        const edgeNode = namedNode(this.prefix + edge.id);
        this.store.addQuad(
          edgeNode,
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Statement')
        );
        this.store.addQuad(
          edgeNode,
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#subject'),
          namedNode(this.prefix + edge.source)
        );
        this.store.addQuad(
          edgeNode,
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#predicate'),
          namedNode(this.prefix + edge.type)
        );
        this.store.addQuad(
          edgeNode,
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#object'),
          namedNode(this.prefix + edge.target)
        );

        Object.entries(edge.data).forEach(([key, value]) => {
          this.store.addQuad(
            edgeNode,
            namedNode(this.prefix + key),
            literal(value)
          );
        });
      }
    });
  }

  // 执行SPARQL查询
  async executeSPARQL(queryString) {
    const parser = new SparqlParser();
    const parsedQuery = parser.parse(queryString);

    // 使用N3 Store的match方法执行查询
    // 注意：N3 Store不直接支持SPARQL，需要自己实现或使用Comunica
    // 这里简化示例
    const results = [];
    const quads = this.store.getQuads(null, null, null, null);
    
    // ... SPARQL查询执行逻辑 ...
    
    return results;
  }
}

module.exports = RDFStore;
```

#### 3.2.3 使用Comunica（完整SPARQL支持）
```javascript
const { QueryEngine } = require('@comunica/query-sparql-rdfjs');
const N3 = require('n3');

class SPARQLService {
  constructor() {
    this.engine = new QueryEngine();
    this.store = new N3.Store();
  }

  async executeSPARQL(queryString) {
    const bindingsStream = await this.engine.queryBindings(queryString, {
      sources: [this.store],
    });

    const bindings = await bindingsStream.toArray();
    
    // 转换为JSON格式
    const results = bindings.map(binding => {
      const row = {};
      binding.forEach((value, key) => {
        row[key.value] = value.value;
      });
      return row;
    });

    return results;
  }
}
```

### 3.3 前端组件

#### SPARQLEditor.js
```javascript
import React, { useState } from 'react';
import { Button, Table, Tabs } from 'antd';
import MonacoEditor from '@monaco-editor/react';
import { executeSPARQL } from '../../services/api';

const SPARQLEditor = () => {
  const [query, setQuery] = useState(`PREFIX : <http://ontology.example.com/>
SELECT ?epic ?name ?priority
WHERE {
  ?epic a :Epic ;
        :name ?name ;
        :priority "High" .
  OPTIONAL { ?epic :priority ?priority }
}`);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const data = await executeSPARQL(query);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const columns = results.length > 0
    ? Object.keys(results[0]).map(key => ({
        title: key,
        dataIndex: key,
        key: key
      }))
    : [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '40%' }}>
        <MonacoEditor
          height="100%"
          language="sparql"
          theme="vs-dark"
          value={query}
          onChange={setQuery}
          options={{
            minimap: { enabled: false },
            fontSize: 14
          }}
        />
      </div>
      
      <Button
        type="primary"
        onClick={handleExecute}
        loading={loading}
        style={{ margin: '10px 0' }}
      >
        执行查询
      </Button>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table
          dataSource={results}
          columns={columns}
          rowKey={(record, index) => index}
          pagination={{ pageSize: 20 }}
        />
      </div>
    </div>
  );
};

export default SPARQLEditor;
```

### 3.4 API接口

```javascript
// POST /sparql/query - 执行SPARQL查询
Request: {
  query: "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10"
}
Response: {
  success: true,
  data: [
    { s: "node_001", p: "name", o: "Epic A" },
    ...
  ],
  executionTime: 45 // ms
}

// GET /sparql/templates - 获取查询模板列表
// POST /sparql/templates - 保存查询模板
// GET /sparql/history - 获取查询历史
```

---

## 4. 推理引擎

### 4.1 功能概述
基于规则和关系特性进行知识推理，自动发现隐含关系。

### 4.2 推理规则定义

#### 4.2.1 规则数据结构
```json
{
  "id": "rule_001",
  "name": "传递依赖推理",
  "description": "如果A依赖B，B依赖C，则推断A依赖C",
  "enabled": true,
  "pattern": {
    "conditions": [
      {
        "variable": "?a",
        "relation": "depends_on",
        "target": "?b"
      },
      {
        "variable": "?b",
        "relation": "depends_on",
        "target": "?c"
      }
    ],
    "constraints": [
      {
        "type": "NOT_EQUAL",
        "variables": ["?a", "?c"]
      }
    ]
  },
  "action": {
    "type": "CREATE_RELATION",
    "source": "?a",
    "relation": "depends_on_transitive",
    "target": "?c",
    "properties": {
      "inferred": true,
      "rule": "rule_001"
    }
  }
}
```

#### 4.2.2 推理服务实现
```javascript
class InferenceService {
  constructor(graphService) {
    this.graphService = graphService;
    this.rules = [];
    this.inferredEdges = [];
  }

  // 加载推理规则
  loadRules(rules) {
    this.rules = rules.filter(r => r.enabled);
  }

  // 执行推理
  async executeInference() {
    this.inferredEdges = [];
    const nodes = await this.graphService.getAllNodes();
    const edges = await this.graphService.getAllEdges();

    // 1. 基于关系特性推理
    this.inferTransitiveRelations(edges);
    this.inferSymmetricRelations(edges);

    // 2. 基于自定义规则推理
    for (const rule of this.rules) {
      this.applyRule(rule, nodes, edges);
    }

    return {
      inferredCount: this.inferredEdges.length,
      inferredEdges: this.inferredEdges
    };
  }

  // 传递性推理
  inferTransitiveRelations(edges) {
    const schema = this.graphService.getSchema();
    
    // 找出所有传递性关系类型
    const transitiveRelations = Object.entries(schema.relationTypes)
      .filter(([_, rel]) => rel.characteristics?.transitive)
      .map(([type, _]) => type);

    for (const relType of transitiveRelations) {
      // 构建关系图
      const graph = this.buildRelationGraph(edges, relType);
      
      // 计算传递闭包
      const closure = this.computeTransitiveClosure(graph);
      
      // 生成推断边
      for (const [source, targets] of Object.entries(closure)) {
        for (const target of targets) {
          // 检查是否已存在
          const exists = edges.some(e => 
            e.source === source && 
            e.target === target && 
            e.type === relType
          );
          
          if (!exists) {
            this.inferredEdges.push({
              id: `inferred_${source}_${relType}_${target}`,
              source,
              target,
              type: relType + '_transitive',
              data: {
                inferred: true,
                inferenceType: 'TRANSITIVE'
              }
            });
          }
        }
      }
    }
  }

  buildRelationGraph(edges, relationType) {
    const graph = {};
    edges
      .filter(e => e.type === relationType)
      .forEach(edge => {
        if (!graph[edge.source]) graph[edge.source] = new Set();
        graph[edge.source].add(edge.target);
      });
    return graph;
  }

  computeTransitiveClosure(graph) {
    const closure = {};
    
    // 初始化
    for (const [node, neighbors] of Object.entries(graph)) {
      closure[node] = new Set(neighbors);
    }

    // Floyd-Warshall算法
    const nodes = Object.keys(graph);
    for (const k of nodes) {
      for (const i of nodes) {
        if (closure[i]?.has(k)) {
          for (const j of nodes) {
            if (closure[k]?.has(j)) {
              if (!closure[i]) closure[i] = new Set();
              closure[i].add(j);
            }
          }
        }
      }
    }

    return closure;
  }

  // 对称性推理
  inferSymmetricRelations(edges) {
    const schema = this.graphService.getSchema();
    
    const symmetricRelations = Object.entries(schema.relationTypes)
      .filter(([_, rel]) => rel.characteristics?.symmetric)
      .map(([type, _]) => type);

    for (const relType of symmetricRelations) {
      edges
        .filter(e => e.type === relType)
        .forEach(edge => {
          // 检查是否存在反向边
          const reverseExists = edges.some(e =>
            e.source === edge.target &&
            e.target === edge.source &&
            e.type === relType
          );

          if (!reverseExists) {
            this.inferredEdges.push({
              id: `inferred_${edge.target}_${relType}_${edge.source}`,
              source: edge.target,
              target: edge.source,
              type: relType,
              data: {
                inferred: true,
                inferenceType: 'SYMMETRIC',
                basedOn: edge.id
              }
            });
          }
        });
    }
  }

  // 应用自定义规则
  applyRule(rule, nodes, edges) {
    // 模式匹配
    const matches = this.findMatches(rule.pattern, nodes, edges);
    
    // 对每个匹配执行动作
    for (const match of matches) {
      const inferredEdge = this.executeAction(rule.action, match);
      if (inferredEdge) {
        this.inferredEdges.push(inferredEdge);
      }
    }
  }

  findMatches(pattern, nodes, edges) {
    // 简化的模式匹配实现
    // 实际应该使用更复杂的图模式匹配算法
    const matches = [];
    
    // TODO: 实现完整的模式匹配逻辑
    
    return matches;
  }

  executeAction(action, bindings) {
    if (action.type === 'CREATE_RELATION') {
      return {
        id: `inferred_${Date.now()}`,
        source: bindings[action.source],
        target: bindings[action.target],
        type: action.relation,
        data: {
          ...action.properties,
          inferred: true
        }
      };
    }
    return null;
  }
}

module.exports = InferenceService;
```

### 4.3 API接口

```javascript
// POST /inference/execute - 执行推理
Response: {
  success: true,
  data: {
    inferredCount: 15,
    executionTime: 234,
    inferredEdges: [...]
  }
}

// GET /inference/rules - 获取所有规则
// POST /inference/rules - 创建新规则
// PUT /inference/rules/:id - 更新规则
// DELETE /inference/rules/:id - 删除规则

// POST /inference/explain/:edgeId - 解释推理路径
Response: {
  success: true,
  data: {
    edge: {...},
    inferenceType: "TRANSITIVE",
    steps: [
      { from: "A", to: "B", relation: "depends_on" },
      { from: "B", to: "C", relation: "depends_on" }
    ],
    conclusion: { from: "A", to: "C", relation: "depends_on_transitive" }
  }
}
```

---

## 5. 版本控制系统

### 5.1 功能概述
记录本体和数据的变更历史，支持版本比较和回滚。

### 5.2 数据结构

#### 版本记录
```json
{
  "id": "version_001",
  "timestamp": "2026-01-16T10:00:00Z",
  "author": "user_001",
  "message": "添加新的实体类型和关系",
  "parentVersion": "version_000",
  "snapshot": {
    "schema": { /* 完整Schema */ },
    "data": {
      "nodes": [ /* 所有节点 */ ],
      "edges": [ /* 所有边 */ ]
    }
  },
  "changes": {
    "schema": {
      "added": ["EntityType1"],
      "modified": ["EntityType2"],
      "deleted": []
    },
    "data": {
      "nodes": {
        "added": ["node_001", "node_002"],
        "modified": ["node_003"],
        "deleted": []
      },
      "edges": {
        "added": ["edge_001"],
        "modified": [],
        "deleted": []
      }
    }
  },
  "statistics": {
    "totalNodes": 1000,
    "totalEdges": 1500,
    "changedNodes": 3,
    "changedEdges": 1
  }
}
```

### 5.3 版本管理服务

```javascript
class VersionService {
  constructor(graphService, schemaService) {
    this.graphService = graphService;
    this.schemaService = schemaService;
    this.versions = [];
    this.currentVersion = null;
  }

  // 创建版本
  async createVersion(message, author) {
    const snapshot = await this.captureSnapshot();
    const changes = this.currentVersion 
      ? await this.computeChanges(this.currentVersion, snapshot)
      : this.computeInitialChanges(snapshot);

    const version = {
      id: `version_${Date.now()}`,
      timestamp: new Date().toISOString(),
      author,
      message,
      parentVersion: this.currentVersion?.id || null,
      snapshot,
      changes,
      statistics: this.computeStatistics(snapshot, changes)
    };

    this.versions.push(version);
    this.currentVersion = version;
    
    await this.saveVersion(version);
    
    return version;
  }

  async captureSnapshot() {
    const schema = await this.schemaService.getSchema();
    const nodes = await this.graphService.getAllNodes();
    const edges = await this.graphService.getAllEdges();

    return {
      schema,
      data: { nodes, edges }
    };
  }

  computeChanges(oldVersion, newSnapshot) {
    const oldSnapshot = oldVersion.snapshot;
    
    return {
      schema: this.compareSchemas(oldSnapshot.schema, newSnapshot.schema),
      data: this.compareData(oldSnapshot.data, newSnapshot.data)
    };
  }

  compareSchemas(oldSchema, newSchema) {
    const added = [];
    const modified = [];
    const deleted = [];

    // 比较实体类型
    const oldTypes = new Set(Object.keys(oldSchema.entityTypes));
    const newTypes = new Set(Object.keys(newSchema.entityTypes));

    // 新增的类型
    newTypes.forEach(type => {
      if (!oldTypes.has(type)) {
        added.push(type);
      } else {
        // 检查是否修改
        if (JSON.stringify(oldSchema.entityTypes[type]) !== 
            JSON.stringify(newSchema.entityTypes[type])) {
          modified.push(type);
        }
      }
    });

    // 删除的类型
    oldTypes.forEach(type => {
      if (!newTypes.has(type)) {
        deleted.push(type);
      }
    });

    return { added, modified, deleted };
  }

  compareData(oldData, newData) {
    return {
      nodes: this.compareArrays(oldData.nodes, newData.nodes),
      edges: this.compareArrays(oldData.edges, newData.edges)
    };
  }

  compareArrays(oldArr, newArr) {
    const oldMap = new Map(oldArr.map(item => [item.id, item]));
    const newMap = new Map(newArr.map(item => [item.id, item]));

    const added = [];
    const modified = [];
    const deleted = [];

    newMap.forEach((item, id) => {
      if (!oldMap.has(id)) {
        added.push(id);
      } else if (JSON.stringify(oldMap.get(id)) !== JSON.stringify(item)) {
        modified.push(id);
      }
    });

    oldMap.forEach((item, id) => {
      if (!newMap.has(id)) {
        deleted.push(id);
      }
    });

    return { added, modified, deleted };
  }

  // 版本比较
  async compareVersions(versionId1, versionId2) {
    const v1 = this.versions.find(v => v.id === versionId1);
    const v2 = this.versions.find(v => v.id === versionId2);

    if (!v1 || !v2) {
      throw new Error('版本不存在');
    }

    const diff = this.computeChanges(v1, v2.snapshot);

    return {
      version1: v1,
      version2: v2,
      diff
    };
  }

  // 回滚到指定版本
  async revertToVersion(versionId) {
    const version = this.versions.find(v => v.id === versionId);
    
    if (!version) {
      throw new Error('版本不存在');
    }

    // 恢复Schema
    await this.schemaService.updateSchema(version.snapshot.schema);
    
    // 恢复数据
    await this.graphService.loadData(version.snapshot.data);

    // 创建一个新版本记录此次回滚
    await this.createVersion(`回滚到版本 ${versionId}`, 'system');

    return version;
  }

  // 获取版本历史
  getVersionHistory() {
    return this.versions.map(v => ({
      id: v.id,
      timestamp: v.timestamp,
      author: v.author,
      message: v.message,
      statistics: v.statistics
    }));
  }
}

module.exports = VersionService;
```

### 5.4 API接口

```javascript
// POST /versions - 创建新版本
Request: { message: "添加新功能", author: "user_001" }
Response: { success: true, data: { id: "version_001", ... } }

// GET /versions - 获取版本列表
Response: {
  success: true,
  data: [
    { id: "version_001", timestamp: "...", message: "...", ... },
    ...
  ]
}

// GET /versions/:id - 获取版本详情
Response: { success: true, data: { /* 完整版本信息 */ } }

// POST /versions/compare - 比较两个版本
Request: { version1: "version_001", version2: "version_002" }
Response: { success: true, data: { diff: {...} } }

// POST /versions/:id/revert - 回滚到指定版本
Response: { success: true, message: "已回滚到版本 version_001" }
```

---

## 6. 权限管理系统

### 6.1 功能概述
用户认证、角色授权、细粒度权限控制。

### 6.2 数据模型

#### 用户表
```javascript
{
  id: "user_001",
  username: "zhangsan",
  email: "zhangsan@example.com",
  passwordHash: "...",
  avatar: "https://...",
  createdAt: "2026-01-16T10:00:00Z",
  lastLoginAt: "2026-01-16T15:00:00Z",
  status: "active" // active, inactive, suspended
}
```

#### 角色表
```javascript
{
  id: "role_001",
  name: "editor",
  label: "编辑者",
  description: "可以查看和编辑数据",
  permissions: [
    "schema:read",
    "schema:write",
    "data:read",
    "data:write",
    "export:execute"
  ],
  isSystem: true // 系统预定义角色不可删除
}
```

#### 用户-角色关联表
```javascript
{
  userId: "user_001",
  roleId: "role_001",
  projectId: "project_001", // 可选，项目级别角色
  grantedAt: "2026-01-16T10:00:00Z",
  grantedBy: "user_000"
}
```

#### 权限定义
```javascript
const PERMISSIONS = {
  // Schema权限
  'schema:read': '查看Schema',
  'schema:write': '编辑Schema',
  'schema:delete': '删除Schema',
  
  // 数据权限
  'data:read': '查看数据',
  'data:write': '编辑数据',
  'data:delete': '删除数据',
  'data:import': '导入数据',
  'data:export': '导出数据',
  
  // 查询权限
  'query:execute': '执行查询',
  'query:save': '保存查询',
  
  // 推理权限
  'inference:execute': '执行推理',
  'inference:manage_rules': '管理推理规则',
  
  // 版本权限
  'version:create': '创建版本',
  'version:revert': '回滚版本',
  
  // 用户管理权限
  'user:read': '查看用户',
  'user:write': '管理用户',
  'user:assign_roles': '分配角色',
  
  // 系统权限
  'system:admin': '系统管理'
};
```

### 6.3 认证中间件

```javascript
const jwt = require('jsonwebtoken');

// JWT认证中间件
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '未提供认证令牌' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: '无效的认证令牌' }
    });
  }
};

// 权限检查中间件
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '请先登录' }
      });
    }

    // 获取用户的所有权限
    const userPermissions = await getUserPermissions(user.id);
    
    // 检查是否拥有所需权限
    const hasPermission = requiredPermissions.every(perm => 
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: '权限不足',
          required: requiredPermissions
        }
      });
    }

    next();
  };
};

// 使用示例
router.get('/schema', authenticate, authorize('schema:read'), (req, res) => {
  // 处理请求
});

router.put('/schema', authenticate, authorize('schema:write'), (req, res) => {
  // 处理请求
});
```

### 6.4 认证服务

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
  // 注册
  async register(username, email, password) {
    // 检查用户是否已存在
    const exists = await this.userExists(email);
    if (exists) {
      throw new Error('用户已存在');
    }

    // 密码哈希
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const user = {
      id: `user_${Date.now()}`,
      username,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    await this.saveUser(user);

    // 分配默认角色（Viewer）
    await this.assignRole(user.id, 'role_viewer');

    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  }

  // 登录
  async login(email, password) {
    const user = await this.findUserByEmail(email);
    
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      throw new Error('密码错误');
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 更新最后登录时间
    await this.updateLastLogin(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  // 获取用户权限
  async getUserPermissions(userId) {
    const roles = await this.getUserRoles(userId);
    const permissions = new Set();

    for (const role of roles) {
      role.permissions.forEach(perm => permissions.add(perm));
    }

    return Array.from(permissions);
  }

  // 分配角色
  async assignRole(userId, roleId, projectId = null) {
    const assignment = {
      userId,
      roleId,
      projectId,
      grantedAt: new Date().toISOString(),
      grantedBy: 'system'
    };

    await this.saveRoleAssignment(assignment);
  }
}

module.exports = AuthService;
```

### 6.5 API接口

```javascript
// POST /auth/register - 用户注册
Request: { username: "...", email: "...", password: "..." }
Response: { success: true, data: { id: "...", username: "...", email: "..." } }

// POST /auth/login - 用户登录
Request: { email: "...", password: "..." }
Response: { success: true, data: { token: "...", user: {...} } }

// POST /auth/logout - 用户登出
Response: { success: true }

// GET /auth/me - 获取当前用户信息
Response: { success: true, data: { id: "...", username: "...", roles: [...] } }

// GET /users - 获取用户列表（需要user:read权限）
// POST /users - 创建用户（需要user:write权限）
// PUT /users/:id - 更新用户
// DELETE /users/:id - 删除用户

// GET /roles - 获取角色列表
// POST /roles - 创建角色
// PUT /roles/:id - 更新角色
// DELETE /roles/:id - 删除角色

// POST /users/:id/roles - 为用户分配角色
Request: { roleId: "role_001", projectId: "project_001" }
Response: { success: true }

// DELETE /users/:id/roles/:roleId - 移除用户角色
```

---

## 7. 总结

本文档详细描述了6个核心功能模块的设计方案：

1. **Schema可视化编辑器**: 拖拽式本体设计，降低建模门槛
2. **数据一致性检查**: 多层次验证，保证数据质量
3. **SPARQL查询引擎**: 标准查询语言，强大的分析能力
4. **推理引擎**: 自动知识推理，发现隐含关系
5. **版本控制系统**: Git式版本管理，支持演化和回滚
6. **权限管理系统**: 细粒度权限控制，保障数据安全

每个模块都包含：
- 功能概述
- 架构设计
- 数据结构定义
- 核心代码实现
- API接口规范
- 交互流程说明

**下一步**: 根据优先级依次实施各功能模块。

---

**文档版本**: v1.0  
**创建日期**: 2026-01-16  
**维护者**: 开发团队
