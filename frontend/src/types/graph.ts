/**
 * 图谱相关类型定义
 */

import type { CSSProperties } from 'react';
import type { EntityType, RelationType } from './schema';

// 节点
export interface Node {
  id: string;
  type: string;
  label: string;
  properties?: Record<string, any>;
  position?: {
    x: number;
    y: number;
  };
  data?: any;
  style?: CSSProperties;
}

// 边
export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  properties?: Record<string, any>;
  data?: any;
  animated?: boolean;
  style?: CSSProperties;
}

// 图谱数据
export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

// OAG定义
export interface OAG {
  id: string;
  name: string;
  description?: string;
  schemaId: string;
  schema?: {
    entityTypes: Record<string, EntityType>;
    relationTypes: Record<string, RelationType>;
  };
  entities: Node[];
  relations: Edge[];
  createdAt: string;
  updatedAt: string;
}

// 布局类型
export type LayoutType = 'auto' | 'force' | 'hierarchical' | 'cluster' | 'tree';

// 布局选项
export interface LayoutOptions {
  type: LayoutType;
  width?: number;
  height?: number;
  nodeSpacing?: number;
  edgeLength?: number;
  animate?: boolean;
}

// 图谱统计
export interface GraphStatistics {
  nodeCount: number;
  edgeCount: number;
  entityTypeDistribution: Record<string, number>;
  relationTypeDistribution: Record<string, number>;
}

// 导入导出选项
export interface ImportExportOptions {
  format: 'xlsx' | 'csv' | 'json';
  includeMetadata?: boolean;
  fieldMapping?: Record<string, string>;
}

// 导入结果
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
  warnings: string[];
}

// 导出结果
export interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
}
