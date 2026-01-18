const { getInstance: getGraphService } = require('./GraphService');
const multiGraphService = require('./MultiGraphService');

/**
 * 追溯服务 - 提供需求追溯和影响分析
 * 支持多图谱模式：如果提供graphId，从MultiGraphService获取数据；否则使用GraphService
 */
class TraceService {
  constructor() {
    this.graphService = getGraphService();
  }

  /**
   * 从图谱数据中获取节点
   * @param {Object} graphData - 图谱数据 {nodes: [], edges: []}
   * @param {string} entityId - 实体ID
   */
  getNodeFromGraphData(graphData, entityId) {
    console.log(`[TraceService] getNodeFromGraphData调用:`, {
      hasGraphData: !!graphData,
      hasNodes: !!graphData?.nodes,
      nodesCount: graphData?.nodes?.length,
      entityId: entityId
    });
    
    if (!graphData || !graphData.nodes) {
      console.log(`[TraceService] getNodeFromGraphData: 无数据`);
      return null;
    }
    
    const node = graphData.nodes.find(n => n.id === entityId);
    console.log(`[TraceService] getNodeFromGraphData结果:`, {
      found: !!node,
      nodeId: node?.id,
      nodeType: node?.type
    });
    
    // 如果没找到，列出前几个节点ID用于调试
    if (!node && graphData.nodes.length > 0) {
      const sampleIds = graphData.nodes.slice(0, 5).map(n => n.id);
      console.log(`[TraceService] 未找到节点，示例节点ID:`, sampleIds);
    }
    
    return node;
  }

  /**
   * 从图谱数据中获取边的邻居节点
   * @param {Object} graphData - 图谱数据
   * @param {string} nodeId - 节点ID
   * @param {string} direction - 'incoming' | 'outgoing'
   */
  getNeighborsFromGraphData(graphData, nodeId, direction) {
    if (!graphData || !graphData.edges) return [];
    
    const edges = direction === 'incoming' 
      ? graphData.edges.filter(e => e.target === nodeId)
      : graphData.edges.filter(e => e.source === nodeId);
    
    return edges.map(edge => {
      const neighborNodeId = direction === 'incoming' ? edge.source : edge.target;
      const node = this.getNodeFromGraphData(graphData, neighborNodeId);
      return { edge, node };
    }).filter(({ node }) => node !== null);
  }

  /**
   * 执行追溯查询
   * @param {string} entityId - 实体ID
   * @param {string} queryType - 查询类型: full_trace, impact_analysis, downstream_tasks
   * @param {number} depth - 追溯深度
   * @param {string} graphId - 图谱ID（可选，如果提供则从MultiGraphService获取数据）
   */
  async trace(entityId, queryType = 'full_trace', depth = 3, graphId = null) {
    console.log(`[TraceService] trace调用: entityId=${entityId}, queryType=${queryType}, depth=${depth}, graphId=${graphId}`);
    
    let node;
    let graphData = null;
    
    // 如果提供了graphId，从MultiGraphService获取数据
    if (graphId) {
      try {
        console.log(`[TraceService] 从MultiGraphService加载图谱: ${graphId}`);
        const graph = await multiGraphService.getGraph(graphId);
        console.log(`[TraceService] 图谱加载成功:`, {
          graphId: graph?.id,
          hasData: !!graph?.data,
          nodesCount: graph?.data?.nodes?.length,
          edgesCount: graph?.data?.edges?.length
        });
        
        graphData = graph.data || { nodes: [], edges: [] };
        console.log(`[TraceService] 查找节点: ${entityId}`);
        node = this.getNodeFromGraphData(graphData, entityId);
        console.log(`[TraceService] 节点查找结果:`, {
          found: !!node,
          nodeId: node?.id,
          nodeType: node?.type,
          hasData: !!node?.data
        });
      } catch (error) {
        console.error(`[TraceService] Failed to load graph ${graphId}:`, error);
        // 回退到GraphService
        console.log(`[TraceService] 回退到GraphService查找节点`);
        node = this.graphService.getNodeById(entityId);
        console.log(`[TraceService] GraphService查找结果:`, { found: !!node });
      }
    } else {
      // 使用GraphService（向后兼容）
      console.log(`[TraceService] 使用GraphService（无graphId）`);
      node = this.graphService.getNodeById(entityId);
      console.log(`[TraceService] GraphService查找结果:`, { found: !!node });
    }
    
    if (!node) {
      console.error(`[TraceService] 节点不存在: ${entityId}, graphId=${graphId}`);
      throw new Error(`实体不存在: ${entityId}`);
    }
    
    console.log(`[TraceService] 节点找到，继续执行追溯查询`);

    let result = {
      query_entity: {
        id: node.id,
        type: node.type,
        ...(node.data || {})
      },
      query_type: queryType,
      depth: depth,
      timestamp: new Date().toISOString()
    };

    switch (queryType) {
      case 'full_trace':
        result.upstream_chain = await this.getUpstreamChain(entityId, depth, graphData);
        result.downstream_chain = await this.getDownstreamChain(entityId, depth, graphData);
        result.test_coverage = await this.getTestCoverage(entityId, graphData);
        break;

      case 'impact_analysis':
        result.downstream_chain = await this.getDownstreamChain(entityId, depth, graphData);
        result.change_impact = await this.analyzeChangeImpact(entityId, graphData);
        break;

      case 'downstream_tasks':
        result.downstream_chain = await this.getDownstreamChain(entityId, depth, graphData);
        break;

      default:
        throw new Error(`不支持的查询类型: ${queryType}`);
    }

    return result;
  }

