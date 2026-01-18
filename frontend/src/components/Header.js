import React from 'react';
import { Space, Button, Typography, Segmented } from 'antd';
import {
  ReloadOutlined,
  ImportOutlined,
  ApiOutlined,
  GithubOutlined,
  AppstoreOutlined,
  TableOutlined,
  ApartmentOutlined,
  HeatMapOutlined,
  DashboardOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import './Header.css';

const { Title } = Typography;

const Header = ({ onRefresh, onImport, viewMode, onViewModeChange, graphName }) => {
  return (
    <div className="header-container">
      <div className="header-left">
        <ApiOutlined style={{ fontSize: 28, color: '#1890ff' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Title level={3} style={{ margin: 0, color: '#ffffff', fontSize: '20px', fontWeight: 600 }}>
            岚图智能驾驶知识图谱系统
          </Title>
          {graphName && (
            <span style={{ color: '#91d5ff', fontSize: '12px', marginTop: '2px' }}>
              当前图谱: {graphName}
            </span>
          )}
        </div>
      </div>

      <Space size="middle">
        <Segmented
          value={viewMode}
          onChange={onViewModeChange}
          options={[
            {
              label: '图谱',
              value: 'graph',
              icon: <AppstoreOutlined />,
            },
            {
              label: '表格',
              value: 'table',
              icon: <TableOutlined />,
            },
            {
              label: '树形',
              value: 'tree',
              icon: <ApartmentOutlined />,
            },
            {
              label: '矩阵',
              value: 'matrix',
              icon: <HeatMapOutlined />,
            },
            {
              label: '仪表盘',
              value: 'dashboard',
              icon: <DashboardOutlined />,
            },
            {
              label: 'Schema',
              value: 'schema',
              icon: <DatabaseOutlined />,
            },
          ]}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          type="text"
          style={{ color: '#fff', fontSize: '14px' }}
        >
          刷新数据
        </Button>
        <Button
          icon={<ImportOutlined />}
          onClick={onImport}
          type="primary"
          size="middle"
        >
          导入数据
        </Button>
        <Button
          icon={<GithubOutlined />}
          href="https://github.com"
          target="_blank"
          type="text"
          style={{ color: '#fff', fontSize: '18px' }}
        />
      </Space>
    </div>
  );
};

export default Header;
