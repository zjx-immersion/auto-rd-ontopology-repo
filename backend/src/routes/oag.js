const express = require('express');
const router = express.Router();
const { getInstance: getOAGService } = require('../services/OAGService');

const oagService = getOAGService();

/**
 * @route   GET /api/v1/oag
 * @desc    获取所有 OAG 实例列表
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    const oags = oagService.getOAGList();
    res.json({
      success: true,
      data: oags,
      count: oags.length
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
 * @route   GET /api/v1/oag/templates
 * @desc    获取 OAG 模板列表
 * @access  Public
 */
router.get('/templates', (req, res) => {
  try {
    const templates = oagService.getTemplates();
    res.json({
      success: true,
      data: templates,
      count: templates.length
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
 * @route   GET /api/v1/oag/:id
 * @desc    获取 OAG 详情
 * @access  Public
 */
router.get('/:id', (req, res) => {
  try {
    const oag = oagService.getOAGById(req.params.id);
    res.json({
      success: true,
      data: oag
    });
  } catch (error) {
    const statusCode = error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    });
  }
});

/**
 * @route   POST /api/v1/oag
 * @desc    创建 OAG 实例
 * @access  Public
 */
router.post('/', (req, res) => {
  try {
    const { schemaId, ...config } = req.body;
    
    if (!schemaId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '缺少 schemaId 参数'
        }
      });
    }

    const oag = oagService.createOAGFromSchema(schemaId, config);
    
    res.status(201).json({
      success: true,
      data: oag,
      message: 'OAG 创建成功'
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
 * @route   PUT /api/v1/oag/:id
 * @desc    更新 OAG 实例
 * @access  Public
 */
router.put('/:id', (req, res) => {
  try {
    const oag = oagService.updateOAG(req.params.id, req.body);
    res.json({
      success: true,
      data: oag,
      message: 'OAG 更新成功'
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
 * @route   DELETE /api/v1/oag/:id
 * @desc    删除 OAG 实例
 * @access  Public
 */
router.delete('/:id', (req, res) => {
  try {
    const result = oagService.deleteOAG(req.params.id);
    res.json({
      success: true,
      data: result,
      message: 'OAG 删除成功'
    });
  } catch (error) {
    const statusCode = error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * @route   POST /api/v1/oag/generate
 * @desc    基于 Schema 生成 OAG
 * @access  Public
 */
router.post('/generate', (req, res) => {
  try {
    const { schemaId, config = {} } = req.body;
    
    if (!schemaId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '缺少 schemaId 参数'
        }
      });
    }

    const oag = oagService.createOAGFromSchema(schemaId, {
      ...config,
      populateExamples: true
    });
    
    res.status(201).json({
      success: true,
      data: oag,
      message: 'OAG 生成成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GENERATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * @route   POST /api/v1/oag/generate-from-template
 * @desc    基于模板生成 OAG
 * @access  Public
 */
router.post('/generate-from-template', (req, res) => {
  try {
    const { templateId, params = {} } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '缺少 templateId 参数'
        }
      });
    }

    const oag = oagService.generateOAGFromTemplate(templateId, params);
    
    res.status(201).json({
      success: true,
      data: oag,
      message: '从模板生成 OAG 成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GENERATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * @route   POST /api/v1/oag/instantiate
 * @desc    批量实例化 OAG
 * @access  Public
 */
router.post('/instantiate', (req, res) => {
  try {
    const { schemaId, dataSource, mappingConfig } = req.body;
    
    if (!schemaId || !dataSource) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '缺少必要参数: schemaId, dataSource'
        }
      });
    }

    const oag = oagService.batchInstantiate(schemaId, dataSource, mappingConfig || {});
    
    res.status(201).json({
      success: true,
      data: oag,
      message: '批量实例化 OAG 成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INSTANTIATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * @route   POST /api/v1/oag/:id/validate
 * @desc    验证 OAG
 * @access  Public
 */
router.post('/:id/validate', (req, res) => {
  try {
    const { schemaId } = req.body;
    const validation = oagService.validateOAG(req.params.id, schemaId);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * @route   POST /api/v1/oag/:id/export
 * @desc    导出 OAG
 * @access  Public
 */
router.post('/:id/export', (req, res) => {
  try {
    const { format = 'json' } = req.body;
    const exportData = oagService.exportOAG(req.params.id, format);
    
    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * @route   GET /api/v1/oag/:id/nodes
 * @desc    获取 OAG 的节点列表
 * @access  Public
 */
router.get('/:id/nodes', (req, res) => {
  try {
    const oag = oagService.getOAGById(req.params.id);
    const { type } = req.query;
    
    let nodes = oag.nodes || [];
    if (type) {
      nodes = nodes.filter(n => n.type === type);
    }
    
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
 * @route   GET /api/v1/oag/:id/edges
 * @desc    获取 OAG 的边列表
 * @access  Public
 */
router.get('/:id/edges', (req, res) => {
  try {
    const oag = oagService.getOAGById(req.params.id);
    const { type, source, target } = req.query;
    
    let edges = oag.edges || [];
    if (type) edges = edges.filter(e => e.type === type);
    if (source) edges = edges.filter(e => e.source === source);
    if (target) edges = edges.filter(e => e.target === target);
    
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
 * @route   POST /api/v1/oag/:id/nodes
 * @desc    向 OAG 添加节点
 * @access  Public
 */
router.post('/:id/nodes', (req, res) => {
  try {
    const oag = oagService.getOAGById(req.params.id);
    const node = req.body;
    
    // 验证节点 ID 是否已存在
    if (oag.nodes.find(n => n.id === node.id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_ID',
          message: `节点 ID 已存在: ${node.id}`
        }
      });
    }
    
    // 验证实体类型是否存在
    const entityTypes = oag.schemaSnapshot?.entityTypes || {};
    if (!entityTypes[node.type]) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: `未知的实体类型: ${node.type}`
        }
      });
    }
    
    oag.nodes.push(node);
    oag.updatedAt = new Date().toISOString();
    oag.statistics = oagService.calculateStatistics(oag.nodes, oag.edges);
    
    oagService.updateOAG(req.params.id, oag);
    
    res.status(201).json({
      success: true,
      data: node,
      message: '节点添加成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ADD_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * @route   POST /api/v1/oag/:id/edges
 * @desc    向 OAG 添加边
 * @access  Public
 */
router.post('/:id/edges', (req, res) => {
  try {
    const oag = oagService.getOAGById(req.params.id);
    const edge = req.body;
    
    // 验证 source 和 target 节点是否存在
    const sourceNode = oag.nodes.find(n => n.id === edge.source);
    const targetNode = oag.nodes.find(n => n.id === edge.target);
    
    if (!sourceNode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SOURCE',
          message: `源节点不存在: ${edge.source}`
        }
      });
    }
    
    if (!targetNode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TARGET',
          message: `目标节点不存在: ${edge.target}`
        }
      });
    }
    
    oag.edges.push(edge);
    oag.updatedAt = new Date().toISOString();
    oag.statistics = oagService.calculateStatistics(oag.nodes, oag.edges);
    
    oagService.updateOAG(req.params.id, oag);
    
    res.status(201).json({
      success: true,
      data: edge,
      message: '边添加成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ADD_ERROR',
        message: error.message
      }
    });
  }
});

module.exports = router;
