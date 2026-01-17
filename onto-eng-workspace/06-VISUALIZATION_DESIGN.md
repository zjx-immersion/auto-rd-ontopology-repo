# 🎨 可视化与交互能力 - 详细设计

## 📋 模块概述

本模块专注于提供丰富的可视化视图和智能交互能力，让用户能够从多个角度探索和理解知识图谱。

**核心目标**:
- 提供4种主要视图（图谱、树形、矩阵、仪表盘）
- 实现智能搜索（全文、语义、高级过滤）
- 支持高级交互（子图提取、邻居扩展、路径可视化）

---

## 🎯 功能架构

```
可视化与交互模块
├── 多视图展示
│   ├── 图谱视图增强
│   ├── 树形视图
│   ├── 矩阵视图
│   └── 统计仪表盘
│
├── 智能搜索
│   ├── 全文搜索（Elasticsearch）
│   ├── 语义搜索（向量）
│   └── 高级过滤器
│
└── 高级交互
    ├── 子图提取
    ├── 邻居扩展
    ├── 路径可视化
    └── 社区发现
```

---

## 1. 多视图展示

### 1.1 树形视图

#### 功能描述
以树形结构展示类层次和实例数据，支持展开/折叠、拖拽排序。

#### 组件设计

```jsx
// TreeView.js
import React, { useState, useEffect } from 'react';
import { Tree, Card, Tabs, Input, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const TreeView = ({ data, schema, onNodeSelect }) => {
  const [treeData, setTreeData] = useState([]);
  const [activeTab, setActiveTab] = useState('class'); // 'class' | 'instance'
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState([]);

  // 构建类层次树
  const buildClassTree = (schema) => {
    const { entityTypes } = schema;
    const tree = [];
    const nodeMap = new Map();

    // 第一遍：创建所有节点
    Object.entries(entityTypes).forEach(([id, type]) => {
      const node = {
        key: id,
        title: type.label || id,
        type: 'class',
        data: type,
        children: [],
        icon: getIconForType(type.icon),
      };
      nodeMap.set(id, node);
    });

    // 第二遍：建立父子关系
    Object.entries(entityTypes).forEach(([id, type]) => {
      const node = nodeMap.get(id);
      if (type.parentType && nodeMap.has(type.parentType)) {
        nodeMap.get(type.parentType).children.push(node);
      } else {
        tree.push(node); // 根节点
      }
    });

    return tree;
  };

  // 构建实例树
  const buildInstanceTree = (data, schema) => {
    const tree = [];
    const typeGroups = {};

    // 按类型分组节点
    data.nodes.forEach(node => {
      if (!typeGroups[node.type]) {
        typeGroups[node.type] = {
          key: `type_${node.type}`,
          title: schema.entityTypes[node.type]?.label || node.type,
          type: 'type',
          children: [],
          icon: <FolderOutlined />,
        };
      }

      typeGroups[node.type].children.push({
        key: node.id,
        title: node.label || node.id,
        type: 'instance',
        data: node,
        icon: getIconForType(schema.entityTypes[node.type]?.icon),
        isLeaf: true,
      });
    });

    return Object.values(typeGroups);
  };

  useEffect(() => {
    if (activeTab === 'class') {
      setTreeData(buildClassTree(schema));
    } else {
      setTreeData(buildInstanceTree(data, schema));
    }
  }, [data, schema, activeTab]);

  // 搜索过滤
  const filterTree = (tree, searchValue) => {
    if (!searchValue) return tree;

    return tree.reduce((filtered, node) => {
      const matchesSearch = node.title.toLowerCase().includes(searchValue.toLowerCase());
      const filteredChildren = node.children ? filterTree(node.children, searchValue) : [];

      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });
      }

      return filtered;
    }, []);
  };

  const filteredTreeData = filterTree(treeData, searchValue);

  // 节点选中
  const onSelect = (selectedKeys, info) => {
    if (info.node.type === 'instance') {
      onNodeSelect(info.node.data);
    }
  };

  return (
    <Card 
      title="树形视图"
      extra={
        <Space>
          <Input
            placeholder="搜索..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => setSearchValue('')}>
            重置
          </Button>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="类层次" key="class">
          <Tree
            treeData={filteredTreeData}
            onSelect={onSelect}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            showIcon
            showLine
            height={600}
            virtual
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="实例树" key="instance">
          <Tree
            treeData={filteredTreeData}
            onSelect={onSelect}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            showIcon
            showLine
            height={600}
            virtual
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
};

export default TreeView;
```

