const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * 多图谱管理服务
 * 支持创建、查询、更新、删除多个知识图谱
 */
class MultiGraphService {
  constructor() {
    this.graphsDir = path.join(__dirname, '../../../data/graphs');
    this.indexPath = path.join(this.graphsDir, 'index.json');
    this.index = { graphs: {} };
    this.initialized = false;
  }

  /**
   * 初始化服务
   */
  async init() {
    if (this.initialized) return;
    
    try {
      await this.ensureDirectories();
      await this.loadIndex();
      this.initialized = true;
      console.log('✅ MultiGraphService initialized');
    } catch (error) {
      console.error('❌ MultiGraphService initialization failed:', error);
      throw error;
    }
  }

  /**
   * 确保目录存在
   */
  async ensureDirectories() {
    try {
      await fs.access(this.graphsDir);
    } catch {
      await fs.mkdir(this.graphsDir, { recursive: true });
      console.log('📁 Created graphs directory');
    }
  }

  /**
   * 加载索引文件
   */
  async loadIndex() {
    try {
      const data = await fs.readFile(this.indexPath, 'utf8');
      this.index = JSON.parse(data);
      console.log(`📖 Loaded index: ${Object.keys(this.index.graphs).length} graphs`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 索引文件不存在，创建新的
        this.index = { graphs: {} };
        await this.saveIndex();
        console.log('📝 Created new index file');
      } else {
        throw error;
      }
    }
  }

  /**
   * 保存索引文件
   */
  async saveIndex() {
    await fs.writeFile(this.indexPath, JSON.stringify(this.index, null, 2), 'utf8');
  }

