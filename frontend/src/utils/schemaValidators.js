/**
 * Schema 验证工具函数
 * 用于验证 Schema 编辑器中的实体类型和关系类型
 */

/**
 * 验证实体类型代码
 * @param {string} code - 实体类型代码
 * @returns {boolean} 是否有效
 */
export const isValidEntityTypeCode = (code) => {
  if (!code) return false;
  if (typeof code !== 'string') return false;
  // 代码格式：以大写字母开头，只能包含字母、数字和下划线
  const pattern = /^[A-Z][A-Za-z0-9_]*$/;
  return pattern.test(code);
};

/**
 * 验证实体类型标签
 * @param {string} label - 实体类型标签
 * @returns {boolean} 是否有效
 */
export const isValidEntityTypeLabel = (label) => {
  if (!label) return false;
  if (typeof label !== 'string') return false;
  if (label.trim().length === 0) return false;
  if (label.length > 50) return false;
  return true;
};

/**
 * 验证颜色值
 * @param {string} color - 颜色值（十六进制）
 * @returns {boolean} 是否有效
 */
export const isValidColor = (color) => {
  if (!color) return false;
  if (typeof color !== 'string') return false;
  // 支持 #RGB 或 #RRGGBB 格式
  const pattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return pattern.test(color);
};

/**
 * 验证属性名
 * @param {string} name - 属性名
 * @returns {boolean} 是否有效
 */
export const isValidPropertyName = (name) => {
  if (!name) return false;
  if (typeof name !== 'string') return false;
  // 属性名：小写字母开头，只能包含字母、数字和下划线
  const pattern = /^[a-z][a-zA-Z0-9_]*$/;
  return pattern.test(name);
};

/**
 * 有效的属性类型列表（支持大小写）
 */
export const VALID_PROPERTY_TYPES = [
  // 基础类型
  'string', 'String',
  'number', 'Number', 
  'integer', 'Integer',
  'float', 'Float',
  'boolean', 'Boolean',
  'date', 'Date',
  'datetime', 'DateTime',
  'array', 'Array',
  'object', 'Object',
  // 扩展类型
  'text', 'Text',
  'enum', 'Enum',
  'reference', 'Reference',
  'json', 'JSON'
];

/**
 * 验证属性类型是否有效
 * @param {string} type - 属性类型
 * @returns {boolean} 是否有效
 */
export const isValidPropertyType = (type) => {
  if (!type) return false;
  return VALID_PROPERTY_TYPES.includes(type);
};

/**
 * 验证属性定义
 * @param {Object} property - 属性定义
 * @returns {string[]} 错误列表
 */
export const validateProperty = (property) => {
  const errors = [];
  
  if (!property) {
    errors.push('属性定义不能为空');
    return errors;
  }
  
  if (!property.name || !isValidPropertyName(property.name)) {
    errors.push('属性名无效：必须以小写字母开头，只能包含字母、数字和下划线');
  }
  
  if (!property.type) {
    errors.push('属性类型不能为空');
  }
  
  if (property.type && !isValidPropertyType(property.type)) {
    const baseTypes = ['string', 'number', 'integer', 'float', 'boolean', 'date', 'datetime', 'array', 'object', 'text', 'enum', 'reference'];
    errors.push(`属性类型 "${property.type}" 无效：必须是以下类型之一：${baseTypes.join(', ')}`);
  }
  
  return errors;
};

/**
 * 验证实体类型定义
 * @param {Object} entityType - 实体类型定义
 * @param {Object} existingTypes - 现有实体类型（用于检查重复）
 * @returns {string[]} 错误列表
 */
export const validateEntityType = (entityType, existingTypes = {}) => {
  const errors = [];
  
  if (!entityType) {
    errors.push('实体类型不能为空');
    return errors;
  }
  
  // 验证代码
  if (!entityType.code) {
    errors.push('类型代码不能为空');
  } else if (!isValidEntityTypeCode(entityType.code)) {
    errors.push('类型代码无效：必须以大写字母开头，只能包含字母、数字和下划线');
  }
  
  // 检查代码是否已存在
  if (existingTypes && entityType.code && existingTypes[entityType.code]) {
    errors.push(`类型代码 "${entityType.code}" 已存在`);
  }
  
  // 验证标签
  if (!entityType.label) {
    errors.push('显示名称不能为空');
  } else if (!isValidEntityTypeLabel(entityType.label)) {
    errors.push('显示名称无效：不能为空，最多50个字符');
  }
  
  // 验证颜色
  if (entityType.color && !isValidColor(entityType.color)) {
    errors.push('颜色格式无效：必须是 #RGB 或 #RRGGBB 格式');
  }
  
  // 验证属性
  if (entityType.properties) {
    Object.entries(entityType.properties).forEach(([name, prop]) => {
      const propErrors = validateProperty({ name, ...prop });
      errors.push(...propErrors.map(e => `属性 "${name}": ${e}`));
    });
  }
  
  return errors;
};