#### API接口

```javascript
// GET /graph/tree/classes - 获取类层次树
{
  success: true,
  data: {
    tree: [
      {
        id: "Entity",
        label: "实体",
        children: [
          { id: "Epic", label: "Epic", instanceCount: 15 },
          { id: "Task", label: "任务", instanceCount: 45 }
        ]
      }
    ]
  }
}

// GET /graph/tree/instances?type=Epic - 获取某类型的实例树
{
  success: true,
  data: {
    instances: [
      { id: "epic_001", label: "功能A", ... },
      ...
    ],
    total: 15
  }
}
```

---

### 1.2 矩阵视图

#### 功能描述
以矩阵形式展示实体间的关系，支持热力图显示关系强度。

#### 组件设计

```jsx
// MatrixView.js
import React, { useState, useEffect } from 'react';
import { Card, Select, Spin, Tooltip } from 'antd';
import * as echarts from 'echarts';

const MatrixView = ({ data, schema }) => {
  const [chartInstance, setChartInstance] = useState(null);
  const [relationType, setRelationType] = useState('all');
  const [loading, setLoading] = useState(false);

  // 构建关系矩阵
  const buildRelationMatrix = (data, relationType) => {
    const nodes = data.nodes;
    const edges = data.edges.filter(e => 
      relationType === 'all' || e.type === relationType
    );

    // 节点ID到索引的映射
    const nodeIndexMap = new Map();
    nodes.forEach((node, index) => {
      nodeIndexMap.set(node.id, index);
    });

    // 构建邻接矩阵
    const matrix = Array(nodes.length).fill(0).map(() => 
      Array(nodes.length).fill(0)
    );

    edges.forEach(edge => {
      const sourceIdx = nodeIndexMap.get(edge.source);
      const targetIdx = nodeIndexMap.get(edge.target);
      if (sourceIdx !== undefined && targetIdx !== undefined) {
        matrix[sourceIdx][targetIdx]++;
      }
    });

    return {
      matrix,
      nodeLabels: nodes.map(n => n.label || n.id),
      nodeIds: nodes.map(n => n.id),
    };
  };

  // 渲染热力图
  const renderHeatmap = (matrixData) => {
    if (!chartInstance) return;

    const { matrix, nodeLabels } = matrixData;

    // 转换为ECharts需要的格式
    const chartData = [];
    matrix.forEach((row, i) => {
      row.forEach((value, j) => {
        if (value > 0) {
          chartData.push([i, j, value]);
        }
      });
    });

    const option = {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const [x, y, value] = params.data;
          return `${nodeLabels[x]} → ${nodeLabels[y]}<br/>关系数: ${value}`;
        }
      },
      grid: {
        left: 120,
        right: 50,
        top: 50,
        bottom: 100
      },
      xAxis: {
        type: 'category',
        data: nodeLabels,
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'category',
        data: nodeLabels,
        axisLabel: {
          fontSize: 10
        }
      },
      visualMap: {
        min: 0,
        max: Math.max(...chartData.map(d => d[2])),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 20,
        inRange: {
          color: ['#eee', '#1890ff', '#f5222d']
        }
      },
      series: [{
        name: '关系矩阵',
        type: 'heatmap',
        data: chartData,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };

    chartInstance.setOption(option);
  };

  useEffect(() => {
    if (!chartInstance) {
      const chart = echarts.init(document.getElementById('matrix-chart'));
      setChartInstance(chart);
      
      // 窗口resize时重绘
      window.addEventListener('resize', () => chart.resize());
    }
  }, []);

  useEffect(() => {
    if (chartInstance && data) {
      setLoading(true);
      const matrixData = buildRelationMatrix(data, relationType);
      renderHeatmap(matrixData);
      setLoading(false);
    }
  }, [chartInstance, data, relationType]);

  return (
    <Card
      title="关系矩阵"
      extra={
        <Select
          value={relationType}
          onChange={setRelationType}
          style={{ width: 200 }}
        >
          <Select.Option value="all">所有关系</Select.Option>
          {Object.entries(schema.relationTypes || {}).map(([id, rel]) => (
            <Select.Option key={id} value={id}>
              {rel.label || id}
            </Select.Option>
          ))}
        </Select>
      }
    >
      <Spin spinning={loading}>
        <div id="matrix-chart" style={{ width: '100%', height: 600 }} />
      </Spin>
    </Card>
  );
};

export default MatrixView;
```

