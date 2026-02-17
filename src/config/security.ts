/**
 * セキュリティ設定
 * アプリケーション全体のセキュリティポリシーを定義
 */

/**
 * レート制限設定
 * 要件10.4: DDoS攻撃対策のためのレート制限
 */
export const RATE_LIMIT_CONFIG = {
  /** ニックネームチェックのレート制限 */
  nicknameCheck: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1分間に20回まで
  },
  /** プロフィール更新のレート制限 */
  profileUpdate: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1分間に10回まで
  },
  /** 認証リクエストのレート制限 */
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15分間に5回まで
  },
} as const;

/**
 * 入力検証設定
 * 要件2: ニックネームバリデーションルール
 */
export const INPUT_VALIDATION_CONFIG = {
  /** ニックネームの制限（要件2.1, 2.2） */
  nickname: {
    minLength: 3,
    maxLength: 36,
    pattern: /^[a-zA-Z0-9_-]+$/,
    allowedChars: '英数字、ハイフン、アンダースコア',
  },
  /** 名前の制限 */
  name: {
    minLength: 1,
    maxLength: 100,
  },
  /** 自己紹介の制限 */
  bio: {
    maxLength: 500,
  },
  /** URLの制限 */
  url: {
    maxLength: 2048,
    allowedProtocols: ['http:', 'https:', 'mailto:'],
  },
} as const;

/**
 * セキュリティヘッダー設定
 * Content Security Policy (CSP) の設定
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

/**
 * SQLインジェクション対策
 * 要件10.3: SQLインジェクション攻撃の防止
 * 
 * Supabaseは自動的にパラメータ化クエリを使用するため、
 * 追加の対策は不要だが、念のため危険なパターンを検出
 */
export const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /('|(\\')|('')|(%27)|(%23)|(%2D%2D))/gi,
] as const;

/**
 * XSS攻撃対策
 * 危険なHTMLタグとスクリプトパターン
 */
export const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload等のイベントハンドラ
] as const;

/**
 * セキュリティ設定のバリデーション
 * 開発時に設定が正しいことを確認
 */
export function validateSecurityConfig(): boolean {
  // レート制限設定の検証
  const rateLimitValid = Object.values(RATE_LIMIT_CONFIG).every(
    (config) => config.maxRequests > 0 && config.windowMs > 0
  );

  // 入力検証設定の検証
  const inputValidationValid = 
    INPUT_VALIDATION_CONFIG.nickname.minLength > 0 &&
    INPUT_VALIDATION_CONFIG.nickname.maxLength > INPUT_VALIDATION_CONFIG.nickname.minLength;

  return rateLimitValid && inputValidationValid;
}

/**
 * セキュリティ設定のログ出力（開発環境のみ）
 */
export function logSecurityConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 セキュリティ設定:');
    console.log('  - レート制限:', RATE_LIMIT_CONFIG);
    console.log('  - 入力検証:', INPUT_VALIDATION_CONFIG);
    console.log('  - 設定検証:', validateSecurityConfig() ? '✓ OK' : '✗ NG');
  }
}
