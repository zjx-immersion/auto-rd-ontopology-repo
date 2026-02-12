/**
 * 数据导入导出路由
 * 支持 OAG 数据的 Excel/CSV 导入导出
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const ImportExportService = require('../services/ImportExportService');
const OAGService = require('../services/OAGService');
const path = require('path');

// 配置multer存储
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 .xlsx, .xls, .csv 文件'));
    }
  }
});

/**
 * POST /api/v1/oag/:id/import
 * 导入数据到OAG
 */
router.post('/:id/import', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { mode = 'append' } = req.body; // append, replace, merge

    // 检查OAG是否存在
    const oag = OAGService.getOAGById(id);
    if (!oag) {
      return res.status(404).json({
        success: false,
        error: 'OAG不存在'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传文件'
      });
    }

    // 解析文件
    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const parsedData = ImportExportService.parseFile(req.file.buffer, fileExt);

    // 验证数据
    const validation = ImportExportService.validateImportData(parsedData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: validation
      });
    }

    // 根据模式处理数据
    let importResult;
    switch (mode) {
      case 'replace':
        // 清空现有数据，使用新数据
        oag.nodes = parsedData.entities.map(e => ({
          id: e.id,
          type: e.type,
          label: e.label,
          data: e.properties
        }));
        oag.edges = parsedData.relations.map(r => ({
          id: r.id,
          source: r.source,
          target: r.target,
          type: r.type,
          data: r.properties
        }));
        importResult = { mode: 'replace', nodesAdded: oag.nodes.length, edgesAdded: oag.edges.length };
        break;

      case 'merge':
        // 合并数据，更新已存在的节点
        let nodesUpdated = 0;
        let nodesAdded = 0;
        
        parsedData.entities.forEach(entity => {
          const existingIndex = oag.nodes.findIndex(n => n.id === entity.id);
          if (existingIndex >= 0) {
            oag.nodes[existingIndex] = {
              id: entity.id,
              type: entity.type,
              label: entity.label,
              data: entity.properties
            };
            nodesUpdated++;
          } else {
            oag.nodes.push({
              id: entity.id,
              type: entity.type,
              label: entity.label,
              data: entity.properties
            });
            nodesAdded++;
          }
        });

        // 合并关系
        let edgesAdded = 0;
        parsedData.relations.forEach(relation => {
          const exists = oag.edges.some(e => 
            e.source === relation.source && 
            e.target === relation.target && 
            e.type === relation.type
          );
          if (!exists) {
            oag.edges.push({
              id: relation.id,
              source: relation.source,
              target: relation.target,
              type: relation.type,
              data: relation.properties
            });
            edgesAdded++;
          }
        });

        importResult = { mode: 'merge', nodesAdded, nodesUpdated, edgesAdded };
        break;

      case 'append':
      default:
        // 追加数据，跳过已存在的ID
        let skippedNodes = 0;
        let addedNodes = 0;
        
        parsedData.entities.forEach(entity => {
          const exists = oag.nodes.some(n => n.id === entity.id);
          if (exists) {
            skippedNodes++;
          } else {
            oag.nodes.push({
              id: entity.id,
              type: entity.type,
              label: entity.label,
              data: entity.properties
            });
            addedNodes++;
          }
        });

        let skippedEdges = 0;
        let addedEdges = 0;
        
        parsedData.relations.forEach(relation => {
          const exists = oag.edges.some(e => e.id === relation.id);
          if (exists) {
            skippedEdges++;
          } else {
            oag.edges.push({
              id: relation.id,
              source: relation.source,
              target: relation.target,
              type: relation.type,
              data: relation.properties
            });
            addedEdges++;
          }
        });

        importResult = { mode: 'append', nodesAdded: addedNodes, nodesSkipped: skippedNodes, edgesAdded: addedEdges, edgesSkipped: skippedEdges };
    }

    // 更新统计信息
    OAGService.updateStatistics(id);
    
    // 保存OAG
    OAGService.saveOAG(oag);

    res.json({
      success: true,
      data: {
        importResult,
        validation: {
          warnings: validation.warnings
        },
        currentStats: {
          totalNodes: oag.nodes.length,
          totalEdges: oag.edges.length
        }
      }
    });

  } catch (error) {
    console.error('导入失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/oag/:id/export
 * 导出OAG数据
 */
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'xlsx' } = req.query; // xlsx, csv, json

    // 检查OAG是否存在
    const oag = OAGService.getOAGById(id);
    if (!oag) {
      return res.status(404).json({
        success: false,
        error: 'OAG不存在'
      });
    }

    const exportData = {
      nodes: oag.nodes,
      edges: oag.edges,
      metadata: {
        name: oag.name,
        description: oag.description,
        exportedAt: new Date().toISOString()
      }
    };

    let fileBuffer;
    let contentType;
    let fileExtension;

    switch (format.toLowerCase()) {
      case 'xlsx':
        fileBuffer = ImportExportService.generateExcel(exportData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;

      case 'csv':
        const csvContent = ImportExportService.generateCSV(exportData);
        fileBuffer = Buffer.from(csvContent, 'utf-8');
        contentType = 'text/csv;charset=utf-8';
        fileExtension = 'csv';
        break;

      case 'json':
      default:
        fileBuffer = Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');
        contentType = 'application/json';
        fileExtension = 'json';
    }

    const filename = `${oag.name.replace(/[^a-zA-Z0-9]/g, '_')}_${id.substr(0, 8)}.${fileExtension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('导出失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/oag/:id/import/preview
 * 预览导入数据（不实际导入）
 */
router.post('/:id/import/preview', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传文件'
      });
    }

    // 获取OAG现有数据
    const oag = OAGService.getOAGById(id);
    const existingIds = oag ? {
      nodes: new Set(oag.nodes.map(n => n.id)),
      edges: new Set(oag.edges.map(e => e.id))
    } : { nodes: new Set(), edges: new Set() };

    // 解析文件
    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const parsedData = ImportExportService.parseFile(req.file.buffer, fileExt);

    // 验证数据
    const validation = ImportExportService.validateImportData(parsedData);

    // 分析冲突
    const conflicts = {
      nodes: [],
      edges: []
    };

    parsedData.entities.forEach(entity => {
      if (existingIds.nodes.has(entity.id)) {
        conflicts.nodes.push({
          id: entity.id,
          type: entity.type,
          label: entity.label
        });
      }
    });

    parsedData.relations.forEach(relation => {
      if (existingIds.edges.has(relation.id)) {
        conflicts.edges.push({
          id: relation.id,
          source: relation.source,
          target: relation.target,
          type: relation.type
        });
      }
    });

    res.json({
      success: true,
      data: {
        preview: {
          totalEntities: parsedData.entities.length,
          totalRelations: parsedData.relations.length,
          sampleEntities: parsedData.entities.slice(0, 5),
          sampleRelations: parsedData.relations.slice(0, 5)
        },
        validation,
        conflicts: {
          nodeConflicts: conflicts.nodes.length,
          edgeConflicts: conflicts.edges.length,
          details: conflicts
        },
        existingStats: oag ? {
          totalNodes: oag.nodes.length,
          totalEdges: oag.edges.length
        } : null
      }
    });

  } catch (error) {
    console.error('预览失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/oag/:id/export/template
 * 下载导入模板
 */
router.get('/:id/export/template', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'xlsx' } = req.query;

    // 获取OAG以确定schema
    const oag = OAGService.getOAGById(id);
    
    // 生成模板数据
    const templateData = {
      nodes: [
        {
          id: 'example_vehicle_1',
          type: 'Vehicle',
          label: '示例车型',
          data: { name: '示例车型', code: 'EX-001' }
        },
        {
          id: 'example_epic_1',
          type: 'Epic',
          label: '示例Epic',
          data: { name: '示例Epic', status: '进行中' }
        }
      ],
      edges: [
        {
          id: 'example_edge_1',
          source: 'example_vehicle_1',
          target: 'example_epic_1',
          type: 'contains',
          data: { priority: 'high' }
        }
      ]
    };

    let fileBuffer;
    let contentType;
    let fileExtension;

    switch (format.toLowerCase()) {
      case 'xlsx':
        fileBuffer = ImportExportService.generateExcel(templateData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;

      case 'csv':
        const csvContent = ImportExportService.generateCSV(templateData);
        fileBuffer = Buffer.from(csvContent, 'utf-8');
        contentType = 'text/csv;charset=utf-8';
        fileExtension = 'csv';
        break;

      default:
        return res.status(400).json({
          success: false,
          error: '不支持的格式'
        });
    }

    const filename = `oag_import_template.${fileExtension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('生成模板失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
