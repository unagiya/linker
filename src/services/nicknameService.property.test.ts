/**
 * nicknameServiceのプロパティベーステスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { checkNicknameAvailability, findProfileByNickname, updateNickname } from './nicknameService';
import { supabase } from '../lib/supabase';
import { RESERVED_NICKNAMES } from '../types/nickname';

// Supabaseクライアントをモック
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('nicknameService - Property-based tests', () => {
  const mockSupabase = supabase as any;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 有効なニックネームのジェネレーター
  const validNicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s))
    .filter(s => !RESERVED_NICKNAMES.includes(s.toLowerCase() as any));

  // 大文字小文字のバリエーションを生成するジェネレーター
  const caseVariationArbitrary = (nickname: string) => fc.constantFrom(
    nickname.toLowerCase(),
    nickname.toUpperCase(),
    nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase(),
    nickname.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('')
  );

  describe('プロパティ10: 大文字小文字無視ユニーク性', () => {
    // Feature: profile-nickname-urls, Property 10: 大文字小文字無視ユニーク性
    it('任意の大文字小文字の違いがあるニックネームに対して、大文字小文字を区別せずにユニーク性がチェックされる', () => {
      fc.assert(fc.asyncProperty(
        validNicknameArbitrary,
        async (baseNickname) => {
          // 既存のニックネームとして登録されているとする
          const existingNickname = baseNickname.toLowerCase();
          
          // 大文字小文字のバリエーションを生成
          const variations = [
            baseNickname.toLowerCase(),
            baseNickname.toUpperCase(),
            baseNickname.charAt(0).toUpperCase() + baseNickname.slice(1).toLowerCase()
          ];

          // すべてのバリエーションで利用不可になることを確認
          for (const variation of variations) {
            const mockSelect = vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ nickname: existingNickname }],
                  error: null
                })
              })
            });
            
            mockSupabase.from.mockReturnValue({
              select: mockSelect
            });

            const result = await checkNicknameAvailability(variation);
            
            expect(result.isAvailable).toBe(false);
            expect(result.error).toBe('このニックネームは既に使用されています');
          }
        }
      ), { numRuns: 20 });
    });

    // Feature: profile-nickname-urls, Property 10: 大文字小文字無視ユニーク性（現在のニックネーム除外）
    it('現在のニックネームと大文字小文字が違うだけの場合は利用可能とする', () => {
      fc.assert(fc.asyncProperty(
        validNicknameArbitrary,
        async (baseNickname) => {
          const currentNickname = baseNickname.toLowerCase();
          
          // 大文字小文字のバリエーションを生成
          const variations = [
            baseNickname.toUpperCase(),
            baseNickname.charAt(0).toUpperCase() + baseNickname.slice(1).toLowerCase()
          ];

          // 現在のニックネームと大文字小文字が違うだけの場合は利用可能
          for (const variation of variations) {
            const result = await checkNicknameAvailability(variation, currentNickname);
            
            expect(result.isAvailable).toBe(true);
            expect(result.error).toBeUndefined();
          }
        }
      ), { numRuns: 20 });
    });
  });

  describe('プロパティ12: ニックネームベースURL解決', () => {
    // Feature: profile-nickname-urls, Property 12: ニックネームベースURL解決
    it('任意の有効なニックネームに対して、findProfileByNicknameで対応するプロフィールが取得できる', () => {
      fc.assert(fc.asyncProperty(
        validNicknameArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }), // name
        fc.string({ minLength: 1, maxLength: 50 }), // jobTitle
        async (nickname, name, jobTitle) => {
          const mockProfile = {
            id: 'test-id',
            nickname: nickname.toLowerCase(),
            name,
            jobTitle,
            user_id: 'user-123',
            skills: [],
            socialLinks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // 大文字小文字のバリエーションでテスト
          const variations = [
            nickname.toLowerCase(),
            nickname.toUpperCase(),
            nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase()
          ];

          for (const variation of variations) {
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

            const result = await findProfileByNickname(variation);
            
            expect(result).toEqual(mockProfile);
          }
        }
      ), { numRuns: 10 });
    });
  });

  describe('プロパティ20: 有効ニックネーム変更の保存', () => {
    // Feature: profile-nickname-urls, Property 20: 有効ニックネーム変更の保存
    it('任意の有効で利用可能なニックネーム変更に対して、変更が保存されてSupabaseデータベースが更新される', () => {
      fc.assert(fc.asyncProperty(
        fc.uuid(), // profileId
        validNicknameArbitrary, // newNickname
        async (profileId, newNickname) => {
          const mockUpdate = vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null
            })
          });
          
          mockSupabase.from.mockReturnValue({
            update: mockUpdate
          });

          await updateNickname(profileId, newNickname);
          
          expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
          expect(mockUpdate).toHaveBeenCalledWith({
            nickname: newNickname.toLowerCase(),
            updated_at: expect.any(String)
          });
          
          const eqCall = mockUpdate().eq;
          expect(eqCall).toHaveBeenCalledWith('id', profileId);
        }
      ), { numRuns: 20 });
    });
  });
});