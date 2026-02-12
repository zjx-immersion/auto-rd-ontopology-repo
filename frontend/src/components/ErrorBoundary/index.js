import React from 'react';
import { Result, Button, Space, Typography, Collapse } from 'antd';
import { HomeOutlined, ReloadOutlined, BugOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * 错误边界组件 - 捕获React组件树中的错误
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // 上报错误到监控服务
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // 可以在这里添加错误上报逻辑
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const { fallback, showDetails = process.env.NODE_ENV === 'development' } = this.props;
      
      if (fallback) {
        return fallback(error);
      }

      return (
        <Result
          status="error"
          title="页面出错了"
          subTitle="抱歉，页面发生了意外错误"
          icon={<BugOutlined />}
          extra={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                >
                  刷新页面
                </Button>
                <Button 
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  返回首页
                </Button>
              </Space>
              
              {showDetails && error && (
                <Collapse style={{ marginTop: 16, textAlign: 'left' }}>
                  <Panel header="错误详情 (仅开发环境显示)" key="1">
                    <Paragraph>
                      <Text strong>错误信息:</Text>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: 12, 
                        borderRadius: 4,
                        overflow: 'auto'
                      }}>
                        {error.toString()}
                      </pre>
                    </Paragraph>
                    {errorInfo && (
                      <Paragraph>
                        <Text strong>组件堆栈:</Text>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: 12, 
                          borderRadius: 4,
                          overflow: 'auto',
                          fontSize: 12
                        }}>
                          {errorInfo.componentStack}
                        </pre>
                      </Paragraph>
                    )}
                  </Panel>
                </Collapse>
              )}
            </Space>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
