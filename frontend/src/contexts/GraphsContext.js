import React, { createContext, useContext, useState, useCallback } from 'react';
import { message } from 'antd';
import * as api from '../services/api';

const GraphsContext = createContext(null);

/**
 * 图谱状态管理Provider
 * 管理多个图谱的加载、创建、更新、删除等操作
 */
export const GraphsProvider = ({ children }) => {
  const [graphs, setGraphs] = useState([]);
  const [currentGraph, setCurrentGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  /**
   * 加载图谱列表
   */
  const loadGraphs = useCallback(async (filter = {}) => {
    setLoading(true);
    try {
      const response = await api.getGraphs(filter);
      if (response.success) {
        setGraphs(response.data.graphs);
        setPagination({
          current: response.data.pagination.page,
          pageSize: response.data.pagination.pageSize,
          total: response.data.pagination.total
        });
      }
    } catch (error) {
      console.error('Failed to load graphs:', error);
      message.error('加载图谱列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 加载单个图谱详情
   */
  const loadGraph = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await api.getGraph(id);
      if (response.success) {
        setCurrentGraph(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to load graph:', error);
      message.error('加载图谱失败: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 创建新图谱
   */
  const createGraph = useCallback(async (graphData) => {
    setLoading(true);
    try {
      const response = await api.createGraph(graphData);
      if (response.success) {
        message.success(response.message || '图谱创建成功');
        await loadGraphs(); // 重新加载列表
        return response.data;
      }
    } catch (error) {
      console.error('Failed to create graph:', error);
      message.error('创建图谱失败: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadGraphs]);

  /**
   * 更新图谱
   */
  const updateGraph = useCallback(async (id, updates) => {
    setLoading(true);
    try {
      const response = await api.updateGraph(id, updates);
      if (response.success) {
        message.success(response.message || '图谱更新成功');
        
        // 更新当前图谱
        if (currentGraph && currentGraph.id === id) {
          setCurrentGraph(response.data);
        }
        
        // 更新列表
        setGraphs(graphs.map(g => g.id === id ? response.data : g));
        
        return response.data;
      }
    } catch (error) {
      console.error('Failed to update graph:', error);
      message.error('更新图谱失败: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentGraph, graphs]);

  /**
   * 删除图谱
   */
  const deleteGraph = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await api.deleteGraph(id);
      if (response.success) {
        message.success(response.message || '图谱删除成功');
        
        // 如果删除的是当前图谱，清空当前图谱
        if (currentGraph && currentGraph.id === id) {
          setCurrentGraph(null);
        }
        
        // 从列表中移除
        setGraphs(graphs.filter(g => g.id !== id));
        
        return true;
      }
    } catch (error) {
      console.error('Failed to delete graph:', error);
      message.error('删除图谱失败: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentGraph, graphs]);

  /**
   * 复制图谱
   */
  const duplicateGraph = useCallback(async (id, newName) => {
    setLoading(true);
    try {
      const response = await api.duplicateGraph(id, newName);
      if (response.success) {
        message.success(response.message || '图谱复制成功');
        await loadGraphs(); // 重新加载列表
        return response.data;
      }
    } catch (error) {
      console.error('Failed to duplicate graph:', error);
      message.error('复制图谱失败: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadGraphs]);

  /**
   * 导出图谱
   */
  const exportGraph = useCallback(async (id) => {
    try {
      const response = await api.exportGraph(id);
      if (response.success || response.id) {
        // 创建下载
        const dataStr = JSON.stringify(response.success ? response.data : response, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `graph_${id}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        message.success('图谱导出成功');
      }
    } catch (error) {
      console.error('Failed to export graph:', error);
      message.error('导出图谱失败: ' + error.message);
    }
  }, []);

  /**
   * 验证图谱
   */
  const validateGraph = useCallback(async (id) => {
    try {
      const response = await api.validateGraph(id);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.error('Failed to validate graph:', error);
      message.error('验证图谱失败: ' + error.message);
      return null;
    }
  }, []);

  const value = {
    // 状态
    graphs,
    currentGraph,
    loading,
    pagination,
    
    // 方法
    loadGraphs,
    loadGraph,
    createGraph,
    updateGraph,
    deleteGraph,
    duplicateGraph,
    exportGraph,
    validateGraph,
    
    // 直接设置当前图谱（用于切换）
    setCurrentGraph
  };

  return (
    <GraphsContext.Provider value={value}>
      {children}
    </GraphsContext.Provider>
  );
};

/**
 * Hook: 使用图谱状态
 */
export const useGraphs = () => {
  const context = useContext(GraphsContext);
  if (!context) {
    throw new Error('useGraphs must be used within GraphsProvider');
  }
  return context;
};

export default GraphsContext;
