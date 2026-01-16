import React, { useState } from 'react';
import { Modal, Tabs, Input, Upload, Button, message, Space } from 'antd';
import { UploadOutlined, FileMarkdownOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { importMarkdown, importExcel, importJSON } from '../services/api';
import './ImportModal.css';

const { TextArea } = Input;

const ImportModal = ({ visible, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [excelData, setExcelData] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [jsonFileName, setJsonFileName] = useState('');

  const handleMarkdownImport = async () => {
    if (!markdownContent.trim()) {
      message.warning('请输入Markdown内容');
      return;
    }

    try {
      setLoading(true);
      const result = await importMarkdown(markdownContent, 'triples');
      message.success(`导入成功: ${result.data.added_nodes}个节点, ${result.data.added_edges}条边`);
      setMarkdownContent('');
      onSuccess();
    } catch (error) {
      message.error('导入失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        setExcelData(jsonData);
        message.success('Excel文件解析成功');
      } catch (error) {
        message.error('Excel文件解析失败: ' + error.message);
      }
    };

    reader.readAsArrayBuffer(file);
    return false; // 阻止自动上传
  };

  const handleExcelImport = async () => {
    if (!excelData) {
      message.warning('请先上传Excel文件');
      return;
    }

    try {
      setLoading(true);
      const result = await importExcel(excelData, 'triples');
      message.success(`导入成功: ${result.data.added_nodes}个节点, ${result.data.added_edges}条边`);
      setExcelData(null);
      onSuccess();
    } catch (error) {
      message.error('导入失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJsonUpload = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsedData = JSON.parse(content);
        
        // 验证JSON格式
        if (!parsedData.nodes || !parsedData.edges) {
          message.error('JSON格式错误：必须包含nodes和edges字段');
          return;
        }
        
        if (!Array.isArray(parsedData.nodes) || !Array.isArray(parsedData.edges)) {
          message.error('JSON格式错误：nodes和edges必须是数组');
          return;
        }
        
        setJsonData(parsedData);
        setJsonFileName(file.name);
        message.success('JSON文件解析成功');
      } catch (error) {
        message.error('JSON文件解析失败: ' + error.message);
      }
    };

    reader.readAsText(file);
    return false; // 阻止自动上传
  };

  const handleJsonImport = async () => {
    if (!jsonData) {
      message.warning('请先上传JSON文件');
      return;
    }

    try {
      setLoading(true);
      const result = await importJSON(jsonData.nodes, jsonData.edges);
      message.success(`导入成功: ${result.data.added_nodes}个节点, ${result.data.added_edges}条边`);
      setJsonData(null);
      setJsonFileName('');
      onSuccess();
    } catch (error) {
      message.error('导入失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMarkdownContent('');
    setExcelData(null);
    setJsonData(null);
    setJsonFileName('');
    onCancel();
  };

  const tabItems = [
    {
      key: 'json',
      label: (
        <span>
          <FileTextOutlined />
          JSON文件
        </span>
      ),
      children: (
        <div className="import-tab-content">
          <div className="import-description">
            <p>支持导入完整的知识图谱JSON数据：</p>
            <ul>
              <li>必须包含 <code>nodes</code> 和 <code>edges</code> 两个数组字段</li>
              <li>节点格式: <code>{'{ id, type, data: {...} }'}</code></li>
              <li>边格式: <code>{'{ id, source, target, type, data: {...} }'}</code></li>
            </ul>
            <p style={{ marginTop: 8 }}>
              <strong>示例文件:</strong> <code>data/core-domain-data.json</code>
            </p>
          </div>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Upload 
              beforeUpload={handleJsonUpload}
              accept=".json"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>选择JSON文件</Button>
            </Upload>

            {jsonData && (
              <div className="upload-success">
                ✓ 文件已加载: {jsonFileName}
                <br />
                包含 {jsonData.nodes?.length || 0} 个节点, {jsonData.edges?.length || 0} 条边
              </div>
            )}

            <Button 
              type="primary" 
              onClick={handleJsonImport}
              loading={loading}
              disabled={!jsonData}
              block
            >
              导入
            </Button>
          </Space>
        </div>
      )
    },
    {
      key: 'markdown',
      label: (
        <span>
          <FileMarkdownOutlined />
          Markdown表格
        </span>
      ),
      children: (
        <div className="import-tab-content">
          <div className="import-description">
            <p>支持导入三元组格式的Markdown表格：</p>
            <pre>
{`| 实体A (ID) | 关系 (谓语) | 实体B (ID) | 置信度 | 来源系统 | 更新时间 |
|------------|-------------|------------|--------|----------|----------|
| PROJ_001 | 管理 | SSTS_1001 | 1.0 | 玄武平台 | 2026-01-15 |`}
            </pre>
          </div>
          
          <TextArea 
            rows={10}
            placeholder="粘贴Markdown表格内容..."
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
          />
          
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button 
              type="primary" 
              onClick={handleMarkdownImport}
              loading={loading}
            >
              导入
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'excel',
      label: (
        <span>
          <FileExcelOutlined />
          Excel文件
        </span>
      ),
      children: (
        <div className="import-tab-content">
          <div className="import-description">
            <p>支持导入Excel格式的三元组数据：</p>
            <ul>
              <li>第一行必须是表头</li>
              <li>列顺序: 实体A | 关系 | 实体B | 置信度 | 来源系统 | 更新时间</li>
            </ul>
          </div>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Upload 
              beforeUpload={handleExcelUpload}
              accept=".xlsx,.xls"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>选择Excel文件</Button>
            </Upload>

            {excelData && (
              <div className="upload-success">
                ✓ 文件已加载 ({excelData.length - 1} 行数据)
              </div>
            )}

            <Button 
              type="primary" 
              onClick={handleExcelImport}
              loading={loading}
              disabled={!excelData}
              block
            >
              导入
            </Button>
          </Space>
        </div>
      )
    }
  ];

  return (
    <Modal
      title="数据导入"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
    >
      <Tabs defaultActiveKey="json" items={tabItems} />
    </Modal>
  );
};

export default ImportModal;
