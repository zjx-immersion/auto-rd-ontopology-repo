/**
 * 格式化工具函数
 */

/**
 * 格式化节点数量
 * @param {number} count - 节点数量
 * @returns {string} 格式化后的字符串
 */
export const formatNodeCount = (count) => {
  if (count === 0) return '0 节点';
  if (count === 1) return '1 节点';
  return `${count} 节点`;
};

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('zh-CN');
};

/**
 * 截断文本
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  // 整数不显示小数，非整数保留两位小数并移除末尾零
  const formattedValue = Number.isInteger(value) 
    ? value.toString() 
    : parseFloat(value.toFixed(2)).toString();
  return formattedValue + ' ' + sizes[i];
};

/**
 * 格式化百分比
 * @param {number} value - 数值
 * @param {number} total - 总数
 * @returns {string} 百分比字符串
 */
export const formatPercentage = (value, total) => {
  if (!total) return '0%';
  const percentage = (value / total) * 100;
  return percentage.toFixed(1) + '%';
};

/**
 * 格式化持续时间（毫秒转可读格式）
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化后的时间
 */
export const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
};
