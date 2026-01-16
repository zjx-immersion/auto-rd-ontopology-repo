import React from 'react';
import { Card, Button, Collapse, Tag, Timeline, Descriptions, Empty } from 'antd';
import { CloseOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import './TraceResultPanel.css';

const { Panel } = Collapse;

const TraceResultPanel = ({ result, schema, onClose }) => {
  const renderUpstreamChain = () => {
    if (!result.upstream_chain || result.upstream_chain.length === 0) {
      return <Empty description="无上游追溯链" />;
    }

    return (
      <Timeline mode="left">
        {result.upstream_chain.map((item, index) => {
          const entityType = schema?.entityTypes?.[item.entity_type];
          return (
            <Timeline.Item 
              key={index}
              label={`Level ${item.level}`}
              color={entityType?.color || '#1890ff'}
            >
              <div>
                <Tag color={entityType?.color}>{entityType?.label || item.entity_type}</Tag>
                <div style={{ marginTop: 4 }}>
                  <strong>{item.entity_id}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {item.title || item.project_name || ''}
                </div>
                {item.owner && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    负责人: {item.owner}
                  </div>
                )}
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  const renderDownstreamChain = () => {
    if (!result.downstream_chain || result.downstream_chain.length === 0) {
      return <Empty description="无下游影响链" />;
    }

    return (
      <Timeline mode="left">
        {result.downstream_chain.map((item, index) => {
          const entityType = schema?.entityTypes?.[item.entity_type];
          return (
            <Timeline.Item 
              key={index}
              label={`Level ${item.level}`}
              color={entityType?.color || '#52c41a'}
            >
              <div>
                <Tag color={entityType?.color}>{entityType?.label || item.entity_type}</Tag>
                <div style={{ marginTop: 4 }}>
                  <strong>{item.entity_id}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {item.title || item.module_name || item.version_id || ''}
                </div>
                {item.status && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    状态: <Tag size="small">{item.status}</Tag>
                  </div>
                )}
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  const renderTestCoverage = () => {
    if (!result.test_coverage) {
      return null;
    }

    const { total_test_cases, passed, failed, issues } = result.test_coverage;

    return (
      <div>
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="总用例">{total_test_cases}</Descriptions.Item>
          <Descriptions.Item label="通过">
            <Tag color="success">{passed}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="失败">
            <Tag color="error">{failed}</Tag>
          </Descriptions.Item>
        </Descriptions>

        {issues && issues.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>发现的问题:</div>
            {issues.map((issue, index) => (
              <Card key={index} size="small" style={{ marginBottom: 8 }}>
                <div>
                  <Tag color="error">{issue.severity}</Tag>
                  <Tag>{issue.status}</Tag>
                </div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  {issue.description}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderChangeImpact = () => {
    if (!result.change_impact) {
      return null;
    }

    const impact = result.change_impact;

    return (
      <div>
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="风险等级">
            <Tag color={impact.risk_level === '高' ? 'error' : impact.risk_level === '中' ? 'warning' : 'success'}>
              {impact.risk_level}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="预估工作量">
            {impact.estimated_effort}
          </Descriptions.Item>
          <Descriptions.Item label="影响分数">
            {impact.impact_score}
          </Descriptions.Item>
          {impact.notified_owners && impact.notified_owners.length > 0 && (
            <Descriptions.Item label="通知人员">
              {impact.notified_owners.map((owner, i) => (
                <Tag key={i}>{owner}</Tag>
              ))}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="建议">
            {impact.recommendation}
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  return (
    <div className="trace-result-panel">
      <Card
        title={
          <span>
            追溯结果: {result.query_entity?.id}
          </span>
        }
        extra={
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={onClose}
          />
        }
        size="small"
      >
        <Collapse defaultActiveKey={['1', '2']} ghost>
          {result.upstream_chain && (
            <Panel 
              header={
                <span>
                  <ArrowUpOutlined /> 上游追溯链 ({result.upstream_chain.length})
                </span>
              } 
              key="1"
            >
              {renderUpstreamChain()}
            </Panel>
          )}

          {result.downstream_chain && (
            <Panel 
              header={
                <span>
                  <ArrowDownOutlined /> 下游影响链 ({result.downstream_chain.length})
                </span>
              } 
              key="2"
            >
              {renderDownstreamChain()}
            </Panel>
          )}

          {result.test_coverage && (
            <Panel header="测试覆盖" key="3">
              {renderTestCoverage()}
            </Panel>
          )}

          {result.change_impact && (
            <Panel header="变更影响分析" key="4">
              {renderChangeImpact()}
            </Panel>
          )}
        </Collapse>
      </Card>
    </div>
  );
};

export default TraceResultPanel;
