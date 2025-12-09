/**
 * 認証サービスのプロパティベーステスト
 */

import { describe, it, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { signUp, signIn } from "./authService";

// Supabaseクライアントをモック
vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

// モックされたsupabaseをインポート
import { supabase } from "../lib/supabase";

describe("authService - Property Based Tests", () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
  });

  /**
   * Feature: engineer-profile-platform, Property 1: 有効な認証情報でのアカウント作成
   * 検証: 要件 1.2
   *
   * 任意の有効なメールアドレスとパスワード（6文字以上）に対して、
   * アカウント登録を行うと、Supabase Authに新しいアカウントが作成される
   */
  describe("Property 1: 有効な認証情報でのアカウント作成", () => {
    it("有効なメールアドレスとパスワード（6文字以上）でアカウントが作成される", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 50 }),
          async (email, password) => {
            // 各反復でモックをリセット
            vi.clearAllMocks();

            // モックの設定
            const mockUser = {
              id: "user-123",
              email,
              created_at: "2024-01-01T00:00:00Z",
            };

            vi.mocked(supabase.auth.signUp).mockResolvedValue({
              data: {
                user: mockUser,
                session: null,
              },
              error: null,
            });

            // アカウント作成を実行
            const result = await signUp(email, password);

            // 結果の検証
            const hasValidId = typeof result.id === "string" && result.id.length > 0;
            const hasValidEmail = result.email === email;
            const hasCreatedAt =
              typeof result.created_at === "string" && result.created_at.length > 0;

            // signUpが正しい引数で呼ばれたことを確認
            const callCount = vi.mocked(supabase.auth.signUp).mock.calls.length;
            const wasCalledCorrectly =
              callCount === 1 &&
              vi.mocked(supabase.auth.signUp).mock.calls[0][0].email === email &&
              vi.mocked(supabase.auth.signUp).mock.calls[0][0].password === password;

            return hasValidId && hasValidEmail && hasCreatedAt && wasCalledCorrectly;
          }
        ),
        { numRuns: 2 }
      );
    });
  });

  /**
   * Feature: engineer-profile-platform, Property 5: 正しい認証情報でのログイン
   * 検証: 要件 2.2
   *
   * 任意の正しいメールアドレスとパスワードに対して、
   * ログインが成功し、セッションが確立される
   */
  describe("Property 5: 正しい認証情報でのログイン", () => {
    it("正しいメールアドレスとパスワードでログインが成功する", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 50 }),
          async (email, password) => {
            // 各反復でモックをリセット
            vi.clearAllMocks();

            // モックの設定
            const mockUser = {
              id: "user-123",
              email,
              created_at: "2024-01-01T00:00:00Z",
            };

            vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
              data: {
                user: mockUser,
                session: {
                  access_token: "token",
                  refresh_token: "refresh",
                  expires_in: 3600,
                  token_type: "bearer",
                  user: mockUser,
                },
              },
              error: null,
            });

            // ログインを実行
            const result = await signIn(email, password);

            // 結果の検証
            const hasValidId = typeof result.id === "string" && result.id.length > 0;
            const hasValidEmail = result.email === email;
            const hasCreatedAt =
              typeof result.created_at === "string" && result.created_at.length > 0;

            // signInWithPasswordが正しい引数で呼ばれたことを確認
            const callCount = vi.mocked(supabase.auth.signInWithPassword).mock.calls.length;
            const wasCalledCorrectly =
              callCount === 1 &&
              vi.mocked(supabase.auth.signInWithPassword).mock.calls[0][0].email ===
                email &&
              vi.mocked(supabase.auth.signInWithPassword).mock.calls[0][0].password ===
                password;

            return hasValidId && hasValidEmail && hasCreatedAt && wasCalledCorrectly;
          }
        ),
        { numRuns: 2 }
      );
    });
  });

  /**
   * Feature: engineer-profile-platform, Property 6: 間違った認証情報の拒否
   * 検証: 要件 2.3
   *
   * 任意の間違ったメールアドレスまたはパスワードに対して、
   * ログインは失敗し、エラーメッセージが表示される
   */
  describe("Property 6: 間違った認証情報の拒否", () => {
    it("間違った認証情報でログインが失敗する", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (email, password) => {
            // モックの設定（エラーを返す）
            vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
              data: {
                user: null,
                session: null,
              },
              error: {
                message: "Invalid login credentials",
                name: "AuthError",
                status: 400,
              },
            });

            // ログインを実行してエラーが発生することを確認
            try {
              await signIn(email, password);
              // エラーが発生しなかった場合は失敗
              return false;
            } catch (error) {
              // エラーが発生したことを確認
              const isError = error instanceof Error;
              const hasErrorMessage =
                isError && error.message === "Invalid login credentials";

              return isError && hasErrorMessage;
            }
          }
        ),
        { numRuns: 2 }
      );
    });
  });
});
