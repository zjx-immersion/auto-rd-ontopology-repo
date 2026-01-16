import React from 'react';
import { Space, Button, Typography, Switch } from 'antd';
import {
  ReloadOutlined,
  ImportOutlined,
  ApiOutlined,
  GithubOutlined,
  AppstoreOutlined,
  TableOutlined
} from '@ant-design/icons';
import './Header.css';

const { Title } = Typography;

const Header = ({ onRefresh, onImport, viewMode, onViewModeChange }) => {
  return (
    <div className="header-container">
      <div className="header-left">
        <ApiOutlined style={{ fontSize: 28, color: '#1890ff' }} />
        <Title level={3} style={{ margin: 0, color: '#ffffff', fontSize: '20px', fontWeight: 600 }}>
          岚图智能驾驶知识图谱系统
        </Title>
      </div>

      <Space size="middle">
        <Space>
          <AppstoreOutlined style={{ color: viewMode === 'graph' ? '#1890ff' : '#8c8c8c', fontSize: '16px' }} />
          <Switch
            checked={viewMode === 'table'}
            onChange={(checked) => onViewModeChange(checked ? 'table' : 'graph')}
            checkedChildren="表格"
            unCheckedChildren="图谱"
          />
          <TableOutlined style={{ color: viewMode === 'table' ? '#1890ff' : '#8c8c8c', fontSize: '16px' }} />
        </Space>
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
