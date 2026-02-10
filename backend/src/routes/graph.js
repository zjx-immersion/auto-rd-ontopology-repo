const express = require('express');
const router = express.Router();
const { getInstance: getGraphService } = require('../services/GraphService');

const graphService = getGraphService();

/**
 * 获取Schema
 */
router.get('/schema', (req, res) => {
  try {
    const schema = graphService.getSchema();
    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEMA_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取所有节点
 */
router.get('/nodes', (req, res) => {
  try {
    const { type, ids } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (ids) filter.ids = ids.split(',');

    const nodes = graphService.getNodes(filter);
    res.json({
      success: true,
      data: nodes,
      count: nodes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取单个节点
 */
router.get('/nodes/:id', (req, res) => {
  try {
    const node = graphService.getNodeById(req.params.id);
    if (!node) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NODE_NOT_FOUND',
          message: `节点不存在: ${req.params.id}`
        }
      });
    }
    res.json({
      success: true,
      data: node
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 创建节点
 */
router.post('/nodes', (req, res) => {
  try {
    const node = graphService.addNode(req.body);
    res.status(201).json({
      success: true,
      data: node,
      message: '节点创建成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 更新节点
 */
router.put('/nodes/:id', (req, res) => {
  try {
    const node = graphService.updateNode(req.params.id, req.body);
    res.json({
      success: true,
      data: node,
      message: '节点更新成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 删除节点
 */
router.delete('/nodes/:id', (req, res) => {
  try {
    graphService.deleteNode(req.params.id);
    res.json({
      success: true,
      message: '节点删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取所有边
 */
router.get('/edges', (req, res) => {
  try {
    const { type, source, target } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (source) filter.source = source;
    if (target) filter.target = target;

    const edges = graphService.getEdges(filter);
    res.json({
      success: true,
      data: edges,
      count: edges.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取单个边的详细信息
 */
router.get('/edges/:id', (req, res) => {
  try {
    const edge = graphService.getEdgeById(req.params.id);
    if (!edge) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EDGE_NOT_FOUND',
          message: `边不存在: ${req.params.id}`
        }
      });
    }
    res.json({
      success: true,
      data: edge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 创建边
 */
router.post('/edges', (req, res) => {
  try {
    const edge = graphService.addEdge(req.body);
    res.status(201).json({
      success: true,
      data: edge,
      message: '边创建成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 更新边（包括对象属性）
 */
router.put('/edges/:id', (req, res) => {
  try {
    const edge = graphService.updateEdge(req.params.id, req.body);
    res.json({
      success: true,
      data: edge,
      message: '边更新成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 删除边
 */
router.delete('/edges/:id', (req, res) => {
  try {
    graphService.deleteEdge(req.params.id);
    res.json({
      success: true,
      message: '边删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取完整图谱数据
 */
router.get('/data', (req, res) => {
  try {
    const nodes = graphService.getNodes();
    const edges = graphService.getEdges();
    const statistics = graphService.getStatistics();

    res.json({
      success: true,
      data: {
        nodes,
        edges,
        statistics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 搜索节点
 */
router.get('/search', (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '缺少搜索关键词'
        }
      });
    }

    const results = graphService.searchNodes(keyword);
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取统计信息
 */
router.get('/statistics', (req, res) => {
  try {
    const statistics = graphService.getStatistics();
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取节点的对象属性关系
 */
router.get('/nodes/:id/object-properties', (req, res) => {
  try {
    const node = graphService.getNodeById(req.params.id);
    if (!node) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NODE_NOT_FOUND',
          message: `节点不存在: ${req.params.id}`
        }
      });
    }

    const objectProperties = graphService.getObjectProperties(req.params.id);
    res.json({
      success: true,
      data: objectProperties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

// ==================== Schema Entity Type CRUD ====================

/**
 * 获取所有实体类型
 */
router.get('/schema/entity-types', (req, res) => {
  try {
    const entityTypes = graphService.getEntityTypes();
    res.json({
      success: true,
      data: entityTypes,
      count: Object.keys(entityTypes).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取单个实体类型
 */
router.get('/schema/entity-types/:code', (req, res) => {
  try {
    const entityType = graphService.getEntityTypeByCode(req.params.code);
    if (!entityType) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ENTITY_TYPE_NOT_FOUND',
          message: `实体类型不存在: ${req.params.code}`
        }
      });
    }
    res.json({
      success: true,
      data: entityType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 创建实体类型
 */
router.post('/schema/entity-types', (req, res) => {
  try {
    const entityType = graphService.createEntityType(req.body);
    res.status(201).json({
      success: true,
      data: entityType,
      message: '实体类型创建成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 更新实体类型
 */
router.put('/schema/entity-types/:code', (req, res) => {
  try {
    const entityType = graphService.updateEntityType(req.params.code, req.body);
    res.json({
      success: true,
      data: entityType,
      message: '实体类型更新成功'
    });
  } catch (error) {
    const statusCode = error.message.includes('不存在') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 删除实体类型
 */
router.delete('/schema/entity-types/:code', (req, res) => {
  try {
    const result = graphService.deleteEntityType(req.params.code);
    res.json({
      success: true,
      data: result,
      message: '实体类型删除成功'
    });
  } catch (error) {
    const statusCode = error.message.includes('不存在') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error.message
      }
    });
  }
});

// ==================== Schema Relation Type CRUD ====================

/**
 * 获取所有关系类型
 */
router.get('/schema/relation-types', (req, res) => {
  try {
    const relationTypes = graphService.getRelationTypes();
    res.json({
      success: true,
      data: relationTypes,
      count: Object.keys(relationTypes).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取单个关系类型
 */
router.get('/schema/relation-types/:code', (req, res) => {
  try {
    const relationType = graphService.getRelationTypeByCode(req.params.code);
    if (!relationType) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RELATION_TYPE_NOT_FOUND',
          message: `关系类型不存在: ${req.params.code}`
        }
      });
    }
    res.json({
      success: true,
      data: relationType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 创建关系类型
 */
router.post('/schema/relation-types', (req, res) => {
  try {
    const relationType = graphService.createRelationType(req.body);
    res.status(201).json({
      success: true,
      data: relationType,
      message: '关系类型创建成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 更新关系类型
 */
router.put('/schema/relation-types/:code', (req, res) => {
  try {
    const relationType = graphService.updateRelationType(req.params.code, req.body);
    res.json({
      success: true,
      data: relationType,
      message: '关系类型更新成功'
    });
  } catch (error) {
    const statusCode = error.message.includes('不存在') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 删除关系类型
 */
router.delete('/schema/relation-types/:code', (req, res) => {
  try {
    const result = graphService.deleteRelationType(req.params.code);
    res.json({
      success: true,
      data: result,
      message: '关系类型删除成功'
    });
  } catch (error) {
    const statusCode = error.message.includes('不存在') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error.message
      }
    });
  }
});

module.exports = router;
