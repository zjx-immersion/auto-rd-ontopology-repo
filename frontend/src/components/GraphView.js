import React, { useEffect, useRef, useCallback } from 'react';
import { Spin } from 'antd';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import './GraphView.css';

cytoscape.use(dagre);

const GraphView = ({ data, schema, loading, onNodeClick, selectedNodeId, highlightedEntityType }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const onNodeClickRef = useRef(onNodeClick);
  const currentZoomRef = useRef(null);
  const currentPanRef = useRef(null);

  // 更新回调引用，避免依赖项变化导致重新创建图谱
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // 保存当前的缩放和位置 - 监听用户的手动操作
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    
    // 监听用户的手动缩放和平移操作
    const saveViewState = () => {
      currentZoomRef.current = cy.zoom();
      currentPanRef.current = cy.pan();
      console.log('保存视图状态:', { zoom: currentZoomRef.current, pan: currentPanRef.current });
    };
    
    // 监听各种可能改变视图的事件
    cy.on('zoom', saveViewState);
    cy.on('pan', saveViewState);
    cy.on('pinch', saveViewState);
    cy.on('position', saveViewState);
    
    return () => {
      cy.off('zoom', saveViewState);
      cy.off('pan', saveViewState);
      cy.off('pinch', saveViewState);
      cy.off('position', saveViewState);
    };
  }, [cyRef.current]);

  useEffect(() => {
    if (!containerRef.current || loading) return;

    // 格式化图谱数据
    const elements = formatGraphData(data, schema);
    
    // 调试：检查前5个节点的颜色
    if (elements.length > 0) {
      const nodeElements = elements.filter(e => !e.data.source);
      console.log('GraphView: 格式化后的节点数量:', nodeElements.length);
      console.log('GraphView: Schema状态:', schema ? `有Schema (${Object.keys(schema.entityTypes || {}).length}个类型)` : '无Schema');
      nodeElements.slice(0, 5).forEach(e => {
        console.log(`  Node ${e.data.id} (${e.data.type}): color=${e.data.color}`);
      });
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: getGraphStyle(schema),
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 40,
        rankSep: 100,
        padding: 30,
        animate: false,
        fit: true,
      // 初始布局后不自动fit，保持用户设置的缩放
        avoidOverlap: true
      },
      minZoom: 0.1,
      maxZoom: 3
    });
    
    // 验证节点颜色是否正确应用
    cy.ready(() => {
      const nodes = cy.nodes();
      console.log('Cytoscape: 节点数量:', nodes.length);
      nodes.slice(0, 5).forEach(node => {
        const nodeData = node.data();
        console.log(`  Cytoscape Node ${nodeData.id}: color=${nodeData.color}, style=${node.style('background-color')}`);
      });
      
      // 如果有保存的视图状态，恢复它
      if (currentZoomRef.current !== null && currentPanRef.current !== null) {
        cy.zoom(currentZoomRef.current);
        cy.pan(currentPanRef.current);
      } else {
        // 否则保存初始视图状态
        currentZoomRef.current = cy.zoom();
        currentPanRef.current = cy.pan();
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      // 获取完整的节点数据，包括原始数据中的data字段
      const properties = node.data('properties') || {};
      const nodeId = node.id();
      
      // 从原始数据中查找完整节点信息
      const originalNode = data?.nodes?.find(n => n.id === nodeId);
      
      const nodeData = {
        id: nodeId,
        type: node.data('type'),
        label: node.data('label') || node.id(),
        // 优先使用原始节点的data，如果没有则使用properties
        data: originalNode?.data || properties || {}
      };
      
      console.log('点击节点 - 详细调试:', {
        nodeId: nodeData.id,
        type: nodeData.type,
        hasData: !!nodeData.data,
        dataKeys: Object.keys(nodeData.data || {}),
        originalNodeExists: !!originalNode,
        originalNodeData: originalNode?.data ? Object.keys(originalNode.data) : null,
        propertiesKeys: Object.keys(properties || {}),
        dataNodesLength: data?.nodes?.length,
        nodeDataFull: nodeData
      });
      
      // 保持当前缩放和位置，然后高亮相关节点和边
      const currentZoom = cy.zoom();
      const currentPan = cy.pan();
      
      // 使用 batch 批量操作，避免中间状态触发重新渲染
      cy.batch(() => {
        // 清除之前的高亮
        cy.nodes().removeClass('selected neighbor-highlight');
        cy.edges().removeClass('highlighted');
        
        // 高亮选中的节点
        node.addClass('selected');
        
        // 获取所有连接的边
        const connectedEdges = node.connectedEdges();
        connectedEdges.addClass('highlighted');
        
        // 获取所有相邻节点（出边和入边的目标/源节点）
        const neighbors = node.neighborhood('node');
        neighbors.addClass('neighbor-highlight');
      });
      
      // 恢复缩放和位置（保持当前视图）- 在 batch 之后执行
      cy.zoom(currentZoom);
      cy.pan(currentPan);
      
      // 更新保存的视图状态
      currentZoomRef.current = currentZoom;
      currentPanRef.current = currentPan;
      
      // 最后调用回调，更新父组件状态（使用 ref 避免依赖项变化）
      if (onNodeClickRef.current) {
        onNodeClickRef.current(nodeData);
      }
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        if (onNodeClickRef.current) {
          onNodeClickRef.current(null);
        }
      }
    });

    cyRef.current = cy;

    return () => {
      if (cy) {
        cy.destroy();
      }
    };
  }, [data, schema, loading]); // 移除 onNodeClick 依赖，使用 ref 代替

  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    
    // 使用保存的缩放和位置，如果没有则使用当前的
    const targetZoom = currentZoomRef.current !== null ? currentZoomRef.current : cy.zoom();
    const targetPan = currentPanRef.current !== null ? currentPanRef.current : cy.pan();
    
    // 使用 batch 批量操作，避免中间状态触发重新渲染或布局调整
    cy.batch(() => {
      // 清除之前的高亮（但保留实体类型高亮）
      cy.nodes().removeClass('selected neighbor-highlight');
      cy.edges().removeClass('highlighted');
      
      // 重置节点透明度（但保留实体类型高亮的影响）
      cy.nodes().forEach(node => {
        if (!node.hasClass('entity-type-highlight') && highlightedEntityType) {
          node.style('opacity', 0.3);
        } else if (!highlightedEntityType) {
          node.style('opacity', 1);
        }
      });

      // 高亮选中的节点及其关联
      if (selectedNodeId) {
        const selectedNode = cy.getElementById(selectedNodeId);
        if (selectedNode) {
          selectedNode.addClass('selected');
          selectedNode.style('opacity', 1); // 确保选中节点完全不透明
          
          const connectedEdges = selectedNode.connectedEdges();
          connectedEdges.addClass('highlighted');
          
          // 高亮相邻节点
          const neighbors = selectedNode.neighborhood('node');
          neighbors.addClass('neighbor-highlight');
          neighbors.forEach(neighbor => {
            neighbor.style('opacity', 1); // 确保相邻节点完全不透明
          });
        }
      }
    });
    
    // 恢复缩放和位置 - 在 batch 之后执行，确保视图不变
    cy.zoom(targetZoom);
    cy.pan(targetPan);
    
    // 更新保存的视图状态
    currentZoomRef.current = targetZoom;
    currentPanRef.current = targetPan;
  }, [selectedNodeId, highlightedEntityType]);

  // 处理实体类型高亮
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    
    // 清除之前的实体类型高亮
    cy.nodes().removeClass('entity-type-highlight');
    
    // 重置所有节点的透明度（但保留选中节点和相邻节点的高亮）
    cy.nodes().forEach(node => {
      if (!node.hasClass('selected') && !node.hasClass('neighbor-highlight')) {
        node.style('opacity', 1);
      }
    });
    
    if (highlightedEntityType) {
      // 高亮指定类型的所有节点
      cy.nodes(`[type = "${highlightedEntityType}"]`).addClass('entity-type-highlight');
      
      // 降低其他类型节点的透明度（但保留选中节点和相邻节点）
      cy.nodes(`[type != "${highlightedEntityType}"]`).forEach(node => {
        if (!node.hasClass('selected') && !node.hasClass('neighbor-highlight')) {
          node.style('opacity', 0.3);
        }
      });
    }
  }, [highlightedEntityType]);

  if (loading) {
    return (
      <div className="graph-loading">
        <Spin size="large">
          <div style={{ marginTop: 8 }}>加载图谱数据...</div>
        </Spin>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <div ref={containerRef} className="graph-canvas" />
    </div>
  );
};

