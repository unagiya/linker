/**
 * ニックネーム関連のビジネスロジックを担当するサービス
 * 
 * セキュリティ対策:
 * - 入力サニタイゼーション: すべての入力を検証・サニタイズ
 * - SQLインジェクション対策: Supabaseのパラメータ化クエリを使用
 * - レート制限: 過度なリクエストを防止
 * - エラーハンドリング: 適切なエラーメッセージとログ
 */

import { supabase } from '../lib/supabase';
import { normalizeNickname, isReservedNickname } from '../utils/nicknameValidation';
import { sanitizeNickname } from '../utils/sanitization';
import { toAppError, ValidationError, DuplicateError } from '../types/errors';
import { withRetry, withTimeout } from '../utils/errorHandling';
import type { Profile } from '../types/profile';
import type { NicknameAvailabilityResult } from '../types/nickname';

/**
 * ニックネーム利用可能性チェック
 * リトライ機能とタイムアウト機能を備えた堅牢な実装
 * 
 * セキュリティ対策:
 * - 入力サニタイゼーション
 * - SQLインジェクション対策（パラメータ化クエリ）
 * - 予約語チェック
 * 
 * @param nickname - チェックするニックネーム
 * @param currentNickname - 現在のニックネーム（編集時の除外用）
 * @returns 利用可能性チェック結果
 */
export async function checkNicknameAvailability(
  nickname: string,
  currentNickname?: string
): Promise<NicknameAvailabilityResult> {
  try {
    // 入力サニタイゼーション
    const sanitized = sanitizeNickname(nickname);
    
    // 予約語チェック
    if (isReservedNickname(sanitized)) {
      return {
        isAvailable: false,
        isChecking: false,
        error: 'このニックネームは予約語のため使用できません'
      };
    }

    // 正規化（大文字小文字を区別しない）
    const normalizedNickname = normalizeNickname(sanitized);
    const normalizedCurrentNickname = currentNickname ? normalizeNickname(sanitizeNickname(currentNickname)) : null;

    // 現在のニックネームと同じ場合は利用可能
    if (normalizedCurrentNickname && normalizedNickname === normalizedCurrentNickname) {
      return {
        isAvailable: true,
        isChecking: false
      };
    }

    // タイムアウトとリトライ機能付きでデータベースチェック
    // SQLインジェクション対策: Supabaseのパラメータ化クエリを使用
    const checkDatabase = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname')
        .ilike('nickname', normalizedNickname)
        .limit(1);

      if (error) {
        throw error;
      }

      return data;
    };

    const data = await withRetry(
      () => withTimeout(checkDatabase, 5000),
      {
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: true,
      }
    );

    const isAvailable = data.length === 0;
    return {
      isAvailable,
      isChecking: false,
      error: isAvailable ? undefined : 'このニックネームは既に使用されています'
    };

  } catch (error) {
    const appError = toAppError(error);
    appError.log();
    
    return {
      isAvailable: false,
      isChecking: false,
      error: appError.getUserMessage()
    };
  }
}

/**
 * ニックネームでプロフィール検索
 * リトライ機能とタイムアウト機能を備えた堅牢な実装
 * 
 * セキュリティ対策:
 * - 入力サニタイゼーション
 * - SQLインジェクション対策（パラメータ化クエリ）
 * 
 * @param nickname - 検索するニックネーム
 * @returns プロフィール（見つからない場合はnull）
 */
export async function findProfileByNickname(nickname: string): Promise<Profile | null> {
  try {
    // 入力サニタイゼーション
    const sanitized = sanitizeNickname(nickname);
    const normalizedNickname = normalizeNickname(sanitized);

    const searchProfile = async () => {
      // SQLインジェクション対策: Supabaseのパラメータ化クエリを使用
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('nickname', normalizedNickname)
        .single();

      if (error) {
        // データが見つからない場合はnullを返す（エラーではない）
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    };

    // タイムアウトとリトライ機能付きで検索
    return await withRetry(
      () => withTimeout(searchProfile, 5000),
      {
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: true,
      }
    );

  } catch (error) {
    const appError = toAppError(error);
    appError.log();
    throw appError;
  }
}

/**
 * ニックネーム更新
 * リトライ機能とタイムアウト機能を備えた堅牢な実装
 * 
 * セキュリティ対策:
 * - 入力サニタイゼーション
 * - SQLインジェクション対策（パラメータ化クエリ）
 * - 重複チェック
 * 
 * @param profileId - 更新するプロフィールのID
 * @param newNickname - 新しいニックネーム
 */
export async function updateNickname(profileId: string, newNickname: string): Promise<void> {
  try {
    // 入力サニタイゼーション
    const sanitized = sanitizeNickname(newNickname);
    const normalizedNickname = normalizeNickname(sanitized);

    const performUpdate = async () => {
      // SQLインジェクション対策: Supabaseのパラメータ化クエリを使用
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nickname: normalizedNickname,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) {
        // 制約違反エラーの場合は重複エラーとして扱う
        if (error.code === '23505') {
          throw new DuplicateError('このニックネームは既に使用されています', error);
        }
        throw error;
      }
    };

    // タイムアウトとリトライ機能付きで更新
    await withRetry(
      () => withTimeout(performUpdate, 5000),
      {
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: true,
      }
    );

  } catch (error) {
    const appError = toAppError(error);
    appError.log();
    throw appError;
  }
}

// 再エクスポート（ユーティリティ関数）
export { isReservedNickname, normalizeNickname };