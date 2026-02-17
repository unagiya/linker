/**
 * 入力サニタイゼーションユーティリティ
 * XSS攻撃やSQLインジェクション攻撃を防ぐための入力検証とサニタイゼーション機能
 */

/**
 * HTMLエスケープマップ
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * HTML特殊文字をエスケープする
 * XSS攻撃を防ぐために使用
 * 
 * @param text - エスケープするテキスト
 * @returns エスケープされたテキスト
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * SQLインジェクション攻撃に使用される可能性のある危険な文字パターン
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /('|(\\')|('')|(%27)|(%23)|(%2D%2D))/gi,
];

/**
 * SQLインジェクション攻撃のパターンをチェックする
 * 注意: Supabaseはパラメータ化クエリを使用しているため、これは追加の防御層として機能
 * 
 * @param input - チェックする入力
 * @returns 危険なパターンが検出された場合はtrue
 */
export function containsSqlInjectionPattern(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * ニックネーム入力をサニタイズする
 * 許可された文字のみを残し、危険なパターンを検出
 * 
 * セキュリティ対策:
 * - SQLインジェクションパターンの検出（要件10.3）
 * - 許可された文字のみを受け入れ（要件2.2）
 * 
 * @param nickname - サニタイズするニックネーム
 * @returns サニタイズされたニックネーム
 * @throws Error 危険なパターンが検出された場合
 */
export function sanitizeNickname(nickname: string): string {
  // 空白文字を削除
  const trimmed = nickname.trim();

  // SQLインジェクションパターンのチェック
  if (containsSqlInjectionPattern(trimmed)) {
    throw new Error('無効な文字が含まれています');
  }

  // 許可された文字のみを残す（英数字、ハイフン、アンダースコア）
  const sanitized = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');

  return sanitized;
}

/**
 * テキスト入力をサニタイズする
 * HTMLタグを削除し、特殊文字をエスケープ
 * 
 * @param text - サニタイズするテキスト
 * @param maxLength - 最大文字数（オプション）
 * @returns サニタイズされたテキスト
 */
export function sanitizeText(text: string, maxLength?: number): string {
  // 空白文字をトリム
  let sanitized = text.trim();

  // HTMLタグを削除
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // HTML特殊文字をエスケープ
  sanitized = escapeHtml(sanitized);

  // 最大文字数制限
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * URL入力をサニタイズする
 * 危険なプロトコルやスクリプトを検出
 * 
 * @param url - サニタイズするURL
 * @returns サニタイズされたURL
 * @throws Error 危険なURLパターンが検出された場合
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  // 危険なプロトコルのチェック
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    throw new Error('無効なURLプロトコルです');
  }

  // 許可されたプロトコルのみを受け入れる
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  const hasProtocol = allowedProtocols.some(protocol => lowerUrl.startsWith(protocol));
  
  if (!hasProtocol && trimmed.includes(':')) {
    throw new Error('無効なURLプロトコルです');
  }

  return trimmed;
}

/**
 * 入力文字列の長さを検証する
 * 
 * @param input - 検証する入力
 * @param minLength - 最小文字数
 * @param maxLength - 最大文字数
 * @returns 検証結果
 */
export function validateLength(
  input: string,
  minLength: number,
  maxLength: number
): { isValid: boolean; error?: string } {
  const length = input.length;

  if (length < minLength) {
    return {
      isValid: false,
      error: `${minLength}文字以上で入力してください`,
    };
  }

  if (length > maxLength) {
    return {
      isValid: false,
      error: `${maxLength}文字以下で入力してください`,
    };
  }

  return { isValid: true };
}

/**
 * 複数の入力をバッチでサニタイズする
 * 
 * @param inputs - サニタイズする入力のマップ
 * @param sanitizer - 使用するサニタイザー関数
 * @returns サニタイズされた入力のマップ
 */
export function sanitizeBatch<T extends Record<string, string>>(
  inputs: T,
  sanitizer: (value: string) => string = sanitizeText
): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(inputs)) {
    sanitized[key as keyof T] = sanitizer(value) as T[keyof T];
  }

  return sanitized;
}
