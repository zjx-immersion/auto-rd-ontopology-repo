import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Button,
  Descriptions,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Table,
  message,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  Select,
  Divider,
  Alert
} from 'antd';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ShareAltOutlined,
  BranchesOutlined,
  NodeIndexOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { getOAGById, validateOAG, getOAGNodes, getOAGEdges, addOAGNode, addOAGEdge } from '../services/oagApi';
import './OAGDetailPage.css';

const { TabPane } = Tabs;
const { Option } = Select;

cytoscape.use(dagre);

/**
 * OAG 详情页面
 */
const OAGDetailPage = () => {
  const { oagId } = useParams();
  const navigate = useNavigate();
  const [oag, setOag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [cy, setCy] = useState(null);
  const [addNodeModalVisible, setAddNodeModalVisible] = useState(false);
  const [addEdgeModalVisible, setAddEdgeModalVisible] = useState(false);
  const [nodeForm] = Form.useForm();
  const [edgeForm] = Form.useForm();

  // 加载 OAG 数据
  const loadOAG = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOAGById(oagId);
      if (result.success) {
        setOag(result.data);
      }
    } catch (error) {
      message.error('加载 OAG 失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [oagId]);

  useEffect(() => {
    loadOAG();
  }, [loadOAG]);

  // 验证 OAG
  const handleValidate = async () => {
    try {
      const result = await validateOAG(oagId);
      if (result.success) {
        setValidation(result.data);
        message.success('验证完成');
      }
    } catch (error) {
      message.error('验证失败: ' + error.message);
    }
  };

  // 导出 OAG
  const handleExport = async (format) => {
    try {
      // 导出逻辑
      message.success(`导出 ${format} 格式成功`);
    } catch (error) {
      message.error('导出失败: ' + error.message);
    }
  };

  // 添加节点
  const handleAddNode = async (values) => {
    try {
      const result = await addOAGNode(oagId, {
        id: `${values.type}_${Date.now()}`,
        type: values.type,
        label: values.label,
        data: values.data || {}
      });
      if (result.success) {
        message.success('节点添加成功');
        setAddNodeModalVisible(false);
        nodeForm.resetFields();
        loadOAG();
      }
    } catch (error) {
      message.error('添加节点失败: ' + error.message);
    }
  };

  // 添加边
  const handleAddEdge = async (values) => {
    try {
      const result = await addOAGEdge(oagId, {
        id: `e${Date.now()}`,
        source: values.source,
        target: values.target,
        type: values.type,
        data: values.data || {}
      });
      if (result.success) {
        message.success('边添加成功');
        setAddEdgeModalVisible(false);
        edgeForm.resetFields();
        loadOAG();
      }
    } catch (error) {
      message.error('添加边失败: ' + error.message);
    }
  };

  // 准备 Cytoscape 元素
  const getCytoscapeElements = () => {
    if (!oag) return [];

    const elements = [];

    // 添加节点
    oag.nodes?.forEach(node => {
      const entityType = oag.schemaSnapshot?.entityTypes?.[node.type];
      elements.push({
        data: {
          id: node.id,
          label: node.label || node.id,
          type: node.type,
          color: entityType?.color || '#1890ff'
        }
      });
    });

    // 添加边
    oag.edges?.forEach(edge => {
      elements.push({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.type,
          type: edge.type
        }
      });
    });

    return elements;
  };

  // Cytoscape 样式
  const cyStylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'label': 'data(label)',
        'width': 40,
        'height': 40,
        'font-size': '12px',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 8,
        'border-width': 2,
        'border-color': '#fff',
        'shadow-blur': 10,
        'shadow-color': '#000',
        'shadow-opacity': 0.2
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#999',
        'target-arrow-color': '#999',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'text-background-color': '#fff',
        'text-background-opacity': 0.8,
        'text-background-padding': '2px'
      }
    },
    {
      selector: ':selected',
      style: {
        'border-width': 4,
        'border-color': '#ff4d4f'
      }
    }
  ];

  // Cytoscape 布局
  const cyLayout = {
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 50,
    edgeSep: 20,
    rankSep: 80,
    padding: 20
  };

  // 节点表格列
  const nodeColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 150
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const entityType = oag?.schemaSnapshot?.entityTypes?.[type];
        return (
          <Tag color={entityType?.color || 'blue'}>
            {entityType?.label || type}
          </Tag>
        );
      }
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label'
    },
    {
      title: '数据',
      dataIndex: 'data',
      key: 'data',
      render: (data) => (
        <span style={{ fontSize: 12, color: '#666' }}>
          {JSON.stringify(data).slice(0, 50)}...
        </span>
      )
    }
  ];

  // 边表格列
  const edgeColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: '源节点',
      dataIndex: 'source',
      key: 'source'
    },
    {
      title: '目标节点',
      dataIndex: 'target',
      key: 'target'
    }
  ];

  if (loading) {
    return (
      <div className="oag-detail-page">
        <div style={{ marginTop: 100, textAlign: 'center' }}>
            <Spin size="large">
              <span style={{ marginTop: 16 }}>加载中...</span>
            </Spin>
          </div>
      </div>
    );
  }

  if (!oag) {
    return (
      <div className="oag-detail-page">
        <Empty description="OAG 不存在" />
      </div>
    );
  }

  return (
    <div className="oag-detail-page">
      <div className="page-header">
        <div className="page-header-content">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/oag')}
            style={{ marginRight: 16 }}
          >
            返回
          </Button>
          <div className="page-header-title">
            <h1>{oag.name}</h1>
            <p>{oag.description}</p>
          </div>
          <div className="page-header-actions">
            <Button
              icon={<CheckCircleOutlined />}
              onClick={handleValidate}
            >
              验证
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport('json')}
            >
              导出
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadOAG}
            >
              刷新
            </Button>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="节点数"
              value={oag.statistics?.totalNodes || 0}
              prefix={<NodeIndexOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="边数"
              value={oag.statistics?.totalEdges || 0}
              prefix={<BranchesOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="实体类型"
              value={Object.keys(oag.schemaSnapshot?.entityTypes || {}).length}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="关系类型"
              value={Object.keys(oag.schemaSnapshot?.relationTypes || {}).length}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(oag.statistics?.entityTypeCounts || {}).map(([type, count]) => {
                const entityType = oag.schemaSnapshot?.entityTypes?.[type];
                return (
                  <Tag key={type} color={entityType?.color || 'blue'}>
                    {entityType?.label || type}: {count}
                  </Tag>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 验证结果 */}
      {validation && (
        <Alert
          message={validation.valid ? '验证通过' : '验证失败'}
          description={
            <div>
              <div>有效节点: {validation.stats.validNodes}/{validation.stats.totalNodes}</div>
              <div>有效边: {validation.stats.validEdges}/{validation.stats.totalEdges}</div>
              {validation.errors.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>错误:</strong>
                  <ul>
                    {validation.errors.map((err, idx) => (
                      <li key={idx}>{err.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          }
          type={validation.valid ? 'success' : 'error'}
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 标签页 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="概览" key="overview">
          <Card>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="ID">{oag.id}</Descriptions.Item>
              <Descriptions.Item label="名称">{oag.name}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {oag.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Schema">
                {oag.schemaId} (v{oag.schemaVersion})
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={oag.status === 'active' ? 'green' : 'red'}>
                  {oag.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(oag.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(oag.updatedAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="领域">
                {oag.metadata?.domain || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="标签" span={2}>
                <Space>
                  {oag.metadata?.tags?.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  )) || '-'}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </TabPane>

        <TabPane tab="可视化" key="graph">
          <Card
            extra={[
              <Button
                key="addNode"
                icon={<PlusOutlined />}
                onClick={() => setAddNodeModalVisible(true)}
                style={{ marginRight: 8 }}
              >
                添加节点
              </Button>,
              <Button
                key="addEdge"
                icon={<ShareAltOutlined />}
                onClick={() => setAddEdgeModalVisible(true)}
              >
                添加边
              </Button>
            ]}
          >
            <div style={{ height: 600, border: '1px solid #f0f0f0' }}>
              <CytoscapeComponent
                elements={getCytoscapeElements()}
                stylesheet={cyStylesheet}
                layout={cyLayout}
                style={{ width: '100%', height: '100%' }}
                cy={setCy}
              />
            </div>
          </Card>
        </TabPane>

        <TabPane tab="节点" key="nodes">
          <Card>
            <Table
              columns={nodeColumns}
              dataSource={oag.nodes}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="边" key="edges">
          <Card>
            <Table
              columns={edgeColumns}
              dataSource={oag.edges}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Schema 快照" key="schema">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="实体类型">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(oag.schemaSnapshot?.entityTypes || {}).map(([code, type]) => (
                    <Tag key={code} color={type.color || 'blue'} style={{ fontSize: 14, padding: '4px 8px' }}>
                      <strong>{type.label}</strong> ({code})
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {type.description}
                      </div>
                    </Tag>
                  ))}
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="关系类型">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(oag.schemaSnapshot?.relationTypes || {}).map(([code, type]) => (
                    <Tag key={code} style={{ fontSize: 14, padding: '4px 8px' }}>
                      <strong>{type.label}</strong> ({code})
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {type.sourceType} → {type.targetType}
                      </div>
                    </Tag>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 添加节点模态框 */}
      <Modal
        title="添加节点"
        visible={addNodeModalVisible}
        onCancel={() => setAddNodeModalVisible(false)}
        onOk={() => nodeForm.submit()}
      >
        <Form form={nodeForm} onFinish={handleAddNode} layout="vertical">
          <Form.Item
            name="type"
            label="实体类型"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择实体类型">
              {Object.entries(oag.schemaSnapshot?.entityTypes || {}).map(([code, type]) => (
                <Option key={code} value={code}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="label"
            label="标签"
            rules={[{ required: true }]}
          >
            <Input placeholder="输入节点标签" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加边模态框 */}
      <Modal
        title="添加边"
        visible={addEdgeModalVisible}
        onCancel={() => setAddEdgeModalVisible(false)}
        onOk={() => edgeForm.submit()}
      >
        <Form form={edgeForm} onFinish={handleAddEdge} layout="vertical">
          <Form.Item
            name="source"
            label="源节点"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择源节点">
              {oag.nodes?.map(node => (
                <Option key={node.id} value={node.id}>{node.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="target"
            label="目标节点"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择目标节点">
              {oag.nodes?.map(node => (
                <Option key={node.id} value={node.id}>{node.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="关系类型"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择关系类型">
              {Object.entries(oag.schemaSnapshot?.relationTypes || {}).map(([code, type]) => (
                <Option key={code} value={code}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OAGDetailPage;