const formatGraphData = (data, schema) => {
  const elements = [];

  if (data.nodes) {
    // 统计节点类型和颜色使用情况
    const typeColorMap = {};
    const missingTypes = new Set();
    
    data.nodes.forEach(node => {
      const entityType = schema?.entityTypes?.[node.type];
      const label = formatNodeLabel(node, schema);
      const color = entityType?.color || '#1890ff';
      
      // 记录类型和颜色映射
      if (!typeColorMap[node.type]) {
        typeColorMap[node.type] = color;
      }
      
      // 记录缺失的类型定义
      if (!entityType) {
        missingTypes.add(node.type);
      }
      
      elements.push({
        data: {
          id: node.id,
          label: label,
          type: node.type,
          properties: node.data,
          color: color
        }
      });
    });
    
    // 输出颜色映射摘要（仅在开发环境）
    if (Object.keys(typeColorMap).length > 0) {
      console.log('GraphView: 节点类型颜色映射:', typeColorMap);
      if (missingTypes.size > 0) {
        console.warn('GraphView: 以下类型在Schema中未定义:', Array.from(missingTypes));
      }
    }
  }

  if (data.edges) {
    data.edges.forEach(edge => {
      const relationType = schema?.relationTypes?.[edge.type];
      const edgeLabel = formatEdgeLabel(edge, relationType);
      elements.push({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edgeLabel,
          type: edge.type,
          properties: edge.data
        }
      });
    });
  }

  return elements;
};

