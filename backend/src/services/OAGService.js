const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * OAG (Ontology Asset Graph) 服务
 * 负责基于 Schema 创建和管理 OAG 实例
 */
class OAGService {
  constructor() {
    this.oagDir = path.join(__dirname, '../../../data/oag');
    this.templatesDir = path.join(__dirname, '../../../data/oag-templates');
    this.schemaDir = path.join(__dirname, '../../../data/schemaVersions');
    
    // 确保目录存在
    this.ensureDirectories();
  }

  /**
   * 确保必要的目录存在
   */
  ensureDirectories() {
    [this.oagDir, this.templatesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ 创建目录: ${dir}`);
      }
    });
  }

  /**
   * 获取所有 OAG 实例列表
   */
  getOAGList() {
    try {
      const files = fs.readdirSync(this.oagDir);
      const oags = files
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const content = JSON.parse(fs.readFileSync(path.join(this.oagDir, f), 'utf8'));
          return {
            id: content.id,
            name: content.name,
            description: content.description,
            schemaId: content.schemaId,
            schemaVersion: content.schemaVersion,
            createdAt: content.createdAt,
            updatedAt: content.updatedAt,
            nodeCount: content.nodes?.length || 0,
            edgeCount: content.edges?.length || 0,
            status: content.status || 'active'
          };
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      return oags;
    } catch (error) {
      console.error('❌ 获取 OAG 列表失败:', error);
      return [];
    }
  }

  /**
   * 根据 ID 获取 OAG 详情
   */
  getOAGById(oagId) {
    try {
      const filePath = path.join(this.oagDir, `${oagId}.json`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`OAG 不存在: ${oagId}`);
      }
      
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return content;
    } catch (error) {
      throw new Error(`获取 OAG 失败: ${error.message}`);
    }
  }

  /**
   * 基于 Schema 创建空白 OAG 实例
   */
  createOAGFromSchema(schemaId, config) {
    try {
      // 加载 Schema
      const schema = this.loadSchema(schemaId);
      if (!schema) {
        throw new Error(`Schema 不存在: ${schemaId}`);
      }

      const oagId = uuidv4();
      const now = new Date().toISOString();
      
      const oag = {
        id: oagId,
        name: config.name || `OAG-${Date.now()}`,
        description: config.description || '',
        schemaId: schemaId,
        schemaVersion: schema.version || '1.0.0',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        metadata: {
          createdBy: config.createdBy || 'system',
          domain: config.domain || schema.domain || 'general',
          tags: config.tags || []
        },
        // 基于 Schema 初始化结构
        nodes: [],
        edges: [],
        schemaSnapshot: {
          entityTypes: schema.entityTypes || {},
          relationTypes: schema.relationTypes || {}
        },
        statistics: {
          totalNodes: 0,
          totalEdges: 0,
          entityTypeCounts: {},
          relationTypeCounts: {}
        }
      };

      // 如果配置了预填充示例数据
      if (config.populateExamples) {
        this.populateExampleData(oag, schema);
      }

      // 保存 OAG
      this.saveOAG(oag);
      
      console.log(`✅ OAG 创建成功: ${oag.name} (${oagId})`);
      return oag;
    } catch (error) {
      console.error('❌ 创建 OAG 失败:', error);
      throw error;
    }
  }

  /**
   * 基于模板生成 OAG
   */
  generateOAGFromTemplate(templateId, params) {
    try {
      const template = this.loadTemplate(templateId);
      if (!template) {
        throw new Error(`模板不存在: ${templateId}`);
      }

      const oagId = uuidv4();
      const now = new Date().toISOString();
      
      // 使用模板创建 OAG
      const oag = {
        id: oagId,
        name: params.name || template.name,
        description: params.description || template.description,
        schemaId: template.schemaId,
        schemaVersion: template.schemaVersion,
        templateId: templateId,
        createdAt: now,
        updatedAt: now,
        status: 'active',
        metadata: {
          createdBy: params.createdBy || 'system',
          domain: template.domain,
          tags: template.tags || []
        },
        // 从模板复制并应用参数
        nodes: this.applyTemplateParams(template.nodes, params),
        edges: this.applyTemplateParams(template.edges, params),
        schemaSnapshot: template.schemaSnapshot,
        statistics: this.calculateStatistics(template.nodes, template.edges)
      };

      this.saveOAG(oag);
      
      console.log(`✅ 从模板生成 OAG 成功: ${oag.name} (${oagId})`);
      return oag;
    } catch (error) {
      console.error('❌ 从模板生成 OAG 失败:', error);
      throw error;
    }
  }

  /**
   * 批量实例化 - 根据数据生成 OAG
   */
  batchInstantiate(schemaId, dataSource, mappingConfig) {
    try {
      const schema = this.loadSchema(schemaId);
      if (!schema) {
        throw new Error(`Schema 不存在: ${schemaId}`);
      }

      const oagId = uuidv4();
      const now = new Date().toISOString();
      
      const oag = {
        id: oagId,
        name: dataSource.name || `OAG-Batch-${Date.now()}`,
        description: dataSource.description || '批量实例化生成',
        schemaId: schemaId,
        schemaVersion: schema.version || '1.0.0',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        metadata: {
          createdBy: 'batch-instantiate',
          source: dataSource.type,
          mappingConfig: mappingConfig
        },
        nodes: [],
        edges: [],
        schemaSnapshot: {
          entityTypes: schema.entityTypes || {},
          relationTypes: schema.relationTypes || {}
        },
        statistics: {
          totalNodes: 0,
          totalEdges: 0,
          entityTypeCounts: {},
          relationTypeCounts: {}
        }
      };

      // 根据数据源类型处理数据
      switch (dataSource.type) {
        case 'json':
          this.processJSONData(oag, dataSource.data, mappingConfig);
          break;
        case 'csv':
          this.processCSVData(oag, dataSource.data, mappingConfig);
          break;
        case 'excel':
          this.processExcelData(oag, dataSource.data, mappingConfig);
          break;
        default:
          throw new Error(`不支持的数据源类型: ${dataSource.type}`);
      }

      // 计算统计信息
      oag.statistics = this.calculateStatistics(oag.nodes, oag.edges);
      
      this.saveOAG(oag);
      
      console.log(`✅ 批量实例化 OAG 成功: ${oag.name} (${oagId})`);
      return oag;
    } catch (error) {
      console.error('❌ 批量实例化 OAG 失败:', error);
      throw error;
    }
  }

  /**
   * 更新 OAG
   */
  updateOAG(oagId, updates) {
    try {
      const oag = this.getOAGById(oagId);
      
      // 不允许修改的关键字段
      delete updates.id;
      delete updates.createdAt;
      delete updates.schemaSnapshot;
      
      // 应用更新
      Object.assign(oag, updates, {
        updatedAt: new Date().toISOString()
      });
      
      // 重新计算统计
      oag.statistics = this.calculateStatistics(oag.nodes, oag.edges);
      
      this.saveOAG(oag);
      
      console.log(`✅ OAG 更新成功: ${oagId}`);
      return oag;
    } catch (error) {
      console.error('❌ 更新 OAG 失败:', error);
      throw error;
    }
  }

  /**
   * 删除 OAG
   */
  deleteOAG(oagId) {
    try {
      const filePath = path.join(this.oagDir, `${oagId}.json`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`OAG 不存在: ${oagId}`);
      }
      
      // 可以改为移动到回收站而不是直接删除
      fs.unlinkSync(filePath);
      
      console.log(`✅ OAG 删除成功: ${oagId}`);
      return { id: oagId, deleted: true };
    } catch (error) {
      console.error('❌ 删除 OAG 失败:', error);
      throw error;
    }
  }

  /**
   * 验证 OAG 符合 Schema
   */
  validateOAG(oagId, schemaId) {
    try {
      const oag = this.getOAGById(oagId);
      const schema = schemaId ? this.loadSchema(schemaId) : this.loadSchema(oag.schemaId);
      
      if (!schema) {
        throw new Error(`Schema 不存在`);
      }

      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalNodes: oag.nodes.length,
          totalEdges: oag.edges.length,
          validNodes: 0,
          validEdges: 0
        }
      };

      // 验证节点
      oag.nodes.forEach(node => {
        const entityType = schema.entityTypes?.[node.type];
        if (!entityType) {
          validation.errors.push({
            type: 'node',
            id: node.id,
            message: `未知的实体类型: ${node.type}`
          });
        } else {
          validation.stats.validNodes++;
          
          // 验证必填属性
          if (entityType.properties) {
            Object.entries(entityType.properties).forEach(([propName, propDef]) => {
              if (propDef.required && !node.data?.[propName]) {
                validation.warnings.push({
                  type: 'node',
                  id: node.id,
                  message: `缺少必填属性: ${propName}`
                });
              }
            });
          }
        }
      });

      // 验证边
      oag.edges.forEach(edge => {
        const relationType = schema.relationTypes?.[edge.type];
        if (!relationType) {
          validation.errors.push({
            type: 'edge',
            id: edge.id,
            message: `未知的关系类型: ${edge.type}`
          });
        } else {
          validation.stats.validEdges++;
          
          // 验证 source 和 target 存在
          const sourceNode = oag.nodes.find(n => n.id === edge.source);
          const targetNode = oag.nodes.find(n => n.id === edge.target);
          
          if (!sourceNode) {
            validation.errors.push({
              type: 'edge',
              id: edge.id,
              message: `源节点不存在: ${edge.source}`
            });
          }
          if (!targetNode) {
            validation.errors.push({
              type: 'edge',
              id: edge.id,
              message: `目标节点不存在: ${edge.target}`
            });
          }
        }
      });

      validation.valid = validation.errors.length === 0;
      
      return validation;
    } catch (error) {
      console.error('❌ 验证 OAG 失败:', error);
      throw error;
    }
  }

  /**
   * 导出 OAG
   */
  exportOAG(oagId, format = 'json') {
    try {
      const oag = this.getOAGById(oagId);
      
      switch (format.toLowerCase()) {
        case 'json':
          return {
            content: JSON.stringify(oag, null, 2),
            filename: `${oag.name}.json`,
            mimeType: 'application/json'
          };
        
        case 'csv':
          return this.exportToCSV(oag);
        
        case 'rdf':
        case 'ttl':
          return this.exportToRDF(oag);
        
        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }
    } catch (error) {
      console.error('❌ 导出 OAG 失败:', error);
      throw error;
    }
  }

  /**
   * 获取模板列表
   */
  getTemplates() {
    try {
      const files = fs.readdirSync(this.templatesDir);
      const templates = files
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const content = JSON.parse(fs.readFileSync(path.join(this.templatesDir, f), 'utf8'));
          return {
            id: content.id,
            name: content.name,
            description: content.description,
            domain: content.domain,
            schemaId: content.schemaId,
            nodeCount: content.nodes?.length || 0,
            edgeCount: content.edges?.length || 0,
            tags: content.tags || []
          };
        });
      
      return templates;
    } catch (error) {
      console.error('❌ 获取模板列表失败:', error);
      return [];
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 加载 Schema
   */
  loadSchema(schemaId) {
    try {
      // 尝试多个路径
      const paths = [
        path.join(this.schemaDir, `${schemaId}.json`),
        path.join(this.schemaDir, 'core-domain-schema-v2.json'),
        path.join(this.schemaDir, 'schema.json')
      ];
      
      for (const p of paths) {
        if (fs.existsSync(p)) {
          return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ 加载 Schema 失败:', error);
      return null;
    }
  }

  /**
   * 加载模板
   */
  loadTemplate(templateId) {
    try {
      const filePath = path.join(this.templatesDir, `${templateId}.json`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.error('❌ 加载模板失败:', error);
      return null;
    }
  }

  /**
   * 保存 OAG
   */
  saveOAG(oag) {
    try {
      const filePath = path.join(this.oagDir, `${oag.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(oag, null, 2), 'utf8');
    } catch (error) {
      console.error('❌ 保存 OAG 失败:', error);
      throw error;
    }
  }

