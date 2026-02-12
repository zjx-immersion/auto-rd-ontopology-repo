/**
 * 统一错误处理中间件
 * 提供标准化的错误响应格式
 */

const ErrorCode = {
  // 4xx Client Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  
  // 5xx Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  IMPORT_ERROR: 'IMPORT_ERROR',
  EXPORT_ERROR: 'EXPORT_ERROR'
};

// 错误码到HTTP状态码的映射
const ErrorStatusMap = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.IMPORT_ERROR]: 400,
  [ErrorCode.EXPORT_ERROR]: 500
};

// 用户友好的错误消息映射
const ErrorMessageMap = {
  [ErrorCode.VALIDATION_ERROR]: '数据验证失败，请检查输入',
  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.UNAUTHORIZED]: '请先登录',
  [ErrorCode.FORBIDDEN]: '您没有权限执行此操作',
  [ErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.CONFLICT]: '资源冲突，可能已存在',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误，请稍后重试',
  [ErrorCode.DATABASE_ERROR]: '数据库操作失败，请稍后重试',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服务调用失败',
  [ErrorCode.IMPORT_ERROR]: '数据导入失败，请检查文件格式',
  [ErrorCode.EXPORT_ERROR]: '数据导出失败'
};

/**
 * 自定义API错误类
 */
class ApiError extends Error {
  constructor(code, message, statusCode, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode || ErrorStatusMap[code] || 500;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message, details) {
    return new ApiError(ErrorCode.BAD_REQUEST, message, 400, details);
  }
  
  static validation(message, details) {
    return new ApiError(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
  
  static notFound(resource) {
    return new ApiError(ErrorCode.NOT_FOUND, `${resource} 不存在`, 404);
  }
  
  static unauthorized(message = '请先登录') {
    return new ApiError(ErrorCode.UNAUTHORIZED, message, 401);
  }
  
  static forbidden(message = '权限不足') {
    return new ApiError(ErrorCode.FORBIDDEN, message, 403);
  }
  
  static conflict(message) {
    return new ApiError(ErrorCode.CONFLICT, message, 409);
  }
  
  static internal(message = '服务器内部错误') {
    return new ApiError(ErrorCode.INTERNAL_ERROR, message, 500);
  }
  
  static database(message, details) {
    return new ApiError(ErrorCode.DATABASE_ERROR, message, 500, details);
  }
  
  static import(message, details) {
    return new ApiError(ErrorCode.IMPORT_ERROR, message, 400, details);
  }
  
  static export(message, details) {
    return new ApiError(ErrorCode.EXPORT_ERROR, message, 500, details);
  }
}

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  const requestId = req.headers['x-request-id'] || req.id || Date.now().toString(36);
  
  let errorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: '服务器内部错误，请稍后重试',
      timestamp: new Date().toISOString(),
      requestId,
      path: req.originalUrl || req.path
    }
  };
  
  if (err instanceof ApiError) {
    errorResponse.error.code = err.code;
    errorResponse.error.message = err.message;
    
    if (process.env.NODE_ENV === 'development' && err.details) {
      errorResponse.error.details = err.details;
    }
    
    console.error(`[${requestId}] ${err.code}: ${err.message}`);
    if (err.statusCode >= 500) {
      console.error(err.stack);
    }
    
    return res.status(err.statusCode).json(errorResponse);
  }
  
  if (err.name === 'ValidationError') {
    errorResponse.error.code = ErrorCode.VALIDATION_ERROR;
    errorResponse.error.message = ErrorMessageMap[ErrorCode.VALIDATION_ERROR];
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.details = err.errors || err.message;
    }
    
    console.error(`[${requestId}] ValidationError:`, err.message);
    return res.status(400).json(errorResponse);
  }
  
  if (err.name === 'CastError') {
    errorResponse.error.code = ErrorCode.BAD_REQUEST;
    errorResponse.error.message = `无效的 ${err.path}: ${err.value}`;
    
    console.error(`[${requestId}] CastError:`, err.message);
    return res.status(400).json(errorResponse);
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    errorResponse.error.code = ErrorCode.CONFLICT;
    errorResponse.error.message = `${field} 已存在`;
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.details = err.keyValue;
    }
    
    console.error(`[${requestId}] DuplicateKeyError:`, err.message);
    return res.status(409).json(errorResponse);
  }
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    errorResponse.error.code = ErrorCode.BAD_REQUEST;
    errorResponse.error.message = 'JSON格式错误';
    
    console.error(`[${requestId}] SyntaxError:`, err.message);
    return res.status(400).json(errorResponse);
  }
  
  console.error(`[${requestId}] Unhandled Error:`, err);
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.originalError = err.message;
  }
  
  res.status(500).json(errorResponse);
};

/**
 * 404处理中间件
 */
const notFoundHandler = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || req.id || Date.now().toString(36);
  
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `找不到路径: ${req.originalUrl || req.path}`,
      timestamp: new Date().toISOString(),
      requestId,
      path: req.originalUrl || req.path
    }
  });
};

/**
 * 异步函数包装器 - 自动捕获错误
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 请求日志中间件
 */
const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || Date.now().toString(36);
  req.id = requestId;
  
  const startTime = Date.now();
  
  console.log(`[${requestId}] ${req.method} ${req.originalUrl || req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    console.log(`[${requestId}] ${status} ${req.method} ${req.originalUrl || req.path} - ${duration}ms`);
  });
  
  next();
};

module.exports = {
  ApiError,
  ErrorCode,
  ErrorMessageMap,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestLogger
};
