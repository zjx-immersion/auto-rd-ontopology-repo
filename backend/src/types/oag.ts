/**
 * OAG (Ontology Abstraction Graph) 定义
 */

import { Entity, EntityQueryParams } from './entity';
import { Relation, RelationQueryParams } from './relation';
import { Schema } from './schema';

// OAG定义
export interface OAG {
  id: string;
  name: string;
  description?: string;
  schemaId: string;
  schema?: Schema;
  entities: Entity[];
  relations: Relation[];
  metadata?: OAGMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// OAG元数据
export interface OAGMetadata {
  nodeCount: number;
  edgeCount: number;
  schemaVersion: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}

// OAG创建请求
export interface CreateOAGRequest {
  name: string;
  description?: string;
  schemaId: string;
  initialData?: {
    entities?: Partial<Entity>[];
    relations?: Partial<Relation>[];
  };
}

// OAG更新请求
export interface UpdateOAGRequest {
  name?: string;
  description?: string;
  entities?: Partial<Entity>[];
  relations?: Partial<Relation>[];
}

// OAG查询参数
export interface OAGQueryParams {
  name?: string;
  schemaId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// OAG版本
export interface OAGVersion {
  id: string;
  oagId: string;
  version: string;
  data: OAG;
  comment?: string;
  createdAt: Date;
  createdBy?: string;
  parentVersionId?: string;
}

// OAG对比结果
export interface OAGDiff {
  added: {
    entities: Entity[];
    relations: Relation[];
  };
  removed: {
    entities: Entity[];
    relations: Relation[];
  };
  modified: {
    entities: { old: Entity; new: Entity }[];
    relations: { old: Relation; new: Relation }[];
  };
}

// 图谱统计
export interface OAGStatistics {
  entityCount: number;
  relationCount: number;
  entityTypeDistribution: Record<string, number>;
  relationTypeDistribution: Record<string, number>;
  density: number;
  connectivity: number;
}
