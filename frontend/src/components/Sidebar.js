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
    if (!schema || !schema.entityTypes) return null;

    return Object.entries(schema.entityTypes).map(([key, entity]) => (
      <div key={key} className="entity-type-item">
        <Tag color={entity.color || '#1890ff'}>
          {entity.label || key}
        </Tag>
        <span className="entity-count">
          {statistics?.entity_counts?.[key] || 0}
        </span>
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
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#1890ff' }}></div>
            <span>车型项目</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#52c41a' }}></div>
            <span>系统需求</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#eb2f96' }}></div>
            <span>软件需求</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#722ed1' }}></div>
            <span>开发模块</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#13c2c2' }}></div>
            <span>模型版本</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Sidebar;