// 格式化边标签，包含对象属性
const formatEdgeLabel = (edge, relationType) => {
  const relationLabel = relationType?.label || edge.type;
  const properties = edge.data || {};
  const propertyDefs = relationType?.properties || {};

  // 如果没有对象属性，只显示关系标签
  if (Object.keys(properties).length === 0 || Object.keys(propertyDefs).length === 0) {
    return relationLabel;
  }

  // 选择最重要的属性显示（最多2个）
  const importantProps = [];
  const priorityKeys = ['priority', 'status', 'progress', 'completion_percentage', 'complexity'];
  
  for (const key of priorityKeys) {
    if (properties[key] !== undefined && properties[key] !== null) {
      const propDef = propertyDefs[key];
      const label = propDef?.description || key;
      let value = properties[key];
      
      // 格式化值
      if (typeof value === 'boolean') {
        value = value ? '是' : '否';
      } else if (typeof value === 'number') {
        value = propDef?.type === 'Float' ? value.toFixed(1) : value;
      }
      
      importantProps.push(`${label}: ${value}`);
      if (importantProps.length >= 2) break;
    }
  }

  // 如果没有找到优先属性，显示前2个属性
  if (importantProps.length === 0) {
    const allKeys = Object.keys(properties).filter(k => propertyDefs[k]);
    for (const key of allKeys.slice(0, 2)) {
      const propDef = propertyDefs[key];
      const label = propDef?.description || key;
      let value = properties[key];
      
      if (typeof value === 'boolean') {
        value = value ? '是' : '否';
      } else if (value instanceof Date || key.includes('date') || key.includes('Date')) {
        value = new Date(value).toLocaleDateString('zh-CN');
      }
      
      importantProps.push(`${label}: ${value}`);
    }
  }

  // 组合标签
  if (importantProps.length > 0) {
    return relationLabel + '\n' + importantProps.join('\n');
  }

  return relationLabel;
};

