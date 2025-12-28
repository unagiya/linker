/**
 * NicknameAvailabilityコンポーネントのデモ
 * 開発時の動作確認用
 */

import { useState } from 'react';
import { NicknameAvailability } from './NicknameAvailability';
import type { NicknameCheckStatus } from '../../hooks/useNicknameCheck';

export function NicknameAvailabilityDemo() {
  const [status, setStatus] = useState<NicknameCheckStatus>('idle');
  const [message, setMessage] = useState('');

  const statusOptions: Array<{ value: NicknameCheckStatus; label: string; message: string }> = [
    { value: 'idle', label: 'アイドル', message: '' },
    { value: 'checking', label: 'チェック中', message: 'チェック中...' },
    { value: 'available', label: '利用可能', message: 'このニックネームは利用可能です' },
    { value: 'unavailable', label: '利用不可', message: 'このニックネームは既に使用されています' },
    { value: 'error', label: 'エラー', message: 'ニックネームは3-36文字で入力してください' }
  ];

  const handleStatusChange = (newStatus: NicknameCheckStatus) => {
    const option = statusOptions.find(opt => opt.value === newStatus);
    setStatus(newStatus);
    setMessage(option?.message || '');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h2>NicknameAvailability デモ</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>ステータス選択</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                backgroundColor: status === option.value ? '#3b82f6' : 'white',
                color: status === option.value ? 'white' : 'black',
                cursor: 'pointer'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>通常サイズ</h3>
        <NicknameAvailability status={status} message={message} />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>コンパクトサイズ</h3>
        <NicknameAvailability 
          status={status} 
          message={message} 
          className="nickname-availability--compact"
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>インライン表示</h3>
        <p>
          ニックネーム: john-doe{' '}
          <NicknameAvailability 
            status={status} 
            message={message}
            className="nickname-availability--inline"
          />
        </p>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <p>現在のステータス: {status}</p>
        <p>現在のメッセージ: {message}</p>
      </div>
    </div>
  );
}