---

### 1.3 统计仪表盘

#### 功能描述
显示图谱的关键统计指标和趋势图表。

#### 组件设计

```jsx
// Dashboard.js
import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic, Progress } from 'antd';
import { 
  NodeIndexOutlined, 
  BranchesOutlined, 
  DatabaseOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';
import { Line, Pie, Column } from '@ant-design/plots';

const Dashboard = ({ data, schema }) => {
  // 计算统计数据
  const statistics = useMemo(() => {
    const nodesByType = {};
    const edgesByType = {};

    data.nodes.forEach(node => {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    });

    data.edges.forEach(edge => {
      edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
    });

    return {
      totalNodes: data.nodes.length,
      totalEdges: data.edges.length,
      nodeTypes: Object.keys(nodesByType).length,
      edgeTypes: Object.keys(edgesByType).length,
      nodesByType,
      edgesByType,
      density: (2 * data.edges.length) / (data.nodes.length * (data.nodes.length - 1)),
      avgDegree: (2 * data.edges.length) / data.nodes.length,
    };
  }, [data]);

  // 节点类型分布饼图数据
  const nodeTypePieData = Object.entries(statistics.nodesByType).map(([type, count]) => ({
    type: schema.entityTypes[type]?.label || type,
    value: count,
  }));

  // 关系类型柱状图数据
  const edgeTypeColumnData = Object.entries(statistics.edgesByType).map(([type, count]) => ({
    type: schema.relationTypes[type]?.label || type,
    count,
  }));

  return (
    <div style={{ padding: 24, background: '#f0f2f5' }}>
      {/* 关键指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="节点总数"
              value={statistics.totalNodes}
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="关系总数"
              value={statistics.totalEdges}
              prefix={<BranchesOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="实体类型"
              value={statistics.nodeTypes}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="关系类型"
              value={statistics.edgeTypes}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图谱密度和平均度 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="图谱密度">
            <Statistic
              value={(statistics.density * 100).toFixed(2)}
              suffix="%"
            />
            <Progress 
              percent={(statistics.density * 100).toFixed(2)} 
              status="active"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="平均度">
            <Statistic
              value={statistics.avgDegree.toFixed(2)}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="节点类型分布">
            <Pie
              data={nodeTypePieData}
              angleField="value"
              colorField="type"
              radius={0.8}
              label={{
                type: 'outer',
                content: '{name} {percentage}',
              }}
              interactions={[{ type: 'element-active' }]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="关系类型统计">
            <Column
              data={edgeTypeColumnData}
              xField="type"
              yField="count"
              label={{
                position: 'top',
              }}
              xAxis={{
                label: {
                  autoRotate: true,
                },
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
```

---

## 2. 智能搜索

### 2.1 Elasticsearch集成

#### 架构设计

