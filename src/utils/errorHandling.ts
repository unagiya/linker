/**
 * エラーハンドリングユーティリティ
 * リトライ機能やエラー回復機能を提供
 */

import { toAppError, AppError, NetworkError, DatabaseError } from '../types/errors';

// getErrorMessage関数をエクスポート
export { getErrorMessage, isRetryable, isNetworkError, isDatabaseError } from './errorUtils';

/**
 * リトライオプション
 */
export interface RetryOptions {
  /** 最大リトライ回数 */
  maxRetries?: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
  /** 指数バックオフを使用するか */
  exponentialBackoff?: boolean;
  /** リトライ可能なエラーかどうかを判定する関数 */
  shouldRetry?: (error: AppError) => boolean;
  /** リトライ前に実行するコールバック */
  onRetry?: (error: AppError, attempt: number) => void;
}

/**
 * デフォルトのリトライオプション
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  shouldRetry: (error: AppError) => error.retryable,
  onRetry: () => {},
};

/**
 * リトライ機能付きで非同期関数を実行
 * 
 * @param fn - 実行する非同期関数
 * @param options - リトライオプション
 * @returns 関数の実行結果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = toAppError(error);
      lastError.log();

      // 最後の試行の場合はエラーをスロー
      if (attempt === opts.maxRetries) {
        throw lastError;
      }

      // リトライ可能かチェック
      if (!opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // リトライコールバックを実行
      opts.onRetry(lastError, attempt + 1);

      // 待機時間を計算
      const delay = opts.exponentialBackoff
        ? opts.retryDelay * Math.pow(2, attempt)
        : opts.retryDelay;

      // 待機
      await sleep(delay);
    }
  }

  // ここには到達しないはずだが、型安全性のため
  throw lastError || new Error('予期しないエラーが発生しました');
}

/**
 * エラーハンドリング付きで非同期関数を実行
 * エラーが発生した場合はデフォルト値を返す
 * 
 * @param fn - 実行する非同期関数
 * @param defaultValue - エラー時のデフォルト値
 * @param onError - エラー時のコールバック
 * @returns 関数の実行結果またはデフォルト値
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  onError?: (error: AppError) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const appError = toAppError(error);
    appError.log();
    
    if (onError) {
      onError(appError);
    }
    
    return defaultValue;
  }
}

/**
 * タイムアウト付きで非同期関数を実行
 * 
 * @param fn - 実行する非同期関数
 * @param timeoutMs - タイムアウト時間（ミリ秒）
 * @returns 関数の実行結果
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    sleep(timeoutMs).then(() => {
      throw new NetworkError('リクエストがタイムアウトしました');
    }),
  ]);
}

/**
 * 複数の非同期関数を順次実行し、最初に成功した結果を返す
 * すべて失敗した場合は最後のエラーをスロー
 * 
 * @param fns - 実行する非同期関数の配列
 * @returns 最初に成功した関数の実行結果
 */
export async function trySequentially<T>(
  fns: Array<() => Promise<T>>
): Promise<T> {
  let lastError: AppError | null = null;

  for (const fn of fns) {
    try {
      return await fn();
    } catch (error) {
      lastError = toAppError(error);
      lastError.log();
    }
  }

  throw lastError || new Error('すべての試行が失敗しました');
}

/**
 * 指定時間待機する
 * 
 * @param ms - 待機時間（ミリ秒）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
