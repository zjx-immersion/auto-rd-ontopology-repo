import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Tag, Space, Dropdown, Button } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined } from '@ant-design/icons';

/**
 * 实体类型节点组件
 */
const EntityTypeNode = ({ data, selected }) => {
  const { entityType, onEdit, onDelete } = data;
  
  // 属性数量
  const propertyCount = Object.keys(entityType.properties || {}).length;
  
  // 下拉菜单
  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: onEdit,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: onDelete,
    },
  ];

  return (
    <div className={`entity-type-node ${selected ? 'selected' : ''}`}>
      {/* 连接点 - 顶部 */}
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
      />
      
      {/* 节点内容 */}
      <Card
        size="small"
        className="entity-card"
        style={{
          borderColor: entityType.color || '#1890ff',
          borderWidth: 2,
          minWidth: 140,
          maxWidth: 200,
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <div className="entity-header">
          <Space>
            <DatabaseOutlined style={{ color: entityType.color || '#1890ff' }} />
            <span className="entity-label" title={entityType.label}>
              {entityType.label}
            </span>
          </Space>
          
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="more-btn"
            />
          </Dropdown>
        </div>
        
        {entityType.description && (
          <div className="entity-description" title={entityType.description}>
            {entityType.description.length > 20 
              ? entityType.description.substring(0, 20) + '...' 
              : entityType.description}
          </div>
        )}
        
        <div className="entity-footer">
          <Tag size="small" color={entityType.color || '#1890ff'}>
            {propertyCount} 属性
          </Tag>
          {entityType.isAbstract && (
            <Tag size="small" color="orange">抽象</Tag>
          )}
        </div>
      </Card>
      
      {/* 连接点 - 底部 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
      />
      
      {/* 连接点 - 左侧 */}
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle"
      />
      
      {/* 连接点 - 右侧 */}
      <Handle
        type="source"
        position={Position.Right}
        className="node-handle"
      />
    </div>
  );
};

export default memo(EntityTypeNode);
