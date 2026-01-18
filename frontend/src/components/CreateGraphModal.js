import React, { useState, useEffect } from 'react';
import {
  Modal,
  Steps,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message,
  Alert,
  Space,
  Tag,
  Spin,
  Result
} from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useGraphs } from '../contexts/GraphsContext';
import { fetchSchema } from '../services/api';
import './CreateGraphModal.css';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

/**
 * 创建图谱弹窗
 * 多步骤流程：基本信息 → 选择Schema → 导入数据 → 验证创建
 */
const CreateGraphModal = ({ visible, onCancel, onSuccess }) => {
  const { createGraph, validateGraph } = useGraphs();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [],
    schemaId: 'default',
    schemaVersion: '1.0.0',
    data: { nodes: [], edges: [] }
  });
  
  // Schema列表
  const [schema, setSchema] = useState(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  
  // 数据导入
  const [uploadedData, setUploadedData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  // 加载Schema
  useEffect(() => {
    if (visible) {
      loadSchema();
    }
  }, [visible]);

  const loadSchema = async () => {
    setLoadingSchema(true);
    try {
      const schemaData = await fetchSchema();
      console.log('CreateGraphModal: Schema loaded:', schemaData ? 'YES' : 'NO');
      if (schemaData) {
        console.log('CreateGraphModal: EntityTypes count:', Object.keys(schemaData.entityTypes || {}).length);
        console.log('CreateGraphModal: Schema version:', schemaData.version);
      }
      if (!schemaData || !schemaData.entityTypes) {
        message.error('加载Schema失败：Schema数据为空或格式不正确');
        console.error('CreateGraphModal: Schema data:', schemaData);
      }
      setSchema(schemaData);
    } catch (error) {
      console.error('CreateGraphModal: Schema加载错误:', error);
      message.error('加载Schema失败: ' + (error.message || '未知错误'));
    } finally {
      setLoadingSchema(false);
    }
  };

  // 重置状态
  const resetState = () => {
    setCurrentStep(0);
    setFormData({
      name: '',
      description: '',
      tags: [],
      schemaId: 'default',
      schemaVersion: '1.0.0',
      data: { nodes: [], edges: [] }
    });
    setUploadedData(null);
    setValidationResult(null);
    form.resetFields();
  };

  // 步骤1: 基本信息
  const renderStep1 = () => (
    <Form
      form={form}
      layout="vertical"
      initialValues={formData}
      onValuesChange={(_, values) => {
        setFormData({ ...formData, ...values });
      }}
    >
      <Form.Item
        label="图谱名称"
        name="name"
        rules={[
          { required: true, message: '请输入图谱名称' },
          { min: 2, message: '名称至少2个字符' },
          { max: 50, message: '名称不超过50个字符' }
        ]}
      >
        <Input
          placeholder="例如：GOP项目知识图谱"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="描述"
        name="description"
      >
        <TextArea
          placeholder="简要描述这个图谱的用途和内容"
          rows={4}
          maxLength={200}
          showCount
        />
      </Form.Item>

      <Form.Item
        label="标签"
        name="tags"
        tooltip="添加标签便于分类和搜索"
      >
        <Select
          mode="tags"
          placeholder="输入标签后按回车添加"
          maxTagCount={5}
        >
          <Option value="智能驾驶">智能驾驶</Option>
          <Option value="研发">研发</Option>
          <Option value="测试">测试</Option>
          <Option value="GOP">GOP</Option>
          <Option value="GOOE">GOOE</Option>
        </Select>
      </Form.Item>
    </Form>
  );

  // 步骤2: 选择Schema
  const renderStep2 = () => (
    <div className="schema-selector">
      <Spin spinning={loadingSchema}>
        {schema ? (
          <div>
            <Alert
              message="Schema信息"
              description={
                <div>
                  <p><strong>名称：</strong>{schema.name}</p>
                  <p><strong>版本：</strong>{schema.version}</p>
                  <p><strong>实体类型：</strong>{Object.keys(schema.entityTypes || {}).length}个</p>
                  <p><strong>关系类型：</strong>{Object.keys(schema.relationTypes || {}).length}个</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item label="Schema版本" style={{ marginBottom: 0 }}>
              <Select
                value={formData.schemaVersion}
                onChange={(value) => setFormData({ ...formData, schemaVersion: value })}
                size="large"
              >
                <Option value="1.0.0">v1.0.0（当前）</Option>
              </Select>
            </Form.Item>

            <div className="entity-types-preview">
              <h4>实体类型预览：</h4>
              <Space wrap>
                {Object.entries(schema.entityTypes || {}).slice(0, 10).map(([key, type]) => (
                  <Tag key={key} color="blue">{type.label || key}</Tag>
                ))}
                {Object.keys(schema.entityTypes || {}).length > 10 && (
                  <Tag>+{Object.keys(schema.entityTypes).length - 10}个</Tag>
                )}
              </Space>
            </div>
          </div>
        ) : (
          <Result
            status="warning"
            title="无法加载Schema"
            subTitle="请确保系统中存在有效的Schema定义"
          />
        )}
      </Spin>
    </div>
  );

  // 步骤3: 导入数据
  const renderStep3 = () => {
    const uploadProps = {
      name: 'file',
      multiple: false,
      accept: '.json',
      beforeUpload: (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (!data.nodes || !data.edges) {
              message.error('数据格式错误：必须包含nodes和edges字段');
              return;
            }

            setUploadedData(data);
            setFormData({
              ...formData,
              data: {
                nodes: data.nodes || [],
                edges: data.edges || []
              }
            });
            message.success('数据解析成功');
          } catch (error) {
            message.error('JSON解析失败：' + error.message);
          }
        };
        reader.readAsText(file);
        return false; // 阻止自动上传
      },
      onRemove: () => {
        setUploadedData(null);
        setFormData({
          ...formData,
          data: { nodes: [], edges: [] }
        });
      }
    };

    return (
      <div className="data-import">
        <Alert
          message="导入图谱数据"
          description="上传包含节点和边数据的JSON文件，或者创建空图谱后手动添加数据"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持JSON格式，需包含nodes和edges字段
          </p>
        </Dragger>

        {uploadedData && (
          <div className="upload-result">
            <Alert
              message="数据预览"
              description={
                <div>
                  <p>✓ 节点数量：{uploadedData.nodes?.length || 0}</p>
                  <p>✓ 关系数量：{uploadedData.edges?.length || 0}</p>
                </div>
              }
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        )}

        <div className="empty-graph-option">
          <Button
            type="link"
            onClick={() => {
              setFormData({
                ...formData,
                data: { nodes: [], edges: [] }
              });
              setUploadedData({ nodes: [], edges: [] });
              message.info('已选择创建空图谱');
            }}
          >
            或者创建空图谱
          </Button>
        </div>
      </div>
    );
  };

  // 步骤4: 验证和确认
  const renderStep4 = () => (
    <div className="validation-step">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>正在创建图谱...</p>
        </div>
      ) : validationResult ? (
        <Result
          status={validationResult.success ? 'success' : 'error'}
          title={validationResult.success ? '图谱创建成功！' : '创建失败'}
          subTitle={validationResult.message}
          extra={
            validationResult.success ? (
              <Button type="primary" onClick={() => {
                resetState();
                onSuccess();
              }}>
                完成
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(0)}>
                返回修改
              </Button>
            )
          }
        />
      ) : (
        <div className="summary">
          <h3>确认创建图谱</h3>
          <div className="summary-item">
            <label>图谱名称：</label>
            <span>{formData.name}</span>
          </div>
          <div className="summary-item">
            <label>描述：</label>
            <span>{formData.description || '无'}</span>
          </div>
          <div className="summary-item">
            <label>标签：</label>
            <span>
              {formData.tags?.length > 0 ? (
                <Space>
                  {formData.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                </Space>
              ) : '无'}
            </span>
          </div>
          <div className="summary-item">
            <label>Schema版本：</label>
            <span>{formData.schemaVersion}</span>
          </div>
          <div className="summary-item">
            <label>节点数：</label>
            <span>{formData.data.nodes?.length || 0}</span>
          </div>
          <div className="summary-item">
            <label>关系数：</label>
            <span>{formData.data.edges?.length || 0}</span>
          </div>
        </div>
      )}
    </div>
  );

  // 下一步
  const handleNext = async () => {
    if (currentStep === 0) {
      // 验证基本信息
      try {
        await form.validateFields();
        setCurrentStep(currentStep + 1);
      } catch (error) {
        // 表单验证失败
      }
    } else if (currentStep === 1) {
      // 验证Schema选择
      if (!schema) {
        message.error('无法加载Schema，请刷新重试');
        return;
      }
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 2) {
      // 进入确认步骤
      setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 创建图谱
  const handleCreate = async () => {
    setLoading(true);
    try {
      const result = await createGraph({
        name: formData.name,
        description: formData.description,
        tags: formData.tags || [],
        schemaId: 'default',
        schemaVersion: formData.schemaVersion,
        data: formData.data
      });

      setValidationResult({
        success: true,
        message: '图谱已成功创建，可以开始使用了'
      });
    } catch (error) {
      setValidationResult({
        success: false,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // 取消
  const handleCancel = () => {
    Modal.confirm({
      title: '确认取消',
      content: '取消将丢失所有已填写的信息，确定要取消吗？',
      onOk: () => {
        resetState();
        onCancel();
      }
    });
  };

  const steps = [
    { title: '基本信息', content: renderStep1() },
    { title: '选择Schema', content: renderStep2() },
    { title: '导入数据', content: renderStep3() },
    { title: '确认创建', content: renderStep4() }
  ];

  return (
    <Modal
      title="创建新图谱"
      open={visible}
      width={800}
      footer={null}
      onCancel={handleCancel}
      destroyOnClose
      className="create-graph-modal"
    >
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map(step => (
          <Step key={step.title} title={step.title} />
        ))}
      </Steps>

      <div className="step-content">
        {steps[currentStep].content}
      </div>

      <div className="step-actions">
        {currentStep > 0 && currentStep < 3 && !validationResult && (
          <Button onClick={handlePrev}>
            上一步
          </Button>
        )}
        {currentStep < 2 && (
          <Button type="primary" onClick={handleNext}>
            下一步
          </Button>
        )}
        {currentStep === 2 && (
          <Button type="primary" onClick={handleNext}>
            确认
          </Button>
        )}
        {currentStep === 3 && !validationResult && (
          <Button
            type="primary"
            onClick={handleCreate}
            loading={loading}
          >
            创建图谱
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default CreateGraphModal;