  /**
   * 创建新图谱
   * @param {Object} graphData - 图谱数据
   * @returns {Object} 创建的图谱
   */
  async createGraph(graphData) {
    await this.init();

    const {
      name,
      description = '',
      schemaId,
      schemaVersion = '1.0.0',
      data = { nodes: [], edges: [] },
      tags = [],
      createdBy = 'admin'
    } = graphData;

    // 验证必填字段
    if (!name) {
      throw new Error('Graph name is required');
    }
    if (!schemaId) {
      throw new Error('Schema ID is required');
    }

    // 检查名称是否重复
    const existing = Object.values(this.index.graphs).find(g => g.name === name);
    if (existing) {
      throw new Error(`Graph with name "${name}" already exists`);
    }

    // 生成ID
    const id = `graph_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    // 构建图谱对象
    const graph = {
      id,
      name,
      description,
      schemaId,
      schemaVersion,
      data,
      metadata: {
        created: now,
        updated: now,
        createdBy,
        tags,
        status: 'active',
        statistics: {
          nodeCount: data.nodes?.length || 0,
          edgeCount: data.edges?.length || 0,
          lastAccessed: now
        }
      }
    };

    // 保存图谱文件
    const graphPath = path.join(this.graphsDir, `${id}.json`);
    await fs.writeFile(graphPath, JSON.stringify(graph, null, 2), 'utf8');

    // 更新索引
    this.index.graphs[id] = {
      id,
      name,
      description,
      schemaId,
      schemaVersion,
      created: now,
      updated: now,
      status: 'active',
      tags
    };
    await this.saveIndex();

    console.log(`✅ Created graph: ${id} - ${name}`);
    return graph;
  }

  /**
   * 获取图谱列表
   * @param {Object} filter - 过滤条件
   * @returns {Object} 图谱列表和分页信息
   */
  async getGraphs(filter = {}) {
    await this.init();

    const {
      page = 1,
      pageSize = 20,
      search = '',
      status = 'all',
      tags = []
    } = filter;

    // 获取所有图谱
    let graphs = Object.values(this.index.graphs);

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      graphs = graphs.filter(g =>
        g.name.toLowerCase().includes(searchLower) ||
        g.description.toLowerCase().includes(searchLower)
      );
    }

    // 状态过滤
    if (status !== 'all') {
      graphs = graphs.filter(g => g.status === status);
    }

    // 标签过滤
    if (tags.length > 0) {
      graphs = graphs.filter(g =>
        g.tags.some(tag => tags.includes(tag))
      );
    }

    // 排序（按更新时间倒序）
    graphs.sort((a, b) => new Date(b.updated) - new Date(a.updated));

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

    // 分页
    const total = graphsWithRealStats.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedGraphs = graphsWithRealStats.slice(start, end);

    return {
      graphs: paginatedGraphs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 获取单个图谱详情
   * @param {string} id - 图谱ID
   * @returns {Object} 图谱详情
   */
  async getGraph(id) {
    await this.init();

    // 检查索引
    if (!this.index.graphs[id]) {
      // 检查是否是旧的图谱ID，提供友好的错误信息
      const oldGraphIds = {
        'graph_88f0fbd4a5': 'graph_e41ae076ca',
        'graph_b923fd5743': 'graph_c4bc4181c4',
        'graph_424bc4d4a4': 'graph_67f3055ddb'
      };
      
      if (oldGraphIds[id]) {
        throw new Error(`Graph ID has changed. The new ID is: ${oldGraphIds[id]}. Please update your bookmark or link.`);
      }
      
      throw new Error(`Graph not found: ${id}`);
    }

    // 读取图谱文件
    const graphPath = path.join(this.graphsDir, `${id}.json`);
    
    let data;
    try {
      data = await fs.readFile(graphPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Graph file not found: ${id}.json. The graph may have been deleted or moved.`);
      }
      throw error;
    }
    const graph = JSON.parse(data);

    // 更新最后访问时间
    graph.metadata.statistics.lastAccessed = new Date().toISOString();
    await fs.writeFile(graphPath, JSON.stringify(graph, null, 2), 'utf8');

    return graph;
  }

  /**
   * 更新图谱
   * @param {string} id - 图谱ID
   * @param {Object} updates - 更新内容
   * @returns {Object} 更新后的图谱
   */
  async updateGraph(id, updates) {
    await this.init();

    // 获取现有图谱
    const graph = await this.getGraph(id);

    // 更新字段
    const {
      name,
      description,
      tags,
      status,
      data
    } = updates;

    if (name !== undefined) {
      // 检查名称是否重复
      const existing = Object.values(this.index.graphs).find(
        g => g.name === name && g.id !== id
      );
      if (existing) {
        throw new Error(`Graph with name "${name}" already exists`);
      }
      graph.name = name;
    }

    if (description !== undefined) graph.description = description;
    if (tags !== undefined) graph.metadata.tags = tags;
    if (status !== undefined) graph.metadata.status = status;
    
    if (data !== undefined) {
      graph.data = data;
      graph.metadata.statistics.nodeCount = data.nodes?.length || 0;
      graph.metadata.statistics.edgeCount = data.edges?.length || 0;
    }

    // 更新时间
    const now = new Date().toISOString();
    graph.metadata.updated = now;

    // 保存图谱文件
    const graphPath = path.join(this.graphsDir, `${id}.json`);
    await fs.writeFile(graphPath, JSON.stringify(graph, null, 2), 'utf8');

    // 更新索引
    this.index.graphs[id] = {
      id: graph.id,
      name: graph.name,
      description: graph.description,
      schemaId: graph.schemaId,
      schemaVersion: graph.schemaVersion,
      created: graph.metadata.created,
      updated: now,
      status: graph.metadata.status,
      tags: graph.metadata.tags
    };
    await this.saveIndex();

    console.log(`✅ Updated graph: ${id} - ${graph.name}`);
    return graph;
  }

  /**
   * 删除图谱
   * @param {string} id - 图谱ID
   */
  async deleteGraph(id) {
    await this.init();

    // 检查图谱是否存在
    if (!this.index.graphs[id]) {
      throw new Error(`Graph not found: ${id}`);
    }

    // 删除图谱文件
    const graphPath = path.join(this.graphsDir, `${id}.json`);
    await fs.unlink(graphPath);

    // 从索引中删除
    delete this.index.graphs[id];
    await this.saveIndex();

    console.log(`🗑️  Deleted graph: ${id}`);
  }

  /**
   * 复制图谱
   * @param {string} id - 源图谱ID
   * @param {string} newName - 新图谱名称
   * @returns {Object} 新图谱
   */
  async duplicateGraph(id, newName) {
    await this.init();

    // 获取源图谱
    const sourceGraph = await this.getGraph(id);

    // 创建新图谱
    const newGraph = await this.createGraph({
      name: newName || `${sourceGraph.name} (副本)`,
      description: sourceGraph.description,
      schemaId: sourceGraph.schemaId,
      schemaVersion: sourceGraph.schemaVersion,
      data: sourceGraph.data,
      tags: sourceGraph.metadata.tags,
      createdBy: sourceGraph.metadata.createdBy
    });

    console.log(`📋 Duplicated graph: ${id} → ${newGraph.id}`);
    return newGraph;
  }

  /**
   * 导出图谱
   * @param {string} id - 图谱ID
   * @param {string} format - 导出格式 (json|excel)
   * @returns {Object} 导出数据
   */
  async exportGraph(id, format = 'json') {
    await this.init();

    const graph = await this.getGraph(id);

    if (format === 'json') {
      return graph;
    }

    // TODO: 实现Excel导出
    throw new Error('Excel export not implemented yet');
  }

  /**
   * 验证图谱数据
   * @param {string} id - 图谱ID
   * @returns {Object} 验证结果
   */
  async validateGraph(id) {
    await this.init();

    const graph = await this.getGraph(id);
    const errors = [];
    const warnings = [];

    // 基础结构验证
    if (!graph.data || !graph.data.nodes || !graph.data.edges) {
      errors.push('Invalid graph data structure');
      return { valid: false, errors, warnings };
    }

    // 节点验证
    const nodeIds = new Set(graph.data.nodes.map(n => n.id));
    if (nodeIds.size !== graph.data.nodes.length) {
      errors.push('Duplicate node IDs found');
    }

    // 边验证
    graph.data.edges.forEach((edge, index) => {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge ${index}: source node ${edge.source} not found`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge ${index}: target node ${edge.target} not found`);
      }
    });

    // 统计信息验证
    const actualNodeCount = graph.data.nodes.length;
    const actualEdgeCount = graph.data.edges.length;
    
    if (graph.metadata.statistics.nodeCount !== actualNodeCount) {
      warnings.push(`Node count mismatch: expected ${graph.metadata.statistics.nodeCount}, actual ${actualNodeCount}`);
    }
    
    if (graph.metadata.statistics.edgeCount !== actualEdgeCount) {
      warnings.push(`Edge count mismatch: expected ${graph.metadata.statistics.edgeCount}, actual ${actualEdgeCount}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取图谱统计信息
   * @param {string} id - 图谱ID
   * @returns {Object} 统计信息
   */
  async getStatistics(id) {
    await this.init();

    const graph = await this.getGraph(id);
    const { nodes, edges } = graph.data;

    // 计算节点类型分布
    const nodeTypeCount = {};
    nodes.forEach(node => {
      nodeTypeCount[node.type] = (nodeTypeCount[node.type] || 0) + 1;
    });

    // 计算边类型分布
    const edgeTypeCount = {};
    edges.forEach(edge => {
      edgeTypeCount[edge.type] = (edgeTypeCount[edge.type] || 0) + 1;
    });

    // 计算节点度数
    const nodeDegrees = new Map();
    nodes.forEach(node => {
      nodeDegrees.set(node.id, { in: 0, out: 0, total: 0 });
    });

    edges.forEach(edge => {
      const source = nodeDegrees.get(edge.source);
      const target = nodeDegrees.get(edge.target);
      if (source) {
        source.out += 1;
        source.total += 1;
      }
      if (target) {
        target.in += 1;
        target.total += 1;
      }
    });

    // Top节点（按度数）
    const topNodes = Array.from(nodeDegrees.entries())
      .map(([id, degrees]) => ({
        id,
        label: nodes.find(n => n.id === id)?.label || id,
        ...degrees
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      overview: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodeTypes: Object.keys(nodeTypeCount).length,
        edgeTypes: Object.keys(edgeTypeCount).length
      },
      nodeTypeDistribution: nodeTypeCount,
      edgeTypeDistribution: edgeTypeCount,
      topNodes,
      metadata: graph.metadata
    };
  }
}

// 单例模式
const multiGraphService = new MultiGraphService();

module.exports = multiGraphService;
