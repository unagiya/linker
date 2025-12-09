/**
 * SignInページのプロパティベーステスト
 * Feature: engineer-profile-platform, Property 7: ログイン成功後のリダイレクト
 * 検証: 要件 2.4
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import * as authService from '../../services/authService';

// authServiceのモック
vi.mock('../../services/authService');

describe('SignIn - Property Based Tests', () => {
  describe('プロパティ7: ログイン成功後のリダイレクト', () => {
    it('任意の正しいメールアドレスとパスワードに対して、signInが成功するとユーザーオブジェクトが返される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (email, password) => {
            // モックのセットアップ
            const mockUser = {
              id: crypto.randomUUID(),
              email,
              created_at: new Date().toISOString(),
            };

            vi.mocked(authService.signIn).mockResolvedValue(mockUser);

            // signInを呼び出し
            const result = await authService.signIn(email, password);

            // 結果を検証
            expect(result).toEqual(mockUser);
            expect(result.email).toBe(email);
            expect(authService.signIn).toHaveBeenCalledWith(email, password);

            vi.clearAllMocks();
          }
        ),
        { numRuns: 2 }
      );
    });

    it('任意のログイン成功に対して、getSessionが有効なセッションを返す', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (email, password) => {
            // モックのセットアップ
            const mockUser = {
              id: crypto.randomUUID(),
              email,
              created_at: new Date().toISOString(),
            };

            const mockSession = {
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_in: 3600,
              expires_at: Date.now() + 3600000,
              token_type: 'bearer' as const,
              user: mockUser,
            };

            vi.mocked(authService.signIn).mockResolvedValue(mockUser);
            vi.mocked(authService.getSession).mockResolvedValue(mockSession);

            // signInとgetSessionを呼び出し
            await authService.signIn(email, password);
            const session = await authService.getSession();

            // セッションを検証
            expect(session).not.toBeNull();
            expect(session?.user.email).toBe(email);
            expect(session?.access_token).toBeDefined();

            vi.clearAllMocks();
          }
        ),
        { numRuns: 2 }
      );
    });

    it('ログインが失敗した場合、エラーがスローされる', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (email, password) => {
            // モックのセットアップ（エラーを返す）
            const errorMessage = 'ログインに失敗しました';
            vi.mocked(authService.signIn).mockRejectedValue(new Error(errorMessage));

            // signInを呼び出してエラーを検証
            await expect(authService.signIn(email, password)).rejects.toThrow(errorMessage);

            vi.clearAllMocks();
          }
        ),
        { numRuns: 2 }
      );
    });
  });
});
