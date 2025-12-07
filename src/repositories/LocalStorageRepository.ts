/**
 * LocalStorageRepository
 * ブラウザのローカルストレージを使用したRepository実装
 */

import type { Profile } from "../types";
import type { ProfileRepository } from "./ProfileRepository";

/**
 * ローカルストレージに保存されるプロフィールマップの型
 */
type ProfileMap = Record<string, Profile>;

/**
 * ローカルストレージを使用したProfileRepositoryの実装
 */
export class LocalStorageRepository implements ProfileRepository {
  private readonly STORAGE_KEY = "linker_profiles";

  /**
   * プロフィールを保存する
   * @param profile 保存するプロフィール
   */
  async save(profile: Profile): Promise<void> {
    try {
      const profiles = await this.loadProfileMap();
      profiles[profile.id] = profile;
      this.saveProfileMap(profiles);
    } catch (error) {
      throw new Error(
        `プロフィールの保存に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`
      );
    }
  }

  /**
   * IDでプロフィールを検索する
   * @param id プロフィールID
   * @returns プロフィール、または存在しない場合はnull
   */
  async findById(id: string): Promise<Profile | null> {
    try {
      const profiles = await this.loadProfileMap();
      return profiles[id] || null;
    } catch (error) {
      console.error("プロフィールの読み込みに失敗しました:", error);
      return null;
    }
  }

  /**
   * ユーザーIDでプロフィールを検索する
   * @param userId ユーザーID
   * @returns プロフィール、または存在しない場合はnull
   */
  async findByUserId(userId: string): Promise<Profile | null> {
    try {
      const profiles = await this.loadProfileMap();
      const profile = Object.values(profiles).find((p) => p.user_id === userId);
      return profile || null;
    } catch (error) {
      console.error("プロフィールの読み込みに失敗しました:", error);
      return null;
    }
  }

  /**
   * すべてのプロフィールを取得する
   * @returns プロフィールの配列
   */
  async findAll(): Promise<Profile[]> {
    try {
      const profiles = await this.loadProfileMap();
      return Object.values(profiles);
    } catch (error) {
      console.error("プロフィール一覧の読み込みに失敗しました:", error);
      return [];
    }
  }

  /**
   * プロフィールを削除する
   * @param id 削除するプロフィールのID
   */
  async delete(id: string): Promise<void> {
    try {
      const profiles = await this.loadProfileMap();
      delete profiles[id];
      this.saveProfileMap(profiles);
    } catch (error) {
      throw new Error(
        `プロフィールの削除に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`
      );
    }
  }

  /**
   * プロフィールが存在するかチェックする
   * @param id プロフィールID
   * @returns 存在する場合true
   */
  async exists(id: string): Promise<boolean> {
    const profile = await this.findById(id);
    return profile !== null;
  }

  /**
   * ローカルストレージからプロフィールマップを読み込む
   * @returns プロフィールマップ
   * @private
   */
  private async loadProfileMap(): Promise<ProfileMap> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return {};
      }

      const parsed = JSON.parse(data);

      // データの形式を検証
      if (typeof parsed !== "object" || parsed === null) {
        console.warn("不正なデータ形式です。空の状態で初期化します。");
        return {};
      }

      return parsed as ProfileMap;
    } catch (error) {
      console.error("データの読み込みに失敗しました:", error);
      // データが破損している場合は空の状態を返す
      return {};
    }
  }

  /**
   * プロフィールマップをローカルストレージに保存する
   * @param profiles プロフィールマップ
   * @private
   */
  private saveProfileMap(profiles: ProfileMap): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      if (error instanceof Error && error.name === "QuotaExceededError") {
        throw new Error(
          "ストレージの容量が不足しています。不要なデータを削除してください。"
        );
      }
      throw error;
    }
  }

  /**
   * ローカルストレージをクリアする（テスト用）
   */
  async clear(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