  /**
   * 获取上游追溯链（向上）
   */
  async getUpstreamChain(entityId, maxDepth, graphData = null) {
    const chain = [];
    const visited = new Set();
    
    const traverse = async (nodeId, level) => {
      if (level > maxDepth || visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);

      let neighbors;
      if (graphData) {
        neighbors = this.getNeighborsFromGraphData(graphData, nodeId, 'incoming');
      } else {
        neighbors = this.graphService.getIncomingNeighbors(nodeId);
      }
      
      neighbors.forEach(({ edge, node }) => {
        if (node) {
          chain.push({
            level: level,
            entity_type: node.type,
            entity_id: node.id,
            relation: edge.type,
            trace_confidence: edge.data?.confidence || 1.0,
            ...(node.data || {})
          });
          traverse(node.id, level + 1);
        }
      });
    };

    await traverse(entityId, 1);

    // 按层级排序
    return chain.sort((a, b) => a.level - b.level);
  }

  /**
   * 获取下游影响链（向下）
   */
  async getDownstreamChain(entityId, maxDepth, graphData = null) {
    const chain = [];
    const visited = new Set();
    
    const traverse = async (nodeId, level) => {
      if (level > maxDepth || visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);

      let neighbors;
      if (graphData) {
        neighbors = this.getNeighborsFromGraphData(graphData, nodeId, 'outgoing');
      } else {
        neighbors = this.graphService.getOutgoingNeighbors(nodeId);
      }
      
      neighbors.forEach(({ edge, node }) => {
        if (node) {
          chain.push({
            level: level,
            entity_type: node.type,
            entity_id: node.id,
            relation: edge.type,
            trace_confidence: edge.data?.confidence || 1.0,
            ...(node.data || {})
          });
          traverse(node.id, level + 1);
        }
      });
    };

    await traverse(entityId, 1);

    // 按层级排序
    return chain.sort((a, b) => a.level - b.level);
  }

  /**
   * 获取测试覆盖情况
   */
  async getTestCoverage(entityId, graphData = null) {
    let testCaseEdges;
    if (graphData) {
      testCaseEdges = (graphData.edges || []).filter(e => 
        e.source === entityId && e.type === 'verified_by'
      );
    } else {
      testCaseEdges = this.graphService.getEdges({
        source: entityId,
        type: 'verified_by'
      });
    }

    const testCases = testCaseEdges
      .map(e => {
        if (graphData) {
          return this.getNodeFromGraphData(graphData, e.target);
        } else {
          return this.graphService.getNodeById(e.target);
        }
      })
      .filter(n => n);

    const passed = testCases.filter(tc => tc.data?.status === '通过').length;
    const failed = testCases.filter(tc => tc.data?.status === '失败').length;

    // 查找关联的问题
    const issues = [];
    testCases.forEach(tc => {
      let issueEdges;
      if (graphData) {
        issueEdges = (graphData.edges || []).filter(e => 
          e.source === tc.id && e.type === 'finds'
        );
      } else {
        issueEdges = this.graphService.getEdges({
          source: tc.id,
          type: 'finds'
        });
      }
      
      issueEdges.forEach(e => {
        const issue = graphData 
          ? this.getNodeFromGraphData(graphData, e.target)
          : this.graphService.getNodeById(e.target);
        if (issue) {
          issues.push({
            issue_id: issue.id,
            severity: issue.data?.severity,
            status: issue.data?.status,
            description: issue.data?.description
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
  async analyzeChangeImpact(entityId, graphData = null) {
    const downstream = await this.getDownstreamChain(entityId, 5, graphData);
    
    // 提取受影响的实体（支持V2.0 Schema类型）
    const affectedSWR = downstream
      .filter(item => item.entity_type === 'SWR' || item.entity_type === 'ModuleRequirement')
      .map(item => item.entity_id);

    const affectedModules = downstream
      .filter(item => item.entity_type === 'PerceptionFusion' || item.entity_type === 'Module')
      .map(item => item.entity_id);

    const affectedPackages = downstream
      .filter(item => item.entity_type === 'ReleasePackage' || item.entity_type === 'Release')
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
      if (item.ownerId) {
        owners.add(item.ownerId);
      }
      if (item.assigneeId) {
        owners.add(item.assigneeId);
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
      if (item.estimatedHours) {
        estimatedEffort += item.estimatedHours;
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
   * @param {string} entityId - 实体ID
   * @param {Object} graphData - 图谱数据（可选）
   */
  async getFullPath(entityId, graphData = null) {
    const paths = [];
    const visited = new Set();

    const findPaths = async (nodeId, currentPath) => {
      if (visited.has(nodeId)) {
        return;
      }

      const node = graphData 
        ? this.getNodeFromGraphData(graphData, nodeId)
        : this.graphService.getNodeById(nodeId);
      
      if (!node) {
        return;
      }

      const newPath = [...currentPath, {
        id: node.id,
        type: node.type,
        label: node.data?.title || node.data?.name || node.data?.project_name || node.id
      }];

      // 如果是项目节点，说明到达根节点（支持V2.0类型）
      if (node.type === 'VehicleProject' || node.type === 'Vehicle') {
        paths.push(newPath.reverse());
        return;
      }

      // 继续向上追溯
      let parents;
      if (graphData) {
        parents = this.getNeighborsFromGraphData(graphData, nodeId, 'incoming');
      } else {
        parents = this.graphService.getIncomingNeighbors(nodeId);
      }
      
      if (parents.length === 0) {
        paths.push(newPath.reverse());
      } else {
        for (const { node: parentNode } of parents) {
          await findPaths(parentNode.id, newPath);
        }
      }
    };

    await findPaths(entityId, []);
    return paths;
  }
}

module.exports = TraceService;
