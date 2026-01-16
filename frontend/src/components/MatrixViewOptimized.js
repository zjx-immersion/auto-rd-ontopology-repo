import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Select, Spin, Empty, Space, Tag, Switch, Pagination, Modal, Descriptions, Button, Divider } from 'antd';
import { HeatMapOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import './MatrixView.css';

const MatrixViewOptimized = ({ data, schema }) => {
  const [relationType, setRelationType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showValues, setShowValues] = useState(false); // 默认关闭数值显示以提升性能
  const [sortBy, setSortBy] = useState('degree-desc'); // 排序方式
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // 每页显示50个节点
  const [cellDetailVisible, setCellDetailVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 计算节点度数
  const calculateNodeDegrees = (nodes, edges) => {
    const degrees = new Map();
    nodes.forEach(node => {
      degrees.set(node.id, { in: 0, out: 0, total: 0 });
    });

    edges.forEach(edge => {
      const sourceDegree = degrees.get(edge.source);
      const targetDegree = degrees.get(edge.target);
      if (sourceDegree) {
        sourceDegree.out += 1;
        sourceDegree.total += 1;
      }
      if (targetDegree) {
        targetDegree.in += 1;
        targetDegree.total += 1;
      }
    });

    return degrees;
  };

  // 排序节点
  const sortedNodes = useMemo(() => {
    if (!data?.nodes || !data?.edges) return [];

    const nodes = data.nodes.map(n => ({
      id: n.id,
      label: n.label || n.id,
      type: n.type,
      data: n.data
    }));

    const degrees = calculateNodeDegrees(nodes, data.edges);

    switch (sortBy) {
      case 'degree-desc':
        return nodes.sort((a, b) => 
          degrees.get(b.id).total - degrees.get(a.id).total
        );
      case 'out-degree-desc':
        return nodes.sort((a, b) => 
          degrees.get(b.id).out - degrees.get(a.id).out
        );
      case 'in-degree-desc':
        return nodes.sort((a, b) => 
          degrees.get(b.id).in - degrees.get(a.id).in
        );
      case 'id-asc':
        return nodes.sort((a, b) => a.id.localeCompare(b.id));
      case 'type-group':
        return nodes.sort((a, b) => {
          if (a.type === b.type) {
            return a.id.localeCompare(b.id);
          }
          return a.type.localeCompare(b.type);
        });
      default:
        return nodes;
    }
  }, [data, sortBy]);

  // 当前页的节点
  const paginatedNodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedNodes.slice(start, end);
  }, [sortedNodes, currentPage, pageSize]);

  // 构建关系矩阵数据
  const buildRelationMatrix = (nodes, selectedRelationType) => {
    if (!data?.edges || nodes.length === 0) {
      return { nodes, matrix: new Map(), max: 0 };
    }

    // 过滤边
    const edges = selectedRelationType === 'all' 
      ? data.edges 
      : data.edges.filter(e => e.type === selectedRelationType);

    // 构建矩阵
    const matrix = new Map();
    let maxCount = 0;

    nodes.forEach(source => {
      nodes.forEach(target => {
        const key = `${source.id}-${target.id}`;
        const edgesList = edges.filter(e => 
          e.source === source.id && e.target === target.id
        );
        const count = edgesList.length;
        
        if (count > 0) {
          matrix.set(key, { count, edges: edgesList });
          maxCount = Math.max(maxCount, count);
        }
      });
    });

    return { nodes, matrix, max: maxCount };
  };

  // 渲染热力图
  const renderHeatmap = (matrixData) => {
    if (!chartRef.current || matrixData.nodes.length === 0) {
      return;
    }

    // 准备数据
    const xAxisData = matrixData.nodes.map(n => n.label);
    const yAxisData = matrixData.nodes.map(n => n.label);
    const seriesData = [];

    matrixData.nodes.forEach((source, i) => {
      matrixData.nodes.forEach((target, j) => {
        const key = `${source.id}-${target.id}`;
        const cellData = matrixData.matrix.get(key);
        if (cellData && cellData.count > 0) {
          seriesData.push({
            value: [j, i, cellData.count],
            sourceNode: source,
            targetNode: target,
            edges: cellData.edges
          });
        }
      });
    });

    const option = {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          if (params.data) {
            const { sourceNode, targetNode, value } = params.data;
            return `${sourceNode.label} → ${targetNode.label}<br/>关系数: ${value[2]}<br/>点击查看详情`;
          }
          return '';
        }
      },
      grid: {
        left: '15%',
        right: '5%',
        top: '5%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        splitArea: {
          show: true
        },
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          interval: 0,
          formatter: (value) => {
            // 截断过长的标签
            return value.length > 15 ? value.substring(0, 15) + '...' : value;
          }
        }
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        splitArea: {
          show: true
        },
        axisLabel: {
          fontSize: 10,
          formatter: (value) => {
            return value.length > 15 ? value.substring(0, 15) + '...' : value;
          }
        }
      },
      visualMap: {
        min: 0,
        max: matrixData.max,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594']
        }
      },
      // 添加缩放和平移功能
      dataZoom: [
        {
          type: 'slider',
          xAxisIndex: 0,
          start: 0,
          end: 100,
          height: 20,
          bottom: 60
        },
        {
          type: 'slider',
          yAxisIndex: 0,
          start: 0,
          end: 100,
          width: 20,
          right: 10
        },
        {
          type: 'inside',
          xAxisIndex: 0
        },
        {
          type: 'inside',
          yAxisIndex: 0
        }
      ],
      series: [
        {
          name: '关系矩阵',
          type: 'heatmap',
          data: seriesData,
          label: {
            show: showValues,
            fontSize: 9
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              borderColor: '#333',
              borderWidth: 2
            }
          }
        }
      ]
    };

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    // 使用Canvas渲染以提升性能
    chartInstance.current = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    chartInstance.current.setOption(option);

    // 添加点击事件
    chartInstance.current.on('click', (params) => {
      if (params.componentType === 'series' && params.data) {
        handleCellClick(params.data);
      }
    });

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  };

  // 处理单元格点击
  const handleCellClick = (cellData) => {
    setSelectedCell(cellData);
    setCellDetailVisible(true);
  };

  // 数据变化时重新渲染
  useEffect(() => {
    if (paginatedNodes.length > 0 && chartRef.current) {
      setLoading(true);
      
      setTimeout(() => {
        const matrixData = buildRelationMatrix(paginatedNodes, relationType);
        renderHeatmap(matrixData);
        setLoading(false);
      }, 100);
    }
  }, [paginatedNodes, relationType, showValues]);

  // 组件卸载时销毁图表
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, []);

  // 获取统计信息
  const getStatistics = () => {
    if (!data?.edges) return { total: 0, byType: {} };

    const byType = {};
    data.edges.forEach(edge => {
      byType[edge.type] = (byType[edge.type] || 0) + 1;
    });

    return {
      total: data.edges.length,
      byType
    };
  };

  const stats = getStatistics();

  // 全屏显示
  const handleFullscreen = () => {
    if (chartRef.current) {
      chartRef.current.requestFullscreen?.();
    }
  };

  return (
    <>
      <Card 
        className="matrix-view-card"
        title={
          <Space>
            <HeatMapOutlined />
            <span>关系矩阵</span>
            <Tag color="blue">{sortedNodes.length} 个节点</Tag>
            <Tag color="green">{stats.total} 条关系</Tag>
            {sortedNodes.length > pageSize && (
              <Tag color="orange">第 {currentPage}/{Math.ceil(sortedNodes.length / pageSize)} 页</Tag>
            )}
          </Space>
        }
        extra={
          <Space wrap>
            <span style={{ fontSize: 12 }}>排序:</span>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 140 }}
              size="small"
            >
              <Select.Option value="degree-desc">度数降序</Select.Option>
              <Select.Option value="out-degree-desc">出度降序</Select.Option>
              <Select.Option value="in-degree-desc">入度降序</Select.Option>
              <Select.Option value="id-asc">ID升序</Select.Option>
              <Select.Option value="type-group">类型分组</Select.Option>
            </Select>
            
            <span style={{ fontSize: 12 }}>关系:</span>
            <Select
              value={relationType}
              onChange={setRelationType}
              style={{ width: 160 }}
              size="small"
            >
              <Select.Option value="all">
                所有关系 ({stats.total})
              </Select.Option>
              {schema?.relationTypes && Object.entries(schema.relationTypes).map(([id, rel]) => {
                const count = stats.byType[id] || 0;
                return (
                  <Select.Option key={id} value={id}>
                    {rel.label || id} ({count})
                  </Select.Option>
                );
              })}
            </Select>
            
            <span style={{ fontSize: 12 }}>数值:</span>
            <Switch 
              checked={showValues} 
              onChange={setShowValues}
              size="small"
            />
            
            <Button 
              size="small" 
              icon={<FullscreenOutlined />}
              onClick={handleFullscreen}
              title="全屏显示"
            />
          </Space>
        }
      >
        <Spin spinning={loading} tip="生成矩阵中...">
          {data?.nodes && data.nodes.length > 0 ? (
            <>
              <div 
                ref={chartRef} 
                className="matrix-chart-container"
                style={{ 
                  width: '100%', 
                  height: Math.max(500, paginatedNodes.length * 25 + 150)
                }} 
              />
              
              {sortedNodes.length > pageSize && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={sortedNodes.length}
                    onChange={setCurrentPage}
                    onShowSizeChange={(current, size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total) => `共 ${total} 个节点`}
                    pageSizeOptions={['25', '50', '100', '200']}
                  />
                </div>
              )}
            </>
          ) : (
            <Empty 
              description="暂无数据" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '60px 0' }}
            />
          )}
        </Spin>
      </Card>

      {/* 单元格详情Modal */}
      <Modal
        title={
          <Space>
            <HeatMapOutlined />
            <span>关系详情</span>
          </Space>
        }
        open={cellDetailVisible}
        onCancel={() => setCellDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCellDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedCell && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="源节点">
                <Space>
                  <Tag color="blue">{selectedCell.sourceNode.label}</Tag>
                  <Tag color="cyan">{schema?.entityTypes?.[selectedCell.sourceNode.type]?.label || selectedCell.sourceNode.type}</Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="目标节点">
                <Space>
                  <Tag color="green">{selectedCell.targetNode.label}</Tag>
                  <Tag color="cyan">{schema?.entityTypes?.[selectedCell.targetNode.type]?.label || selectedCell.targetNode.type}</Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="关系数量">
                <Tag color="red">{selectedCell.value[2]}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">关系列表</Divider>
            
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {selectedCell.edges.map((edge, index) => {
                const relationType = schema?.relationTypes?.[edge.type];
                return (
                  <Card key={index} size="small" type="inner">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="关系类型">
                        <Tag color="purple">{relationType?.label || edge.type}</Tag>
                      </Descriptions.Item>
                      {relationType?.description && (
                        <Descriptions.Item label="说明">
                          {relationType.description}
                        </Descriptions.Item>
                      )}
                      {edge.data && Object.keys(edge.data).length > 0 && (
                        <Descriptions.Item label="属性">
                          {Object.entries(edge.data).map(([key, value]) => (
                            <Tag key={key} color="blue">
                              {key}: {String(value)}
                            </Tag>
                          ))}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                );
              })}
            </Space>
          </div>
        )}
      </Modal>
    </>
  );
};

export default MatrixViewOptimized;
