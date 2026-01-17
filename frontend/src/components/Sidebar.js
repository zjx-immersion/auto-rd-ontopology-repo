import React from 'react';
import { Card, Statistic, Row, Col, Tag, Input, Space } from 'antd';
import { 
  NodeIndexOutlined, 
  BranchesOutlined,
  SearchOutlined 
} from '@ant-design/icons';
import './Sidebar.css';

const { Search } = Input;

const Sidebar = ({ schema, statistics, onSearch }) => {
  const renderEntityTypes = () => {
    if (!schema || !schema.entityTypes || !statistics?.entity_counts) return null;

    // 只显示实际使用的类型（数量>0），并按数量排序
    const entityTypesList = Object.entries(schema.entityTypes)
      .map(([key, entity]) => ({
        key,
        entity,
        count: statistics.entity_counts[key] || 0
      }))
      .filter(item => item.count > 0) // 只显示有数据的类型
      .sort((a, b) => b.count - a.count); // 按数量降序排列

    if (entityTypesList.length === 0) {
      return <div style={{ color: '#999', fontSize: 12, padding: '8px 0' }}>暂无数据</div>;
    }

    return entityTypesList.map(({ key, entity, count }) => (
      <div key={key} className="entity-type-item">
        <Tag color={entity.color || '#1890ff'}>
          {entity.label || key}
        </Tag>
        <span className="entity-count">
          {count}
        </span>
      </div>
    ));
  };

  const renderLegend = () => {
    if (!schema || !schema.entityTypes) {
      return <div style={{ color: '#999', fontSize: 12 }}>暂无Schema定义</div>;
    }

    return Object.entries(schema.entityTypes).map(([key, entity]) => (
      <div key={key} className="legend-item">
        <div 
          className="legend-color" 
          style={{ background: entity.color || '#1890ff' }}
        ></div>
        <span>{entity.label || key}</span>
        {entity.description && (
          <span 
            className="legend-desc" 
            style={{ fontSize: 11, color: '#999', marginLeft: 4 }}
            title={entity.description}
          >
            ({entity.description.length > 10 ? entity.description.substring(0, 10) + '...' : entity.description})
          </span>
        )}
      </div>
    ));
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-content">
        <Card size="small" title="搜索" style={{ marginBottom: 10 }}>
          <Search 
            placeholder="搜索节点..." 
            onSearch={onSearch}
            enterButton={<SearchOutlined />}
            size="small"
          />
        </Card>

        <Card size="small" title="统计信息" style={{ marginBottom: 10 }}>
          <Row gutter={10}>
            <Col span={12}>
              <Statistic 
                title="节点数" 
                value={statistics?.total_nodes || 0}
                prefix={<NodeIndexOutlined />}
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="关系数" 
                value={statistics?.total_edges || 0}
                prefix={<BranchesOutlined />}
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
          </Row>
        </Card>

        <Card size="small" title="实体类型" style={{ marginBottom: 10 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {renderEntityTypes()}
          </Space>
        </Card>

        <Card size="small" title="图例说明">
          {renderLegend()}
        </Card>
      </div>
    </div>
  );
};

export default Sidebar;
