import { message, notification, Modal } from 'antd';

/**
 * 错误码到用户友好消息的映射
 */
export const ErrorMessageMap = {
  // 通用错误
  'NETWORK_ERROR': '网络连接失败，请检查网络后重试',
  'TIMEOUT_ERROR': '请求超时，请稍后重试',
  'CANCELLED': '请求已取消',
  
  // 业务错误
  'VALIDATION_ERROR': '数据验证失败，请检查输入',
  'SCHEMA_NOT_FOUND': 'Schema不存在，请检查Schema ID',
  'OAG_NOT_FOUND': '图谱不存在或已被删除',
  'GRAPH_NOT_FOUND': '图谱不存在或已被删除',
  'IMPORT_FORMAT_ERROR': '文件格式不支持，请使用.xlsx或.csv格式',
  'IMPORT_DATA_ERROR': '数据解析失败，请检查文件内容',
  'IMPORT_VALIDATION_ERROR': '数据验证失败，请检查文件内容',
  'EXPORT_ERROR': '数据导出失败，请稍后重试',
  'SCHEMA_VALIDATION_ERROR': 'Schema验证失败',
  
  // 权限错误
  'UNAUTHORIZED': '请先登录',
  'FORBIDDEN': '您没有权限执行此操作',
  
  // 资源错误
  'NOT_FOUND': '请求的资源不存在',
  'CONFLICT': '资源冲突，可能已存在',
  
  // 服务器错误
  'INTERNAL_ERROR': '服务器内部错误，请稍后重试',
  'DATABASE_ERROR': '数据库操作失败，请稍后重试',
  'EXTERNAL_SERVICE_ERROR': '外部服务调用失败',
};

/**
 * 获取用户友好的错误消息
 * @param {Error|Object} error - 错误对象
 * @returns {string} 用户友好的错误消息
 */
export const getFriendlyErrorMessage = (error) => {
  if (!error) return '操作失败，请稍后重试';
  
  // 如果是Axios错误
  if (error.response?.data?.error?.code) {
    const code = error.response.data.error.code;
    return ErrorMessageMap[code] || error.response.data.error.message || '操作失败，请稍后重试';
  }
  
  // 如果有错误码
  if (error.code && ErrorMessageMap[error.code]) {
    return ErrorMessageMap[error.code];
  }
  
  // 网络错误
  if (error.message?.includes('Network Error')) {
    return ErrorMessageMap['NETWORK_ERROR'];
  }
  
  // 超时错误
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ErrorMessageMap['TIMEOUT_ERROR'];
  }
  
  // 返回原始消息或默认消息
  return error.message || '操作失败，请稍后重试';
};

/**
 * 获取错误详情（开发环境使用）
 * @param {Error|Object} error - 错误对象
 * @returns {Object|null} 错误详情
 */
export const getErrorDetails = (error) => {
  if (!error) return null;
  
  if (process.env.NODE_ENV === 'development') {
    return {
      code: error.code || error.response?.data?.error?.code,
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    };
  }
  
  return null;
};

/**
 * 显示错误提示（自动根据错误类型选择合适的提示方式）
 * @param {Error|Object} error - 错误对象
 * @param {Object} options - 配置选项
 */
export const showError = (error, options = {}) => {
  const { 
    silent = false,           // 是否静默处理
    useModal = false,         // 是否使用Modal
    useNotification = false,  // 是否使用Notification
    duration = 3,             // 显示时长
    onClose                   // 关闭回调
  } = options;
  
  if (silent) {
    console.error('Silent error:', error);
    return;
  }
  
  const errorMessage = getFriendlyErrorMessage(error);
  const errorDetails = getErrorDetails(error);
  
  if (useModal) {
    Modal.error({
      title: '操作失败',
      content: errorMessage,
      onOk: onClose
    });
  } else if (useNotification) {
    notification.error({
      message: '操作失败',
      description: errorMessage,
      duration,
      onClose
    });
  } else {
    message.error(errorMessage, duration, onClose);
  }
  
  // 开发环境在控制台输出详情
  if (errorDetails) {
    console.error('Error details:', errorDetails);
  }
};

/**
 * 显示成功提示
 * @param {string} msg - 成功消息
 * @param {Object} options - 配置选项
 */
export const showSuccess = (msg, options = {}) => {
  const { duration = 2 } = options;
  message.success(msg, duration);
};

/**
 * 显示警告提示
 * @param {string} msg - 警告消息
 * @param {Object} options - 配置选项
 */
export const showWarning = (msg, options = {}) => {
  const { duration = 3, useNotification = false } = options;
  
  if (useNotification) {
    notification.warning({
      message: '警告',
      description: msg,
      duration
    });
  } else {
    message.warning(msg, duration);
  }
};

/**
 * 显示导入/导出进度
 * @param {string} type - 'import' | 'export'
 * @param {Object} progress - 进度信息
 */
export const showProgress = (type, progress) => {
  const { current, total, status } = progress;
  const percent = Math.round((current / total) * 100);
  
  const actionText = type === 'import' ? '导入' : '导出';
  
  if (status === 'processing') {
    message.loading(`${actionText}中... ${percent}%`, 0);
  } else if (status === 'completed') {
    message.destroy();
    message.success(`${actionText}完成！共处理 ${total} 条数据`);
  } else if (status === 'error') {
    message.destroy();
    message.error(`${actionText}失败`);
  }
};

/**
 * 全局错误处理器
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文信息
 */
export const handleGlobalError = (error, context = {}) => {
  const { source, silent = false } = context;
  
  console.error(`[Global Error Handler] Source: ${source}`, error);
  
  if (!silent) {
    showError(error, { useNotification: true });
  }
  
  // 可以在这里添加错误上报逻辑
  // reportError(error, context);
};

/**
 * 请求错误处理器（用于API调用）
 * @param {Error} error - Axios错误对象
 * @returns {Promise<never>} 始终rejected的Promise
 */
export const handleRequestError = async (error) => {
  const errorMessage = getFriendlyErrorMessage(error);
  
  // 根据错误类型决定提示方式
  if (error.response?.status >= 500) {
    // 服务器错误使用Notification
    notification.error({
      message: '服务器错误',
      description: errorMessage,
      duration: 5
    });
  } else if (error.response?.status === 401) {
    // 未授权，需要登录
    Modal.warning({
      title: '登录已过期',
      content: '您的登录状态已过期，请重新登录',
      onOk: () => {
        window.location.href = '/login';
      }
    });
  } else {
    // 其他错误使用message
    message.error(errorMessage);
  }
  
  return Promise.reject(error);
};

export default {
  ErrorMessageMap,
  getFriendlyErrorMessage,
  getErrorDetails,
  showError,
  showSuccess,
  showWarning,
  showProgress,
  handleGlobalError,
  handleRequestError
};
