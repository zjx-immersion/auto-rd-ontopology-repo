import React, { useState, useEffect } from 'react';
import { Layout, message } from 'antd';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphView from './components/GraphView';
import TableView from './components/TableView';
import TreeView from './components/TreeView';
import MatrixViewOptimized from './components/MatrixViewOptimized';
import Dashboard from './components/Dashboard';
import NodeDetailPanel from './components/NodeDetailPanel';
import TraceResultPanel from './components/TraceResultPanel';
import ImportModal from './components/ImportModal';
import { fetchGraphData, fetchSchema } from './services/api';
import './App.css';

const { Header: AntHeader, Content, Sider } = Layout;

function App() {
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [schema, setSchema] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [traceResult, setTraceResult] = useState(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('graph'); // 'graph', 'table', 'tree', 'matrix', 'dashboard'

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, schemaData] = await Promise.all([
        fetchGraphData(),
        fetchSchema()
      ]);
      setGraphData(data);
      setSchema(schemaData);
      message.success(`数据加载成功：${data.nodes?.length || 0}个节点，${data.edges?.length || 0}条边`);
    } catch (error) {
      message.error('数据加载失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setTraceResult(null);
  };

  const handleTraceResult = (result) => {
    setTraceResult(result);
  };

  const handleImportSuccess = () => {
    loadData();
    setImportModalVisible(false);
  };

  return (
    <Layout className="app-layout">
      <AntHeader className="app-header">
        <Header
          onRefresh={loadData}
          onImport={() => setImportModalVisible(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </AntHeader>

      <Layout className="content-layout">
        {viewMode === 'graph' && (
          <Sider
            width={260}
            collapsible={false}
            style={{ background: '#fff' }}
          >
            <Sidebar
              schema={schema}
              statistics={graphData.statistics}
              onSearch={(keyword) => {
                // TODO: 实现搜索功能
                console.log('搜索:', keyword);
              }}
            />
          </Sider>
        )}

        <Content className="main-content">
          {/* 图谱视图 */}
          {viewMode === 'graph' && (
            <>
              <GraphView
                data={graphData}
                schema={schema}
                loading={loading}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNode?.id}
              />

              {selectedNode && !traceResult && (
                <NodeDetailPanel
                  node={selectedNode}
                  schema={schema}
                  onClose={() => setSelectedNode(null)}
                  onTrace={handleTraceResult}
                />
              )}

              {traceResult && (
                <TraceResultPanel
                  result={traceResult}
                  schema={schema}
                  onClose={() => setTraceResult(null)}
                />
              )}
            </>
          )}

          {/* 表格视图 */}
          {viewMode === 'table' && (
            <TableView
              data={graphData}
              schema={schema}
              onNodeClick={handleNodeClick}
            />
          )}

          {/* 树形视图 */}
          {viewMode === 'tree' && (
            <TreeView
              data={graphData}
              schema={schema}
              onNodeSelect={handleNodeClick}
            />
          )}

          {/* 矩阵视图 */}
          {viewMode === 'matrix' && (
            <MatrixViewOptimized
              data={graphData}
              schema={schema}
            />
          )}

          {/* 仪表盘视图 */}
          {viewMode === 'dashboard' && (
            <Dashboard
              data={graphData}
              schema={schema}
            />
          )}
        </Content>
      </Layout>

      <ImportModal
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />
    </Layout>
  );
}

export default App;
