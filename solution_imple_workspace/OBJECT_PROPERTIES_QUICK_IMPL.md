# 对象属性快速实施指南

> **目标**: 快速为现有系统添加对象属性管理功能  
> **时间**: 1-2天即可完成MVP版本

---

## 一、最小可行方案（MVP）

### 第一步：增强Schema（30分钟）

修改 `data/core-domain-schema.json`，为现有的relationTypes添加更多特征：

```json
{
  "relationTypes": {
    "splits_to_fr": {
      "label": "拆分为特性需求",
      "description": "Epic跨领域拆分为FR",
      
      // ✅ 新增：域和值域约束
      "domain": ["Epic"],
      "range": ["FeatureRequirement"],
      
      // ✅ 新增：对象属性特征
      "characteristics": {
        "transitive": false,
        "symmetric": false,
        "asymmetric": true
      },
      
      // ✅ 新增：基数约束
      "cardinality": {
        "min": 1,
        "max": null
      },
      
      // ✅ 新增：可视化配置
      "visualization": {
        "color": "#52c41a",
        "width": 2
      }
    }
  }
}
```

### 第二步：添加对象属性统计API（30分钟）

创建 `backend/src/routes/properties.js`:

```javascript
const express = require('express');
const router = express.Router();
const { getInstance: getGraphService } = require('../services/GraphService');

const graphService = getGraphService();

/**
 * GET /api/v1/properties
 * 获取所有对象属性列表
 */
router.get('/', (req, res) => {
  try {
    const schema = graphService.getSchema();
    const edges = graphService.getEdges();
    
    const properties = Object.entries(schema.relationTypes || {}).map(([id, prop]) => {
      const instances = edges.filter(e => e.type === id);
      
      return {
        id: id,
        label: prop.label,
        description: prop.description,
        domain: prop.domain || prop.from,
        range: prop.range || prop.to,
        instanceCount: instances.length,
        visualization: prop.visualization
      };
    });
    
    res.json({
      success: true,
      data: {
        total: properties.length,
        properties: properties
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * GET /api/v1/properties/:propertyId
 * 获取对象属性详情
 */
router.get('/:propertyId', (req, res) => {
  try {
    const schema = graphService.getSchema();
    const edges = graphService.getEdges();
    const nodes = graphService.getNodes();
    const { propertyId } = req.params;
    
    const property = schema.relationTypes?.[propertyId];
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { message: '对象属性不存在' }
      });
    }
    
    const instances = edges.filter(e => e.type === propertyId);
    
    // 统计domain和range分布
    const domainStats = {};
    const rangeStats = {};
    
    instances.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode) {
        domainStats[sourceNode.type] = (domainStats[sourceNode.type] || 0) + 1;
      }
      if (targetNode) {
        rangeStats[targetNode.type] = (rangeStats[targetNode.type] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      data: {
        property: {
          id: propertyId,
          ...property
        },
        statistics: {
          totalInstances: instances.length,
          domainDistribution: domainStats,
          rangeDistribution: rangeStats
        },
        instances: instances.slice(0, 10) // 只返回前10个实例
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * GET /api/v1/properties/:propertyId/instances
 * 获取对象属性的所有实例
 */
router.get('/:propertyId/instances', (req, res) => {
  try {
    const edges = graphService.getEdges();
    const nodes = graphService.getNodes();
    const { propertyId } = req.params;
    
    const instances = edges.filter(e => e.type === propertyId).map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      return {
        id: edge.id,
        source: {
          id: edge.source,
          type: sourceNode?.type,
          label: sourceNode?.data?.title || sourceNode?.data?.name || edge.source
        },
        target: {
          id: edge.target,
          type: targetNode?.type,
          label: targetNode?.data?.title || targetNode?.data?.name || edge.target
        },
        data: edge.data
      };
    });
    
    res.json({
      success: true,
      data: {
        total: instances.length,
        instances: instances
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

module.exports = router;
```

注册路由到 `backend/src/server.js`:

```javascript
const propertiesRouter = require('./routes/properties');
app.use('/api/v1/properties', propertiesRouter);
```

### 第三步：创建对象属性浏览器组件（1-2小时）