  /**
   * 填充示例数据
   */
  populateExampleData(oag, schema) {
    // 为每个实体类型创建一个示例节点
    if (schema.entityTypes) {
      Object.entries(schema.entityTypes).slice(0, 3).forEach(([typeCode, typeDef]) => {
        const nodeId = `example_${typeCode.toLowerCase()}_1`;
        oag.nodes.push({
          id: nodeId,
          type: typeCode,
          label: `${typeDef.label}-示例`,
          data: {
            name: `${typeDef.label}示例`,
            description: `这是一个 ${typeDef.label} 类型的示例节点`
          }
        });
      });
    }
  }

  /**
   * 应用模板参数
   */
  applyTemplateParams(templateData, params) {
    // 深度克隆并替换参数占位符
    const data = JSON.parse(JSON.stringify(templateData));
    
    const replaceParams = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return params[key] !== undefined ? params[key] : match;
        });
      }
      if (Array.isArray(obj)) {
        return obj.map(replaceParams);
      }
      if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = replaceParams(value);
        }
        return result;
      }
      return obj;
    };
    
    return replaceParams(data);
  }

  /**
   * 处理 JSON 数据
   */
  processJSONData(oag, data, mappingConfig) {
    // 根据映射配置将 JSON 数据转换为节点和边
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const nodeType = mappingConfig.nodeType || 'Entity';
        const nodeId = `${nodeType}_${index}`;
        
        oag.nodes.push({
          id: nodeId,
          type: nodeType,
          label: item[mappingConfig.labelField] || `${nodeType}_${index}`,
          data: item
        });
      });
    }
  }

  /**
   * 处理 CSV 数据
   */
  processCSVData(oag, data, mappingConfig) {
    // CSV 数据处理逻辑
    this.processJSONData(oag, data, mappingConfig);
  }

  /**
   * 处理 Excel 数据
   */
  processExcelData(oag, data, mappingConfig) {
    // Excel 数据处理逻辑
    this.processJSONData(oag, data, mappingConfig);
  }

  /**
   * 计算统计信息
   */
  calculateStatistics(nodes, edges) {
    const entityTypeCounts = {};
    const relationTypeCounts = {};
    
    nodes.forEach(node => {
      entityTypeCounts[node.type] = (entityTypeCounts[node.type] || 0) + 1;
    });
    
    edges.forEach(edge => {
      relationTypeCounts[edge.type] = (relationTypeCounts[edge.type] || 0) + 1;
    });
    
    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      entityTypeCounts,
      relationTypeCounts
    };
  }

  /**
   * 导出为 CSV
   */
  exportToCSV(oag) {
    // 简化的 CSV 导出实现
    const lines = ['id,type,label,data'];
    oag.nodes.forEach(node => {
      lines.push(`${node.id},${node.type},${node.label},"${JSON.stringify(node.data)}"`);
    });
    
    return {
      content: lines.join('\n'),
      filename: `${oag.name}.csv`,
      mimeType: 'text/csv'
    };
  }

  /**
   * 导出为 RDF
   */
  exportToRDF(oag) {
    // 简化的 RDF/Turtle 导出实现
    const lines = ['@prefix : <http://example.org/ontology#> .', ''];
    
    oag.nodes.forEach(node => {
      lines.push(`:${node.id} a :${node.type} ;`);
      lines.push(`    :label "${node.label}" .`);
      lines.push('');
    });
    
    return {
      content: lines.join('\n'),
      filename: `${oag.name}.ttl`,
      mimeType: 'text/turtle'
    };
  }
}

// 单例模式
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new OAGService();
    }
    return instance;
  }
};
