/**
 * TextAreaコンポーネント
 */

import type { TextareaHTMLAttributes } from "react";
import "./TextArea.css";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** ラベル */
  label?: string;
  /** エラーメッセージ */
  error?: string;
  /** 必須フィールド */
  required?: boolean;
}

export function TextArea({
  label,
  error,
  required,
  className = "",
  id,
  ...props
}: TextAreaProps) {
  const textareaId =
    id || `textarea-${label?.replace(/\s+/g, "-").toLowerCase()}`;
  const hasError = !!error;

  return (
    <div className="textarea-wrapper">
      {label && (
        <label htmlFor={textareaId} className="textarea-label">
          {label}
          {required && <span className="textarea-required">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`textarea ${hasError ? "textarea--error" : ""} ${className}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${textareaId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${textareaId}-error`} className="textarea-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
