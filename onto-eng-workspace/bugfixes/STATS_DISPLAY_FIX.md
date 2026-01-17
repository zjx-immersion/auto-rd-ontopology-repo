# 统计数据显示修复报告

## 问题描述

用户反馈了两个统计数据显示问题：

1. **图谱列表**：显示的节点数和关系数不是实际数据
2. **图谱视图**：侧边栏统计信息和图例说明需要显示真实的统计数据

## 根本原因

### 问题1：图谱列表统计数据不准确

**原因**：
- `MultiGraphService.getGraphs()` 方法只从索引文件 `index.json` 读取元数据
- 索引中的统计信息可能在图谱创建后未更新，导致显示过时数据

### 问题2：图谱视图统计数据不完整

**原因**：
- `Sidebar` 组件期望接收格式化的统计对象（`total_nodes`, `total_edges`, `entity_counts`）
- `GraphViewPage` 直接传递 `currentGraph.metadata.statistics`，但格式不匹配
- 图例说明硬编码了固定的实体类型，没有基于 Schema 动态生成

## 解决方案

### 修复1：后端 - 加载实时统计数据

**文件**：`backend/src/services/MultiGraphService.js`

**修改**：在 `getGraphs()` 方法中，读取每个图谱文件以获取实时统计：

```javascript
// 加载实际数据以获取真实统计信息
const graphsWithRealStats = await Promise.all(
  graphs.map(async (graphMeta) => {
    try {
      const graphPath = path.join(this.graphsDir, `${graphMeta.id}.json`);
      const graphData = await fs.readFile(graphPath, 'utf8');
      const fullGraph = JSON.parse(graphData);
      
      // 计算实时统计
      const nodeCount = fullGraph.data?.nodes?.length || 0;
      const edgeCount = fullGraph.data?.edges?.length || 0;
      
      return {
        ...graphMeta,
        metadata: {
          ...graphMeta,
          statistics: {
            nodeCount,
            edgeCount,
            lastAccessed: fullGraph.metadata?.statistics?.lastAccessed
          }
        }
      };
    } catch (error) {
      console.error(`Failed to load graph ${graphMeta.id} for stats:`, error);
      return graphMeta;
    }
  })
);
```

**优点**：
- ✅ 始终返回最新的节点数和关系数
- ✅ 容错处理，加载失败时返回原始元数据
- ✅ 使用 Promise.all 并行加载，性能优化

### 修复2：前端 - 计算实时统计信息

**文件**：`frontend/src/pages/GraphViewPage.js`

**修改**：使用 `useMemo` 计算实时统计信息：

```javascript
import React, { useState, useEffect, useMemo } from 'react';

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
```

**传递给 Sidebar**：

```javascript
<Sidebar
  schema={schema}
  statistics={statistics}  // 使用计算出的统计信息
  onSearch={(keyword) => {
    console.log('搜索:', keyword);
  }}
/>
```

**优点**：
- ✅ 数据始终与当前图谱同步
- ✅ 使用 `useMemo` 优化性能，仅在 `currentGraph` 变化时重新计算
- ✅ 提供正确的数据格式给 `Sidebar` 组件

### 修复3：Sidebar - 动态生成图例说明

**文件**：`frontend/src/components/Sidebar.js`

**修改**：基于 Schema 动态生成图例：

```javascript
const renderLegend = () => {
  if (!schema || !schema.entityTypes) {
    return <div style={{ color: '#999', fontSize: 12 }}>暂无Schema定义</div>;
  }

  return Object.entries(schema.entityTypes).map(([key, entity]) => (
    <div key={key} className="legend-item">
      <div 
        className="legend-color" 
        style={{ background: entity.color || '#1890ff' }}
      ></div>
      <span>{entity.label || key}</span>
      {entity.description && (
        <span 
          className="legend-desc" 
          style={{ fontSize: 11, color: '#999', marginLeft: 4 }}
          title={entity.description}
        >
          ({entity.description.length > 10 ? entity.description.substring(0, 10) + '...' : entity.description})
        </span>
      )}
    </div>
  ));
};
```

