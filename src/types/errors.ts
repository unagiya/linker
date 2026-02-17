/**
 * エラー型定義
 * ニックネーム機能のエラーハンドリングを統一的に管理
 */

/**
 * エラーの種類
 */
export enum ErrorType {
  /** バリデーションエラー */
  VALIDATION = 'VALIDATION',
  /** ネットワークエラー */
  NETWORK = 'NETWORK',
  /** データベースエラー */
  DATABASE = 'DATABASE',
  /** 認証エラー */
  AUTHENTICATION = 'AUTHENTICATION',
  /** 権限エラー */
  AUTHORIZATION = 'AUTHORIZATION',
  /** 重複エラー */
  DUPLICATE = 'DUPLICATE',
  /** 見つからないエラー */
  NOT_FOUND = 'NOT_FOUND',
  /** 不明なエラー */
  UNKNOWN = 'UNKNOWN',
}

/**
 * アプリケーションエラーの基底クラス
 */
export class AppError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly originalError?: unknown,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * エラーをログに記録
   */
  log(): void {
    console.error(`[${this.type}] ${this.message}`, this.originalError);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(ErrorType.VALIDATION, message, originalError, false);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * ネットワークエラー
 */
export class NetworkError extends AppError {
  constructor(message: string = '接続エラーが発生しました。再試行してください', originalError?: unknown) {
    super(ErrorType.NETWORK, message, originalError, true);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * データベースエラー
 */
export class DatabaseError extends AppError {
  constructor(message: string = '変更の保存に失敗しました。しばらく待ってから再試行してください', originalError?: unknown) {
    super(ErrorType.DATABASE, message, originalError, true);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * 重複エラー
 */
export class DuplicateError extends AppError {
  constructor(message: string = 'このニックネームは既に使用されています', originalError?: unknown) {
    super(ErrorType.DUPLICATE, message, originalError, false);
    this.name = 'DuplicateError';
    Object.setPrototypeOf(this, DuplicateError.prototype);
  }
}

/**
 * 見つからないエラー
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'プロフィールが見つかりません', originalError?: unknown) {
    super(ErrorType.NOT_FOUND, message, originalError, false);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Supabaseエラーコード
 */
export const SUPABASE_ERROR_CODES = {
  /** データが見つからない */
  NOT_FOUND: 'PGRST116',
  /** ユニーク制約違反 */
  UNIQUE_VIOLATION: '23505',
  /** 外部キー制約違反 */
  FOREIGN_KEY_VIOLATION: '23503',
  /** NOT NULL制約違反 */
  NOT_NULL_VIOLATION: '23502',
} as const;

/**
 * エラーを適切なAppErrorに変換
 */
export function toAppError(error: unknown): AppError {
  // 既にAppErrorの場合はそのまま返す
  if (error instanceof AppError) {
    return error;
  }

  // Supabaseエラーの場合
  if (isSupabaseError(error)) {
    return handleSupabaseError(error);
  }

  // ネットワークエラーの場合
  if (isNetworkError(error)) {
    return new NetworkError('接続エラーが発生しました。再試行してください', error);
  }

  // 通常のErrorオブジェクトの場合
  if (error instanceof Error) {
    return new AppError(ErrorType.UNKNOWN, error.message, error, false);
  }

  // その他の場合
  return new AppError(
    ErrorType.UNKNOWN,
    '予期しないエラーが発生しました',
    error,
    false
  );
}

/**
 * Supabaseエラーかどうかを判定
 */
function isSupabaseError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

/**
 * ネットワークエラーかどうかを判定
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    );
  }
  return false;
}

/**
 * Supabaseエラーを適切なAppErrorに変換
 */
function handleSupabaseError(error: { code: string; message: string }): AppError {
  switch (error.code) {
    case SUPABASE_ERROR_CODES.NOT_FOUND:
      return new NotFoundError('プロフィールが見つかりません', error);
    
    case SUPABASE_ERROR_CODES.UNIQUE_VIOLATION:
      return new DuplicateError('このニックネームは既に使用されています', error);
    
    case SUPABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION:
    case SUPABASE_ERROR_CODES.NOT_NULL_VIOLATION:
      return new DatabaseError('データの整合性エラーが発生しました', error);
    
    default:
      return new DatabaseError(
        '変更の保存に失敗しました。しばらく待ってから再試行してください',
        error
      );
  }
}
