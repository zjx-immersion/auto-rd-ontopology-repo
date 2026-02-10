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
        </Space>
      </div>

      <div className="toolbar-right">
        <Space>
          <Tooltip title="导入 Schema">
            <Button icon={<ImportOutlined />}>
              导入
            </Button>
          </Tooltip>
          
          <Tooltip title="导出 Schema">
            <Button icon={<ExportOutlined />}>
              导出
            </Button>
          </Tooltip>
          
          <Divider type="vertical" />
          
          <Tooltip title="验证 Schema">
            <Button icon={<CheckCircleOutlined />}>
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
