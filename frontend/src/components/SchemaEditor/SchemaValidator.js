import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  List,
  Tag,
  Collapse,
  Alert,
  Progress,
  Card,
  Descriptions,
  Badge,
  Empty,
  Tabs,
  Timeline
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  BranchesOutlined,

  InfoCircleOutlined
} from '@ant-design/icons';
import { validateSchema, analyzeSchemaChange, isValidPropertyType, VALID_PROPERTY_TYPES } from '../../utils/schemaValidators';

const { Title, Text } = Typography;
const { Panel } = Collapse;

/**
 * Schema验证结果展示组件
 */
const SchemaValidator = ({
  visible,
  schema,
  previousSchema, // 用于对比分析
  onClose,
  onFix
}) => {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('validation');
  const timeoutRef = useRef(null);

  // 清理timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 执行验证
  const handleValidate = useCallback(() => {
    setValidating(true);
    
    // 模拟异步验证
    timeoutRef.current = setTimeout(() => {
      const result = validateSchema(schema);
      
      // 额外检查
      const enhancedResult = enhanceValidation(schema, result);
      
      setValidationResult(enhancedResult);
      setValidating(false);
    }, 500);
  }, [schema]);

  // 增强验证 - 添加更多业务规则检查
  const enhanceValidation = (schema, baseResult) => {
    const errors = [...baseResult.errors];
    const warnings = [...baseResult.warnings];
    const info = [];

    // 检查实体类型命名规范
    Object.keys(schema.entityTypes || {}).forEach(code => {
      if (!/^[A-Z][a-zA-Z0-9_]*$/.test(code)) {
        errors.push({
          type: 'entity',
          code,
          field: 'code',
          message: `实体类型代码 "${code}" 不符合命名规范（应以大写字母开头，只能包含字母、数字和下划线）`,
          severity: 'error',
          suggestion: `建议改为: ${code.charAt(0).toUpperCase() + code.slice(1).replace(/[^a-zA-Z0-9_]/g, '_')}`
        });
      }
    });

    // 检查关系类型命名规范
    Object.keys(schema.relationTypes || {}).forEach(id => {
      if (!/^[a-z][a-z0-9_]*$/.test(id)) {
        errors.push({
          type: 'relation',
          id,
          field: 'id',
          message: `关系类型ID "${id}" 不符合命名规范（应以小写字母开头，只能包含小写字母、数字和下划线）`,
          severity: 'error',
          suggestion: `建议改为: ${id.charAt(0).toLowerCase() + id.slice(1).replace(/[^a-z0-9_]/g, '_').toLowerCase()}`
        });
      }
    });

    // 检查孤立的实体类型
    const allEntitiesInRelations = new Set();
    Object.values(schema.relationTypes || {}).forEach(rel => {
      (rel.from || []).forEach(e => allEntitiesInRelations.add(e));
      (rel.to || []).forEach(e => allEntitiesInRelations.add(e));
    });

    Object.keys(schema.entityTypes || {}).forEach(code => {
      if (!allEntitiesInRelations.has(code)) {
        warnings.push({
          type: 'entity',
          code,
          message: `实体类型 "${code}" 没有参与任何关系定义`,
          severity: 'warning',
          description: '孤立的实体类型无法通过关系与其他实体连接，建议为其定义关系或考虑删除',
          fixable: true
        });
      }
    });

    // 检查关系引用的实体是否存在
    Object.entries(schema.relationTypes || {}).forEach(([id, rel]) => {
      (rel.from || []).forEach(entityCode => {
        if (!schema.entityTypes?.[entityCode]) {
          errors.push({
            type: 'relation',
            id,
            field: 'from',
            from: entityCode,
            to: (rel.to || []).join(', '),
            message: `关系 "${id}" 的 "from" 字段引用了不存在的实体类型 "${entityCode}"`,
            severity: 'error',
            description: `关系定义中指定的来源实体 "${entityCode}" 在当前 Schema 中未定义，请先创建该实体类型或修改关系定义`,
            fixable: true
          });
        }
      });

      (rel.to || []).forEach(entityCode => {
        if (!schema.entityTypes?.[entityCode]) {
          errors.push({
            type: 'relation',
            id,
            field: 'to',
            from: (rel.from || []).join(', '),
            to: entityCode,
            message: `关系 "${id}" 的 "to" 字段引用了不存在的实体类型 "${entityCode}"`,
            severity: 'error',
            description: `关系定义中指定的目标实体 "${entityCode}" 在当前 Schema 中未定义，请先创建该实体类型或修改关系定义`,
            fixable: true
          });
        }
      });
    });

    // 检查属性定义
    Object.entries(schema.entityTypes || {}).forEach(([code, entity]) => {
      Object.entries(entity.properties || {}).forEach(([propName, prop]) => {
        if (!/^[a-z][a-zA-Z0-9_]*$/.test(propName)) {
          warnings.push({
            type: 'property',
            entity: code,
            code: code,
            property: propName,
            field: 'properties',
            message: `属性 "${propName}" 建议以小写字母开头`,
            severity: 'warning',
            description: `实体 "${code}" 中的属性 "${propName}" 命名不符合 camelCase 规范`,
            suggestion: `建议改为: ${propName.charAt(0).toLowerCase() + propName.slice(1).replace(/[^a-zA-Z0-9_]/g, '')}`,
            fixable: true
          });
        }
        
        // 检查属性类型是否有效
        if (prop.type && !isValidPropertyType(prop.type)) {
          const baseTypes = ['string', 'number', 'integer', 'float', 'boolean', 'date', 'datetime', 'array', 'object', 'text', 'enum', 'reference'];
          warnings.push({
            type: 'property',
            entity: code,
            code: code,
            property: propName,
            field: 'type',
            message: `属性 "${propName}" 使用了非标准的数据类型 "${prop.type}"`,
            severity: 'warning',
            description: `建议使用的类型: ${baseTypes.join(', ')}`,
            fixable: false
          });
        }
      });
    });

    // 统计信息
    const stats = {
      entityCount: Object.keys(schema.entityTypes || {}).length,
      relationCount: Object.keys(schema.relationTypes || {}).length,
      propertyCount: Object.values(schema.entityTypes || {}).reduce(
        (sum, e) => sum + Object.keys(e.properties || {}).length, 0
      ),
      errorCount: errors.length,
      warningCount: warnings.length,
      infoCount: info.length
    };

    return {
      ...baseResult,
      errors,
      warnings,
      info,
      stats,
      isValid: errors.length === 0
    };
  };

  // 计算健康度评分
  const calculateHealthScore = (result) => {
    if (!result) return 0;
    
    const { stats } = result;
    let score = 100;
    
    // 错误扣40分
    score -= stats.errorCount * 40;
    // 警告扣10分
    score -= stats.warningCount * 10;
    // 信息扣2分
    score -= stats.infoCount * 2;
    
    return Math.max(0, score);
  };

  // 获取严重性对应的Tag
  const getSeverityTag = (severity) => {
    const config = {
      error: { color: 'error', icon: <CloseCircleOutlined />, text: '错误' },
      warning: { color: 'warning', icon: <WarningOutlined />, text: '警告' },
      info: { color: 'default', icon: <InfoCircleOutlined />, text: '提示' }
    };
    const { color, icon, text } = config[severity] || config.info;
    return <Tag color={color} icon={icon}>{text}</Tag>;
  };

  // 渲染验证结果列表
  const renderValidationList = (items, type) => {
    if (!items || items.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`暂无${type === 'error' ? '错误' : type === 'warning' ? '警告' : '提示'}`}
        />
      );
    }

    return (
      <List
        dataSource={items}
        renderItem={(item, index) => (
          <List.Item
            key={index}
            actions={item.fixable ? [
              <Button size="small" type="link" onClick={() => onFix && onFix(item)}>
                修复
              </Button>
            ] : []}
          >
            <List.Item.Meta
              avatar={getSeverityTag(item.severity || type)}
              title={
                <Space wrap>
                  {item.type && (
                    <Tag color={
                      item.type === 'entity' ? 'blue' : 
                      item.type === 'relation' ? 'green' : 
                      item.type === 'property' ? 'purple' : 'default'
                    }>
                      {item.type === 'entity' ? '实体' : 
                       item.type === 'relation' ? '关系' : 
                       item.type === 'property' ? '属性' : item.type}
                    </Tag>
                  )}
                  {item.code && <Text code>{item.code}</Text>}
                  {item.id && <Text code>{item.id}</Text>}
                  {item.entity && !item.code && <Text code>{item.entity}</Text>}
                </Space>
              }
              description={
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {/* 主问题描述 */}
                  <Text>{item.message}</Text>
                  
                  {/* 详细信息 */}
                  <Space wrap size={8}>
                    {item.field && (
                      <Tag size="small" color="cyan">字段: {item.field}</Tag>
                    )}
                    {item.property && (
                      <Tag size="small" color="purple">属性: {item.property}</Tag>
                    )}
                    {item.from && (
                      <Tag size="small" color="orange">来源: {item.from}</Tag>
                    )}
                    {item.to && (
                      <Tag size="small" color="orange">目标: {item.to}</Tag>
                    )}
                  </Space>
                  
                  {/* 对象位置/路径信息 */}
                  {(item.code || item.id || item.entity) && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      位置: {item.type === 'entity' || item.code ? `实体类型 "${item.code || item.entity}"` : ''}
                            {item.type === 'relation' && item.id ? `关系类型 "${item.id}"` : ''}
                            {item.type === 'property' && item.property ? `属性 "${item.property}"` : ''}
                            {item.field ? ` / ${item.field}` : ''}
                    </Text>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  // 渲染统计卡片
  const renderStats = () => {
    if (!validationResult) return null;

    const { stats } = validationResult;
    const score = calculateHealthScore(validationResult);

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>Schema健康度</Title>
              <Text type="secondary">综合评分基于错误和警告数量</Text>
            </div>
            <Progress
              type="circle"
              percent={score}
              size={80}
              strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#f5222d'}
            />
          </Space>
        </Card>

        <Descriptions bordered column={3} size="small">
          <Descriptions.Item label="实体类型">
            <Badge count={stats.entityCount} showZero color="#1890ff" />
          </Descriptions.Item>
          <Descriptions.Item label="关系类型">
            <Badge count={stats.relationCount} showZero color="#52c41a" />
          </Descriptions.Item>
          <Descriptions.Item label="属性定义">
            <Badge count={stats.propertyCount} showZero color="#722ed1" />
          </Descriptions.Item>
          <Descriptions.Item label="错误">
            <Badge count={stats.errorCount} showZero color="#f5222d" />
          </Descriptions.Item>
          <Descriptions.Item label="警告">
            <Badge count={stats.warningCount} showZero color="#faad14" />
          </Descriptions.Item>
          <Descriptions.Item label="提示">
            <Badge count={stats.infoCount} showZero color="#8c8c8c" />
          </Descriptions.Item>
        </Descriptions>
      </Space>
    );
  };

  // 渲染对比分析
  const renderComparison = () => {
    if (!previousSchema) {
      return (
        <Empty description="需要提供历史Schema版本进行对比分析" />
      );
    }

    const impact = analyzeSchemaChange(previousSchema, schema);

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          type="warning"
          message="破坏性变更"
          description={
            impact.breaking.length > 0 ? (
              <Timeline>
                {impact.breaking.map((item, idx) => (
                  <Timeline.Item key={idx} color="red">
                    {item.message}
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : '无破坏性变更'
          }
        />

        <Alert
          type="info"
          message="非破坏性变更"
          description={
            impact.nonBreaking.length > 0 ? (
              <Timeline>
                {impact.nonBreaking.map((item, idx) => (
                  <Timeline.Item key={idx} color="green">
                    {item.message}
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : '无非破坏性变更'
          }
        />
      </Space>
    );
  };

  return (
    <Modal
      title="Schema验证"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button
          key="validate"
          type="primary"
          loading={validating}
          onClick={handleValidate}
        >
          开始验证
        </Button>
      ]}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'validation',
            label: (
              <span>
                <CheckCircleOutlined />
                验证结果
              </span>
            ),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {!validationResult ? (
                  <Alert
                    message='点击"开始验证"按钮检查Schema的完整性和规范性'
                    type="info"
                    showIcon
                  />
                ) : (
                  <>
                    {validationResult.isValid ? (
                      <Alert
                        type="success"
                        showIcon
                        message="Schema验证通过"
                        description="当前Schema定义符合所有规范要求"
                      />
                    ) : (
                      <Alert
                        type="error"
                        showIcon
                        message="Schema验证失败"
                        description={`发现 ${validationResult.errors.length} 个错误，请先修复后再保存`}
                      />
                    )}

                    {renderStats()}

                    <Collapse 
                      defaultActiveKey={['errors']}
                      items={[
                        {
                          key: 'errors',
                          label: `错误 (${validationResult.stats.errorCount})`,
                          extra: validationResult.stats.errorCount > 0 ? <CloseCircleOutlined style={{ color: '#f5222d' }} /> : null,
                          children: renderValidationList(validationResult.errors, 'error')
                        },
                        {
                          key: 'warnings',
                          label: `警告 (${validationResult.stats.warningCount})`,
                          extra: validationResult.stats.warningCount > 0 ? <WarningOutlined style={{ color: '#faad14' }} /> : null,
                          children: renderValidationList(validationResult.warnings, 'warning')
                        },
                        {
                          key: 'info',
                          label: `提示 (${validationResult.stats.infoCount})`,
                          children: renderValidationList(validationResult.info, 'info')
                        }
                      ]}
                    />
                  </>
                )}
              </Space>
            )
          },
          ...(previousSchema ? [{
            key: 'comparison',
            label: (
              <span>
                <BranchesOutlined />
                变更分析
              </span>
            ),
            children: renderComparison()
          }] : []),
          {
            key: 'guidelines',
            label: (
              <span>
                <FileTextOutlined />
                规范说明
              </span>
            ),
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card title="实体类型命名规范" size="small">
                  <ul>
                    <li>代码必须以<strong>大写字母</strong>开头</li>
                    <li>只能包含字母、数字和下划线</li>
                    <li>示例: <code>Vehicle</code>, <code>ProjectMilestone</code></li>
                  </ul>
                </Card>
                <Card title="关系类型命名规范" size="small">
                  <ul>
                    <li>ID必须以<strong>小写字母</strong>开头</li>
                    <li>使用下划线连接多个单词</li>
                    <li>示例: <code>belongs_to</code>, <code>depends_on</code></li>
                  </ul>
                </Card>
                <Card title="属性命名规范" size="small">
                  <ul>
                    <li>名称以<strong>小写字母</strong>开头</li>
                    <li>使用camelCase或下划线命名</li>
                    <li>示例: <code>createdAt</code>, <code>priority_level</code></li>
                  </ul>
                </Card>
              </Space>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default SchemaValidator;
