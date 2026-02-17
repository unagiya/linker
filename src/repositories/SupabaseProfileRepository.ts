/**
 * SupabaseProfileRepository
 * Supabaseデータベースを使用したProfileRepositoryの実装
 */

import { supabase } from '../lib/supabase';
import { toAppError, NotFoundError, DuplicateError } from '../types/errors';
import { withRetry, withTimeout } from '../utils/errorHandling';
import type { Profile } from '../types/profile';
import type { ProfileRow, ProfileInsert, ProfileUpdate } from '../types/database';
import type { ProfileRepository } from './ProfileRepository';

/**
 * Supabaseデータベースを使用したProfileRepositoryの実装
 */
export class SupabaseProfileRepository implements ProfileRepository {
  /**
   * プロフィールを保存する
   * 既存のプロフィールがある場合は更新、ない場合は新規作成
   * リトライ機能とタイムアウト機能を備えた堅牢な実装
   */
  async save(profile: Profile): Promise<void> {
    try {
      // 既存のプロフィールがあるか確認
      const existing = await this.findById(profile.id);

      const performSave = async () => {
        if (existing) {
          // 更新
          const updateData: ProfileUpdate = {
            nickname: profile.nickname,
            name: profile.name,
            job_title: profile.jobTitle,
            bio: profile.bio || null,
            image_url: profile.imageUrl || null,
            skills: profile.skills,
            years_of_experience: profile.yearsOfExperience || null,
            social_links: profile.socialLinks,
            updated_at: profile.updatedAt,
          };

          const { error } = await supabase.from('profiles').update(updateData).eq('id', profile.id);

          if (error) {
            // ニックネーム重複エラー
            if (error.code === '23505') {
              throw new DuplicateError('このニックネームは既に使用されています', error);
            }
            throw error;
          }
        } else {
          // 新規作成
          const insertData: ProfileInsert = {
            id: profile.id,
            user_id: profile.user_id,
            nickname: profile.nickname,
            name: profile.name,
            job_title: profile.jobTitle,
            bio: profile.bio || null,
            image_url: profile.imageUrl || null,
            skills: profile.skills,
            years_of_experience: profile.yearsOfExperience || null,
            social_links: profile.socialLinks,
            created_at: profile.createdAt,
            updated_at: profile.updatedAt,
          };

          const { error } = await supabase.from('profiles').insert(insertData);

          if (error) {
            // ニックネーム重複エラー
            if (error.code === '23505') {
              throw new DuplicateError('このニックネームは既に使用されています', error);
            }
            throw error;
          }
        }
      };

      // タイムアウトとリトライ機能付きで保存
      await withRetry(
        () => withTimeout(performSave, 10000),
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
   * IDでプロフィールを検索する
   * リトライ機能とタイムアウト機能を備えた堅牢な実装
   */
  async findById(id: string): Promise<Profile | null> {
    try {
      const searchById = async () => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();

        if (error) {
          // PGRST116は「行が見つからない」エラー
          if (error.code === 'PGRST116') {
            return null;
          }
          throw error;
        }

        return data;
      };

      const data = await withRetry(
        () => withTimeout(searchById, 5000),
        {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
        }
      );

      return data ? this.mapToProfile(data) : null;

    } catch (error) {
      const appError = toAppError(error);
      appError.log();
      throw appError;
    }
  }

  /**
   * ユーザーIDでプロフィールを検索する
   * リトライ機能とタイムアウト機能を備えた堅牢な実装
   */
  async findByUserId(userId: string): Promise<Profile | null> {
    try {
      const searchByUserId = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          // PGRST116は「行が見つからない」エラー
          if (error.code === 'PGRST116') {
            return null;
          }
          throw error;
        }

        return data;
      };

      const data = await withRetry(
        () => withTimeout(searchByUserId, 5000),
        {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
        }
      );

      return data ? this.mapToProfile(data) : null;

    } catch (error) {
      const appError = toAppError(error);
      appError.log();
      throw appError;
    }
  }

