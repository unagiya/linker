/**
 * SupabaseProfileRepository
 * Supabaseデータベースを使用したProfileRepositoryの実装
 */

import { supabase } from '../lib/supabase';
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
   */
  async save(profile: Profile): Promise<void> {
    // 既存のプロフィールがあるか確認
    const existing = await this.findById(profile.id);

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
        throw new Error(`プロフィールの更新に失敗しました: ${error.message}`);
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
        throw new Error(`プロフィールの作成に失敗しました: ${error.message}`);
      }
    }
  }

  /**
   * IDでプロフィールを検索する
   */
  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();

    if (error) {
      // PGRST116は「行が見つからない」エラー
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`プロフィールの取得に失敗しました: ${error.message}`);
    }

    return this.mapToProfile(data);
  }

  /**
   * ユーザーIDでプロフィールを検索する
   */
  async findByUserId(userId: string): Promise<Profile | null> {
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
      throw new Error(`プロフィールの取得に失敗しました: ${error.message}`);
    }

    return this.mapToProfile(data);
  }

  /**
   * ニックネームでプロフィールを検索する
   * 大文字小文字を区別しない検索を行う
   */
  async findByNickname(nickname: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('nickname', nickname)
      .single();

    if (error) {
      // PGRST116は「行が見つからない」エラー
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`プロフィールの取得に失敗しました: ${error.message}`);
    }

    return this.mapToProfile(data);
  }

  /**
   * ニックネームが利用可能かチェックする
   * 大文字小文字を区別しない重複チェックを行う
   * 
   * @param nickname - チェックするニックネーム
   * @param excludeUserId - 除外するユーザーID（編集時に現在のユーザーを除外）
   * @returns 利用可能な場合はtrue、既に使用されている場合はfalse
   */
  async isNicknameAvailable(nickname: string, excludeUserId?: string): Promise<boolean> {
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
      throw new Error(`ニックネームの利用可能性チェックに失敗しました: ${error.message}`);
    }

    // データが存在しない場合は利用可能
    return data.length === 0;
  }

  /**
   * ニックネームの重複をチェックする
   * 大文字小文字を区別しない重複チェックを行う
   * 
   * @param nickname - チェックするニックネーム
   * @param excludeProfileId - 除外するプロフィールID（編集時に現在のプロフィールを除外）
   * @returns 重複している場合はtrue、していない場合はfalse
   */
  async checkNicknameDuplicate(nickname: string, excludeProfileId?: string): Promise<boolean> {
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
      throw new Error(`ニックネームの重複チェックに失敗しました: ${error.message}`);
    }

    // データが存在する場合は重複している
    return data.length > 0;
  }

  /**
   * すべてのプロフィールを取得する
   */
  async findAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`プロフィール一覧の取得に失敗しました: ${error.message}`);
    }

    return data.map((row) => this.mapToProfile(row));
  }

  /**
   * プロフィールを削除する
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) {
      throw new Error(`プロフィールの削除に失敗しました: ${error.message}`);
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
