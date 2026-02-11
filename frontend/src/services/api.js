import axios from 'axios';

// 临时使用完整后端URL，解决代理问题
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8090/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 直接返回response.data，保持原始响应格式
    return response.data;
  },
  error => {
    const message = error.response?.data?.error?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

// 图谱相关API
export const fetchGraphData = async () => {
  const response = await api.get('/graph/data');
  return response.data; // 返回实际数据，不含success/message包装
};

export const fetchSchema = async () => {
  const response = await api.get('/graph/schema');
  return response.data; // 返回实际schema数据
};

export const fetchNodes = async (filter = {}) => {
  const response = await api.get('/graph/nodes', { params: filter });
  return response.data;
};

export const fetchNodeById = async (id) => {
  const response = await api.get(`/graph/nodes/${id}`);
  return response.data;
};

export const createNode = async (node) => {
  const response = await api.post('/graph/nodes', node);
  return response.data;
};

export const updateNode = async (id, updates) => {
  const response = await api.put(`/graph/nodes/${id}`, updates);
  return response.data;
};

export const deleteNode = async (id) => {
  const response = await api.delete(`/graph/nodes/${id}`);
  return response.data;
};

export const searchNodes = async (keyword) => {
  const response = await api.get('/graph/search', { params: { keyword } });
  return response.data;
};

export const fetchStatistics = async () => {
  const response = await api.get('/graph/statistics');
  return response.data;
};

// 边/对象属性相关API
export const fetchEdges = async (filter = {}) => {
  const response = await api.get('/graph/edges', { params: filter });
  return response.data;
};

export const fetchEdgeById = async (id) => {
  const response = await api.get(`/graph/edges/${id}`);
  return response.data;
};

export const createEdge = async (edge) => {
  const response = await api.post('/graph/edges', edge);
  return response.data;
};

export const updateEdge = async (id, updates) => {
  const response = await api.put(`/graph/edges/${id}`, updates);
  return response.data;
};

export const deleteEdge = async (id) => {
  const response = await api.delete(`/graph/edges/${id}`);
  return response.data;
};

export const fetchObjectProperties = async (nodeId, graphId) => {
  if (graphId) {
    // 使用多图谱API
    const response = await api.get(`/graphs/${graphId}/nodes/${nodeId}/object-properties`);
    return response.data;
  } else {
    // 兼容旧API（单图谱）
    const response = await api.get(`/graph/nodes/${nodeId}/object-properties`);
    return response.data;
  }
};

// 追溯相关API
export const traceEntity = async (entityId, queryType = 'full_trace', depth = 3, graphId = null) => {
  const response = await api.post('/ontology/trace', {
    entity_id: entityId,
    query_type: queryType,
    depth: depth,
    graph_id: graphId
  });
  return response;
};

export const fetchEntityPath = async (entityId) => {
  const response = await api.get(`/ontology/path/${entityId}`);
  return response;
};

export const fetchTestCoverage = async (entityId) => {
  const response = await api.get(`/ontology/coverage/${entityId}`);
  return response;
};

// 导入相关API
export const importMarkdown = async (content, type = 'triples') => {
  const response = await api.post('/import/markdown', { content, type });
  return response;
};

export const importExcel = async (data, type = 'triples') => {
  const response = await api.post('/import/excel', { data, type });
  return response;
};

export const importJSON = async (nodes, edges) => {
  const response = await api.post('/import/json', { nodes, edges });
  return response;
};

export const clearAllData = async () => {
  const response = await api.delete('/import/clear');
  return response.data;
};

// ==================== 多图谱管理API ====================

/**
 * 获取图谱列表
 * @param {Object} filter - 过滤条件 {page, pageSize, search, status, tags}
 */
export const getGraphs = async (filter = {}) => {
  const response = await api.get('/graphs', { params: filter });
  return response;
};

/**
 * 获取单个图谱详情
 * @param {string} id - 图谱ID
 */
export const getGraph = async (id) => {
  const response = await api.get(`/graphs/${id}`);
  return response;
};

/**
 * 创建新图谱
 * @param {Object} graphData - 图谱数据
 */
export const createGraph = async (graphData) => {
  const response = await api.post('/graphs', graphData);
  return response;
};

/**
 * 更新图谱
 * @param {string} id - 图谱ID
 * @param {Object} updates - 更新内容
 */
export const updateGraph = async (id, updates) => {
  const response = await api.put(`/graphs/${id}`, updates);
  return response;
};

/**
 * 删除图谱
 * @param {string} id - 图谱ID
 */
export const deleteGraph = async (id) => {
  const response = await api.delete(`/graphs/${id}`);
  return response;
};

/**
 * 复制图谱
 * @param {string} id - 源图谱ID
 * @param {string} newName - 新图谱名称
 */
export const duplicateGraph = async (id, newName) => {
  const response = await api.post(`/graphs/${id}/duplicate`, { newName });
  return response;
};

/**
 * 导出图谱
 * @param {string} id - 图谱ID
 */
export const exportGraph = async (id) => {
  const response = await api.get(`/graphs/${id}/export`);
  return response;
};

/**
 * 验证图谱数据
 * @param {string} id - 图谱ID
 */
export const validateGraph = async (id) => {
  const response = await api.post(`/graphs/${id}/validate`);
  return response;
};

/**
 * 获取图谱统计信息
 * @param {string} id - 图谱ID
 */
export const getGraphStatistics = async (id) => {
  const response = await api.get(`/graphs/${id}/statistics`);
  return response;
};

/**
 * 保存 Schema 定义
 * @param {string} graphId - 图谱ID（可选）
 * @param {Object} schema - Schema 定义
 */
export const saveSchema = async (graphId, schema) => {
  const response = await api.post('/schema/save', {
    graphId,
    schema,
  });
  return response;
};

/**
 * 加载 Schema 定义
 * @param {string} graphId - 图谱ID（可选）
 */
export const loadSchema = async (graphId) => {
  const params = graphId ? { graphId } : {};
  const response = await api.get('/schema/load', { params });
  return response.data;
};

/**
 * 验证 Schema 定义
 * @param {Object} schema - Schema 定义
 */
export const validateSchema = async (schema) => {
  const response = await api.post('/schema/validate', { schema });
  return response;
};

// ==================== Schema Entity Type CRUD ====================

/**
 * 获取所有实体类型
 */
export const fetchEntityTypes = async () => {
  const response = await api.get('/graph/schema/entity-types');
  return response.data;
};

/**
 * 获取单个实体类型
 * @param {string} code - 实体类型编码
 */
export const fetchEntityTypeByCode = async (code) => {
  const response = await api.get(`/graph/schema/entity-types/${code}`);
  return response.data;
};

/**
 * 创建实体类型
 * @param {Object} entityType - 实体类型定义
 */
export const createEntityType = async (entityType) => {
  const response = await api.post('/graph/schema/entity-types', entityType);
  return response.data;
};

/**
 * 更新实体类型
 * @param {string} code - 实体类型编码
 * @param {Object} updates - 更新内容
 */
export const updateEntityType = async (code, updates) => {
  const response = await api.put(`/graph/schema/entity-types/${code}`, updates);
  return response.data;
};

/**
 * 删除实体类型
 * @param {string} code - 实体类型编码
 */
export const deleteEntityType = async (code) => {
  const response = await api.delete(`/graph/schema/entity-types/${code}`);
  return response.data;
};

// ==================== Schema Relation Type CRUD ====================

/**
 * 获取所有关系类型
 */
export const fetchRelationTypes = async () => {
  const response = await api.get('/graph/schema/relation-types');
  return response.data;
};

/**
 * 获取单个关系类型
 * @param {string} code - 关系类型编码
 */
export const fetchRelationTypeByCode = async (code) => {
  const response = await api.get(`/graph/schema/relation-types/${code}`);
  return response.data;
};

/**
 * 创建关系类型
 * @param {Object} relationType - 关系类型定义
 */
export const createRelationType = async (relationType) => {
  const response = await api.post('/graph/schema/relation-types', relationType);
  return response.data;
};

/**
 * 更新关系类型
 * @param {string} code - 关系类型编码
 * @param {Object} updates - 更新内容
 */
export const updateRelationType = async (code, updates) => {
  const response = await api.put(`/graph/schema/relation-types/${code}`, updates);
  return response.data;
};

/**
 * 删除关系类型
 * @param {string} code - 关系类型编码
 */
export const deleteRelationType = async (code) => {
  const response = await api.delete(`/graph/schema/relation-types/${code}`);
  return response.data;
};

// ==================== OAG (Ontology Asset Graph) API ====================

/**
 * 获取 OAG 列表
 */
export const getOAGList = async () => {
  const response = await api.get('/oag');
  return response;
};

/**
 * 获取 OAG 详情
 * @param {string} oagId - OAG ID
 */
export const getOAGById = async (oagId) => {
  const response = await api.get(`/oag/${oagId}`);
  return response;
};

/**
 * 创建 OAG 实例
 * @param {Object} data - OAG 数据
 */
export const createOAG = async (data) => {
  const response = await api.post('/oag', data);
  return response;
};

/**
 * 更新 OAG
 * @param {string} oagId - OAG ID
 * @param {Object} data - 更新内容
 */
export const updateOAG = async (oagId, data) => {
  const response = await api.put(`/oag/${oagId}`, data);
  return response;
};

/**
 * 删除 OAG
 * @param {string} oagId - OAG ID
 */
export const deleteOAG = async (oagId) => {
  const response = await api.delete(`/oag/${oagId}`);
  return response;
};

/**
 * 基于 Schema 生成 OAG
 * @param {string} schemaId - Schema ID
 * @param {Object} config - 配置
 */
export const generateOAGFromSchema = async (schemaId, config = {}) => {
  const response = await api.post('/oag/generate', {
    schemaId,
    ...config
  });
  return response;
};

/**
 * 基于模板生成 OAG
 * @param {string} templateId - 模板 ID
 * @param {Object} params - 模板参数
 */
export const generateOAGFromTemplate = async (templateId, params = {}) => {
  const response = await api.post('/oag/generate-from-template', {
    templateId,
    params
  });
  return response;
};

/**
 * 批量实例化 OAG
 * @param {string} schemaId - Schema ID
 * @param {Object} dataSource - 数据源
 * @param {Object} mappingConfig - 映射配置
 */
export const batchInstantiateOAG = async (schemaId, dataSource, mappingConfig = {}) => {
  const response = await api.post('/oag/instantiate', {
    schemaId,
    dataSource,
    mappingConfig
  });
  return response;
};

/**
 * 验证 OAG
 * @param {string} oagId - OAG ID
 * @param {string} schemaId - Schema ID（可选）
 */
export const validateOAG = async (oagId, schemaId) => {
  const response = await api.post(`/oag/${oagId}/validate`, {
    schemaId
  });
  return response;
};

/**
 * 获取 OAG 模板列表
 */
export const getOAGTemplates = async () => {
  const response = await api.get('/oag/templates');
  return response;
};

/**
 * 导出 OAG
 * @param {string} oagId - OAG ID
 * @param {string} format - 导出格式
 */
export const exportOAG = async (oagId, format = 'json') => {
  const response = await api.post(`/oag/${oagId}/export`, {
    format
  }, {
    responseType: 'blob'
  });
  return response;
};

/**
 * 获取 OAG 节点列表
 * @param {string} oagId - OAG ID
 * @param {string} type - 节点类型过滤
 */
export const getOAGNodes = async (oagId, type) => {
  const params = type ? { type } : {};
  const response = await api.get(`/oag/${oagId}/nodes`, { params });
  return response;
};

/**
 * 获取 OAG 边列表
 * @param {string} oagId - OAG ID
 * @param {Object} filters - 过滤条件
 */
export const getOAGEdges = async (oagId, filters = {}) => {
  const response = await api.get(`/oag/${oagId}/edges`, { params: filters });
  return response;
};

/**
 * 向 OAG 添加节点
 * @param {string} oagId - OAG ID
 * @param {Object} node - 节点数据
 */
export const addOAGNode = async (oagId, node) => {
  const response = await api.post(`/oag/${oagId}/nodes`, node);
  return response;
};

/**
 * 向 OAG 添加边
 * @param {string} oagId - OAG ID
 * @param {Object} edge - 边数据
 */
export const addOAGEdge = async (oagId, edge) => {
  const response = await api.post(`/oag/${oagId}/edges`, edge);
  return response;
};

export default api;
