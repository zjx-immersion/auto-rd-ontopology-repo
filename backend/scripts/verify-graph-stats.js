#!/usr/bin/env node

/**
 * 验证图谱统计数据的准确性
 */

const fs = require('fs');
const path = require('path');

// 图谱路径
const graphsDir = path.join(__dirname, '../../data/graphs');
// 动态获取所有图谱文件
const graphFiles = fs.readdirSync(graphsDir)
  .filter(file => file.startsWith('graph_') && file.endsWith('.json'))
  .sort();

console.log('🔍 开始验证图谱统计数据...\n');

graphFiles.forEach(filename => {
  const filepath = path.join(graphsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`❌ 文件不存在: ${filename}\n`);
    return;
  }
  
  const graph = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const { metadata, data } = graph;
  
  console.log(`📊 图谱: ${metadata.name}`);
  console.log(`   ID: ${graph.id}`);
  console.log(`   创建时间: ${metadata.createdAt}`);
  console.log('');
  
  // 验证节点数
  const actualNodeCount = data.nodes.length;
  const recordedNodeCount = metadata.statistics?.nodeCount;
  
  console.log(`   节点数:`);
  console.log(`   - 记录值: ${recordedNodeCount}`);
  console.log(`   - 实际值: ${actualNodeCount}`);
  console.log(`   - 状态: ${actualNodeCount === recordedNodeCount ? '✅ 准确' : '❌ 不一致'}`);
  
  // 验证边数
  const actualEdgeCount = data.edges.length;
  const recordedEdgeCount = metadata.statistics?.edgeCount;
  
  console.log(`   边数:`);
  console.log(`   - 记录值: ${recordedEdgeCount}`);
  console.log(`   - 实际值: ${actualEdgeCount}`);
  console.log(`   - 状态: ${actualEdgeCount === recordedEdgeCount ? '✅ 准确' : '❌ 不一致'}`);
  
  // 统计节点类型分布
  const nodeTypeDistribution = {};
  data.nodes.forEach(node => {
    nodeTypeDistribution[node.type] = (nodeTypeDistribution[node.type] || 0) + 1;
  });
  
  console.log(`   节点类型分布:`);
  Object.entries(nodeTypeDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
  
  // 统计边类型分布
  const edgeTypeDistribution = {};
  data.edges.forEach(edge => {
    edgeTypeDistribution[edge.type] = (edgeTypeDistribution[edge.type] || 0) + 1;
  });
  
  console.log(`   边类型分布:`);
  Object.entries(edgeTypeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // 只显示前10个
    .forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
  
  // 检查节点属性
  console.log(`   节点属性检查:`);
  let nodesWithData = 0;
  let nodesWithoutData = 0;
  let totalProperties = 0;
  
  data.nodes.forEach(node => {
    if (node.data && typeof node.data === 'object') {
      nodesWithData++;
      totalProperties += Object.keys(node.data).length;
    } else {
      nodesWithoutData++;
    }
  });
  
  console.log(`   - 有属性数据的节点: ${nodesWithData} (${(nodesWithData/actualNodeCount*100).toFixed(1)}%)`);
  console.log(`   - 无属性数据的节点: ${nodesWithoutData} (${(nodesWithoutData/actualNodeCount*100).toFixed(1)}%)`);
  console.log(`   - 平均属性数: ${(totalProperties/nodesWithData).toFixed(1)}`);
  
  if (nodesWithoutData > 0) {
    console.log(`   ⚠️  警告: 发现 ${nodesWithoutData} 个节点缺少属性数据`);
    // 显示缺少属性的节点示例
    const nodesWithoutDataList = data.nodes.filter(node => !node.data || typeof node.data !== 'object');
    console.log(`   示例:`, nodesWithoutDataList.slice(0, 3).map(n => `${n.id} (${n.type})`).join(', '));
  }
  
  // 检查边属性
  console.log(`   边属性检查:`);
  let edgesWithData = 0;
  let edgesWithoutData = 0;
  
  data.edges.forEach(edge => {
    if (edge.data && typeof edge.data === 'object') {
      edgesWithData++;
    } else {
      edgesWithoutData++;
    }
  });
  
  console.log(`   - 有属性数据的边: ${edgesWithData} (${(edgesWithData/actualEdgeCount*100).toFixed(1)}%)`);
  console.log(`   - 无属性数据的边: ${edgesWithoutData} (${(edgesWithoutData/actualEdgeCount*100).toFixed(1)}%)`);
  
  console.log('');
  console.log('─'.repeat(70));
  console.log('');
});

console.log('✅ 验证完成！');
