/**
 * Schema定义
 */

import { EntityType } from './entity';
import { RelationType } from './relation';

// Schema定义
export interface Schema {
  version: string;
  entityTypes: Record<string, EntityType>;
  relationTypes: Record<string, RelationType>;
  metadata?: SchemaMetadata;
}

// Schema元数据
export interface SchemaMetadata {
  name?: string;
  description?: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema版本
export interface SchemaVersion {
  id: string;
  schemaId: string;
  version: string;
  data: Schema;
  comment?: string;
  createdAt: Date;
  createdBy?: string;
  parentVersionId?: string;
}

// Schema验证结果
export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Schema变更影响分析
export interface SchemaChangeImpact {
  breaking: ChangeItem[];
  nonBreaking: ChangeItem[];
  affectedNodes: number;
}

export interface ChangeItem {
  type: 'entity_removed' | 'property_removed' | 'property_added' | 'relation_removed';
  code?: string;
  entity?: string;
  property?: string;
  id?: string;
  message: string;
}

// Schema导出格式
export type SchemaExportFormat = 'json' | 'yaml' | 'owl' | 'xlsx';

// Schema导入选项
export interface SchemaImportOptions {
  format: SchemaExportFormat;
  overwrite?: boolean;
  validate?: boolean;
}
