/**
 * Schema 验证工具函数单元测试
 */
import {
  isValidEntityTypeCode,
  isValidEntityTypeLabel,
  isValidColor,
  isValidPropertyName,
  isValidPropertyType,
  validateProperty,
  validateEntityType,
  validateRelationType,
  validateSchema,
  analyzeSchemaChange
} from '../schemaValidators';

describe('Schema 验证工具函数', () => {
  describe('isValidEntityTypeCode', () => {
    it('应该验证有效的类型代码', () => {
      expect(isValidEntityTypeCode('Epic')).toBe(true);
      expect(isValidEntityTypeCode('Feature')).toBe(true);
      expect(isValidEntityTypeCode('UserStory')).toBe(true);
      expect(isValidEntityTypeCode('Test_123')).toBe(true);
    });

    it('应该拒绝小写字母开头', () => {
      expect(isValidEntityTypeCode('epic')).toBe(false);
      expect(isValidEntityTypeCode('feature')).toBe(false);
    });

    it('应该拒绝数字开头', () => {
      expect(isValidEntityTypeCode('1Epic')).toBe(false);
      expect(isValidEntityTypeCode('123')).toBe(false);
    });

    it('应该拒绝包含特殊字符', () => {
      expect(isValidEntityTypeCode('Epic-Test')).toBe(false);
      expect(isValidEntityTypeCode('Epic Test')).toBe(false);
      expect(isValidEntityTypeCode('Epic@Test')).toBe(false);
    });

    it('应该拒绝空值', () => {
      expect(isValidEntityTypeCode('')).toBe(false);
      expect(isValidEntityTypeCode(null)).toBe(false);
      expect(isValidEntityTypeCode(undefined)).toBe(false);
    });

    it('应该拒绝非字符串', () => {
      expect(isValidEntityTypeCode(123)).toBe(false);
      expect(isValidEntityTypeCode({})).toBe(false);
    });
  });

  describe('isValidEntityTypeLabel', () => {
    it('应该验证有效的标签', () => {
      expect(isValidEntityTypeLabel('史诗')).toBe(true);
      expect(isValidEntityTypeLabel('Feature')).toBe(true);
      expect(isValidEntityTypeLabel('A')).toBe(true);
    });

    it('应该拒绝空值', () => {
      expect(isValidEntityTypeLabel('')).toBe(false);
      expect(isValidEntityTypeLabel(null)).toBe(false);
      expect(isValidEntityTypeLabel(undefined)).toBe(false);
    });

    it('应该拒绝空白字符串', () => {
      expect(isValidEntityTypeLabel('   ')).toBe(false);
      expect(isValidEntityTypeLabel('\t')).toBe(false);
    });

    it('应该拒绝过长的标签', () => {
      expect(isValidEntityTypeLabel('A'.repeat(51))).toBe(false);
      expect(isValidEntityTypeLabel('A'.repeat(50))).toBe(true);
    });

    it('应该拒绝非字符串', () => {
      expect(isValidEntityTypeLabel(123)).toBe(false);
      expect(isValidEntityTypeLabel([])).toBe(false);
    });
  });

  describe('isValidColor', () => {
    it('应该验证有效的6位十六进制颜色', () => {
      expect(isValidColor('#1890ff')).toBe(true);
      expect(isValidColor('#FFFFFF')).toBe(true);
      expect(isValidColor('#000000')).toBe(true);
    });

    it('应该验证有效的3位十六进制颜色', () => {
      expect(isValidColor('#FFF')).toBe(true);
      expect(isValidColor('#abc')).toBe(true);
      expect(isValidColor('#123')).toBe(true);
    });

    it('应该拒绝缺少#号', () => {
      expect(isValidColor('1890ff')).toBe(false);
      expect(isValidColor('FFF')).toBe(false);
    });

    it('应该拒绝无效长度', () => {
      expect(isValidColor('#1890')).toBe(false);
      expect(isValidColor('#1890ffa')).toBe(false);
      expect(isValidColor('#18')).toBe(false);
    });

    it('应该拒绝无效字符', () => {
      expect(isValidColor('#GGGGGG')).toBe(false);
      expect(isValidColor('#1890fg')).toBe(false);
    });

    it('应该拒绝空值', () => {
      expect(isValidColor('')).toBe(false);
      expect(isValidColor(null)).toBe(false);
    });
  });

  describe('isValidPropertyName', () => {
    it('应该验证有效的属性名', () => {
      expect(isValidPropertyName('name')).toBe(true);
      expect(isValidPropertyName('priority')).toBe(true);
      expect(isValidPropertyName('createdAt')).toBe(true);
      expect(isValidPropertyName('test_123')).toBe(true);
    });

    it('应该拒绝大写字母开头', () => {
      expect(isValidPropertyName('Name')).toBe(false);
      expect(isValidPropertyName('Priority')).toBe(false);
    });

    it('应该拒绝数字开头', () => {
      expect(isValidPropertyName('123')).toBe(false);
      expect(isValidPropertyName('1name')).toBe(false);
    });

    it('应该拒绝包含特殊字符', () => {
      expect(isValidPropertyName('name-test')).toBe(false);
      expect(isValidPropertyName('name.test')).toBe(false);
    });

    it('应该拒绝空值', () => {
      expect(isValidPropertyName('')).toBe(false);
      expect(isValidPropertyName(null)).toBe(false);
    });
  });

  describe('isValidPropertyType', () => {
    it('应该验证有效的属性类型（小写）', () => {
      expect(isValidPropertyType('string')).toBe(true);
      expect(isValidPropertyType('number')).toBe(true);
      expect(isValidPropertyType('boolean')).toBe(true);
      expect(isValidPropertyType('date')).toBe(true);
      expect(isValidPropertyType('array')).toBe(true);
      expect(isValidPropertyType('object')).toBe(true);
    });

    it('应该验证有效的属性类型（大写）', () => {
      expect(isValidPropertyType('String')).toBe(true);
      expect(isValidPropertyType('Integer')).toBe(true);
      expect(isValidPropertyType('Float')).toBe(true);
      expect(isValidPropertyType('Date')).toBe(true);
      expect(isValidPropertyType('DateTime')).toBe(true);
      expect(isValidPropertyType('Text')).toBe(true);
      expect(isValidPropertyType('Enum')).toBe(true);
      expect(isValidPropertyType('Reference')).toBe(true);
    });

    it('应该拒绝无效的类型', () => {
      expect(isValidPropertyType('invalid')).toBe(false);
      expect(isValidPropertyType('varchar')).toBe(false);
      expect(isValidPropertyType('')).toBe(false);
      expect(isValidPropertyType(null)).toBe(false);
    });
  });

  describe('validateProperty', () => {
    it('应该验证有效属性', () => {
      const prop = { name: 'name', type: 'string' };
      const errors = validateProperty(prop);
      expect(errors).toHaveLength(0);
    });

    it('应该验证有效属性（大写类型）', () => {
      const prop = { name: 'id', type: 'String' };
      const errors = validateProperty(prop);
      expect(errors).toHaveLength(0);
    });

    it('应该验证扩展类型', () => {
      const extendedTypes = ['Integer', 'Float', 'DateTime', 'Text', 'Enum', 'Reference'];
      extendedTypes.forEach(type => {
        const prop = { name: 'test', type };
        const errors = validateProperty(prop);
        expect(errors).toHaveLength(0);
      });
    });

    it('应该检测空属性', () => {
      const errors = validateProperty(null);
      expect(errors).toContain('属性定义不能为空');
    });

    it('应该检测无效的属性名', () => {
      const prop = { name: 'Name', type: 'string' };
      const errors = validateProperty(prop);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('应该检测缺少类型', () => {
      const prop = { name: 'name' };
      const errors = validateProperty(prop);
      expect(errors).toContain('属性类型不能为空');
    });

    it('应该检测无效的类型', () => {
      const prop = { name: 'name', type: 'invalid' };
      const errors = validateProperty(prop);
      expect(errors.some(e => e.includes('无效') && e.includes('invalid'))).toBe(true);
    });

    it('应该接受所有有效类型', () => {
      const validTypes = ['string', 'number', 'boolean', 'date', 'array', 'object'];
      validTypes.forEach(type => {
        const prop = { name: 'test', type };
        const errors = validateProperty(prop);
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('validateEntityType', () => {
    const existingTypes = {
      Epic: { label: '史诗' },
      Feature: { label: '特性' }
    };

    it('应该验证有效实体类型', () => {
      const entity = {
        code: 'Task',
        label: '任务',
        description: '工作项'
      };
      const errors = validateEntityType(entity, existingTypes);
      expect(errors).toHaveLength(0);
    });

    it('应该检测空实体', () => {
      const errors = validateEntityType(null);
      expect(errors).toContain('实体类型不能为空');
    });

    it('应该检测缺少代码', () => {
      const entity = { label: '任务' };
      const errors = validateEntityType(entity);
      expect(errors).toContain('类型代码不能为空');
    });

    it('应该检测无效代码', () => {
      const entity = { code: 'task', label: '任务' };
      const errors = validateEntityType(entity);
      expect(errors.some(e => e.includes('类型代码无效'))).toBe(true);
    });

    it('应该检测重复代码', () => {
      const entity = { code: 'Epic', label: '新史诗' };
      const errors = validateEntityType(entity, existingTypes);
      expect(errors).toContain('类型代码 "Epic" 已存在');
    });

    it('应该检测缺少标签', () => {
      const entity = { code: 'Task' };
      const errors = validateEntityType(entity);
      expect(errors).toContain('显示名称不能为空');
    });

    it('应该检测无效标签（超过50字符）', () => {
      const entity = { 
        code: 'Task', 
        label: 'A'.repeat(51)
      };
      const errors = validateEntityType(entity);
      expect(errors.some(e => e.includes('显示名称无效'))).toBe(true);
    });

    it('应该检测无效颜色', () => {
      const entity = {
        code: 'Task',
        label: '任务',
        color: 'red'
      };
      const errors = validateEntityType(entity);
      expect(errors.some(e => e.includes('颜色格式无效'))).toBe(true);
    });

    it('应该验证属性列表', () => {
      const entity = {
        code: 'Task',
        label: '任务',
        properties: {
          'Name': { type: 'string' } // 无效属性名
        }
      };
      const errors = validateEntityType(entity);
      expect(errors.some(e => e.includes('属性'))).toBe(true);
    });
  });

  describe('validateRelationType', () => {
    const existingTypes = {
      relates_to: { label: '关联' }
    };

    it('应该验证有效关系类型', () => {
      const relation = {
        id: 'depends_on',
        label: '依赖',
        from: ['Epic'],
        to: ['Feature']
      };
      const errors = validateRelationType(relation, existingTypes);
      expect(errors).toHaveLength(0);
    });

    it('应该检测空关系', () => {
      const errors = validateRelationType(null);
      expect(errors).toContain('关系类型不能为空');
    });

    it('应该检测缺少ID', () => {
      const relation = {
        label: '依赖',
        from: ['Epic'],
        to: ['Feature']
      };
      const errors = validateRelationType(relation);
      expect(errors).toContain('关系类型ID不能为空');
    });

    it('应该检测无效ID格式', () => {
      const relation = {
        id: 'DependsOn',
        label: '依赖',
        from: ['Epic'],
        to: ['Feature']
      };
      const errors = validateRelationType(relation);
      expect(errors.some(e => e.includes('关系类型ID无效'))).toBe(true);
    });

    it('应该检测重复ID', () => {
      const relation = {
        id: 'relates_to',
        label: '关联',
        from: ['Epic'],
        to: ['Feature']
      };
      const errors = validateRelationType(relation, existingTypes);
      expect(errors).toContain('关系类型 "relates_to" 已存在');
    });

    it('应该检测缺少标签', () => {
      const relation = {
        id: 'depends_on',
        from: ['Epic'],
        to: ['Feature']
      };
      const errors = validateRelationType(relation);
      expect(errors).toContain('关系标签不能为空');
    });

    it('应该检测无效标签（空白字符串）', () => {
      const relation = {
        id: 'depends_on',
        label: '   ',
        from: ['Epic'],
        to: ['Feature']
      };
      const errors = validateRelationType(relation);
      expect(errors).toContain('关系标签无效');
    });

    it('应该检测缺少源类型', () => {
      const relation = {
        id: 'depends_on',
        label: '依赖',
        to: ['Feature']
      };
      const errors = validateRelationType(relation);
      expect(errors).toContain('源类型不能为空');
    });

    it('应该检测空源类型数组', () => {
      const relation = {
        id: 'depends_on',
        label: '依赖',
        from: [],
        to: ['Feature']
      };
      const errors = validateRelationType(relation);
      expect(errors).toContain('源类型不能为空');
    });

    it('应该检测缺少目标类型', () => {
      const relation = {
        id: 'depends_on',
        label: '依赖',
        from: ['Epic']
      };
      const errors = validateRelationType(relation);
      expect(errors).toContain('目标类型不能为空');
    });
  });

  describe('validateSchema', () => {
    it('应该验证有效Schema', () => {
      const schema = {
        version: '1.0.0',
        entityTypes: {
          Epic: {
            label: '史诗',
            properties: {}
          }
        },
        relationTypes: {
          relates_to: {
            label: '关联',
            from: ['Epic'],
            to: ['Epic']
          }
        }
      };
      const result = validateSchema(schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测空Schema', () => {
      const result = validateSchema(null);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message === 'Schema 不能为空')).toBe(true);
    });

    it('应该检测缺少实体类型', () => {
      const schema = {
        version: '1.0.0',
        entityTypes: {}
      };
      const result = validateSchema(schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message === 'Schema 必须至少包含一个实体类型')).toBe(true);
    });

    it('应该警告缺少版本号', () => {
      const schema = {
        entityTypes: {
          Epic: { label: '史诗' }
        }
      };
      const result = validateSchema(schema);
      expect(result.warnings.some(e => e.message === 'Schema 缺少版本号')).toBe(true);
    });

    it('应该检测关系引用不存在的源实体', () => {
      const schema = {
        version: '1.0.0',
        entityTypes: {
          Epic: { label: '史诗' }
        },
        relationTypes: {
          relates_to: {
            label: '关联',
            from: ['NonExistent'],
            to: ['Epic']
          }
        }
      };
      const result = validateSchema(schema);
      expect(result.errors.some(e => e.message && e.message.includes('不存在的源类型'))).toBe(true);
    });

    it('应该检测关系引用不存在的目标实体', () => {
      const schema = {
        version: '1.0.0',
        entityTypes: {
          Epic: { label: '史诗' }
        },
        relationTypes: {
          relates_to: {
            label: '关联',
            from: ['Epic'],
            to: ['NonExistent']
          }
        }
      };
      const result = validateSchema(schema);
      expect(result.errors.some(e => e.message && e.message.includes('不存在的目标类型'))).toBe(true);
    });

    it('应该警告孤立的实体类型', () => {
      const schema = {
        version: '1.0.0',
        entityTypes: {
          Epic: { label: '史诗' },
          Feature: { label: '特性' }
        },
        relationTypes: {
          relates_to: {
            label: '关联',
            from: ['Epic'],
            to: ['Epic']
          }
        }
      };
      const result = validateSchema(schema);
      expect(result.warnings.some(e => e.code === 'Feature')).toBe(true);
    });

    it('应该检测多个验证错误', () => {
      const schema = {
        entityTypes: {
          epic: { label: '史诗' }, // 无效代码
          Invalid: { label: '' } // 无效标签
        }
      };
      const result = validateSchema(schema);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('analyzeSchemaChange', () => {
    it('应该检测删除的实体类型', () => {
      const oldSchema = {
        entityTypes: { Epic: {}, Feature: {} }
      };
      const newSchema = {
        entityTypes: { Epic: {} }
      };
      const impact = analyzeSchemaChange(oldSchema, newSchema);
      expect(impact.breaking.some(i => i.type === 'entity_removed')).toBe(true);
    });

    it('应该检测删除的属性', () => {
      const oldSchema = {
        entityTypes: {
          Epic: {
            properties: { name: {}, priority: {} }
          }
        }
      };
      const newSchema = {
        entityTypes: {
          Epic: {
            properties: { name: {} }
          }
        }
      };
      const impact = analyzeSchemaChange(oldSchema, newSchema);
      expect(impact.breaking.some(i => i.type === 'property_removed')).toBe(true);
    });

    it('应该检测新增的属性', () => {
      const oldSchema = {
        entityTypes: {
          Epic: {
            properties: { name: {} }
          }
        }
      };
      const newSchema = {
        entityTypes: {
          Epic: {
            properties: { name: {}, priority: {} }
          }
        }
      };
      const impact = analyzeSchemaChange(oldSchema, newSchema);
      expect(impact.nonBreaking.some(i => i.type === 'property_added')).toBe(true);
    });

    it('应该检测删除的关系类型', () => {
      const oldSchema = {
        entityTypes: { Epic: {} },
        relationTypes: { relates_to: {} }
      };
      const newSchema = {
        entityTypes: { Epic: {} },
        relationTypes: {}
      };
      const impact = analyzeSchemaChange(oldSchema, newSchema);
      expect(impact.breaking.some(i => i.type === 'relation_removed')).toBe(true);
    });

    it('应该处理空Schema', () => {
      const impact = analyzeSchemaChange(null, {});
      expect(impact.breaking).toHaveLength(0);
      expect(impact.nonBreaking).toHaveLength(0);
    });
  });
});
