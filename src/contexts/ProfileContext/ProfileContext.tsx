/**
 * プロフィールコンテキスト
 * プロフィールの状態管理を担当するContext
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Profile, ProfileFormData } from '../../types/profile';
import type { ProfileRepository } from '../../repositories/ProfileRepository';
import { uploadProfileImage, deleteProfileImage } from '../../services/imageService';
import { checkNicknameAvailability } from '../../services/nicknameService';
import { toAppError } from '../../types/errors';
import { getErrorMessage } from '../../utils/errorUtils';

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
  /** ニックネームでプロフィール読み込み */
  loadProfileByNickname: (nickname: string) => Promise<Profile | null>;
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
   * エラーハンドリングを強化した実装
   */
  const createProfile = useCallback(async (userId: string, data: ProfileFormData): Promise<Profile> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // ニックネームの利用可能性チェック
      const availabilityResult = await checkNicknameAvailability(data.nickname);
      if (!availabilityResult.isAvailable) {
        const errorMessage = availabilityResult.error || 'このニックネームは使用できません';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw new Error(errorMessage);
      }

      // 画像アップロード処理
      let imageUrl: string | undefined = undefined;
      if (data.imageFile) {
        try {
          imageUrl = await uploadProfileImage(userId, data.imageFile);
        } catch (imageError) {
          // 画像アップロードに失敗してもプロフィール作成は継続
          console.error('画像のアップロードに失敗しました:', imageError);
        }
      }

      // ProfileFormDataからProfileを作成
      const now = new Date().toISOString();
      const profile: Profile = {
        id: crypto.randomUUID(),
        user_id: userId,
        nickname: data.nickname,
        name: data.name,
        jobTitle: data.jobTitle,
        bio: data.bio || undefined,
        imageUrl: imageUrl,
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
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      const appError = toAppError(error);
      appError.log();
      
      throw appError;
    }
  }, [repository]);

  /**
   * プロフィール更新
   * エラーハンドリングを強化した実装
   */
  const updateProfile = useCallback(async (id: string, data: ProfileFormData): Promise<Profile> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // 既存のプロフィールを取得
      const existingProfile = await repository.findById(id);
      if (!existingProfile) {
        const errorMessage = 'プロフィールが見つかりません';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw new Error(errorMessage);
      }

      // ニックネームが変更された場合、利用可能性チェック
      if (data.nickname !== existingProfile.nickname) {
        const availabilityResult = await checkNicknameAvailability(
          data.nickname,
          existingProfile.nickname
        );
        if (!availabilityResult.isAvailable) {
          const errorMessage = availabilityResult.error || 'このニックネームは使用できません';
          dispatch({ type: 'SET_ERROR', payload: errorMessage });
          throw new Error(errorMessage);
        }
      }

      // 画像処理
      let imageUrl: string | undefined = existingProfile.imageUrl;

      // 画像削除フラグがある場合
      if (data.removeImage) {
        if (existingProfile.imageUrl) {
          try {
            await deleteProfileImage(existingProfile.imageUrl);
          } catch (imageError) {
            console.error('画像の削除に失敗しました:', imageError);
          }
        }
        imageUrl = undefined;
      }
      // 新しい画像ファイルがある場合
      else if (data.imageFile) {
        // 既存の画像を削除
        if (existingProfile.imageUrl) {
          try {
            await deleteProfileImage(existingProfile.imageUrl);
          } catch (imageError) {
            console.error('既存画像の削除に失敗しました:', imageError);
          }
        }
        // 新しい画像をアップロード
        try {
          imageUrl = await uploadProfileImage(existingProfile.user_id, data.imageFile);
        } catch (imageError) {
          console.error('画像のアップロードに失敗しました:', imageError);
          // アップロード失敗時は既存のURLを保持
          imageUrl = existingProfile.imageUrl;
        }
      }

      // 更新されたプロフィールを作成
      const updatedProfile: Profile = {
        ...existingProfile,
        nickname: data.nickname,
        name: data.name,
        jobTitle: data.jobTitle,
        bio: data.bio || undefined,
        imageUrl: imageUrl,
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
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      const appError = toAppError(error);
      appError.log();
      
      throw appError;
    }
  }, [repository]);

  /**
   * プロフィール削除
   * エラーハンドリングを強化した実装
   */
  const deleteProfile = useCallback(async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // プロフィールを取得して画像URLを確認
      const profile = await repository.findById(id);
      if (profile?.imageUrl) {
        try {
          await deleteProfileImage(profile.imageUrl);
        } catch (imageError) {
          console.error('画像の削除に失敗しました:', imageError);
        }
      }

      await repository.delete(id);

      dispatch({ type: 'SET_PROFILE', payload: null });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      const appError = toAppError(error);
      appError.log();
      
      throw appError;
    }
  }, [repository]);

  /**
   * プロフィール読み込み
   * エラーハンドリングを強化した実装
   */
  const loadProfile = useCallback(async (id: string): Promise<Profile | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const profile = await repository.findById(id);

      dispatch({ type: 'SET_PROFILE', payload: profile });

      return profile;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      const appError = toAppError(error);
      appError.log();
      
      throw appError;
    }
  }, [repository]);

  /**
   * 自分のプロフィール読み込み
   * エラーハンドリングを強化した実装
   */
  const loadMyProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const profile = await repository.findByUserId(userId);

      dispatch({ type: 'SET_PROFILE', payload: profile });

      return profile;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      const appError = toAppError(error);
      appError.log();
      
      throw appError;
    }
  }, [repository]);

  /**
   * ニックネームでプロフィール読み込み
   * エラーハンドリングを強化した実装
   */
  const loadProfileByNickname = useCallback(async (nickname: string): Promise<Profile | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const profile = await repository.findByNickname(nickname);

      dispatch({ type: 'SET_PROFILE', payload: profile });

      return profile;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      const appError = toAppError(error);
      appError.log();
      
      throw appError;
    }
  }, [repository]);

  /**
   * エラークリア
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: ProfileContextValue = {
    ...state,
    createProfile,
    updateProfile,
    deleteProfile,
    loadProfile,
    loadMyProfile,
    loadProfileByNickname,
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