// 格式化节点标签，显示关键属性
const formatNodeLabel = (node, schema) => {
  const data = node.data || {};
  const type = node.type;
  
  // 主标题
  let mainLabel = data.title || data.project_name || data.name || node.id;
  
  // 根据实体类型添加关键属性
  const attrs = [];
  
  switch (type) {
    case 'VehicleProject':
      if (data.platform) attrs.push(`平台: ${data.platform}`);
      if (data.status) attrs.push(`状态: ${data.status}`);
      break;
    case 'DomainProject':
      if (data.domain) attrs.push(`领域: ${data.domain}`);
      if (data.status) attrs.push(`状态: ${data.status}`);
      break;
    case 'SSTS':
      if (data.priority) attrs.push(`优先级: ${data.priority}`);
      if (data.completion_rate !== undefined) attrs.push(`完成: ${data.completion_rate}%`);
      break;
    case 'FeatureRequirement':
      if (data.priority) attrs.push(`优先级: ${data.priority}`);
      if (data.status) attrs.push(`状态: ${data.status}`);
      break;
    case 'SWR':
    case 'ModuleRequirement':
      if (data.owner) attrs.push(`负责: ${data.owner}`);
      if (data.status) attrs.push(`状态: ${data.status}`);
      break;
    case 'ModelVersion':
      if (data.version_number) attrs.push(`版本: ${data.version_number}`);
      if (data.accuracy !== undefined) attrs.push(`精度: ${(data.accuracy * 100).toFixed(1)}%`);
      break;
    case 'Sprint':
      if (data.duration) attrs.push(`周期: ${data.duration}天`);
      if (data.status) attrs.push(`状态: ${data.status}`);
      break;
    case 'PIPlanning':
      if (data.sprintCount) attrs.push(`Sprint数: ${data.sprintCount}`);
      if (data.progress !== undefined) attrs.push(`进度: ${data.progress}%`);
      break;
    case 'Task':
      if (data.assignee) attrs.push(`分配给: ${data.assignee}`);
      if (data.status) attrs.push(`状态: ${data.status}`);
      break;
    case 'TestCase':
      if (data.test_type) attrs.push(`类型: ${data.test_type}`);
      if (data.status) attrs.push(`状态: ${data.status}`);
      break;
    default:
      // 通用属性显示
      if (data.status) attrs.push(`状态: ${data.status}`);
      if (data.priority) attrs.push(`优先级: ${data.priority}`);
      break;
  }
  
  // 组合标签，使用换行符
  if (attrs.length > 0) {
    // 限制只显示前2个属性，避免节点过大
    return mainLabel + '\n' + attrs.slice(0, 2).join('\n');
  }
  
  return mainLabel;
};

const getGraphStyle = (schema) => {
  return [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'background-color': 'data(color)',
        'color': '#333',
        'font-size': '9px',
        'width': '80px',
        'height': '80px',
        'text-wrap': 'wrap',
        'text-max-width': '75px',
        'font-weight': '500',
        'border-width': 2,
        'border-color': '#fff',
        'overlay-padding': '4px',
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.95,
        'text-background-padding': '4px',
        'text-background-shape': 'roundrectangle'
      }
    },
    {
      selector: 'node.selected',
      style: {
        'border-width': 4,
        'border-color': '#faad14',
        'text-background-color': '#fff7e6',
        'text-background-opacity': 0.95
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#d9d9d9',
        'target-arrow-color': '#d9d9d9',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '8px',
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
        'color': '#595959',
        'text-wrap': 'wrap',
        'text-max-width': '100px',
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.9,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle'
      }
    },
    {
      selector: 'edge.highlighted',
      style: {
        'width': 4,
        'line-color': '#1890ff',
        'target-arrow-color': '#1890ff',
        'opacity': 1,
        'z-index': 999
      }
    },
    {
      selector: 'node.neighbor-highlight',
      style: {
        'border-width': 3,
        'border-color': '#52c41a',
        'opacity': 1,
        'z-index': 998
      }
    },
    {
      selector: 'node.entity-type-highlight',
      style: {
        'border-width': 3,
        'border-color': '#722ed1',
        'opacity': 1,
        'z-index': 997
      }
    },
  ];
};

export default GraphView;

