/**
 * URL関連のユーティリティ関数
 * 要件3: ニックネームベースURL
 */

/**
 * UUID v4形式の正規表現
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 文字列がUUID形式かどうかを判定
 * 要件7.4: UUID形式のニックネームを持つユーザーへの通知表示に使用
 * 
 * @param value - チェックする文字列
 * @returns UUID形式の場合true
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * ニックネームが有効な形式かどうかを判定（簡易チェック）
 * 要件2: ニックネームバリデーション
 * 
 * @param value - チェックする文字列
 * @returns ニックネーム形式の場合true
 */
export function isNicknameFormat(value: string): boolean {
  // 3-36文字、英数字とハイフン・アンダースコアのみ（要件2.1, 2.2）
  return /^[a-zA-Z0-9_-]{3,36}$/.test(value);
}
