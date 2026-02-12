/**
 * OAG 实例化服务
 * 基于 Schema 创建 OAG (Ontology Asset Graph) 实例
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class OAGInstantiationService {
  constructor() {
    this.oagDir = path.join(__dirname, '../../data/oag');
    this.schemaDir = path.join(__dirname, '../../data/schemaVersions');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.oagDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create OAG directory:', error);
    }
  }

  /**
   * 根据 Schema 创建空白 OAG 实例
   * @param {string} schemaId - Schema ID
   * @param {Object} config - OAG 配置
   * @returns {Promise<Object>} 创建的 OAG 实例
   */
  async createFromSchema(schemaId, config = {}) {
    const { name, description, createdBy = 'system' } = config;
    
    // 1. 加载 Schema
    const schema = await this.loadSchema(schemaId);
    if (!schema) {
      throw new Error(`Schema not found: ${schemaId}`);
    }

    // 2. 创建 OAG 实例
    const oagId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const oag = {
      id: oagId,
      schemaId,
      schemaVersion: schema.version,
      name: name || `${schema.name || 'OAG'} Instance`,
      description: description || `Instance created from ${schemaId}`,
      status: 'active',
      createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
      data: {
        nodes: [],
        edges: []
      },
      // 预填充 Schema 定义的实体类型（空白实例）
      entityTypes: Object.keys(schema.entityTypes || {}),
      relationTypes: Object.keys(schema.relationTypes || {})
    };

    // 3. 保存 OAG 实例
    await this.saveOAG(oag);
    
    return oag;
  }

  /**
   * 基于模板生成 OAG
   * @param {string} templateId - 模板 ID
   * @param {Object} params - 生成参数
   * @returns {Promise<Object>} 生成的 OAG
   */
  async generateFromTemplate(templateId, params = {}) {
    const templates = {
      'vehicle-development': {
        schemaId: 'core-domain-schema-v2',
        name: 'Vehicle Development OAG',
        description: 'Standard vehicle development ontology'
      },
      'adas-project': {
        schemaId: 'adas-schema-v2',
        name: 'ADAS Project OAG',
        description: 'ADAS system development ontology'
      }
    };

    const template = templates[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.createFromSchema(template.schemaId, {
      name: params.name || template.name,
      description: params.description || template.description,
      createdBy: params.createdBy
    });
  }

  /**
   * 批量实例化
   * @param {string} schemaId - Schema ID
   * @param {Array} dataSource - 数据源
   * @returns {Promise<Array>} 创建的 OAG 列表
   */
  async batchInstantiate(schemaId, dataSource) {
    const results = [];
    
    for (const data of dataSource) {
      try {
        const oag = await this.createFromSchema(schemaId, {
          name: data.name,
          description: data.description,
          createdBy: data.createdBy
        });
        results.push({ success: true, oag });
      } catch (error) {
        results.push({ success: false, error: error.message, data });
      }
    }
    
    return results;
  }

  /**
   * 验证 OAG 符合 Schema
   * @param {string} oagId - OAG ID
   * @returns {Promise<Object>} 验证结果
   */
  async validateOAG(oagId) {
    const oag = await this.loadOAG(oagId);
    if (!oag) {
      throw new Error(`OAG not found: ${oagId}`);
    }

    const schema = await this.loadSchema(oag.schemaId);
    if (!schema) {
      throw new Error(`Schema not found: ${oag.schemaId}`);
    }

    const errors = [];
    const warnings = [];

    // 验证节点类型
    for (const node of oag.data.nodes) {
      if (!schema.entityTypes[node.type]) {
        errors.push(`Undefined entity type: ${node.type}`);
      }
    }

    // 验证边类型
    for (const edge of oag.data.edges) {
      if (!schema.relationTypes[edge.type]) {
        errors.push(`Undefined relation type: ${edge.type}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      oagId,
      schemaId: oag.schemaId
    };
  }

  /**
   * 导出 OAG
   * @param {string} oagId - OAG ID
   * @param {string} format - 导出格式 (json, xlsx)
   * @returns {Promise<string>} 导出文件路径
   */
  async exportOAG(oagId, format = 'json') {
    const oag = await this.loadOAG(oagId);
    if (!oag) {
      throw new Error(`OAG not found: ${oagId}`);
    }

    const exportDir = path.join(__dirname, '../../data/exports');
    await fs.mkdir(exportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `oag-${oagId}-${timestamp}.${format}`;
    const filepath = path.join(exportDir, filename);

    if (format === 'json') {
      await fs.writeFile(filepath, JSON.stringify(oag, null, 2));
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }

    return filepath;
  }

  /**
   * 获取 OAG 列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} OAG 列表
   */
  async listOAGs(options = {}) {
    const { limit = 50, offset = 0, status } = options;
    
    try {
      const files = await fs.readdir(this.oagDir);
      const oags = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = await fs.readFile(path.join(this.oagDir, file), 'utf8');
            const oag = JSON.parse(data);
            if (!status || oag.status === status) {
              oags.push({
                id: oag.id,
                name: oag.name,
                schemaId: oag.schemaId,
                schemaVersion: oag.schemaVersion,
                status: oag.status,
                createdAt: oag.createdAt,
                updatedAt: oag.updatedAt
              });
            }
          } catch (e) {
            console.error(`Failed to load OAG from ${file}:`, e);
          }
        }
      }
      
      return oags
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取 OAG 详情
   * @param {string} oagId - OAG ID
   * @returns {Promise<Object>} OAG 详情
   */
  async getOAG(oagId) {
    return this.loadOAG(oagId);
  }

  /**
   * 更新 OAG
   * @param {string} oagId - OAG ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<Object>} 更新后的 OAG
   */
  async updateOAG(oagId, updates) {
    const oag = await this.loadOAG(oagId);
    if (!oag) {
      throw new Error(`OAG not found: ${oagId}`);
    }

    const updated = {
      ...oag,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveOAG(updated);
    return updated;
  }

  /**
   * 删除 OAG
   * @param {string} oagId - OAG ID
   */
  async deleteOAG(oagId) {
    const filepath = path.join(this.oagDir, `${oagId}.json`);
    await fs.unlink(filepath);
  }

  // ============== 私有方法 ==============

  async loadSchema(schemaId) {
    try {
      const filepath = path.join(this.schemaDir, `${schemaId}.json`);
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async loadOAG(oagId) {
    try {
      const filepath = path.join(this.oagDir, `${oagId}.json`);
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async saveOAG(oag) {
    const filepath = path.join(this.oagDir, `${oag.id}.json`);
    await fs.writeFile(filepath, JSON.stringify(oag, null, 2));
  }
}

module.exports = new OAGInstantiationService();