/**
 * 验证关系类型定义
 * @param {Object} relationType - 关系类型定义
 * @param {Object} existingTypes - 现有关系类型（用于检查重复）
 * @returns {string[]} 错误列表
 */
export const validateRelationType = (relationType, existingTypes = {}) => {
  const errors = [];
  
  if (!relationType) {
    errors.push('关系类型不能为空');
    return errors;
  }
  
  // 验证ID
  if (!relationType.id) {
    errors.push('关系类型ID不能为空');
  } else if (!/^[a-z][a-z0-9_]*$/.test(relationType.id)) {
    errors.push('关系类型ID无效：必须以小写字母开头，只能包含小写字母、数字和下划线');
  }
  
  // 检查ID是否已存在
  if (existingTypes && relationType.id && existingTypes[relationType.id]) {
    errors.push(`关系类型 "${relationType.id}" 已存在`);
  }
  
  // 验证标签
  if (!relationType.label) {
    errors.push('关系标签不能为空');
  } else if (typeof relationType.label !== 'string' || relationType.label.trim().length === 0) {
    errors.push('关系标签无效');
  }
  
  // 验证源类型
  if (!relationType.from || !Array.isArray(relationType.from) || relationType.from.length === 0) {
    errors.push('源类型不能为空');
  }
  
  // 验证目标类型
  if (!relationType.to || !Array.isArray(relationType.to) || relationType.to.length === 0) {
    errors.push('目标类型不能为空');
  }
  
  return errors;
};

/**
 * 验证整个 Schema
 * @param {Object} schema - Schema 定义
 * @returns {Object} 验证结果 { isValid: boolean, errors: Object[], warnings: Object[] }
 */
