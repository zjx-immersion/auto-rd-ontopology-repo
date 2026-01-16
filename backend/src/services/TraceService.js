const { getInstance: getGraphService } = require('./GraphService');

/**
 * 追溯服务 - 提供需求追溯和影响分析
 */
class TraceService {
  constructor() {
    this.graphService = getGraphService();
  }

  /**
   * 执行追溯查询
   * @param {string} entityId - 实体ID
   * @param {string} queryType - 查询类型: full_trace, impact_analysis, downstream_tasks
   * @param {number} depth - 追溯深度
   */
  trace(entityId, queryType = 'full_trace', depth = 3) {
    const node = this.graphService.getNodeById(entityId);
    if (!node) {
      throw new Error(`实体不存在: ${entityId}`);
    }

    let result = {
      query_entity: {
        id: node.id,
        type: node.type,
        ...node.data
      },
      query_type: queryType,
      depth: depth,
      timestamp: new Date().toISOString()
    };

    switch (queryType) {
      case 'full_trace':
        result.upstream_chain = this.getUpstreamChain(entityId, depth);
        result.downstream_chain = this.getDownstreamChain(entityId, depth);
        result.test_coverage = this.getTestCoverage(entityId);
        break;

      case 'impact_analysis':
        result.downstream_chain = this.getDownstreamChain(entityId, depth);
        result.change_impact = this.analyzeChangeImpact(entityId);
        break;

      case 'downstream_tasks':
        result.downstream_chain = this.getDownstreamChain(entityId, depth);
        break;

      default:
        throw new Error(`不支持的查询类型: ${queryType}`);
    }

    return result;
  }

  /**
   * 获取上游追溯链（向上）
   */
  getUpstreamChain(entityId, maxDepth) {
    const chain = [];
    const visited = new Set();
    
    const traverse = (nodeId, level) => {
      if (level > maxDepth || visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);

      const neighbors = this.graphService.getIncomingNeighbors(nodeId);
      neighbors.forEach(({ edge, node }) => {
        if (node) {
          chain.push({
            level: level,
            entity_type: node.type,
            entity_id: node.id,
            relation: edge.type,
            trace_confidence: edge.data?.confidence || 1.0,
            ...node.data
          });
          traverse(node.id, level + 1);
        }
      });
    };

    traverse(entityId, 1);

    // 按层级排序
    return chain.sort((a, b) => a.level - b.level);
  }

  /**
   * 获取下游影响链（向下）
   */
  getDownstreamChain(entityId, maxDepth) {
    const chain = [];
    const visited = new Set();
    
    const traverse = (nodeId, level) => {
      if (level > maxDepth || visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);

      const neighbors = this.graphService.getOutgoingNeighbors(nodeId);
      neighbors.forEach(({ edge, node }) => {
        if (node) {
          chain.push({
            level: level,
            entity_type: node.type,
            entity_id: node.id,
            relation: edge.type,
            trace_confidence: edge.data?.confidence || 1.0,
            ...node.data
          });
          traverse(node.id, level + 1);
        }
      });
    };

    traverse(entityId, 1);

    // 按层级排序
    return chain.sort((a, b) => a.level - b.level);
  }

  /**
   * 获取测试覆盖情况
   */
  getTestCoverage(entityId) {
    const testCaseEdges = this.graphService.getEdges({
      source: entityId,
      type: 'verified_by'
    });

    const testCases = testCaseEdges
      .map(e => this.graphService.getNodeById(e.target))
      .filter(n => n);

    const passed = testCases.filter(tc => tc.data.status === '通过').length;
    const failed = testCases.filter(tc => tc.data.status === '失败').length;

    // 查找关联的问题
    const issues = [];
    testCases.forEach(tc => {
      const issueEdges = this.graphService.getEdges({
        source: tc.id,
        type: 'finds'
      });
      issueEdges.forEach(e => {
        const issue = this.graphService.getNodeById(e.target);
        if (issue) {
          issues.push({
            issue_id: issue.id,
            severity: issue.data.severity,
            status: issue.data.status,
            description: issue.data.description
          });
        }
      });
    });

    return {
      total_test_cases: testCases.length,
      passed: passed,
      failed: failed,
      issues: issues
    };
  }

  /**
   * 分析变更影响
   */
  analyzeChangeImpact(entityId) {
    const downstream = this.getDownstreamChain(entityId, 5);
    
    // 提取受影响的实体
    const affectedSWR = downstream
      .filter(item => item.entity_type === 'SWR')
      .map(item => item.entity_id);

    const affectedModules = downstream
      .filter(item => item.entity_type === 'PerceptionFusion')
      .map(item => item.entity_id);

    const affectedPackages = downstream
      .filter(item => item.entity_type === 'ReleasePackage')
      .map(item => item.entity_id);

    // 提取责任人
    const owners = new Set();
    downstream.forEach(item => {
      if (item.owner) {
        owners.add(item.owner);
      }
      if (item.PM) {
        owners.add(item.PM);
      }
    });

    // 评估风险等级
    let riskLevel = '低';
    if (affectedPackages.length > 0) {
      riskLevel = '高';
    } else if (affectedSWR.length > 3) {
      riskLevel = '中';
    }

    // 估算工作量
    let estimatedEffort = 0;
    downstream.forEach(item => {
      if (item.estimated_hours) {
        estimatedEffort += item.estimated_hours;
      }
    });

    return {
      affected_entities: {
        swr: affectedSWR,
        modules: affectedModules,
        packages: affectedPackages
      },
      notified_owners: Array.from(owners),
      risk_level: riskLevel,
      estimated_effort: `${estimatedEffort}人时`,
      impact_score: downstream.length,
      recommendation: this.generateRecommendation(riskLevel, downstream.length)
    };
  }

  /**
   * 生成建议
   */
  generateRecommendation(riskLevel, impactCount) {
    if (riskLevel === '高') {
      return '建议召开变更评审会议，评估影响范围，制定详细的测试方案';
    } else if (riskLevel === '中') {
      return '建议通知所有相关责任人，更新相关测试用例';
    } else {
      return '影响范围较小，按正常流程处理';
    }
  }

  /**
   * 获取实体的完整路径（从项目到当前实体）
   */
  getFullPath(entityId) {
    const paths = [];
    const visited = new Set();

    const findPaths = (nodeId, currentPath) => {
      if (visited.has(nodeId)) {
        return;
      }

      const node = this.graphService.getNodeById(nodeId);
      if (!node) {
        return;
      }

      const newPath = [...currentPath, {
        id: node.id,
        type: node.type,
        label: node.data.title || node.data.project_name || node.id
      }];

      // 如果是项目节点，说明到达根节点
      if (node.type === 'VehicleProject') {
        paths.push(newPath.reverse());
        return;
      }

      // 继续向上追溯
      const parents = this.graphService.getIncomingNeighbors(nodeId);
      if (parents.length === 0) {
        paths.push(newPath.reverse());
      } else {
        parents.forEach(({ node: parentNode }) => {
          findPaths(parentNode.id, newPath);
        });
      }
    };

    findPaths(entityId, []);
    return paths;
  }
}

module.exports = TraceService;
