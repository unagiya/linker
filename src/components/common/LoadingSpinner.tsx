/**
 * LoadingSpinnerコンポーネント
 */

import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
  /** サイズ */
  size?: "small" | "medium" | "large";
  /** メッセージ */
  message?: string;
}

export function LoadingSpinner({
  size = "medium",
  message,
}: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner loading-spinner--${size}`} role="status">
        <span className="loading-spinner-sr-only">読み込み中...</span>
      </div>
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );
}