export const validateSchema = (schema) => {
  const errors = [];
  const warnings = [];
  
  if (!schema) {
    errors.push({
      type: 'schema',
      message: 'Schema 不能为空',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }
  
  // 验证版本
  if (!schema.version) {
    warnings.push({
      type: 'schema',
      field: 'version',
      message: 'Schema 缺少版本号',
      severity: 'warning',
      description: '建议添加版本号以便进行版本管理'
    });
  }
  
  // 验证实体类型
  if (!schema.entityTypes || Object.keys(schema.entityTypes).length === 0) {
    errors.push({
      type: 'schema',
      message: 'Schema 必须至少包含一个实体类型',
      severity: 'error',
      description: 'Schema 定义中需要至少定义一个实体类型才能构成有效图谱'
    });
  } else {
    Object.entries(schema.entityTypes).forEach(([code, entityType]) => {
      // 验证时，排除自身避免误判为重复
      const otherTypes = { ...schema.entityTypes };
      delete otherTypes[code];
      const entityErrors = validateEntityType(
        { code, ...entityType },
        otherTypes
      );
      
      // 将字符串错误转换为结构化对象
      entityErrors.forEach(errMsg => {
        let field = 'general';
        if (errMsg.includes('代码')) field = 'code';
        if (errMsg.includes('名称') || errMsg.includes('标签')) field = 'label';
        if (errMsg.includes('颜色')) field = 'color';
        if (errMsg.includes('属性')) field = 'properties';
        
        errors.push({
          type: 'entity',
          code,
          field,
          message: errMsg,
          severity: 'error',
          description: `实体类型 "${code}" 的定义存在问题`
        });
      });
    });
  }
  
  // 验证关系类型
  if (schema.relationTypes) {
    Object.entries(schema.relationTypes).forEach(([id, relationType]) => {
      // 验证时，排除自身避免误判为重复
      const otherTypes = { ...schema.relationTypes };
      delete otherTypes[id];
      const relationErrors = validateRelationType(
        { id, ...relationType },
        otherTypes
      );
      
      // 将字符串错误转换为结构化对象
      relationErrors.forEach(errMsg => {
        let field = 'general';
        if (errMsg.includes('ID')) field = 'id';
        if (errMsg.includes('标签')) field = 'label';
        if (errMsg.includes('源')) field = 'from';
        if (errMsg.includes('目标')) field = 'to';
        
        errors.push({
          type: 'relation',
          id,
          field,
          message: errMsg,
          severity: 'error',
          description: `关系类型 "${id}" 的定义存在问题`
        });
      });
      
      // 验证关系引用的实体类型是否存在
      if (relationType.from && Array.isArray(relationType.from)) {
        relationType.from.forEach(fromType => {
          if (!schema.entityTypes || !schema.entityTypes[fromType]) {
            errors.push({
              type: 'relation',
              id,
              field: 'from',
              from: fromType,
              message: `关系 "${id}" 引用了不存在的源类型 "${fromType}"`,
              severity: 'error',
              description: `请先创建实体类型 "${fromType}" 或修改关系的源类型设置`
            });
          }
        });
      }
      
      if (relationType.to && Array.isArray(relationType.to)) {
        relationType.to.forEach(toType => {
          if (!schema.entityTypes || !schema.entityTypes[toType]) {
            errors.push({
              type: 'relation',
              id,
              field: 'to',
              to: toType,
              message: `关系 "${id}" 引用了不存在的目标类型 "${toType}"`,
              severity: 'error',
              description: `请先创建实体类型 "${toType}" 或修改关系的目标类型设置`
            });
          }
        });
      }
    });
  }
  
  // 检查孤立的实体类型（没有关系的实体）
  if (schema.entityTypes && schema.relationTypes) {
    const connectedTypes = new Set();
    Object.values(schema.relationTypes).forEach(rel => {
      if (rel.from) rel.from.forEach(t => connectedTypes.add(t));
      if (rel.to) rel.to.forEach(t => connectedTypes.add(t));
    });
    
    Object.keys(schema.entityTypes).forEach(code => {
      if (!connectedTypes.has(code)) {
        warnings.push({
          type: 'entity',
          code,
          message: `实体类型 "${code}" 没有关联的关系类型`,
          severity: 'warning',
          description: '孤立的实体类型无法通过关系与其他实体连接',
          fixable: true
        });
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 检查 Schema 变更的影响
 * @param {Object} oldSchema - 原始 Schema
 * @param {Object} newSchema - 新 Schema
 * @returns {Object} 影响分析结果
 */
export const analyzeSchemaChange = (oldSchema, newSchema) => {
  const impact = {
    breaking: [],
    nonBreaking: [],
    affectedNodes: 0
  };
  
  if (!oldSchema || !newSchema) {
    return impact;
  }
  
  // 检查删除的实体类型
  const oldEntityCodes = Object.keys(oldSchema.entityTypes || {});
  const newEntityCodes = Object.keys(newSchema.entityTypes || {});
  
  oldEntityCodes.forEach(code => {
    if (!newEntityCodes.includes(code)) {
      impact.breaking.push({
        type: 'entity_removed',
        code,
        message: `实体类型 "${code}" 被删除，相关节点将失效`
      });
    }
  });
  
  // 检查修改的实体类型
  newEntityCodes.forEach(code => {
    if (oldSchema.entityTypes[code]) {
      const oldProps = Object.keys(oldSchema.entityTypes[code].properties || {});
      const newProps = Object.keys(newSchema.entityTypes[code].properties || {});
      
      // 检查删除的属性
      oldProps.forEach(prop => {
        if (!newProps.includes(prop)) {
          impact.breaking.push({
            type: 'property_removed',
            entity: code,
            property: prop,
            message: `实体类型 "${code}" 的属性 "${prop}" 被删除`
          });
        }
      });
      
      // 检查新增的属性
      newProps.forEach(prop => {
        if (!oldProps.includes(prop)) {
          impact.nonBreaking.push({
            type: 'property_added',
            entity: code,
            property: prop,
            message: `实体类型 "${code}" 新增属性 "${prop}"`
          });
        }
      });
    }
  });
  
  // 检查删除的关系类型
  const oldRelationIds = Object.keys(oldSchema.relationTypes || {});
  const newRelationIds = Object.keys(newSchema.relationTypes || {});
  
  oldRelationIds.forEach(id => {
    if (!newRelationIds.includes(id)) {
      impact.breaking.push({
        type: 'relation_removed',
        id,
        message: `关系类型 "${id}" 被删除，相关边将失效`
      });
    }
  });
  
  return impact;
};
