import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Upload,
  Button,
  Radio,
  Space,
  Typography,
  message,
  Progress,
  Table,
  Alert,
  Tabs,
  Descriptions,
  Tag
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;


/**
 * Schema导入导出模态框
 */
const ImportExportModal = ({
  visible,
  mode, // 'import' | 'export'
  schema,
  onClose,
  onImport,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState(mode || 'import');
  const [file, setFile] = useState(null);

  // 当 mode prop 变化时，更新 activeTab
  useEffect(() => {
    if (mode) {
      setActiveTab(mode);
    }
  }, [mode]);
  const [format, setFormat] = useState('xlsx');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // 处理文件上传
  const handleFileChange = (info) => {
    const { file } = info;
    
    // 处理文件移除
    if (file.status === 'removed') {
      setFile(null);
      setPreviewData(null);
      setImportResult(null);
      return;
    }
    
    // 获取文件对象（处理多种情况）
    const fileObj = file.originFileObj || file;
    if (!fileObj) return;
    
    setFile(fileObj);
    
    // 读取并预览文件
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const preview = parsePreviewData(data, format);
        setPreviewData(preview);
      } catch (error) {
        message.error('文件解析失败: ' + error.message);
        setPreviewData(null);
      }
    };
    reader.onerror = () => {
      message.error('文件读取失败');
      setPreviewData(null);
    };
    
    if (format === 'json') {
      reader.readAsText(fileObj);
    } else {
      reader.readAsBinaryString(fileObj);
    }
  };

  // 解析预览数据
  const parsePreviewData = (data, fileFormat) => {
    if (fileFormat === 'json') {
      const json = JSON.parse(data);
      return {
        type: 'json',
        entityTypes: Object.keys(json.entityTypes || {}).length,
        relationTypes: Object.keys(json.relationTypes || {}).length,
        sample: json
      };
    } else {
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheets = workbook.SheetNames;
      
      const preview = {
        type: 'excel',
        sheets: sheets.length,
        sheetData: {}
      };
      
      // 只预览前5行
      sheets.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        preview.sheetData[sheetName] = json.slice(0, 6); // 表头+5行数据
      });
      
      return preview;
    }
  };

  // 执行导入
  const handleImport = async () => {
    if (!file) {
      message.warning('请先选择文件');
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          let schemaData;
          
          if (format === 'json') {
            schemaData = JSON.parse(e.target.result);
          } else {
            schemaData = parseExcelToSchema(e.target.result);
          }

          // 验证Schema
          setProgress(30);
          const validation = validateSchemaData(schemaData);
          
          if (!validation.valid) {
            setImportResult({
              success: false,
              errors: validation.errors
            });
            setImporting(false);
            return;
          }

          setProgress(60);
          
          // 合并到当前Schema
          const mergedSchema = mergeSchema(schema, schemaData);
          
          setProgress(90);
          
          // 调用导入回调
          await onImport(mergedSchema);
          
          setProgress(100);
          setImportResult({
            success: true,
            entityTypes: Object.keys(schemaData.entityTypes || {}).length,
            relationTypes: Object.keys(schemaData.relationTypes || {}).length
          });
          
          message.success('导入成功');
        } catch (error) {
          setImportResult({
            success: false,
            errors: [error.message]
          });
          message.error('导入失败: ' + error.message);
        } finally {
          setImporting(false);
        }
      };

      if (format === 'json') {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    } catch (error) {
      setImporting(false);
      message.error('文件读取失败: ' + error.message);
    }
  };

  // Excel解析为Schema
  const parseExcelToSchema = (data) => {
    const workbook = XLSX.read(data, { type: 'binary' });
    const schemaData = {
      version: '2.0.0',
      entityTypes: {},
      relationTypes: {}
    };

    // 解析实体类型sheet
    if (workbook.SheetNames.includes('EntityTypes')) {
      const ws = workbook.Sheets['EntityTypes'];
      const json = XLSX.utils.sheet_to_json(ws);
      
      json.forEach(row => {
        if (row.code) {
          schemaData.entityTypes[row.code] = {
            code: row.code,
            label: row.label || row.code,
            description: row.description || '',
            color: row.color || '#1890ff',
            domain: row.domain || '',
            properties: parseProperties(row.properties)
          };
        }
      });
    }

    // 解析关系类型sheet
    if (workbook.SheetNames.includes('RelationTypes')) {
      const ws = workbook.Sheets['RelationTypes'];
      const json = XLSX.utils.sheet_to_json(ws);
      
      json.forEach(row => {
        if (row.id) {
          schemaData.relationTypes[row.id] = {
            id: row.id,
            label: row.label || row.id,
            description: row.description || '',
            from: row.from ? row.from.split(',').map(s => s.trim()) : [],
            to: row.to ? row.to.split(',').map(s => s.trim()) : []
          };
        }
      });
    }

    return schemaData;
  };

  // 解析属性字符串
  const parseProperties = (propsStr) => {
    if (!propsStr) return {};
    
    try {
      if (typeof propsStr === 'string') {
        return JSON.parse(propsStr);
      }
      return propsStr;
    } catch {
      return {};
    }
  };

  // 验证Schema数据
  const validateSchemaData = (data) => {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('无效的Schema数据');
      return { valid: false, errors };
    }

    if (!data.entityTypes || Object.keys(data.entityTypes).length === 0) {
      errors.push('Schema必须包含至少一个实体类型');
    }

    // 验证实体类型
    Object.entries(data.entityTypes || {}).forEach(([code, entity]) => {
      if (!entity.label) {
        errors.push(`实体类型 ${code} 缺少标签`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // 合并Schema
  const mergeSchema = (current, imported) => {
    return {
      ...current,
      entityTypes: {
        ...current.entityTypes,
        ...imported.entityTypes
      },
      relationTypes: {
        ...current.relationTypes,
        ...imported.relationTypes
      }
    };
  };

  // 执行导出
  const handleExport = () => {
    try {
      if (format === 'json') {
        // 导出JSON
        const dataStr = JSON.stringify(schema, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schema_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // 导出Excel
        const workbook = XLSX.utils.book_new();
        
        // EntityTypes sheet
        const entityData = Object.values(schema.entityTypes || {}).map(et => ({
          code: et.code,
          label: et.label,
          description: et.description,
          color: et.color,
          domain: et.domain,
          properties: JSON.stringify(et.properties || {})
        }));
        
        if (entityData.length > 0) {
          const entityWs = XLSX.utils.json_to_sheet(entityData);
          XLSX.utils.book_append_sheet(workbook, entityWs, 'EntityTypes');
        }
        
        // RelationTypes sheet
        const relationData = Object.values(schema.relationTypes || {}).map(rt => ({
          id: rt.id,
          label: rt.label,
          description: rt.description,
          from: (rt.from || []).join(', '),
          to: (rt.to || []).join(', ')
        }));
        
        if (relationData.length > 0) {
          const relationWs = XLSX.utils.json_to_sheet(relationData);
          XLSX.utils.book_append_sheet(workbook, relationWs, 'RelationTypes');
        }
        
        XLSX.writeFile(workbook, `schema_${Date.now()}.xlsx`);
      }
      
      message.success('导出成功');
      onExport && onExport();
    } catch (error) {
      message.error('导出失败: ' + error.message);
    }
  };

  // 渲染导入结果
  const renderImportResult = () => {
    if (!importResult) return null;
    
    if (importResult.success) {
      return (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="导入成功"
          description={
            <Space direction="vertical">
              <Text>实体类型: {importResult.entityTypes} 个</Text>
              <Text>关系类型: {importResult.relationTypes} 个</Text>
            </Space>
          }
        />
      );
    }
    
    return (
      <Alert
        type="error"
        showIcon
        icon={<CloseCircleOutlined />}
        message="导入失败"
        description={
          <ul>
            {importResult.errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        }
      />
    );
  };

  return (
    <Modal
      title={activeTab === 'import' ? '导入Schema' : '导出Schema'}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'import',
            label: '导入',
            children: (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Radio.Group value={format} onChange={e => setFormat(e.target.value)}>
              <Radio.Button value="xlsx">
                <FileExcelOutlined /> Excel (.xlsx)
              </Radio.Button>
              <Radio.Button value="json">
                <FileTextOutlined /> JSON (.json)
              </Radio.Button>
            </Radio.Group>

            <Upload.Dragger
              accept={format === 'json' ? '.json' : '.xlsx,.xls'}
              beforeUpload={() => false}
              onChange={handleFileChange}
              maxCount={1}
              disabled={importing}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 {format === 'json' ? 'JSON' : 'Excel'} 格式文件
              </p>
            </Upload.Dragger>

            {previewData && (
              <Alert
                type="info"
                message="文件预览"
                description={
                  <Descriptions size="small" column={2}>
                    <Descriptions.Item label="文件类型">
                      {previewData.type.toUpperCase()}
                    </Descriptions.Item>
                    <Descriptions.Item label="实体类型数">
                      {previewData.entityTypes || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="关系类型数">
                      {previewData.relationTypes || '-'}
                    </Descriptions.Item>
                    {previewData.sheets && (
                      <Descriptions.Item label="工作表数">
                        {previewData.sheets}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                }
              />
            )}

            {importing && (
              <Progress percent={progress} status={progress < 100 ? 'active' : 'success'} />
            )}

            {renderImportResult()}

            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={onClose}>取消</Button>
              <Button
                type="primary"
                onClick={handleImport}
                loading={importing}
                disabled={!file}
              >
                导入
              </Button>
            </Space>
          </Space>
            )
          },
          {
            key: 'export',
            label: '导出',
            children: (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Radio.Group value={format} onChange={e => setFormat(e.target.value)}>
              <Radio.Button value="xlsx">
                <FileExcelOutlined /> Excel (.xlsx)
              </Radio.Button>
              <Radio.Button value="json">
                <FileTextOutlined /> JSON (.json)
              </Radio.Button>
            </Radio.Group>

            <Alert
              type="info"
              message="导出内容预览"
              description={
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="实体类型">
                    {Object.keys(schema?.entityTypes || {}).length} 个
                  </Descriptions.Item>
                  <Descriptions.Item label="关系类型">
                    {Object.keys(schema?.relationTypes || {}).length} 个
                  </Descriptions.Item>
                  <Descriptions.Item label="版本">
                    {schema?.version || '2.0.0'}
                  </Descriptions.Item>
                </Descriptions>
              }
            />

            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={onClose}>取消</Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
            </Space>
          </Space>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default ImportExportModal;
