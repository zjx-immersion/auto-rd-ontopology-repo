import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout, Breadcrumb, Spin, Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useGraphs } from '../contexts/GraphsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import GraphView from '../components/GraphView';
import TableView from '../components/TableView';
import TreeView from '../components/TreeView';
import MatrixViewOptimized from '../components/MatrixViewOptimized';
import Dashboard from '../components/Dashboard';
import SchemaViewer from '../components/SchemaViewer';
import NodeDetailPanel from '../components/NodeDetailPanel';
import TraceResultPanel from '../components/TraceResultPanel';
import { fetchSchema } from '../services/api';
import './GraphViewPage.css';

const { Content, Sider } = Layout;

/**
 * 图谱查看页
 * 根据URL参数加载指定图谱，复用所有现有视图组件
 */
const GraphViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentGraph, loadGraph } = useGraphs();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schema, setSchema] = useState(null);
  const [viewMode, setViewMode] = useState('graph');
  const [selectedNode, setSelectedNode] = useState(null);
  const [traceResult, setTraceResult] = useState(null);

  // 计算实时统计信息
  const statistics = useMemo(() => {
    if (!currentGraph || !currentGraph.data) {
      return {
        total_nodes: 0,
        total_edges: 0,
        entity_counts: {}
      };
    }

    const { nodes, edges } = currentGraph.data;
    
    // 计算实体类型数量
    const entity_counts = {};
    nodes.forEach(node => {
      const type = node.type || 'unknown';
      entity_counts[type] = (entity_counts[type] || 0) + 1;
    });

    return {
      total_nodes: nodes.length,
      total_edges: edges.length,
      entity_counts
    };
  }, [currentGraph]);

  // 加载图谱和Schema
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 加载图谱
        const graph = await loadGraph(id);
        if (!graph) {
          setError('图谱不存在');
          return;
        }

        // 加载Schema
        const schemaData = await fetchSchema();
        setSchema(schemaData);
      } catch (err) {
        console.error('Failed to load graph:', err);
        setError(err.message || '加载图谱失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, loadGraph]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setTraceResult(null);
  };

  const handleTraceResult = (result) => {
    setTraceResult(result);
  };

  const handleRefresh = async () => {
    await loadGraph(id);
  };

  // 加载中
  if (loading) {
    return (
      <div className="graph-view-page loading-container">
        <Spin size="large" tip="加载图谱中..." />
      </div>
    );
  }

  // 错误状态
  if (error || !currentGraph) {
    return (
      <div className="graph-view-page error-container">
        <Result
          status="error"
          title="加载失败"
          subTitle={error || '图谱不存在'}
          extra={[
            <Button type="primary" key="back" onClick={() => navigate('/graphs')}>
              返回图谱列表
            </Button>,
            <Button key="retry" onClick={() => window.location.reload()}>
              重试
            </Button>
          ]}
        />
      </div>
    );
  }

  return (
    <Layout className="graph-view-page">
      {/* 顶部导航栏 */}
      <Header
        onRefresh={handleRefresh}
        onImport={() => {}}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        graphName={currentGraph.name}
      />

      {/* 面包屑 */}
      <div className="breadcrumb-wrapper">
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link to="/graphs">
              <HomeOutlined /> 图谱列表
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{currentGraph.name}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 主内容区 */}
      <Layout className="content-layout">
        {/* 左侧边栏（仅在图谱视图显示） */}
        {viewMode === 'graph' && (
          <Sider
            width={260}
            collapsible={false}
            style={{ background: '#fff' }}
            className="graph-sidebar"
          >
            <Sidebar
              schema={schema}
              statistics={statistics}
              onSearch={(keyword) => {
                console.log('搜索:', keyword);
              }}
            />
          </Sider>
        )}

        {/* 主内容 */}
        <Content className="main-content">
          {viewMode === 'graph' && (
            <GraphView
              data={currentGraph.data}
              schema={schema}
              onNodeClick={handleNodeClick}
              onTraceResult={handleTraceResult}
            />
          )}

          {viewMode === 'table' && (
            <TableView
              data={currentGraph.data}
              schema={schema}
              onNodeClick={handleNodeClick}
            />
          )}

          {viewMode === 'tree' && (
            <TreeView
              data={currentGraph.data}
              schema={schema}
              onNodeClick={handleNodeClick}
            />
          )}

          {viewMode === 'matrix' && (
            <MatrixViewOptimized
              data={currentGraph.data}
              schema={schema}
            />
          )}

          {viewMode === 'dashboard' && (
            <Dashboard
              data={currentGraph.data}
              schema={schema}
            />
          )}

          {viewMode === 'schema' && (
            <SchemaViewer
              schema={schema}
            />
          )}

          {/* 节点详情面板 */}
          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              data={currentGraph.data}
              schema={schema}
              onClose={() => setSelectedNode(null)}
            />
          )}

          {/* 追溯结果面板 */}
          {traceResult && (
            <TraceResultPanel
              result={traceResult}
              onClose={() => setTraceResult(null)}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default GraphViewPage;
