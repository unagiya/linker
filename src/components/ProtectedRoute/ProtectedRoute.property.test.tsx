/**
 * ProtectedRouteコンポーネントのプロパティベーステスト
 * Feature: engineer-profile-platform, Property 10: 未認証ユーザーの保護されたページへのアクセス拒否
 * 検証: 要件 3.1
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import * as fc from "fast-check";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthContext } from "../../contexts/AuthContext/AuthContext";
import type { User } from "../../types/auth";

// react-router-domのNavigateコンポーネントをモック
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
  };
});

describe("ProtectedRoute - Property Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("プロパティ10: 未認証ユーザーの保護されたページへのアクセス拒否", () => {
    it("任意の未認証状態（user = null）に対して、ログインページにリダイレクトされる", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // 未認証状態のコンテキスト値を作成
          const mockContextValue = {
            user: null,
            session: null,
            loading: false,
            error: null,
            signUp: vi.fn(),
            signIn: vi.fn(),
            signOut: vi.fn(),
            clearError: vi.fn(),
          };

          // コンポーネントをレンダリング
          const { unmount } = render(
            <BrowserRouter>
              <AuthContext.Provider value={mockContextValue}>
                <ProtectedRoute>
                  <div data-testid="protected-content">保護されたコンテンツ</div>
                </ProtectedRoute>
              </AuthContext.Provider>
            </BrowserRouter>
          );

          // ログインページへのリダイレクトを確認
          const navigateTo = screen.getByTestId("navigate-to");
          expect(navigateTo).toHaveTextContent("/signin");

          // 保護されたコンテンツが表示されないことを確認
          expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();

          unmount();
        }),
        { numRuns: 2 }
      );
    });

    it("任意の認証済み状態（user != null）に対して、保護されたコンテンツが表示される", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            created_at: fc
              .integer({
                min: new Date("2000-01-01").getTime(),
                max: new Date("2099-12-31").getTime(),
              })
              .map((timestamp) => new Date(timestamp).toISOString()),
          }),
          async (user: User) => {
            // 認証済み状態のコンテキスト値を作成
            const mockContextValue = {
              user,
              session: {
                access_token: "mock-token",
                refresh_token: "mock-refresh",
                expires_in: 3600,
                expires_at: Date.now() + 3600000,
                token_type: "bearer" as const,
                user,
              },
              loading: false,
              error: null,
              signUp: vi.fn(),
              signIn: vi.fn(),
              signOut: vi.fn(),
              clearError: vi.fn(),
            };

            // コンポーネントをレンダリング
            const { unmount } = render(
              <BrowserRouter>
                <AuthContext.Provider value={mockContextValue}>
                  <ProtectedRoute>
                    <div data-testid="protected-content">保護されたコンテンツ</div>
                  </ProtectedRoute>
                </AuthContext.Provider>
              </BrowserRouter>
            );

            // 保護されたコンテンツが表示されることを確認
            expect(screen.getByTestId("protected-content")).toBeInTheDocument();

            // リダイレクトされないことを確認
            expect(screen.queryByTestId("navigate-to")).not.toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 2 }
      );
    });

    it("ローディング中は、スピナーが表示される", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(true), async () => {
          // ローディング中のコンテキスト値を作成
          const mockContextValue = {
            user: null,
            session: null,
            loading: true,
            error: null,
            signUp: vi.fn(),
            signIn: vi.fn(),
            signOut: vi.fn(),
            clearError: vi.fn(),
          };

          // コンポーネントをレンダリング
          const { unmount } = render(
            <BrowserRouter>
              <AuthContext.Provider value={mockContextValue}>
                <ProtectedRoute>
                  <div data-testid="protected-content">保護されたコンテンツ</div>
                </ProtectedRoute>
              </AuthContext.Provider>
            </BrowserRouter>
          );

          // スピナーが表示されることを確認
          expect(screen.getByRole("status")).toBeInTheDocument();

          // 保護されたコンテンツが表示されないことを確認
          expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();

          // リダイレクトされないことを確認
          expect(screen.queryByTestId("navigate-to")).not.toBeInTheDocument();

          unmount();
        }),
        { numRuns: 2 }
      );
    });
  });
});
