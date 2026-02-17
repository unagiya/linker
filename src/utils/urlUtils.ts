/**
 * URL関連のユーティリティ関数
 */

/**
 * UUID v4形式の正規表現
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 文字列がUUID形式かどうかを判定
 * @param value - チェックする文字列
 * @returns UUID形式の場合true
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * ニックネームが有効な形式かどうかを判定（簡易チェック）
 * @param value - チェックする文字列
 * @returns ニックネーム形式の場合true
 */
export function isNicknameFormat(value: string): boolean {
  // 3-36文字、英数字とハイフン・アンダースコアのみ
  return /^[a-zA-Z0-9_-]{3,36}$/.test(value);
}
