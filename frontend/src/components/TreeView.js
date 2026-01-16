import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Card, Tabs, Input, Space, Button, Empty, Spin } from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  FolderOutlined, 
  FileOutlined,
  NodeIndexOutlined 
} from '@ant-design/icons';
import './TreeView.css';

const { TabPane } = Tabs;
const { Search } = Input;

const TreeView = ({ data, schema, onNodeSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [activeTab, setActiveTab] = useState('class');

  // 构建类层次树
  const classHierarchyTree = useMemo(() => {
    if (!schema?.entityTypes) return [];

    const entityTypes = schema.entityTypes;
    const rootNodes = [];
    const typeMap = new Map();

    // 第一步：创建所有类型节点
    Object.entries(entityTypes).forEach(([typeId, typeDef]) => {
      const instanceCount = data?.nodes?.filter(n => n.type === typeId).length || 0;
      
      const node = {
        key: `class-${typeId}`,
        title: `${typeDef.label || typeId} (${instanceCount})`,
        icon: <FolderOutlined />,
        typeId: typeId,
        children: [],
        isLeaf: false
      };
      
      typeMap.set(typeId, node);
    });

    // 第二步：构建层次关系（基于 extends 字段）
    Object.entries(entityTypes).forEach(([typeId, typeDef]) => {
      const node = typeMap.get(typeId);
      
      if (typeDef.extends) {
        // 如果有父类，添加到父类的 children
        const parentNode = typeMap.get(typeDef.extends);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // 父类不存在，作为根节点
          rootNodes.push(node);
        }
      } else {
        // 没有父类，作为根节点
        rootNodes.push(node);
      }
    });

    return rootNodes.length > 0 ? rootNodes : Array.from(typeMap.values());
  }, [schema, data]);

  // 构建实例树
  const instanceTree = useMemo(() => {
    if (!data?.nodes || !schema?.entityTypes) return [];

    const entityTypes = schema.entityTypes;
    const typeGroups = new Map();

    // 按类型分组节点
    data.nodes.forEach(node => {
      if (!typeGroups.has(node.type)) {
        typeGroups.set(node.type, []);
      }
      typeGroups.get(node.type).push(node);
    });

    // 构建树结构
    const treeData = [];
    Object.entries(entityTypes).forEach(([typeId, typeDef]) => {
      const instances = typeGroups.get(typeId) || [];
      
      if (instances.length === 0) return;

      const typeNode = {
        key: `type-${typeId}`,
        title: `${typeDef.label || typeId} (${instances.length})`,
        icon: <FolderOutlined />,
        children: instances.map(instance => ({
          key: `instance-${instance.id}`,
          title: instance.label || instance.id,
          icon: <FileOutlined />,
          nodeId: instance.id,
          nodeData: instance,
          isLeaf: true
        }))
      };

      treeData.push(typeNode);
    });

    return treeData;
  }, [data, schema]);

  // 获取当前活动的树数据
  const getCurrentTreeData = () => {
    return activeTab === 'class' ? classHierarchyTree : instanceTree;
  };

  // 搜索过滤
  const filteredTreeData = useMemo(() => {
    if (!searchTerm) return getCurrentTreeData();

    const filterTree = (nodes) => {
      return nodes.map(node => {
        const titleStr = typeof node.title === 'string' ? node.title : node.title?.props?.children;
        const matches = titleStr?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (node.children && node.children.length > 0) {
          const filteredChildren = filterTree(node.children);
          if (filteredChildren.length > 0 || matches) {
            return { ...node, children: filteredChildren };
          }
        } else if (matches) {
          return node;
        }
        
        return null;
      }).filter(Boolean);
    };

    return filterTree(getCurrentTreeData());
  }, [searchTerm, activeTab, classHierarchyTree, instanceTree]);

  // 自动展开搜索结果
  useEffect(() => {
    if (searchTerm) {
      const getExpandKeys = (nodes, keys = []) => {
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            keys.push(node.key);
            getExpandKeys(node.children, keys);
          }
        });
        return keys;
      };
      
      const keys = getExpandKeys(filteredTreeData);
      setExpandedKeys(keys);
      setAutoExpandParent(true);
    }
  }, [searchTerm, filteredTreeData]);

  // 树节点点击
  const onSelect = (selectedKeys, info) => {
    setSelectedKeys(selectedKeys);
    
    // 如果是实例节点，触发节点选择回调
    if (info.node.nodeId && onNodeSelect) {
      onNodeSelect(info.node.nodeData);
    }
  };

  // 树节点展开/折叠
  const onExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
    setAutoExpandParent(false);
  };

  // 重置视图
  const handleReset = () => {
    setSearchTerm('');
    setExpandedKeys([]);
    setSelectedKeys([]);
    setAutoExpandParent(true);
  };

  // 全部展开
  const handleExpandAll = () => {
    const getAllKeys = (nodes, keys = []) => {
      nodes.forEach(node => {
        if (!node.isLeaf) {
          keys.push(node.key);
          if (node.children) {
            getAllKeys(node.children, keys);
          }
        }
      });
      return keys;
    };
    
    const allKeys = getAllKeys(getCurrentTreeData());
    setExpandedKeys(allKeys);
  };

  // 全部折叠
  const handleCollapseAll = () => {
    setExpandedKeys([]);
  };

  return (
    <Card 
      className="tree-view-card"
      title={
        <Space>
          <NodeIndexOutlined />
          <span>树形视图</span>
        </Space>
      }
      extra={
        <Space>
          <Button size="small" onClick={handleExpandAll}>全部展开</Button>
          <Button size="small" onClick={handleCollapseAll}>全部折叠</Button>
          <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="类层次" key="class">
          <div className="tree-view-content">
            <Search
              placeholder="搜索类型..."
              allowClear
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            {filteredTreeData.length > 0 ? (
              <Tree
                showIcon
                showLine={{ showLeafIcon: false }}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                autoExpandParent={autoExpandParent}
                onExpand={onExpand}
                onSelect={onSelect}
                treeData={filteredTreeData}
              />
            ) : (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </TabPane>
        
        <TabPane tab="实例树" key="instance">
          <div className="tree-view-content">
            <Search
              placeholder="搜索实例..."
              allowClear
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            {filteredTreeData.length > 0 ? (
              <Tree
                showIcon
                showLine={{ showLeafIcon: false }}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                autoExpandParent={autoExpandParent}
                onExpand={onExpand}
                onSelect={onSelect}
                treeData={filteredTreeData}
              />
            ) : (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default TreeView;
