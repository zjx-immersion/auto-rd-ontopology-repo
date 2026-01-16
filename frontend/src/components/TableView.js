import React, { useState, useMemo } from 'react';
import { Table, Tabs, Tag, Input, Space, Button, Descriptions, Card, Collapse } from 'antd';
import { SearchOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import './TableView.css';

const { TabPane } = Tabs;
const { Search } = Input;
const { Panel } = Collapse;

const TableView = ({ data, schema, onNodeClick }) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('nodes');
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  // 渲染节点的所有属性
  const renderNodeProperties = (record) => {
    if (!record.data || Object.keys(record.data).length === 0) {
      return <div style={{ padding: '16px', color: '#8c8c8c' }}>该节点没有属性数据</div>;
    }

    const entityType = schema?.entityTypes?.[record.type];
    const propertyDefs = entityType?.properties || {};

    return (
      <Card size="small" title="节点属性详情" style={{ margin: '8px 0' }}>
        <Descriptions bordered size="small" column={2}>
          {Object.entries(record.data).map(([key, value]) => {
            const propDef = propertyDefs[key];
            let displayValue = value;
            
            if (value === null || value === undefined) {
              displayValue = '-';
            } else if (typeof value === 'boolean') {
              displayValue = value ? '是' : '否';
            } else if (Array.isArray(value)) {
              displayValue = value.join(', ');
            } else if (typeof value === 'object') {
              displayValue = JSON.stringify(value, null, 2);
            } else if (key.includes('date') || key.includes('Date')) {
              displayValue = new Date(value).toLocaleDateString('zh-CN');
            }

            return (
              <Descriptions.Item 
                key={key} 
                label={
                  <span>
                    <strong>{formatLabel(key)}</strong>
                    {propDef?.type && <Tag style={{ marginLeft: 8 }} color="blue">{propDef.type}</Tag>}
                  </span>
                }
              >
                {displayValue}
              </Descriptions.Item>
            );
          })}
        </Descriptions>
      </Card>
    );
  };

  // 节点表格列定义
  const nodeColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      fixed: 'left',
      render: (text) => (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a onClick={() => onNodeClick({ id: text })} style={{ fontWeight: 500 }}>{text}</a>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      filters: schema?.entityTypes ? Object.keys(schema.entityTypes).map(key => ({
        text: schema.entityTypes[key].label || key,
        value: key
      })) : [],
      onFilter: (value, record) => record.type === value,
      render: (type) => {
        const entityType = schema?.entityTypes?.[type];
        return (
          <Tag color={entityType?.color || '#1890ff'}>
            {entityType?.label || type}
          </Tag>
        );
      }
    },
    {
      title: '标题/名称',
      dataIndex: 'label',
      key: 'label',
      width: 220,
      render: (_, record) => {
        return record.data?.title || record.data?.name || record.data?.project_name || record.data?.module_name || '-';
      }
    },
    {
      title: '状态',
      dataIndex: ['data', 'status'],
      key: 'status',
      width: 100,
      render: (status) => status ? <Tag color="green">{status}</Tag> : '-'
    },
    {
      title: '负责人',
      dataIndex: ['data', 'owner'],
      key: 'owner',
      width: 100,
      render: (owner, record) => owner || record.data?.PM || record.data?.domainPM || '-'
    },
    {
      title: '优先级',
      dataIndex: ['data', 'priority'],
      key: 'priority',
      width: 100,
      filters: [
        { text: 'P0', value: 'P0' },
        { text: 'P1', value: 'P1' },
        { text: 'P2', value: 'P2' },
      ],
      onFilter: (value, record) => record.data?.priority === value,
      render: (priority) => {
        if (!priority) return '-';
        const color = priority === 'P0' ? 'red' : priority === 'P1' ? 'orange' : 'blue';
        return <Tag color={color}>{priority}</Tag>;
      }
    },
    {
      title: '属性数量',
      key: 'propertyCount',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const count = record.data ? Object.keys(record.data).length : 0;
        return <Tag color="cyan">{count}</Tag>;
      }
    }
  ];

  // 渲染边的对象属性
  const renderEdgeProperties = (record) => {
    const relationType = schema?.relationTypes?.[record.type];
    const propertyDefs = relationType?.properties || {};
    const edgeData = record.data || {};

    if (Object.keys(edgeData).length === 0 && Object.keys(propertyDefs).length === 0) {
      return <div style={{ padding: '16px', color: '#8c8c8c' }}>该关系没有对象属性</div>;
    }

    return (
      <Card size="small" title="对象属性详情" style={{ margin: '8px 0' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* 关系基本信息 */}
          <Descriptions bordered size="small" column={2} title="关系信息">
            <Descriptions.Item label="关系类型">
              <Tag color="green">{relationType?.label || record.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="关系描述">
              {relationType?.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="源节点">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a onClick={() => onNodeClick({ id: record.source })}>{record.source}</a>
            </Descriptions.Item>
            <Descriptions.Item label="目标节点">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a onClick={() => onNodeClick({ id: record.target })}>{record.target}</a>
            </Descriptions.Item>
          </Descriptions>

          {/* 对象属性 */}
          {Object.keys(edgeData).length > 0 && (
            <Descriptions bordered size="small" column={2} title="对象属性值">
              {Object.entries(edgeData).map(([key, value]) => {
                const propDef = propertyDefs[key];
                let displayValue = value;
                
                if (value === null || value === undefined) {
                  displayValue = '-';
                } else if (typeof value === 'boolean') {
                  displayValue = value ? <Tag color="success">是</Tag> : <Tag>否</Tag>;
                } else if (Array.isArray(value)) {
                  displayValue = value.join(', ');
                } else if (typeof value === 'object') {
                  displayValue = JSON.stringify(value, null, 2);
                } else if (key.includes('date') || key.includes('Date')) {
                  displayValue = new Date(value).toLocaleDateString('zh-CN');
                } else if (key.includes('percentage') || key.includes('ratio')) {
                  displayValue = `${value}%`;
                }

                return (
                  <Descriptions.Item 
                    key={key} 
                    label={
                      <span>
                        <strong>{propDef?.description || formatLabel(key)}</strong>
                        {propDef?.type && <Tag style={{ marginLeft: 8 }} color="purple">{propDef.type}</Tag>}
                      </span>
                    }
                  >
                    {displayValue}
                  </Descriptions.Item>
                );
              })}
            </Descriptions>
          )}

          {/* Schema中定义但未赋值的属性 */}
          {Object.keys(propertyDefs).length > 0 && (
            <Collapse size="small">
              <Panel header="Schema定义的属性" key="schema">
                <Descriptions bordered size="small" column={1}>
                  {Object.entries(propertyDefs).map(([key, propDef]) => (
                    <Descriptions.Item 
                      key={key} 
                      label={<strong>{propDef.description || key}</strong>}
                    >
                      <Space>
                        <Tag color="blue">{propDef.type}</Tag>
                        {propDef.values && <span>可选值: {propDef.values.join(', ')}</span>}
                        {edgeData[key] === undefined && <Tag color="red">未设置</Tag>}
                      </Space>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Panel>
            </Collapse>
          )}
        </Space>
      </Card>
    );
  };

  // 关系表格列定义
  const edgeColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      fixed: 'left',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '关系类型',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      filters: schema?.relationTypes ? Object.keys(schema.relationTypes).map(key => ({
        text: schema.relationTypes[key].label || key,
        value: key
      })) : [],
      onFilter: (value, record) => record.type === value,
      render: (type) => {
        const relationType = schema?.relationTypes?.[type];
        return (
          <Tag color="green">
            {relationType?.label || type}
          </Tag>
        );
      }
    },
    {
      title: '源节点',
      dataIndex: 'source',
      key: 'source',
      width: 180,
      render: (text) => (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a onClick={() => onNodeClick({ id: text })} style={{ fontWeight: 500 }}>{text}</a>
      )
    },
    {
      title: '→',
      key: 'arrow',
      width: 40,
      align: 'center',
      render: () => <span style={{ fontSize: '16px', color: '#52c41a' }}>→</span>
    },
    {
      title: '目标节点',
      dataIndex: 'target',
      key: 'target',
      width: 180,
      render: (text) => (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a onClick={() => onNodeClick({ id: text })} style={{ fontWeight: 500 }}>{text}</a>
      )
    },
    {
      title: '对象属性',
      key: 'propertyCount',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const count = record.data ? Object.keys(record.data).length : 0;
        const hasSchemaProps = schema?.relationTypes?.[record.type]?.properties;
        return (
          <Space>
            <Tag color={count > 0 ? 'cyan' : 'default'}>{count} 个</Tag>
            {hasSchemaProps && <Tag color="purple">已定义</Tag>}
          </Space>
        );
      }
    },
    {
      title: '关键属性',
      key: 'keyProperties',
      width: 250,
      render: (_, record) => {
        if (!record.data || Object.keys(record.data).length === 0) return '-';
        
        // 显示前3个重要属性
        const priorityKeys = ['priority', 'status', 'progress', 'completion_percentage', 'complexity', 'split_ratio'];
        const displayProps = [];
        
        for (const key of priorityKeys) {
          if (record.data[key] !== undefined && displayProps.length < 3) {
            let value = record.data[key];
            if (typeof value === 'boolean') {
              value = value ? '是' : '否';
            }
            displayProps.push(`${formatLabel(key)}: ${value}`);
          }
        }
        
        // 如果没有优先属性，显示前3个属性
        if (displayProps.length === 0) {
          const keys = Object.keys(record.data).slice(0, 3);
          keys.forEach(key => {
            let value = record.data[key];
            if (typeof value === 'boolean') {
              value = value ? '是' : '否';
            } else if (typeof value === 'object') {
              value = JSON.stringify(value);
            }
            displayProps.push(`${formatLabel(key)}: ${value}`);
          });
        }
        
        return displayProps.length > 0 ? displayProps.join(' | ') : '-';
      }
    }
  ];

  // 过滤数据
  const filteredNodes = useMemo(() => {
    if (!searchText) return data.nodes || [];
    return (data.nodes || []).filter(node => 
      node.id.toLowerCase().includes(searchText.toLowerCase()) ||
      node.type.toLowerCase().includes(searchText.toLowerCase()) ||
      JSON.stringify(node.data).toLowerCase().includes(searchText.toLowerCase())
    );
  }, [data.nodes, searchText]);

  const filteredEdges = useMemo(() => {
    if (!searchText) return data.edges || [];
    return (data.edges || []).filter(edge => 
      edge.id.toLowerCase().includes(searchText.toLowerCase()) ||
      edge.type.toLowerCase().includes(searchText.toLowerCase()) ||
      edge.source.toLowerCase().includes(searchText.toLowerCase()) ||
      edge.target.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [data.edges, searchText]);

  return (
    <div className="table-view-container">
      <div className="table-view-header">
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索节点或关系..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
            size="large"
          />
          <Button onClick={() => setSearchText('')} size="large">清除</Button>
          <Button 
            type="primary" 
            onClick={() => setExpandedRowKeys([])} 
            size="large"
          >
            收起所有
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="table-view-tabs">
        <TabPane tab={`节点 (${filteredNodes.length})`} key="nodes">
          <Table
            columns={nodeColumns}
            dataSource={filteredNodes}
            rowKey="id"
            size="small"
            scroll={{ x: 1300, y: 'calc(100vh - 280px)' }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total) => `共 ${total} 条记录`
            }}
            expandable={{
              expandedRowRender: renderNodeProperties,
              expandedRowKeys: expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
              expandIcon: ({ expanded, onExpand, record }) => (
                expanded ? 
                  <DownOutlined onClick={e => onExpand(record, e)} style={{ cursor: 'pointer' }} /> : 
                  <RightOutlined onClick={e => onExpand(record, e)} style={{ cursor: 'pointer' }} />
              )
            }}
          />
        </TabPane>
        <TabPane tab={`关系/对象属性 (${filteredEdges.length})`} key="edges">
          <Table
            columns={edgeColumns}
            dataSource={filteredEdges}
            rowKey="id"
            size="small"
            scroll={{ x: 1200, y: 'calc(100vh - 280px)' }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total) => `共 ${total} 条记录`
            }}
            expandable={{
              expandedRowRender: renderEdgeProperties,
              expandedRowKeys: expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
              expandIcon: ({ expanded, onExpand, record }) => (
                expanded ? 
                  <DownOutlined onClick={e => onExpand(record, e)} style={{ cursor: 'pointer', color: '#52c41a' }} /> : 
                  <RightOutlined onClick={e => onExpand(record, e)} style={{ cursor: 'pointer', color: '#52c41a' }} />
              )
            }}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

// 格式化标签的辅助函数
const formatLabel = (key) => {
  const labelMap = {
    // 通用
    'id': 'ID',
    'name': '名称',
    'title': '标题',
    'status': '状态',
    'priority': '优先级',
    'owner': '负责人',
    'description': '描述',
    
    // 项目相关
    'project_id': '项目ID',
    'project_name': '项目名称',
    'platform': '平台',
    'PM': '项目经理',
    'domainPM': '领域PM',
    'model': '车型',
    'sopDate': 'SOP日期',
    'vehicleProjectId': '车型项目ID',
    
    // 需求相关
    'ssts_id': '需求ID',
    'epic_id': 'Epic ID',
    'req_type': '需求类型',
    'milestone': '里程碑',
    'completion_rate': '完成率',
    'upstream_ssts': '上游需求',
    'domain': '领域',
    'businessValue': '业务价值',
    
    // 开发相关
    'module': '模块',
    'module_name': '模块名称',
    'estimated_hours': '预估工时',
    'storyPoints': '故事点',
    'assignee': '分配给',
    
    // 版本相关
    'version': '版本',
    'version_number': '版本号',
    'release_date': '发布日期',
    'build_status': '构建状态',
    'test_status': '测试状态',
    
    // 对象属性
    'allocation_date': '分配日期',
    'split_ratio': '拆分占比',
    'priority_inherit': '优先级继承',
    'split_date': '拆分日期',
    'conversion_date': '转换日期',
    'estimated_effort': '预估工作量',
    'complexity': '复杂度',
    'completion_percentage': '完成百分比',
    'lines_changed': '代码行数变更',
    'implementation_note': '实现说明',
    'baseline_version': '基线版本号',
    'freeze_date': '冻结日期',
    'change_allowed': '是否允许变更'
  };

  return labelMap[key] || key;
};

export default TableView;

