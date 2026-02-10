import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphsProvider } from './contexts/GraphsContext';
import GraphListPage from './pages/GraphListPage';
import GraphViewPage from './pages/GraphViewPage';
import SchemaEditorPage from './pages/SchemaEditorPage';
import './App.css';

/**
 * 应用主组件
 * 使用React Router进行页面路由管理
 * 使用Context进行状态管理
 */
function App() {
  return (
    <Router>
      <GraphsProvider>
        <ReactFlowProvider>
          <Routes>
            {/* 默认重定向到图谱列表 */}
            <Route path="/" element={<Navigate to="/graphs" replace />} />
            
            {/* 图谱列表页 */}
            <Route path="/graphs" element={<GraphListPage />} />
            
            {/* 图谱查看页 */}
            <Route path="/graphs/:id" element={<GraphViewPage />} />
            
            {/* Schema 编辑器 */}
            <Route path="/schema-editor" element={<SchemaEditorPage />} />
            <Route path="/schema-editor/:graphId" element={<SchemaEditorPage />} />
            
            {/* 404页面 */}
            <Route path="*" element={<Navigate to="/graphs" replace />} />
          </Routes>
        </ReactFlowProvider>
      </GraphsProvider>
    </Router>
  );
}

export default App;