```
┌─────────────────┐
│  React前端      │
│  SearchBox      │
└────────┬────────┘
         │ API
┌────────▼────────┐
│  Express后端    │
│  SearchService  │
└────────┬────────┘
         │
┌────────▼─────────┐
│ Elasticsearch    │
│  - nodes索引     │
│  - edges索引     │
└──────────────────┘
```

#### 后端实现

```javascript
// backend/src/services/SearchService.js
const { Client } = require('@elastic/elasticsearch');

class SearchService {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
    this.nodesIndex = 'kg-nodes';
    this.edgesIndex = 'kg-edges';
  }

  // 初始化索引
  async initializeIndices() {
    // 节点索引映射
    await this.client.indices.create({
      index: this.nodesIndex,
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            type: { type: 'keyword' },
            label: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            data: { type: 'object', enabled: false },
            searchText: { type: 'text' }, // 组合搜索字段
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' }
          }
        }
      }
    });

    // 边索引映射
    await this.client.indices.create({
      index: this.edgesIndex,
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            source: { type: 'keyword' },
            target: { type: 'keyword' },
            type: { type: 'keyword' },
            data: { type: 'object', enabled: false }
          }
        }
      }
    });
  }

  // 索引节点数据
  async indexNodes(nodes) {
    const body = nodes.flatMap(node => [
      { index: { _index: this.nodesIndex, _id: node.id } },
      {
        ...node,
        searchText: this.buildSearchText(node), // 组合所有可搜索字段
        updatedAt: new Date()
      }
    ]);

    const response = await this.client.bulk({ body });
    return response;
  }

  // 构建搜索文本（包含所有属性）
  buildSearchText(node) {
    const parts = [
      node.id,
      node.label,
      node.type,
      ...Object.values(node.data || {}).filter(v => typeof v === 'string')
    ];
    return parts.join(' ');
  }

  // 全文搜索
  async fullTextSearch(query, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      types = [], // 节点类型过滤
      sortBy = 'relevance' // relevance | createdAt | label
    } = options;

    const must = [
      {
        multi_match: {
          query,
          fields: ['label^3', 'searchText'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      }
    ];

    if (types.length > 0) {
      must.push({ terms: { type: types } });
    }

    const sort = this.buildSort(sortBy);

    const response = await this.client.search({
      index: this.nodesIndex,
      body: {
        query: { bool: { must } },
        from: (page - 1) * pageSize,
        size: pageSize,
        sort,
        highlight: {
          fields: {
            label: {},
            searchText: {}
          }
        }
      }
    });

    return {
      hits: response.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight
      })),
      total: response.hits.total.value,
      page,
      pageSize
    };
  }

  // 高级搜索（多条件）
  async advancedSearch(conditions, options = {}) {
    const must = [];
    const filter = [];

    conditions.forEach(condition => {
      switch (condition.operator) {
        case 'equals':
          filter.push({ term: { [condition.field]: condition.value } });
          break;
        case 'contains':
          must.push({ match: { [condition.field]: condition.value } });
          break;
        case 'in':
          filter.push({ terms: { [condition.field]: condition.value } });
          break;
        case 'range':
          filter.push({
            range: {
              [condition.field]: {
                gte: condition.min,
                lte: condition.max
              }
            }
          });
          break;
        case 'regex':
          must.push({
            regexp: {
              [condition.field]: condition.pattern
            }
          });
          break;
      }
    });

    const response = await this.client.search({
      index: this.nodesIndex,
      body: {
        query: {
          bool: { must, filter }
        },
        from: (options.page - 1) * options.pageSize,
        size: options.pageSize
      }
    });

    return this.formatSearchResults(response);
  }

  // 语义搜索（基于向量）
  async semanticSearch(vector, k = 10) {
    // 需要Elasticsearch 8.0+ 的向量搜索功能
    const response = await this.client.search({
      index: this.nodesIndex,
      body: {
        knn: {
          field: 'embedding', // 向量字段
          query_vector: vector,
          k,
          num_candidates: k * 2
        }
      }
    });

    return this.formatSearchResults(response);
  }

  buildSort(sortBy) {
    switch (sortBy) {
      case 'createdAt':
        return [{ createdAt: 'desc' }];
      case 'label':
        return [{ 'label.keyword': 'asc' }];
      case 'relevance':
      default:
        return ['_score'];
    }
  }

  formatSearchResults(response) {
    return {
      hits: response.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score
      })),
      total: response.hits.total.value
    };
  }

  // 搜索建议（自动补全）
  async getSuggestions(prefix, field = 'label') {
    const response = await this.client.search({
      index: this.nodesIndex,
      body: {
        suggest: {
          suggestions: {
            prefix,
            completion: {
              field: `${field}_suggest`,
              size: 10,
              fuzzy: {
                fuzziness: 1
              }
            }
          }
        }
      }
    });

    return response.suggest.suggestions[0].options.map(opt => opt.text);
  }
}

module.exports = SearchService;
```

