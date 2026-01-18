const fs = require('fs');
const path = require('path');

/**
 * 图谱服务 - 管理知识图谱数据
 */
class GraphService {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.schema = null;
    this.dataPath = path.join(__dirname, '../../../data');
    this.loadData();
  }

  /**
   * 加载数据
   */
  loadData() {
    try {
      // 加载Schema - 优先使用schemaVersions目录下的V2.0版本
      const schemaV2Path = path.join(this.dataPath, 'schemaVersions', 'core-domain-schema-v2.json');
      const schemaPath = path.join(this.dataPath, 'schemaVersions', 'schema.json');
      const oldSchemaPath = path.join(this.dataPath, 'schema.json');
      
      let schemaLoaded = false;
      
      // 优先加载V2.0 Schema
      if (fs.existsSync(schemaV2Path)) {
        this.schema = JSON.parse(fs.readFileSync(schemaV2Path, 'utf8'));
        console.log('✅ Schema V2.0加载成功');
        schemaLoaded = true;
      }
      // 其次加载当前活动Schema
      else if (fs.existsSync(schemaPath)) {
        this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        console.log('✅ Schema加载成功');
        schemaLoaded = true;
      }
      // 最后尝试旧路径（向后兼容）
      else if (fs.existsSync(oldSchemaPath)) {
        this.schema = JSON.parse(fs.readFileSync(oldSchemaPath, 'utf8'));
        console.log('✅ Schema加载成功（旧路径）');
        schemaLoaded = true;
      }
      
      if (!schemaLoaded) {
        console.warn('⚠️  未找到Schema文件，请检查data/schemaVersions/目录');
      }

      // 加载样本数据
      const dataPath = path.join(this.dataPath, 'sample-data.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        this.nodes = data.nodes || [];
        this.edges = data.edges || [];
        console.log(`✅ 数据加载成功: ${this.nodes.length}个节点, ${this.edges.length}条边`);
      }
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
    }
  }

  /**
   * 保存数据
   */
  saveData() {
    try {
      const dataPath = path.join(this.dataPath, 'sample-data.json');
      const data = {
        version: '0.1.0',
        lastUpdate: new Date().toISOString().split('T')[0],
        description: '知识图谱样本数据',
        nodes: this.nodes,
        edges: this.edges,
        statistics: this.getStatistics()
      };
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
      console.log('✅ 数据保存成功');
      return true;
    } catch (error) {
      console.error('❌ 数据保存失败:', error);
      return false;
    }
  }

  /**
   * 获取Schema
   */
  getSchema() {
    return this.schema;
  }

  /**
   * 获取所有节点
   */
  getNodes(filter = {}) {
    let result = this.nodes;

    // 按类型过滤
    if (filter.type) {
      result = result.filter(n => n.type === filter.type);
    }

    // 按ID过滤
    if (filter.ids && filter.ids.length > 0) {
      result = result.filter(n => filter.ids.includes(n.id));
    }

    return result;
  }

  /**
   * 获取所有边
   */
  getEdges(filter = {}) {
    let result = this.edges;

    // 按类型过滤
    if (filter.type) {
      result = result.filter(e => e.type === filter.type);
    }

    // 按源节点过滤
    if (filter.source) {
      result = result.filter(e => e.source === filter.source);
    }

    // 按目标节点过滤
    if (filter.target) {
      result = result.filter(e => e.target === filter.target);
    }

    return result;
  }

  /**
   * 根据ID获取节点
   */
  getNodeById(id) {
    return this.nodes.find(n => n.id === id);
  }

  /**
   * 添加节点
   */
  addNode(node) {
    // 检查ID是否已存在
    if (this.getNodeById(node.id)) {
      throw new Error(`节点ID已存在: ${node.id}`);
    }

    this.nodes.push(node);
    this.saveData();
    return node;
  }

  /**
   * 更新节点
   */
  updateNode(id, updates) {
    const index = this.nodes.findIndex(n => n.id === id);
    if (index === -1) {
      throw new Error(`节点不存在: ${id}`);
    }

    this.nodes[index] = {
      ...this.nodes[index],
      ...updates,
      id: id // 保持ID不变
    };

    this.saveData();
    return this.nodes[index];
  }

  /**
   * 删除节点
   */
  deleteNode(id) {
    const index = this.nodes.findIndex(n => n.id === id);
    if (index === -1) {
      throw new Error(`节点不存在: ${id}`);
    }

    // 删除相关的边
    this.edges = this.edges.filter(e => e.source !== id && e.target !== id);

    // 删除节点
    this.nodes.splice(index, 1);
    this.saveData();
    return true;
  }

  /**
   * 添加边
   */
  addEdge(edge) {
    // 检查源节点和目标节点是否存在
    if (!this.getNodeById(edge.source)) {
      throw new Error(`源节点不存在: ${edge.source}`);
    }
    if (!this.getNodeById(edge.target)) {
      throw new Error(`目标节点不存在: ${edge.target}`);
    }

    // 生成边ID
    if (!edge.id) {
      edge.id = `e${this.edges.length + 1}`;
    }

    this.edges.push(edge);
    this.saveData();
    return edge;
  }

  /**
   * 根据ID获取边
   */
  getEdgeById(id) {
    return this.edges.find(e => e.id === id);
  }

  /**
   * 更新边（包括对象属性）
   */
  updateEdge(id, updates) {
    const index = this.edges.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error(`边不存在: ${id}`);
    }

    // 合并更新，保持基本字段不变
    this.edges[index] = {
      ...this.edges[index],
      ...updates,
      id: id,
      source: this.edges[index].source,
      target: this.edges[index].target,
      type: this.edges[index].type
    };

    this.saveData();
    return this.edges[index];
  }

  /**
   * 删除边
   */
  deleteEdge(id) {
    const index = this.edges.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error(`边不存在: ${id}`);
    }

    this.edges.splice(index, 1);
    this.saveData();
    return true;
  }

  /**
   * 获取节点的邻居（出边）- 包含对象属性
   */
  getOutgoingNeighbors(nodeId) {
    const outEdges = this.edges.filter(e => e.source === nodeId);
    return outEdges.map(e => ({
      edge: e,
      node: this.getNodeById(e.target),
      relationLabel: this.getRelationLabel(e.type),
      objectProperties: e.data || {}
    }));
  }

  /**
   * 获取节点的邻居（入边）- 包含对象属性
   */
  getIncomingNeighbors(nodeId) {
    const inEdges = this.edges.filter(e => e.target === nodeId);
    return inEdges.map(e => ({
      edge: e,
      node: this.getNodeById(e.source),
      relationLabel: this.getRelationLabel(e.type),
      objectProperties: e.data || {}
    }));
  }

  /**
   * 获取关系类型的标签
   */
  getRelationLabel(relationType) {
    return this.schema?.relationTypes?.[relationType]?.label || relationType;
  }

  /**
   * 获取节点的所有对象属性关系
   */
  getObjectProperties(nodeId) {
    const outgoing = this.getOutgoingNeighbors(nodeId);
    const incoming = this.getIncomingNeighbors(nodeId);
    
    return {
      nodeId,
      outgoing: outgoing.map(item => ({
        relationId: item.edge.id,
        relationType: item.edge.type,
        relationLabel: item.relationLabel,
        targetNode: item.node,
        properties: item.objectProperties
      })),
      incoming: incoming.map(item => ({
        relationId: item.edge.id,
        relationType: item.edge.type,
        relationLabel: item.relationLabel,
        sourceNode: item.node,
        properties: item.objectProperties
      }))
    };
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    const entityCounts = {};
    this.nodes.forEach(node => {
      entityCounts[node.type] = (entityCounts[node.type] || 0) + 1;
    });

    const relationCounts = {};
    this.edges.forEach(edge => {
      relationCounts[edge.type] = (relationCounts[edge.type] || 0) + 1;
    });

    return {
      total_nodes: this.nodes.length,
      total_edges: this.edges.length,
      entity_counts: entityCounts,
      relation_counts: relationCounts
    };
  }

  /**
   * 搜索节点
   */
  searchNodes(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.nodes.filter(node => {
      // 搜索ID
      if (node.id.toLowerCase().includes(lowerKeyword)) {
        return true;
      }
      // 搜索数据字段
      if (node.data) {
        const dataStr = JSON.stringify(node.data).toLowerCase();
        return dataStr.includes(lowerKeyword);
      }
      return false;
    });
  }

  /**
   * 批量导入数据
   */
  importData(nodes, edges) {
    // 验证节点
    nodes.forEach(node => {
      if (!node.id || !node.type) {
        throw new Error('节点必须包含id和type字段');
      }
    });

    // 验证边
    edges.forEach(edge => {
      if (!edge.source || !edge.target || !edge.type) {
        throw new Error('边必须包含source、target和type字段');
      }
    });

    // 合并数据（去重）
    const existingIds = new Set(this.nodes.map(n => n.id));
    const newNodes = nodes.filter(n => !existingIds.has(n.id));
    this.nodes.push(...newNodes);

    const existingEdgeKeys = new Set(
      this.edges.map(e => `${e.source}-${e.type}-${e.target}`)
    );
    const newEdges = edges.filter(e => {
      const key = `${e.source}-${e.type}-${e.target}`;
      return !existingEdgeKeys.has(key);
    });
    this.edges.push(...newEdges);

    this.saveData();

    return {
      added_nodes: newNodes.length,
      added_edges: newEdges.length,
      total_nodes: this.nodes.length,
      total_edges: this.edges.length
    };
  }
}

// 单例模式
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new GraphService();
    }
    return instance;
  }
};
