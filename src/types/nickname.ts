/**
 * ニックネーム関連の型定義
 * 要件2: ニックネームバリデーション
 */

/**
 * ニックネームバリデーション結果
 */
export interface NicknameValidationResult {
  /** バリデーションが成功したかどうか */
  isValid: boolean;
  /** エラーメッセージ（バリデーション失敗時） */
  error?: string;
}

/**
 * ニックネーム利用可能性チェック結果
 * 要件5: ニックネーム利用可能性チェック
 */
export interface NicknameAvailabilityResult {
  /** ニックネームが利用可能かどうか */
  isAvailable: boolean;
  /** チェック中かどうか */
  isChecking: boolean;
  /** エラーメッセージ（チェック失敗時） */
  error?: string;
}

/**
 * ニックネーム利用可能性チェック状態
 */
export type NicknameCheckStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

/**
 * 予約語リスト
 * 要件2.6: これらのニックネームは使用できません
 */
export const RESERVED_NICKNAMES = [
  'admin', 'api', 'www', 'profile', 'signin', 'signup', 'login', 'logout',
  'create', 'edit', 'delete', 'settings', 'help', 'about', 'contact',
  'terms', 'privacy', 'support', 'blog', 'news', 'docs', 'documentation'
] as const;

/**
 * 予約語の型
 */
export type ReservedNickname = typeof RESERVED_NICKNAMES[number];