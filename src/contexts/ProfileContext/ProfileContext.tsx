/**
 * ProfileContext
 * プロフィールの状態管理を提供
 */

import { createContext, useContext, useReducer, useCallback } from "react";
import type { ReactNode } from "react";
import type { Profile, ProfileFormData } from "../../types";
import type { ProfileRepository } from "../../repositories";
import type { ProfileContextValue } from "./types";
import { profileReducer, initialState } from "./reducer";

/**
 * ProfileContext
 */
const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

/**
 * ProfileProviderのProps
 */
interface ProfileProviderProps {
  /** 子要素 */
  children: ReactNode;
  /** Repository実装 */
  repository: ProfileRepository;
}

/**
 * ProfileProvider
 * プロフィールの状態管理を提供するProvider
 */
export function ProfileProvider({
  children,
  repository,
}: ProfileProviderProps) {
  const [state, dispatch] = useReducer(profileReducer, initialState);

  /**
   * プロフィールを作成する
   */
  const createProfile = useCallback(
    async (data: ProfileFormData): Promise<Profile> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      try {
        // UUIDを生成（簡易版）
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        // 経験年数を数値に変換
        const yearsOfExperience = data.yearsOfExperience
          ? parseInt(data.yearsOfExperience, 10)
          : undefined;

        // SNSリンクにIDを付与
        const socialLinks = data.socialLinks.map((link) => ({
          id: crypto.randomUUID(),
          service: link.service,
          url: link.url,
        }));

        const profile: Profile = {
          id,
          name: data.name,
          jobTitle: data.jobTitle,
          bio: data.bio || undefined,
          skills: data.skills,
          yearsOfExperience,
          socialLinks,
          createdAt: now,
          updatedAt: now,
        };

        await repository.save(profile);
        dispatch({ type: "SET_PROFILE", payload: profile });

        return profile;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "プロフィールの作成に失敗しました";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        throw error;
      }
    },
    [repository]
  );

  /**
   * プロフィールを更新する
   */
  const updateProfile = useCallback(
    async (id: string, data: ProfileFormData): Promise<Profile> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      try {
        // 既存のプロフィールを取得
        const existingProfile = await repository.findById(id);
        if (!existingProfile) {
          throw new Error("プロフィールが見つかりません");
        }

        // 経験年数を数値に変換
        const yearsOfExperience = data.yearsOfExperience
          ? parseInt(data.yearsOfExperience, 10)
          : undefined;

        // SNSリンクにIDを付与（既存のIDがあれば保持）
        const socialLinks = data.socialLinks.map((link, index) => ({
          id: existingProfile.socialLinks[index]?.id || crypto.randomUUID(),
          service: link.service,
          url: link.url,
        }));

        const updatedProfile: Profile = {
          ...existingProfile,
          name: data.name,
          jobTitle: data.jobTitle,
          bio: data.bio || undefined,
          skills: data.skills,
          yearsOfExperience,
          socialLinks,
          updatedAt: new Date().toISOString(),
        };

        await repository.save(updatedProfile);
        dispatch({ type: "SET_PROFILE", payload: updatedProfile });

        return updatedProfile;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "プロフィールの更新に失敗しました";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        throw error;
      }
    },
    [repository]
  );

  /**
   * プロフィールを削除する
   */
  const deleteProfile = useCallback(
    async (id: string): Promise<void> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      try {
        await repository.delete(id);
        dispatch({ type: "SET_PROFILE", payload: null });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "プロフィールの削除に失敗しました";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        throw error;
      }
    },
    [repository]
  );

  /**
   * プロフィールを読み込む
   */
  const loadProfile = useCallback(
    async (id: string): Promise<Profile | null> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      try {
        const profile = await repository.findById(id);
        dispatch({ type: "SET_PROFILE", payload: profile });
        return profile;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "プロフィールの読み込みに失敗しました";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        return null;
      }
    },
    [repository]
  );

  /**
   * エラーをクリアする
   */
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value: ProfileContextValue = {
    ...state,
    createProfile,
    updateProfile,
    deleteProfile,
    loadProfile,
    clearError,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

/**
 * ProfileContextを使用するカスタムフック
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useProfileContext(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return context;
}
