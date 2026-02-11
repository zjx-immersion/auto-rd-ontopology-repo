import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  ColorPicker,
  Button,
  Space,
  Divider,
  Tag,
  message,
  Tabs,
  Card,
  Switch,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  TagOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

// 属性类型选项
const PROPERTY_TYPES = [
  { value: 'String', label: '字符串 (String)', color: 'blue' },
  { value: 'Text', label: '长文本 (Text)', color: 'cyan' },
  { value: 'Integer', label: '整数 (Integer)', color: 'green' },
  { value: 'Float', label: '浮点数 (Float)', color: 'lime' },
  { value: 'Boolean', label: '布尔值 (Boolean)', color: 'purple' },
  { value: 'Date', label: '日期 (Date)', color: 'orange' },
  { value: 'Enum', label: '枚举 (Enum)', color: 'red' },
  { value: 'Object', label: '对象 (Object)', color: 'gold' },
  { value: 'Array', label: '数组 (Array)', color: 'magenta' },
];

// 领域选项（可以从 Schema 中动态获取）
const DOMAIN_OPTIONS = [
  '项目管理域',
  '需求管理域',
  '产品管理域',
  '规划管理域',
  '执行管理域',
  '资产管理域',
  '质量管理域',
  '度量管理域',
  '用户管理域',
  '其他',
];

// 默认颜色
const DEFAULT_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
];

/**
 * 实体类型编辑器对话框
 * 用于创建和编辑实体类型
 */
