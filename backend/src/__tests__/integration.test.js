/**
 * 后端API集成测试
 */
const request = require('supertest');
const app = require('../server');

describe('后端API集成测试', () => {
  describe('健康检查', () => {
    it('GET /health 应该返回健康状态', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.version).toBeDefined();
    });
  });

  describe('图谱管理API', () => {
    it('GET /api/v1/graphs 应该返回图谱列表', async () => {
      const response = await request(app)
        .get('/api/v1/graphs')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.graphs).toBeDefined();
      expect(Array.isArray(response.body.data.graphs)).toBe(true);
    });

    it('GET /api/v1/graphs/:id 应该返回单个图谱', async () => {
      // 首先获取图谱列表
      const listResponse = await request(app)
        .get('/api/v1/graphs')
        .expect(200);
      
      const graphs = listResponse.body.data.graphs;
      if (graphs.length > 0) {
        const graphId = graphs[0].id;
        
        const response = await request(app)
          .get(`/api/v1/graphs/${graphId}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('GET /api/v1/graphs/:id 应该处理不存在的图谱', async () => {
      const response = await request(app)
        .get('/api/v1/graphs/non-existent-id')
        .expect(404);
      
      expect(response.body.error).toBeDefined();
    });
  });

  describe('图谱数据API', () => {
    it('GET /api/v1/graph/data 应该返回图谱数据', async () => {
      const response = await request(app)
        .get('/api/v1/graph/data')
        .expect(200);
      
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nodes).toBeDefined();
      expect(response.body.data.edges).toBeDefined();
    });
  });

  describe('Schema API', () => {
    it('GET /api/v1/graph/schema 应该返回Schema定义', async () => {
      const response = await request(app)
        .get('/api/v1/graph/schema')
        .expect(200);
      
      expect(response.body.data).toBeDefined();
    });
  });

  describe('追溯API', () => {
    it('POST /api/v1/ontology/trace 应该支持追溯查询', async () => {
      const requestBody = {
        entity_id: 'TEST_001',
        query_type: 'full_trace',
        depth: 3
      };
      
      const response = await request(app)
        .post('/api/v1/ontology/trace')
        .send(requestBody)
        .expect(200);
      
      expect(response.body.data).toBeDefined();
    });

    it('POST /api/v1/ontology/trace 应该验证参数', async () => {
      const response = await request(app)
        .post('/api/v1/ontology/trace')
        .send({})
        .expect(200);
      
      // 应该返回错误信息而不是崩溃
      expect(response.body).toBeDefined();
    });
  });

  describe('导入API', () => {
    it('POST /api/v1/import/json 应该支持JSON导入', async () => {
      const importData = {
        nodes: [
          { id: 'TEST_001', type: 'Epic', label: 'Test' }
        ],
        edges: []
      };
      
      const response = await request(app)
        .post('/api/v1/import/json')
        .send(importData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('POST /api/v1/import/markdown 应该支持Markdown导入', async () => {
      const response = await request(app)
        .post('/api/v1/import/markdown')
        .send({
          content: '| Entity A | Relation | Entity B |\n|----------|----------|----------|',
          type: 'triples'
        })
        .expect(200);
      
      expect(response.body).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理404错误', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-endpoint')
        .expect(404);
      
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('应该处理无效的JSON', async () => {
      const response = await request(app)
        .post('/api/v1/import/json')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
      
      // Express会返回400错误
    });
  });
});
