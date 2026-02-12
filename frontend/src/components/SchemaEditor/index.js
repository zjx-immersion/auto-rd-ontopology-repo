import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Card, Layout, message, Space, Tooltip } from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  DragOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import EntityTypeNode from './EntityTypeNode';
import RelationTypeEdge from './RelationTypeEdge';
import PropertyPanel from './PropertyPanel';
import SchemaToolbar from './SchemaToolbar';
import EntityTypeEditor from './EntityTypeEditor';
import ImportExportModal from './ImportExportModal';
import SchemaValidator from './SchemaValidator';
import { 
  fetchSchema, 
  saveSchema, 
  createEntityType, 
  updateEntityType, 
  deleteEntityType 
} from '../../services/api';
import { autoLayout, calculateSmartLayout, calculateHierarchicalLayout, calculateClusterLayout } from './layoutUtils';
import './SchemaEditor.css';

const { Sider, Content } = Layout;

// 节点类型注册
const nodeTypes = {
  entityType: EntityTypeNode,
};

// 边类型注册
const edgeTypes = {
  relationType: RelationTypeEdge,
};

/**
 * Schema 可视化编辑器主组件
 */
const SchemaEditor = ({ graphId }) => {
  // React Flow 状态
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // 编辑器状态
  const [editorMode, setEditorMode] = useState('select'); // select, addEntity, addRelation
  const [selectedItem, setSelectedItem] = useState(null);
  const [schema, setSchema] = useState({ entityTypes: {}, relationTypes: {} });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // 历史记录（用于撤销/重做）
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const { screenToFlowPosition } = useReactFlow();

  // 加载 Schema 数据
  useEffect(() => {
    loadSchema();
  }, [graphId]);

  const loadSchema = async () => {
    setLoading(true);
    try {
      const schemaData = await fetchSchema();
      if (schemaData) {
        setSchema(schemaData);
        convertSchemaToFlow(schemaData);
      }
    } catch (error) {
      message.error('加载 Schema 失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 当前布局类型
  const [layoutType, setLayoutType] = useState('auto');
  
  // Entity Type Editor 状态
  const [entityEditorVisible, setEntityEditorVisible] = useState(false);
  const [editingEntityType, setEditingEntityType] = useState(null);

  // 将 Schema 转换为 React Flow 节点和边
  const convertSchemaToFlow = (schemaData) => {
    const flowNodes = [];
    const flowEdges = [];
    
    // 转换实体类型为节点
    if (schemaData.entityTypes) {
      Object.entries(schemaData.entityTypes).forEach(([id, entity]) => {
        flowNodes.push({
          id: `entity-${id}`,
          type: 'entityType',
          position: { x: 0, y: 0 }, // 初始位置，后续由布局算法计算
          data: {
            entityType: entity,
            onEdit: () => handleSelectEntity(id),
            onDelete: () => handleDeleteEntity(id),
          },
        });
      });
    }
    
    // 转换关系类型为边
    if (schemaData.relationTypes) {
      Object.entries(schemaData.relationTypes).forEach(([id, relation]) => {
        if (relation.from && relation.to && relation.from[0] && relation.to[0]) {
          // 为每个源-目标对创建边
          relation.from.forEach(fromType => {
            relation.to.forEach(toType => {
              flowEdges.push({
                id: `relation-${id}-${fromType}-${toType}`,
                source: `entity-${fromType}`,
                target: `entity-${toType}`,
                type: 'relationType',
                data: {
                  relationType: relation,
                  onEdit: () => handleSelectRelation(id),
                  onDelete: () => handleDeleteRelation(id),
                },
                label: relation.label,
              });
            });
          });
        }
      });
    }
    
    // 使用智能布局算法计算位置
    const layoutedNodes = autoLayout(flowNodes, flowEdges, layoutType);
    
    setNodes(layoutedNodes);
    setEdges(flowEdges);
  };

  // 重新布局
  const handleRelayout = (type) => {
    setLayoutType(type);
    const layoutedNodes = autoLayout(nodes, edges, type);
    setNodes(layoutedNodes);
    message.success(`已切换为${getLayoutName(type)}布局`);
  };

  // 获取布局名称
  const getLayoutName = (type) => {
    switch (type) {
      case 'force': return '力导向';
      case 'hierarchical': return '层次';
      case 'cluster': return '聚类';
      default: return '自动';
    }
  };

  // 保存历史记录
  const saveHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges], schema: { ...schema } });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, schema, history, historyIndex]);

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setSchema(prevState.schema);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setSchema(nextState.schema);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // 画布点击（创建实体类型）
  const onPaneClick = useCallback((event) => {
    if (editorMode === 'addEntity') {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newId = `new_entity_${Date.now()}`;
      const newEntity = {
        id: newId,
        label: '新实体类型',
        description: '',
        color: '#1890ff',
        properties: {},
        position,
      };
      
      const newNode = {
        id: `entity-${newId}`,
        type: 'entityType',
        position,
        data: {
          entityType: newEntity,
          onEdit: () => handleSelectEntity(newId),
          onDelete: () => handleDeleteEntity(newId),
        },
      };
      
      setNodes((nds) => [...nds, newNode]);
      setSchema((prev) => ({
        ...prev,
        entityTypes: { ...prev.entityTypes, [newId]: newEntity },
      }));
      
      setHasChanges(true);
      setEditorMode('select');
      setSelectedItem({ type: 'entity', id: newId, data: newEntity });
      message.success('创建实体类型，请配置属性');
    }
  }, [editorMode, screenToFlowPosition, setNodes]);

  // 连接完成（创建关系类型）
  const onConnect = useCallback((params) => {
    if (editorMode === 'addRelation' || editorMode === 'select') {
      const sourceId = params.source.replace('entity-', '');
      const targetId = params.target.replace('entity-', '');
      
      const newRelationId = `new_relation_${Date.now()}`;
      const newRelation = {
        id: newRelationId,
        label: '新关系',
        description: '',
        from: [sourceId],
        to: [targetId],
      };
      
      const newEdge = {
        id: `relation-${newRelationId}`,
        source: params.source,
        target: params.target,
        type: 'relationType',
        data: {
          relationType: newRelation,
          onEdit: () => handleSelectRelation(newRelationId),
          onDelete: () => handleDeleteRelation(newRelationId),
        },
        label: newRelation.label,
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      setSchema((prev) => ({
        ...prev,
        relationTypes: { ...prev.relationTypes, [newRelationId]: newRelation },
      }));
      
      setHasChanges(true);
      setSelectedItem({ type: 'relation', id: newRelationId, data: newRelation });
      message.success('创建关系类型，请配置属性');
    }
  }, [editorMode, setEdges]);

  // 选中实体类型
  const handleSelectEntity = (id) => {
    const entity = schema.entityTypes[id];
    if (entity) {
      setSelectedItem({ type: 'entity', id, data: entity });
    }
  };

  // 打开 Entity Type Editor
  const handleOpenEntityEditor = (entityType = null) => {
    setEditingEntityType(entityType);
    setEntityEditorVisible(true);
  };

  // 关闭 Entity Type Editor
  const handleCloseEntityEditor = () => {
    setEntityEditorVisible(false);
    setEditingEntityType(null);
  };

  // 保存 Entity Type（创建或更新）
  const handleSaveEntityType = async (entityData) => {
    try {
      if (editingEntityType) {
        // 更新
        await updateEntityType(editingEntityType.code, entityData);
        message.success('实体类型更新成功');
      } else {
        // 创建
        await createEntityType(entityData);
        message.success('实体类型创建成功');
      }
      
      // 重新加载 Schema
      await loadSchema();
      handleCloseEntityEditor();
    } catch (error) {
      message.error('保存失败: ' + error.message);
      throw error;
    }
  };

  // 删除 Entity Type
  const handleDeleteEntityType = async (code) => {
    try {
      await deleteEntityType(code);
      message.success('实体类型删除成功');
      
      // 重新加载 Schema
      await loadSchema();
      handleCloseEntityEditor();
      setSelectedItem(null);
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };

  // 选中关系类型
  const handleSelectRelation = (id) => {
    const relation = schema.relationTypes[id];
    if (relation) {
      setSelectedItem({ type: 'relation', id, data: relation });
    }
  };

  // 删除实体类型
  const handleDeleteEntity = (id) => {
    setNodes((nds) => nds.filter((n) => n.id !== `entity-${id}`));
    setSchema((prev) => {
      const newEntityTypes = { ...prev.entityTypes };
      delete newEntityTypes[id];
      return { ...prev, entityTypes: newEntityTypes };
    });
    setHasChanges(true);
    setSelectedItem(null);
    message.success('删除成功');
  };

  // 删除关系类型
  const handleDeleteRelation = (id) => {
    setEdges((eds) => eds.filter((e) => e.id !== `relation-${id}`));
    setSchema((prev) => {
      const newRelationTypes = { ...prev.relationTypes };
      delete newRelationTypes[id];
      return { ...prev, relationTypes: newRelationTypes };
    });
    setHasChanges(true);
    setSelectedItem(null);
    message.success('删除成功');
  };

  // 更新实体类型
  const handleUpdateEntity = (id, updates) => {
    setSchema((prev) => ({
      ...prev,
      entityTypes: {
        ...prev.entityTypes,
        [id]: { ...prev.entityTypes[id], ...updates },
      },
    }));
    
    // 更新节点显示
    setNodes((nds) =>
      nds.map((n) =>
        n.id === `entity-${id}`
          ? { ...n, data: { ...n.data, entityType: { ...n.data.entityType, ...updates } } }
          : n
      )
    );
    
    setHasChanges(true);
  };

  // 更新关系类型
  const handleUpdateRelation = (id, updates) => {
    setSchema((prev) => ({
      ...prev,
      relationTypes: {
        ...prev.relationTypes,
        [id]: { ...prev.relationTypes[id], ...updates },
      },
    }));
    
    // 更新边显示
    setEdges((eds) =>
      eds.map((e) =>
        e.id === `relation-${id}`
          ? { ...e, label: updates.label || e.label, data: { ...e.data, relationType: { ...e.data.relationType, ...updates } } }
          : e
      )
    );
    
    setHasChanges(true);
  };

  // 保存 Schema
  const handleSave = async () => {
    try {
      await saveSchema(graphId, schema);
      setHasChanges(false);
      message.success('Schema 保存成功');
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  // 导入导出模态框状态
  const [importExportVisible, setImportExportVisible] = useState(false);
  const [importExportMode, setImportExportMode] = useState('import');
  
  // 验证模态框状态
  const [validatorVisible, setValidatorVisible] = useState(false);
  
  // 导入 Schema
  const handleImport = () => {
    setImportExportMode('import');
    setImportExportVisible(true);
  };

  // 导出 Schema
  const handleExport = () => {
    setImportExportMode('export');
    setImportExportVisible(true);
  };

  // 验证 Schema
  const handleValidate = () => {
    setValidatorVisible(true);
  };
  
  // 处理导入完成
  const handleImportComplete = (newSchema) => {
    setSchema(newSchema);
    convertSchemaToFlow(newSchema);
    setHasChanges(true);
    setImportExportVisible(false);
    message.success('Schema导入成功');
  };
  
  // 处理导出完成
  const handleExportComplete = () => {
    setImportExportVisible(false);
  };

  // 节点选中事件
  const onNodeClick = (_, node) => {
    const entityId = node.id.replace('entity-', '');
    handleSelectEntity(entityId);
  };

  // 节点双击事件 - 打开编辑器
  const onNodeDoubleClick = (_, node) => {
    const entityId = node.id.replace('entity-', '');
    const entity = schema.entityTypes[entityId];
    if (entity) {
      handleOpenEntityEditor(entity);
    }
  };

  // 边选中事件
  const onEdgeClick = (_, edge) => {
    const relationId = edge.id.replace('relation-', '');
    handleSelectRelation(relationId);
  };

  return (
    <Layout className="schema-editor-layout">
      {/* 顶部工具栏 */}
      <SchemaToolbar
        editorMode={editorMode}
        onModeChange={setEditorMode}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasChanges={hasChanges}
        layoutType={layoutType}
        onLayoutChange={handleRelayout}
        onImport={handleImport}
        onExport={handleExport}
        onValidate={handleValidate}
      />

      <Layout className="schema-editor-content">
        {/* 左侧工具面板 */}
        <Sider width={80} className="schema-editor-sider">
          <Card className="tool-panel" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tooltip title="选择模式 (V)" placement="right">
                <Button
                  type={editorMode === 'select' ? 'primary' : 'default'}
                  icon={<DragOutlined />}
                  onClick={() => setEditorMode('select')}
                  block
                />
              </Tooltip>
              
              <Tooltip title="添加实体类型 (E)" placement="right">
                <Button
                  type={editorMode === 'addEntity' ? 'primary' : 'default'}
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenEntityEditor()}
                  block
                />
              </Tooltip>
              
              <Tooltip title="添加关系类型 (R)" placement="right">
                <Button
                  type={editorMode === 'addRelation' ? 'primary' : 'default'}
                  icon={<ArrowRightOutlined />}
                  onClick={() => setEditorMode('addRelation')}
                  block
                />
              </Tooltip>
              
              <div className="divider" />
              
              <Tooltip title="撤销 (Ctrl+Z)" placement="right">
                <Button
                  icon={<UndoOutlined />}
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  block
                />
              </Tooltip>
              
              <Tooltip title="重做 (Ctrl+Y)" placement="right">
                <Button
                  icon={<RedoOutlined />}
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  block
                />
              </Tooltip>
            </Space>
          </Card>
        </Sider>

        {/* 画布区域 */}
        <Content className="schema-editor-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant="dots" gap={12} size={1} />
            <Controls />
            <MiniMap 
              nodeStrokeWidth={3} 
              zoomable 
              pannable 
              className="schema-minimap"
            />
            
            {/* 模式提示 */}
            {editorMode === 'addEntity' && (
              <Panel position="top-center" className="mode-hint">
                <Card size="small" className="hint-card">
                  点击画布空白处创建实体类型
                </Card>
              </Panel>
            )}
            {editorMode === 'addRelation' && (
              <Panel position="top-center" className="mode-hint">
                <Card size="small" className="hint-card">
                  拖拽连接两个实体类型
                </Card>
              </Panel>
            )}
          </ReactFlow>
        </Content>

        {/* 右侧属性面板 */}
        <Sider width={320} className="property-panel-sider">
          <PropertyPanel
            selectedItem={selectedItem}
            schema={schema}
            onUpdateEntity={handleUpdateEntity}
            onUpdateRelation={handleUpdateRelation}
            onDeleteEntity={handleDeleteEntity}
            onDeleteRelation={handleDeleteRelation}
          />
          
          {/* 编辑按钮 */}
          {selectedItem?.type === 'entity' && (
            <Card size="small" style={{ marginTop: 16 }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                block
                onClick={() => handleOpenEntityEditor(selectedItem.data)}
              >
                编辑实体类型
              </Button>
            </Card>
          )}
        </Sider>
      </Layout>
      
      {/* Entity Type Editor 对话框 */}
      <EntityTypeEditor
        visible={entityEditorVisible}
        entityType={editingEntityType}
        onCancel={handleCloseEntityEditor}
        onSave={handleSaveEntityType}
        onDelete={editingEntityType ? handleDeleteEntityType : null}
        existingDomains={Object.values(schema.entityTypes).map(e => e.domain).filter(Boolean)}
      />
      
      {/* 导入导出模态框 */}
      <ImportExportModal
        visible={importExportVisible}
        mode={importExportMode}
        schema={schema}
        onClose={() => setImportExportVisible(false)}
        onImport={handleImportComplete}
        onExport={handleExportComplete}
      />
      
      {/* 验证模态框 */}
      <SchemaValidator
        visible={validatorVisible}
        schema={schema}
        onClose={() => setValidatorVisible(false)}
        onFix={(item) => console.log('Fix:', item)}
      />
    </Layout>
  );
};

export default SchemaEditor;
