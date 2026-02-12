/**
 * Schema相关类型定义
 */

// 属性定义
export interface PropertyDefinition {
  name: string;
  label?: string;
  type: 'string' | 'text' | 'integer' | 'float' | 'boolean' | 'date' | 'enum' | 'objectproperty';
  required?: boolean;
  default?: any;
  description?: string;
  enum?: string[];
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

// 关系类型
export interface RelationType {
  id: string;
  label: string;
  description?: string;
  from: string[];
  to: string[];
  properties?: Record<string, any>;
  bidirectional?: boolean;
  color?: string;
}

// Schema定义
export interface Schema {
  version: string;
  entityTypes: Record<string, EntityType>;
  relationTypes: Record<string, RelationType>;
}

// Schema验证结果
export interface SchemaValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

// Schema版本
export interface SchemaVersion {
  id: string;
  version: string;
  comment?: string;
  createdAt: string;
  createdBy?: string;
}
