/**
 * 認証関連の型定義
 * Supabase Authに関連する型を定義
 */

/**
 * ユーザー型（Supabase Auth）
 */
export interface User {
  /** SupabaseのユーザーID（UUID） */
  id: string;
  /** メールアドレス */
  email: string;
  /** アカウント作成日時 */
  created_at: string;
}

/**
 * セッション型（Supabase Auth）
 */
export interface Session {
  /** アクセストークン */
  access_token: string;
  /** リフレッシュトークン */
  refresh_token: string;
  /** トークンの有効期限（秒） */
  expires_in: number;
  /** トークンの有効期限（Unix時間） */
  expires_at?: number;
  /** トークンタイプ */
  token_type: string;
  /** ユーザー情報 */
  user: User;
}
