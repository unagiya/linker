/**
 * AuthFormコンポーネント
 * アカウント登録・ログインフォーム
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { NicknameInput } from '../NicknameInput';
import { validateSignUp, validateSignIn } from '../../utils/validation';
import './AuthForm.css';

interface AuthFormProps {
  /** モード（登録またはログイン） */
  mode: 'signup' | 'signin';
  /** 送信ハンドラ */
  onSubmit: (email: string, password: string, nickname?: string) => Promise<void>;
  /** モード切り替えハンドラ */
  onModeChange?: () => void;
  /** ローディング状態 */
  loading?: boolean;
  /** エラーメッセージ */
  error?: string | null;
  /** ネイティブバリデーションを無効化（テスト用） */
  noValidate?: boolean;
}

export function AuthForm({
  mode,
  onSubmit,
  onModeChange,
  loading = false,
  error = null,
  noValidate = false,
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string[];
    password?: string[];
    nickname?: string[];
  }>({});

  const isSignUp = mode === 'signup';
  const title = isSignUp ? 'アカウント登録' : 'ログイン';
  const submitButtonText = isSignUp ? '登録' : 'ログイン';
  const modeChangeText = isSignUp
    ? '既にアカウントをお持ちですか？'
    : 'アカウントをお持ちでないですか？';
  const modeChangeButtonText = isSignUp ? 'ログイン' : '登録';

  /**
   * フォーム送信ハンドラ
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // バリデーション
    const validationData = isSignUp 
      ? { email, password, nickname }
      : { email, password };
    
    const validationResult = isSignUp
      ? validateSignUp(validationData)
      : validateSignIn(validationData);

    if (!validationResult.success) {
      setValidationErrors(validationResult.errors);
      return;
    }

    // 登録時のニックネーム利用可能性チェック
    if (isSignUp && !isNicknameValid) {
      setValidationErrors({
        nickname: ['ニックネームが利用できません']
      });
      return;
    }

    // バリデーションエラーをクリア
    setValidationErrors({});

    // 送信
    try {
      await onSubmit(email, password, isSignUp ? nickname : undefined);
    } catch {
      // エラーは親コンポーネントで処理される
    }
  };

  /**
   * メールアドレス変更ハンドラ
   */
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // リアルタイムバリデーション
    if (validationErrors.email) {
      const validationData = isSignUp 
        ? { email: value, password, nickname }
        : { email: value, password };
      
      const result = isSignUp
        ? validateSignUp(validationData)
        : validateSignIn(validationData);
      if (result.success || !result.errors.email) {
        setValidationErrors((prev) => ({ ...prev, email: undefined }));
      }
    }
  };

  /**
   * パスワード変更ハンドラ
   */
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // リアルタイムバリデーション
    if (validationErrors.password) {
      const validationData = isSignUp 
        ? { email, password: value, nickname }
        : { email, password: value };
      
      const result = isSignUp
        ? validateSignUp(validationData)
        : validateSignIn(validationData);
      if (result.success || !result.errors.password) {
        setValidationErrors((prev) => ({ ...prev, password: undefined }));
      }
    }
  };

  /**
   * ニックネーム変更ハンドラ
   */
  const handleNicknameChange = (value: string) => {
    setNickname(value);
    // バリデーションエラーをクリア
    if (validationErrors.nickname) {
      setValidationErrors((prev) => ({ ...prev, nickname: undefined }));
    }
  };

  /**
   * ニックネームバリデーション状態変更ハンドラ
   */
  const handleNicknameValidationChange = (isValid: boolean) => {
    setIsNicknameValid(isValid);
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-card">
        <h1 className="auth-form-title">{title}</h1>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="auth-form" noValidate={noValidate}>
          <Input
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            error={validationErrors.email?.[0]}
            required
            disabled={loading}
            autoComplete="email"
          />

          <Input
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            error={validationErrors.password?.[0]}
            required
            disabled={loading}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />

          {isSignUp && (
            <NicknameInput
              value={nickname}
              onChange={handleNicknameChange}
              onValidationChange={handleNicknameValidationChange}
              error={validationErrors.nickname?.[0]}
              required
              disabled={loading}
              placeholder="例: john-doe"
            />
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? '処理中...' : submitButtonText}
          </Button>
        </form>

        {onModeChange && (
          <div className="auth-form-mode-change">
            <p className="auth-form-mode-change-text">{modeChangeText}</p>
            <button
              type="button"
              onClick={onModeChange}
              className="auth-form-mode-change-button"
              disabled={loading}
            >
              {modeChangeButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
