import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Tabs, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input,
  Descriptions,
  Collapse,
  Statistic,
  Row,
  Col,
  message,
  Modal,
  Tooltip,
  Badge,
  Divider
} from 'antd';
import {
  DownloadOutlined,
  SearchOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  CodeOutlined
} from '@ant-design/icons';
import './SchemaViewer.css';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Search } = Input;

const SchemaViewer = ({ schema, data }) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [exportModalVisible, setExportModalVisible] = useState(false);

  // 分析数据中实际使用的类型
  const usageAnalysis = useMemo(() => {
    if (!data || !schema) return null;

    const nodes = data.nodes || [];
    const edges = data.edges || [];

    // 统计节点类型使用情况
    const nodeTypeUsage = {};
    nodes.forEach(node => {
      nodeTypeUsage[node.type] = (nodeTypeUsage[node.type] || 0) + 1;
    });

    // 统计边类型使用情况
    const edgeTypeUsage = {};
    edges.forEach(edge => {
      edgeTypeUsage[edge.type] = (edgeTypeUsage[edge.type] || 0) + 1;
    });

    // 检测未定义的类型
    const undefinedNodeTypes = Object.keys(nodeTypeUsage).filter(
      type => !schema.entityTypes[type]
    );
    const undefinedEdgeTypes = Object.keys(edgeTypeUsage).filter(
      type => !schema.relationTypes[type]
    );

    return {
      nodeTypeUsage,
      edgeTypeUsage,
      undefinedNodeTypes,
      undefinedEdgeTypes,
      totalNodes: nodes.length,
      totalEdges: edges.length
    };
  }, [data, schema]);

  // 实体类型表格数据
  const entityTableData = useMemo(() => {
    if (!schema?.entityTypes) return [];
    
    return Object.entries(schema.entityTypes)
      .map(([typeId, typeDef]) => ({
        key: typeId,
        typeId,
        code: typeDef.code,
        label: typeDef.label,
        color: typeDef.color,
        propertiesCount: Object.keys(typeDef.properties || {}).length,
        usage: usageAnalysis?.nodeTypeUsage[typeId] || 0,
        isDefined: true,
        ...typeDef
      }))
      .filter(item => 
        !searchText || 
        item.typeId.toLowerCase().includes(searchText.toLowerCase()) ||
        item.label.toLowerCase().includes(searchText.toLowerCase())
      );
  }, [schema, searchText, usageAnalysis]);

  // 关系类型表格数据
  const relationTableData = useMemo(() => {
    if (!schema?.relationTypes) return [];
    
    return Object.entries(schema.relationTypes)
      .map(([typeId, typeDef]) => ({
        key: typeId,
        typeId,
        label: typeDef.label,
        description: typeDef.description,
        from: typeDef.from || [],
        to: typeDef.to || [],
        usage: usageAnalysis?.edgeTypeUsage[typeId] || 0,
        isDefined: true,
        ...typeDef
      }))
      .filter(item => 
        !searchText || 
        item.typeId.toLowerCase().includes(searchText.toLowerCase()) ||
        item.label.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchText.toLowerCase())
      );
  }, [schema, searchText, usageAnalysis]);

  // 导出Schema
  const handleExport = (format = 'json') => {
    try {
      let content, filename, mimeType;

      if (format === 'json') {
        content = JSON.stringify(schema, null, 2);
        filename = `schema_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else if (format === 'markdown') {
        content = generateMarkdown();
        filename = `schema_${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      message.success(`Schema已导出为 ${filename}`);
      setExportModalVisible(false);
    } catch (error) {
      message.error('导出失败: ' + error.message);
    }
  };

  // 生成Markdown文档
  const generateMarkdown = () => {
    let md = `# ${schema.name}\n\n`;
    md += `**版本**: ${schema.version}\n\n`;
    md += `**描述**: ${schema.description}\n\n`;
    md += `---\n\n`;

    // 实体类型
    md += `## 实体类型 (${Object.keys(schema.entityTypes).length}种)\n\n`;
    Object.entries(schema.entityTypes).forEach(([typeId, typeDef]) => {
      md += `### ${typeDef.label} (\`${typeId}\`)\n\n`;
      md += `- **编码**: ${typeDef.code}\n`;
      md += `- **颜色**: ${typeDef.color}\n`;
      md += `- **使用量**: ${usageAnalysis?.nodeTypeUsage[typeId] || 0} 个实例\n\n`;
      
      if (typeDef.properties) {
        md += `**属性列表**:\n\n`;
        md += `| 属性名 | 类型 | 必填 | 约束 |\n`;
        md += `|--------|------|------|------|\n`;
        Object.entries(typeDef.properties).forEach(([propName, propDef]) => {
          md += `| ${propName} | ${propDef.type} | ${propDef.required ? '✅' : '❌'} | ${propDef.constraint || '-'} |\n`;
        });
        md += `\n`;
      }
    });

    // 关系类型
    md += `\n## 关系类型 (${Object.keys(schema.relationTypes).length}种)\n\n`;
    md += `| 类型ID | 标签 | 说明 | 源类型 | 目标类型 | 使用量 |\n`;
    md += `|--------|------|------|--------|----------|--------|\n`;
    Object.entries(schema.relationTypes).forEach(([typeId, typeDef]) => {
      const usage = usageAnalysis?.edgeTypeUsage[typeId] || 0;
      md += `| \`${typeId}\` | ${typeDef.label} | ${typeDef.description || '-'} | ${(typeDef.from || []).join(', ')} | ${(typeDef.to || []).join(', ')} | ${usage} |\n`;
    });

    // 未定义类型警告
    if (usageAnalysis?.undefinedNodeTypes.length > 0 || usageAnalysis?.undefinedEdgeTypes.length > 0) {
      md += `\n## ⚠️ 未定义类型\n\n`;
      
      if (usageAnalysis.undefinedNodeTypes.length > 0) {
        md += `### 未定义的实体类型\n\n`;
        usageAnalysis.undefinedNodeTypes.forEach(type => {
          md += `- \`${type}\` (${usageAnalysis.nodeTypeUsage[type]} 个实例)\n`;
        });
        md += `\n`;
      }

      if (usageAnalysis.undefinedEdgeTypes.length > 0) {
        md += `### 未定义的关系类型\n\n`;
        usageAnalysis.undefinedEdgeTypes.forEach(type => {
          md += `- \`${type}\` (${usageAnalysis.edgeTypeUsage[type]} 条关系)\n`;
        });
      }
    }

    md += `\n---\n\n`;
    md += `**导出时间**: ${new Date().toLocaleString('zh-CN')}\n`;

    return md;
  };

  // 复制JSON到剪贴板
  const handleCopyJSON = () => {
    const jsonStr = JSON.stringify(schema, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      message.success('Schema JSON已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  if (!schema) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <DatabaseOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>暂无Schema数据</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="schema-viewer-container">
      {/* 顶部统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Schema版本"
              value={schema.version}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="实体类型"
              value={Object.keys(schema.entityTypes || {}).length}
              suffix="种"
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="关系类型"
              value={Object.keys(schema.relationTypes || {}).length}
              suffix="种"
              prefix={<BranchesOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="未定义类型"
              value={
                (usageAnalysis?.undefinedNodeTypes.length || 0) +
                (usageAnalysis?.undefinedEdgeTypes.length || 0)
              }
              suffix="个"
              prefix={<WarningOutlined />}
              valueStyle={{ 
                color: (usageAnalysis?.undefinedNodeTypes.length || 0) +
                       (usageAnalysis?.undefinedEdgeTypes.length || 0) > 0 
                  ? '#faad14' : '#52c41a' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主内容区 */}
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>{schema.name}</span>
          </Space>
        }
        extra={
          <Space>
            <Search
              placeholder="搜索类型..."
              allowClear
              style={{ width: 200 }}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => setExportModalVisible(true)}
            >
              导出Schema
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 概览 */}
          <TabPane 
            tab={<span><FileTextOutlined />概览</span>} 
            key="overview"
          >
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Schema名称">
                {schema.name}
              </Descriptions.Item>
              <Descriptions.Item label="版本">
                {schema.version}
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {schema.description}
              </Descriptions.Item>
              <Descriptions.Item label="实体类型数">
                {Object.keys(schema.entityTypes || {}).length} 种
              </Descriptions.Item>
              <Descriptions.Item label="关系类型数">
                {Object.keys(schema.relationTypes || {}).length} 种
              </Descriptions.Item>
              {usageAnalysis && (
                <>
                  <Descriptions.Item label="数据实例">
                    {usageAnalysis.totalNodes} 个节点，{usageAnalysis.totalEdges} 条关系
                  </Descriptions.Item>
                  <Descriptions.Item label="Schema健康度">
                    <Space>
                      {usageAnalysis.undefinedNodeTypes.length === 0 && 
                       usageAnalysis.undefinedEdgeTypes.length === 0 ? (
                        <Tag icon={<CheckCircleOutlined />} color="success">
                          完整定义
                        </Tag>
                      ) : (
                        <Tag icon={<WarningOutlined />} color="warning">
                          有 {usageAnalysis.undefinedNodeTypes.length + usageAnalysis.undefinedEdgeTypes.length} 个未定义类型
                        </Tag>
                      )}
                    </Space>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {/* 未定义类型警告 */}
            {usageAnalysis && (
              usageAnalysis.undefinedNodeTypes.length > 0 || 
              usageAnalysis.undefinedEdgeTypes.length > 0
            ) && (
              <Card 
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    <span>未定义类型检测</span>
                  </Space>
                }
                style={{ marginTop: 16 }}
                size="small"
              >
                {usageAnalysis.undefinedNodeTypes.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                      未定义的实体类型:
                    </div>
                    <Space wrap>
                      {usageAnalysis.undefinedNodeTypes.map(type => (
                        <Tag key={type} color="orange">
                          {type} ({usageAnalysis.nodeTypeUsage[type]} 个实例)
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
                {usageAnalysis.undefinedEdgeTypes.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                      未定义的关系类型:
                    </div>
                    <Space wrap>
                      {usageAnalysis.undefinedEdgeTypes.map(type => (
                        <Tag key={type} color="orange">
                          {type} ({usageAnalysis.edgeTypeUsage[type]} 条关系)
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Card>
            )}
          </TabPane>

          {/* 实体类型 */}
          <TabPane 
            tab={<span><NodeIndexOutlined />实体类型 ({entityTableData.length})</span>} 
            key="entities"
          >
            <Table
              dataSource={entityTableData}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              size="small"
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: 16 }}>
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="类型ID" span={2}>
                        <Tag>{record.typeId}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="编码">
                        {record.code}
                      </Descriptions.Item>
                      <Descriptions.Item label="颜色">
                        <Tag color={record.color}>{record.color}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="使用量" span={2}>
                        {record.usage} 个实例
                      </Descriptions.Item>
                    </Descriptions>

                    {record.properties && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>属性列表:</div>
                        <Table
                          dataSource={Object.entries(record.properties).map(([name, def]) => ({
                            key: name,
                            name,
                            ...def
                          }))}
                          pagination={false}
                          size="small"
                          columns={[
                            { title: '属性名', dataIndex: 'name', key: 'name' },
                            { title: '类型', dataIndex: 'type', key: 'type', render: (text) => <Tag color="blue">{text}</Tag> },
                            { 
                              title: '必填', 
                              dataIndex: 'required', 
                              key: 'required',
                              render: (required) => required ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : '-'
                            },
                            { title: '约束', dataIndex: 'constraint', key: 'constraint', ellipsis: true },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                )
              }}
              columns={[
                {
                  title: '序号',
                  width: 60,
                  render: (_, __, index) => index + 1
                },
                {
                  title: '类型名称',
                  dataIndex: 'label',
                  key: 'label',
                  render: (text, record) => (
                    <Space>
                      <Badge color={record.color} />
                      <span style={{ fontWeight: 500 }}>{text}</span>
                    </Space>
                  )
                },
                {
                  title: '类型ID',
                  dataIndex: 'typeId',
                  key: 'typeId',
                  render: (text) => <Tag>{text}</Tag>
                },
                {
                  title: '编码',
                  dataIndex: 'code',
                  key: 'code',
                  width: 100
                },
                {
                  title: '属性数',
                  dataIndex: 'propertiesCount',
                  key: 'propertiesCount',
                  width: 80,
                  sorter: (a, b) => a.propertiesCount - b.propertiesCount,
                },
                {
                  title: '使用量',
                  dataIndex: 'usage',
                  key: 'usage',
                  width: 100,
                  sorter: (a, b) => a.usage - b.usage,
                  defaultSortOrder: 'descend',
                  render: (usage) => (
                    <Tag color={usage > 0 ? 'green' : 'default'}>
                      {usage} 个
                    </Tag>
                  )
                }
              ]}
            />
          </TabPane>

          {/* 关系类型 */}
          <TabPane 
            tab={<span><BranchesOutlined />关系类型 ({relationTableData.length})</span>} 
            key="relations"
          >
            <Table
              dataSource={relationTableData}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              size="small"
              columns={[
                {
                  title: '序号',
                  width: 60,
                  render: (_, __, index) => index + 1
                },
                {
                  title: '关系名称',
                  dataIndex: 'label',
                  key: 'label',
                  render: (text) => <Tag color="purple">{text}</Tag>
                },
                {
                  title: '类型ID',
                  dataIndex: 'typeId',
                  key: 'typeId',
                  render: (text) => <code>{text}</code>
                },
                {
                  title: '说明',
                  dataIndex: 'description',
                  key: 'description',
                  ellipsis: true,
                  render: (text) => (
                    <Tooltip title={text}>
                      <span style={{ color: '#666' }}>{text || '-'}</span>
                    </Tooltip>
                  )
                },
                {
                  title: '源类型',
                  dataIndex: 'from',
                  key: 'from',
                  width: 150,
                  render: (from) => (
                    <Space size={4} wrap>
                      {(from || []).map((type, idx) => (
                        <Tag key={idx} size="small" color="green">{type}</Tag>
                      ))}
                    </Space>
                  )
                },
                {
                  title: '目标类型',
                  dataIndex: 'to',
                  key: 'to',
                  width: 150,
                  render: (to) => (
                    <Space size={4} wrap>
                      {(to || []).map((type, idx) => (
                        <Tag key={idx} size="small" color="blue">{type}</Tag>
                      ))}
                    </Space>
                  )
                },
                {
                  title: '使用量',
                  dataIndex: 'usage',
                  key: 'usage',
                  width: 100,
                  sorter: (a, b) => a.usage - b.usage,
                  defaultSortOrder: 'descend',
                  render: (usage) => (
                    <Tag color={usage > 0 ? 'blue' : 'default'}>
                      {usage} 条
                    </Tag>
                  )
                }
              ]}
            />
          </TabPane>

          {/* JSON视图 */}
          <TabPane 
            tab={<span><CodeOutlined />JSON视图</span>} 
            key="json"
          >
            <div style={{ position: 'relative' }}>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleCopyJSON}
                style={{ position: 'absolute', right: 16, top: 16, zIndex: 1 }}
              >
                复制JSON
              </Button>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 24, 
                borderRadius: 4,
                maxHeight: '600px',
                overflow: 'auto'
              }}>
                {JSON.stringify(schema, null, 2)}
              </pre>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 导出Modal */}
      <Modal
        title="导出Schema"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card 
            hoverable 
            onClick={() => handleExport('json')}
            style={{ cursor: 'pointer' }}
          >
            <Space>
              <CodeOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>导出为 JSON</div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  标准JSON格式，可用于程序处理
                </div>
              </div>
            </Space>
          </Card>

          <Card 
            hoverable 
            onClick={() => handleExport('markdown')}
            style={{ cursor: 'pointer' }}
          >
            <Space>
              <FileTextOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>导出为 Markdown</div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  文档格式，便于阅读和分享
                </div>
              </div>
            </Space>
          </Card>
        </Space>
      </Modal>
    </div>
  );
};

export default SchemaViewer;
