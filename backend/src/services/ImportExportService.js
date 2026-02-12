/**
 * 数据导入导出服务
 * 支持 Excel (.xlsx) 和 CSV 格式
 */
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

class ImportExportService {
  constructor() {
    this.uploadPath = path.join(__dirname, '../../../data/uploads');
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * 解析Excel/CSV文件
   * @param {Buffer} fileBuffer - 文件内容
   * @param {string} fileType - 文件类型 (xlsx/csv)
   * @returns {Object} 解析结果
   */
  parseFile(fileBuffer, fileType) {
    try {
      if (fileType === 'xlsx') {
        return this.parseExcel(fileBuffer);
      } else if (fileType === 'csv') {
        return this.parseCSV(fileBuffer);
      }
      throw new Error('不支持的文件格式');
    } catch (error) {
      throw new Error(`文件解析失败: ${error.message}`);
    }
  }

  /**
   * 解析Excel文件
   */
  parseExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const result = {
      entities: [],
      relations: []
    };

    // 解析实体Sheet
    const entitySheetNames = ['实体', 'Entities', 'Nodes', '节点'];
    for (const sheetName of workbook.SheetNames) {
      if (entitySheetNames.some(name => sheetName.toLowerCase().includes(name.toLowerCase()))) {
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        result.entities = this.normalizeEntityData(data);
      }
    }

    // 解析关系Sheet
    const relationSheetNames = ['关系', 'Relations', 'Edges', '边'];
    for (const sheetName of workbook.SheetNames) {
      if (relationSheetNames.some(name => sheetName.toLowerCase().includes(name.toLowerCase()))) {
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        result.relations = this.normalizeRelationData(data);
      }
    }

    // 如果没有指定sheet，尝试解析第一个sheet作为实体
    if (result.entities.length === 0 && workbook.SheetNames.length > 0) {
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(firstSheet);
      result.entities = this.normalizeEntityData(data);
    }

    return result;
  }

  /**
   * 解析CSV文件
   */
  parseCSV(buffer) {
    const content = buffer.toString('utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV文件格式无效');
    }

    // 解析表头
    const headers = this.parseCSVLine(lines[0]);
    const entities = [];

    // 解析数据行
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const entity = {};
      headers.forEach((header, index) => {
        entity[header] = values[index] || '';
      });
      entities.push(entity);
    }

    return {
      entities: this.normalizeEntityData(entities),
      relations: []
    };
  }

  /**
   * 解析CSV行（处理引号）
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * 标准化实体数据
   */
  normalizeEntityData(data) {
    return data.map(row => ({
      id: row.id || row.ID || row['实体ID'] || row['Node ID'] || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: row.type || row.Type || row['实体类型'] || row['Type'] || 'Unknown',
      label: row.label || row.Label || row['名称'] || row['Name'] || row['标签'] || 'Unnamed',
      properties: this.extractProperties(row)
    }));
  }

  /**
   * 标准化关系数据
   */
  normalizeRelationData(data) {
    return data.map(row => ({
      id: row.id || row.ID || row['关系ID'] || row['Edge ID'] || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: row.source || row.Source || row['源节点'] || row['From'] || row['sourceId'],
      target: row.target || row.Target || row['目标节点'] || row['To'] || row['targetId'],
      type: row.type || row.Type || row['关系类型'] || row['Relation Type'] || 'related_to',
      properties: this.extractProperties(row)
    }));
  }

  /**
   * 提取额外属性
   */
  extractProperties(row) {
    const reservedKeys = ['id', 'ID', 'type', 'Type', 'label', 'Label', 'source', 'target', 'Source', 'Target'];
    const properties = {};
    
    for (const [key, value] of Object.entries(row)) {
      if (!reservedKeys.includes(key) && value !== undefined && value !== '') {
        properties[key] = value;
      }
    }
    
    return properties;
  }

  /**
   * 生成Excel文件
   * @param {Object} data - 图谱数据
   * @returns {Buffer} Excel文件内容
   */
  generateExcel(data) {
    const workbook = xlsx.utils.book_new();

    // 实体Sheet
    if (data.nodes && data.nodes.length > 0) {
      const entityData = data.nodes.map(node => ({
        'ID': node.id,
        '实体类型': node.type,
        '名称': node.label,
        ...node.data
      }));
      const entitySheet = xlsx.utils.json_to_sheet(entityData);
      xlsx.utils.book_append_sheet(workbook, entitySheet, '实体');
    }

    // 关系Sheet
    if (data.edges && data.edges.length > 0) {
      const relationData = data.edges.map(edge => ({
        'ID': edge.id,
        '源节点': edge.source,
        '目标节点': edge.target,
        '关系类型': edge.type,
        ...edge.data
      }));
      const relationSheet = xlsx.utils.json_to_sheet(relationData);
      xlsx.utils.book_append_sheet(workbook, relationSheet, '关系');
    }

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 生成CSV文件
   * @param {Object} data - 图谱数据
   * @returns {string} CSV内容
   */
  generateCSV(data) {
    const lines = [];

    // 实体部分
    if (data.nodes && data.nodes.length > 0) {
      // 收集所有可能的属性
      const allKeys = new Set(['id', 'type', 'label']);
      data.nodes.forEach(node => {
        if (node.data) {
          Object.keys(node.data).forEach(key => allKeys.add(key));
        }
      });
      const headers = Array.from(allKeys);
      lines.push(headers.join(','));

      // 数据行
      data.nodes.forEach(node => {
        const row = headers.map(key => {
          let value = node[key] || (node.data && node.data[key]) || '';
          // 处理包含逗号或引号的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        lines.push(row.join(','));
      });
    }

    return lines.join('\n');
  }

  /**
   * 验证导入数据
   */
  validateImportData(data) {
    const errors = [];
    const warnings = [];

    // 验证实体
    if (data.entities && data.entities.length > 0) {
      const seenIds = new Set();
      data.entities.forEach((entity, index) => {
        if (!entity.id) {
          errors.push(`实体行 ${index + 1}: 缺少ID`);
        } else if (seenIds.has(entity.id)) {
          errors.push(`实体行 ${index + 1}: ID重复 (${entity.id})`);
        } else {
          seenIds.add(entity.id);
        }

        if (!entity.type) {
          warnings.push(`实体行 ${index + 1}: 缺少类型`);
        }
        if (!entity.label) {
          warnings.push(`实体行 ${index + 1}: 缺少名称`);
        }
      });
    }

    // 验证关系
    if (data.relations && data.relations.length > 0) {
      data.relations.forEach((relation, index) => {
        if (!relation.source) {
          errors.push(`关系行 ${index + 1}: 缺少源节点`);
        }
        if (!relation.target) {
          errors.push(`关系行 ${index + 1}: 缺少目标节点`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        entityCount: data.entities?.length || 0,
        relationCount: data.relations?.length || 0
      }
    };
  }
}

module.exports = new ImportExportService();
