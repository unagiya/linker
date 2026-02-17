/**
 * NicknameCustomizationNoticeコンポーネントのデモページ
 */

import { useState } from 'react';
import { NicknameCustomizationNotice } from './NicknameCustomizationNotice';
import './NicknameCustomizationNotice.css';

export function NicknameCustomizationNoticeDemo() {
  const [nickname, setNickname] = useState('550e8400-e29b-41d4-a716-446655440000');
  const [showNotice, setShowNotice] = useState(true);

  const handleDismiss = () => {
    console.log('通知が閉じられました');
  };

  const handleReset = () => {
    // ローカルストレージをクリアして通知を再表示
    localStorage.removeItem('nickname-customization-notice-dismissed');
    setShowNotice(false);
    setTimeout(() => setShowNotice(true), 100);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>NicknameCustomizationNotice デモ</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>コントロール</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label>
            ニックネーム:
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.5rem', width: '300px' }}
            />
          </label>
        </div>
        <button
          onClick={handleReset}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          通知をリセット
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>通知の表示</h2>
        <p>UUID形式のニックネームの場合に通知が表示されます。</p>
        {showNotice && (
          <NicknameCustomizationNotice nickname={nickname} onDismiss={handleDismiss} />
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>テストケース</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => setNickname('550e8400-e29b-41d4-a716-446655440000')}
            style={{ padding: '0.5rem', textAlign: 'left' }}
          >
            UUID形式のニックネーム（通知表示）
          </button>
          <button
            onClick={() => setNickname('john-doe')}
            style={{ padding: '0.5rem', textAlign: 'left' }}
          >
            カスタムニックネーム（通知非表示）
          </button>
          <button
            onClick={() => setNickname('123e4567-e89b-12d3-a456-426614174000')}
            style={{ padding: '0.5rem', textAlign: 'left' }}
          >
            別のUUID形式（通知表示）
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>現在の状態</h2>
        <ul>
          <li>ニックネーム: {nickname}</li>
          <li>UUID形式: {/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(nickname) ? 'はい' : 'いいえ'}</li>
          <li>通知が閉じられた: {localStorage.getItem('nickname-customization-notice-dismissed') === 'true' ? 'はい' : 'いいえ'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>機能説明</h2>
        <ul>
          <li>UUID形式のニックネームを持つユーザーに通知を表示</li>
          <li>通知を閉じると、ローカルストレージに保存され、再表示されない</li>
          <li>「通知をリセット」ボタンで、ローカルストレージをクリアして再表示可能</li>
          <li>カスタムニックネームの場合は通知を表示しない</li>
        </ul>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>アクセシビリティ</h2>
        <ul>
          <li>role="alert"とaria-live="polite"で支援技術に通知</li>
          <li>閉じるボタンにaria-label属性を設定</li>
          <li>キーボード操作に対応</li>
          <li>フォーカス表示を明確に</li>
        </ul>
      </div>
    </div>
  );
}
