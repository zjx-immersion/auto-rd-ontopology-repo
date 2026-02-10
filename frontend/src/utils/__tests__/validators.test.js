/**
 * 验证工具函数单元测试
 */
import {
  isValidGraphName,
  isValidNodeId,
  isValidEmail,
  validateGraphData,
  validateNodeData,
  validateEdgeData
} from '../validators';

describe('验证工具函数', () => {
  describe('isValidGraphName', () => {
    it('应该验证有效的图谱名称', () => {
      expect(isValidGraphName('Valid Name')).toBe(true);
      expect(isValidGraphName('A')).toBe(true);
      expect(isValidGraphName('智能驾驶图谱')).toBe(true);
    });

    it('应该拒绝空值', () => {
      expect(isValidGraphName('')).toBe(false);
      expect(isValidGraphName(null)).toBe(false);
      expect(isValidGraphName(undefined)).toBe(false);
    });

    it('应该拒绝空白字符串', () => {
      expect(isValidGraphName('   ')).toBe(false);
      expect(isValidGraphName('\t\n')).toBe(false);
    });

    it('应该拒绝过长的名称', () => {
      expect(isValidGraphName('a'.repeat(101))).toBe(false);
      expect(isValidGraphName('a'.repeat(100))).toBe(true);
    });

    it('应该拒绝非字符串', () => {
      expect(isValidGraphName(123)).toBe(false);
      expect(isValidGraphName({})).toBe(false);
      expect(isValidGraphName([])).toBe(false);
    });
  });

  describe('isValidNodeId', () => {
    it('应该验证有效的节点ID', () => {
      expect(isValidNodeId('Epic_001')).toBe(true);
      expect(isValidNodeId('Feature_123')).toBe(true);
      expect(isValidNodeId('Task_999')).toBe(true);
      expect(isValidNodeId('Node_Type_1')).toBe(true);
    });

    it('应该拒绝无效的节点ID', () => {
      expect(isValidNodeId('')).toBe(false);
      expect(isValidNodeId('Epic')).toBe(false);
      expect(isValidNodeId('001')).toBe(false);
      expect(isValidNodeId('Epic-001')).toBe(false);
      expect(isValidNodeId('Epic 001')).toBe(false);
    });

    it('应该拒绝非字符串', () => {
      expect(isValidNodeId(null)).toBe(false);
      expect(isValidNodeId(123)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('应该验证有效的邮箱', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('应该拒绝无效的邮箱', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
    });
  });

  describe('validateGraphData', () => {
    it('应该验证有效的图谱数据', () => {
      const data = {
        name: 'Test Graph',
        nodes: [],
        edges: []
      };
      const errors = validateGraphData(data);
      expect(errors).toHaveLength(0);
    });

    it('应该检测空数据', () => {
      const errors = validateGraphData(null);
      expect(errors).toContain('数据不能为空');
    });

    it('应该检测无效的名称', () => {
      const errors = validateGraphData({ name: '' });
      expect(errors).toContain('图谱名称无效');
    });

    it('应该检测无效的节点数据', () => {
      const errors = validateGraphData({
        name: 'Test',
        nodes: 'not an array'
      });
      expect(errors).toContain('节点数据必须是数组');
    });

    it('应该检测无效的边数据', () => {
      const errors = validateGraphData({
        name: 'Test',
        edges: 'not an array'
      });
      expect(errors).toContain('边数据必须是数组');
    });
  });

  describe('validateNodeData', () => {
    it('应该验证有效的节点数据', () => {
      const node = {
        id: 'Epic_001',
        type: 'Epic',
        label: 'Test Epic'
      };
      const errors = validateNodeData(node);
      expect(errors).toHaveLength(0);
    });

    it('应该检测空节点', () => {
      const errors = validateNodeData(null);
      expect(errors).toContain('节点数据不能为空');
    });

    it('应该检测缺少ID', () => {
      const errors = validateNodeData({ type: 'Epic', label: 'Test' });
      expect(errors).toContain('节点ID不能为空');
    });

    it('应该检测缺少类型', () => {
      const errors = validateNodeData({ id: 'Epic_001', label: 'Test' });
      expect(errors).toContain('节点类型不能为空');
    });

    it('应该检测缺少标签', () => {
      const errors = validateNodeData({ id: 'Epic_001', type: 'Epic' });
      expect(errors).toContain('节点标签不能为空');
    });
  });

  describe('validateEdgeData', () => {
    it('应该验证有效的边数据', () => {
      const edge = {
        source: 'Node_1',
        target: 'Node_2',
        type: 'relates_to'
      };
      const errors = validateEdgeData(edge);
      expect(errors).toHaveLength(0);
    });

    it('应该检测空边', () => {
      const errors = validateEdgeData(null);
      expect(errors).toContain('边数据不能为空');
    });

    it('应该检测缺少源节点', () => {
      const errors = validateEdgeData({ target: 'Node_2', type: 'rel' });
      expect(errors).toContain('边的源节点不能为空');
    });

    it('应该检测缺少目标节点', () => {
      const errors = validateEdgeData({ source: 'Node_1', type: 'rel' });
      expect(errors).toContain('边的目标节点不能为空');
    });

    it('应该检测缺少类型', () => {
      const errors = validateEdgeData({ source: 'Node_1', target: 'Node_2' });
      expect(errors).toContain('边类型不能为空');
    });
  });
});
