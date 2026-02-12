/**
 * 格式化工具函数单元测试
 */
import {
  formatNodeCount,
  formatDate,
  truncateText,
  formatFileSize,
  formatPercentage,
  formatDuration
} from '../formatters';

describe('格式化工具函数', () => {
  describe('formatNodeCount', () => {
    it('应该格式化0个节点', () => {
      expect(formatNodeCount(0)).toBe('0 节点');
    });

    it('应该格式化1个节点', () => {
      expect(formatNodeCount(1)).toBe('1 节点');
    });

    it('应该格式化多个节点', () => {
      expect(formatNodeCount(10)).toBe('10 节点');
      expect(formatNodeCount(100)).toBe('100 节点');
      expect(formatNodeCount(999)).toBe('999 节点');
    });
  });

  describe('formatDate', () => {
    it('应该格式化有效日期', () => {
      const result = formatDate('2026-01-15');
      expect(result).not.toBe('-');
      expect(typeof result).toBe('string');
    });

    it('应该处理无效日期', () => {
      expect(formatDate('')).toBe('-');
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate('invalid')).toBe('-');
    });
  });

  describe('truncateText', () => {
    it('应该截断长文本', () => {
      const longText = 'a'.repeat(100);
      const result = truncateText(longText, 50);
      expect(result).toHaveLength(53); // 50 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('应该保留短文本', () => {
      const shortText = '短文本';
      expect(truncateText(shortText, 50)).toBe(shortText);
    });

    it('应该处理空值', () => {
      expect(truncateText('')).toBe('');
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
    });

    it('应该使用默认长度50', () => {
      const text = 'a'.repeat(60);
      const result = truncateText(text);
      expect(result).toHaveLength(53);
    });
  });

  describe('formatFileSize', () => {
    it('应该格式化字节', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toMatch(/512 B/);
    });

    it('应该格式化KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toMatch(/1\.5 KB/);
    });

    it('应该格式化MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('应该保留两位小数', () => {
      const result = formatFileSize(1536);
      expect(result).toMatch(/\d+\.\d{1,2} KB/);
    });
  });

  describe('formatPercentage', () => {
    it('应该格式化百分比', () => {
      expect(formatPercentage(50, 100)).toBe('50.0%');
      expect(formatPercentage(1, 4)).toBe('25.0%');
    });

    it('应该处理0总数', () => {
      expect(formatPercentage(10, 0)).toBe('0%');
    });

    it('应该处理小数', () => {
      expect(formatPercentage(1, 3)).toMatch(/33\.3%/);
    });
  });

  describe('formatDuration', () => {
    it('应该格式化毫秒', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('应该格式化秒', () => {
      expect(formatDuration(1500)).toMatch(/1\.5s/);
    });

    it('应该格式化分钟', () => {
      expect(formatDuration(90000)).toMatch(/1m 30s/);
    });
  });
});
