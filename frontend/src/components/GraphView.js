import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import './GraphView.css';

cytoscape.use(dagre);

const GraphView = ({ data, schema, loading, onNodeClick, selectedNodeId }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || loading) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: formatGraphData(data, schema),
      style: getGraphStyle(schema),
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 40,
        rankSep: 100,
        padding: 30,
        animate: false,
        fit: true,
        avoidOverlap: true
      },
      minZoom: 0.1,
      maxZoom: 3
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      // 获取完整的节点数据，包括原始数据中的data字段
      const properties = node.data('properties') || {};
      const nodeData = {
        id: node.id(),
        type: node.data('type'),
        label: node.data('label') || node.id(),
        data: properties // 确保传递属性数据
      };
      console.log('点击节点:', nodeData); // 调试用
      onNodeClick(nodeData);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onNodeClick(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cy) {
        cy.destroy();
      }
    };
  }, [data, schema, loading, onNodeClick]);

  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    cy.nodes().removeClass('selected');
    cy.edges().removeClass('highlighted');

    if (selectedNodeId) {
      const selectedNode = cy.getElementById(selectedNodeId);
      if (selectedNode) {
        selectedNode.addClass('selected');
        selectedNode.connectedEdges().addClass('highlighted');
      }
    }
  }, [selectedNodeId]);

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
    data.nodes.forEach(node => {
      const entityType = schema?.entityTypes?.[node.type];
      const label = formatNodeLabel(node, schema);
      elements.push({
        data: {
          id: node.id,
          label: label,
          type: node.type,
          properties: node.data,
          color: entityType?.color || '#1890ff'
        }
      });
    });
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
        'width': 3,
        'line-color': '#1890ff',
        'target-arrow-color': '#1890ff',
        'z-index': 999
      }
    }
  ];
};

export default GraphView;