创建 `frontend/src/components/PropertyBrowser.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { List, Card, Statistic, Row, Col, Tag, Spin, message } from 'antd';
import { ApartmentOutlined, NodeIndexOutlined } from '@ant-design/icons';
import axios from 'axios';
import './PropertyBrowser.css';

const PropertyBrowser = ({ onPropertySelect }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/properties');
      setProperties(response.data.data.properties);
    } catch (error) {
      message.error('加载对象属性失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = async (property) => {
    try {
      const response = await axios.get(`/api/v1/properties/${property.id}`);
      setSelectedProperty(response.data.data);
      onPropertySelect && onPropertySelect(response.data.data);
    } catch (error) {
      message.error('加载属性详情失败: ' + error.message);
    }
  };

  const getCategoryColor = (domain) => {
    const colors = {
      'Epic': '#faad14',
      'FeatureRequirement': '#52c41a',
      'SSTS': '#1890ff',
      'Task': '#722ed1'
    };
    return colors[domain[0]] || '#d9d9d9';
  };

  if (loading) {
    return <Spin tip="加载中..." />;
  }

  return (
    <div className="property-browser">
      <Card title={<><ApartmentOutlined /> 对象属性</>} bordered={false}>
        <List
          dataSource={properties}
          renderItem={property => (
            <List.Item
              onClick={() => handlePropertyClick(property)}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: property.visualization?.color || '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <NodeIndexOutlined />
                  </div>
                }
                title={
                  <div>
                    {property.label}
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {property.instanceCount}个实例
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div>{property.description}</div>
                    <div style={{ marginTop: 4 }}>
                      {property.domain?.map(d => (
                        <Tag key={d} color={getCategoryColor([d])}>
                          {d}
                        </Tag>
                      ))}
                      <span> → </span>
                      {property.range?.map(r => (
                        <Tag key={r} color={getCategoryColor([r])}>
                          {r}
                        </Tag>
                      ))}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {selectedProperty && (
        <Card 
          title="对象属性详情" 
          style={{ marginTop: 16 }}
          bordered={false}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Statistic 
                title="实例数量" 
                value={selectedProperty.statistics.totalInstances} 
                prefix={<NodeIndexOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="域类型" 
                value={Object.keys(selectedProperty.statistics.domainDistribution).length} 
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="值域类型" 
                value={Object.keys(selectedProperty.statistics.rangeDistribution).length} 
              />
            </Col>
          </Row>

          <div style={{ marginTop: 24 }}>
            <h4>实例示例（前10个）</h4>
            <List
              size="small"
              dataSource={selectedProperty.instances}
              renderItem={instance => (
                <List.Item>
                  {instance.source} → {instance.target}
                </List.Item>
              )}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default PropertyBrowser;
```

### 第四步：集成到主界面（15分钟）

修改 `frontend/src/App.js`，添加对象属性标签页：

```javascript
import PropertyBrowser from './components/PropertyBrowser';

// 在Tabs中添加新标签
<Tabs defaultActiveKey="graph">
  <TabPane tab="图谱视图" key="graph">
    <GraphView ... />
  </TabPane>
  
  <TabPane tab="表格视图" key="table">
    <TableView ... />
  </TabPane>
  
  {/* ✅ 新增：对象属性标签 */}
  <TabPane tab="对象属性" key="properties">
    <PropertyBrowser 
      onPropertySelect={(property) => {
        console.log('Selected property:', property);
      }}
    />
  </TabPane>
</Tabs>
```

---

## 二、增强图谱边的显示（1小时）

修改 `frontend/src/components/GraphView.js`，增强边的可视化：

```javascript
const getGraphStyle = (schema) => {
  // 为每种关系类型生成样式
  const edgeStyles = [];
  
  if (schema?.relationTypes) {
    Object.entries(schema.relationTypes).forEach(([type, config]) => {
      edgeStyles.push({
        selector: `edge[type="${type}"]`,
        style: {
          'line-color': config.visualization?.color || '#d9d9d9',
          'width': config.visualization?.width || 2,
          'line-style': config.visualization?.style || 'solid',
          'target-arrow-color': config.visualization?.color || '#d9d9d9',
          'target-arrow-shape': config.visualization?.arrow || 'triangle'
        }
      });
    });
  }

  return [
    // ... 原有的节点样式 ...
    
    // 默认边样式
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#d9d9d9',
        'target-arrow-color': '#d9d9d9',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '9px',
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
        'color': '#8c8c8c'
      }
    },
    
    // ✅ 新增：每种关系类型的特定样式
    ...edgeStyles,
    
    // 高亮边样式
    {
      selector: 'edge.highlighted',
      style: {
        'width': 3,
        'line-color': '#1890ff',
        'target-arrow-color': '#1890ff',
        'z-index': 999
      }
    }
  ];
};
```

---

## 三、测试（30分钟）

### 测试数据准备

确保 `core-domain-schema.json` 中已更新relationTypes。

### 测试步骤

1. **启动服务**
```bash
# 后端
cd backend
npm start

# 前端
cd frontend
npm start
```

2. **测试API**
```bash
# 获取所有对象属性
curl http://localhost:3001/api/v1/properties

# 获取特定对象属性详情
curl http://localhost:3001/api/v1/properties/splits_to_fr

# 获取对象属性实例
curl http://localhost:3001/api/v1/properties/splits_to_fr/instances
```

3. **测试前端**
- 打开 http://localhost:3000
- 点击"对象属性"标签
- 查看对象属性列表
- 点击某个对象属性查看详情

---

## 四、快速演示

### 效果展示

