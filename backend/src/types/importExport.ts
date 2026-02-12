/**
 * 导入导出相关类型定义
 */

// 导入文件格式
export type ImportFormat = 'xlsx' | 'csv' | 'json';

// 导出文件格式
export type ExportFormat = 'xlsx' | 'csv' | 'json' | 'graphml' | 'cypher';

// 导入选项
export interface ImportOptions {
  format: ImportFormat;
  sheetName?: string; // Excel sheet名称
  headerRow?: number; // 表头行号，默认0
  mapping?: FieldMapping; // 字段映射
  skipValidation?: boolean; // 是否跳过验证
  batchSize?: number; // 批量处理大小
}

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  sheetName?: string;
  includeMetadata?: boolean;
  filters?: ExportFilters;
}

// 字段映射
export interface FieldMapping {
  [sourceField: string]: string; // source -> target
}

// 导出过滤条件
export interface ExportFilters {
  entityTypes?: string[];
  relationTypes?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

// 导入结果
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
  warnings: string[];
  duration: number; // 毫秒
}

// 导入错误
export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

// 导出结果
export interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  recordCount: number;
  downloadUrl?: string;
  duration: number;
}

// 导入任务
export interface ImportTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: ImportResult;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// 数据验证错误
export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value: any;
}

// 预览数据
export interface PreviewData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  sampleData: Record<string, any>[];
}