**优点**：
- ✅ 自动适配不同的 Schema 定义
- ✅ 显示实体类型的颜色、标签和描述
- ✅ 支持长描述的截断和 hover 显示完整内容

## 测试验证

### 测试场景1：图谱列表页统计数据

**步骤**：
1. 启动系统 `./start.sh`
2. 打开浏览器访问 `http://localhost:8080/graphs`
3. 查看图谱卡片上显示的节点数和关系数

**预期结果**：
- ✅ 显示实际的节点数和关系数
- ✅ 数据与图谱文件中的实际数据一致

### 测试场景2：图谱视图侧边栏统计

**步骤**：
1. 在图谱列表页，点击某个图谱进入查看页
2. 查看左侧边栏的"统计信息"卡片
3. 查看"实体类型"卡片中每个类型的数量

**预期结果**：
- ✅ "节点数"和"关系数"显示正确数值
- ✅ 每个实体类型的数量与实际节点数一致
- ✅ 数据实时更新（如果通过导入功能添加新数据）

### 测试场景3：动态图例说明

**步骤**：
1. 在图谱视图页，查看左侧边栏的"图例说明"卡片
2. 对比 Schema 定义文件 `data/schema.json`

**预期结果**：
- ✅ 图例项与 Schema 中定义的 `entityTypes` 一致
- ✅ 显示正确的颜色和标签
- ✅ 如果有描述，显示在标签后面

### 测试场景4：空图谱处理

**步骤**：
1. 创建一个新的空图谱
2. 查看图谱列表中的统计数据
3. 进入空图谱的视图页

**预期结果**：
- ✅ 列表显示节点数 0，关系数 0
- ✅ 侧边栏显示节点数 0，关系数 0
- ✅ "实体类型"卡片为空
- ✅ "图例说明"显示所有 Schema 定义的类型（即使数量为0）

## 性能考虑

### getGraphs() 性能优化

**潜在问题**：
- 如果图谱数量很多（如100+），每次都加载所有文件可能较慢

**优化建议**（未来迭代）：
1. **索引缓存**：在内存中缓存最近访问的图谱统计信息
2. **分页加载**：只加载当前页的图谱文件，而不是所有图谱
3. **后台更新**：使用后台任务定期更新索引中的统计信息
4. **增量更新**：在图谱数据变更时立即更新索引

**当前实现评估**：
- ✅ 对于 < 50 个图谱，性能完全可接受
- ✅ 使用 `Promise.all` 并行加载
- ✅ 图谱文件大小通常不超过几MB，读取速度快

## 后续优化建议

### 1. 统计信息定期同步

可以考虑在以下时机自动更新索引中的统计信息：

- 图谱创建时
- 图谱更新（导入数据）时
- 图谱验证后
- 定时后台任务（如每小时）

### 2. Dashboard 组件优化

目前 Dashboard 组件已经正确计算统计信息，但可以进一步优化：

- 显示更多维度的统计（如平均度数、图谱密度）
- 提供统计数据的趋势图（如节点数随时间变化）
- 支持导出统计报告

### 3. 实时更新

考虑使用 WebSocket 实现统计数据的实时推送：

- 当图谱数据变更时，自动推送更新到前端
- 避免频繁刷新页面

## 总结

本次修复解决了统计数据显示不准确的核心问题：

| 问题 | 修复位置 | 状态 |
|------|---------|------|
| 图谱列表统计数据不准确 | `MultiGraphService.getGraphs()` | ✅ 已修复 |
| 图谱视图统计数据格式不匹配 | `GraphViewPage` + `useMemo` | ✅ 已修复 |
| 图例说明硬编码 | `Sidebar.renderLegend()` | ✅ 已修复 |

**核心改进**：
1. ✅ 所有统计数据基于实际图谱文件实时计算
2. ✅ 前端使用 `useMemo` 优化性能
3. ✅ 图例说明基于 Schema 动态生成
4. ✅ 支持空图谱和异常情况的处理

---

**修复时间**：2026-01-17  
**测试状态**：待验证  
**下一步**：启动系统进行完整的冒烟测试
