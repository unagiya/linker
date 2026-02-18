/**
 * nicknameServiceのユニットテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkNicknameAvailability, findProfileByNickname, updateNickname } from './nicknameService';
import { supabase } from '../lib/supabase';

// Supabaseクライアントをモック
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('nicknameService', () => {
  const mockSupabase = supabase as any;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkNicknameAvailability', () => {
    it('予約語の場合は利用不可を返す', async () => {
      const result = await checkNicknameAvailability('admin');
      
      expect(result).toEqual({
        isAvailable: false,
        isChecking: false,
        error: 'このニックネームは予約語のため使用できません'
      });
    });

    it('現在のニックネームと同じ場合は利用可能を返す', async () => {
      const result = await checkNicknameAvailability('test-user', 'test-user');
      
      expect(result).toEqual({
        isAvailable: true,
        isChecking: false
      });
    });

    it('大文字小文字が違っても現在のニックネームと同じ場合は利用可能を返す', async () => {
      const result = await checkNicknameAvailability('Test-User', 'test-user');
      
      expect(result).toEqual({
        isAvailable: true,
        isChecking: false
      });
    });

    it('利用可能なニックネームの場合は利用可能を返す', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await checkNicknameAvailability('available-nickname');
      
      expect(result).toEqual({
        isAvailable: true,
        isChecking: false
      });
      
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('nickname');
    });

    it('既に使用されているニックネームの場合は利用不可を返す', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [{ nickname: 'existing-user' }],
            error: null
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await checkNicknameAvailability('existing-user');
      
      expect(result).toEqual({
        isAvailable: false,
        isChecking: false,
        error: 'このニックネームは既に使用されています'
      });
    });

    it('データベースエラーの場合はエラーを返す', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await checkNicknameAvailability('test-nickname');
      
      expect(result).toEqual({
        isAvailable: false,
        isChecking: false,
        error: '変更の保存に失敗しました。しばらく待ってから再試行してください'
      });
    });

    it('例外が発生した場合は予期しないエラーを返す', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await checkNicknameAvailability('test-nickname');
      
      expect(result.isAvailable).toBe(false);
      expect(result.isChecking).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('findProfileByNickname', () => {
    it('プロフィールが見つかった場合はプロフィールを返す', async () => {
      const mockProfile = {
        id: '123',
        nickname: 'test-user',
        name: 'Test User',
        jobTitle: 'Engineer'
      };

      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await findProfileByNickname('test-user');
      
      expect(result).toEqual(mockProfile);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('プロフィールが見つからない場合はnullを返す', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } // データが見つからない
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await findProfileByNickname('nonexistent-user');
      
      expect(result).toBeNull();
    });

    it('データベースエラーの場合は例外を投げる', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'OTHER_ERROR', message: 'Database error' }
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      await expect(findProfileByNickname('test-user')).rejects.toThrow('変更の保存に失敗しました');
    });

    it('例外が発生した場合は例外を再投げする', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(findProfileByNickname('test-user')).rejects.toThrow('Network error');
    });
  });

  describe('updateNickname', () => {
    it('ニックネーム更新が成功する', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      });

      await expect(updateNickname('profile-123', 'new-nickname')).resolves.not.toThrow();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        nickname: 'new-nickname',
        updated_at: expect.any(String)
      });
    });

    it('制約違反エラーの場合は適切なエラーメッセージを投げる', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { code: '23505', message: 'Unique constraint violation' }
        })
      });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      });

      await expect(updateNickname('profile-123', 'existing-nickname'))
        .rejects.toThrow('このニックネームは既に使用されています');
    });

    it('その他のデータベースエラーの場合は一般的なエラーメッセージを投げる', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { code: 'OTHER_ERROR', message: 'Database error' }
        })
      });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      });

      await expect(updateNickname('profile-123', 'new-nickname'))
        .rejects.toThrow('変更の保存に失敗しました');
    });

    it('例外が発生した場合は例外を再投げする', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(updateNickname('profile-123', 'new-nickname'))
        .rejects.toThrow('Network error');
    });
  });
});