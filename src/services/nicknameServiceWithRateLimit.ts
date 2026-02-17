/**
 * レート制限付きニックネームサービス
 * DDoS攻撃を防ぐためのレート制限機能を提供
 */

import { RateLimiter, withRateLimit } from '../utils/rateLimit';
import { checkNicknameAvailability as baseCheckNicknameAvailability } from './nicknameService';
import type { NicknameAvailabilityResult } from '../types/nickname';

/**
 * ニックネーム利用可能性チェック用のレート制限
 * 1分間に最大20リクエストまで許可
 */
const nicknameCheckRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000, // 1分
  message: 'リクエストが多すぎます。しばらく待ってから再試行してください',
});

/**
 * レート制限付きニックネーム利用可能性チェック
 * 
 * セキュリティ対策:
 * - レート制限: 1分間に最大20リクエスト
 * - DDoS攻撃対策
 * 
 * @param nickname - チェックするニックネーム
 * @param currentNickname - 現在のニックネーム（編集時の除外用）
 * @param userId - ユーザーID（レート制限のキーとして使用）
 * @returns 利用可能性チェック結果
 */
export async function checkNicknameAvailabilityWithRateLimit(
  nickname: string,
  currentNickname: string | undefined,
  userId: string
): Promise<NicknameAvailabilityResult> {
  try {
    // レート制限チェック
    await nicknameCheckRateLimiter.tryRequest(userId);

    // 通常のチェック処理を実行
    return await baseCheckNicknameAvailability(nickname, currentNickname);
  } catch (error) {
    // レート制限エラーの場合
    if (error instanceof Error && error.name === 'RateLimitError') {
      return {
        isAvailable: false,
        isChecking: false,
        error: error.message,
      };
    }

    // その他のエラーは再スロー
    throw error;
  }
}

/**
 * レート制限の残りリクエスト数を取得
 * 
 * @param userId - ユーザーID
 * @returns 残りのリクエスト数
 */
export function getRemainingNicknameChecks(userId: string): number {
  return nicknameCheckRateLimiter.getRemainingRequests(userId);
}

/**
 * レート制限のリセット時間を取得
 * 
 * @param userId - ユーザーID
 * @returns リセットまでの時間（ミリ秒）
 */
export function getNicknameCheckRetryAfter(userId: string): number {
  return nicknameCheckRateLimiter.getRetryAfter(userId);
}

/**
 * 特定ユーザーのレート制限をリセット
 * 管理者機能として使用
 * 
 * @param userId - ユーザーID
 */
export function resetNicknameCheckRateLimit(userId: string): void {
  nicknameCheckRateLimiter.reset(userId);
}

/**
 * レート制限のクリーンアップ
 * 定期的に実行して古い記録を削除
 */
export function cleanupNicknameCheckRateLimit(): void {
  nicknameCheckRateLimiter.cleanup();
}

// 定期的なクリーンアップ（5分ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    cleanupNicknameCheckRateLimit();
  }, 5 * 60 * 1000);
}
