/**
 * LocalStorageRepository のユニットテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageRepository } from './LocalStorageRepository';
import type { Profile } from '../types/profile';

// LocalStorageをモック
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('LocalStorageRepository', () => {
  let repository: LocalStorageRepository;

  const mockProfile: Profile = {
    id: 'test-id',
    user_id: 'test-user-id',
    nickname: 'testuser',
    name: 'Test User',
    jobTitle: 'Developer',
    bio: 'Test bio',
    imageUrl: 'https://example.com/image.jpg',
    skills: ['JavaScript', 'TypeScript'],
    yearsOfExperience: 5,
    socialLinks: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockProfile2: Profile = {
    id: 'test-id-2',
    user_id: 'test-user-id-2',
    nickname: 'anotheruser',
    name: 'Another User',
    jobTitle: 'Designer',
    bio: 'Another bio',
    skills: ['Design', 'UI/UX'],
    socialLinks: [],
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  };

  beforeEach(() => {
    repository = new LocalStorageRepository();
    vi.clearAllMocks();
  });

  describe('findByNickname', () => {
    it('ニックネームでプロフィールを検索できる（大文字小文字を区別しない）', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
        [mockProfile2.id]: mockProfile2,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      // 大文字小文字を区別しない検索のテスト
      const result = await repository.findByNickname('TESTUSER');

      expect(result).toEqual(mockProfile);
    });

    it('存在しないニックネームの場合nullを返す', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      const result = await repository.findByNickname('nonexistent');

      expect(result).toBeNull();
    });

    it('ストレージが空の場合nullを返す', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await repository.findByNickname('testuser');

      expect(result).toBeNull();
    });

    it('データが破損している場合nullを返す', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = await repository.findByNickname('testuser');

      expect(result).toBeNull();
    });
  });

  describe('isNicknameAvailable', () => {
    it('利用可能なニックネームの場合trueを返す', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      const result = await repository.isNicknameAvailable('newuser');

      expect(result).toBe(true);
    });

    it('既に使用されているニックネームの場合falseを返す（大文字小文字を区別しない）', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      const result = await repository.isNicknameAvailable('TESTUSER');

      expect(result).toBe(false);
    });

    it('除外ユーザーIDが指定された場合、そのユーザーを除外する', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      // 同じニックネームでも、除外ユーザーIDが指定されていれば利用可能
      const result = await repository.isNicknameAvailable('testuser', 'test-user-id');

      expect(result).toBe(true);
    });

    it('除外ユーザーID以外のユーザーが同じニックネームを使用している場合falseを返す', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
        [mockProfile2.id]: mockProfile2,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      // 別のユーザーが同じニックネームを使用している場合
      const result = await repository.isNicknameAvailable('testuser', 'different-user-id');

      expect(result).toBe(false);
    });

    it('ストレージが空の場合trueを返す', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await repository.isNicknameAvailable('testuser');

      expect(result).toBe(true);
    });

    it('データ読み込みエラーの場合エラーを投げる', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(repository.isNicknameAvailable('testuser')).rejects.toThrow(
        'ニックネームの利用可能性チェックに失敗しました: Storage error'
      );
    });
  });

  describe('checkNicknameDuplicate', () => {
    it('重複していない場合falseを返す', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      const result = await repository.checkNicknameDuplicate('uniqueuser');

      expect(result).toBe(false);
    });

    it('重複している場合trueを返す（大文字小文字を区別しない）', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      const result = await repository.checkNicknameDuplicate('TESTUSER');

      expect(result).toBe(true);
    });

    it('除外プロフィールIDが指定された場合、そのプロフィールを除外する', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      // 同じニックネームでも、除外プロフィールIDが指定されていれば重複なし
      const result = await repository.checkNicknameDuplicate('testuser', 'test-id');

      expect(result).toBe(false);
    });

    it('除外プロフィールID以外のプロフィールが同じニックネームを使用している場合trueを返す', async () => {
      const profileMap = {
        [mockProfile.id]: mockProfile,
        [mockProfile2.id]: mockProfile2,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(profileMap));

      // 別のプロフィールが同じニックネームを使用している場合
      const result = await repository.checkNicknameDuplicate('testuser', 'different-profile-id');

      expect(result).toBe(true);
    });

    it('ストレージが空の場合falseを返す', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await repository.checkNicknameDuplicate('testuser');

      expect(result).toBe(false);
    });

    it('データ読み込みエラーの場合エラーを投げる', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(repository.checkNicknameDuplicate('testuser')).rejects.toThrow(
        'ニックネームの重複チェックに失敗しました: Storage error'
      );
    });
  });
});