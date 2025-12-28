/**
 * AuthFormコンポーネントのデモ
 * 開発時の動作確認用
 */

import { useState } from 'react';
import { AuthForm } from './AuthForm';

export function AuthFormDemo() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<{
    email: string;
    password: string;
    nickname?: string;
  } | null>(null);

  const handleSubmit = async (email: string, password: string, nickname?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 実際の送信処理をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 成功時の処理
      setLastSubmission({ email, password, nickname });
      console.log('送信データ:', { email, password, nickname });
      
    } catch (err) {
      setError('送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = () => {
    setMode(mode === 'signup' ? 'signin' : 'signup');
    setError(null);
    setLastSubmission(null);
  };

  const handleErrorTest = () => {
    setError('テストエラーメッセージ');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>AuthForm デモ</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>コントロール</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMode('signup')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: mode === 'signup' ? '#3b82f6' : '#f3f4f6',
              color: mode === 'signup' ? 'white' : 'black',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            登録モード
          </button>
          <button
            onClick={() => setMode('signin')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: mode === 'signin' ? '#3b82f6' : '#f3f4f6',
              color: mode === 'signin' ? 'white' : 'black',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            ログインモード
          </button>
          <button
            onClick={handleErrorTest}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            エラーテスト
          </button>
          <button
            onClick={clearError}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            エラークリア
          </button>
        </div>
      </div>

      <AuthForm
        mode={mode}
        onSubmit={handleSubmit}
        onModeChange={handleModeChange}
        loading={loading}
        error={error}
      />

      {lastSubmission && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f0f9ff', 
          border: '1px solid #0ea5e9',
          borderRadius: '0.5rem'
        }}>
          <h3>最後の送信データ</h3>
          <pre style={{ fontSize: '0.875rem', margin: 0 }}>
            {JSON.stringify(lastSubmission, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}