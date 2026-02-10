import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  ColorPicker,
  Switch,
  Button,
  Space,
  Collapse,
  Tag,
  Select,
  message,
  Empty,
  Divider,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
  DatabaseOutlined,
  LinkOutlined,
  PropertySafetyOutlined,
} from '@ant-design/icons';

const { Panel } = Collapse;
const { TextArea } = Input;
const { Option } = Select;

// 属性类型选项
const PROPERTY_TYPES = [
  { value: 'String', label: '字符串 (String)' },
  { value: 'Text', label: '长文本 (Text)' },
  { value: 'Integer', label: '整数 (Integer)' },
  { value: 'Float', label: '浮点数 (Float)' },
  { value: 'Boolean', label: '布尔值 (Boolean)' },
  { value: 'Date', label: '日期 (Date)' },
  { value: 'Enum', label: '枚举 (Enum)' },
  { value: 'ObjectProperty', label: '对象属性 (ObjectProperty)' },
];

/**
 * 属性面板组件
 */
const PropertyPanel = ({
  selectedItem,
  schema,
  onUpdateEntity,
  onUpdateRelation,
  onDeleteEntity,
  onDeleteRelation,
}) => {
  const [form] = Form.useForm();
  const [propertyForm] = Form.useForm();
  const [editingProperty, setEditingProperty] = useState(null);

  // 当选中项变化时更新表单
  useEffect(() => {
    if (selectedItem) {
      form.setFieldsValue(selectedItem.data);
    } else {
      form.resetFields();
    }
  }, [selectedItem, form]);

  // 未选中任何项
  if (!selectedItem) {
    return (
      <Card className="property-panel" title="属性面板">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="选择一个实体类型或关系类型进行编辑"
        />
      </Card>
    );
  }

  const { type, id, data } = selectedItem;
  const isEntity = type === 'entity';

  // 保存实体类型
  const handleSaveEntity = (values) => {
    onUpdateEntity(id, values);
    message.success('保存成功');
  };

  // 保存关系类型
  const handleSaveRelation = (values) => {
    onUpdateRelation(id, values);
    message.success('保存成功');
  };

  // 添加属性
  const handleAddProperty = () => {
    const values = propertyForm.getFieldsValue();
    if (!values.propertyName) {
      message.error('请输入属性名');
      return;
    }

    const newProperty = {
      type: values.propertyType || 'String',
      label: values.propertyLabel || values.propertyName,
      description: values.propertyDescription || '',
      required: values.propertyRequired || false,
    };

    if (isEntity) {
      onUpdateEntity(id, {
        properties: {
          ...data.properties,
          [values.propertyName]: newProperty,
        },
      });
    } else {
      onUpdateRelation(id, {
        properties: {
          ...data.properties,
          [values.propertyName]: newProperty,
        },
      });
    }

    propertyForm.resetFields();
    setEditingProperty(null);
    message.success('属性添加成功');
  };

  // 删除属性
  const handleDeleteProperty = (propertyName) => {
    const newProperties = { ...data.properties };
    delete newProperties[propertyName];

    if (isEntity) {
      onUpdateEntity(id, { properties: newProperties });
    } else {
      onUpdateRelation(id, { properties: newProperties });
    }
    message.success('属性删除成功');
  };

  // 渲染属性列表
  const renderProperties = () => {
    const properties = data.properties || {};
    
    if (Object.keys(properties).length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无属性" />;
    }

    return (
      <Collapse ghost size="small">
        {Object.entries(properties).map(([name, prop]) => (
          <Panel
            key={name}
            header={
              <Space>
                <span style={{ fontWeight: 500 }}>{name}</span>
                <Tag size="small" color="blue">{prop.type}</Tag>
                {prop.required && <Tag size="small" color="red">必填</Tag>}
              </Space>
            }
            extra={
              <Popconfirm
                title="确认删除属性？"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleDeleteProperty(name);
                }}
                okText="删除"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            }
          >
            <div className="property-detail">
              <div><strong>标签:</strong> {prop.label || '-'}</div>
              <div><strong>描述:</strong> {prop.description || '-'}</div>
              <div><strong>必填:</strong> {prop.required ? '是' : '否'}</div>
            </div>
          </Panel>
        ))}
      </Collapse>
    );
  };

  // 渲染实体类型编辑器
  const renderEntityEditor = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSaveEntity}
      initialValues={data}
    >
      <Form.Item
        label="类型名称"
        name="label"
        rules={[{ required: true, message: '请输入类型名称' }]}
      >
        <Input placeholder="例如：车型项目" />
      </Form.Item>

      <Form.Item
        label="类型ID"
        name="id"
      >
        <Input disabled />
      </Form.Item>

      <Form.Item
        label="描述"
        name="description"
      >
        <TextArea rows={2} placeholder="描述该实体类型的用途..." />
      </Form.Item>

      <Form.Item
        label="颜色"
        name="color"
      >
        <ColorPicker showText />
      </Form.Item>

      <Form.Item
        label="抽象类型"
        name="isAbstract"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block>
          保存
        </Button>
      </Form.Item>
    </Form>
  );

  // 渲染关系类型编辑器
  const renderRelationEditor = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSaveRelation}
      initialValues={data}
    >
      <Form.Item
        label="关系名称"
        name="label"
        rules={[{ required: true, message: '请输入关系名称' }]}
      >
        <Input placeholder="例如：拆分为" />
      </Form.Item>

      <Form.Item
        label="关系ID"
        name="id"
      >
        <Input disabled />
      </Form.Item>

      <Form.Item
        label="描述"
        name="description"
      >
        <TextArea rows={2} placeholder="描述该关系的用途..." />
      </Form.Item>

      <Form.Item
        label="双向关系"
        name="bidirectional"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block>
          保存
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <Card
      className="property-panel"
      title={
        <Space>
          {isEntity ? <DatabaseOutlined /> : <LinkOutlined />}
          <span>{isEntity ? '实体类型' : '关系类型'}</span>
        </Space>
      }
      extra={
        <Popconfirm
          title="确认删除该类型？"
          description="删除后无法恢复，相关数据可能受影响"
          onConfirm={() => {
            if (isEntity) onDeleteEntity(id);
            else onDeleteRelation(id);
          }}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small">
            删除
          </Button>
        </Popconfirm>
      }
    >
      {/* 基础信息 */}
      <div className="panel-section">
        <div className="section-title">基础信息</div>
        {isEntity ? renderEntityEditor() : renderRelationEditor()}
      </div>

      <Divider />

      {/* 属性配置 */}
      <div className="panel-section">
        <div className="section-title">
          <PropertySafetyOutlined /> 属性配置
        </div>
        
        {renderProperties()}

        <Divider style={{ margin: '12px 0' }} />

        {/* 添加属性表单 */}
        <Form form={propertyForm} layout="vertical" size="small">
          <Form.Item
            name="propertyName"
            rules={[{ required: true, message: '请输入属性名' }]}
          >
            <Input placeholder="属性名（英文）" />
          </Form.Item>

          <Form.Item name="propertyLabel">
            <Input placeholder="属性标签（中文）" />
          </Form.Item>

          <Form.Item name="propertyType" initialValue="String">
            <Select placeholder="选择属性类型">
              {PROPERTY_TYPES.map((t) => (
                <Option key={t.value} value={t.value}>{t.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="propertyDescription">
            <Input placeholder="属性描述" />
          </Form.Item>

          <Form.Item name="propertyRequired" valuePropName="checked">
            <Switch size="small" checkedChildren="必填" unCheckedChildren="可选" />
          </Form.Item>

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddProperty}
            block
            size="small"
          >
            添加属性
          </Button>
        </Form>
      </div>
    </Card>
  );
};

export default PropertyPanel;
