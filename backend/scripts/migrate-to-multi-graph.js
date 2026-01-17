#!/usr/bin/env node

/**
 * 数据迁移脚本：将现有的单图谱数据迁移到多图谱结构
 * 
 * 用法: node migrate-to-multi-graph.js
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../../data');
const GRAPHS_DIR = path.join(DATA_DIR, 'graphs');
const OLD_DATA_FILE = path.join(DATA_DIR, 'sample-data.json');
const OLD_SCHEMA_FILE = path.join(DATA_DIR, 'schema.json');

async function migrate() {
  console.log('🚀 开始数据迁移...\n');

  try {
    // 1. 检查旧数据文件是否存在
    console.log('📂 检查现有数据文件...');
    let oldData = null;
    let oldSchema = null;

    try {
      const oldDataContent = await fs.readFile(OLD_DATA_FILE, 'utf8');
      oldData = JSON.parse(oldDataContent);
      console.log(`✓ 找到现有数据：${oldData.nodes?.length || 0} 个节点，${oldData.edges?.length || 0} 条边`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('⚠️  未找到sample-data.json，将创建空图谱');
      } else {
        throw error;
      }
    }

    try {
      const oldSchemaContent = await fs.readFile(OLD_SCHEMA_FILE, 'utf8');
      oldSchema = JSON.parse(oldSchemaContent);
      console.log(`✓ 找到Schema：${oldSchema.name || 'unnamed'}`);
    } catch (error) {
      console.log('⚠️  未找到schema.json');
    }

    // 2. 创建graphs目录
    console.log('\n📁 创建graphs目录...');
    try {
      await fs.mkdir(GRAPHS_DIR, { recursive: true });
      console.log('✓ 目录创建成功');
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
      console.log('✓ 目录已存在');
    }

    // 3. 创建默认图谱
    console.log('\n📊 创建默认图谱...');
    
    const graphId = `graph_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    
    const defaultGraph = {
      id: graphId,
      name: '岚图智能驾驶研发知识图谱（默认）',
      description: '从现有数据迁移的默认图谱',
      schemaId: 'default',
      schemaVersion: oldSchema?.version || '0.1.0',
      data: {
        nodes: oldData?.nodes || [],
        edges: oldData?.edges || []
      },
      metadata: {
        created: now,
        updated: now,
        createdBy: 'system',
        tags: ['智能驾驶', '研发', '迁移'],
        status: 'active',
        statistics: {
          nodeCount: oldData?.nodes?.length || 0,
          edgeCount: oldData?.edges?.length || 0,
          lastAccessed: now
        }
      }
    };

    // 4. 保存图谱文件
    const graphPath = path.join(GRAPHS_DIR, `${graphId}.json`);
    await fs.writeFile(graphPath, JSON.stringify(defaultGraph, null, 2), 'utf8');
    console.log(`✓ 图谱保存成功：${graphPath}`);

    // 5. 创建索引文件
    console.log('\n📇 创建索引文件...');
    const index = {
      graphs: {
        [graphId]: {
          id: graphId,
          name: defaultGraph.name,
          description: defaultGraph.description,
          schemaId: defaultGraph.schemaId,
          schemaVersion: defaultGraph.schemaVersion,
          created: now,
          updated: now,
          status: 'active',
          tags: defaultGraph.metadata.tags
        }
      }
    };

    const indexPath = path.join(GRAPHS_DIR, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
    console.log(`✓ 索引创建成功：${indexPath}`);

    // 6. 备份旧文件
    if (oldData) {
      console.log('\n💾 备份原始文件...');
      const backupPath = path.join(DATA_DIR, `sample-data.backup.${Date.now()}.json`);
      await fs.copyFile(OLD_DATA_FILE, backupPath);
      console.log(`✓ 备份创建成功：${backupPath}`);
    }

    // 7. 完成
    console.log('\n✅ 迁移完成！');
    console.log('\n📋 迁移摘要：');
    console.log(`   - 图谱ID: ${graphId}`);
    console.log(`   - 图谱名称: ${defaultGraph.name}`);
    console.log(`   - 节点数: ${defaultGraph.metadata.statistics.nodeCount}`);
    console.log(`   - 关系数: ${defaultGraph.metadata.statistics.edgeCount}`);
    console.log(`   - 存储路径: ${graphPath}`);
    console.log('\n🎉 现在可以启动系统查看新的多图谱功能了！');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行迁移
migrate();
