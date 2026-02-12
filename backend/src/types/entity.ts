/**
 * 实体类型定义
 */

// 属性定义
export interface PropertyDefinition {
  name: string;
  label?: string;
  type: 'string' | 'text' | 'integer' | 'float' | 'boolean' | 'date' | 'enum' | 'objectproperty';
  required?: boolean;
  default?: any;
  description?: string;
  enum?: string[]; // 当type为enum时使用
}

// 实体类型
export interface EntityType {
  code: string;
  label: string;
  description?: string;
  properties: Record<string, PropertyDefinition>;
  color: string;
  icon?: string;
  isAbstract?: boolean;
  parentType?: string;
  domain?: string;
}

// 实体实例
export interface Entity {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion?: string;
}

// 实体创建请求
export interface CreateEntityRequest {
  type: string;
  label: string;
  properties?: Record<string, any>;
}

// 实体更新请求
export interface UpdateEntityRequest {
  label?: string;
  properties?: Record<string, any>;
}

// 实体查询参数
export interface EntityQueryParams {
  type?: string;
  label?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