  /**
   * ニックネームでプロフィールを検索する
   * 大文字小文字を区別しない検索を行う
   * リトライ機能とタイムアウト機能を備えた堅牢な実装
   * 
   * パフォーマンス最適化:
   * - データベース関数を使用して検索を最適化
   * - インデックスを活用した高速検索
   */
  async findByNickname(nickname: string): Promise<Profile | null> {
    try {
      const searchByNickname = async () => {
        // データベース関数を使用して最適化された検索を実行
        const { data, error } = await supabase
          .rpc('find_profile_by_nickname', { nickname_param: nickname });

        if (error) {
          throw error;
        }

        // データベース関数は配列を返すので、最初の要素を取得
        return data && data.length > 0 ? data[0] : null;
      };

      const data = await withRetry(
        () => withTimeout(searchByNickname, 5000),
        {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
        }
      );

      return data ? this.mapToProfile(data) : null;

    } catch (error) {
      const appError = toAppError(error);
      appError.log();
      throw appError;
    }
  }

  /**
   * ニックネームが利用可能かチェックする
   * 大文字小文字を区別しない重複チェックを行う
   * リトライ機能とタイムアウト機能を備えた堅牢な実装
   * 
   * @param nickname - チェックするニックネーム
   * @param excludeUserId - 除外するユーザーID（編集時に現在のユーザーを除外）
   * @returns 利用可能な場合はtrue、既に使用されている場合はfalse
   */
  async isNicknameAvailable(nickname: string, excludeUserId?: string): Promise<boolean> {
    try {
      const checkAvailability = async () => {
        let query = supabase
          .from('profiles')
          .select('id')
          .ilike('nickname', nickname);

        // 編集時は現在のユーザーを除外
        if (excludeUserId) {
          query = query.neq('user_id', excludeUserId);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        // データが存在しない場合は利用可能
        return data.length === 0;
      };

      return await withRetry(
        () => withTimeout(checkAvailability, 5000),
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
   * ニックネームの重複をチェックする
   * 大文字小文字を区別しない重複チェックを行う
   * リトライ機能とタイムアウト機能を備えた堅牢な実装
   * 
   * @param nickname - チェックするニックネーム
   * @param excludeProfileId - 除外するプロフィールID（編集時に現在のプロフィールを除外）
   * @returns 重複している場合はtrue、していない場合はfalse
   */
  async checkNicknameDuplicate(nickname: string, excludeProfileId?: string): Promise<boolean> {
    try {
      const checkDuplicate = async () => {
        let query = supabase
          .from('profiles')
          .select('id')
          .ilike('nickname', nickname);

        // 編集時は現在のプロフィールを除外
        if (excludeProfileId) {
          query = query.neq('id', excludeProfileId);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        // データが存在する場合は重複している
        return data.length > 0;
      };

      return await withRetry(
        () => withTimeout(checkDuplicate, 5000),
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
   * すべてのプロフィールを取得する
   * リトライ機能とタイムアウト機能を備えた堅牢な実装
   */
  async findAll(): Promise<Profile[]> {
    try {
      const fetchAll = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        return data;
      };

      const data = await withRetry(
        () => withTimeout(fetchAll, 10000),
        {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
        }
      );

      return data.map((row) => this.mapToProfile(row));

    } catch (error) {
      const appError = toAppError(error);
      appError.log();
      throw appError;
    }
  }

  /**
   * プロフィールを削除する
   * リトライ機能とタイムアウト機能を備えた堅牢な実装
   */
  async delete(id: string): Promise<void> {
    try {
      const performDelete = async () => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);

        if (error) {
          throw error;
        }
      };

      await withRetry(
        () => withTimeout(performDelete, 5000),
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
   * プロフィールが存在するか確認する
   */
  async exists(id: string): Promise<boolean> {
    const profile = await this.findById(id);
    return profile !== null;
  }

  /**
   * データベースの行データをProfileオブジェクトにマッピングする
   *
   * @param data - データベースの行データ
   * @returns Profileオブジェクト
   */
  private mapToProfile(data: ProfileRow): Profile {
    return {
      id: data.id,
      user_id: data.user_id,
      nickname: data.nickname,
      name: data.name,
      jobTitle: data.job_title,
      bio: data.bio || undefined,
      imageUrl: data.image_url || undefined,
      skills: data.skills || [],
      yearsOfExperience: data.years_of_experience !== null ? data.years_of_experience : undefined,
      socialLinks: data.social_links || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
