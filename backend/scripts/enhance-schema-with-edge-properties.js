#!/usr/bin/env node

/**
 * 为Schema中的关系类型添加properties定义
 * 基于业务规则和本体建模数据，为每种关系类型定义标准属性
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../../data/schemaVersions/core-domain-schema-v2.json');

// 读取Schema
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// 关系类型的标准属性定义
const relationProperties = {
  // 项目管理域关系
  'has_domain_project': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '车型包含领域项目'
    },
    'priority': {
      type: 'Enum',
      values: ['HIGH', 'MEDIUM', 'LOW'],
      description: '优先级'
    },
    'createdAt': {
      type: 'Date',
      description: '创建时间'
    }
  },
  'has_milestone': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '领域项目包含里程碑'
    },
    'sequence': {
      type: 'Integer',
      description: '里程碑顺序'
    },
    'dependency': {
      type: 'String',
      description: '依赖关系'
    }
  },
  'has_baseline': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '里程碑包含基线'
    },
    'freezeDate': {
      type: 'Date',
      description: '冻结日期'
    },
    'scope': {
      type: 'Text',
      description: '基线范围'
    }
  },
  
  // 产品管理域关系
  'has_product': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '产品线包含产品'
    },
    'priority': {
      type: 'Enum',
      values: ['HIGH', 'MEDIUM', 'LOW'],
      description: '优先级'
    }
  },
  'has_product_version': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '产品有版本'
    },
    'releaseDate': {
      type: 'Date',
      description: '发布日期'
    },
    'status': {
      type: 'Enum',
      values: ['PLANNING', 'DEVELOPING', 'RELEASED'],
      description: '版本状态'
    }
  },
  'version_relates_baseline': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '产品版本关联基线'
    },
    'relationType': {
      type: 'Enum',
      values: ['BASED_ON', 'INCLUDES', 'EXCLUDES'],
      description: '关联类型'
    }
  },
  'has_feature': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '产品包含特性'
    },
    'priority': {
      type: 'Enum',
      values: ['HIGH', 'MEDIUM', 'LOW'],
      description: '特性优先级'
    },
    'businessValue': {
      type: 'String',
      description: '业务价值'
    }
  },
  'has_module': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '特性包含模块'
    },
    'ownerTeamId': {
      type: 'String',
      description: '负责团队ID'
    },
    'complexity': {
      type: 'Enum',
      values: ['SIMPLE', 'MEDIUM', 'COMPLEX'],
      description: '复杂度'
    }
  },
  'feature_hierarchy': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '特性的父子关系'
    },
    'level': {
      type: 'Integer',
      description: '层级深度'
    }
  },
  
  // 需求管理域关系
  'epic_to_fr': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: 'Epic拆分为特性需求'
    },
    'decompositionRule': {
      type: 'String',
      description: '分解规则'
    },
    'priority': {
      type: 'Enum',
      values: ['HIGH', 'MEDIUM', 'LOW'],
      description: '需求优先级'
    }
  },
  'fr_to_mr': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '特性需求拆分为模块需求'
    },
    'traceability': {
      type: 'String',
      description: '可追溯性'
    },
    'coverage': {
      type: 'Float',
      description: '覆盖率（0-1）'
    }
  },
  'mr_to_ssts': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '模块需求细化为系统需求'
    },
    'refinementLevel': {
      type: 'Integer',
      description: '细化层级'
    }
  },
  'feature_carries_fr': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '业务特性承载特性需求'
    },
    'alignment': {
      type: 'Enum',
      values: ['ALIGNED', 'PARTIAL', 'MISALIGNED'],
      description: '对齐度'
    }
  },
  'module_carries_mr': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '业务模块承载模块需求'
    },
    'implementationStatus': {
      type: 'Enum',
      values: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      description: '实现状态'
    }
  },
  
  // 执行管理域关系
  'sprint_has_workitem': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: 'Sprint包含工作项'
    },
    'estimatedHours': {
      type: 'Float',
      description: '预估工时'
    },
    'actualHours': {
      type: 'Float',
      description: '实际工时'
    },
    'status': {
      type: 'Enum',
      values: ['TODO', 'IN_PROGRESS', 'DONE'],
      description: '工作项状态'
    }
  },
  'workitem_implements_mr': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '工作项实现模块需求'
    },
    'implementationType': {
      type: 'Enum',
      values: ['REQUIREMENT_TASK', 'TECHNICAL_TASK', 'TECHNICAL_DEBT'],
      description: '实现类型'
    },
    'progress': {
      type: 'Float',
      description: '完成进度（0-1）'
    }
  },
  'workitem_has_commit': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '工作项有代码提交'
    },
    'commitCount': {
      type: 'Integer',
      description: '提交次数'
    },
    'lastCommitDate': {
      type: 'Date',
      description: '最后提交时间'
    }
  },
  'commit_triggers_build': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '代码提交触发构建'
    },
    'buildStatus': {
      type: 'Enum',
      values: ['SUCCESS', 'FAILED', 'RUNNING'],
      description: '构建状态'
    },
    'buildDuration': {
      type: 'Integer',
      description: '构建时长（秒）'
    }
  },
  
  // 质量管理域关系
  'testplan_has_case': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '测试计划包含测试用例'
    },
    'testType': {
      type: 'Enum',
      values: ['UNIT', 'INTEGRATION', 'SYSTEM', 'ACCEPTANCE'],
      description: '测试类型'
    },
    'priority': {
      type: 'Enum',
      values: ['P0', 'P1', 'P2', 'P3'],
      description: '用例优先级'
    }
  },
  'build_triggers_test': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '构建触发测试'
    },
    'testStatus': {
      type: 'Enum',
      values: ['PASSED', 'FAILED', 'SKIPPED', 'RUNNING'],
      description: '测试状态'
    },
    'executionTime': {
      type: 'Integer',
      description: '执行时长（秒）'
    }
  },
  'execution_finds_defect': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '测试执行发现缺陷'
    },
    'severity': {
      type: 'Enum',
      values: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      description: '缺陷严重程度'
    },
    'foundDate': {
      type: 'Date',
      description: '发现日期'
    }
  },
  
  // 资产管理域关系
  'mr_uses_asset': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '模块需求使用资产'
    },
    'usageType': {
      type: 'Enum',
      values: ['DIRECT', 'INDIRECT', 'OPTIONAL'],
      description: '使用类型'
    },
    'versionConstraint': {
      type: 'String',
      description: '版本约束'
    }
  },
  'usage_refers_version': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '资产使用引用具体版本'
    },
    'version': {
      type: 'String',
      description: '版本号'
    },
    'compatibility': {
      type: 'Enum',
      values: ['COMPATIBLE', 'INCOMPATIBLE', 'UNKNOWN'],
      description: '兼容性'
    }
  },
  
  // 规划管理域关系
  'project_has_pi': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '领域项目规划PI'
    },
    'piNumber': {
      type: 'Integer',
      description: 'PI编号'
    },
    'startDate': {
      type: 'Date',
      description: '开始日期'
    },
    'endDate': {
      type: 'Date',
      description: '结束日期'
    }
  },
  'pi_has_sprint': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: 'PI包含Sprint'
    },
    'sprintNumber': {
      type: 'Integer',
      description: 'Sprint编号'
    },
    'capacity': {
      type: 'Float',
      description: '容量（人天）'
    }
  },
  'sprint_has_backlog': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: 'Sprint有待办列表'
    },
    'backlogSize': {
      type: 'Integer',
      description: '待办项数量'
    }
  },
  'backlog_refers_mr': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '待办关联模块需求'
    },
    'priority': {
      type: 'Enum',
      values: ['HIGH', 'MEDIUM', 'LOW'],
      description: '优先级'
    },
    'estimatedStoryPoints': {
      type: 'Integer',
      description: '预估故事点'
    }
  },
  
  // 交付管理域关系
  'build_produces_artifact': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '构建产生制品'
    },
    'artifactType': {
      type: 'Enum',
      values: ['LIBRARY', 'EXECUTABLE', 'PACKAGE', 'IMAGE'],
      description: '制品类型'
    },
    'size': {
      type: 'Integer',
      description: '大小（字节）'
    }
  },
  'artifact_releases': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '制品发布'
    },
    'releaseVersion': {
      type: 'String',
      description: '发布版本'
    },
    'releaseDate': {
      type: 'Date',
      description: '发布日期'
    }
  },
  'release_relates_version': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '发布关联产品版本'
    },
    'relationType': {
      type: 'Enum',
      values: ['CONTAINS', 'DEPENDS_ON', 'REPLACES'],
      description: '关联类型'
    }
  },
  
  // 通用关系
  'has_feature_package': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '产品打包特性'
    },
    'packageType': {
      type: 'Enum',
      values: ['STANDARD', 'CUSTOM', 'EXPERIMENTAL'],
      description: '包类型'
    }
  },
  'package_has_version': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '特性包有版本'
    },
    'version': {
      type: 'String',
      description: '版本号'
    },
    'releaseDate': {
      type: 'Date',
      description: '发布日期'
    }
  },
  'epic_in_product': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '产品包含Epic'
    },
    'priority': {
      type: 'Enum',
      values: ['HIGH', 'MEDIUM', 'LOW'],
      description: '优先级'
    },
    'businessValue': {
      type: 'String',
      description: '业务价值'
    }
  },
  'fr_has_version': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '特性需求有版本'
    },
    'version': {
      type: 'String',
      description: '版本号'
    },
    'changeLog': {
      type: 'Text',
      description: '变更日志'
    }
  },
  'mr_has_version': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '模块需求有版本'
    },
    'version': {
      type: 'String',
      description: '版本号'
    },
    'changeLog': {
      type: 'Text',
      description: '变更日志'
    }
  },
  'fr_has_prd': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '特性需求有PRD文档'
    },
    'documentVersion': {
      type: 'String',
      description: '文档版本'
    },
    'lastUpdated': {
      type: 'Date',
      description: '最后更新时间'
    }
  },
  'asset_has_version': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '资产有多个版本'
    },
    'version': {
      type: 'String',
      description: '版本号'
    },
    'releaseDate': {
      type: 'Date',
      description: '发布日期'
    }
  },
  'project_has_metricset': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '项目有度量集'
    },
    'metricSetType': {
      type: 'Enum',
      values: ['EFFICIENCY', 'QUALITY', 'VELOCITY'],
      description: '度量集类型'
    }
  },
  'metricset_has_metric': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '度量集有度量指标'
    },
    'unit': {
      type: 'String',
      description: '单位'
    },
    'targetValue': {
      type: 'Float',
      description: '目标值'
    }
  },
  'metric_has_value': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '度量指标有值'
    },
    'value': {
      type: 'Float',
      description: '度量值'
    },
    'recordedAt': {
      type: 'Date',
      description: '记录时间'
    }
  },
  'user_in_team': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '用户在团队中'
    },
    'role': {
      type: 'Enum',
      values: ['LEADER', 'MEMBER', 'CONTRIBUTOR'],
      description: '角色'
    },
    'joinedDate': {
      type: 'Date',
      description: '加入日期'
    }
  },
  'team_has_member': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '团队有成员'
    },
    'memberRole': {
      type: 'Enum',
      values: ['LEADER', 'MEMBER', 'CONTRIBUTOR'],
      description: '成员角色'
    }
  },
  'project_has_team': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '项目有团队'
    },
    'teamRole': {
      type: 'Enum',
      values: ['OWNER', 'CONTRIBUTOR', 'REVIEWER'],
      description: '团队角色'
    },
    'assignedDate': {
      type: 'Date',
      description: '分配日期'
    }
  },
  'workitem_has_log': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '工作项有日志'
    },
    'logType': {
      type: 'Enum',
      values: ['TIME_TRACKING', 'COMMENT', 'STATUS_CHANGE'],
      description: '日志类型'
    },
    'loggedAt': {
      type: 'Date',
      description: '记录时间'
    }
  },
  'mr_has_testplan': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '模块需求有测试计划'
    },
    'testPlanType': {
      type: 'Enum',
      values: ['UNIT', 'INTEGRATION', 'SYSTEM'],
      description: '测试计划类型'
    }
  },
  'case_executes': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '测试用例执行'
    },
    'executionStatus': {
      type: 'Enum',
      values: ['PASSED', 'FAILED', 'SKIPPED'],
      description: '执行状态'
    },
    'executedAt': {
      type: 'Date',
      description: '执行时间'
    }
  },
  'release_deploys': {
    'relationship': {
      type: 'String',
      description: '关系描述',
      example: '发布部署'
    },
    'deploymentEnvironment': {
      type: 'Enum',
      values: ['DEV', 'TEST', 'STAGING', 'PRODUCTION'],
      description: '部署环境'
    },
    'deployedAt': {
      type: 'Date',
      description: '部署时间'
    }
  }
};

// 为每个关系类型添加properties
Object.keys(schema.relationTypes).forEach(relationType => {
  if (relationProperties[relationType]) {
    schema.relationTypes[relationType].properties = relationProperties[relationType];
  } else {
    // 为没有定义的关系类型添加默认属性
    schema.relationTypes[relationType].properties = {
      'relationship': {
        type: 'String',
        description: '关系描述',
        example: schema.relationTypes[relationType].description || '关系描述'
      },
      'createdAt': {
        type: 'Date',
        description: '创建时间'
      }
    };
  }
});

// 保存更新后的Schema
fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), 'utf8');

console.log('✅ Schema已更新，为所有关系类型添加了properties定义');
console.log(`   共更新 ${Object.keys(schema.relationTypes).length} 个关系类型`);
