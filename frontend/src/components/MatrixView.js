import React, { useState, useEffect, useRef } from 'react';
import { Card, Select, Spin, Empty, Space, Tag, Switch } from 'antd';
import { HeatMapOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import './MatrixView.css';

const MatrixView = ({ data, schema }) => {
  const [relationType, setRelationType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 构建关系矩阵数据
  const buildRelationMatrix = (graphData, selectedRelationType) => {
    if (!graphData?.nodes || !graphData?.edges) {
      return { nodes: [], matrix: [], max: 0 };
    }

    // 获取所有节点
    const nodes = graphData.nodes.map(n => ({
      id: n.id,
      label: n.label || n.id,
      type: n.type
    }));

    // 过滤边
    const edges = selectedRelationType === 'all' 
      ? graphData.edges 
      : graphData.edges.filter(e => e.type === selectedRelationType);

    // 构建矩阵（记录每个节点对之间的关系数量）
    const matrix = new Map();
    let maxCount = 0;

    nodes.forEach(source => {
      nodes.forEach(target => {
        const key = `${source.id}-${target.id}`;
        const count = edges.filter(e => 
          e.source === source.id && e.target === target.id
        ).length;
        
        if (count > 0) {
          matrix.set(key, count);
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
        const value = matrixData.matrix.get(key) || 0;
        if (value > 0) {
          seriesData.push([j, i, value]);
        }
      });
    });

    const option = {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const sourceNode = matrixData.nodes[params.value[1]];
          const targetNode = matrixData.nodes[params.value[0]];
          return `${sourceNode.label} → ${targetNode.label}<br/>关系数: ${params.value[2]}`;
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
          fontSize: 11,
          interval: 0
        }
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        splitArea: {
          show: true
        },
        axisLabel: {
          fontSize: 11
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
      series: [
        {
          name: '关系矩阵',
          type: 'heatmap',
          data: seriesData,
          label: {
            show: showValues,
            fontSize: 10
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption(option);

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  };

  // 数据变化时重新渲染
  useEffect(() => {
    if (data && chartRef.current) {
      setLoading(true);
      
      // 使用 setTimeout 来避免阻塞 UI
      setTimeout(() => {
        const matrixData = buildRelationMatrix(data, relationType);
        renderHeatmap(matrixData);
        setLoading(false);
      }, 100);
    }
  }, [data, relationType, showValues]);

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

  return (
    <Card 
      className="matrix-view-card"
      title={
        <Space>
          <HeatMapOutlined />
          <span>关系矩阵</span>
          <Tag color="blue">{stats.total} 条关系</Tag>
        </Space>
      }
      extra={
        <Space>
          <span>显示数值</span>
          <Switch 
            checked={showValues} 
            onChange={setShowValues}
            size="small"
          />
          <Select
            value={relationType}
            onChange={setRelationType}
            style={{ width: 200 }}
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
        </Space>
      }
    >
      <Spin spinning={loading} tip="生成矩阵中...">
        {data?.nodes && data.nodes.length > 0 ? (
          <div 
            ref={chartRef} 
            className="matrix-chart-container"
            style={{ 
              width: '100%', 
              height: Math.max(500, data.nodes.length * 25 + 100)
            }} 
          />
        ) : (
          <Empty 
            description="暂无数据" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          />
        )}
      </Spin>
    </Card>
  );
};

export default MatrixView;
