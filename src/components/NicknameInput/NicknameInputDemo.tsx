/**
 * NicknameInputコンポーネントのデモ
 * 開発時の動作確認用
 */

import { useState } from 'react';
import { NicknameInput } from './NicknameInput';

export function NicknameInputDemo() {
  const [nickname, setNickname] = useState('');
  const [isValid, setIsValid] = useState(false);

  return (
    <div style={{ padding: '2rem', maxWidth: '400px' }}>
      <h2>NicknameInput デモ</h2>
      
      <NicknameInput
        value={nickname}
        onChange={setNickname}
        onValidationChange={setIsValid}
        required
        placeholder="ニックネームを入力してください"
      />
      
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <p>現在の値: {nickname}</p>
        <p>バリデーション状態: {isValid ? '✅ 有効' : '❌ 無効'}</p>
      </div>
    </div>
  );
}