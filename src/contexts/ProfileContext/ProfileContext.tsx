/**
 * プロフィールコンテキスト
 * プロフィールの状態管理を担当するContext
 */

import React, { createContext, useContext, useReducer } from 'react';
import type { Profile, ProfileFormData } from '../../types/profile';
import type { ProfileRepository } from '../../repositories/ProfileRepository';

/**
 * プロフィール状態の型
 */
interface ProfileState {
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
type ProfileAction =
  | { type: 'SET_PROFILE'; payload: Profile | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

/**
 * プロフィールコンテキストの値の型
 */
interface ProfileContextValue extends ProfileState {
  /** プロフィール作成 */
  createProfile: (userId: string, data: ProfileFormData) => Promise<Profile>;
  /** プロフィール更新 */
  updateProfile: (id: string, data: ProfileFormData) => Promise<Profile>;
  /** プロフィール削除 */
  deleteProfile: (id: string) => Promise<void>;
  /** プロフィール読み込み */
  loadProfile: (id: string) => Promise<Profile | null>;
  /** 自分のプロフィール読み込み */
  loadMyProfile: (userId: string) => Promise<Profile | null>;
  /** エラークリア */
  clearError: () => void;
}

/**
 * プロフィールリデューサー
 */
function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_PROFILE':
      return {
        ...state,
        profile: action.payload,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

/**
 * 初期状態
 */
const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

/**
 * プロフィールコンテキスト
 */
const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/**
 * プロフィールプロバイダーのプロパティ
 */
interface ProfileProviderProps {
  children: React.ReactNode;
  /** 注入されたRepository実装 */
  repository: ProfileRepository;
}

/**
 * プロフィールプロバイダー
 */
export function ProfileProvider({ children, repository }: ProfileProviderProps) {
  const [state, dispatch] = useReducer(profileReducer, initialState);

  /**
   * プロフィール作成
   */
  const createProfile = async (userId: string, data: ProfileFormData): Promise<Profile> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // ProfileFormDataからProfileを作成
      const now = new Date().toISOString();
      const profile: Profile = {
        id: crypto.randomUUID(),
        user_id: userId,
        name: data.name,
        jobTitle: data.jobTitle,
        bio: data.bio || undefined,
        skills: data.skills,
        yearsOfExperience: data.yearsOfExperience
          ? parseInt(data.yearsOfExperience, 10)
          : undefined,
        socialLinks: data.socialLinks.map((link) => ({
          id: crypto.randomUUID(),
          service: link.service,
          url: link.url,
        })),
        createdAt: now,
        updatedAt: now,
      };

      // Repositoryに保存
      await repository.save(profile);

      dispatch({ type: 'SET_PROFILE', payload: profile });

      return profile;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'プロフィールの作成に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  /**
   * プロフィール更新
   */
  const updateProfile = async (id: string, data: ProfileFormData): Promise<Profile> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // 既存のプロフィールを取得
      const existingProfile = await repository.findById(id);
      if (!existingProfile) {
        throw new Error('プロフィールが見つかりません');
      }

      // 更新されたプロフィールを作成
      const updatedProfile: Profile = {
        ...existingProfile,
        name: data.name,
        jobTitle: data.jobTitle,
        bio: data.bio || undefined,
        skills: data.skills,
        yearsOfExperience: data.yearsOfExperience
          ? parseInt(data.yearsOfExperience, 10)
          : undefined,
        socialLinks: data.socialLinks.map((link, index) => ({
          id: existingProfile.socialLinks[index]?.id || crypto.randomUUID(),
          service: link.service,
          url: link.url,
        })),
        updatedAt: new Date().toISOString(),
      };

      // Repositoryに保存
      await repository.save(updatedProfile);

      dispatch({ type: 'SET_PROFILE', payload: updatedProfile });

      return updatedProfile;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'プロフィールの更新に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  /**
   * プロフィール削除
   */
  const deleteProfile = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await repository.delete(id);

      dispatch({ type: 'SET_PROFILE', payload: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'プロフィールの削除に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  /**
   * プロフィール読み込み
   */
  const loadProfile = async (id: string): Promise<Profile | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const profile = await repository.findById(id);

      dispatch({ type: 'SET_PROFILE', payload: profile });

      return profile;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'プロフィールの読み込みに失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  /**
   * 自分のプロフィール読み込み
   */
  const loadMyProfile = async (userId: string): Promise<Profile | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const profile = await repository.findByUserId(userId);

      dispatch({ type: 'SET_PROFILE', payload: profile });

      return profile;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'プロフィールの読み込みに失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  /**
   * エラークリア
   */
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: ProfileContextValue = {
    ...state,
    createProfile,
    updateProfile,
    deleteProfile,
    loadProfile,
    loadMyProfile,
    clearError,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

/**
 * プロフィールコンテキストを使用するカスタムフック
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileはProfileProvider内で使用する必要があります');
  }
  return context;
}
