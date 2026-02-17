/**
 * マイグレーションサービス
 * 既存ユーザーのニックネームマイグレーション処理を担当
 */

import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

/**
 * マイグレーション状態の型
 */
export interface MigrationStatus {
  /** マイグレーションが必要なプロフィールの数 */
  needsMigration: number;
  /** 総プロフィール数 */
  total: number;
  /** マイグレーション完了済みかどうか */
  isComplete: boolean;
}

/**
 * マイグレーション結果の型
 */
export interface MigrationResult {
  /** 成功したプロフィール数 */
  success: number;
  /** 失敗したプロフィール数 */
  failed: number;
  /** エラーメッセージの配列 */
  errors: string[];
}

/**
 * UUIDの形式かどうかをチェックする
 * @param value - チェックする文字列
 * @returns UUID形式の場合はtrue
 */
function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * マイグレーション状態をチェックする
 * UUID形式のニックネームを持つプロフィールの数を確認
 * 
 * @returns マイグレーション状態
 */
export async function checkMigrationStatus(): Promise<MigrationStatus> {
  try {
    // すべてのプロフィールを取得
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nickname');

    if (error) {
      throw new Error(`マイグレーション状態の確認に失敗しました: ${error.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return {
        needsMigration: 0,
        total: 0,
        isComplete: true,
      };
    }

    // UUID形式のニックネームを持つプロフィールをカウント
    const needsMigration = profiles.filter((profile) => 
      isUUID(profile.nickname)
    ).length;

    return {
      needsMigration,
      total: profiles.length,
      isComplete: needsMigration === 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('マイグレーション状態の確認中に不明なエラーが発生しました');
  }
}

/**
 * 単一プロフィールのマイグレーション
 * UUID形式のニックネームをUUIDベースのニックネームに更新
 * 
 * @param profileId - マイグレーションするプロフィールのID
 */
export async function migrateProfile(profileId: string): Promise<void> {
  try {
    // プロフィールを取得
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, nickname')
      .eq('id', profileId)
      .single();

    if (fetchError) {
      throw new Error(`プロフィールの取得に失敗しました: ${fetchError.message}`);
    }

    if (!profile) {
      throw new Error(`プロフィールが見つかりません: ${profileId}`);
    }

    // 既にUUID形式でない場合はスキップ
    if (!isUUID(profile.nickname)) {
      return;
    }

    // UUIDベースのニックネームに更新（idをそのまま使用）
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        nickname: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (updateError) {
      throw new Error(`ニックネームの更新に失敗しました: ${updateError.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('プロフィールのマイグレーション中に不明なエラーが発生しました');
  }
}

/**
 * すべてのプロフィールのマイグレーション
 * UUID形式のニックネームを持つすべてのプロフィールを更新
 * 
 * @returns マイグレーション結果
 */
export async function migrateAllProfiles(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    // UUID形式のニックネームを持つプロフィールを取得
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nickname');

    if (error) {
      throw new Error(`プロフィール一覧の取得に失敗しました: ${error.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return result;
    }

    // UUID形式のニックネームを持つプロフィールをフィルタリング
    const profilesToMigrate = profiles.filter((profile) => 
      isUUID(profile.nickname)
    );

    // 各プロフィールをマイグレーション
    for (const profile of profilesToMigrate) {
      try {
        await migrateProfile(profile.id);
        result.success++;
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error 
          ? error.message 
          : '不明なエラー';
        result.errors.push(`プロフィール ${profile.id}: ${errorMessage}`);
      }
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('マイグレーション処理中に不明なエラーが発生しました');
  }
}

/**
 * プロフィールがマイグレーション済みかチェックする
 * @param profile - チェックするプロフィール
 * @returns マイグレーション済みの場合はtrue
 */
export function isProfileMigrated(profile: Profile): boolean {
  return !isUUID(profile.nickname);
}

/**
 * ニックネームがUUID形式かチェックする（エクスポート用）
 * @param nickname - チェックするニックネーム
 * @returns UUID形式の場合はtrue
 */
export function isNicknameUUID(nickname: string): boolean {
  return isUUID(nickname);
}
