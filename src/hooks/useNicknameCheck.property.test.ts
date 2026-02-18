/**
 * useNicknameCheckフックのプロパティベーステスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import { useNicknameCheck } from './useNicknameCheck';
import * as nicknameValidation from '../utils/nicknameValidation';
import * as nicknameService from '../services/nicknameService';
import { RESERVED_NICKNAMES } from '../types/nickname';

// モック設定
vi.mock('../utils/nicknameValidation');
vi.mock('../services/nicknameService');

describe('useNicknameCheck - Property-based tests', () => {
  const mockValidateNickname = vi.mocked(nicknameValidation.validateNickname);
  const mockCheckNicknameAvailability = vi.mocked(nicknameService.checkNicknameAvailability);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 有効なニックネームのジェネレーター
  const validNicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s))
    .filter(s => !RESERVED_NICKNAMES.includes(s.toLowerCase() as any));

  // 無効なニックネームのジェネレーター
  const invalidNicknameArbitrary = fc.oneof(
    // 短すぎる
    fc.string({ minLength: 0, maxLength: 2 }),
    // 長すぎる
    fc.string({ minLength: 37, maxLength: 50 }),
    // 無効な文字を含む
    fc.string({ minLength: 3, maxLength: 36 }).filter(s => /[^a-zA-Z0-9_-]/.test(s)),
    // 記号で始まる
    fc.tuple(fc.constantFrom('-', '_'), fc.string({ minLength: 2, maxLength: 35 }))
      .map(([symbol, rest]) => symbol + rest),
    // 記号で終わる
    fc.tuple(fc.string({ minLength: 2, maxLength: 35 }), fc.constantFrom('-', '_'))
      .map(([rest, symbol]) => rest + symbol),
    // 連続記号
    fc.string({ minLength: 3, maxLength: 36 }).filter(s => /[-_]{2,}/.test(s)),
    // 予約語
    fc.constantFrom(...RESERVED_NICKNAMES)
  );

  describe('プロパティ1: ニックネームリアルタイムチェック', () => {
    // Feature: profile-nickname-urls, Property 1: ニックネームリアルタイムチェック
    it('任意の有効なニックネームに対して、デバウンス後にリアルタイムで利用可能性がチェックされる', () => {
      fc.assert(fc.asyncProperty(
        validNicknameArbitrary,
        async (nickname) => {
          // バリデーション成功をモック
          mockValidateNickname.mockReturnValue({ isValid: true });
          // 利用可能をモック
          mockCheckNicknameAvailability.mockResolvedValue({ 
            isAvailable: true, 
            isChecking: false 
          });

          const { result } = renderHook(() => useNicknameCheck(nickname));
          
          // デバウンス時間経過と非同期処理を待つ
          await act(async () => {
            vi.advanceTimersByTime(500);
            await vi.runAllTimersAsync();
          });
          
          // バリデーションと利用可能性チェックが呼ばれる
          expect(mockValidateNickname).toHaveBeenCalledWith(nickname);
          expect(mockCheckNicknameAvailability).toHaveBeenCalledWith(nickname, undefined);
          
          // 結果が正しい
          expect(result.current.status).toBe('available');
          expect(result.current.isValid).toBe(true);
          expect(result.current.isAvailable).toBe(true);
          expect(result.current.message).toBe('このニックネームは利用可能です');
        }
      ), { numRuns: 5 });
    });

    it('任意の無効なニックネームに対して、バリデーションエラーが即座に表示される', () => {
      fc.assert(fc.asyncProperty(
        invalidNicknameArbitrary,
        async (nickname) => {
          // バリデーション失敗をモック
          mockValidateNickname.mockReturnValue({
            isValid: false,
            error: 'バリデーションエラー'
          });

          const { result } = renderHook(() => useNicknameCheck(nickname));
          
          // デバウンス時間経過と非同期処理を待つ
          await act(async () => {
            vi.advanceTimersByTime(500);
            await vi.runAllTimersAsync();
          });
          
          // バリデーションのみ呼ばれ、利用可能性チェックは呼ばれない
          expect(mockValidateNickname).toHaveBeenCalledWith(nickname);
          expect(mockCheckNicknameAvailability).not.toHaveBeenCalled();
          
          // 結果が正しい
          expect(result.current.status).toBe('error');
          expect(result.current.isValid).toBe(false);
          expect(result.current.isAvailable).toBe(false);
          expect(result.current.message).toBe('バリデーションエラー');
        }
      ), { numRuns: 5 });
    });

    it('任意の利用不可能なニックネームに対して、unavailable状態が表示される', () => {
      fc.assert(fc.asyncProperty(
        validNicknameArbitrary,
        async (nickname) => {
          // バリデーション成功をモック
          mockValidateNickname.mockReturnValue({ isValid: true });
          // 利用不可能をモック
          mockCheckNicknameAvailability.mockResolvedValue({
            isAvailable: false,
            isChecking: false,
            error: 'このニックネームは既に使用されています'
          });

          const { result } = renderHook(() => useNicknameCheck(nickname));
          
          // デバウンス時間経過と非同期処理を待つ
          await act(async () => {
            vi.advanceTimersByTime(500);
            await vi.runAllTimersAsync();
          });
          
          // 両方のチェックが呼ばれる
          expect(mockValidateNickname).toHaveBeenCalledWith(nickname);
          expect(mockCheckNicknameAvailability).toHaveBeenCalledWith(nickname, undefined);
          
          // 結果が正しい
          expect(result.current.status).toBe('unavailable');
          expect(result.current.isValid).toBe(true);
          expect(result.current.isAvailable).toBe(false);
          expect(result.current.message).toBe('このニックネームは既に使用されています');
        }
      ), { numRuns: 5 });
    });
  });

  describe('プロパティ18: ニックネーム変更時のリアルタイムチェック', () => {
    // Feature: profile-nickname-urls, Property 18: ニックネーム変更時のリアルタイムチェック
    it('現在のニックネームが設定されている場合、同じニックネーム（大文字小文字違い）は利用可能として扱われる', () => {
      fc.assert(fc.asyncProperty(
        validNicknameArbitrary,
        async (baseNickname) => {
          const currentNickname = baseNickname.toLowerCase();
          const testNickname = baseNickname.toUpperCase();
          
          // バリデーション成功をモック
          mockValidateNickname.mockReturnValue({ isValid: true });

          const { result } = renderHook(() => 
            useNicknameCheck(testNickname, { currentNickname })
          );
          
          // デバウンス時間経過
          act(() => {
            vi.advanceTimersByTime(500);
          });
          
          await waitFor(() => {
            expect(result.current.status).toBe('available');
          });
          
          // バリデーションは呼ばれるが、利用可能性チェックは呼ばれない
          expect(mockValidateNickname).toHaveBeenCalledWith(testNickname);
          expect(mockCheckNicknameAvailability).not.toHaveBeenCalled();
          
          // 結果が正しい
          expect(result.current.isValid).toBe(true);
          expect(result.current.isAvailable).toBe(true);
          expect(result.current.message).toBe('現在のニックネームです');
        }
      ), { numRuns: 5 });
    });

    it('現在のニックネームと異なるニックネームは通常の利用可能性チェックが実行される', () => {
      fc.assert(fc.asyncProperty(
        validNicknameArbitrary,
        validNicknameArbitrary,
        async (currentNickname, newNickname) => {
          // 異なるニックネームの場合のみテスト
          fc.pre(currentNickname.toLowerCase() !== newNickname.toLowerCase());
          
          // バリデーション成功をモック
          mockValidateNickname.mockReturnValue({ isValid: true });
          // 利用可能をモック
          mockCheckNicknameAvailability.mockResolvedValue({ isAvailable: true });

          const { result } = renderHook(() => 
            useNicknameCheck(newNickname, { currentNickname })
          );
          
          // デバウンス時間経過
          act(() => {
            vi.advanceTimersByTime(500);
          });
          
          await waitFor(() => {
            expect(result.current.status).toBe('available');
          });
          
          // 両方のチェックが呼ばれる
          expect(mockValidateNickname).toHaveBeenCalledWith(newNickname);
          expect(mockCheckNicknameAvailability).toHaveBeenCalledWith(newNickname, currentNickname);
          
          // 結果が正しい
          expect(result.current.isValid).toBe(true);
          expect(result.current.isAvailable).toBe(true);
        }
      ), { numRuns: 5 });
    });
  });

  describe('デバウンス動作のプロパティテスト', () => {
    it('任意のデバウンス時間に対して、指定した時間後にチェックが実行される', () => {
      fc.assert(fc.asyncProperty(
        validNicknameArbitrary,
        fc.integer({ min: 100, max: 2000 }), // デバウンス時間
        async (nickname, debounceDelay) => {
          // バリデーション成功をモック
          mockValidateNickname.mockReturnValue({ isValid: true });
          // 利用可能をモック
          mockCheckNicknameAvailability.mockResolvedValue({ 
            isAvailable: true,
            isChecking: false
          });

          const { result } = renderHook(() => 
            useNicknameCheck(nickname, { debounceDelay })
          );
          
          // デバウンス時間経過と非同期処理を待つ
          await act(async () => {
            vi.advanceTimersByTime(debounceDelay);
            await vi.runAllTimersAsync();
          });
          
          expect(result.current.status).toBe('available');
          expect(mockValidateNickname).toHaveBeenCalledWith(nickname);
        }
      ), { numRuns: 3 });
    });
  });
});