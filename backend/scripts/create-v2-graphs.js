#!/usr/bin/env node

/**
 * 创建Schema V2.0的3个领域图谱数据
 * 从Markdown源文件中提取数据，构造完整的图谱JSON
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 路径配置
const dataPath = path.join(__dirname, '../../data');
const graphsDir = path.join(dataPath, 'graphs');
const sourceDir = path.join(dataPath, 'sources-draft');

// Schema路径
const schemaPath = path.join(dataPath, 'schemaVersions', 'core-domain-schema-v2.json');

// 源文件路径
const adasSourcePath = path.join(sourceDir, '18-实例化数据-智能驾驶领域.md');
const cabinSourcePath = path.join(sourceDir, '19-实例化数据-智能座舱领域.md');
const eeSourcePath = path.join(sourceDir, '20-实例化数据-电子电器领域.md');

// 加载Schema V2.0
let schemaV2 = null;
try {
  schemaV2 = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  console.log('✅ 成功加载Schema V2.0');
  console.log(`   实体类型数: ${Object.keys(schemaV2.entityTypes).length}`);
  console.log(`   关系类型数: ${Object.keys(schemaV2.relationTypes).length}`);
} catch (error) {
  console.error('❌ 无法加载Schema V2.0:', error.message);
  process.exit(1);
}

/**
 * 从Markdown中提取所有JSON代码块
 */
