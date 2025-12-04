/**
 * ProfileRepositoryインターフェース
 * プロフィールデータの永続化を抽象化
 */

import type { Profile } from "../types";

/**
 * プロフィールデータの永続化インターフェース
 */
export interface ProfileRepository {
  /**
   * プロフィールを保存する
   * @param profile 保存するプロフィール
   */
  save(profile: Profile): Promise<void>;

  /**
   * IDでプロフィールを検索する
   * @param id プロフィールID
   * @returns プロフィール、または存在しない場合はnull
   */
  findById(id: string): Promise<Profile | null>;

  /**
   * すべてのプロフィールを取得する
   * @returns プロフィールの配列
   */
  findAll(): Promise<Profile[]>;

  /**
   * プロフィールを削除する
   * @param id 削除するプロフィールのID
   */
  delete(id: string): Promise<void>;

  /**
   * プロフィールが存在するかチェックする
   * @param id プロフィールID
   * @returns 存在する場合true
   */
  exists(id: string): Promise<boolean>;
}
