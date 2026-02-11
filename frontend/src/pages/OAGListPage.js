import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Popconfirm,
  message,
  Modal,
  Steps,
  Form,
  Input,
  Select,
  Radio,
  Descriptions,
  Statistic,
  Row,
  Col,
  Empty,
  Spin
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileAddOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { getOAGList, deleteOAG, generateOAGFromSchema, generateOAGFromTemplate, getOAGTemplates, fetchSchema } from '../services/api';
import './OAGListPage.css';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

/**
 * OAG 实例列表页面
 */
const OAGListPage = () => {
  const navigate = useNavigate();
  const [oagList, setOagList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [schema, setSchema] = useState(null);
  const [form] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);

  // 加载 OAG 列表
  useEffect(() => {
    loadOAGList();
  }, []);

  // 加载模板列表
  useEffect(() => {
    if (createModalVisible) {
      loadTemplates();
      loadSchema();
    }
  }, [createModalVisible]);

  const loadOAGList = async () => {
    setLoading(true);
    try {
      const result = await getOAGList();
      if (result.success) {
        setOagList(result.data);
      }
    } catch (error) {
      message.error('加载 OAG 列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const result = await getOAGTemplates();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      message.error('加载模板失败: ' + error.message);
    }
  };

  const loadSchema = async () => {
    try {
      const result = await fetchSchema();
      if (result.success) {
        setSchema(result.data);
      }
    } catch (error) {
      message.error('加载 Schema 失败: ' + error.message);
    }
  };

  const handleDelete = async (oagId) => {
    try {
      const result = await deleteOAG(oagId);
      if (result.success) {
        message.success('OAG 删除成功');
        loadOAGList();
      }
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleCreate = () => {
    setCreateModalVisible(true);
    setCreateStep(0);
    form.resetFields();
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      setCreateLoading(true);

      let result;
      if (values.createType === 'template') {
        // 基于模板生成
        result = await generateOAGFromTemplate(values.templateId, {
          name: values.name,
          description: values.description,
          vehicleName: values.vehicleName || '新车型',
          projectName: values.projectName || '新项目',
          ...values.templateParams
        });
      } else {
        // 基于 Schema 生成
        result = await generateOAGFromSchema('core-domain-schema-v2', {
          name: values.name,
          description: values.description,
          populateExamples: values.populateExamples
        });
      }

      if (result.success) {
        message.success('OAG 创建成功');
        setCreateModalVisible(false);
        loadOAGList();
        // 导航到新创建的 OAG
        navigate(`/oag/${result.data.id}`);
      }
    } catch (error) {
      message.error('创建失败: ' + error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleView = (oagId) => {
    navigate(`/oag/${oagId}`);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <span style={{ fontSize: 12, color: '#999' }}>ID: {record.id.slice(0, 8)}...</span>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '领域',
      dataIndex: 'domain',
      key: 'domain',
      render: (domain) => <Tag color="blue">{domain || '通用'}</Tag>
    },
    {
      title: '节点/边',
      key: 'counts',
      render: (_, record) => (
        <Space>
          <Tag color="green">{record.nodeCount} 节点</Tag>
          <Tag color="orange">{record.edgeCount} 边</Tag>
        </Space>
      )
    },
    {
      title: '基于 Schema',
      dataIndex: 'schemaVersion',
      key: 'schemaVersion',
      render: (version) => <Tag color="purple">v{version}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleView(record.id)}
          >
            查看
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个 OAG 实例吗？此操作不可恢复。"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 创建向导步骤
  const renderCreateSteps = () => {
    const createType = form.getFieldValue('createType');

    return (
      <Steps current={createStep} direction="vertical" style={{ marginBottom: 24 }}>
        <Step
          title="选择创建方式"
          description="选择基于模板或 Schema 创建"
          icon={createStep === 0 ? <AppstoreOutlined /> : null}
        />
        <Step
          title="配置信息"
          description="填写 OAG 基本信息"
          icon={createStep === 1 ? <FileAddOutlined /> : null}
        />
        <Step
          title="确认创建"
          description="预览并确认"
          icon={createStep === 2 ? <CheckCircleOutlined /> : null}
        />
      </Steps>
    );
  };

  // 渲染创建表单内容
  const renderCreateForm = () => {
    const createType = form.getFieldValue('createType');
    const selectedTemplateId = form.getFieldValue('templateId');
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    switch (createStep) {
      case 0:
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="createType"
              label="创建方式"
              initialValue="schema"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="schema">
                    <Space>
                      <AppstoreOutlined />
                      <span>基于 Schema 创建空白 OAG</span>
                    </Space>
                    <div style={{ marginLeft: 24, color: '#999', fontSize: 12 }}>
                      根据 Schema 定义创建空的 OAG 实例，自行填充数据
                    </div>
                  </Radio>
                  <Radio value="template">
                    <Space>
                      <FileAddOutlined />
                      <span>基于模板创建</span>
                    </Space>
                    <div style={{ marginLeft: 24, color: '#999', fontSize: 12 }}>
                      使用预定义模板快速生成带有示例数据的 OAG
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {createType === 'template' && (
              <Form.Item
                name="templateId"
                label="选择模板"
                rules={[{ required: true, message: '请选择一个模板' }]}
              >
                <Select placeholder="选择模板" style={{ width: '100%' }}>
                  {templates.map(template => (
                    <Option key={template.id} value={template.id}>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <span>{template.name}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {template.description} ({template.nodeCount}节点/{template.edgeCount}边)
                        </span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </Form>
        );

      case 1:
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="OAG 名称"
              rules={[{ required: true, message: '请输入 OAG 名称' }]}
            >
              <Input placeholder="输入 OAG 名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
            >
              <TextArea rows={3} placeholder="输入描述信息" />
            </Form.Item>

            {createType === 'template' && selectedTemplate?.id === 'automotive-ad' && (
              <>
                <Form.Item
                  name="vehicleName"
                  label="车型名称"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="例如：梦想家" />
                </Form.Item>
                <Form.Item
                  name="vehicleModel"
                  label="车型型号"
                >
                  <Input placeholder="例如：MPV-2024" />
                </Form.Item>
              </>
            )}

            {createType === 'template' && selectedTemplate?.id === 'general-project' && (
              <>
                <Form.Item
                  name="projectName"
                  label="项目名称"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="例如：智能驾驶系统开发" />
                </Form.Item>
                <Form.Item
                  name="projectManager"
                  label="项目经理"
                >
                  <Input placeholder="项目经理姓名" />
                </Form.Item>
              </>
            )}

            {createType === 'schema' && (
              <Form.Item
                name="populateExamples"
                valuePropName="checked"
                initialValue={true}
              >
                <Radio checked>预填充示例数据</Radio>
              </Form.Item>
            )}
          </Form>
        );

      case 2:
        const values = form.getFieldsValue();
        return (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="创建方式">
              {values.createType === 'template' ? '基于模板' : '基于 Schema'}
            </Descriptions.Item>
            {values.createType === 'template' && selectedTemplate && (
              <Descriptions.Item label="使用模板">
                {selectedTemplate.name}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="OAG 名称">
              {values.name}
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              {values.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="预填充示例">
              {values.populateExamples ? '是' : '否'}
            </Descriptions.Item>
          </Descriptions>
        );

      default:
        return null;
    }
  };

  return (
    <div className="oag-list-page">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-title">
            <h1>OAG 实例管理</h1>
            <p>基于 Schema 的 Ontology Asset Graph 实例管理</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            创建 OAG
          </Button>
        </div>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="总实例数" value={oagList.length} />
          </Col>
          <Col span={6}>
            <Statistic
              title="总节点数"
              value={oagList.reduce((sum, oag) => sum + (oag.nodeCount || 0), 0)}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总边数"
              value={oagList.reduce((sum, oag) => sum + (oag.edgeCount || 0), 0)}
            />
          </Col>
          <Col span={6}>
            <Statistic title="可用模板" value={templates.length} />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={oagList}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无 OAG 实例"
              >
                <Button type="primary" onClick={handleCreate}>
                  创建第一个 OAG
                </Button>
              </Empty>
            )
          }}
        />
      </Card>

      {/* 创建 OAG 向导 */}
      <Modal
        title="创建 OAG 实例"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        width={700}
        footer={[
          createStep > 0 && (
            <Button key="prev" onClick={() => setCreateStep(createStep - 1)}>
              上一步
            </Button>
          ),
          createStep < 2 ? (
            <Button
              key="next"
              type="primary"
              onClick={() => setCreateStep(createStep + 1)}
            >
              下一步
            </Button>
          ) : (
            <Button
              key="submit"
              type="primary"
              loading={createLoading}
              onClick={handleCreateSubmit}
            >
              创建
            </Button>
          )
        ]}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ width: 200 }}>
            {renderCreateSteps()}
          </div>
          <div style={{ flex: 1 }}>
            {renderCreateForm()}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OAGListPage;
