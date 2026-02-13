/**
 * OAG 实例化 API 路由
 */
const express = require('express');
const router = express.Router();
const OAGInstantiationService = require('../services/OAGInstantiationService');
const { asyncHandler, createError } = require('../middleware/errorHandler');

/**
 * @route   POST /api/v1/oag
 * @desc    创建 OAG 实例
 * @access  Public
 */
router.post('/', asyncHandler(async (req, res) => {
  const { schemaId, name, description } = req.body;
  
  if (!schemaId) {
    throw createError(400, 'Schema ID is required');
  }

  const oag = await OAGInstantiationService.createFromSchema(schemaId, {
    name,
    description,
    createdBy: req.user?.id || 'system'
  });

  res.status(201).json({
    success: true,
    data: oag
  });
}));

/**
 * @route   GET /api/v1/oag
 * @desc    获取 OAG 列表
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const { limit, offset, status } = req.query;
  
  const oags = await OAGInstantiationService.listOAGs({
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
    status
  });

  res.json({
    success: true,
    data: oags,
    meta: {
      total: oags.length,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    }
  });
}));

/**
 * @route   GET /api/v1/oag/:id
 * @desc    获取 OAG 详情
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const oag = await OAGInstantiationService.getOAG(id);
  if (!oag) {
    throw createError(404, `OAG not found: ${id}`);
  }

  res.json({
    success: true,
    data: oag
  });
}));

/**
 * @route   PUT /api/v1/oag/:id
 * @desc    更新 OAG
 * @access  Public
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const oag = await OAGInstantiationService.updateOAG(id, updates);
  
  res.json({
    success: true,
    data: oag
  });
}));

/**
 * @route   DELETE /api/v1/oag/:id
 * @desc    删除 OAG
 * @access  Public
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await OAGInstantiationService.deleteOAG(id);
  
  res.json({
    success: true,
    message: `OAG ${id} deleted`
  });
}));

/**
 * @route   POST /api/v1/oag/generate
 * @desc    基于模板生成 OAG
 * @access  Public
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const { templateId, name, description } = req.body;
  
  if (!templateId) {
    throw createError(400, 'Template ID is required');
  }

  const oag = await OAGInstantiationService.generateFromTemplate(templateId, {
    name,
    description,
    createdBy: req.user?.id || 'system'
  });

  res.status(201).json({
    success: true,
    data: oag
  });
}));

/**
 * @route   POST /api/v1/oag/:id/validate
 * @desc    验证 OAG
 * @access  Public
 */
router.post('/:id/validate', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await OAGInstantiationService.validateOAG(id);
  
  res.json({
    success: true,
    data: result
  });
}));

/**
 * @route   POST /api/v1/oag/:id/export
 * @desc    导出 OAG
 * @access  Public
 */
router.post('/:id/export', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { format = 'json' } = req.body;
  
  const filepath = await OAGInstantiationService.exportOAG(id, format);
  
  res.json({
    success: true,
    data: { filepath }
  });
}));

/**
 * @route   POST /api/v1/oag/instantiate
 * @desc    批量实例化
 * @access  Public
 */
router.post('/instantiate', asyncHandler(async (req, res) => {
  const { schemaId, dataSource } = req.body;
  
  if (!schemaId || !Array.isArray(dataSource)) {
    throw createError(400, 'schemaId and dataSource array are required');
  }

  const results = await OAGInstantiationService.batchInstantiate(schemaId, dataSource);
  
  res.status(201).json({
    success: true,
    data: results
  });
}));

module.exports = router;
