/**
 * ProfileFormコンポーネントのデモ
 * 開発時の動作確認用
 */

import { useState } from 'react';
import { ProfileForm } from './ProfileForm';
import type { ProfileFormData } from '../../types/profile';

export function ProfileFormDemo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<ProfileFormData | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  // 編集モード用の初期データ
  const editInitialData: Partial<ProfileFormData> = {
    nickname: 'john-doe',
    name: '山田太郎',
    jobTitle: 'フロントエンドエンジニア',
    bio: 'React、TypeScript、Next.jsを使った開発が得意です。ユーザー体験を重視したWebアプリケーション開発に取り組んでいます。',
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js'],
    yearsOfExperience: '5',
    socialLinks: [
      { service: 'github', url: 'https://github.com/johndoe' },
      { service: 'twitter', url: 'https://twitter.com/johndoe' }
    ],
    imageUrl: 'https://via.placeholder.com/150x150?text=Profile'
  };

  const handleSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // 実際の送信処理をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 成功時の処理
      setLastSubmission(data);
      console.log('送信データ:', data);
      
    } catch (err) {
      setError('プロフィールの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('キャンセルされました');
    setError(null);
    setLastSubmission(null);
  };

  const handleErrorTest = () => {
    setError('テストエラーメッセージ: プロフィールの保存に失敗しました');
  };

  const clearError = () => {
    setError(null);
  };

  const clearSubmission = () => {
    setLastSubmission(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>ProfileForm デモ</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>コントロール</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button
            onClick={() => setMode('create')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: mode === 'create' ? '#3b82f6' : '#f3f4f6',
              color: mode === 'create' ? 'white' : 'black',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            作成モード
          </button>
          <button
            onClick={() => setMode('edit')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: mode === 'edit' ? '#3b82f6' : '#f3f4f6',
              color: mode === 'edit' ? 'white' : 'black',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            編集モード
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
          <button
            onClick={clearSubmission}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            送信データクリア
          </button>
        </div>
      </div>

      <ProfileForm
        initialData={mode === 'edit' ? editInitialData : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
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
          <pre style={{ fontSize: '0.875rem', margin: 0, overflow: 'auto' }}>
            {JSON.stringify(lastSubmission, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}