/**
 * ProfileContext関連の型定義
 */

import type { Profile, ProfileFormData } from "../../types";

/**
 * プロフィール状態の型
 */
export interface ProfileState {
  /** 現在のプロフィール */
  profile: Profile | null;
  /** ローディング状態 */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * プロフィールアクションの型
 */
export type ProfileAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PROFILE"; payload: Profile | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" };

/**
 * ProfileContextの値の型
 */
export interface ProfileContextValue extends ProfileState {
  /** プロフィールを作成する */
  createProfile: (data: ProfileFormData) => Promise<Profile>;
  /** プロフィールを更新する */
  updateProfile: (id: string, data: ProfileFormData) => Promise<Profile>;
  /** プロフィールを削除する */
  deleteProfile: (id: string) => Promise<void>;
  /** プロフィールを読み込む */
  loadProfile: (id: string) => Promise<Profile | null>;
  /** エラーをクリアする */
  clearError: () => void;
}
