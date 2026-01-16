/**
 * Markdown表格解析器
 * 支持解析三元组表格和实体属性表格
 */
class MarkdownParser {
  /**
   * 解析Markdown表格
   * @param {string} content - Markdown内容
   * @param {string} type - 表格类型: 'triples'(三元组) 或 'entities'(实体属性)
   */
  parse(content, type = 'triples') {
    if (type === 'triples') {
      return this.parseTriples(content);
    } else if (type === 'entities') {
      return this.parseEntities(content);
    } else {
      throw new Error(`不支持的表格类型: ${type}`);
    }
  }

  /**
   * 解析三元组表格
   * 格式: | 实体A (ID) | 关系 (谓语) | 实体B (ID) | ...
   */
  parseTriples(content) {
    const lines = content.trim().split('\n');
    const nodes = new Map();
    const edges = [];

    // 跳过表头和分隔线
    const dataLines = lines.slice(2).filter(line => line.trim().startsWith('|'));

    dataLines.forEach((line, index) => {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);

      if (cells.length < 3) {
        console.warn(`行${index + 3}格式不正确，跳过`);
        return;
      }

      const entityA = cells[0];
      const relation = cells[1];
      const entityB = cells[2];
      const confidence = cells[3] ? parseFloat(cells[3]) : 1.0;
      const sourceSystem = cells[4] || '未知';
      const updateTime = cells[5] || new Date().toISOString().split('T')[0];

      // 提取实体ID和类型
      const entityAInfo = this.parseEntityId(entityA);
      const entityBInfo = this.parseEntityId(entityB);

      // 添加节点
      if (entityAInfo.id && !nodes.has(entityAInfo.id)) {
        nodes.set(entityAInfo.id, {
          id: entityAInfo.id,
          type: entityAInfo.type,
          data: {
            title: entityAInfo.label || entityAInfo.id
          }
        });
      }

      if (entityBInfo.id && !nodes.has(entityBInfo.id)) {
        nodes.set(entityBInfo.id, {
          id: entityBInfo.id,
          type: entityBInfo.type,
          data: {
            title: entityBInfo.label || entityBInfo.id
          }
        });
      }

      // 添加边
      if (entityAInfo.id && entityBInfo.id) {
        const relationType = this.normalizeRelation(relation);
        edges.push({
          id: `e_${entityAInfo.id}_${entityBInfo.id}_${index}`,
          source: entityAInfo.id,
          target: entityBInfo.id,
          type: relationType,
          data: {
            confidence: confidence,
            source_system: sourceSystem,
            update_time: updateTime,
            label: relation
          }
        });
      }
    });

    return {
      nodes: Array.from(nodes.values()),
      edges: edges
    };
  }

  /**
   * 解析实体属性表格
   * 格式: | 实体类(Class) | 属性(Property) | 数据类型 | ...
   */
  parseEntities(content) {
    // 这个方法用于解析Schema定义，通常不需要导入到图谱
    // 可以根据需要扩展
    return {
      nodes: [],
      edges: []
    };
  }

  /**
   * 解析实体ID
   * 支持格式: "PROJ_001", "系统需求: SSTS_1001", "自动泊车功能"
   */
  parseEntityId(text) {
    // 移除多余空格
    text = text.trim();

    // 尝试匹配 "标签: ID" 格式
    const match1 = text.match(/^(.+?)[:：]\s*([A-Z_0-9]+)$/);
    if (match1) {
      const label = match1[1].trim();
      const id = match1[2].trim();
      const type = this.inferTypeFromId(id);
      return { id, type, label };
    }

    // 尝试匹配纯ID格式
    const match2 = text.match(/^([A-Z_0-9]+)$/);
    if (match2) {
      const id = match2[1].trim();
      const type = this.inferTypeFromId(id);
      return { id, type, label: id };
    }

    // 尝试匹配带括号的格式 "标签 (ID)"
    const match3 = text.match(/^(.+?)\s*[\(（]([A-Z_0-9]+)[\)）]$/);
    if (match3) {
      const label = match3[1].trim();
      const id = match3[2].trim();
      const type = this.inferTypeFromId(id);
      return { id, type, label };
    }

    // 如果都不匹配，使用原文本作为ID
    return { id: text, type: 'Unknown', label: text };
  }

  /**
   * 从ID推断实体类型
   */
  inferTypeFromId(id) {
    if (id.startsWith('PROJ_')) return 'VehicleProject';
    if (id.startsWith('SSTS_')) return 'SSTS';
    if (id.startsWith('SYS_')) return 'SYS_2_5';
    if (id.startsWith('SWR_')) return 'SWR';
    if (id.startsWith('PF_')) return 'PerceptionFusion';
    if (id.startsWith('OD_') || id.startsWith('PD_') || id.startsWith('Lane_')) return 'ModelVersion';
    if (id.startsWith('Daily_') || id.startsWith('MRD_')) return 'ReleasePackage';
    if (id.startsWith('TC_')) return 'TestCase';
    if (id.startsWith('ISSUE_')) return 'TestIssue';
    if (id.startsWith('SIM_')) return 'SimulationScene';
    return 'Unknown';
  }

  /**
   * 标准化关系名称
   */
  normalizeRelation(relation) {
    const mapping = {
      '管理': 'manages',
      '拆解为': 'decomposes_to',
      '指导': 'guides',
      '产出': 'produces',
      '集成于': 'integrates_to',
      '验证于': 'verified_by',
      '测试于': 'tests_on',
      '发现': 'finds',
      '关联至': 'relates_to',
      '追溯至': 'traces_to',
      '依赖': 'depends_on',
      '引用': 'references',
      '使用': 'uses'
    };

    return mapping[relation] || relation.toLowerCase().replace(/\s+/g, '_');
  }
}

module.exports = MarkdownParser;
