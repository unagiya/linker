/**
 * NicknameAvailabilityコンポーネント
 * ニックネームの利用可能性状態を表示する
 */

import type { NicknameCheckStatus } from '../../hooks/useNicknameCheck';
import './NicknameAvailability.css';

interface NicknameAvailabilityProps {
  /** ニックネームチェックの状態 */
  status: NicknameCheckStatus;
  /** 表示するメッセージ */
  message?: string;
  /** 追加のCSSクラス */
  className?: string;
}

export function NicknameAvailability({
  status,
  message,
  className = ''
}: NicknameAvailabilityProps) {
  // ステータスに応じたアイコンを取得
  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="nickname-availability-icon nickname-availability-icon--loading" aria-label="チェック中">
            <div className="nickname-availability-spinner" />
          </div>
        );
      case 'available':
        return (
          <div className="nickname-availability-icon nickname-availability-icon--success" aria-label="利用可能">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        );
      case 'unavailable':
      case 'error':
        return (
          <div className="nickname-availability-icon nickname-availability-icon--error" aria-label="エラー">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  // ステータスに応じたメッセージスタイルクラスを取得
  const getMessageClassName = () => {
    const baseClass = 'nickname-availability-message';
    const classes = [baseClass];
    
    switch (status) {
      case 'checking':
        classes.push(`${baseClass}--checking`);
        break;
      case 'available':
        classes.push(`${baseClass}--success`);
        break;
      case 'unavailable':
      case 'error':
        classes.push(`${baseClass}--error`);
        break;
      default:
        break;
    }
    
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  };

  // アイドル状態では何も表示しない
  if (status === 'idle') {
    return null;
  }

  // aria-live属性を決定
  const getAriaLive = () => {
    switch (status) {
      case 'checking':
        return 'polite';
      case 'available':
      case 'unavailable':
      case 'error':
        return 'assertive';
      default:
        return undefined;
    }
  };

  return (
    <div 
      className={`nickname-availability ${getMessageClassName()}`}
      role="status"
      aria-live={getAriaLive()}
    >
      {getStatusIcon()}
      {message && (
        <span className="nickname-availability-text">
          {message}
        </span>
      )}
    </div>
  );
}