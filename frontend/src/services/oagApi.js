import api from './api';

/**
 * OAG 服务 API
 */

// 获取 OAG 列表
export const getOAGList = async () => {
  const response = await api.get('/oag');
  return response.data;
};

// 获取 OAG 详情
export const getOAGById = async (oagId) => {
  const response = await api.get(`/oag/${oagId}`);
  return response.data;
};

// 创建 OAG 实例
export const createOAG = async (data) => {
  const response = await api.post('/oag', data);
  return response.data;
};

// 更新 OAG
export const updateOAG = async (oagId, data) => {
  const response = await api.put(`/oag/${oagId}`, data);
  return response.data;
};

// 删除 OAG
export const deleteOAG = async (oagId) => {
  const response = await api.delete(`/oag/${oagId}`);
  return response.data;
};

// 基于 Schema 生成 OAG
export const generateOAGFromSchema = async (schemaId, config = {}) => {
  const response = await api.post('/oag/generate', {
    schemaId,
    ...config
  });
  return response.data;
};

// 基于模板生成 OAG
export const generateOAGFromTemplate = async (templateId, params = {}) => {
  const response = await api.post('/oag/generate-from-template', {
    templateId,
    params
  });
  return response.data;
};

// 批量实例化 OAG
export const batchInstantiateOAG = async (schemaId, dataSource, mappingConfig = {}) => {
  const response = await api.post('/oag/instantiate', {
    schemaId,
    dataSource,
    mappingConfig
  });
  return response.data;
};

// 验证 OAG
export const validateOAG = async (oagId, schemaId) => {
  const response = await api.post(`/oag/${oagId}/validate`, {
    schemaId
  });
  return response.data;
};

// 获取模板列表
export const getOAGTemplates = async () => {
  const response = await api.get('/oag/templates');
  return response.data;
};

// 导出 OAG
export const exportOAG = async (oagId, format = 'json') => {
  const response = await api.post(`/oag/${oagId}/export`, {
    format
  }, {
    responseType: 'blob'
  });
  return response.data;
};

// 获取 OAG 节点列表
export const getOAGNodes = async (oagId, type) => {
  const params = type ? { type } : {};
  const response = await api.get(`/oag/${oagId}/nodes`, { params });
  return response.data;
};

// 获取 OAG 边列表
export const getOAGEdges = async (oagId, filters = {}) => {
  const response = await api.get(`/oag/${oagId}/edges`, { params: filters });
  return response.data;
};

// 向 OAG 添加节点
export const addOAGNode = async (oagId, node) => {
  const response = await api.post(`/oag/${oagId}/nodes`, node);
  return response.data;
};

// 向 OAG 添加边
export const addOAGEdge = async (oagId, edge) => {
  const response = await api.post(`/oag/${oagId}/edges`, edge);
  return response.data;
};

export default {
  getOAGList,
  getOAGById,
  createOAG,
  updateOAG,
  deleteOAG,
  generateOAGFromSchema,
  generateOAGFromTemplate,
  batchInstantiateOAG,
  validateOAG,
  getOAGTemplates,
  exportOAG,
  getOAGNodes,
  getOAGEdges,
  addOAGNode,
  addOAGEdge
};