function extractJsonBlocks(markdown) {
  const jsonBlocks = [];
  const regex = /```json\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = regex.exec(markdown)) !== null) {
    try {
      const jsonContent = match[1];
      const parsed = JSON.parse(jsonContent);
      jsonBlocks.push(parsed);
    } catch (error) {
      // 忽略无法解析的JSON块
    }
  }
  
  return jsonBlocks;
}

/**
 * 识别实体类型
 */
function identifyEntityType(obj) {
  // 基于ID前缀识别实体类型
  const id = obj.id;
  
  if (id.startsWith('VEH-')) return 'Vehicle';
  if (id.startsWith('DP-')) return 'DomainProject';
  if (id.startsWith('MS-')) return 'ProjectMilestone';
  if (id.startsWith('BL-')) return 'Baseline';
  if (id.startsWith('PL-')) return 'ProductLine';
  if (id.startsWith('PROD-')) return 'Product';
  if (id.startsWith('PV-')) return 'ProductVersion';
  if (id.startsWith('FEAT-')) return 'Feature';
  if (id.startsWith('MOD-')) return 'Module';
  if (id.startsWith('FP-')) return 'FeaturePackage';
  if (id.startsWith('FPV-')) return 'FeaturePackageVersion';
  if (id.startsWith('EPIC-')) return 'Epic';
  if (id.startsWith('FR-')) return 'FeatureRequirement';
  if (id.startsWith('FRV-')) return 'FeatureRequirementVersion';
  if (id.startsWith('MR-')) return 'ModuleRequirement';
  if (id.startsWith('MRV-')) return 'ModuleRequirementVersion';
  if (id.startsWith('SSTS-')) return 'SSTS';
  if (id.startsWith('PRD-')) return 'PRDDocument';
  if (id.startsWith('ASSET-')) return 'Asset';
  if (id.startsWith('AV-')) return 'AssetVersion';
  if (id.startsWith('AU-')) return 'AssetUsage';
  if (id.startsWith('AD-')) return 'AssetDependency';
  if (id.startsWith('PI-')) return 'PI';
  if (id.startsWith('SPRINT-')) return 'Sprint';
  if (id.startsWith('SB-')) return 'SprintBacklog';
  if (id.startsWith('TC-')) return 'TeamCapacity';
  if (id.startsWith('WI-')) return 'WorkItem';
  if (id.startsWith('WL-')) return 'WorkLog';
  if (id.startsWith('CC-')) return 'CodeCommit';
  if (id.startsWith('BUILD-')) return 'Build';
  if (id.startsWith('WID-')) return 'WorkItemDependency';
  if (id.startsWith('WIA-')) return 'WorkItemAttachment';
  if (id.startsWith('REPO-')) return 'Repository';
  if (id.startsWith('TP-')) return 'TestPlan';
  // 区分TestCase(TC-)和TeamCapacity(TC-)，通过检查对象属性
  if (id.startsWith('TC-')) {
    // TeamCapacity有teamId和capacity，TestCase有testPlanId和steps
    return null; // 将在createNode中根据数据结构判断
  }
  if (id.startsWith('TE-')) return 'TestExecution';
  if (id.startsWith('DEFECT-')) return 'Defect';
  if (id.startsWith('ARTIFACT-')) return 'Artifact';
  if (id.startsWith('RELEASE-')) return 'Release';
  if (id.startsWith('DEPLOY-')) return 'Deployment';
  if (id.startsWith('MS-')) return 'MetricSet';
  if (id.startsWith('METRIC-')) return 'Metric';
  if (id.startsWith('MV-')) return 'MetricValue';
  if (id.startsWith('USER-')) return 'User';
  if (id.startsWith('TEAM-')) return 'Team';
  if (id.startsWith('TM-')) return 'TeamMember';
  if (id.startsWith('ROLE-')) return 'Role';
  if (id.startsWith('UR-')) return 'UserRole';
  
  return null;
}

/**
 * 从对象创建节点
 */
function createNode(obj, defaultType = null) {
  let type = identifyEntityType(obj) || defaultType;
  
  // 特殊处理TC-开头的节点：根据数据结构判断是TestCase还是TeamCapacity
  if (!type && obj.id && obj.id.startsWith('TC-')) {
    if (obj.teamId && (obj.capacity !== undefined || obj.availableHours !== undefined)) {
      type = 'TeamCapacity';
    } else if (obj.testPlanId && (obj.steps !== undefined || obj.description !== undefined)) {
      type = 'TestCase';
    }
  }
  
  if (!type || !schemaV2.entityTypes[type]) {
    return null;
  }
  
  const entityDef = schemaV2.entityTypes[type];
  const label = obj.name || obj.title || obj.code || obj.id;
  
  return {
    id: obj.id,
    type: type,
    label: label,
    data: obj
  };
}

/**
 * 创建关系边
 * @param {Array} nodes - 节点数组
 * @param {Array} sourceEdges - 可选的原始边数据，用于保留边的属性
 */
function createEdges(nodes, sourceEdges = []) {
  const edges = [];
  const edgeId = () => `edge_${uuidv4().replace(/-/g, '').substring(0, 10)}`;
  
  // 创建原始边数据索引，用于查找匹配的边并保留属性
  // 使用 source-type-target 作为键
  const sourceEdgeMap = new Map();
  sourceEdges.forEach(edge => {
    const key = `${edge.source}-${edge.type}-${edge.target}`;
    sourceEdgeMap.set(key, edge);
  });
  
  // 基于业务规则生成边的属性数据
  const generateEdgeData = (sourceNode, type, targetNode) => {
    const relationType = schemaV2?.relationTypes?.[type];
    const properties = relationType?.properties || {};
    const edgeData = {};
    
    // 从Schema中获取属性定义，生成默认值
    Object.keys(properties).forEach(propKey => {
      const propDef = properties[propKey];
      
      // 基于关系类型和节点数据生成属性值
      if (propKey === 'relationship') {
        // 关系描述：使用Schema中的description或label
        edgeData[propKey] = relationType?.description || relationType?.label || `${sourceNode?.label || sourceNode?.id} ${relationType?.label || type} ${targetNode?.label || targetNode?.id}`;
      } else if (propKey === 'createdAt' || propKey === 'lastUpdated' || propKey === 'foundDate' || propKey === 'recordedAt' || propKey === 'loggedAt' || propKey === 'executedAt' || propKey === 'deployedAt' || propKey === 'joinedDate' || propKey === 'assignedDate' || propKey === 'releaseDate' || propKey === 'startDate' || propKey === 'endDate') {
        // 日期类型：使用当前时间或从节点数据中获取
        edgeData[propKey] = new Date().toISOString().split('T')[0];
      } else if (propKey === 'priority') {
        // 优先级：从节点数据中获取或使用默认值
        edgeData[propKey] = sourceNode?.data?.priority || targetNode?.data?.priority || 'MEDIUM';
      } else if (propKey === 'status' || propKey === 'buildStatus' || propKey === 'testStatus' || propKey === 'executionStatus') {
        // 状态：从节点数据中获取或使用默认值
        edgeData[propKey] = sourceNode?.data?.status || targetNode?.data?.status || 'IN_PROGRESS';
      } else if (propKey === 'version' || propKey === 'releaseVersion' || propKey === 'documentVersion') {
        // 版本：从节点数据中获取
        edgeData[propKey] = targetNode?.data?.version || sourceNode?.data?.version || 'V1.0';
      } else if (propKey === 'sequence' || propKey === 'sprintNumber' || propKey === 'piNumber' || propKey === 'level' || propKey === 'refinementLevel') {
        // 整数类型：从节点数据中获取或使用默认值
        edgeData[propKey] = sourceNode?.data?.[propKey] || targetNode?.data?.[propKey] || 1;
      } else if (propKey === 'estimatedHours' || propKey === 'actualHours' || propKey === 'capacity' || propKey === 'progress' || propKey === 'coverage' || propKey === 'value' || propKey === 'targetValue' || propKey === 'buildDuration' || propKey === 'executionTime' || propKey === 'size') {
        // 浮点数类型：使用默认值0
        edgeData[propKey] = sourceNode?.data?.[propKey] || targetNode?.data?.[propKey] || 0;
      } else if (propKey === 'ownerTeamId' || propKey === 'teamId') {
        // 团队ID：从节点数据中获取
        edgeData[propKey] = sourceNode?.data?.ownerTeamId || targetNode?.data?.teamId || sourceNode?.data?.teamId || targetNode?.data?.ownerTeamId;
      } else if (propKey === 'scope' || propKey === 'changeLog' || propKey === 'description') {
        // 文本类型：从节点数据中获取或使用空字符串
        edgeData[propKey] = sourceNode?.data?.[propKey] || targetNode?.data?.[propKey] || '';
      } else if (propDef.type === 'Enum' && propDef.values) {
        // 枚举类型：使用第一个值作为默认值
        edgeData[propKey] = sourceNode?.data?.[propKey] || targetNode?.data?.[propKey] || propDef.values[0];
      } else {
        // 其他类型：尝试从节点数据中获取
        edgeData[propKey] = sourceNode?.data?.[propKey] || targetNode?.data?.[propKey] || null;
      }
    });
    
    return edgeData;
  };
  
  // 查找匹配的原始边并获取其属性数据，如果没有则基于业务规则生成
  const getEdgeData = (source, type, target) => {
    const key = `${source}-${type}-${target}`;
    const sourceEdge = sourceEdgeMap.get(key);
    
    if (sourceEdge?.data && Object.keys(sourceEdge.data).length > 0) {
      // 如果有原始边数据，使用它
      return sourceEdge.data;
    }
    
    // 否则，基于业务规则生成属性数据
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    
    if (sourceNode && targetNode) {
      return generateEdgeData(sourceNode, type, targetNode);
    }
    
    return {};
  };
  
  nodes.forEach(node => {
    const data = node.data;
    
    // Vehicle -> DomainProject
    if (node.type === 'DomainProject' && data.vehicleId) {
      edges.push({
        id: edgeId(),
        source: data.vehicleId,
        target: node.id,
        type: 'has_domain_project',
        data: getEdgeData(data.vehicleId, 'has_domain_project', node.id)
      });
    }
    
    // DomainProject -> ProjectMilestone
    if (node.type === 'ProjectMilestone' && data.domainProjectId) {
      edges.push({
        id: edgeId(),
        source: data.domainProjectId,
        target: node.id,
        type: 'has_milestone',
        data: getEdgeData(data.domainProjectId, 'has_milestone', node.id)
      });
    }
    
    // ProjectMilestone -> Baseline
    if (node.type === 'Baseline' && data.milestoneId) {
      edges.push({
        id: edgeId(),
        source: data.milestoneId,
        target: node.id,
        type: 'has_baseline',
        data: getEdgeData(data.milestoneId, 'has_baseline', node.id)
      });
    }
    
    // ProductLine -> Product
    if (node.type === 'Product' && data.productLineId) {
      edges.push({
        id: edgeId(),
        source: data.productLineId,
        target: node.id,
        type: 'has_product',
        data: getEdgeData(data.productLineId, 'has_product', node.id)
      });
    }
    
    // Product -> ProductVersion
    if (node.type === 'ProductVersion' && data.productId) {
      edges.push({
        id: edgeId(),
        source: data.productId,
        target: node.id,
        type: 'has_product_version',
        data: getEdgeData(data.productId, 'has_product_version', node.id)
      });
      
      // ProductVersion -> Baseline
      if (data.baselineId) {
        edges.push({
          id: edgeId(),
          source: node.id,
          target: data.baselineId,
          type: 'version_relates_baseline',
          data: getEdgeData(node.id, 'version_relates_baseline', data.baselineId)
        });
      }
    }
    
    // Product -> Feature
    if (node.type === 'Feature' && data.productId) {
      edges.push({
        id: edgeId(),
        source: data.productId,
        target: node.id,
        type: 'has_feature',
        data: getEdgeData(data.productId, 'has_feature', node.id)
      });
      
      // Feature hierarchy
      if (data.parentFeatureId) {
        edges.push({
          id: edgeId(),
          source: data.parentFeatureId,
          target: node.id,
          type: 'feature_hierarchy',
          data: getEdgeData(data.parentFeatureId, 'feature_hierarchy', node.id)
        });
      }
    }
    
    // Feature -> Module
    if (node.type === 'Module' && data.featureId) {
      edges.push({
        id: edgeId(),
        source: data.featureId,
        target: node.id,
        type: 'has_module',
        data: getEdgeData(data.featureId, 'has_module', node.id)
      });
    }
    
    // Product -> FeaturePackage
    if (node.type === 'FeaturePackage' && data.productId) {
      edges.push({
        id: edgeId(),
        source: data.productId,
        target: node.id,
        type: 'has_feature_package',
        data: getEdgeData(data.productId, 'has_feature_package', node.id)
      });
    }
    
    // FeaturePackage -> FeaturePackageVersion
    if (node.type === 'FeaturePackageVersion' && data.featurePackageId) {
      edges.push({
        id: edgeId(),
        source: data.featurePackageId,
        target: node.id,
        type: 'package_has_version',
        data: getEdgeData(data.featurePackageId, 'package_has_version', node.id)
      });
    }
    
    // Product -> Epic
    if (node.type === 'Epic' && data.productId) {
      edges.push({
        id: edgeId(),
        source: data.productId,
        target: node.id,
        type: 'epic_in_product',
        data: getEdgeData(data.productId, 'epic_in_product', node.id)
      });
    }
    
    // Epic -> FeatureRequirement
    if (node.type === 'FeatureRequirement' && data.epicId) {
      edges.push({
        id: edgeId(),
        source: data.epicId,
        target: node.id,
        type: 'epic_to_fr',
        data: getEdgeData(data.epicId, 'epic_to_fr', node.id)
      });
      
      // Feature -> FeatureRequirement
      if (data.featureId) {
        edges.push({
          id: edgeId(),
          source: data.featureId,
          target: node.id,
          type: 'feature_carries_fr',
          data: getEdgeData(data.featureId, 'feature_carries_fr', node.id)
        });
      }
    }
    
    // FeatureRequirement -> ModuleRequirement
    if (node.type === 'ModuleRequirement' && data.featureRequirementId) {
      edges.push({
        id: edgeId(),
        source: data.featureRequirementId,
        target: node.id,
        type: 'fr_to_mr',
        data: getEdgeData(data.featureRequirementId, 'fr_to_mr', node.id)
      });
      
      // Module -> ModuleRequirement
      if (data.moduleId) {
        edges.push({
          id: edgeId(),
          source: data.moduleId,
          target: node.id,
          type: 'module_carries_mr',
          data: getEdgeData(data.moduleId, 'module_carries_mr', node.id)
        });
      }
    }
    
    // ModuleRequirement -> SSTS
    if (node.type === 'SSTS' && data.moduleRequirementId) {
      edges.push({
        id: edgeId(),
        source: data.moduleRequirementId,
        target: node.id,
        type: 'mr_to_ssts',
        data: getEdgeData(data.moduleRequirementId, 'mr_to_ssts', node.id)
      });
    }
    
    // FeatureRequirement -> PRDDocument
    if (node.type === 'PRDDocument' && data.featureRequirementId) {
      edges.push({
        id: edgeId(),
        source: data.featureRequirementId,
        target: node.id,
        type: 'fr_has_prd',
        data: getEdgeData(data.featureRequirementId, 'fr_has_prd', node.id)
      });
    }
    
    // FeatureRequirement -> FeatureRequirementVersion
    if (node.type === 'FeatureRequirementVersion' && data.featureRequirementId) {
      edges.push({
        id: edgeId(),
        source: data.featureRequirementId,
        target: node.id,
        type: 'fr_has_version',
        data: getEdgeData(data.featureRequirementId, 'fr_has_version', node.id)
      });
    }
    
    // ModuleRequirement -> ModuleRequirementVersion
    if (node.type === 'ModuleRequirementVersion' && data.moduleRequirementId) {
      edges.push({
        id: edgeId(),
        source: data.moduleRequirementId,
        target: node.id,
        type: 'mr_has_version',
        data: getEdgeData(data.moduleRequirementId, 'mr_has_version', node.id)
      });
    }
    
    // Asset -> AssetVersion
    if (node.type === 'AssetVersion' && data.assetId) {
      edges.push({
        id: edgeId(),
        source: data.assetId,
        target: node.id,
        type: 'asset_has_version',
        data: getEdgeData(data.assetId, 'asset_has_version', node.id)
      });
    }
    
    // ModuleRequirement -> AssetUsage
    if (node.type === 'AssetUsage' && data.moduleRequirementId) {
      edges.push({
        id: edgeId(),
        source: data.moduleRequirementId,
        target: node.id,
        type: 'mr_uses_asset',
        data: getEdgeData(data.moduleRequirementId, 'mr_uses_asset', node.id)
      });
      
      // AssetUsage -> AssetVersion
      if (data.assetVersionId) {
        edges.push({
          id: edgeId(),
          source: node.id,
          target: data.assetVersionId,
          type: 'usage_refers_version',
          data: getEdgeData(node.id, 'usage_refers_version', data.assetVersionId)
        });
      }
    }
    
    // DomainProject -> PI
    if (node.type === 'PI' && data.domainProjectId) {
      edges.push({
        id: edgeId(),
        source: data.domainProjectId,
        target: node.id,
        type: 'project_has_pi',
        data: getEdgeData(data.domainProjectId, 'project_has_pi', node.id)
      });
    }
    
    // PI -> Sprint
    if (node.type === 'Sprint' && data.piId) {
      edges.push({
        id: edgeId(),
        source: data.piId,
        target: node.id,
        type: 'pi_has_sprint',
        data: getEdgeData(data.piId, 'pi_has_sprint', node.id)
      });
    }
    
    // Sprint -> SprintBacklog
    if (node.type === 'SprintBacklog' && data.sprintId) {
      edges.push({
        id: edgeId(),
        source: data.sprintId,
        target: node.id,
        type: 'sprint_has_backlog',
        data: getEdgeData(data.sprintId, 'sprint_has_backlog', node.id)
      });
      
      // SprintBacklog -> ModuleRequirement
      if (data.moduleRequirementId) {
        edges.push({
          id: edgeId(),
          source: node.id,
          target: data.moduleRequirementId,
          type: 'backlog_refers_mr',
          data: getEdgeData(node.id, 'backlog_refers_mr', data.moduleRequirementId)
        });
      }
    }
    
    // Sprint -> WorkItem
    if (node.type === 'WorkItem' && data.sprintId) {
      edges.push({
        id: edgeId(),
        source: data.sprintId,
        target: node.id,
        type: 'sprint_has_workitem',
        data: getEdgeData(data.sprintId, 'sprint_has_workitem', node.id)
      });
      
      // WorkItem -> ModuleRequirement (if type is REQUIREMENT)
      if (data.moduleRequirementId && data.type === 'REQUIREMENT_TASK') {
        edges.push({
          id: edgeId(),
          source: node.id,
          target: data.moduleRequirementId,
          type: 'workitem_implements_mr',
          data: getEdgeData(node.id, 'workitem_implements_mr', data.moduleRequirementId)
        });
      }
    }
    
    // WorkItem -> WorkLog
    if (node.type === 'WorkLog' && data.workItemId) {
      edges.push({
        id: edgeId(),
        source: data.workItemId,
        target: node.id,
        type: 'workitem_has_log',
        data: getEdgeData(data.workItemId, 'workitem_has_log', node.id)
      });
    }
    
    // WorkItem -> CodeCommit
    if (node.type === 'CodeCommit' && data.workItemId) {
      edges.push({
        id: edgeId(),
        source: data.workItemId,
        target: node.id,
        type: 'workitem_has_commit',
        data: getEdgeData(data.workItemId, 'workitem_has_commit', node.id)
      });
    }
    
    // CodeCommit -> Build
    if (node.type === 'Build' && data.codeCommitId) {
      edges.push({
        id: edgeId(),
        source: data.codeCommitId,
        target: node.id,
        type: 'commit_triggers_build',
        data: getEdgeData(data.codeCommitId, 'commit_triggers_build', node.id)
      });
    }
    
    // ModuleRequirement -> TestPlan
    if (node.type === 'TestPlan' && data.moduleId) {
      edges.push({
        id: edgeId(),
        source: data.moduleId,
        target: node.id,
        type: 'mr_has_testplan',
        data: getEdgeData(data.moduleId, 'mr_has_testplan', node.id)
      });
    }
    
    // TestPlan -> TestCase
    if (node.type === 'TestCase' && data.testPlanId) {
      edges.push({
        id: edgeId(),
        source: data.testPlanId,
        target: node.id,
        type: 'testplan_has_case',
        data: getEdgeData(data.testPlanId, 'testplan_has_case', node.id)
      });
    }
    
    // Build -> TestExecution + TestCase -> TestExecution
    if (node.type === 'TestExecution' && data.buildId && data.testCaseId) {
      edges.push({
        id: edgeId(),
        source: data.buildId,
        target: node.id,
        type: 'build_triggers_test',
        data: getEdgeData(data.buildId, 'build_triggers_test', node.id)
      });
      edges.push({
        id: edgeId(),
        source: data.testCaseId,
        target: node.id,
        type: 'case_executes',
        data: getEdgeData(data.testCaseId, 'case_executes', node.id)
      });
    }
    
    // TestExecution -> Defect
    if (node.type === 'Defect' && data.testExecutionId) {
      edges.push({
        id: edgeId(),
        source: data.testExecutionId,
        target: node.id,
        type: 'execution_finds_defect',
        data: getEdgeData(data.testExecutionId, 'execution_finds_defect', node.id)
      });
    }
    
    // Build -> Artifact
    if (node.type === 'Artifact' && data.buildId) {
      edges.push({
        id: edgeId(),
        source: data.buildId,
        target: node.id,
        type: 'build_produces_artifact',
        data: getEdgeData(data.buildId, 'build_produces_artifact', node.id)
      });
    }
    
    // Artifact -> Release
    if (node.type === 'Release' && data.artifactId) {
      edges.push({
        id: edgeId(),
        source: data.artifactId,
        target: node.id,
        type: 'artifact_releases',
        data: getEdgeData(data.artifactId, 'artifact_releases', node.id)
      });
      
      // Release -> ProductVersion
      if (data.productVersionId) {
        edges.push({
          id: edgeId(),
          source: node.id,
          target: data.productVersionId,
          type: 'release_relates_version',
          data: getEdgeData(node.id, 'release_relates_version', data.productVersionId)
        });
      }
    }
    
    // Release -> Deployment
    if (node.type === 'Deployment' && data.releaseId) {
      edges.push({
        id: edgeId(),
        source: data.releaseId,
        target: node.id,
        type: 'release_deploys',
        data: getEdgeData(data.releaseId, 'release_deploys', node.id)
      });
    }
    
    // DomainProject -> MetricSet
    if (node.type === 'MetricSet' && data.domainProjectId) {
      edges.push({
        id: edgeId(),
        source: data.domainProjectId,
        target: node.id,
        type: 'project_has_metricset',
        data: getEdgeData(data.domainProjectId, 'project_has_metricset', node.id)
      });
    }
    
    // MetricSet -> Metric
    if (node.type === 'Metric' && data.metricSetId) {
      edges.push({
        id: edgeId(),
        source: data.metricSetId,
        target: node.id,
        type: 'metricset_has_metric',
        data: getEdgeData(data.metricSetId, 'metricset_has_metric', node.id)
      });
    }
    
    // Metric -> MetricValue
    if (node.type === 'MetricValue' && data.metricId) {
      edges.push({
        id: edgeId(),
        source: data.metricId,
        target: node.id,
        type: 'metric_has_value',
        data: getEdgeData(data.metricId, 'metric_has_value', node.id)
      });
    }
    
    // User -> Team (via TeamMember)
    if (node.type === 'TeamMember' && data.userId && data.teamId) {
      edges.push({
        id: edgeId(),
        source: data.userId,
        target: node.id,
        type: 'user_in_team',
        data: getEdgeData(data.userId, 'user_in_team', node.id)
      });
      edges.push({
        id: edgeId(),
        source: data.teamId,
        target: node.id,
        type: 'team_has_member',
        data: getEdgeData(data.teamId, 'team_has_member', node.id)
      });
    }
    
    // DomainProject -> Team
    if (node.type === 'Team' && data.domainProjectId) {
      edges.push({
        id: edgeId(),
        source: data.domainProjectId,
        target: node.id,
        type: 'project_has_team',
        data: getEdgeData(data.domainProjectId, 'project_has_team', node.id)
      });
    }
  });
  
  return edges;
}

/**
 * 处理单个领域的数据
 */
function processGraph(graphName, sourceFile, outputFile) {
  console.log(`\n🔄 处理 ${graphName}...`);
  
  // 读取源文件
  const markdown = fs.readFileSync(sourceFile, 'utf8');
  
  // 提取所有JSON块
  const jsonBlocks = extractJsonBlocks(markdown);
  console.log(`   找到 ${jsonBlocks.length} 个JSON代码块`);
  
  // 创建节点
  const nodes = [];
  jsonBlocks.forEach(block => {
    if (Array.isArray(block)) {
      // 如果是数组，为每个元素创建节点
      block.forEach(item => {
        if (item.id) {
          const node = createNode(item);
          if (node) {
            nodes.push(node);
          }
        }
      });
    } else if (block.id) {
      // 如果是单个对象
      const node = createNode(block);
      if (node) {
        nodes.push(node);
      }
    }
  });
  
  // 添加智能驾驶领域共享的度量节点（从智能驾驶领域复用）
  if (graphName !== '智能驾驶研发体系') {
    // 添加MetricSet节点
    const metricSet = {
      id: 'MS-001',
      name: '研发效能度量集',
      description: '软件研发效能度量指标集合',
      ownerId: 'USER-PM-001'
    };
    const msNode = createNode(metricSet, 'MetricSet');
    if (msNode) {
      nodes.push(msNode);
    }
    
    const sharedMetrics = [
      {
        id: 'METRIC-001',
        metricSetId: 'MS-001',
        name: '需求交付周期',
        code: 'LEAD_TIME',
        unit: 'DAY',
        description: '从需求提出到交付上线的平均周期'
      },
      {
        id: 'METRIC-002',
        metricSetId: 'MS-001',
        name: '代码质量',
        code: 'CODE_QUALITY',
        unit: 'SCORE',
        description: '代码质量评分（0-100）'
      },
      {
        id: 'METRIC-003',
        metricSetId: 'MS-001',
        name: '测试覆盖率',
        code: 'TEST_COVERAGE',
        unit: 'PERCENTAGE',
        description: '单元测试覆盖率'
      },
      {
        id: 'METRIC-004',
        metricSetId: 'MS-001',
        name: '缺陷密度',
        code: 'DEFECT_DENSITY',
        unit: 'COUNT_PER_KLOC',
        description: '每千行代码的缺陷数'
      },
      {
        id: 'METRIC-005',
        metricSetId: 'MS-001',
        name: '算法准确率',
        code: 'ALGORITHM_ACCURACY',
        unit: 'PERCENTAGE',
        description: '感知算法的准确率'
      }
    ];
    
    sharedMetrics.forEach(metric => {
      const node = createNode(metric, 'Metric');
      if (node) {
        nodes.push(node);
      }
    });
  }
  
  console.log(`   创建了 ${nodes.length} 个节点`);
  
  // 统计节点类型
  const typeStats = {};
  nodes.forEach(node => {
    typeStats[node.type] = (typeStats[node.type] || 0) + 1;
  });
  console.log(`   节点类型分布:`);
  Object.entries(typeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });
  
  // 尝试从 core-domain-data.json 读取边的属性数据
  let sourceEdges = [];
  const coreDomainDataPath = path.join(dataPath, 'sample', 'core-domain-data.json');
  if (fs.existsSync(coreDomainDataPath)) {
    try {
      const coreDomainData = JSON.parse(fs.readFileSync(coreDomainDataPath, 'utf8'));
      if (coreDomainData.edges && Array.isArray(coreDomainData.edges)) {
        sourceEdges = coreDomainData.edges;
        console.log(`   从 core-domain-data.json 加载了 ${sourceEdges.length} 条原始边数据`);
      }
    } catch (error) {
      console.warn(`   无法读取 core-domain-data.json: ${error.message}`);
    }
  }
  
  // 创建边，传入原始边数据以保留属性
  const edges = createEdges(nodes, sourceEdges);
  console.log(`   创建了 ${edges.length} 条边`);
  
  // 统计有属性的边数量
  const edgesWithData = edges.filter(e => e.data && Object.keys(e.data).length > 0).length;
  if (edgesWithData > 0) {
    console.log(`   ✅ 其中 ${edgesWithData} 条边保留了属性数据`);
  }
  
  // 统计边类型
  const edgeTypeStats = {};
  edges.forEach(edge => {
    edgeTypeStats[edge.type] = (edgeTypeStats[edge.type] || 0) + 1;
  });
  console.log(`   边类型分布:`);
  Object.entries(edgeTypeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });
  
  // 构造完整的图谱数据
  const graphData = {
    schemaId: 'core-domain-schema-v2',
    schemaVersion: '2.0.0',
    data: {
      nodes: nodes,
      edges: edges
    },
    metadata: {
      name: graphName,
      createdAt: new Date().toISOString(),
      statistics: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodeTypes: typeStats,
        edgeTypes: edgeTypeStats
      }
    }
  };
  
  // 写入文件
  fs.writeFileSync(outputFile, JSON.stringify(graphData, null, 2), 'utf8');
  console.log(`   ✅ 图谱数据已保存: ${outputFile}`);
  
  return graphData;
}

// 主程序
async function main() {
  console.log('🚀 开始构造Schema V2.0的3个领域图谱数据...\n');
  
  // 确保输出目录存在
  if (!fs.existsSync(graphsDir)) {
    fs.mkdirSync(graphsDir, { recursive: true });
  }
  
  // 处理3个领域
  const graphs = [
    {
      name: '智能驾驶研发体系',
      sourceFile: adasSourcePath,
      outputFile: path.join(dataPath, 'adas-graph-v2-data.json')
    },
    {
      name: '智能座舱研发体系',
      sourceFile: cabinSourcePath,
      outputFile: path.join(dataPath, 'cabin-graph-v2-data.json')
    },
    {
      name: '电子电器研发体系',
      sourceFile: eeSourcePath,
      outputFile: path.join(dataPath, 'ee-graph-v2-data.json')
    }
  ];
  
  const results = [];
  
  for (const graph of graphs) {
    try {
      const result = processGraph(graph.name, graph.sourceFile, graph.outputFile);
      results.push({
        name: graph.name,
        nodeCount: result.data.nodes.length,
        edgeCount: result.data.edges.length,
        file: graph.outputFile
      });
    } catch (error) {
      console.error(`   ❌ 处理失败: ${error.message}`);
    }
  }
  
  // 汇总报告
  console.log('\n📊 构造完成汇总:\n');
  console.log('| 图谱 | 节点数 | 边数 | 文件 |');
  console.log('|------|--------|------|------|');
  results.forEach(r => {
    console.log(`| ${r.name} | ${r.nodeCount} | ${r.edgeCount} | ${path.basename(r.file)} |`);
  });
  
  const totalNodes = results.reduce((sum, r) => sum + r.nodeCount, 0);
  const totalEdges = results.reduce((sum, r) => sum + r.edgeCount, 0);
  console.log(`| **总计** | **${totalNodes}** | **${totalEdges}** | - |`);
  
  console.log('\n✅ 所有图谱数据构造完成！');
}

// 执行
main().catch(console.error);
