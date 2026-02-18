/**
 * SupabaseProfileRepository のユニットテスト
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { SupabaseProfileRepository } from './SupabaseProfileRepository';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

// Supabaseクライアントをモック
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('SupabaseProfileRepository', () => {
  let repository: SupabaseProfileRepository;
  let mockFrom: Mock;
  let mockSelect: Mock;
  let mockEq: Mock;
  let mockNeq: Mock;
  let mockIlike: Mock;
  let mockSingle: Mock;
  let mockInsert: Mock;
  let mockUpdate: Mock;
  let mockDelete: Mock;
  let mockOrder: Mock;

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

  const mockProfileRow = {
    id: 'test-id',
    user_id: 'test-user-id',
    nickname: 'testuser',
    name: 'Test User',
    job_title: 'Developer',
    bio: 'Test bio',
    image_url: 'https://example.com/image.jpg',
    skills: ['JavaScript', 'TypeScript'],
    years_of_experience: 5,
    social_links: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    repository = new SupabaseProfileRepository();

    // モック関数の初期化
    mockSingle = vi.fn();
    mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    mockNeq = vi.fn().mockReturnValue({ single: mockSingle });
    mockIlike = vi.fn().mockReturnValue({ single: mockSingle });
    mockSelect = vi.fn().mockReturnValue({ 
      eq: mockEq,
      neq: mockNeq,
      ilike: mockIlike,
      single: mockSingle,
      order: mockOrder
    });
    mockInsert = vi.fn();
    mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    mockOrder = vi.fn();
    mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    (supabase.from as Mock) = mockFrom;
    (supabase.rpc as Mock) = vi.fn().mockResolvedValue({ data: null, error: null });
  });

  describe('findByNickname', () => {
    it('ニックネームでプロフィールを検索できる', async () => {
      // RPCを使用した大文字小文字を区別しない検索のテスト
      (supabase.rpc as Mock).mockResolvedValue({ 
        data: [mockProfileRow], 
        error: null 
      });

      const result = await repository.findByNickname('TestUser');

      expect(supabase.rpc).toHaveBeenCalledWith('search_profiles_by_nickname', {
        search_nickname: 'TestUser'
      });
      expect(result).toEqual(mockProfile);
    });

    it('存在しないニックネームの場合nullを返す', async () => {
      (supabase.rpc as Mock).mockResolvedValue({ 
        data: [], 
        error: null 
      });

      const result = await repository.findByNickname('nonexistent');

      expect(result).toBeNull();
    });

    it('データベースエラーの場合エラーを投げる', async () => {
      (supabase.rpc as Mock).mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(repository.findByNickname('testuser')).rejects.toThrow(
        'プロフィールの取得に失敗しました: Database error'
      );
    });
  });

  describe('isNicknameAvailable', () => {
    beforeEach(() => {
      // isNicknameAvailableでは配列を返すクエリを使用
      mockSelect.mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnThis(),
        }),
      });
    });

    it('利用可能なニックネームの場合trueを返す', async () => {
      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
      };
      mockSelect.mockReturnValue(mockQuery);
      
      // クエリの最終結果をモック
      Object.assign(mockQuery, { data: [], error: null });

      const result = await repository.isNicknameAvailable('newuser');

      expect(result).toBe(true);
    });

    it('既に使用されているニックネームの場合falseを返す', async () => {
      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
      };
      mockSelect.mockReturnValue(mockQuery);
      
      // クエリの最終結果をモック
      Object.assign(mockQuery, { data: [{ id: 'existing-id' }], error: null });

      const result = await repository.isNicknameAvailable('existinguser');

      expect(result).toBe(false);
    });

    it('除外ユーザーIDが指定された場合、そのユーザーを除外する', async () => {
      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
      };
      mockSelect.mockReturnValue(mockQuery);
      
      // クエリの最終結果をモック
      Object.assign(mockQuery, { data: [], error: null });

      const result = await repository.isNicknameAvailable('testuser', 'exclude-user-id');

      expect(mockQuery.neq).toHaveBeenCalledWith('user_id', 'exclude-user-id');
      expect(result).toBe(true);
    });

    it('データベースエラーの場合エラーを投げる', async () => {
      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
      };
      mockSelect.mockReturnValue(mockQuery);
      
      // クエリの最終結果をモック
      Object.assign(mockQuery, { data: null, error: { message: 'Database error' } });

      await expect(repository.isNicknameAvailable('testuser')).rejects.toThrow(
        'ニックネームの利用可能性チェックに失敗しました: Database error'
      );
    });
  });

  describe('checkNicknameDuplicate', () => {
    beforeEach(() => {
      // checkNicknameDuplicateでも配列を返すクエリを使用
      mockSelect.mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnThis(),
        }),
      });
    });

    it('重複していない場合falseを返す', async () => {
      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
      };
      mockSelect.mockReturnValue(mockQuery);
      
      // クエリの最終結果をモック
      Object.assign(mockQuery, { data: [], error: null });

      const result = await repository.checkNicknameDuplicate('uniqueuser');

      expect(result).toBe(false);
    });

    it('重複している場合trueを返す', async () => {
      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
      };
      mockSelect.mockReturnValue(mockQuery);
      
      // クエリの最終結果をモック
      Object.assign(mockQuery, { data: [{ id: 'duplicate-id' }], error: null });

      const result = await repository.checkNicknameDuplicate('duplicateuser');

      expect(result).toBe(true);
    });

    it('除外プロフィールIDが指定された場合、そのプロフィールを除外する', async () => {
      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
      };
      mockSelect.mockReturnValue(mockQuery);
      
      // クエリの最終結果をモック
      Object.assign(mockQuery, { data: [], error: null });

      const result = await repository.checkNicknameDuplicate('testuser', 'exclude-profile-id');

      expect(mockQuery.neq).toHaveBeenCalledWith('id', 'exclude-profile-id');
      expect(result).toBe(false);
    });

    it('データベースエラーの場合エラーを投げる', async () => {
      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
      };
      mockSelect.mockReturnValue(mockQuery);
      
      // クエリの最終結果をモック
      Object.assign(mockQuery, { data: null, error: { message: 'Database error' } });

      await expect(repository.checkNicknameDuplicate('testuser')).rejects.toThrow(
        'ニックネームの重複チェックに失敗しました: Database error'
      );
    });
  });
});