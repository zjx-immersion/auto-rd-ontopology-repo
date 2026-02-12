import React from 'react';
import { Layout, Button, Space, Tooltip, Badge, Divider } from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  ArrowLeftOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  LayoutOutlined,
  ApartmentOutlined,
  ShareAltOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

/**
 * Schema 编辑器顶部工具栏
 */
const SchemaToolbar = ({
  editorMode,
  onModeChange,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasChanges,
  layoutType,
  onLayoutChange,
  onImport,
  onExport,
  onValidate,
}) => {
  const navigate = useNavigate();

  return (
    <Header className="schema-toolbar">
      <div className="toolbar-left">
        <Space>
          <Tooltip title="返回">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            />
          </Tooltip>
          
          <Divider type="vertical" />
          
          <span className="toolbar-title">
            Schema 可视化编辑器
            {hasChanges && (
              <Badge
                dot
                color="red"
                style={{ marginLeft: 8 }}
              />
            )}
          </span>
        </Space>
      </div>

      <div className="toolbar-center">
        <Space>
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button
              icon={<UndoOutlined />}
              onClick={onUndo}
              disabled={!canUndo}
            />
          </Tooltip>
          
          <Tooltip title="重做 (Ctrl+Y)">
            <Button
              icon={<RedoOutlined />}
              onClick={onRedo}
              disabled={!canRedo}
            />
          </Tooltip>
          
          <Divider type="vertical" />
          
          <Tooltip title="自动布局">
            <Button
              type={layoutType === 'auto' ? 'primary' : 'default'}
              icon={<LayoutOutlined />}
              onClick={() => onLayoutChange('auto')}
            >
              自动
            </Button>
          </Tooltip>
          
          <Tooltip title="力导向布局">
            <Button
              type={layoutType === 'force' ? 'primary' : 'default'}
              icon={<DragOutlined />}
              onClick={() => onLayoutChange('force')}
            >
              力导向
            </Button>
          </Tooltip>
          
          <Tooltip title="层次布局">
            <Button
              type={layoutType === 'hierarchical' ? 'primary' : 'default'}
              icon={<ApartmentOutlined />}
              onClick={() => onLayoutChange('hierarchical')}
            >
              层次
            </Button>
          </Tooltip>
          
          <Tooltip title="聚类布局">
            <Button
              type={layoutType === 'cluster' ? 'primary' : 'default'}
              icon={<ShareAltOutlined />}
              onClick={() => onLayoutChange('cluster')}
            >
              聚类
            </Button>
          </Tooltip>
        </Space>
      </div>

      <div className="toolbar-right">
        <Space>
          <Tooltip title="导入 Schema">
            <Button icon={<ImportOutlined />} onClick={onImport}>
              导入
            </Button>
          </Tooltip>
          
          <Tooltip title="导出 Schema">
            <Button icon={<ExportOutlined />} onClick={onExport}>
              导出
            </Button>
          </Tooltip>
          
          <Divider type="vertical" />
          
          <Tooltip title="验证 Schema">
            <Button icon={<CheckCircleOutlined />} onClick={onValidate}>
              验证
            </Button>
          </Tooltip>
          
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSave}
            disabled={!hasChanges}
          >
            保存
          </Button>
        </Space>
      </div>
    </Header>
  );
};

export default SchemaToolbar;
