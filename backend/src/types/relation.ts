/**
 * 关系类型定义
 */

// 关系类型
export interface RelationType {
  id: string;
  label: string;
  description?: string;
  from: string[]; // 源实体类型列表
  to: string[];   // 目标实体类型列表
  properties?: Record<string, any>;
  bidirectional?: boolean;
  color?: string;
}

// 关系实例
export interface Relation {
  id: string;
  source: string; // 源实体ID
  target: string; // 目标实体ID
  type: string;
  label?: string;
  properties?: Record<string, any>;
  createdAt: Date;
}

// 关系创建请求
export interface CreateRelationRequest {
  source: string;
  target: string;
  type: string;
  label?: string;
  properties?: Record<string, any>;
}

// 关系更新请求
export interface UpdateRelationRequest {
  label?: string;
  properties?: Record<string, any>;
}

// 关系查询参数
export interface RelationQueryParams {
  type?: string;
  source?: string;
  target?: string;
  limit?: number;
  offset?: number;
}
