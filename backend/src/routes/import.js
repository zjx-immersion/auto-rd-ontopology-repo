const express = require('express');
const router = express.Router();
const { getInstance: getGraphService } = require('../services/GraphService');
const MarkdownParser = require('../parsers/MarkdownParser');
const ExcelParser = require('../parsers/ExcelParser');

const graphService = getGraphService();

/**
 * 从Markdown导入数据
 */
router.post('/markdown', async (req, res) => {
  try {
    const { content, type = 'triples' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '缺少content参数'
        }
      });
    }

    const parser = new MarkdownParser();
    const { nodes, edges } = parser.parse(content, type);

    // 导入数据
    const result = graphService.importData(nodes, edges);

    res.json({
      success: true,
      data: result,
      message: '数据导入成功'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'IMPORT_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 从Excel导入数据
 */
router.post('/excel', async (req, res) => {
  try {
    const { data, type = 'triples' } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '缺少data参数'
        }
      });
    }

    const parser = new ExcelParser();
    const { nodes, edges } = parser.parse(data, type);

    // 导入数据
    const result = graphService.importData(nodes, edges);

    res.json({
      success: true,
      data: result,
      message: '数据导入成功'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'IMPORT_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 批量导入JSON数据
 */
router.post('/json', async (req, res) => {
  try {
    const { nodes = [], edges = [] } = req.body;

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'nodes和edges必须是数组'
        }
      });
    }

    // 导入数据
    const result = graphService.importData(nodes, edges);

    res.json({
      success: true,
      data: result,
      message: '数据导入成功'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'IMPORT_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 清空所有数据
 */
router.delete('/clear', (req, res) => {
  try {
    graphService.nodes = [];
    graphService.edges = [];
    graphService.saveData();

    res.json({
      success: true,
      message: '所有数据已清空'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CLEAR_ERROR',
        message: error.message
      }
    });
  }
});

module.exports = router;
