/**
 * ProfileContextのプロパティベーステスト
 */

import { describe, it, vi, beforeEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { ProfileProvider, useProfile } from './ProfileContext';
import type { ProfileRepository } from '../../repositories/ProfileRepository';
import type { Profile } from '../../types/profile';

// ImageServiceをモック
vi.mock('../../services/imageService', () => ({
  uploadProfileImage: vi.fn(),
  deleteProfileImage: vi.fn(),
}));

import { uploadProfileImage, deleteProfileImage } from '../../services/imageService';

/**
 * Feature: engineer-profile-platform, Property 44: 既存画像の削除（更新時）
 * 検証: 要件 12.7
 *
 * 新しい画像ファイルでプロフィールを更新する場合、既存の画像が削除される
 */
describe('Property 44: 既存画像の削除（更新時）', () => {
  let mockRepository: ProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    // モックRepositoryの作成
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };
  });

  // 画像URLを持つプロフィールのジェネレーター
  const profileWithImageArbitrary = fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    imageUrl: fc.webUrl({ validSchemes: ['https'] }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
    yearsOfExperience: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
    socialLinks: fc.array(
      fc.record({
        id: fc.uuid(),
        service: fc.string({ minLength: 1, maxLength: 50 }),
        url: fc.webUrl({ validSchemes: ['http', 'https'] }),
      }),
      { maxLength: 10 }
    ),
    createdAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
    updatedAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
  });

  it('新しい画像ファイルでプロフィールを更新する場合、既存の画像が削除される', async () => {
    await fc.assert(
      fc.asyncProperty(profileWithImageArbitrary, async (existingProfile: Profile) => {
        // モックの設定
        vi.mocked(mockRepository.findById).mockResolvedValue(existingProfile);
        vi.mocked(mockRepository.save).mockResolvedValue(undefined);
        vi.mocked(deleteProfileImage).mockResolvedValue(undefined);
        vi.mocked(uploadProfileImage).mockResolvedValue('https://example.com/new-image.jpg');

        // 新しい画像ファイルを作成
        const newImageFile = new File(['new image content'], 'new-image.jpg', {
          type: 'image/jpeg',
        });

        // ProfileProviderをレンダリング
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <ProfileProvider repository={mockRepository}>{children}</ProfileProvider>
        );

        const { result } = renderHook(() => useProfile(), { wrapper });

        // プロフィールを更新
        await act(async () => {
          await result.current.updateProfile(existingProfile.id, {
            name: existingProfile.name,
            jobTitle: existingProfile.jobTitle,
            bio: existingProfile.bio,
            skills: existingProfile.skills,
            yearsOfExperience: existingProfile.yearsOfExperience?.toString(),
            socialLinks: existingProfile.socialLinks.map((link) => ({
              service: link.service,
              url: link.url,
            })),
            imageFile: newImageFile,
          });
        });

        // 既存の画像が削除されたことを確認
        expect(deleteProfileImage).toHaveBeenCalledWith(existingProfile.imageUrl);

        return true;
      }),
      { numRuns: 10 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 45: 画像の削除（プロフィール削除時）
 * 検証: 要件 12.8
 *
 * プロフィールを削除する場合、関連する画像も削除される
 */
describe('Property 45: 画像の削除（プロフィール削除時）', () => {
  let mockRepository: ProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };
  });

  // 画像URLを持つプロフィールのジェネレーター
  const profileWithImageArbitrary = fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    imageUrl: fc.webUrl({ validSchemes: ['https'] }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
    yearsOfExperience: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
    socialLinks: fc.array(
      fc.record({
        id: fc.uuid(),
        service: fc.string({ minLength: 1, maxLength: 50 }),
        url: fc.webUrl({ validSchemes: ['http', 'https'] }),
      }),
      { maxLength: 10 }
    ),
    createdAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
    updatedAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
  });

  it('プロフィールを削除する場合、関連する画像も削除される', async () => {
    await fc.assert(
      fc.asyncProperty(profileWithImageArbitrary, async (profile: Profile) => {
        // モックの設定
        vi.mocked(mockRepository.findById).mockResolvedValue(profile);
        vi.mocked(mockRepository.delete).mockResolvedValue(undefined);
        vi.mocked(deleteProfileImage).mockResolvedValue(undefined);

        // ProfileProviderをレンダリング
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <ProfileProvider repository={mockRepository}>{children}</ProfileProvider>
        );

        const { result } = renderHook(() => useProfile(), { wrapper });

        // プロフィールを削除
        await act(async () => {
          await result.current.deleteProfile(profile.id);
        });

        // 画像が削除されたことを確認
        expect(deleteProfileImage).toHaveBeenCalledWith(profile.imageUrl);

        return true;
      }),
      { numRuns: 10 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 46: 画像の削除（ユーザー操作）
 * 検証: 要件 12.10
 *
 * ユーザーが画像削除を指定してプロフィールを更新する場合、画像が削除される
 */
describe('Property 46: 画像の削除（ユーザー操作）', () => {
  let mockRepository: ProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };
  });

  // 画像URLを持つプロフィールのジェネレーター
  const profileWithImageArbitrary = fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    imageUrl: fc.webUrl({ validSchemes: ['https'] }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
    yearsOfExperience: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
    socialLinks: fc.array(
      fc.record({
        id: fc.uuid(),
        service: fc.string({ minLength: 1, maxLength: 50 }),
        url: fc.webUrl({ validSchemes: ['http', 'https'] }),
      }),
      { maxLength: 10 }
    ),
    createdAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
    updatedAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
  });

  it('ユーザーが画像削除を指定してプロフィールを更新する場合、画像が削除される', async () => {
    await fc.assert(
      fc.asyncProperty(profileWithImageArbitrary, async (existingProfile: Profile) => {
        // モックの設定
        vi.mocked(mockRepository.findById).mockResolvedValue(existingProfile);
        vi.mocked(mockRepository.save).mockResolvedValue(undefined);
        vi.mocked(deleteProfileImage).mockResolvedValue(undefined);

        // ProfileProviderをレンダリング
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <ProfileProvider repository={mockRepository}>{children}</ProfileProvider>
        );

        const { result } = renderHook(() => useProfile(), { wrapper });

        // プロフィールを更新（画像削除フラグを設定）
        await act(async () => {
          await result.current.updateProfile(existingProfile.id, {
            name: existingProfile.name,
            jobTitle: existingProfile.jobTitle,
            bio: existingProfile.bio,
            skills: existingProfile.skills,
            yearsOfExperience: existingProfile.yearsOfExperience?.toString(),
            socialLinks: existingProfile.socialLinks.map((link) => ({
              service: link.service,
              url: link.url,
            })),
            removeImage: true,
          });
        });

        // 画像が削除されたことを確認
        expect(deleteProfileImage).toHaveBeenCalledWith(existingProfile.imageUrl);

        return true;
      }),
      { numRuns: 10 }
    );
  });
});
