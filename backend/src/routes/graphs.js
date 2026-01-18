const express = require('express');
const router = express.Router();
const multiGraphService = require('../services/MultiGraphService');

/**
 * 图谱管理路由
 * 提供多图谱的CRUD和操作接口
 */

/**
 * 获取图谱列表
 * GET /api/v1/graphs
 * Query参数:
 *   - page: 页码 (默认1)
 *   - pageSize: 每页数量 (默认20)
 *   - search: 搜索关键词
 *   - status: 状态过滤 (all|active|archived)
 *   - tags: 标签过滤 (逗号分隔)
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      status = 'all',
      tags = ''
    } = req.query;

    const filter = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      status,
      tags: tags ? tags.split(',') : []
    };

    const result = await multiGraphService.getGraphs(filter);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting graphs:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get graphs'
      }
    });
  }
});

/**
 * 获取单个图谱详情
 * GET /api/v1/graphs/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const graph = await multiGraphService.getGraph(id);

    res.json({
      success: true,
      data: graph
    });
  } catch (error) {
    console.error(`Error getting graph ${req.params.id}:`, error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message || 'Failed to get graph'
      }
    });
  }
});

/**
 * 创建新图谱
 * POST /api/v1/graphs
 * Body:
 * {
 *   name: string (必填),
 *   description?: string,
 *   schemaId: string (必填),
 *   schemaVersion?: string (默认'1.0.0'),
 *   data?: { nodes: [], edges: [] },
 *   tags?: string[],
 *   createdBy?: string
 * }
 */
router.post('/', async (req, res) => {
  try {
    const graphData = req.body;

    // 基本验证
    if (!graphData.name) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Graph name is required'
        }
      });
    }

    if (!graphData.schemaId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Schema ID is required'
        }
      });
    }

    const graph = await multiGraphService.createGraph(graphData);

    res.status(201).json({
      success: true,
      data: graph,
      message: `Graph "${graph.name}" created successfully`
    });
  } catch (error) {
    console.error('Error creating graph:', error);
    
    const statusCode = error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message || 'Failed to create graph'
      }
    });
  }
});

/**
 * 更新图谱
 * PUT /api/v1/graphs/:id
 * Body:
 * {
 *   name?: string,
 *   description?: string,
 *   tags?: string[],
 *   status?: string,
 *   data?: { nodes: [], edges: [] }
 * }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const graph = await multiGraphService.updateGraph(id, updates);

    res.json({
      success: true,
      data: graph,
      message: `Graph "${graph.name}" updated successfully`
    });
  } catch (error) {
    console.error(`Error updating graph ${req.params.id}:`, error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('already exists')) statusCode = 409;
    
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message || 'Failed to update graph'
      }
    });
  }
});

/**
 * 删除图谱
 * DELETE /api/v1/graphs/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await multiGraphService.deleteGraph(id);

    res.json({
      success: true,
      message: `Graph deleted successfully`
    });
  } catch (error) {
    console.error(`Error deleting graph ${req.params.id}:`, error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete graph'
      }
    });
  }
});

/**
 * 复制图谱
 * POST /api/v1/graphs/:id/duplicate
 * Body:
 * {
 *   newName?: string
 * }
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;

    const newGraph = await multiGraphService.duplicateGraph(id, newName);

    res.status(201).json({
      success: true,
      data: newGraph,
      message: `Graph duplicated successfully`
    });
  } catch (error) {
    console.error(`Error duplicating graph ${req.params.id}:`, error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('already exists')) statusCode = 409;
    
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message || 'Failed to duplicate graph'
      }
    });
  }
});

/**
 * 导出图谱
 * GET /api/v1/graphs/:id/export
 * Query参数:
 *   - format: 导出格式 (json|excel)
 */
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const data = await multiGraphService.exportGraph(id, format);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="graph_${id}.json"`);
      res.json(data);
    } else {
      throw new Error(`Export format "${format}" not supported yet`);
    }
  } catch (error) {
    console.error(`Error exporting graph ${req.params.id}:`, error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message || 'Failed to export graph'
      }
    });
  }
});

/**
 * 验证图谱数据
 * POST /api/v1/graphs/:id/validate
 */
router.post('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await multiGraphService.validateGraph(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Error validating graph ${req.params.id}:`, error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message || 'Failed to validate graph'
      }
    });
  }
});

/**
 * 获取图谱统计信息
 * GET /api/v1/graphs/:id/statistics
 */
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    const statistics = await multiGraphService.getStatistics(id);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error(`Error getting graph statistics ${req.params.id}:`, error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message || 'Failed to get statistics'
      }
    });
  }
});

/**
 * 获取节点的对象属性关系
 * GET /api/v1/graphs/:graphId/nodes/:nodeId/object-properties
 */
router.get('/:graphId/nodes/:nodeId/object-properties', async (req, res) => {
  try {
    const { graphId, nodeId } = req.params;
    
    // 获取Schema（用于关系标签）
    let schema = null;
    try {
      const { getInstance: getGraphService } = require('../services/GraphService');
      const graphService = getGraphService();
      schema = graphService.getSchema();
    } catch (error) {
      console.warn('Failed to load schema for relation labels:', error.message);
    }

    const objectProperties = await multiGraphService.getObjectProperties(graphId, nodeId, schema);

    res.json({
      success: true,
      data: objectProperties
    });
  } catch (error) {
    console.error(`Error getting object properties for node ${req.params.nodeId} in graph ${req.params.graphId}:`, error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message || 'Failed to get object properties'
      }
    });
  }
});

module.exports = router;
