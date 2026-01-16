import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Card, Tabs, Input, Space, Button, Empty, Drawer, Descriptions, Tag, Divider } from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  FolderOutlined, 
  FileOutlined,
  NodeIndexOutlined,
  InfoCircleOutlined,
  CloseOutlined
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
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedNodeDetail, setSelectedNodeDetail] = useState(null);

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
    
    // 如果是实例节点，显示详情抽屉
    if (info.node.nodeId) {
      const nodeData = info.node.nodeData;
      const relatedEdges = data?.edges?.filter(e => 
        e.source === nodeData.id || e.target === nodeData.id
      ) || [];
      
      setSelectedNodeDetail({
        node: nodeData,
        relatedEdges: relatedEdges,
        relatedNodes: relatedEdges.map(e => {
          const relatedId = e.source === nodeData.id ? e.target : e.source;
          return data?.nodes?.find(n => n.id === relatedId);
        }).filter(Boolean)
      });
      setDetailDrawerVisible(true);
      
      // 也触发原有的回调
      if (onNodeSelect) {
        onNodeSelect(nodeData);
      }
    }
  };
  
  // 格式化属性标签
  const formatLabel = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // 格式化属性值
  const formatPropertyValue = (value, type) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? '是' : '否';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
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
      
      {/* 节点详情抽屉 */}
      <Drawer
        title={
          <Space>
            <InfoCircleOutlined />
            <span>节点详情</span>
          </Space>
        }
        placement="right"
        width={480}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        closeIcon={<CloseOutlined />}
      >
        {selectedNodeDetail && (
          <div>
            {/* 基本信息 */}
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="节点ID">
                  <Tag color="blue">{selectedNodeDetail.node.id}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="节点类型">
                  <Tag color="green">
                    {schema?.entityTypes?.[selectedNodeDetail.node.type]?.label || selectedNodeDetail.node.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="节点标签">
                  {selectedNodeDetail.node.label || selectedNodeDetail.node.id}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            
            {/* 节点属性 */}
            {selectedNodeDetail.node.data && Object.keys(selectedNodeDetail.node.data).length > 0 && (
              <Card title="节点属性" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small" bordered>
                  {Object.entries(selectedNodeDetail.node.data).map(([key, value]) => (
                    <Descriptions.Item label={formatLabel(key)} key={key}>
                      {formatPropertyValue(value)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}
            
            {/* 关联关系 */}
            {selectedNodeDetail.relatedEdges.length > 0 && (
              <Card title={`关联关系 (${selectedNodeDetail.relatedEdges.length})`} size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {selectedNodeDetail.relatedEdges.map((edge, index) => {
                    const relationType = schema?.relationTypes?.[edge.type];
                    const isOutgoing = edge.source === selectedNodeDetail.node.id;
                    const relatedNodeId = isOutgoing ? edge.target : edge.source;
                    const relatedNode = data?.nodes?.find(n => n.id === relatedNodeId);
                    
                    return (
                      <Card key={index} size="small" type="inner" style={{ backgroundColor: '#fafafa' }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div>
                            <Tag color={isOutgoing ? 'blue' : 'orange'}>
                              {isOutgoing ? '出边' : '入边'}
                            </Tag>
                            <Tag color="purple">
                              {relationType?.label || edge.type}
                            </Tag>
                          </div>
                          <div>
                            <span style={{ color: '#666' }}>
                              {isOutgoing ? '目标节点: ' : '源节点: '}
                            </span>
                            <Tag color="green">
                              {relatedNode?.label || relatedNodeId}
                            </Tag>
                          </div>
                        </Space>
                      </Card>
                    );
                  })}
                </Space>
              </Card>
            )}
            
            {/* 关联节点 */}
            {selectedNodeDetail.relatedNodes.length > 0 && (
              <Card title={`关联节点 (${selectedNodeDetail.relatedNodes.length})`} size="small">
                <Space wrap>
                  {selectedNodeDetail.relatedNodes.map((node, index) => (
                    <Tag 
                      key={index} 
                      color="cyan"
                      style={{ cursor: 'pointer', marginBottom: 8 }}
                      onClick={() => {
                        // 可以在这里添加跳转到该节点的逻辑
                        if (onNodeSelect) {
                          onNodeSelect(node);
                        }
                      }}
                    >
                      {node.label || node.id}
                    </Tag>
                  ))}
                </Space>
              </Card>
            )}
            
            {selectedNodeDetail.relatedEdges.length === 0 && (
              <Empty description="该节点暂无关联关系" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        )}
      </Drawer>
    </Card>
  );
};

export default TreeView;
