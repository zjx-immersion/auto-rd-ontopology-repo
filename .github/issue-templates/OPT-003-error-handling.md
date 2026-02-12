# OPT-003: 统一错误处理

## 目标
建立统一的错误处理机制，提供用户友好的错误提示。

## 当前问题
- try-catch不完整，未捕获错误导致崩溃
- 错误信息暴露技术细节，用户看不懂
- 后端返回错误格式不统一
- 前端错误边界缺失

## 优化方案

### 1. 后端统一错误响应

```typescript
// types/error.ts
interface ApiError {
  code: string;           // 错误码
  message: string;        // 用户友好的错误信息
  details?: string;       // 技术详情（仅开发环境）
  timestamp: string;
  requestId: string;      // 用于问题追踪
  path: string;
}

// 错误码定义
enum ErrorCode {
  // 4xx Client Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // 5xx Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}
```

**Express错误中间件:**
```typescript
// middleware/errorHandler.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errorResponse: ApiError = {
    code: err.code || 'INTERNAL_ERROR',
    message: getUserFriendlyMessage(err),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    path: req.path
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.stack;
  }

  res.status(err.status || 500).json({
    success: false,
    error: errorResponse
  });
};
```

### 2. 前端错误边界

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 上报错误到监控服务
    errorReporter.report({
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// 友好错误提示组件
const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <Result
    status="error"
    title="出错了"
    subTitle={getFriendlyErrorMessage(error)}
    extra={[
      <Button type="primary" onClick={() => window.location.reload()}>
        刷新页面
      </Button>,
      <Button onClick={() => history.back()}>
        返回上一步
      </Button>
    ]}
  />
);
```

### 3. 用户友好错误映射

```typescript
// utils/errorMessages.ts
const errorMessageMap: Record<string, string> = {
  // 通用错误
  'NETWORK_ERROR': '网络连接失败，请检查网络后重试',
  'TIMEOUT_ERROR': '请求超时，请稍后重试',
  
  // 业务错误
  'SCHEMA_NOT_FOUND': 'Schema不存在，请检查Schema ID',
  'OAG_NOT_FOUND': '图谱不存在或已被删除',
  'VALIDATION_ERROR': '数据验证失败，请检查输入',
  'IMPORT_FORMAT_ERROR': '文件格式不支持，请使用.xlsx或.csv格式',
  'IMPORT_DATA_ERROR': '数据解析失败，请检查文件内容',
  
  // 权限错误
  'UNAUTHORIZED': '请先登录',
  'FORBIDDEN': '您没有权限执行此操作',
  
  // 服务器错误
  'INTERNAL_ERROR': '服务器内部错误，请联系管理员',
  'DATABASE_ERROR': '数据库操作失败，请稍后重试'
};

export const getFriendlyErrorMessage = (error: any): string => {
  const code = error?.response?.data?.error?.code || error?.code;
  return errorMessageMap[code] || '操作失败，请稍后重试';
};
```

## 工作量估算
- **总工时**: 8h
- **后端错误处理**: 3h
- **前端错误边界**: 3h
- **错误映射配置**: 2h

## 验收标准
- [ ] 所有API错误返回统一格式
- [ ] 前端有全局错误边界
- [ ] 用户看到友好的中文错误提示
- [ ] 开发环境显示技术详情
- [ ] 错误日志可追踪

## 相关文件
- `backend/src/middleware/errorHandler.js` (新建)
- `frontend/src/components/ErrorBoundary/` (新建)
- `frontend/src/utils/errorHandler.js` (新建)