const EntityTypeEditor = ({
  visible,
  entityType,
  onCancel,
  onSave,
  onDelete,
  existingDomains = [],
}) => {
  const [form] = Form.useForm();
  const [propertyForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [properties, setProperties] = useState({});
  const [editingProperty, setEditingProperty] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!entityType?.code;

  // 初始化表单
  useEffect(() => {
    if (visible) {
      if (entityType) {
        form.setFieldsValue({
          code: entityType.code,
          label: entityType.label,
          description: entityType.description,
          domain: entityType.domain,
          color: entityType.color || '#1890ff',
          parentType: entityType.parentType,
        });
        setProperties(entityType.properties || {});
      } else {
        form.resetFields();
        form.setFieldsValue({
          color: '#1890ff',
          domain: '其他',
        });
        setProperties({});
      }
      setActiveTab('basic');
      setEditingProperty(null);
      propertyForm.resetFields();
    }
  }, [visible, entityType, form, propertyForm]);

  // 保存实体类型
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (Object.keys(properties).length === 0) {
        message.warning('请至少添加一个属性');
        setActiveTab('properties');
        return;
      }

      setIsSubmitting(true);

      const entityData = {
        ...values,
        properties,
      };

      // 如果是编辑模式，保留 code
      if (isEdit) {
        entityData.code = entityType.code;
      }

      await onSave(entityData);
      
      message.success(isEdit ? '实体类型更新成功' : '实体类型创建成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error(error.message || '保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加/更新属性
  const handleSaveProperty = () => {
    propertyForm.validateFields().then((values) => {
      const { propertyName, propertyLabel, propertyType, propertyDescription, propertyRequired } = values;
      
      const newProperty = {
        type: propertyType,
        label: propertyLabel || propertyName,
        description: propertyDescription || '',
        required: propertyRequired || false,
      };

      // 如果是枚举类型，处理选项
      if (propertyType === 'Enum' && values.enumValues) {
        newProperty.values = values.enumValues.split(',').map(v => v.trim()).filter(Boolean);
      }

      setProperties(prev => ({
        ...prev,
        [propertyName]: newProperty,
      }));

      propertyForm.resetFields();
      setEditingProperty(null);
      message.success(editingProperty ? '属性更新成功' : '属性添加成功');
    });
  };

  // 删除属性
  const handleDeleteProperty = (propertyName) => {
    setProperties(prev => {
      const newProps = { ...prev };
      delete newProps[propertyName];
      return newProps;
    });
    
    if (editingProperty === propertyName) {
      setEditingProperty(null);
      propertyForm.resetFields();
    }
  };

  // 编辑属性
  const handleEditProperty = (name, prop) => {
    setEditingProperty(name);
    propertyForm.setFieldsValue({
      propertyName: name,
      propertyLabel: prop.label,
      propertyType: prop.type,
      propertyDescription: prop.description,
      propertyRequired: prop.required,
      enumValues: prop.values ? prop.values.join(', ') : '',
    });
  };

  // 取消属性编辑
  const handleCancelPropertyEdit = () => {
    setEditingProperty(null);
    propertyForm.resetFields();
  };

  // 渲染属性列表
  const renderPropertiesList = () => {
    const propertyEntries = Object.entries(properties);
    
    if (propertyEntries.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <DatabaseOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>暂无属性，请添加属性</p>
        </div>
      );
    }

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {propertyEntries.map(([name, prop]) => {
          const typeConfig = PROPERTY_TYPES.find(t => t.value === prop.type) || PROPERTY_TYPES[0];
          return (
            <Card
              key={name}
              size="small"
              style={{ 
                marginBottom: 8,
                borderLeft: `3px solid ${typeConfig.color}`,
              }}
              actions={[
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleEditProperty(name, prop)}
                >
                  编辑
                </Button>,
                <Popconfirm
                  title="确认删除属性？"
                  onConfirm={() => handleDeleteProperty(name)}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button type="link" danger size="small">
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color={typeConfig.color}>{prop.type}</Tag>
                <span style={{ fontWeight: 500 }}>{name}</span>
                {prop.label && prop.label !== name && (
                  <span style={{ color: '#666' }}>({prop.label})</span>
                )}
                {prop.required && <Tag color="red" size="small">必填</Tag>}
              </div>
              {prop.description && (
                <div style={{ marginTop: 4, color: '#666', fontSize: 12 }}>
                  {prop.description}
                </div>
              )}
              {prop.values && (
                <div style={{ marginTop: 4 }}>
                  {prop.values.map(v => (
                    <Tag key={v} size="small" style={{ marginRight: 4 }}>{v}</Tag>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </Space>
    );
  };

  // 基础信息 Tab
  const BasicTab = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Form.Item
        label="实体类型编码"
        name="code"
        rules={[
          { required: true, message: '请输入实体类型编码' },
          { pattern: /^[A-Z][a-zA-Z0-9]*$/, message: '编码必须以英文大写字母开头，只能包含字母和数字' },
        ]}
        extra={isEdit ? '编码不可修改' : '建议使用 PascalCase 命名法，例如：VehicleProject'}
      >
        <Input 
          placeholder="例如：VehicleProject" 
          disabled={isEdit}
          prefix={<TagOutlined />}
        />
      </Form.Item>

      <Form.Item
        label="显示名称"
        name="label"
        rules={[{ required: true, message: '请输入显示名称' }]}
      >
        <Input placeholder="例如：车型项目" />
      </Form.Item>

      <Form.Item
        label="所属领域"
        name="domain"
        rules={[{ required: true, message: '请选择所属领域' }]}
      >
        <Select placeholder="选择所属领域" showSearch allowClear>
          {[...new Set([...DOMAIN_OPTIONS, ...existingDomains])].map(domain => (
            <Option key={domain} value={domain}>{domain}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="描述"
        name="description"
      >
        <TextArea 
          rows={3} 
          placeholder="描述该实体类型的用途、场景等信息..."
        />
      </Form.Item>

      <Form.Item
        label="颜色标识"
        name="color"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ColorPicker showText />
          <Space size={4}>
            {DEFAULT_COLORS.map(color => (
              <div
                key={color}
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: color,
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: '2px solid transparent',
                }}
                onClick={() => form.setFieldsValue({ color })}
              />
            ))}
          </Space>
        </div>
      </Form.Item>
    </Space>
  );

  // 属性配置 Tab
  const PropertiesTab = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      {/* 属性列表 */}
      {renderPropertiesList()}

      <Divider />

      {/* 添加/编辑属性表单 */}
      <Card 
        size="small" 
        title={editingProperty ? '编辑属性' : '添加属性'}
        style={{ background: '#fafafa' }}
      >
        <Form form={propertyForm} layout="vertical">
          <Form.Item
            name="propertyName"
            label="属性名"
            rules={[
              { required: true, message: '请输入属性名' },
              { pattern: /^[a-z][a-zA-Z0-9]*$/, message: '属性名必须以小写字母开头，只能包含字母和数字' },
            ]}
          >
            <Input 
              placeholder="例如：projectName" 
              disabled={!!editingProperty}
            />
          </Form.Item>

          <Form.Item
            name="propertyLabel"
            label="显示标签"
          >
            <Input placeholder="例如：项目名称" />
          </Form.Item>

          <Form.Item
            name="propertyType"
            label="数据类型"
            initialValue="String"
          >
            <Select placeholder="选择数据类型">
              {PROPERTY_TYPES.map(type => (
                <Option key={type.value} value={type.value}>
                  <Tag color={type.color} size="small">{type.value}</Tag>
                  <span style={{ marginLeft: 8 }}>{type.label}</span>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 枚举值输入 */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, next) => prev.propertyType !== next.propertyType}
          >
            {({ getFieldValue }) => {
              const propertyType = getFieldValue('propertyType');
              if (propertyType === 'Enum') {
                return (
                  <Form.Item
                    name="enumValues"
                    label="枚举值"
                    rules={[{ required: true, message: '请输入枚举值' }]}
                    extra="多个值用逗号分隔，例如：HIGH, MEDIUM, LOW"
                  >
                    <Input placeholder="例如：ACTIVE, INACTIVE, PENDING" />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="propertyDescription"
            label="描述"
          >
            <Input placeholder="属性的详细描述..." />
          </Form.Item>

          <Form.Item
            name="propertyRequired"
            label="是否必填"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="必填" unCheckedChildren="可选" />
          </Form.Item>

          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleSaveProperty}>
              {editingProperty ? '更新属性' : '添加属性'}
            </Button>
            {editingProperty && (
              <Button onClick={handleCancelPropertyEdit}>
                取消编辑
              </Button>
            )}
          </Space>
        </Form>
      </Card>
    </Space>
  );

  const items = [
    {
      key: 'basic',
      label: (
        <span>
          <SettingOutlined /> 基础信息
        </span>
      ),
      children: <BasicTab />,
    },
    {
      key: 'properties',
      label: (
        <span>
          <DatabaseOutlined /> 属性配置
          {Object.keys(properties).length > 0 && (
            <Tag color="blue" size="small" style={{ marginLeft: 8 }}>
              {Object.keys(properties).length}
            </Tag>
          )}
        </span>
      ),
      children: <PropertiesTab />,
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <DatabaseOutlined />
          <span>{isEdit ? '编辑实体类型' : '创建实体类型'}</span>
          {isEdit && <Tag color="blue">{entityType.code}</Tag>}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        isEdit && onDelete && (
          <Popconfirm
            key="delete"
            title="确认删除该实体类型？"
            description="删除后无法恢复，相关数据将受影响"
            onConfirm={() => onDelete(entityType.code)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        ),
        <Button
          key="save"
          type="primary"
          loading={isSubmitting}
          onClick={handleSave}
          icon={<PlusOutlined />}
        >
          {isEdit ? '保存' : '创建'}
        </Button>,
      ]}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
        />
      </Form>
    </Modal>
  );
};

export default EntityTypeEditor;
