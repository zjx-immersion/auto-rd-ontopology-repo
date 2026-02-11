import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch, message } from 'antd';
import { updateEdge } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

/**
 * 对象属性编辑器
 * 用于编辑知识图谱中边的对象属性
 */
const ObjectPropertyEditor = ({ visible, edge, schema, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && edge) {
      // 初始化表单值
      const initialValues = { ...edge.data };
      
      // 处理日期字段
      Object.keys(initialValues).forEach(key => {
        if (key.includes('date') || key.includes('Date')) {
          if (initialValues[key]) {
            initialValues[key] = dayjs(initialValues[key]);
          }
        }
      });

      form.setFieldsValue(initialValues);
    }
  }, [visible, edge, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理日期字段
      const processedValues = { ...values };
      Object.keys(processedValues).forEach(key => {
        if (dayjs.isDayjs(processedValues[key])) {
          processedValues[key] = processedValues[key].format('YYYY-MM-DD');
        }
      });

      setLoading(true);
      
      // 更新边的data字段
      await updateEdge(edge.id, { data: processedValues });
      
      message.success('对象属性更新成功');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('更新对象属性失败:', error);
      message.error('更新失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const renderFormField = (propKey, propDef) => {
    const { type, values, description } = propDef;

    switch (type) {
      case 'String':
        return (
          <Form.Item
            key={propKey}
            name={propKey}
            label={description || propKey}
          >
            <Input placeholder={`请输入${description || propKey}`} />
          </Form.Item>
        );

      case 'Text':
        return (
          <Form.Item
            key={propKey}
            name={propKey}
            label={description || propKey}
          >
            <TextArea rows={3} placeholder={`请输入${description || propKey}`} />
          </Form.Item>
        );

      case 'Integer':
        return (
          <Form.Item
            key={propKey}
            name={propKey}
            label={description || propKey}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder={`请输入${description || propKey}`}
              precision={0}
            />
          </Form.Item>
        );

      case 'Float':
        return (
          <Form.Item
            key={propKey}
            name={propKey}
            label={description || propKey}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder={`请输入${description || propKey}`}
              precision={2}
            />
          </Form.Item>
        );

      case 'Boolean':
        return (
          <Form.Item
            key={propKey}
            name={propKey}
            label={description || propKey}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        );

      case 'Date':
      case 'DateTime':
        return (
          <Form.Item
            key={propKey}
            name={propKey}
            label={description || propKey}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder={`请选择${description || propKey}`}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        );

      case 'Enum':
        return (
          <Form.Item
            key={propKey}
            name={propKey}
            label={description || propKey}
          >
            <Select placeholder={`请选择${description || propKey}`}>
              {values && values.map(val => (
                <Option key={val} value={val}>{val}</Option>
              ))}
            </Select>
          </Form.Item>
        );

      default:
        return (
          <Form.Item
            key={propKey}
            name={propKey}
            label={description || propKey}
          >
            <Input placeholder={`请输入${description || propKey}`} />
          </Form.Item>
        );
    }
  };

  if (!edge || !schema) return null;

  const relationType = schema.relationTypes?.[edge.type];
  const propertyDefs = relationType?.properties || {};

  return (
    <Modal
      title={`编辑对象属性 - ${relationType?.label || edge.type}`}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16, color: '#8c8c8c', fontSize: '12px' }}>
        <div>源节点: {edge.source}</div>
        <div>目标节点: {edge.target}</div>
        <div>关系类型: {relationType?.label || edge.type}</div>
      </div>

      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        {Object.keys(propertyDefs).length > 0 ? (
          Object.entries(propertyDefs).map(([propKey, propDef]) => 
            renderFormField(propKey, propDef)
          )
        ) : (
          <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '20px' }}>
            该关系类型没有定义对象属性
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default ObjectPropertyEditor;
