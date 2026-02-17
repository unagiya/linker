/**
 * 最適化されたニックネームサービス
 * キャッシュとレート制限を統合したパフォーマンス最適化版
 * 
 * パフォーマンス最適化:
 * - 要件10.1: ニックネーム利用可能性チェックを200ms以内に抑える（キャッシュ使用）
 * - 要件10.2: データベースインデックスを使用した高速検索
 * - 要件10.4: レート制限を適用してサーバー負荷を制御
 * - 要件10.5: ニックネーム変更時のキャッシュ無効化
 */

import { Cache, withCache } from '../utils/cache';
import { RateLimiter, withRateLimit } from '../utils/rateLimit';
import { 
  checkNicknameAvailability as baseCheckNicknameAvailability,
  findProfileByNickname as baseFindProfileByNickname,
  updateNickname as baseUpdateNickname,
  normalizeNickname
} from './nicknameService';
import type { NicknameAvailabilityResult } from '../types/nickname';
import type { Profile } from '../types/profile';

/**
 * ニックネーム利用可能性チェック結果のキャッシュ
 * TTL: 30秒（短めに設定して最新の状態を反映）
 */
const availabilityCache = new Cache<NicknameAvailabilityResult>({
  ttl: 30 * 1000, // 30秒
  maxSize: 200
});

/**
 * プロフィール検索結果のキャッシュ
 * TTL: 5分
 */
const profileCache = new Cache<Profile | null>({
  ttl: 5 * 60 * 1000, // 5分
  maxSize: 100
});

/**
 * ニックネーム利用可能性チェックのレート制限
 * 1秒あたり最大5リクエスト
 */
const availabilityRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 1000, // 1秒
  message: 'ニックネームチェックのリクエストが多すぎます。少し待ってから再試行してください'
});

/**
 * プロフィール検索のレート制限
 * 1秒あたり最大10リクエスト
 */
const profileSearchRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 1000, // 1秒
  message: 'プロフィール検索のリクエストが多すぎます。少し待ってから再試行してください'
});

/**
 * ニックネーム更新のレート制限
 * 1分あたり最大10リクエスト
 */
const updateRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1分
  message: 'ニックネーム更新のリクエストが多すぎます。少し待ってから再試行してください'
});

/**
 * 最適化されたニックネーム利用可能性チェック
 * キャッシュとレート制限を適用
 * 
 * @param nickname - チェックするニックネーム
 * @param currentNickname - 現在のニックネーム（編集時の除外用）
 * @returns 利用可能性チェック結果
 */
export const checkNicknameAvailability = withRateLimit(
  withCache(
    baseCheckNicknameAvailability,
    availabilityCache,
    (nickname: string, currentNickname?: string) => {
      const normalized = normalizeNickname(nickname);
      const current = currentNickname ? normalizeNickname(currentNickname) : '';
      return `availability:${normalized}:${current}`;
    }
  ),
  availabilityRateLimiter,
  (nickname: string) => `availability:${normalizeNickname(nickname)}`
);

/**
 * 最適化されたニックネームでプロフィール検索
 * キャッシュとレート制限を適用
 * 
 * @param nickname - 検索するニックネーム
 * @returns プロフィール（見つからない場合はnull）
 */
export const findProfileByNickname = withRateLimit(
  withCache(
    baseFindProfileByNickname,
    profileCache,
    (nickname: string) => `profile:${normalizeNickname(nickname)}`
  ),
  profileSearchRateLimiter,
  (nickname: string) => `profile:${normalizeNickname(nickname)}`
);

/**
 * 最適化されたニックネーム更新
 * レート制限を適用し、キャッシュを無効化
 * 
 * @param profileId - 更新するプロフィールのID
 * @param newNickname - 新しいニックネーム
 * @param oldNickname - 古いニックネーム（キャッシュ無効化用）
 */
export const updateNickname = withRateLimit(
  async (profileId: string, newNickname: string, oldNickname?: string): Promise<void> => {
    // ベースの更新関数を実行
    await baseUpdateNickname(profileId, newNickname);

    // キャッシュを無効化
    invalidateNicknameCache(newNickname);
    if (oldNickname) {
      invalidateNicknameCache(oldNickname);
    }
  },
  updateRateLimiter,
  (profileId: string) => `update:${profileId}`
);

/**
 * ニックネームに関連するキャッシュを無効化
 * 
 * @param nickname - 無効化するニックネーム
 */
export function invalidateNicknameCache(nickname: string): void {
  const normalized = normalizeNickname(nickname);
  
  // 利用可能性チェックのキャッシュを削除
  availabilityCache.deletePattern(new RegExp(`^availability:${normalized}`));
  
  // プロフィール検索のキャッシュを削除
  profileCache.delete(`profile:${normalized}`);
}

/**
 * すべてのキャッシュをクリア
 */
export function clearAllCaches(): void {
  availabilityCache.clear();
  profileCache.clear();
}

/**
 * 期限切れのキャッシュエントリをクリーンアップ
 */
export function cleanupCaches(): void {
  availabilityCache.cleanup();
  profileCache.cleanup();
}

/**
 * レート制限の記録をクリーンアップ
 */
export function cleanupRateLimiters(): void {
  availabilityRateLimiter.cleanup();
  profileSearchRateLimiter.cleanup();
  updateRateLimiter.cleanup();
}

/**
 * 定期的なクリーンアップを開始
 * 5分ごとにキャッシュとレート制限の記録をクリーンアップ
 * 
 * @returns クリーンアップを停止する関数
 */
export function startPeriodicCleanup(): () => void {
  const intervalId = setInterval(() => {
    cleanupCaches();
    cleanupRateLimiters();
  }, 5 * 60 * 1000); // 5分

  // クリーンアップを停止する関数を返す
  return () => clearInterval(intervalId);
}

// 再エクスポート（ユーティリティ関数）
export { normalizeNickname } from './nicknameService';
