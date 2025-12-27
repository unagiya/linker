/**
 * ニックネーム関連のビジネスロジックを担当するサービス
 */

import { supabase } from '../lib/supabase';
import { normalizeNickname, isReservedNickname } from '../utils/nicknameValidation';
import type { Profile } from '../types/profile';
import type { NicknameAvailabilityResult } from '../types/nickname';

/**
 * ニックネーム利用可能性チェック
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
    // 予約語チェック
    if (isReservedNickname(nickname)) {
      return {
        isAvailable: false,
        isChecking: false,
        error: 'このニックネームは予約語のため使用できません'
      };
    }

    // 正規化（大文字小文字を区別しない）
    const normalizedNickname = normalizeNickname(nickname);
    const normalizedCurrentNickname = currentNickname ? normalizeNickname(currentNickname) : null;

    // 現在のニックネームと同じ場合は利用可能
    if (normalizedCurrentNickname && normalizedNickname === normalizedCurrentNickname) {
      return {
        isAvailable: true,
        isChecking: false
      };
    }

    // データベースで重複チェック（大文字小文字を区別しない）
    const { data, error } = await supabase
      .from('profiles')
      .select('nickname')
      .ilike('nickname', normalizedNickname)
      .limit(1);

    if (error) {
      console.error('ニックネーム利用可能性チェックエラー:', error);
      return {
        isAvailable: false,
        isChecking: false,
        error: 'サーバーエラーが発生しました。しばらく待ってから再試行してください'
      };
    }

    const isAvailable = data.length === 0;
    return {
      isAvailable,
      isChecking: false,
      error: isAvailable ? undefined : 'このニックネームは既に使用されています'
    };

  } catch (error) {
    console.error('ニックネーム利用可能性チェック例外:', error);
    return {
      isAvailable: false,
      isChecking: false,
      error: '接続エラーが発生しました。再試行してください'
    };
  }
}

/**
 * ニックネームでプロフィール検索
 * 
 * @param nickname - 検索するニックネーム
 * @returns プロフィール（見つからない場合はnull）
 */
export async function findProfileByNickname(nickname: string): Promise<Profile | null> {
  try {
    const normalizedNickname = normalizeNickname(nickname);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('nickname', normalizedNickname)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // データが見つからない場合
        return null;
      }
      console.error('プロフィール検索エラー:', error);
      throw new Error('プロフィールの検索に失敗しました');
    }

    return data;

  } catch (error) {
    console.error('プロフィール検索例外:', error);
    throw error;
  }
}

/**
 * ニックネーム更新
 * 
 * @param profileId - 更新するプロフィールのID
 * @param newNickname - 新しいニックネーム
 */
export async function updateNickname(profileId: string, newNickname: string): Promise<void> {
  try {
    const normalizedNickname = normalizeNickname(newNickname);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        nickname: normalizedNickname,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (error) {
      console.error('ニックネーム更新エラー:', error);
      
      // 制約違反エラーの場合
      if (error.code === '23505') {
        throw new Error('このニックネームは既に使用されています');
      }
      
      throw new Error('ニックネームの更新に失敗しました');
    }

  } catch (error) {
    console.error('ニックネーム更新例外:', error);
    throw error;
  }
}

// 再エクスポート（ユーティリティ関数）
export { isReservedNickname, normalizeNickname };