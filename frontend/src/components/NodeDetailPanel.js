import React, { useState, useEffect, useMemo } from 'react';
import { Card, Descriptions, Button, Space, Select, InputNumber, message, Collapse, Tag, Spin } from 'antd';
import { CloseOutlined, BranchesOutlined, ApartmentOutlined, EditOutlined } from '@ant-design/icons';
import { traceEntity, fetchObjectProperties } from '../services/api';
import ObjectPropertyEditor from './ObjectPropertyEditor';
import './NodeDetailPanel.css';

const { Option } = Select;
const { Panel } = Collapse;

const NodeDetailPanel = ({ node, data, schema, onClose, onTrace }) => {
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState('full_trace');
  const [depth, setDepth] = useState(3);
  const [objectProperties, setObjectProperties] = useState(null);
  const [loadingProps, setLoadingProps] = useState(false);
  const [editingEdge, setEditingEdge] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);

  // 从完整数据中获取节点信息
  const fullNodeData = useMemo(() => {
    if (!node || !data || !data.nodes) return node;
    
    // 从data.nodes中查找完整的节点数据
    const fullNode = data.nodes.find(n => n.id === node.id);
    if (fullNode) {
      return {
        ...node,
        label: fullNode.label || node.label || node.id,
        data: fullNode.data || node.data || {},
        type: fullNode.type || node.type
      };
    }
    return node;
  }, [node, data]);

  // 加载对象属性
  const loadObjectProperties = async () => {
    if (!fullNodeData?.id) return;
    try {
      setLoadingProps(true);
      const result = await fetchObjectProperties(fullNodeData.id);
      setObjectProperties(result);
    } catch (error) {
      console.error('加载对象属性失败:', error);
      // 静默失败，不影响其他功能
    } finally {
      setLoadingProps(false);
    }
  };

  useEffect(() => {
    if (fullNodeData?.id) {
      loadObjectProperties();
    }
  }, [fullNodeData?.id]);

  const handleEditProperty = (edge) => {
    setEditingEdge(edge);
    setEditorVisible(true);
  };

  const handleEditorClose = () => {
    setEditorVisible(false);
    setEditingEdge(null);
  };

  const handleEditorSuccess = () => {
    // 重新加载对象属性
    loadObjectProperties();
  };

  const handleTrace = async () => {
    try {
      setLoading(true);
      console.log('开始追溯查询:', { nodeId: fullNodeData?.id, queryType, depth });
      const result = await traceEntity(fullNodeData?.id, queryType, depth);
      console.log('追溯查询结果:', result);
      message.success('追溯查询成功');
      onTrace(result.data);
    } catch (error) {
      console.error('追溯查询失败:', error);
      message.error('追溯查询失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProperties = () => {
    if (!fullNodeData || !fullNodeData.data || Object.keys(fullNodeData.data).length === 0) {
      return <Descriptions.Item label="属性">暂无属性数据</Descriptions.Item>;
    }

    return Object.entries(fullNodeData.data).map(([key, value]) => {
      let displayValue = value;
      
      if (typeof value === 'boolean') {
        displayValue = value ? '是' : '否';
      } else if (Array.isArray(value)) {
        displayValue = value.join(', ');
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value);
      }

      return (
        <Descriptions.Item key={key} label={formatLabel(key)}>
          {displayValue}
        </Descriptions.Item>
      );
    });
  };

  const renderObjectProperties = () => {
    if (loadingProps) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="small" />
        </div>
      );
    }

    if (!objectProperties) return null;

    const { outgoing, incoming } = objectProperties;
    const hasRelations = (outgoing && outgoing.length > 0) || (incoming && incoming.length > 0);

    if (!hasRelations) {
      return <div style={{ color: '#8c8c8c', fontSize: '12px' }}>暂无关系</div>;
    }

    return (
      <Collapse size="small" defaultActiveKey={['outgoing']}>
        {outgoing && outgoing.length > 0 && (
          <Panel header={`出边关系 (${outgoing.length})`} key="outgoing">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {outgoing.map((rel, idx) => (
                <Card 
                  key={idx} 
                  size="small" 
                  style={{ background: '#fafafa' }}
                  extra={
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<EditOutlined />}
                      onClick={() => handleEditProperty(rel.edge)}
                    >
                      编辑
                    </Button>
                  }
                >
                  <div style={{ marginBottom: 4 }}>
                    <Tag color="blue">{rel.relationLabel}</Tag>
                    <span style={{ fontSize: '12px' }}> → </span>
                    <span style={{ fontWeight: 500 }}>{rel.targetNode?.id}</span>
                  </div>
                  {rel.properties && Object.keys(rel.properties).length > 0 && (
                    <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
                      {Object.entries(rel.properties).map(([key, value]) => (
                        <Descriptions.Item 
                          key={key} 
                          label={formatLabel(key)}
                          labelStyle={{ fontSize: '11px', width: '100px' }}
                          contentStyle={{ fontSize: '11px' }}
                        >
                          {formatPropertyValue(value, key)}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  )}
                </Card>
              ))}
            </Space>
          </Panel>
        )}
        {incoming && incoming.length > 0 && (
          <Panel header={`入边关系 (${incoming.length})`} key="incoming">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {incoming.map((rel, idx) => (
                <Card 
                  key={idx} 
                  size="small" 
                  style={{ background: '#fafafa' }}
                  extra={
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<EditOutlined />}
                      onClick={() => handleEditProperty(rel.edge)}
                    >
                      编辑
                    </Button>
                  }
                >
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{rel.sourceNode?.id}</span>
                    <span style={{ fontSize: '12px' }}> → </span>
                    <Tag color="green">{rel.relationLabel}</Tag>
                  </div>
                  {rel.properties && Object.keys(rel.properties).length > 0 && (
                    <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
                      {Object.entries(rel.properties).map(([key, value]) => (
                        <Descriptions.Item 
                          key={key} 
                          label={formatLabel(key)}
                          labelStyle={{ fontSize: '11px', width: '100px' }}
                          contentStyle={{ fontSize: '11px' }}
                        >
                          {formatPropertyValue(value, key)}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  )}
                </Card>
              ))}
            </Space>
          </Panel>
        )}
      </Collapse>
    );
  };

  const entityType = schema?.entityTypes?.[fullNodeData?.type];

  return (
    <div className="node-detail-panel">
      <Card
        title={
          <Space>
            <span style={{ color: entityType?.color || '#1890ff' }}>
              {entityType?.label || fullNodeData?.type}
            </span>
            <span>-</span>
            <span>{fullNodeData?.id || fullNodeData?.label}</span>
          </Space>
        }
        extra={
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={onClose}
          />
        }
        size="small"
      >
        <Descriptions 
          column={1} 
          size="small"
          bordered
        >
          {renderProperties()}
        </Descriptions>

        <div style={{ marginTop: 16 }}>
          <Card 
            title={
              <Space>
                <ApartmentOutlined />
                <span>对象属性关系</span>
              </Space>
            }
            size="small"
            style={{ marginBottom: 16 }}
          >
            {renderObjectProperties()}
          </Card>

          <Card 
            title="需求追溯" 
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span style={{ marginRight: 8 }}>查询类型:</span>
                <Select 
                  value={queryType} 
                  onChange={setQueryType}
                  style={{ width: '100%' }}
                >
                  <Option value="full_trace">完整追溯</Option>
                  <Option value="impact_analysis">影响分析</Option>
                  <Option value="downstream_tasks">下游任务</Option>
                </Select>
              </div>
              <div>
                <span style={{ marginRight: 8 }}>追溯深度:</span>
                <InputNumber 
                  min={1} 
                  max={5} 
                  value={depth} 
                  onChange={setDepth}
                  style={{ width: '100%' }}
                />
              </div>
              <Button 
                type="primary" 
                icon={<BranchesOutlined />}
                onClick={handleTrace}
                loading={loading}
                block
              >
                执行追溯查询
              </Button>
            </Space>
          </Card>
        </div>
      </Card>

      <ObjectPropertyEditor
        visible={editorVisible}
        edge={editingEdge}
        schema={schema}
        onClose={handleEditorClose}
        onSuccess={handleEditorSuccess}
      />
    </div>
  );
};

// 格式化标签
const formatLabel = (key) => {
  const labelMap = {
    'project_id': '项目ID',
    'project_name': '项目名称',
    'platform': '平台',
    'PM': '项目经理',
    'status': '状态',
    'ssts_id': '需求ID',
    'title': '标题',
    'req_type': '需求类型',
    'priority': '优先级',
    'milestone': '里程碑',
    'completion_rate': '完成率',
    'sys_id': '架构ID',
    'upstream_ssts': '上游需求',
    'swr_id': '软件需求ID',
    'upstream_sys': '上游架构',
    'module': '模块',
    'owner': '负责人',
    'estimated_hours': '预估工时',
    'acceptance_criteria': '验收标准',
    'module_id': '模块ID',
    'module_name': '模块名称',
    'version_id': '版本ID',
    'version_number': '版本号',
    'model_type': '模型类型',
    'accuracy': '准确率',
    'training_days': '训练天数',
    'release_date': '发布日期',
    'package_id': '发布包ID',
    'version': '版本',
    'release_type': '发布类型',
    'build_status': '构建状态',
    'test_status': '测试状态'
  };

  return labelMap[key] || key;
};

// 格式化属性值
const formatPropertyValue = (value, key) => {
  if (value === null || value === undefined) return '-';
  
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  
  if (typeof value === 'number') {
    if (key.includes('percentage') || key.includes('rate') || key.includes('ratio')) {
      return `${value}%`;
    }
    return value;
  }
  
  if (value instanceof Date || key.includes('date') || key.includes('Date')) {
    return new Date(value).toLocaleDateString('zh-CN');
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
};

export default NodeDetailPanel;
