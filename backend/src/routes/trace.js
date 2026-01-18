const express = require('express');
const router = express.Router();
const TraceService = require('../services/TraceService');
const multiGraphService = require('../services/MultiGraphService');

const traceService = new TraceService();

/**
 * 需求追溯与影响分析API
 */
router.post('/trace', async (req, res) => {
  try {
    const { entity_id, query_type = 'full_trace', depth = 3, graph_id } = req.body;

    // 参数验证
    if (!entity_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '缺少entity_id参数'
        }
      });
    }

    // 验证查询类型
    const validQueryTypes = ['full_trace', 'impact_analysis', 'downstream_tasks'];
    if (!validQueryTypes.includes(query_type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY_TYPE',
          message: `查询类型必须是: ${validQueryTypes.join(', ')}`
        }
      });
    }

    // 验证深度
    if (depth < 1 || depth > 5) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'INVALID_TRACE_DEPTH',
          message: '追溯深度超出范围(1-5)'
        }
      });
    }

    // 执行追溯（支持graph_id参数）
    const startTime = Date.now();
    const result = await traceService.trace(entity_id, query_type, depth, graph_id);
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: result,
      performance: {
        duration_ms: duration,
        query_time: new Date().toISOString()
      }
    });

  } catch (error) {
    if (error.message.includes('不存在')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ENTITY_NOT_FOUND',
          message: error.message
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'TRACE_ERROR',
          message: error.message
        }
      });
    }
  }
});

/**
 * 获取实体的完整路径
 */
router.get('/path/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;
    const { graph_id } = req.query;
    const graphData = graph_id ? (await multiGraphService.getGraph(graph_id)).data : null;
    const paths = await traceService.getFullPath(entityId, graphData);

    res.json({
      success: true,
      data: {
        entity_id: entityId,
        paths: paths,
        path_count: paths.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PATH_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 获取测试覆盖情况
 */
router.get('/coverage/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;
    const { graph_id } = req.query;
    const graphData = graph_id ? (await multiGraphService.getGraph(graph_id)).data : null;
    const coverage = await traceService.getTestCoverage(entityId, graphData);

    res.json({
      success: true,
      data: {
        entity_id: entityId,
        coverage: coverage
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'COVERAGE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * 批量追溯查询
 */
router.post('/trace/batch', (req, res) => {
  try {
    const { entity_ids, query_type = 'full_trace', depth = 3 } = req.body;

    if (!entity_ids || !Array.isArray(entity_ids) || entity_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'entity_ids必须是非空数组'
        }
      });
    }

    const results = entity_ids.map(entityId => {
      try {
        return {
          entity_id: entityId,
          success: true,
          data: traceService.trace(entityId, query_type, depth)
        };
      } catch (error) {
        return {
          entity_id: entityId,
          success: false,
          error: error.message
        };
      }
    });

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      data: results,
      summary: {
        total: entity_ids.length,
        success: successCount,
        failed: entity_ids.length - successCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_TRACE_ERROR',
        message: error.message
      }
    });
  }
});

module.exports = router;
