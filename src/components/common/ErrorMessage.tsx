/**
 * ErrorMessageコンポーネント
 */

import "./ErrorMessage.css";

interface ErrorMessageProps {
  /** エラーメッセージ */
  message: string;
  /** 閉じるボタンのコールバック */
  onClose?: () => void;
}

export function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return (
    <div className="error-message" role="alert">
      <div className="error-message-content">
        <svg
          className="error-message-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="error-message-text">{message}</span>
      </div>
      {onClose && (
        <button
          className="error-message-close"
          onClick={onClose}
          aria-label="エラーメッセージを閉じる"
        >
          <svg
            className="error-message-close-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
