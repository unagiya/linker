/**
 * NicknameInputコンポーネント
 * ニックネーム入力とリアルタイムバリデーション機能を提供
 */

import { useState, useEffect } from 'react';
import type { InputHTMLAttributes } from 'react';
import { useNicknameCheck } from '../../hooks/useNicknameCheck';
import { NicknameAvailability } from '../NicknameAvailability';
import './NicknameInput.css';

interface NicknameInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** ニックネームの値 */
  value: string;
  /** 値変更ハンドラ */
  onChange: (value: string) => void;
  /** バリデーション状態変更ハンドラ */
  onValidationChange?: (isValid: boolean) => void;
  /** ラベル */
  label?: string;
  /** エラーメッセージ */
  error?: string;
  /** 必須フィールド */
  required?: boolean;
  /** ヘルプテキストを表示するか */
  showHelp?: boolean;
  /** 現在のニックネーム（編集時に除外するため） */
  currentNickname?: string;
}

export function NicknameInput({
  value,
  onChange,
  onValidationChange,
  label = 'ニックネーム',
  error,
  required = false,
  showHelp = true,
  currentNickname,
  className = '',
  id,
  ...props
}: NicknameInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  // ニックネーム利用可能性チェック
  const nicknameCheck = useNicknameCheck(value, {
    currentNickname,
    debounceDelay: 500
  });

  const inputId = id || 'nickname-input';
  
  // バリデーション状態が変更されたら親に通知
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(nicknameCheck.isValid && nicknameCheck.isAvailable);
    }
  }, [nicknameCheck.isValid, nicknameCheck.isAvailable, onValidationChange]);

  // 入力フィールドのスタイルクラスを決定
  const getInputClassName = () => {
    const baseClass = 'nickname-input';
    const classes = [baseClass];
    
    // 外部エラーまたは内部エラー状態
    if (error || nicknameCheck.status === 'error' || nicknameCheck.status === 'unavailable') {
      classes.push(`${baseClass}--error`);
    } else if (nicknameCheck.status === 'available') {
      classes.push(`${baseClass}--success`);
    }
    
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  };

  // ステータスアイコンを取得
  const getStatusIcon = () => {
    // NicknameAvailabilityコンポーネントを使用
    return (
      <div className="nickname-input-status">
        <NicknameAvailability 
          status={nicknameCheck.status} 
          message=""
          className="nickname-availability--inline"
        />
      </div>
    );
  };

  return (
    <div className="nickname-input-wrapper">
      {label && (
        <label htmlFor={inputId} className="nickname-input-label">
          {label}
          {required && <span className="nickname-input-required">*</span>}
        </label>
      )}
      
      <div className="nickname-input-container">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={getInputClassName()}
          aria-invalid={!!(error || nicknameCheck.status === 'error' || nicknameCheck.status === 'unavailable')}
          aria-describedby={`${inputId}-help ${error ? `${inputId}-error` : ''}`.trim()}
          {...props}
        />
        {getStatusIcon()}
      </div>

      {/* ヘルプテキスト */}
      {showHelp && (isFocused || !value) && (
        <div id={`${inputId}-help`} className="nickname-input-help">
          3-36文字の英数字、ハイフン、アンダースコアが使用できます。記号で始まったり終わったりすることはできません。
        </div>
      )}

      {/* ニックネーム利用可能性表示 */}
      {nicknameCheck.status !== 'idle' && (
        <NicknameAvailability 
          status={nicknameCheck.status}
          message={nicknameCheck.message}
        />
      )}

      {/* 外部エラーメッセージ（バリデーション以外のエラー） */}
      {error && (
        <div id={`${inputId}-error`} className="nickname-input-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}