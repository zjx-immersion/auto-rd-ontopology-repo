import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  Typography,
  Timeline,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Empty,
  Card,
  Descriptions,
  Badge,
  Tabs,
  Divider
} from 'antd';
import {
  HistoryOutlined,
  RollbackOutlined,
  DiffOutlined,
  BranchesOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MessageOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * 版本历史组件
 */
const VersionHistory = ({
  visible,
  resourceId,
  resourceType = 'schema',
  currentVersion,
  onClose,
  onRollback,
  onCompare
}) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [diffResult, setDiffResult] = useState(null);
  const [activeTab, setActiveTab] = useState('history');

  // 模拟加载版本历史
  useEffect(() => {
    if (visible) {
      loadVersionHistory();
    }
  }, [visible, resourceId]);

  const loadVersionHistory = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockVersions = generateMockVersions();
      setVersions(mockVersions);
    } catch (error) {
      message.error('加载版本历史失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成模拟版本数据
  const generateMockVersions = () => {
    return [
      {
        id: 'ver_1',
        version: '1.0.3',
        comment: '修复关系类型定义错误',
        createdBy: '张三',
        createdAt: dayjs().subtract(2, 'hour').toISOString(),
        hash: 'a1b2c3d4',
        parentVersionId: 'ver_2'
      },
      {
        id: 'ver_2',
        version: '1.0.2',
        comment: '添加新的实体类型 "Feature"',
        createdBy: '李四',
        createdAt: dayjs().subtract(1, 'day').toISOString(),
        hash: 'e5f6g7h8',
        parentVersionId: 'ver_3'
      },
      {
        id: 'ver_3',
        version: '1.0.1',
        comment: '优化属性定义',
        createdBy: '王五',
        createdAt: dayjs().subtract(3, 'day').toISOString(),
        hash: 'i9j0k1l2',
        parentVersionId: 'ver_4'
      },
      {
        id: 'ver_4',
        version: '1.0.0',
        comment: '初始版本',
        createdBy: '系统',
        createdAt: dayjs().subtract(7, 'day').toISOString(),
        hash: 'm3n4o5p6',
        parentVersionId: null
      }
    ];
  };

  // 处理回滚
  const handleRollback = async (version) => {
    try {
      await onRollback?.(version);
      message.success(`已回滚到版本 ${version.version}`);
      onClose();
    } catch (error) {
      message.error('回滚失败: ' + error.message);
    }
  };

  // 处理版本对比
  const handleCompare = () => {
    if (selectedVersions.length !== 2) {
      message.warning('请选择两个版本进行对比');
      return;
    }

    const [v1, v2] = selectedVersions;
    
    // 模拟对比结果
    const mockDiff = {
      added: {
        entityTypes: [{ code: 'Feature', label: '特性' }],
        relationTypes: []
      },
      removed: {
        entityTypes: [],
        relationTypes: [{ id: 'old_rel', label: '旧关系' }]
      },
      modified: {
        entityTypes: [{
          code: 'Epic',
          old: { color: '#1890ff' },
          new: { color: '#52c41a' }
        }],
        relationTypes: []
      }
    };

    setDiffResult(mockDiff);
    setActiveTab('diff');
  };

  // 表格列定义
  const columns = [
    {
      title: '版本',
      dataIndex: 'version',
      width: 100,
      render: (version, record) => (
        <Space>
          <Badge 
            count={version} 
            style={{ 
              backgroundColor: record.id === currentVersion?.id ? '#52c41a' : '#1890ff' 
            }} 
          />
          {record.id === currentVersion?.id && (
            <Tag color="green">当前</Tag>
          )}
        </Space>
      )
    },
    {
      title: '提交信息',
      dataIndex: 'comment',
      render: (comment, record) => (
        <Space direction="vertical" size={0}>
          <Text>{comment}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined /> {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
          </Text>
        </Space>
      )
    },
    {
      title: '作者',
      dataIndex: 'createdBy',
      width: 120,
      render: (user) => (
        <Space>
          <UserOutlined />
          <Text>{user}</Text>
        </Space>
      )
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      width: 100,
      render: (hash) => <code style={{ fontSize: 12 }}>{hash?.substring(0, 8)}</code>
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="回滚到此版本">
            <Popconfirm
              title="确认回滚？"
              description={`将回滚到版本 ${record.version}，当前修改将丢失`}
              onConfirm={() => handleRollback(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button 
                type="text" 
                icon={<RollbackOutlined />} 
                disabled={record.id === currentVersion?.id}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="查看详情">
            <Button type="text" icon={<FileTextOutlined />} />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 行选择配置
  const rowSelection = {
    type: 'checkbox',
    selectedRowKeys: selectedVersions.map(v => v.id),
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedVersions(selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: selectedVersions.length >= 2 && !selectedVersions.find(v => v.id === record.id)
    })
  };

  // 渲染版本时间线
  const renderTimeline = () => {
    if (versions.length === 0) {
      return <Empty description="暂无版本历史" />;
    }

    return (
      <Timeline mode="left">
        {versions.map((version, index) => (
          <Timeline.Item
            key={version.id}
            dot={index === 0 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null}
            label={dayjs(version.createdAt).format('MM-DD HH:mm')}
          >
            <Card size="small" style={{ marginBottom: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Badge 
                    count={version.version} 
                    style={{ 
                      backgroundColor: version.id === currentVersion?.id ? '#52c41a' : '#1890ff' 
                    }} 
                  />
                  {version.id === currentVersion?.id && <Tag color="green">当前版本</Tag>}
                </Space>
                <Text>
                  <MessageOutlined /> {version.comment}
                </Text>
                <Space>
                  <Text type="secondary"><UserOutlined /> {version.createdBy}</Text>
                  <Text type="secondary" copyable>
                    <FileTextOutlined /> {version.hash?.substring(0, 8)}
                  </Text>
                </Space>
                <Space>
                  <Button 
                    size="small" 
                    icon={<RollbackOutlined />}
                    disabled={version.id === currentVersion?.id}
                    onClick={() => handleRollback(version)}
                  >
                    回滚
                  </Button>
                </Space>
              </Space>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  // 渲染对比结果
  const renderDiff = () => {
    if (!diffResult) {
      return (
        <Empty description="请选择两个版本进行对比">
          <Button type="primary" onClick={() => setActiveTab('history')}>
            去选择版本
          </Button>
        </Empty>
      );
    }

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message={`对比结果: ${selectedVersions[0]?.version} vs ${selectedVersions[1]?.version}`}
          type="info"
          showIcon
          action={
            <Button size="small" onClick={() => setDiffResult(null)}>
              清除
            </Button>
          }
        />

        <Card title="新增内容" size="small">
          {diffResult.added.entityTypes.length > 0 && (
            <>
              <Text strong>实体类型:</Text>
              <ul>
                {diffResult.added.entityTypes.map(e => (
                  <li key={e.code}>{e.code} - {e.label}</li>
                ))}
              </ul>
            </>
          )}
          {diffResult.added.relationTypes.length > 0 && (
            <>
              <Text strong>关系类型:</Text>
              <ul>
                {diffResult.added.relationTypes.map(r => (
                  <li key={r.id}>{r.id} - {r.label}</li>
                ))}
              </ul>
            </>
          )}
          {diffResult.added.entityTypes.length === 0 && 
           diffResult.added.relationTypes.length === 0 && (
            <Text type="secondary">无新增内容</Text>
          )}
        </Card>

        <Card title="删除内容" size="small">
          {diffResult.removed.entityTypes.length > 0 && (
            <>
              <Text strong>实体类型:</Text>
              <ul>
                {diffResult.removed.entityTypes.map(e => (
                  <li key={e.code} style={{ color: '#f5222d' }}>{e.code} - {e.label}</li>
                ))}
              </ul>
            </>
          )}
          {diffResult.removed.relationTypes.length > 0 && (
            <>
              <Text strong>关系类型:</Text>
              <ul>
                {diffResult.removed.relationTypes.map(r => (
                  <li key={r.id} style={{ color: '#f5222d' }}>{r.id} - {r.label}</li>
                ))}
              </ul>
            </>
          )}
          {diffResult.removed.entityTypes.length === 0 && 
           diffResult.removed.relationTypes.length === 0 && (
            <Text type="secondary">无删除内容</Text>
          )}
        </Card>

        <Card title="修改内容" size="small">
          {diffResult.modified.entityTypes.length > 0 && (
            <>
              <Text strong>实体类型:</Text>
              {diffResult.modified.entityTypes.map(e => (
                <Descriptions key={e.code} size="small" bordered column={2}>
                  <Descriptions.Item label="Code">{e.code}</Descriptions.Item>
                  <Descriptions.Item label="变更">
                    <Tag color="orange">修改</Tag>
                  </Descriptions.Item>
                </Descriptions>
              ))}
            </>
          )}
          {diffResult.modified.relationTypes.length > 0 && (
            <>
              <Text strong>关系类型:</Text>
              {diffResult.modified.relationTypes.map(r => (
                <Descriptions key={r.id} size="small" bordered column={2}>
                  <Descriptions.Item label="ID">{r.id}</Descriptions.Item>
                  <Descriptions.Item label="变更">
                    <Tag color="orange">修改</Tag>
                  </Descriptions.Item>
                </Descriptions>
              ))}
            </>
          )}
          {diffResult.modified.entityTypes.length === 0 && 
           diffResult.modified.relationTypes.length === 0 && (
            <Text type="secondary">无修改内容</Text>
          )}
        </Card>
      </Space>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          版本历史
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <BranchesOutlined />
              版本列表
            </span>
          } 
          key="history"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="提示"
              description="选择两个版本可进行对比，点击回滚可恢复到指定版本"
              type="info"
              showIcon
              action={
                selectedVersions.length === 2 && (
                  <Button 
                    size="small" 
                    type="primary" 
                    icon={<DiffOutlined />}
                    onClick={handleCompare}
                  >
                    对比
                  </Button>
                )
              }
            />

            <Table
              rowKey="id"
              columns={columns}
              dataSource={versions}
              loading={loading}
              rowSelection={rowSelection}
              pagination={{ pageSize: 10 }}
              size="small"
            />

            <Divider />

            <Title level={5}>时间线视图</Title>
            {renderTimeline()}
          </Space>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <DiffOutlined />
              版本对比
            </span>
          } 
          key="diff"
        >
          {renderDiff()}
        </TabPane>

        <TabPane 
          tab={
            <span>
              <ExclamationCircleOutlined />
              版本说明
            </span>
          } 
          key="help"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card title="版本号规则" size="small">
              <Paragraph>
                版本号格式为 <code>主版本.次版本.修订号</code> (例如: 1.0.0)
              </Paragraph>
              <ul>
                <li><strong>主版本</strong>: 重大变更，不兼容的修改</li>
                <li><strong>次版本</strong>: 新增功能，向下兼容</li>
                <li><strong>修订号</strong>: Bug修复，向下兼容</li>
              </ul>
            </Card>

            <Card title="回滚说明" size="small">
              <Paragraph>
                回滚操作会创建一个新的版本，而不是删除历史版本。
                这保证了版本历史的完整性和可追溯性。
              </Paragraph>
              <Alert
                message="注意"
                description="回滚后，当前未保存的修改将丢失，请确保已保存重要更改"
                type="warning"
                showIcon
              />
            </Card>
          </Space>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default VersionHistory;
