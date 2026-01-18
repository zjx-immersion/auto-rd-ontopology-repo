import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Tag,
  Empty,
  Spin,
  Modal,
  Dropdown,
  message,
  Space,
  Pagination
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExportOutlined,
  MoreOutlined,
  FolderOpenOutlined,
  CalendarOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useGraphs } from '../contexts/GraphsContext';
import CreateGraphModal from '../components/CreateGraphModal';
import './GraphListPage.css';

const { Search } = Input;
const { Option } = Select;

/**
 * 图谱列表页
 * 显示所有图谱的卡片列表，支持搜索、筛选、创建、操作等功能
 */
const GraphListPage = () => {
  const navigate = useNavigate();
  const {
    graphs,
    loading,
    pagination,
    loadGraphs,
    deleteGraph,
    duplicateGraph,
    exportGraph
  } = useGraphs();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // 加载图谱列表
  useEffect(() => {
    loadGraphs({
      page: currentPage,
      pageSize,
      search: searchText,
      status: statusFilter
    });
  }, [currentPage, pageSize, searchText, statusFilter, loadGraphs]);

  // 搜索处理
  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1); // 重置到第一页
  };

  // 状态筛选处理
  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // 分页处理
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
  };

  // 查看图谱
  const handleView = (graphId) => {
    navigate(`/graphs/${graphId}`);
  };

  // 编辑图谱元信息
  const handleEdit = (graph) => {
    // TODO: 打开编辑弹窗
    message.info('编辑功能开发中...');
  };

  // 复制图谱
  const handleDuplicate = async (graph) => {
    Modal.confirm({
      title: '复制图谱',
      content: `确定要复制图谱"${graph.name}"吗？`,
      onOk: async () => {
        try {
          await duplicateGraph(graph.id);
        } catch (error) {
          // 错误已在Context中处理
        }
      }
    });
  };

  // 删除图谱
  const handleDelete = (graph) => {
    Modal.confirm({
      title: '删除图谱',
      content: (
        <div>
          <p>确定要删除图谱"<strong>{graph.name}</strong>"吗？</p>
          <p style={{ color: '#ff4d4f' }}>此操作不可恢复！</p>
        </div>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteGraph(graph.id);
      }
    });
  };

  // 导出图谱
  const handleExport = async (graph) => {
    await exportGraph(graph.id);
  };

  // 渲染图谱卡片
  const renderGraphCard = (graph) => {
    const actions = [
      {
        key: 'view',
        label: '查看',
        icon: <EyeOutlined />,
        onClick: () => handleView(graph.id)
      },
      {
        key: 'edit',
        label: '编辑',
        icon: <EditOutlined />,
        onClick: () => handleEdit(graph)
      },
      {
        key: 'duplicate',
        label: '复制',
        icon: <CopyOutlined />,
        onClick: () => handleDuplicate(graph)
      },
      {
        key: 'export',
        label: '导出',
        icon: <ExportOutlined />,
        onClick: () => handleExport(graph)
      },
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        onClick: () => handleDelete(graph),
        danger: true
      }
    ];

    return (
      <Card
        key={graph.id}
        className="graph-card"
        hoverable
        onClick={() => handleView(graph.id)}
        extra={
          <Dropdown
            menu={{
              items: actions.map(action => ({
                key: action.key,
                label: action.label,
                icon: action.icon,
                danger: action.danger,
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  action.onClick();
                }
              }))
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        }
      >
        <div className="graph-card-content">
          <div className="graph-icon">
            <FolderOpenOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </div>
          
          <div className="graph-info">
            <h3 className="graph-name">{graph.name}</h3>
            <p className="graph-description">{graph.description || '暂无描述'}</p>
            
            <div className="graph-meta">
              <Space size="large">
                <span>
                  <DatabaseOutlined /> {graph.metadata?.statistics?.nodeCount || 0} 节点
                </span>
                <span>
                  {graph.metadata?.statistics?.edgeCount || 0} 关系
                </span>
              </Space>
            </div>
            
            <div className="graph-footer">
              <div className="graph-tags">
                {graph.metadata?.tags?.map(tag => (
                  <Tag key={tag} color="blue">{tag}</Tag>
                ))}
              </div>
              <div className="graph-date">
                <CalendarOutlined /> {new Date(graph.metadata?.updated || graph.updated).toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="graph-list-page">
      {/* 页头 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1>图谱管理</h1>
            <p className="header-desc">管理和查看所有知识图谱</p>
          </div>
          <div className="header-right">
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建图谱
            </Button>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="filter-bar">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="搜索图谱名称或描述..."
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ maxWidth: 500 }}
            />
          </Col>
          <Col>
            <Select
              value={statusFilter}
              onChange={handleStatusChange}
              size="large"
              style={{ width: 120 }}
            >
              <Option value="all">全部</Option>
              <Option value="active">活跃</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Col>
        </Row>
      </div>

      {/* 图谱列表 */}
      <div className="graph-list-content">
        <Spin spinning={loading} size="large">
          {graphs.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchText ? '未找到匹配的图谱' : '暂无图谱，点击"创建图谱"开始'
              }
              style={{ marginTop: 100 }}
            >
              {!searchText && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  创建第一个图谱
                </Button>
              )}
            </Empty>
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {graphs.map(graph => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={graph.id}>
                    {renderGraphCard(graph)}
                  </Col>
                ))}
              </Row>

              {/* 分页 */}
              {pagination.total > pageSize && (
                <div className="pagination-wrapper">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={pagination.total}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total) => `共 ${total} 个图谱`}
                    pageSizeOptions={['12', '24', '48']}
                  />
                </div>
              )}
            </>
          )}
        </Spin>
      </div>

      {/* 创建图谱弹窗 */}
      <CreateGraphModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          loadGraphs(); // 重新加载列表
        }}
      />
    </div>
  );
};

export default GraphListPage;
