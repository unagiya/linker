/**
 * ProfileRepository インターフェース
 * プロフィールデータの永続化を抽象化するRepository
 */

import { Profile } from '../types/profile';

/**
 * プロフィールデータの永続化を抽象化するインターフェース
 *
 * このインターフェースを実装することで、異なるストレージ実装を
 * 簡単に切り替えることができます。
 *
 * 実装例:
 * - SupabaseProfileRepository: Supabaseデータベースを使用
 * - LocalStorageRepository: ブラウザのLocalStorageを使用
 * - MockProfileRepository: テスト用のモック実装
 */
export interface ProfileRepository {
  /**
   * プロフィールを保存する
   * 既存のプロフィールがある場合は更新、ない場合は新規作成
   *
   * @param profile - 保存するプロフィール
   * @throws エラーが発生した場合
   */
  save(profile: Profile): Promise<void>;

  /**
   * IDでプロフィールを検索する
   *
   * @param id - プロフィールID
   * @returns プロフィール、見つからない場合はnull
   * @throws エラーが発生した場合
   */
  findById(id: string): Promise<Profile | null>;

  /**
   * ユーザーIDでプロフィールを検索する
   *
   * @param userId - ユーザーID
   * @returns プロフィール、見つからない場合はnull
   * @throws エラーが発生した場合
   */
  findByUserId(userId: string): Promise<Profile | null>;

  /**
   * すべてのプロフィールを取得する
   *
   * @returns プロフィールの配列
   * @throws エラーが発生した場合
   */
  findAll(): Promise<Profile[]>;

  /**
   * プロフィールを削除する
   *
   * @param id - 削除するプロフィールのID
   * @throws エラーが発生した場合
   */
  delete(id: string): Promise<void>;

  /**
   * プロフィールが存在するか確認する
   *
   * @param id - プロフィールID
   * @returns 存在する場合はtrue、しない場合はfalse
   * @throws エラーが発生した場合
   */
  exists(id: string): Promise<boolean>;
}
