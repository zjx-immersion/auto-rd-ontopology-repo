/**
 * UI相关类型定义
 */
import type { ReactNode } from 'react';

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// 通知配置
export interface NotificationConfig {
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

// Modal配置
export interface ModalConfig {
  title: string;
  content: ReactNode;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
}

// 加载状态
export interface LoadingState {
  loading: boolean;
  error: Error | null;
  data: any;
}

// 表格列配置
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  render?: (value: any, record: T, index: number) => ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  filters?: Array<{ text: string; value: any }>;
}

// 表单字段配置
export interface FormField {
  name: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'number' | 'date' | 'switch' | 'color';
  required?: boolean;
  rules?: Array<{
    required?: boolean;
    message?: string;
    pattern?: RegExp;
    validator?: (rule: any, value: any) => Promise<void>;
  }>;
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
  disabled?: boolean;
}

// 菜单项
export interface MenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: MenuItem[];
  hidden?: boolean;
  permission?: string;
}

// 主题配置
export interface ThemeConfig {
  primaryColor: string;
  darkMode: boolean;
  compact: boolean;
}

// 编辑器状态
export interface EditorState {
  undoStack: any[];
  redoStack: any[];
  canUndo: boolean;
  canRedo: boolean;
  hasChanges: boolean;
}

// 选中项
export interface SelectedItem {
  type: 'entity' | 'relation' | 'node' | 'edge';
  id: string;
  data: any;
}