#### API接口

```javascript
// POST /search/full-text - 全文搜索
Request: {
  query: "Epic",
  page: 1,
  pageSize: 20,
  types: ["Epic", "Task"],
  sortBy: "relevance"
}

Response: {
  success: true,
  data: {
    hits: [
      {
        id: "epic_001",
        label: "Epic A",
        type: "Epic",
        score: 8.5,
        highlights: {
          label: ["<em>Epic</em> A"]
        }
      }
    ],
    total: 15,
    page: 1,
    pageSize: 20
  }
}

// POST /search/advanced - 高级搜索
Request: {
  conditions: [
    { field: "type", operator: "equals", value: "Epic" },
    { field: "data.priority", operator: "in", value: ["High", "Medium"] },
    { field: "data.progress", operator: "range", min: 50, max: 100 }
  ],
  page: 1,
  pageSize: 20
}

// GET /search/suggestions?prefix=Epi&field=label - 搜索建议
Response: {
  success: true,
  data: {
    suggestions: ["Epic", "Epic A", "Epic B"]
  }
}
```

---

### 2.2 搜索UI组件

```jsx
// SearchBox.js
import React, { useState, useRef } from 'react';
import { Input, Select, Tag, Space, Button, Dropdown } from 'antd';
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons';

const SearchBox = ({ onSearch, schema }) => {
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // 添加过滤条件
  const addFilter = (filter) => {
    setFilters([...filters, { id: Date.now(), ...filter }]);
  };

  // 移除过滤条件
  const removeFilter = (filterId) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  // 执行搜索
  const handleSearch = () => {
    onSearch({
      query: searchValue,
      filters
    });
  };

  // 高级过滤器菜单
  const filterMenu = {
    items: [
      {
        key: 'type',
        label: '节点类型',
        children: Object.entries(schema.entityTypes).map(([id, type]) => ({
          key: `type_${id}`,
          label: type.label,
          onClick: () => addFilter({ field: 'type', operator: 'equals', value: id })
        }))
      },
      {
        key: 'date',
        label: '日期范围',
        onClick: () => {
          // 打开日期范围选择器
        }
      }
    ]
  };

  return (
    <div style={{ padding: '16px 0' }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          size="large"
          placeholder="搜索节点、关系或属性..."
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onPressEnter={handleSearch}
          prefix={<SearchOutlined />}
          style={{ width: '60%' }}
        />
        
        <Dropdown menu={filterMenu}>
          <Button size="large" icon={<FilterOutlined />}>
            高级过滤
          </Button>
        </Dropdown>

        <Button 
          type="primary" 
          size="large" 
          onClick={handleSearch}
        >
          搜索
        </Button>
      </Space.Compact>

      {/* 已选过滤条件 */}
      {filters.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            {filters.map(filter => (
              <Tag
                key={filter.id}
                closable
                onClose={() => removeFilter(filter.id)}
              >
                {`${filter.field} ${filter.operator} ${filter.value}`}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
};

export default SearchBox;
```

