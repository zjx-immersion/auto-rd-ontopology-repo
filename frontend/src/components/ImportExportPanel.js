/**
 * 数据导入导出面板组件
 */
import React, { useState, useRef } from 'react';
import {
  Card,
  Button,
  Upload,
  Radio,
  Space,
  message,
  Modal,
  Table,
  Alert,
  Statistic,
  Row,
  Col,
  Divider
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  EyeOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import { importOAGData, previewImportData, exportOAGData, downloadImportTemplate } from '../services/oagApi';

const ImportExportPanel = ({ oagId, onImportSuccess }) => {
  const [importMode, setImportMode] = useState('append');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // 处理文件选择
  const handleFileSelect = async (file) => {
    if (!file) return false;
    
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
      message.error('请上传 .xlsx, .xls 或 .csv 文件');
      return false;
    }

    // 预览数据
    setPreviewLoading(true);
    try {
      const result = await previewImportData(oagId, file);
      if (result.success) {
        setPreviewData({ ...result.data, file });
        setPreviewVisible(true);
      } else {
        message.error(result.error || '预览失败');
      }
    } catch (error) {
      message.error('预览失败: ' + error.message);
    } finally {
      setPreviewLoading(false);
    }
    
    return false; // 阻止自动上传
  };

  // 执行导入
  const handleImport = async () => {
    if (!previewData?.file) return;
    
    setImportLoading(true);
    try {
      const result = await importOAGData(oagId, previewData.file, importMode);
      if (result.success) {
        message.success(`导入成功！${result.data.importResult.nodesAdded || 0} 个节点, ${result.data.importResult.edgesAdded || 0} 条边`);
        setPreviewVisible(false);
        setPreviewData(null);
        onImportSuccess?.();
      } else {
        message.error(result.error || '导入失败');
      }
    } catch (error) {
      message.error('导入失败: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  // 导出数据
  const handleExport = (format) => {
    exportOAGData(oagId, format);
    message.success(`开始导出 ${format.toUpperCase()} 格式`);
  };

  // 下载模板
  const handleDownloadTemplate = (format) => {
    downloadImportTemplate(oagId, format);
    message.success('开始下载模板');
  };

  // 预览表格列
  const previewColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '名称', dataIndex: 'label', key: 'label', ellipsis: true }
  ];

  return (
    <>
      <Card title="数据导入导出" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          {/* 导入部分 */}
          <Col span={12}>
            <Card type="inner" title={<><UploadOutlined /> 数据导入</>}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Upload
                  beforeUpload={handleFileSelect}
                  showUploadList={false}
                  accept=".xlsx,.xls,.csv"
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={previewLoading}
                    block
                  >
                    选择文件预览
                  </Button>
                </Upload>
                
                <Radio.Group 
                  value={importMode} 
                  onChange={(e) => setImportMode(e.target.value)}
                  style={{ marginTop: 8 }}
                >
                  <Space direction="vertical">
                    <Radio value="append">追加模式（跳过已存在）</Radio>
                    <Radio value="replace">替换模式（清空后导入）</Radio>
                    <Radio value="merge">合并模式（更新已存在）</Radio>
                  </Space>
                </Radio.Group>

                <Divider />
                
                <div>
                  <div style={{ marginBottom: 8, color: '#666' }}>下载导入模板：</div>
                  <Space>
                    <Button 
                      size="small" 
                      icon={<FileExcelOutlined />}
                      onClick={() => handleDownloadTemplate('xlsx')}
                    >
                      Excel模板
                    </Button>
                    <Button 
                      size="small" 
                      icon={<FileTextOutlined />}
                      onClick={() => handleDownloadTemplate('csv')}
                    >
                      CSV模板
                    </Button>
                  </Space>
                </div>
              </Space>
            </Card>
          </Col>

          {/* 导出部分 */}
          <Col span={12}>
            <Card type="inner" title={<><DownloadOutlined /> 数据导出</>}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  icon={<FileExcelOutlined />}
                  onClick={() => handleExport('xlsx')}
                  block
                >
                  导出为 Excel (.xlsx)
                </Button>
                <Button 
                  icon={<FileTextOutlined />}
                  onClick={() => handleExport('csv')}
                  block
                >
                  导出为 CSV (.csv)
                </Button>
                <Button 
                  icon={<FileTextOutlined />}
                  onClick={() => handleExport('json')}
                  block
                >
                  导出为 JSON (.json)
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 预览模态框 */}
      <Modal
        title="导入数据预览"
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setPreviewVisible(false)}>
            取消
          </Button>,
          <Button 
            key="import" 
            type="primary" 
            onClick={handleImport}
            loading={importLoading}
            disabled={!previewData?.validation?.valid}
          >
            确认导入
          </Button>
        ]}
      >
        {previewData && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* 统计信息 */}
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="实体数量" 
                  value={previewData.preview?.totalEntities || 0} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="关系数量" 
                  value={previewData.preview?.totalRelations || 0} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="冲突数量" 
                  value={(previewData.conflicts?.nodeConflicts || 0) + (previewData.conflicts?.edgeConflicts || 0)}
                  valueStyle={{ color: (previewData.conflicts?.nodeConflicts || previewData.conflicts?.edgeConflicts) ? '#faad14' : '#52c41a' }}
                />
              </Col>
            </Row>

            {/* 验证警告 */}
            {previewData.validation?.warnings?.length > 0 && (
              <Alert
                type="warning"
                message="数据警告"
                description={
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {previewData.validation.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {previewData.validation.warnings.length > 5 && (
                      <li>...还有 {previewData.validation.warnings.length - 5} 条警告</li>
                    )}
                  </ul>
                }
              />
            )}

            {/* 验证错误 */}
            {previewData.validation?.errors?.length > 0 && (
              <Alert
                type="error"
                message="数据错误"
                description={
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {previewData.validation.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                }
              />
            )}

            {/* 预览表格 */}
            {previewData.preview?.sampleEntities?.length > 0 && (
              <>
                <Divider orientation="left">实体预览（前5条）</Divider>
                <Table
                  dataSource={previewData.preview.sampleEntities}
                  columns={previewColumns}
                  pagination={false}
                  size="small"
                  rowKey="id"
                />
              </>
            )}
          </Space>
        )}
      </Modal>
    </>
  );
};

export default ImportExportPanel;
