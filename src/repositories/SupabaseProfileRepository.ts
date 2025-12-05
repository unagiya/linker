/**
 * SupabaseProfileRepository
 * Supabaseデータベースを使用したProfileRepositoryの実装
 */

import { supabase } from "../lib/supabase";
import { Profile } from "../types/profile";
import { ProfileRow, ProfileInsert, ProfileUpdate } from "../types/database";
import { ProfileRepository } from "./ProfileRepository";

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
        name: profile.name,
        job_title: profile.jobTitle,
        bio: profile.bio || null,
        skills: profile.skills,
        years_of_experience: profile.yearsOfExperience || null,
        social_links: profile.socialLinks,
        updated_at: profile.updatedAt,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id);

      if (error) {
        throw new Error(`プロフィールの更新に失敗しました: ${error.message}`);
      }
    } else {
      // 新規作成
      const insertData: ProfileInsert = {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        job_title: profile.jobTitle,
        bio: profile.bio || null,
        skills: profile.skills,
        years_of_experience: profile.yearsOfExperience || null,
        social_links: profile.socialLinks,
        created_at: profile.createdAt,
        updated_at: profile.updatedAt,
      };

      const { error } = await supabase.from("profiles").insert(insertData);

      if (error) {
        throw new Error(`プロフィールの作成に失敗しました: ${error.message}`);
      }
    }
  }

  /**
   * IDでプロフィールを検索する
   */
  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // PGRST116は「行が見つからない」エラー
      if (error.code === "PGRST116") {
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
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // PGRST116は「行が見つからない」エラー
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`プロフィールの取得に失敗しました: ${error.message}`);
    }

    return this.mapToProfile(data);
  }

  /**
   * すべてのプロフィールを取得する
   */
  async findAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`プロフィール一覧の取得に失敗しました: ${error.message}`);
    }

    return data.map((row) => this.mapToProfile(row));
  }

  /**
   * プロフィールを削除する
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("profiles").delete().eq("id", id);

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
      name: data.name,
      jobTitle: data.job_title,
      bio: data.bio || undefined,
      skills: data.skills || [],
      yearsOfExperience:
        data.years_of_experience !== null
          ? data.years_of_experience
          : undefined,
      socialLinks: data.social_links || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