---

## 3. 高级交互

### 3.1 子图提取

#### 功能描述
从完整图谱中提取满足条件的子图，支持导出和单独查看。

#### 后端实现

```javascript
// backend/src/services/SubgraphService.js
class SubgraphService {
  constructor(graphService) {
    this.graphService = graphService;
  }

  // 提取以指定节点为中心的子图
  async extractEgoNetwork(nodeId, depth = 2) {
    const nodes = new Set([nodeId]);
    const edges = [];
    const visited = new Set();

    // BFS遍历
    let currentLevel = [nodeId];
    for (let d = 0; d < depth; d++) {
      const nextLevel = [];
      
      for (const currentNode of currentLevel) {
        if (visited.has(currentNode)) continue;
        visited.add(currentNode);

        // 获取邻居
        const neighbors = await this.graphService.getNeighbors(currentNode);
        
        neighbors.forEach(neighbor => {
          nodes.add(neighbor.id);
          nextLevel.push(neighbor.id);
          edges.push({
            source: currentNode,
            target: neighbor.id,
            ...neighbor.edge
          });
        });
      }

      currentLevel = nextLevel;
    }

    return {
      nodes: await this.graphService.getNodesByIds(Array.from(nodes)),
      edges,
      center: nodeId,
      depth
    };
  }

  // 提取连通分量
  async extractConnectedComponents() {
    const allNodes = await this.graphService.getAllNodes();
    const allEdges = await this.graphService.getAllEdges();
    
    const components = [];
    const visited = new Set();

    for (const node of allNodes) {
      if (visited.has(node.id)) continue;

      const component = this.dfs(node.id, allEdges, visited);
      components.push({
        nodes: component.nodes,
        edges: component.edges,
        size: component.nodes.length
      });
    }

    // 按大小排序
    components.sort((a, b) => b.size - a.size);

    return components;
  }

  // 深度优先搜索
  dfs(startNode, edges, visited) {
    const component = {
      nodes: [],
      edges: []
    };

    const stack = [startNode];

    while (stack.length > 0) {
      const node = stack.pop();
      
      if (visited.has(node)) continue;
      visited.add(node);
      component.nodes.push(node);

      // 查找相邻边和节点
      edges.forEach(edge => {
        if (edge.source === node) {
          component.edges.push(edge);
          if (!visited.has(edge.target)) {
            stack.push(edge.target);
          }
        } else if (edge.target === node) {
          component.edges.push(edge);
          if (!visited.has(edge.source)) {
            stack.push(edge.source);
          }
        }
      });
    }

    return component;
  }

  // 按条件提取子图
  async extractByConditions(conditions) {
    const allNodes = await this.graphService.getAllNodes();
    const allEdges = await this.graphService.getAllEdges();

    // 过滤节点
    const filteredNodes = allNodes.filter(node => 
      this.matchesConditions(node, conditions.node)
    );

    const nodeIds = new Set(filteredNodes.map(n => n.id));

    // 过滤边（两端节点都在子图中）
    const filteredEdges = allEdges.filter(edge =>
      nodeIds.has(edge.source) && 
      nodeIds.has(edge.target) &&
      this.matchesConditions(edge, conditions.edge)
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges
    };
  }

  matchesConditions(item, conditions) {
    if (!conditions) return true;

    return conditions.every(condition => {
      const value = condition.field.split('.').reduce((obj, key) => obj?.[key], item);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'in':
          return condition.value.includes(value);
        case 'gt':
          return value > condition.value;
        case 'lt':
          return value < condition.value;
        default:
          return true;
      }
    });
  }
}

module.exports = SubgraphService;
```

#### API接口

