/**
 * OAG 实例化服务单元测试
 */
const OAGInstantiationService = require('../OAGInstantiationService');

describe('OAGInstantiationService', () => {
  describe('createFromSchema', () => {
    it('should create OAG from schema successfully', async () => {
      const mockSchema = {
        version: '2.0.0',
        name: 'Test Schema',
        entityTypes: { Vehicle: {}, Component: {} },
        relationTypes: { hasPart: {} }
      };

      OAGInstantiationService.loadSchema = jest.fn().mockResolvedValue(mockSchema);
      OAGInstantiationService.saveOAG = jest.fn().mockResolvedValue();

      const result = await OAGInstantiationService.createFromSchema('test-schema', {
        name: 'Test OAG'
      });

      expect(result).toHaveProperty('id');
      expect(result.schemaId).toBe('test-schema');
      expect(result.name).toBe('Test OAG');
    });

    it('should throw error when schema not found', async () => {
      OAGInstantiationService.loadSchema = jest.fn().mockResolvedValue(null);

      await expect(
        OAGInstantiationService.createFromSchema('non-existent')
      ).rejects.toThrow('Schema not found');
    });
  });

  describe('generateFromTemplate', () => {
    it('should throw error for invalid template', async () => {
      await expect(
        OAGInstantiationService.generateFromTemplate('invalid-template')
      ).rejects.toThrow('Template not found');
    });
  });

  describe('Security', () => {
    it('should validate ID format', () => {
      // Test ID validation
      expect(OAGInstantiationService.isValidId?.('valid-id-123')).toBe(true);
      expect(OAGInstantiationService.isValidId?.('../etc/passwd')).toBe(false);
    });
  });
});
