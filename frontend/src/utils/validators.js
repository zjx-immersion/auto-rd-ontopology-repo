/**
 * 验证工具函数
 */

/**
 * 验证图谱名称
 * @param {string} name - 图谱名称
 * @returns {boolean} 是否有效
 */
export const isValidGraphName = (name) => {
  if (!name) return false;
  if (typeof name !== 'string') return false;
  if (name.trim().length === 0) return false;
  if (name.length > 100) return false;
  return true;
};

/**
 * 验证节点ID格式
 * @param {string} id - 节点ID
 * @returns {boolean} 是否有效
 */
export const isValidNodeId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  // ID格式: TYPE_NUMBER (如: Epic_001)
  const pattern = /^[A-Za-z_][A-Za-z0-9_]*_\d+$/;
  return pattern.test(id);
};

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

/**
 * 验证图谱数据
 * @param {Object} data - 图谱数据
 * @returns {string[]} 错误列表
 */
export const validateGraphData = (data) => {
  const errors = [];
  
  if (!data) {
    errors.push('数据不能为空');
    return errors;
  }
  
  if (!data.name || !isValidGraphName(data.name)) {
    errors.push('图谱名称无效');
  }
  
  if (data.nodes && !Array.isArray(data.nodes)) {
    errors.push('节点数据必须是数组');
  }
  
  if (data.edges && !Array.isArray(data.edges)) {
    errors.push('边数据必须是数组');
  }
  
  return errors;
};

/**
 * 验证节点数据
 * @param {Object} node - 节点数据
 * @returns {string[]} 错误列表
 */
export const validateNodeData = (node) => {
  const errors = [];
  
  if (!node) {
    errors.push('节点数据不能为空');
    return errors;
  }
  
  if (!node.id) {
    errors.push('节点ID不能为空');
  }
  
  if (!node.type) {
    errors.push('节点类型不能为空');
  }
  
  if (!node.label) {
    errors.push('节点标签不能为空');
  }
  
  return errors;
};

/**
 * 验证边数据
 * @param {Object} edge - 边数据
 * @returns {string[]} 错误列表
 */
export const validateEdgeData = (edge) => {
  const errors = [];
  
  if (!edge) {
    errors.push('边数据不能为空');
    return errors;
  }
  
  if (!edge.source) {
    errors.push('边的源节点不能为空');
  }
  
  if (!edge.target) {
    errors.push('边的目标节点不能为空');
  }
  
  if (!edge.type) {
    errors.push('边类型不能为空');
  }
  
  return errors;
};
