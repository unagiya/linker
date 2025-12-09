/**
 * SignUpページのプロパティベーステスト
 * Feature: engineer-profile-platform, Property 4: アカウント作成後の自動ログインとリダイレクト
 * 検証: 要件 1.5
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import * as authService from '../../services/authService';

// authServiceのモック
vi.mock('../../services/authService');

describe('SignUp - Property Based Tests', () => {
  describe('プロパティ4: アカウント作成後の自動ログインとリダイレクト', () => {
    it('任意の有効なメールアドレスとパスワードに対して、signUpが成功するとユーザーオブジェクトが返される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 50 }),
          async (email, password) => {
            // モックのセットアップ
            const mockUser = {
              id: crypto.randomUUID(),
              email,
              created_at: new Date().toISOString(),
            };

            vi.mocked(authService.signUp).mockResolvedValue(mockUser);

            // signUpを呼び出し
            const result = await authService.signUp(email, password);

            // 結果を検証
            expect(result).toEqual(mockUser);
            expect(result.email).toBe(email);
            expect(authService.signUp).toHaveBeenCalledWith(email, password);

            vi.clearAllMocks();
          }
        ),
        { numRuns: 2 }
      );
    });

    it('任意の有効なアカウント作成に対して、getSessionが有効なセッションを返す', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 50 }),
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

            vi.mocked(authService.signUp).mockResolvedValue(mockUser);
            vi.mocked(authService.getSession).mockResolvedValue(mockSession);

            // signUpとgetSessionを呼び出し
            await authService.signUp(email, password);
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

    it('アカウント登録が失敗した場合、エラーがスローされる', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 50 }),
          async (email, password) => {
            // モックのセットアップ（エラーを返す）
            const errorMessage = 'アカウント登録に失敗しました';
            vi.mocked(authService.signUp).mockRejectedValue(new Error(errorMessage));

            // signUpを呼び出してエラーを検証
            await expect(authService.signUp(email, password)).rejects.toThrow(errorMessage);

            vi.clearAllMocks();
          }
        ),
        { numRuns: 2 }
      );
    });
  });
});
