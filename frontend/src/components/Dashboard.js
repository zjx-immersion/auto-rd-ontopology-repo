import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, Space, Tag, Divider, Table, Input, Tooltip, Progress, Modal } from 'antd';
import { 
  NodeIndexOutlined, 
  BranchesOutlined, 
  DatabaseOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import './Dashboard.css';

const Dashboard = ({ data, schema }) => {
  const [relationModalVisible, setRelationModalVisible] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState(null);
  const [searchText, setSearchText] = useState('');
  
  // 计算基础统计数据
  const statistics = useMemo(() => {
    if (!data) return null;

    const nodes = data.nodes || [];
    const edges = data.edges || [];

    // 节点类型分布
    const nodeTypeDistribution = {};
    nodes.forEach(node => {
      nodeTypeDistribution[node.type] = (nodeTypeDistribution[node.type] || 0) + 1;
    });

    // 关系类型分布
    const edgeTypeDistribution = {};
    edges.forEach(edge => {
      edgeTypeDistribution[edge.type] = (edgeTypeDistribution[edge.type] || 0) + 1;
    });

    // 节点度数统计
    const nodeDegrees = new Map();
    nodes.forEach(node => nodeDegrees.set(node.id, { in: 0, out: 0, total: 0 }));
    
    edges.forEach(edge => {
      const sourceDegree = nodeDegrees.get(edge.source);
      const targetDegree = nodeDegrees.get(edge.target);
      
      if (sourceDegree) {
        sourceDegree.out += 1;
        sourceDegree.total += 1;
      }
      if (targetDegree) {
        targetDegree.in += 1;
        targetDegree.total += 1;
      }
    });

    // 计算平均度数
    const degrees = Array.from(nodeDegrees.values()).map(d => d.total);
    const avgDegree = degrees.length > 0 
      ? (degrees.reduce((a, b) => a + b, 0) / degrees.length).toFixed(2)
      : 0;

    // 找出最重要的节点（度数最高）
    const topNodes = Array.from(nodeDegrees.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([nodeId, degree]) => {
        const node = nodes.find(n => n.id === nodeId);
        return {
          id: nodeId,
          label: node?.label || nodeId,
          type: node?.type,
          degree: degree.total
        };
      });

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      avgDegree,
      nodeTypeDistribution,
      edgeTypeDistribution,
      topNodes,
      density: nodes.length > 1 
        ? (edges.length / (nodes.length * (nodes.length - 1))).toFixed(4)
        : 0
    };
  }, [data]);

  // 节点类型分布图表数据
  const nodeTypeChartData = useMemo(() => {
    if (!statistics) return [];

    return Object.entries(statistics.nodeTypeDistribution).map(([type, count]) => {
      const typeDef = schema?.entityTypes?.[type];
      return {
        type: typeDef?.label || type,
        count: count,
        typeId: type
      };
    }).sort((a, b) => b.count - a.count);
  }, [statistics, schema]);

  // 关系类型分布图表数据 - 改进版本，处理 undefined
  const edgeTypeChartData = useMemo(() => {
    if (!statistics) return [];

    return Object.entries(statistics.edgeTypeDistribution).map(([type, count]) => {
      const typeDef = schema?.relationTypes?.[type];
      // 确保type不是undefined，如果是则使用"未定义"
      const displayType = type || '未定义类型';
      const label = typeDef?.label || displayType;
      const description = typeDef?.description || '';
      
      return {
        type: label,
        value: count,
        typeId: displayType,
        description: description,
        isDefined: !!typeDef
      };
    })
    .filter(item => item.value > 0) // 过滤掉数量为0的
    .sort((a, b) => b.value - a.value);
  }, [statistics, schema]);

  // 节点类型柱状图配置
  const nodeTypeColumnConfig = {
    data: nodeTypeChartData,
    xField: 'type',
    yField: 'count',
    label: {
      position: 'top',
      style: {
        fill: '#000000',
        opacity: 0.6,
        fontSize: 12,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
        style: {
          fontSize: 11,
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fontSize: 12,
        },
      },
    },
    meta: {
      type: {
        alias: '节点类型',
      },
      count: {
        alias: '数量',
      },
    },
    tooltip: {
      customContent: (title, items) => {
        if (!items || items.length === 0) return '';
        const item = items[0];
        const data = item.data;
        return `
          <div style="padding: 8px 12px;">
            <div style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">
              ${data.type}
            </div>
            <div style="color: rgba(0,0,0,0.65); font-size: 13px;">
              节点数量: <span style="font-weight: 500;">${data.count}个</span>
            </div>
          </div>
        `;
      },
    },
    color: ({ type }) => {
      const colors = ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E8684A', '#6DC8EC', '#9270CA', '#FF9D4D', '#269A99'];
      const index = nodeTypeChartData.findIndex(d => d.type === type);
      return colors[index % colors.length];
    },
  };


  // 获取选中关系类型的实例数据
  const getRelationInstances = (typeId) => {
    if (!data || !typeId) return [];
    const edges = data.edges || [];
    return edges
      .filter(edge => edge.type === typeId)
      .slice(0, 20) // 最多显示20个实例
      .map(edge => {
        const sourceNode = data.nodes.find(n => n.id === edge.source);
        const targetNode = data.nodes.find(n => n.id === edge.target);
        return {
          ...edge,
          sourceName: sourceNode?.data?.name || sourceNode?.label || edge.source,
          targetName: targetNode?.data?.name || targetNode?.label || edge.target,
          sourceType: sourceNode?.type || '未知',
          targetType: targetNode?.type || '未知'
        };
      });
  };

  if (!statistics) {
    return (
      <Card className="dashboard-card">
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          暂无数据
        </div>
      </Card>
    );
  }

  return (
    <div className="dashboard-container">
      {/* 概览指标 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="节点总数"
              value={statistics.totalNodes}
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="关系总数"
              value={statistics.totalEdges}
              prefix={<BranchesOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均度数"
              value={statistics.avgDegree}
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="图密度"
              value={statistics.density}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="节点类型分布" className="chart-card">
            <Column {...nodeTypeColumnConfig} height={400} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BranchesOutlined />
                <span>关系类型分布</span>
                <Tag color="blue">{edgeTypeChartData.length} 种类型</Tag>
              </Space>
            }
            className="chart-card" 
            style={{ minHeight: 500 }}
            extra={
              <Input
                placeholder="搜索关系类型"
                prefix={<SearchOutlined />}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
            }
          >
            <Table
              dataSource={edgeTypeChartData.filter(item => 
                item.type.toLowerCase().includes(searchText.toLowerCase()) ||
                item.typeId.toLowerCase().includes(searchText.toLowerCase())
              )}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 种关系类型`
              }}
              size="small"
              rowKey="typeId"
              columns={[
                {
                  title: '序号',
                  dataIndex: 'index',
                  width: 60,
                  render: (_, __, index) => index + 1
                },
                {
                  title: '关系类型',
                  dataIndex: 'type',
                  key: 'type',
                  ellipsis: true,
                  render: (text, record) => (
                    <Space>
                      <Tag color={record.isDefined ? 'purple' : 'default'}>
                        {text}
                      </Tag>
                      {!record.isDefined && (
                        <Tooltip title="此关系类型尚未在Schema中定义">
                          <Tag color="warning">未定义</Tag>
                        </Tooltip>
                      )}
                    </Space>
                  )
                },
                {
                  title: '说明',
                  dataIndex: 'description',
                  key: 'description',
                  ellipsis: true,
                  render: (text) => (
                    <Tooltip title={text || '暂无说明'}>
                      <span style={{ color: text ? '#666' : '#ccc', fontSize: 12 }}>
                        {text || '暂无说明'}
                      </span>
                    </Tooltip>
                  )
                },
                {
                  title: '数量',
                  dataIndex: 'value',
                  key: 'value',
                  width: 80,
                  sorter: (a, b) => a.value - b.value,
                  defaultSortOrder: 'descend',
                  render: (value) => (
                    <Tag color="blue" style={{ minWidth: 50, textAlign: 'center' }}>
                      {value}
                    </Tag>
                  )
                },
                {
                  title: '占比',
                  dataIndex: 'value',
                  key: 'percent',
                  width: 120,
                  render: (value) => {
                    const total = edgeTypeChartData.reduce((sum, item) => sum + item.value, 0);
                    const percent = ((value / total) * 100).toFixed(1);
                    return (
                      <Progress 
                        percent={parseFloat(percent)} 
                        size="small"
                        format={(p) => `${p}%`}
                        strokeColor={parseFloat(percent) > 10 ? '#52c41a' : '#1890ff'}
                      />
                    );
                  }
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 80,
                  render: (_, record) => (
                    <Tooltip title="查看关系实例">
                      <EyeOutlined 
                        style={{ cursor: 'pointer', color: '#1890ff', fontSize: 16 }}
                        onClick={() => {
                          setSelectedRelationType(record);
                          setRelationModalVisible(true);
                        }}
                      />
                    </Tooltip>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 重要节点 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <ClockCircleOutlined />
                <span>核心节点 (Top 5)</span>
              </Space>
            }
            className="top-nodes-card"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {statistics.topNodes.map((node, index) => {
                const typeDef = schema?.entityTypes?.[node.type];
                return (
                  <Card key={node.id} size="small" type="inner">
                    <Space split={<Divider type="vertical" />} wrap>
                      <Tag color="blue">#{index + 1}</Tag>
                      <span style={{ fontWeight: 'bold' }}>{node.label}</span>
                      <Tag color="green">{typeDef?.label || node.type}</Tag>
                      <Statistic 
                        title="连接数" 
                        value={node.degree} 
                        style={{ display: 'inline-block' }}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Space>
                  </Card>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Schema统计 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="实体类型定义" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {schema?.entityTypes && Object.entries(schema.entityTypes).map(([typeId, typeDef]) => {
                const count = statistics.nodeTypeDistribution[typeId] || 0;
                return (
                  <div key={typeId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Space>
                      <Tag color="blue">{typeDef.label || typeId}</Tag>
                      {typeDef.description && (
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {typeDef.description}
                        </span>
                      )}
                    </Space>
                    <Tag color="green">{count} 个实例</Tag>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="关系类型定义" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {schema?.relationTypes && Object.entries(schema.relationTypes).map(([typeId, typeDef]) => {
                const count = statistics.edgeTypeDistribution[typeId] || 0;
                return (
                  <div key={typeId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Space>
                      <Tag color="purple">{typeDef.label || typeId}</Tag>
                      {typeDef.description && (
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {typeDef.description}
                        </span>
                      )}
                    </Space>
                    <Tag color="orange">{count} 条关系</Tag>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 关系实例查看Modal */}
      <Modal
        title={
          <Space>
            <BranchesOutlined />
            <span>关系实例预览: {selectedRelationType?.type}</span>
            <Tag color="blue">{selectedRelationType?.value} 条</Tag>
          </Space>
        }
        open={relationModalVisible}
        onCancel={() => {
          setRelationModalVisible(false);
          setSelectedRelationType(null);
        }}
        width={900}
        footer={null}
      >
        {selectedRelationType && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div><strong>类型ID:</strong> <Tag>{selectedRelationType.typeId}</Tag></div>
                {selectedRelationType.description && (
                  <div><strong>说明:</strong> {selectedRelationType.description}</div>
                )}
                {!selectedRelationType.isDefined && (
                  <div style={{ color: '#faad14' }}>
                    ⚠️ 此关系类型尚未在Schema中定义，建议补充完善
                  </div>
                )}
              </Space>
            </div>
            
            <Table
              dataSource={getRelationInstances(selectedRelationType.typeId)}
              pagination={{ pageSize: 10 }}
              size="small"
              rowKey="id"
              columns={[
                {
                  title: '序号',
                  width: 60,
                  render: (_, __, index) => index + 1
                },
                {
                  title: '源节点',
                  key: 'source',
                  render: (_, record) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{record.sourceName}</div>
                      <Tag color="green" size="small">{record.sourceType}</Tag>
                    </div>
                  )
                },
                {
                  title: '关系',
                  dataIndex: 'type',
                  width: 100,
                  align: 'center',
                  render: (type) => (
                    <Tag color="purple">{selectedRelationType.type}</Tag>
                  )
                },
                {
                  title: '目标节点',
                  key: 'target',
                  render: (_, record) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{record.targetName}</div>
                      <Tag color="blue" size="small">{record.targetType}</Tag>
                    </div>
                  )
                },
                {
                  title: '置信度',
                  dataIndex: ['data', 'confidence'],
                  width: 80,
                  render: (confidence) => confidence ? `${(confidence * 100).toFixed(0)}%` : '-'
                }
              ]}
            />
            
            {getRelationInstances(selectedRelationType.typeId).length >= 20 && (
              <div style={{ marginTop: 16, textAlign: 'center', color: '#999', fontSize: 12 }}>
                仅显示前20条记录，如需查看更多请使用表格视图或图谱视图
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
