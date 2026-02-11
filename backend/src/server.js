const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// 导入路由
const graphRoutes = require('./routes/graph');
const graphsRoutes = require('./routes/graphs');  // 多图谱管理
const traceRoutes = require('./routes/trace');
const importRoutes = require('./routes/import');
const oagRoutes = require('./routes/oag');  // OAG 服务
const importExportRoutes = require('./routes/import-export');  // 导入导出服务

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API路由
app.use('/api/v1/graph', graphRoutes);
app.use('/api/v1/graphs', graphsRoutes);  // 多图谱管理
app.use('/api/v1/ontology', traceRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/oag', oagRoutes);  // OAG 服务
app.use('/api/v1/oag', importExportRoutes);  // 导入导出服务（挂载到oag路径下）

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在'
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   本体图谱工程平台 - 后端服务                         ║
║   版本: 0.1.0                                         ║
║   端口: ${PORT}                                       ║
║   时间: ${new Date().toLocaleString('zh-CN')}     ║
╚═══════════════════════════════════════════════════════╝
  `);
  console.log('✅ 服务已启动');
  console.log(`📊 API文档: http://localhost:${PORT}/api/v1`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;
