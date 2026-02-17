/**
 * エラーユーティリティ関数
 * エラーの判定やメッセージ取得などの補助関数
 */

import { toAppError, NetworkError, DatabaseError } from '../types/errors';

/**
 * エラーメッセージを取得
 * AppErrorの場合はユーザーフレンドリーなメッセージを返す
 * 
 * @param error - エラーオブジェクト
 * @returns エラーメッセージ
 */
export function getErrorMessage(error: unknown): string {
  const appError = toAppError(error);
  return appError.getUserMessage();
}

/**
 * エラーがリトライ可能かどうかを判定
 * 
 * @param error - エラーオブジェクト
 * @returns リトライ可能な場合はtrue
 */
export function isRetryable(error: unknown): boolean {
  const appError = toAppError(error);
  return appError.retryable;
}

/**
 * ネットワークエラーかどうかを判定
 * 
 * @param error - エラーオブジェクト
 * @returns ネットワークエラーの場合はtrue
 */
export function isNetworkError(error: unknown): boolean {
  const appError = toAppError(error);
  return appError instanceof NetworkError;
}

/**
 * データベースエラーかどうかを判定
 * 
 * @param error - エラーオブジェクト
 * @returns データベースエラーの場合はtrue
 */
export function isDatabaseError(error: unknown): boolean {
  const appError = toAppError(error);
  return appError instanceof DatabaseError;
}
