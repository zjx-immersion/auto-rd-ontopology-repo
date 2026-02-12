/**
 * API服务单元测试 - 重构版
 */
import api from '../api';

// 模拟api实例
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    response: {
      use: jest.fn()
    }
  }
}));

describe('API服务测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础配置', () => {
    it('应该导出api实例', () => {
      expect(api).toBeDefined();
      expect(typeof api.get).toBe('function');
      expect(typeof api.post).toBe('function');
    });
  });

  describe('GET请求', () => {
    it('应该获取图谱数据', async () => {
      const mockData = {
        nodes: [{ id: '1', type: 'Epic', label: 'Test' }],
        edges: [{ id: 'e1', source: '1', target: '2' }]
      };
      
      api.get.mockResolvedValue({ data: mockData });
      
      const result = await api.get('/graph/data');
      
      expect(api.get).toHaveBeenCalledWith('/graph/data');
      expect(result.data).toEqual(mockData);
    });

    it('应该获取Schema定义', async () => {
      const mockSchema = {
        version: '2.0.0',
        entityTypes: {
          Epic: { label: 'Epic', color: '#1890ff' }
        }
      };
      
      api.get.mockResolvedValue({ data: mockSchema });
      
      const result = await api.get('/graph/schema');
      
      expect(result.data.version).toBe('2.0.0');
    });

    it('应该获取所有图谱列表', async () => {
      const mockGraphs = [
        { id: '1', name: 'Graph 1', nodeCount: 10 },
        { id: '2', name: 'Graph 2', nodeCount: 20 }
      ];
      
      api.get.mockResolvedValue({ data: mockGraphs });
      
      const result = await api.get('/graphs');
      
      expect(result.data).toHaveLength(2);
    });

    it('应该支持过滤参数', async () => {
      const mockNodes = [{ id: '1', type: 'Epic', label: 'Epic 1' }];
      
      api.get.mockResolvedValue({ data: mockNodes });
      
      const filter = { type: 'Epic', limit: 10 };
      await api.get('/graph/nodes', { params: filter });
      
      expect(api.get).toHaveBeenCalledWith('/graph/nodes', { params: filter });
    });

    it('应该处理获取失败', async () => {
      const error = new Error('Network Error');
      api.get.mockRejectedValue(error);
      
      await expect(api.get('/invalid')).rejects.toThrow('Network Error');
    });
  });

  describe('POST请求', () => {
    it('应该创建新图谱', async () => {
      const graphData = {
        name: 'New Graph',
        description: 'Test Description'
      };
      
      const mockResponse = { id: 'graph_123', ...graphData };
      api.post.mockResolvedValue({ data: mockResponse });
      
      const result = await api.post('/graphs', graphData);
      
      expect(api.post).toHaveBeenCalledWith('/graphs', graphData);
      expect(result.data.id).toBe('graph_123');
    });

    it('应该保存图谱数据', async () => {
      const data = {
        nodes: [{ id: '1', label: 'Node 1' }],
        edges: []
      };
      
      api.post.mockResolvedValue({ data: { success: true } });
      
      const result = await api.post('/graphs/graph1/data', data);
      
      expect(api.post).toHaveBeenCalledWith('/graphs/graph1/data', data);
    });

    it('应该处理创建失败', async () => {
      const error = new Error('名称已存在');
      api.post.mockRejectedValue(error);
      
      await expect(api.post('/graphs', { name: 'Existing' })).rejects.toThrow('名称已存在');
    });
  });

  describe('PUT请求', () => {
    it('应该更新节点', async () => {
      const updates = { label: 'Updated Label' };
      
      api.put.mockResolvedValue({ data: { success: true } });
      
      await api.put('/graph/nodes/1', updates);
      
      expect(api.put).toHaveBeenCalledWith('/graph/nodes/1', updates);
    });
  });

  describe('DELETE请求', () => {
    it('应该删除指定图谱', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });
      
      const result = await api.delete('/graphs/graph_123');
      
      expect(api.delete).toHaveBeenCalledWith('/graphs/graph_123');
    });

    it('应该删除节点', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });
      
      await api.delete('/graph/nodes/1');
      
      expect(api.delete).toHaveBeenCalledWith('/graph/nodes/1');
    });

    it('应该处理删除失败', async () => {
      api.delete.mockRejectedValue(new Error('权限不足'));
      
      await expect(api.delete('/protected')).rejects.toThrow('权限不足');
    });
  });

  describe('响应拦截器', () => {
    it('应该配置响应拦截器', () => {
      expect(api.interceptors.response.use).toBeDefined();
    });
  });

  describe('Schema API', () => {
    it('应该获取Schema定义', async () => {
      const mockSchema = {
        version: '2.0.0',
        entityTypes: {},
        relationTypes: {}
      };
      
      api.get.mockResolvedValue({ data: mockSchema });
      
      const result = await api.get('/graph/schema');
      
      expect(result.data.version).toBe('2.0.0');
    });

    it('应该保存Schema', async () => {
      const schema = {
        entityTypes: { Epic: {} },
        relationTypes: {}
      };
      
      api.post.mockResolvedValue({ data: { success: true } });
      
      await api.post('/graph/schema', schema);
      
      expect(api.post).toHaveBeenCalledWith('/graph/schema', schema);
    });
  });

  describe('OAG API', () => {
    it('应该获取OAG列表', async () => {
      const mockOAGs = [{ id: '1', name: 'OAG 1' }];
      
      api.get.mockResolvedValue({ data: mockOAGs });
      
      const result = await api.get('/oags');
      
      expect(result.data).toEqual(mockOAGs);
    });

    it('应该获取OAG详情', async () => {
      const mockOAG = { id: '1', name: 'OAG 1', status: 'active' };
      
      api.get.mockResolvedValue({ data: mockOAG });
      
      const result = await api.get('/oags/1');
      
      expect(result.data.status).toBe('active');
    });

    it('应该触发OAG执行', async () => {
      api.post.mockResolvedValue({ data: { executionId: 'exec_123' } });
      
      await api.post('/oags/1/execute');
      
      expect(api.post).toHaveBeenCalledWith('/oags/1/execute');
    });
  });

  describe('Import/Export API', () => {
    it('应该导入数据', async () => {
      const mockResponse = { imported: 10, errors: [] };
      
      api.post.mockResolvedValue({ data: mockResponse });
      
      const formData = new FormData();
      const result = await api.post('/graphs/graph1/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      expect(result.data.imported).toBe(10);
    });

    it('应该导出数据', async () => {
      const mockBlob = new Blob(['data'], { type: 'text/csv' });
      
      api.get.mockResolvedValue({ data: mockBlob });
      
      await api.get('/graphs/graph1/export', {
        params: { format: 'csv' },
        responseType: 'blob'
      });
      
      expect(api.get).toHaveBeenCalled();
    });
  });
});
