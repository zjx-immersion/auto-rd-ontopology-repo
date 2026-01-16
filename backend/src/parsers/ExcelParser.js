/**
 * Excel解析器
 * 支持解析Excel三元组数据
 */
class ExcelParser {
  /**
   * 解析Excel数据
   * @param {Array} data - 二维数组，第一行为表头
   * @param {string} type - 数据类型
   */
  parse(data, type = 'triples') {
    if (type === 'triples') {
      return this.parseTriples(data);
    } else {
      throw new Error(`不支持的数据类型: ${type}`);
    }
  }

  /**
   * 解析三元组数据
   * 期望格式: [表头行, 数据行1, 数据行2, ...]
   * 表头: 实体A (ID) | 关系 (谓语) | 实体B (ID) | 置信度 | 来源系统 | 更新时间 | 业务场景说明
   */
  parseTriples(data) {
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Excel数据格式不正确，至少需要表头和一行数据');
    }

    const nodes = new Map();
    const edges = [];

    // 跳过表头，从第二行开始解析
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (!row || row.length < 3) {
        console.warn(`第${i + 1}行数据不完整，跳过`);
        continue;
      }

      const entityA = String(row[0] || '').trim();
      const relation = String(row[1] || '').trim();
      const entityB = String(row[2] || '').trim();
      const confidence = parseFloat(row[3]) || 1.0;
      const sourceSystem = String(row[4] || '未知').trim();
      const updateTime = String(row[5] || new Date().toISOString().split('T')[0]).trim();
      const description = String(row[6] || '').trim();

      if (!entityA || !relation || !entityB) {
        console.warn(`第${i + 1}行缺少必要字段，跳过`);
        continue;
      }

      // 解析实体
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
          id: `e_${entityAInfo.id}_${entityBInfo.id}_${i}`,
          source: entityAInfo.id,
          target: entityBInfo.id,
          type: relationType,
          data: {
            confidence: confidence,
            source_system: sourceSystem,
            update_time: updateTime,
            description: description,
            label: relation
          }
        });
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: edges
    };
  }

  /**
   * 解析实体ID（与MarkdownParser相同的逻辑）
   */
  parseEntityId(text) {
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

    // 尝试匹配带括号的格式
    const match3 = text.match(/^(.+?)\s*[\(（]([A-Z_0-9]+)[\)）]$/);
    if (match3) {
      const label = match3[1].trim();
      const id = match3[2].trim();
      const type = this.inferTypeFromId(id);
      return { id, type, label };
    }

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

module.exports = ExcelParser;
