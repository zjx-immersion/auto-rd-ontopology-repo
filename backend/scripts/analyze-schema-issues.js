#!/usr/bin/env node

/**
 * 分析Schema和实际数据的差异
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../../data/schemaVersions/core-domain-schema-v2.json');
const graphsDir = path.join(__dirname, '../../data/graphs');

console.log('🔍 分析Schema和实际数据的差异...\n');

// 加载Schema
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const schemaEntityTypes = Object.keys(schema.entityTypes || {});

console.log(`📋 Schema中定义的实体类型: ${schemaEntityTypes.length}个`);
console.log(`   类型列表: ${schemaEntityTypes.join(', ')}\n`);

// 分析每个图谱
const graphFiles = [
  'graph_88f0fbd4a5.json', // 智能驾驶
  'graph_b923fd5743.json', // 智能座舱
  'graph_424bc4d4a4.json'  // 电子电器
];

const allUsedTypes = new Set();
const typeCounts = {};

graphFiles.forEach(filename => {
  const filepath = path.join(graphsDir, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  文件不存在: ${filename}\n`);
    return;
  }
  
  const graph = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const nodes = graph.data.nodes || [];
  
  console.log(`📊 图谱: ${graph.metadata.name}`);
  console.log(`   节点数: ${nodes.length}`);
  
  // 统计实际使用的类型
  const usedTypes = new Set();
  const counts = {};
  
  nodes.forEach(node => {
    const type = node.type;
    usedTypes.add(type);
    allUsedTypes.add(type);
    counts[type] = (counts[type] || 0) + 1;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log(`   实际使用的类型: ${usedTypes.size}个`);
  console.log(`   类型列表: ${Array.from(usedTypes).sort().join(', ')}\n`);
  
  // 找出Schema中未定义的类型
  const undefinedTypes = Array.from(usedTypes).filter(type => !schemaEntityTypes.includes(type));
  if (undefinedTypes.length > 0) {
    console.log(`   ❌ Schema中未定义的类型 (${undefinedTypes.length}个):`);
    undefinedTypes.forEach(type => {
      console.log(`      - ${type}: ${counts[type]}个节点`);
    });
    console.log('');
  }
  
  // 找出Schema中定义但未使用的类型
  const unusedTypes = schemaEntityTypes.filter(type => !usedTypes.has(type));
  if (unusedTypes.length > 0) {
    console.log(`   ⚠️  Schema中定义但未使用的类型 (${unusedTypes.length}个):`);
    unusedTypes.forEach(type => {
      console.log(`      - ${type}`);
    });
    console.log('');
  }
  
  // 检查节点属性
  let nodesWithData = 0;
  let nodesWithoutData = 0;
  let totalProperties = 0;
  
  nodes.forEach(node => {
    if (node.data && typeof node.data === 'object' && Object.keys(node.data).length > 0) {
      nodesWithData++;
      totalProperties += Object.keys(node.data).length;
    } else {
      nodesWithoutData++;
    }
  });
  
  console.log(`   节点属性检查:`);
  console.log(`   - 有属性数据的节点: ${nodesWithData} (${(nodesWithData/nodes.length*100).toFixed(1)}%)`);
  console.log(`   - 无属性数据的节点: ${nodesWithoutData} (${(nodesWithoutData/nodes.length*100).toFixed(1)}%)`);
  if (nodesWithData > 0) {
    console.log(`   - 平均属性数: ${(totalProperties/nodesWithData).toFixed(1)}`);
  }
  console.log('');
  console.log('─'.repeat(70));
  console.log('');
});

// 总结
console.log('📊 总体分析:\n');
console.log(`Schema中定义的实体类型: ${schemaEntityTypes.length}个`);
console.log(`实际使用的实体类型: ${allUsedTypes.size}个`);
console.log(`实际使用的类型列表: ${Array.from(allUsedTypes).sort().join(', ')}\n`);

// 找出所有Schema中未定义的类型
const allUndefinedTypes = Array.from(allUsedTypes).filter(type => !schemaEntityTypes.includes(type));
if (allUndefinedTypes.length > 0) {
  console.log(`❌ Schema中完全缺失的类型 (${allUndefinedTypes.length}个):`);
  allUndefinedTypes.forEach(type => {
    console.log(`   - ${type}: ${typeCounts[type]}个节点`);
  });
  console.log('');
}

// 找出所有Schema中定义但未使用的类型
const allUnusedTypes = schemaEntityTypes.filter(type => !allUsedTypes.has(type));
if (allUnusedTypes.length > 0) {
  console.log(`⚠️  Schema中定义但未使用的类型 (${allUnusedTypes.length}个):`);
  allUnusedTypes.forEach(type => {
    const typeDef = schema.entityTypes[type];
    console.log(`   - ${type} (${typeDef.label || type})`);
  });
  console.log('');
}

console.log('✅ 分析完成！');
