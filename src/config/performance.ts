/**
 * パフォーマンス最適化の設定
 * 要件10.1, 10.2, 10.4, 10.5に基づく設定値
 */

/**
 * キャッシュ設定
 */
export const CACHE_CONFIG = {
  /** ニックネーム利用可能性チェックのキャッシュTTL（ミリ秒） */
  AVAILABILITY_TTL: 30 * 1000, // 30秒
  
  /** プロフィール検索のキャッシュTTL（ミリ秒） */
  PROFILE_TTL: 5 * 60 * 1000, // 5分
  
  /** 最大キャッシュサイズ */
  MAX_CACHE_SIZE: {
    AVAILABILITY: 200,
    PROFILE: 100
  },
  
  /** クリーンアップ間隔（ミリ秒） */
  CLEANUP_INTERVAL: 5 * 60 * 1000 // 5分
} as const;

/**
 * レート制限設定
 */
export const RATE_LIMIT_CONFIG = {
  /** ニックネーム利用可能性チェックのレート制限 */
  AVAILABILITY_CHECK: {
    maxRequests: 5,
    windowMs: 1000, // 1秒
    message: 'ニックネームチェックのリクエストが多すぎます。少し待ってから再試行してください'
  },
  
  /** プロフィール検索のレート制限 */
  PROFILE_SEARCH: {
    maxRequests: 10,
    windowMs: 1000, // 1秒
    message: 'プロフィール検索のリクエストが多すぎます。少し待ってから再試行してください'
  },
  
  /** ニックネーム更新のレート制限 */
  NICKNAME_UPDATE: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1分
    message: 'ニックネーム更新のリクエストが多すぎます。少し待ってから再試行してください'
  }
} as const;

/**
 * パフォーマンス監視設定
 */
export const PERFORMANCE_CONFIG = {
  /** ニックネーム利用可能性チェックの目標レスポンス時間（ミリ秒） */
  AVAILABILITY_CHECK_TARGET: 200, // 要件10.1
  
  /** プロフィール検索の目標レスポンス時間（ミリ秒） */
  PROFILE_SEARCH_TARGET: 200,
  
  /** 警告を出す閾値（ミリ秒） */
  WARNING_THRESHOLD: 200,
  
  /** パフォーマンスログを有効にするか */
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  
  /** メトリクスを保存するか */
  SAVE_METRICS: true,
  
  /** 最大メトリクス保存数 */
  MAX_METRICS_SIZE: 1000
} as const;

/**
 * デバウンス設定
 */
export const DEBOUNCE_CONFIG = {
  /** ニックネーム入力のデバウンス遅延（ミリ秒） */
  NICKNAME_INPUT: 500, // 要件5.1
  
  /** 検索入力のデバウンス遅延（ミリ秒） */
  SEARCH_INPUT: 300
} as const;

/**
 * データベースクエリ最適化設定
 */
export const DATABASE_CONFIG = {
  /** クエリタイムアウト（ミリ秒） */
  QUERY_TIMEOUT: 5000,
  
  /** リトライ設定 */
  RETRY: {
    maxRetries: 2,
    retryDelay: 1000,
    exponentialBackoff: true
  },
  
  /** インデックス使用の確認 */
  USE_INDEXES: true, // 要件10.2
  
  /** データベース関数の使用 */
  USE_DB_FUNCTIONS: true // 要件10.2
} as const;
