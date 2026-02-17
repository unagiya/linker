/**
 * NicknameCustomizationNoticeコンポーネント
 * UUID形式のニックネームを持つユーザーに対して、カスタマイズを促す通知を表示
 * 要件: 7.2, 7.4
 */

import { useState, useEffect } from 'react';
import { isUUID } from '../../utils/urlUtils';
import './NicknameCustomizationNotice.css';

interface NicknameCustomizationNoticeProps {
  /** 現在のニックネーム */
  nickname: string;
  /** 通知を閉じたときのコールバック */
  onDismiss?: () => void;
}

/**
 * ローカルストレージのキー
 */
const DISMISSED_NOTICE_KEY = 'nickname-customization-notice-dismissed';

/**
 * 通知が既に閉じられているかをチェック
 */
function isNoticeDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_NOTICE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * 通知を閉じた状態を保存
 */
function setNoticeDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_NOTICE_KEY, 'true');
  } catch {
    // ローカルストレージが使用できない場合は無視
  }
}

export function NicknameCustomizationNotice({
  nickname,
  onDismiss,
}: NicknameCustomizationNoticeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // UUID形式のニックネームで、かつ通知が閉じられていない場合に表示
    if (isUUID(nickname) && !isNoticeDismissed()) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [nickname]);

  const handleDismiss = () => {
    setIsVisible(false);
    setNoticeDismissed();
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="nickname-customization-notice" role="alert" aria-live="polite">
      <div className="nickname-customization-notice-content">
        <div className="nickname-customization-notice-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="nickname-customization-notice-text">
          <h3 className="nickname-customization-notice-title">
            ニックネームをカスタマイズできます
          </h3>
          <p className="nickname-customization-notice-message">
            現在のニックネームは自動生成されたものです。覚えやすいニックネームに変更して、プロフィールURLをカスタマイズしましょう。
          </p>
        </div>
        <button
          className="nickname-customization-notice-close"
          onClick={handleDismiss}
          aria-label="通知を閉じる"
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M15 5L5 15M5 5l10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
