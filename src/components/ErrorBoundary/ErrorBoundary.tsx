/**
 * ErrorBoundaryコンポーネント
 * グローバルエラーバウンダリ
 */

import { Component, ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <h1 className="error-boundary-title">エラーが発生しました</h1>
            <p className="error-boundary-message">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
            {this.state.error && (
              <details className="error-boundary-details">
                <summary>エラー詳細</summary>
                <pre className="error-boundary-error">{this.state.error.toString()}</pre>
              </details>
            )}
            <button className="error-boundary-button" onClick={this.handleReset}>
              ホームに戻る
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
