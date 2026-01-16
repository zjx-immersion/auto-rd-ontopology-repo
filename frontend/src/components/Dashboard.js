import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic, Space, Tag, Divider } from 'antd';
import { 
  NodeIndexOutlined, 
  BranchesOutlined, 
  DatabaseOutlined,
  ApartmentOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/plots';
import './Dashboard.css';

const Dashboard = ({ data, schema }) => {
  
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

  // 关系类型分布图表数据
  const edgeTypeChartData = useMemo(() => {
    if (!statistics) return [];

    return Object.entries(statistics.edgeTypeDistribution).map(([type, count]) => {
      const typeDef = schema?.relationTypes?.[type];
      return {
        type: typeDef?.label || type,
        value: count,
        typeId: type
      };
    }).sort((a, b) => b.value - a.value);
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
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
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
    color: ({ type }) => {
      const colors = ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E8684A', '#6DC8EC', '#9270CA', '#FF9D4D', '#269A99'];
      const index = nodeTypeChartData.findIndex(d => d.type === type);
      return colors[index % colors.length];
    },
  };

  // 关系类型饼图配置
  const edgeTypePieConfig = {
    data: edgeTypeChartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 14,
        textAlign: 'center',
      },
    },
    legend: {
      position: 'right',
      offsetX: -20,
    },
    statistic: {
      title: false,
      content: {
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
        },
        content: statistics?.totalEdges || 0,
      },
    },
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
            <Column {...nodeTypeColumnConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="关系类型分布" className="chart-card">
            <Pie {...edgeTypePieConfig} height={300} />
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
    </div>
  );
};

export default Dashboard;
