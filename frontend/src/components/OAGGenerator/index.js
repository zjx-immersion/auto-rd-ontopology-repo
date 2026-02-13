/**
 * OAG 生成向导组件
 * 基于 Schema 创建 OAG 实例
 */
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Steps, message, Card, Tag } from 'antd';
import { DatabaseOutlined, FileAddOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Step } = Steps;
const { Option } = Select;

const OAGGenerator = ({ visible, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchSchemas();
    }
  }, [visible]);

  const fetchSchemas = async () => {
    setLoading(true);
    try {
      setSchemas([
        { id: 'core-domain-schema-v2', name: 'Core Domain Schema V2', version: '2.0.0' },
        { id: 'adas-schema-v2', name: 'ADAS Schema V2', version: '2.0.0' },
        { id: 'cabin-schema-v2', name: 'Cabin Schema V2', version: '2.0.0' },
      ]);
    } catch (error) {
      message.error('Failed to load schemas');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      if (currentStep === 1) {
        await createOAG(values);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const createOAG = async (values) => {
    setCreating(true);
    try {
      const response = await fetch('/api/v1/oag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaId: values.schemaId,
          name: values.name,
          description: values.description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create OAG');
      }

      const data = await response.json();
      message.success('OAG created successfully!');
      setCurrentStep(2);
      if (onSuccess) {
        onSuccess(data.data);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    form.resetFields();
    setCurrentStep(0);
    onClose();
  };

  const steps = [
    {
      title: 'Select Schema',
      icon: <DatabaseOutlined />,
      content: (
        <Form.Item
          name="schemaId"
          label="Schema"
          rules={[{ required: true, message: 'Please select a schema' }]}
        >
          <Select placeholder="Select a schema" loading={loading} style={{ width: '100%' }}>
            {schemas.map(schema => (
              <Option key={schema.id} value={schema.id}>
                <div>
                  <strong>{schema.name}</strong>
                  <Tag style={{ marginLeft: 8 }}>v{schema.version}</Tag>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>
      )
    },
    {
      title: 'Configure',
      icon: <FileAddOutlined />,
      content: (
        <>
          <Form.Item name="name" label="OAG Name" rules={[{ required: true }]}>
            <Input placeholder="Enter OAG name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter description" rows={4} />
          </Form.Item>
        </>
      )
    },
    {
      title: 'Complete',
      icon: <CheckCircleOutlined />,
      content: (
        <Card style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <h3 style={{ marginTop: 16 }}>OAG Created Successfully!</h3>
        </Card>
      )
    }
  ];

  return (
    <Modal
      title="Create OAG Instance"
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={
        currentStep === 2 ? (
          <Button type="primary" onClick={handleClose}>Done</Button>
        ) : (
          <div>
            {currentStep > 0 && <Button style={{ marginRight: 8 }} onClick={handlePrev}>Previous</Button>}
            <Button type="primary" onClick={handleNext} loading={creating}>
              {currentStep === 1 ? 'Create' : 'Next'}
            </Button>
          </div>
        )
      }
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map(step => <Step key={step.title} title={step.title} icon={step.icon} />)}
      </Steps>
      <Form form={form} layout="vertical">{steps[currentStep].content}</Form>
    </Modal>
  );
};

export default OAGGenerator;
