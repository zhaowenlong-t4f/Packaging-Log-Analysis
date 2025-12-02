import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Error info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="500"
          subTitle={`抱歉，发生了错误。${this.state.error?.message ? `错误信息: ${this.state.error.message}` : ''}`}
          extra={
            <Button type="primary" onClick={this.handleReset}>
              重试
            </Button>
          }
        >
          {import.meta.env.DEV && this.state.error && (
            <div style={{ textAlign: 'left', marginTop: 16 }}>
              <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </Result>
      );
    }

    return this.props.children;
  }
}

