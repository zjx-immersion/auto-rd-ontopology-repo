#!/usr/bin/env node

/**
 * 导入Schema V2.0的3个领域图谱数据到系统
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 路径配置
const dataPath = path.join(__dirname, '../../data');
const graphsDir = path.join(dataPath, 'graphs');
const indexPath = path.join(graphsDir, 'index.json');

// Schema路径
const schemaPath = path.join(dataPath, 'core-domain-schema-v2.json');

// 图谱数据路径（使用新的目录结构）
const graphFiles = [
  {
    file: path.join(dataPath, 'adas', 'adas-graph-v2-data.json'),
    name: '智能驾驶研发体系',
    description: '岚图智能驾驶研发知识图谱，包含城市NOA和自动泊车产品的完整研发流程，基于Schema V2.0'
  },
  {
    file: path.join(dataPath, 'ic', 'cabin-graph-v2-data.json'),
    name: '智能座舱研发体系',
    description: '岚图智能座舱研发知识图谱，包含座舱OS和智能语音产品的完整研发流程，基于Schema V2.0'
  },
  {
    file: path.join(dataPath, 'ee', 'ee-graph-v2-data.json'),
    name: '电子电器研发体系',
    description: '岚图电子电器研发知识图谱，包含中央计算平台和车身控制系统的完整研发流程，基于Schema V2.0'
  }
];

console.log('🚀 开始导入Schema V2.0的3个领域图谱数据到系统...\n');

// 确保graphs目录存在
if (!fs.existsSync(graphsDir)) {
  fs.mkdirSync(graphsDir, { recursive: true });
  console.log('📁 创建graphs目录...');
}

// 加载或创建index.json
let index = { graphs: {} };
if (fs.existsSync(indexPath)) {
  index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const graphCount = Object.keys(index.graphs || {}).length;
  console.log(`📇 加载现有索引：${graphCount}个图谱\n`);
} else {
  console.log('📇 创建新索引文件\n');
}

// 确保graphs是对象格式
if (!index.graphs || Array.isArray(index.graphs)) {
  index.graphs = {};
}

// 导入每个图谱
const importedGraphs = [];

graphFiles.forEach((graphInfo, idx) => {
  console.log(`📊 导入图谱 ${idx + 1}/3: ${graphInfo.name}`);
  
  // 读取图谱数据
  const graphData = JSON.parse(fs.readFileSync(graphInfo.file, 'utf8'));
  const { nodes, edges } = graphData.data;
  
  console.log(`   节点数: ${nodes.length}`);
  console.log(`   边数: ${edges.length}`);
  
  // 生成图谱ID
  const graphId = `graph_${uuidv4().replace(/-/g, '').substring(0, 10)}`;
  const timestamp = new Date().toISOString();
  
  // 构造完整的图谱数据
  const fullGraphData = {
    id: graphId,
    metadata: {
      name: graphInfo.name,
      description: graphInfo.description,
      createdAt: timestamp,
      updatedAt: timestamp,
      schemaId: 'core-domain-schema-v2',
      schemaVersion: '2.0.0',
      tags: ['v2', 'auto-generated', graphInfo.name.includes('驾驶') ? 'ADAS' : graphInfo.name.includes('座舱') ? 'Cockpit' : 'EE'],
      statistics: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        lastAccessed: timestamp
      }
    },
    data: {
      nodes: nodes,
      edges: edges
    }
  };
  
  // 写入图谱文件
  const graphFilePath = path.join(graphsDir, `${graphId}.json`);
  fs.writeFileSync(graphFilePath, JSON.stringify(fullGraphData, null, 2), 'utf8');
  console.log(`   ✅ 已保存: ${graphFilePath}`);
  
  // 添加到索引
  const indexEntry = {
    id: graphId,
    name: graphInfo.name,
    description: graphInfo.description,
    schemaId: 'core-domain-schema-v2',
    schemaVersion: '2.0.0',
    created: timestamp,
    updated: timestamp,
    status: 'active',
    tags: ['v2', 'auto-generated', graphInfo.name.includes('驾驶') ? 'ADAS' : graphInfo.name.includes('座舱') ? 'Cockpit' : 'EE']
  };
  
  // 检查是否已存在同名图谱（对象格式）
  const existingGraph = Object.values(index.graphs).find(g => g.name === graphInfo.name);
  if (existingGraph) {
    console.log(`   ⚠️  替换现有图谱: ${existingGraph.id}`);
    // 删除旧文件
    const oldFilePath = path.join(graphsDir, `${existingGraph.id}.json`);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
    // 从索引中删除旧条目
    delete index.graphs[existingGraph.id];
  }
  
  // 添加新条目
  index.graphs[graphId] = indexEntry;
  
  importedGraphs.push({
    id: graphId,
    name: graphInfo.name,
    nodeCount: nodes.length,
    edgeCount: edges.length
  });
  
  console.log('');
});

// 更新索引
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
const totalGraphsCount = Object.keys(index.graphs).length;
console.log(`📇 更新索引文件: ${totalGraphsCount}个图谱\n`);

// 汇总报告
console.log('📊 导入完成汇总:\n');
console.log('| 图谱 | 图谱ID | 节点数 | 边数 |');
console.log('|------|--------|--------|------|');
importedGraphs.forEach(g => {
  console.log(`| ${g.name} | ${g.id} | ${g.nodeCount} | ${g.edgeCount} |`);
});

const totalNodes = importedGraphs.reduce((sum, g) => sum + g.nodeCount, 0);
const totalEdges = importedGraphs.reduce((sum, g) => sum + g.edgeCount, 0);
console.log(`| **总计** | - | **${totalNodes}** | **${totalEdges}** |`);

console.log('\n✅ 所有图谱已成功导入到系统！');
console.log('\n🎯 下一步：');
console.log('1. 启动系统: ./start.sh');
console.log('2. 访问图谱列表: http://localhost:8080/graphs');
console.log('3. 验证3个新图谱是否正确显示');
