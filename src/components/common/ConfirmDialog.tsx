/**
 * ConfirmDialogコンポーネント
 * 確認ダイアログ
 */

import { Button } from "./Button";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  /** ダイアログを表示するか */
  isOpen: boolean;
  /** タイトル */
  title: string;
  /** メッセージ */
  message: string;
  /** 確認ボタンのテキスト */
  confirmText?: string;
  /** キャンセルボタンのテキスト */
  cancelText?: string;
  /** 確認ボタンのバリアント */
  confirmVariant?: "primary" | "secondary" | "danger";
  /** 確認ハンドラ */
  onConfirm: () => void;
  /** キャンセルハンドラ */
  onCancel: () => void;
  /** 処理中フラグ */
  isProcessing?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "確認",
  cancelText = "キャンセル",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  isProcessing = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <h2 id="dialog-title" className="confirm-dialog-title">
          {title}
        </h2>
        <p id="dialog-message" className="confirm-dialog-message">
          {message}
        </p>
        <div className="confirm-dialog-actions">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "処理中..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
