import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { Tag, Space, Dropdown, Button } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';

/**
 * 关系类型边组件
 */
const RelationTypeEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const { relationType, onEdit, onDelete } = data || {};
  
  // 计算贝塞尔曲线路径
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
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

  if (!relationType) return null;

  return (
    <>
      {/* 边线 */}
      <BaseEdge
        path={edgePath}
        className={`relation-edge ${selected ? 'selected' : ''}`}
        style={{
          stroke: selected ? '#ff4d4f' : '#722ed1',
          strokeWidth: selected ? 3 : 2,
        }}
      />
      
      {/* 标签 */}
      <EdgeLabelRenderer>
        <div
          className={`relation-label ${selected ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <Space>
            <Tag
              color={selected ? 'red' : 'purple'}
              icon={<LinkOutlined />}
              className="relation-tag"
            >
              {relationType.label}
            </Tag>
            
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                className="edge-more-btn"
              />
            </Dropdown>
          </Space>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(RelationTypeEdge);
