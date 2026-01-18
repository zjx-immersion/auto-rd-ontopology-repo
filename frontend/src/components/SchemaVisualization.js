import React, { useEffect, useRef, useMemo } from 'react';
import { Card, Empty, Space, Tag } from 'antd';
import { ApartmentOutlined } from '@ant-design/icons';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import './SchemaVisualization.css';

cytoscape.use(dagre);

/**
 * Schema可视化组件
 * 使用图形化方式展示Schema的结构，包括实体类型、关系类型和属性
 */
const SchemaVisualization = ({ schema }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  // 构建Schema图谱数据
  const schemaGraphData = useMemo(() => {
    if (!schema) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];

    // 添加实体类型节点
    if (schema.entityTypes) {
      Object.entries(schema.entityTypes).forEach(([typeId, typeDef]) => {
        nodes.push({
          data: {
            id: typeId,
            label: typeDef.label || typeId,
            type: 'entityType',
            typeId,
            color: typeDef.color || '#1890ff',
            propertiesCount: Object.keys(typeDef.properties || {}).length,
            description: typeDef.description || ''
          }
        });
      });
    }

    // 添加关系类型边
    if (schema.relationTypes) {
      Object.entries(schema.relationTypes).forEach(([relTypeId, relDef]) => {
        const fromTypes = relDef.from || [];
        const toTypes = relDef.to || [];

        // 为每个允许的源类型和目标类型组合创建边
        fromTypes.forEach(fromType => {
          toTypes.forEach(toType => {
            // 确保源和目标节点存在
            if (schema.entityTypes[fromType] && schema.entityTypes[toType]) {
              const edgeId = `${fromType}-${relTypeId}-${toType}`;
              edges.push({
                data: {
                  id: edgeId,
                  source: fromType,
                  target: toType,
                  label: relDef.label || relTypeId,
                  type: relTypeId,
                  relationType: relDef,
                  description: relDef.description || ''
                }
              });
            }
          });
        });
      });
    }

    return { nodes, edges };
  }, [schema]);

  // 获取图谱样式
  const getGraphStyle = () => {
    return [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'width': 120,
          'height': 50,
          'shape': 'round-rectangle',
          'background-color': 'data(color)',
          'color': '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '12px',
          'font-weight': 'bold',
          'padding': '8px',
          'text-wrap': 'wrap',
          'text-max-width': '110px',
          'border-width': 2,
          'border-color': '#fff',
          'overlay-padding': '4px'
        }
      },
      {
        selector: 'node[type="entityType"]',
        style: {
          'width': 'mapData(propertiesCount, 0, 10, 80, 150)',
          'height': 'mapData(propertiesCount, 0, 10, 40, 80)'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#999',
          'target-arrow-color': '#999',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': '10px',
          'text-rotation': 'autorotate',
          'text-margin-y': -10,
          'color': '#666',
          'text-background-color': '#fff',
          'text-background-opacity': 0.8,
          'text-background-padding': '2px'
        }
      },
      {
        selector: 'edge[source = target]',
        style: {
          'curve-style': 'loop',
          'loop-direction': '0deg',
          'loop-sweep': '180deg',
          'control-point-step-size': 50
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#ff4d4f',
          'overlay-opacity': 0.3
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#ff4d4f',
          'target-arrow-color': '#ff4d4f',
          'width': 4
        }
      }
    ];
  };

  // 初始化Cytoscape图谱
  useEffect(() => {
    if (!containerRef.current || !schema || schemaGraphData.nodes.length === 0) {
      return;
    }

    // 销毁旧实例
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...schemaGraphData.nodes, ...schemaGraphData.edges],
      style: getGraphStyle(),
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 50,
        rankSep: 100,
        padding: 30,
        animate: false,
        fit: true,
        avoidOverlap: true
      },
      minZoom: 0.1,
      maxZoom: 3
    });

    // 添加节点点击事件，显示详细信息
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = node.data();
      
      // 高亮相关节点和边
      cy.elements().removeClass('highlight');
      node.addClass('highlight');
      node.connectedEdges().addClass('highlight');
      node.neighborhood().addClass('highlight');
      
      // 显示tooltip信息
      const tooltip = document.getElementById('schema-tooltip');
      if (tooltip) {
        const entityType = schema.entityTypes[nodeData.typeId];
        if (entityType) {
          const properties = Object.keys(entityType.properties || {});
          tooltip.innerHTML = `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px; color: ${nodeData.color}">
                ${nodeData.label}
              </div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px">
                <strong>类型ID:</strong> ${nodeData.typeId}
              </div>
              ${nodeData.description ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px">${nodeData.description}</div>` : ''}
              <div style="font-size: 12px; color: #666; margin-bottom: 4px">
                <strong>属性数:</strong> ${properties.length}
              </div>
              ${properties.length > 0 ? `
                <div style="font-size: 11px; color: #999; margin-top: 8px; max-height: 150px; overflow-y: auto">
                  <strong>属性列表:</strong><br/>
                  ${properties.slice(0, 10).map(p => `• ${p}`).join('<br/>')}
                  ${properties.length > 10 ? `<br/>... 还有 ${properties.length - 10} 个属性` : ''}
                </div>
              ` : ''}
            </div>
          `;
          tooltip.style.display = 'block';
          tooltip.style.left = evt.originalEvent.clientX + 10 + 'px';
          tooltip.style.top = evt.originalEvent.clientY + 10 + 'px';
        }
      }
    });

    // 添加边点击事件
    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      const edgeData = edge.data();
      
      // 高亮相关元素
      cy.elements().removeClass('highlight');
      edge.addClass('highlight');
      edge.source().addClass('highlight');
      edge.target().addClass('highlight');
      
      // 显示tooltip信息
      const tooltip = document.getElementById('schema-tooltip');
      if (tooltip) {
        tooltip.innerHTML = `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #722ed1">
              ${edgeData.label}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px">
              <strong>关系类型ID:</strong> ${edgeData.type}
            </div>
            ${edgeData.description ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px">${edgeData.description}</div>` : ''}
            <div style="font-size: 12px; color: #666; margin-bottom: 4px">
              <strong>源类型:</strong> ${schema.entityTypes[edgeData.source]?.label || edgeData.source}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px">
              <strong>目标类型:</strong> ${schema.entityTypes[edgeData.target]?.label || edgeData.target}
            </div>
          </div>
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = evt.originalEvent.clientX + 10 + 'px';
        tooltip.style.top = evt.originalEvent.clientY + 10 + 'px';
      }
    });

    // 点击空白区域取消高亮
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlight');
        const tooltip = document.getElementById('schema-tooltip');
        if (tooltip) {
          tooltip.style.display = 'none';
        }
      }
    });

    cyRef.current = cy;

    return () => {
      if (cy) {
        cy.destroy();
      }
    };
  }, [schema, schemaGraphData]);

  if (!schema) {
    return (
      <Card>
        <Empty description="暂无Schema数据" />
      </Card>
    );
  }

  if (schemaGraphData.nodes.length === 0) {
    return (
      <Card>
        <Empty description="Schema中没有实体类型定义" />
      </Card>
    );
  }

  return (
    <div className="schema-visualization-container">
      <div className="schema-visualization-info">
        <Space>
          <Tag color="blue">
            <ApartmentOutlined /> {schemaGraphData.nodes.length} 个实体类型
          </Tag>
          <Tag color="purple">
            {schemaGraphData.edges.length} 种关系连接
          </Tag>
          <span style={{ fontSize: '12px', color: '#999' }}>
            提示: 点击节点或边查看详细信息，拖拽可调整布局
          </span>
        </Space>
      </div>
      <div 
        ref={containerRef} 
        className="schema-visualization-graph"
        style={{ 
          width: '100%', 
          height: '100%',
          border: '1px solid #e8e8e8',
          borderRadius: '4px',
          backgroundColor: '#fafafa'
        }}
      />
      {/* Tooltip容器 */}
      <div 
        id="schema-tooltip"
        style={{
          display: 'none',
          position: 'fixed',
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          padding: '0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '300px',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default SchemaVisualization;
