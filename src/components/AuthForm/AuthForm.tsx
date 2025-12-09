/**
 * AuthFormコンポーネント
 * アカウント登録・ログインフォーム
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { validateSignUp, validateSignIn } from '../../utils/validation';
import './AuthForm.css';

interface AuthFormProps {
  /** モード（登録またはログイン） */
  mode: 'signup' | 'signin';
  /** 送信ハンドラ */
  onSubmit: (email: string, password: string) => Promise<void>;
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
  const [validationErrors, setValidationErrors] = useState<{
    email?: string[];
    password?: string[];
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
    const validationResult = isSignUp
      ? validateSignUp({ email, password })
      : validateSignIn({ email, password });

    if (!validationResult.success) {
      setValidationErrors(validationResult.errors);
      return;
    }

    // バリデーションエラーをクリア
    setValidationErrors({});

    // 送信
    try {
      await onSubmit(email, password);
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
      const result = isSignUp
        ? validateSignUp({ email: value, password })
        : validateSignIn({ email: value, password });
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
      const result = isSignUp
        ? validateSignUp({ email, password: value })
        : validateSignIn({ email, password: value });
      if (result.success || !result.errors.password) {
        setValidationErrors((prev) => ({ ...prev, password: undefined }));
      }
    }
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
