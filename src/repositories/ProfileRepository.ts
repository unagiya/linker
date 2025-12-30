/**
 * ProfileRepository インターフェース
 * プロフィールデータの永続化を抽象化するRepository
 */

import type { Profile } from '../types/profile';

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
   * ニックネームでプロフィールを検索する
   *
   * @param nickname - ニックネーム
   * @returns プロフィール、見つからない場合はnull
   * @throws エラーが発生した場合
   */
  findByNickname(nickname: string): Promise<Profile | null>;

  /**
   * ニックネームが利用可能かチェックする
   * 大文字小文字を区別しない重複チェックを行う
   * 
   * @param nickname - チェックするニックネーム
   * @param excludeUserId - 除外するユーザーID（編集時に現在のユーザーを除外）
   * @returns 利用可能な場合はtrue、既に使用されている場合はfalse
   * @throws エラーが発生した場合
   */
  isNicknameAvailable(nickname: string, excludeUserId?: string): Promise<boolean>;

  /**
   * ニックネームの重複をチェックする
   * 大文字小文字を区別しない重複チェックを行う
   * 
   * @param nickname - チェックするニックネーム
   * @param excludeProfileId - 除外するプロフィールID（編集時に現在のプロフィールを除外）
   * @returns 重複している場合はtrue、していない場合はfalse
   * @throws エラーが発生した場合
   */
  checkNicknameDuplicate(nickname: string, excludeProfileId?: string): Promise<boolean>;

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