```
┌─────────────────────────────────────────┐
│ [图谱视图] [表格视图] [对象属性✓]      │
├─────────────────────────────────────────┤
│                                          │
│  对象属性                                │
│  ─────────────────────                  │
│                                          │
│  ● splits_to_fr         [6个实例]       │
│    拆分为特性需求                        │
│    Epic → FeatureRequirement            │
│                                          │
│  ● belongs_to_domain    [4个实例]       │
│    归属领域项目                          │
│    FeatureRequirement → DomainProject   │
│                                          │
│  ● has_pi_planning      [3个实例]       │
│    包含PI规划                            │
│    DomainProject → PIPlanning           │
│                                          │
│  ──────────────────────────────────────│
│                                          │
│  对象属性详情                            │
│  ──────────────────────────────────────│
│                                          │
│  实例数量: 6  域类型: 1  值域类型: 1    │
│                                          │
│  实例示例：                              │
│  • epic-highway-driving → fr-001        │
│  • epic-highway-driving → fr-002        │
│  • epic-parking-assist → fr-004         │
│  ...                                     │
│                                          │
└─────────────────────────────────────────┘
```

---

## 五、后续优化建议

### 短期优化（1-2天）
- [ ] 添加对象属性搜索功能
- [ ] 添加对象属性过滤（按类别、按域等）
- [ ] 支持点击实例跳转到图谱位置
- [ ] 添加对象属性统计图表

### 中期优化（1周）
- [ ] 实现对象属性编辑器
- [ ] 添加约束验证功能
- [ ] 支持逆属性自动推导
- [ ] 添加对象属性导出功能

### 长期优化（2-3周）
- [ ] 实现完整的推理引擎
- [ ] 支持SPARQL查询
- [ ] 添加对象属性可视化分析
- [ ] 集成Protégé本体编辑器

---

## 六、常见问题

### Q1: 如何为现有relationTypes批量添加新字段？

使用脚本批量更新：

```javascript
const fs = require('fs');

const schema = JSON.parse(fs.readFileSync('data/core-domain-schema.json', 'utf8'));

Object.keys(schema.relationTypes).forEach(key => {
  const prop = schema.relationTypes[key];
  
  // 添加默认配置
  if (!prop.domain) {
    prop.domain = prop.from || [];
  }
  if (!prop.range) {
    prop.range = prop.to || [];
  }
  if (!prop.characteristics) {
    prop.characteristics = {
      transitive: false,
      symmetric: false,
      asymmetric: true
    };
  }
  if (!prop.visualization) {
    prop.visualization = {
      color: '#1890ff',
      width: 2
    };
  }
});

fs.writeFileSync(
  'data/core-domain-schema.json',
  JSON.stringify(schema, null, 2)
);
```

### Q2: 如何验证边是否满足对象属性约束？

在添加边时进行验证：

```javascript
function validateEdge(edge, schema, nodes) {
  const property = schema.relationTypes[edge.type];
  if (!property) {
    throw new Error(`未定义的对象属性: ${edge.type}`);
  }

  // 验证domain
  const sourceNode = nodes.find(n => n.id === edge.source);
  if (!property.domain.includes(sourceNode.type)) {
    throw new Error(
      `源节点类型错误: ${sourceNode.type} 不在 ${property.domain} 中`
    );
  }

  // 验证range
  const targetNode = nodes.find(n => n.id === edge.target);
  if (!property.range.includes(targetNode.type)) {
    throw new Error(
      `目标节点类型错误: ${targetNode.type} 不在 ${property.range} 中`
    );
  }

  return true;
}
```

### Q3: 如何自定义边的颜色？

在schema中配置：

```json
{
  "splits_to_fr": {
    "visualization": {
      "color": "#52c41a",  // 绿色
      "width": 3,
      "style": "dashed"    // 虚线
    }
  }
}
```

---

## 七、完整文件清单

### 需要修改的文件
1. ✅ `data/core-domain-schema.json` - 添加对象属性特征
2. ✅ `backend/src/routes/properties.js` - 新建，对象属性API
3. ✅ `backend/src/server.js` - 注册properties路由
4. ✅ `frontend/src/components/PropertyBrowser.js` - 新建，对象属性浏览器
5. ✅ `frontend/src/components/GraphView.js` - 增强边的可视化
6. ✅ `frontend/src/App.js` - 添加对象属性标签页

### 可选文件（高级功能）
- `backend/src/services/PropertyReasoner.js` - 推理引擎
- `backend/src/services/PropertyValidator.js` - 约束验证器
- `frontend/src/components/PropertyEditor.js` - 对象属性编辑器
- `frontend/src/components/PropertyMatrix.js` - 关系矩阵可视化

---

## 八、立即开始

### 最快5分钟体验

1. **添加API路由**（2分钟）
   - 复制 `backend/src/routes/properties.js` 代码
   - 在 `server.js` 中注册路由

2. **测试API**（1分钟）
   ```bash
   curl http://localhost:3001/api/v1/properties
   ```

3. **创建前端组件**（2分钟）
   - 复制 `PropertyBrowser.js` 代码
   - 在 `App.js` 中添加标签页

4. **查看效果**
   - 打开浏览器，点击"对象属性"标签
   - 🎉 完成！

---

**创建日期**: 2026-01-16  
**预计实施时间**: MVP版本1-2天  
**难度**: ⭐⭐⭐ 中等
