#!/usr/bin/env node

/**
 * 验证Schema V2.0图谱数据的兼容性
 */

const fs = require('fs');
const path = require('path');

// 路径配置
const dataPath = path.join(__dirname, '../../data');
const schemaPath = path.join(dataPath, 'core-domain-schema-v2.json');

// 图谱数据路径
const graphFiles = [
  path.join(dataPath, 'adas-graph-v2-data.json'),
  path.join(dataPath, 'cabin-graph-v2-data.json'),
  path.join(dataPath, 'ee-graph-v2-data.json')
];

// 加载Schema
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

console.log('🔍 开始验证Schema V2.0图谱数据兼容性...\n');
console.log(`Schema版本: ${schema.version}`);
console.log(`实体类型数: ${Object.keys(schema.entityTypes).length}`);
console.log(`关系类型数: ${Object.keys(schema.relationTypes).length}\n`);

/**
 * 验证单个图谱
 */
function validateGraph(graphFile) {
  const graphName = path.basename(graphFile, '.json');
  console.log(`\n📋 验证 ${graphName}...`);
  
  // 加载图谱数据
  const graphData = JSON.parse(fs.readFileSync(graphFile, 'utf8'));
  
  const { nodes, edges } = graphData.data;
  const errors = [];
  const warnings = [];
  
  // 1. 验证节点类型
  console.log(`   检查 ${nodes.length} 个节点...`);
  const unknownNodeTypes = new Set();
  
  nodes.forEach(node => {
    if (!node.id) {
      errors.push(`节点缺少id: ${JSON.stringify(node).substring(0, 50)}`);
    }
    if (!node.type) {
      errors.push(`节点 ${node.id} 缺少type字段`);
    } else if (!schema.entityTypes[node.type]) {
      unknownNodeTypes.add(node.type);
      errors.push(`节点 ${node.id} 的类型 ${node.type} 在Schema中不存在`);
    }
    if (!node.label) {
      warnings.push(`节点 ${node.id} 缺少label字段`);
    }
  });
  
  if (unknownNodeTypes.size > 0) {
    console.log(`   ❌ 发现 ${unknownNodeTypes.size} 个未知节点类型: ${Array.from(unknownNodeTypes).join(', ')}`);
  } else {
    console.log(`   ✅ 所有节点类型都在Schema中定义`);
  }
  
  // 2. 验证边类型
  console.log(`   检查 ${edges.length} 条边...`);
  const unknownEdgeTypes = new Set();
  
  edges.forEach(edge => {
    if (!edge.id) {
      errors.push(`边缺少id: ${JSON.stringify(edge).substring(0, 50)}`);
    }
    if (!edge.source || !edge.target) {
      errors.push(`边 ${edge.id} 缺少source或target字段`);
    }
    if (!edge.type) {
      errors.push(`边 ${edge.id} 缺少type字段`);
    } else if (!schema.relationTypes[edge.type]) {
      unknownEdgeTypes.add(edge.type);
      errors.push(`边 ${edge.id} 的类型 ${edge.type} 在Schema中不存在`);
    }
    
    // 验证source和target节点是否存在
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode) {
      errors.push(`边 ${edge.id} 的source节点 ${edge.source} 不存在`);
    }
    if (!targetNode) {
      errors.push(`边 ${edge.id} 的target节点 ${edge.target} 不存在`);
    }
    
    // 验证关系类型是否符合Schema定义的约束
    if (sourceNode && targetNode && schema.relationTypes[edge.type]) {
      const relType = schema.relationTypes[edge.type];
      
      // 检查from约束
      if (relType.from && !relType.from.includes(sourceNode.type)) {
        warnings.push(`边 ${edge.id} (${edge.type}): source节点类型 ${sourceNode.type} 不在Schema的from约束中 [${relType.from.join(', ')}]`);
      }
      
      // 检查to约束
      if (relType.to && !relType.to.includes(targetNode.type)) {
        warnings.push(`边 ${edge.id} (${edge.type}): target节点类型 ${targetNode.type} 不在Schema的to约束中 [${relType.to.join(', ')}]`);
      }
    }
  });
  
  if (unknownEdgeTypes.size > 0) {
    console.log(`   ❌ 发现 ${unknownEdgeTypes.size} 个未知边类型: ${Array.from(unknownEdgeTypes).join(', ')}`);
  } else {
    console.log(`   ✅ 所有边类型都在Schema中定义`);
  }
  
  // 3. 验证节点类型分布
  const nodeTypeStats = {};
  nodes.forEach(node => {
    nodeTypeStats[node.type] = (nodeTypeStats[node.type] || 0) + 1;
  });
  
  console.log(`   节点类型分布 (共${Object.keys(nodeTypeStats).length}种):`);
  Object.entries(nodeTypeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });
  
  // 4. 验证边类型分布
  const edgeTypeStats = {};
  edges.forEach(edge => {
    edgeTypeStats[edge.type] = (edgeTypeStats[edge.type] || 0) + 1;
  });
  
  console.log(`   边类型分布 (共${Object.keys(edgeTypeStats).length}种):`);
  Object.entries(edgeTypeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });
  
  // 5. 汇总结果
  console.log(`\n   汇总:`);
  console.log(`     - 节点数: ${nodes.length}`);
  console.log(`     - 边数: ${edges.length}`);
  console.log(`     - 节点类型数: ${Object.keys(nodeTypeStats).length}`);
  console.log(`     - 边类型数: ${Object.keys(edgeTypeStats).length}`);
  console.log(`     - 错误数: ${errors.length}`);
  console.log(`     - 警告数: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log(`\n   ❌ 错误列表 (显示前10个):`);
    errors.slice(0, 10).forEach((err, idx) => {
      console.log(`     ${idx + 1}. ${err}`);
    });
    if (errors.length > 10) {
      console.log(`     ... 还有 ${errors.length - 10} 个错误`);
    }
  }
  
  if (warnings.length > 0 && warnings.length <= 10) {
    console.log(`\n   ⚠️  警告列表:`);
    warnings.forEach((warn, idx) => {
      console.log(`     ${idx + 1}. ${warn}`);
    });
  } else if (warnings.length > 10) {
    console.log(`\n   ⚠️  有 ${warnings.length} 个警告 (已省略)`);
  }
  
  return {
    graphName,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeTypeCount: Object.keys(nodeTypeStats).length,
    edgeTypeCount: Object.keys(edgeTypeStats).length,
    errorCount: errors.length,
    warningCount: warnings.length,
    passed: errors.length === 0
  };
}

/**
 * 主程序
 */
async function main() {
  const results = [];
  
  for (const graphFile of graphFiles) {
    if (!fs.existsSync(graphFile)) {
      console.error(`❌ 文件不存在: ${graphFile}`);
      continue;
    }
    
    const result = validateGraph(graphFile);
    results.push(result);
  }
  
  // 总体报告
  console.log('\n\n📊 验证总结:\n');
  console.log('| 图谱 | 节点数 | 边数 | 节点类型数 | 边类型数 | 错误数 | 警告数 | 状态 |');
  console.log('|------|--------|------|-----------|---------|--------|--------|------|');
  
  results.forEach(r => {
    const status = r.passed ? '✅ 通过' : '❌ 失败';
    console.log(`| ${r.graphName} | ${r.nodeCount} | ${r.edgeCount} | ${r.nodeTypeCount} | ${r.edgeTypeCount} | ${r.errorCount} | ${r.warningCount} | ${status} |`);
  });
  
  const totalNodes = results.reduce((sum, r) => sum + r.nodeCount, 0);
  const totalEdges = results.reduce((sum, r) => sum + r.edgeCount, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
  const allPassed = results.every(r => r.passed);
  
  console.log(`| **总计** | **${totalNodes}** | **${totalEdges}** | - | - | **${totalErrors}** | **${totalWarnings}** | ${allPassed ? '✅ 全部通过' : '❌ 有失败'} |`);
  
  if (allPassed) {
    console.log('\n✅ 所有图谱数据都与Schema V2.0兼容！');
  } else {
    console.log('\n❌ 部分图谱数据存在兼容性问题，请检查上面的错误信息');
    process.exit(1);
  }
}

// 执行
main().catch(console.error);