```javascript
// POST /graph/subgraph/ego-network - 提取中心子图
Request: {
  nodeId: "epic_001",
  depth: 2
}

Response: {
  success: true,
  data: {
    nodes: [...],
    edges: [...],
    center: "epic_001",
    depth: 2,
    statistics: {
      nodeCount: 25,
      edgeCount: 42
    }
  }
}

// GET /graph/subgraph/components - 提取连通分量
Response: {
  success: true,
  data: {
    components: [
      {
        id: "component_1",
        nodes: [...],
        edges: [...],
        size: 150
      },
      ...
    ],
    totalComponents: 3
  }
}

// POST /graph/subgraph/by-conditions - 按条件提取
Request: {
  node: [
    { field: "type", operator: "in", value: ["Epic", "Task"] },
    { field: "data.priority", operator: "equals", value: "High" }
  ],
  edge: [
    { field: "type", operator: "equals", value: "depends_on" }
  ]
}
```

---

## 4. 性能优化

### 4.1 虚拟化滚动

对于大量数据的列表和树，使用虚拟化滚动：

```jsx
import { FixedSizeList } from 'react-window';

const VirtualizedList = ({ items, height, itemHeight }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].label}
    </div>
  );

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### 4.2 懒加载和分页

```javascript
// 懒加载树节点
const loadTreeData = async (node) => {
  const children = await api.getChildren(node.id);
  return children.map(child => ({
    ...child,
    isLeaf: false,
  }));
};

// 分页加载搜索结果
const loadMore = async () => {
  setPage(page + 1);
  const newResults = await api.search(query, page + 1);
  setResults([...results, ...newResults]);
};
```

### 4.3 索引优化

```javascript
// Elasticsearch索引优化
PUT /kg-nodes/_settings
{
  "index": {
    "refresh_interval": "30s",  // 降低刷新频率
    "number_of_replicas": 0,    // 开发环境不需要副本
    "max_result_window": 10000  // 增加结果窗口
  }
}

// 添加复合索引
PUT /kg-nodes/_mapping
{
  "properties": {
    "type_and_label": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      }
    }
  }
}
```

---

## 📊 测试方案

### 单元测试

```javascript
// SearchService.test.js
describe('SearchService', () => {
  let searchService;

  beforeEach(() => {
    searchService = new SearchService();
  });

  test('全文搜索返回正确结果', async () => {
    const results = await searchService.fullTextSearch('Epic');
    
    expect(results.hits.length).toBeGreaterThan(0);
    expect(results.hits[0]).toHaveProperty('label');
    expect(results.hits[0].label).toContain('Epic');
  });

  test('高级搜索支持多条件', async () => {
    const conditions = [
      { field: 'type', operator: 'equals', value: 'Epic' },
      { field: 'data.priority', operator: 'in', value: ['High', 'Medium'] }
    ];

    const results = await searchService.advancedSearch(conditions);
    
    results.hits.forEach(hit => {
      expect(hit.type).toBe('Epic');
      expect(['High', 'Medium']).toContain(hit.data.priority);
    });
  });
});
```

### 性能测试

```javascript
// 测试大规模数据性能
test('10000节点搜索性能', async () => {
  const startTime = Date.now();
  const results = await searchService.fullTextSearch('test');
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(100); // 100ms内完成
});
```

---

## 📋 交付清单

### Sprint 01交付
- [ ] 树形视图组件（类层次+实例树）
- [ ] 矩阵视图组件（关系矩阵+热力图）
- [ ] 统计仪表盘组件
- [ ] 视图切换功能
- [ ] 单元测试（覆盖率>80%）
- [ ] 用户文档

### Sprint 02交付
- [ ] Elasticsearch集成
- [ ] 全文搜索API和UI
- [ ] 高级过滤器
- [ ] 搜索建议功能
- [ ] 子图提取API
- [ ] 性能测试报告

---

## 🎯 成功指标

- **性能**: 搜索响应时间 < 200ms
- **用户体验**: 视图切换流畅，无卡顿
- **数据规模**: 支持10万节点的可视化
- **准确性**: 搜索召回率 > 95%

---

**文档版本**: v1.0  
**创建日期**: 2026-01-16  
**状态**: ✅ 就绪，可开始实施
