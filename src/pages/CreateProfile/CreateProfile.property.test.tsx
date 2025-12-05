/**
 * CreateProfileページのプロパティベーステスト
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as fc from "fast-check";
import { CreateProfile } from "./CreateProfile";
import type { User } from "../../types/auth";

// useAuthとuseProfileをモック
vi.mock("../../contexts/AuthContext/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../contexts/ProfileContext/ProfileContext", () => ({
  useProfile: vi.fn(),
}));

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

describe("CreateProfile - Property Based Tests", () => {
  /**
   * Feature: engineer-profile-platform, Property 11: 認証済みユーザーのプロフィール作成ページへのアクセス
   * 任意のログイン済みユーザーに対して、プロフィール作成ページにアクセスすると、
   * プロフィール入力フォームが表示される
   * Validates: Requirements 3.2
   */
  describe("Property 11: 認証済みユーザーのプロフィール作成ページへのアクセス", () => {
    it("任意のログイン済みユーザーがアクセスすると、プロフィール入力フォームが表示される", async () => {
      const { useAuth } = await import("../../contexts/AuthContext/AuthContext");
      const { useProfile } = await import("../../contexts/ProfileContext/ProfileContext");

      fc.assert(
        fc.property(
          fc.uuid(), // ユーザーID
          fc.emailAddress(), // メールアドレス
          (userId, email) => {
            cleanup(); // 各反復前にクリーンアップ

            // モックユーザー
            const mockUser: User = {
              id: userId,
              email,
              app_metadata: {},
              user_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
            };

            // useAuthのモック
            vi.mocked(useAuth).mockReturnValue({
              user: mockUser,
              session: null,
              loading: false,
              error: null,
              signUp: vi.fn(),
              signIn: vi.fn(),
              signOut: vi.fn(),
              clearError: vi.fn(),
            });

            // useProfileのモック
            vi.mocked(useProfile).mockReturnValue({
              profile: null,
              loading: false,
              error: null,
              createProfile: vi.fn(),
              updateProfile: vi.fn(),
              deleteProfile: vi.fn(),
              loadProfile: vi.fn(),
              loadMyProfile: vi.fn(),
              clearError: vi.fn(),
            });

            render(
              <MemoryRouter>
                <CreateProfile />
              </MemoryRouter>
            );

            // プロフィール入力フォームが表示されることを確認
            expect(screen.getByText("プロフィール作成")).toBeInTheDocument();
            expect(screen.getByLabelText(/名前/)).toBeInTheDocument();
            expect(screen.getByLabelText(/職種/)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: engineer-profile-platform, Property 12: 有効なプロフィールデータの保存
   * 任意の有効なプロフィールデータ（名前と職種が非空）に対して、
   * プロフィールを作成すると、Supabaseデータベースに保存される
   * Validates: Requirements 3.3
   */
  describe("Property 12: 有効なプロフィールデータの保存", () => {
    it("任意の有効なプロフィールデータでフォームを送信すると、createProfileが呼ばれる", async () => {
      const { useAuth } = await import("../../contexts/AuthContext/AuthContext");
      const { useProfile } = await import("../../contexts/ProfileContext/ProfileContext");
      const { fireEvent, waitFor } = await import("@testing-library/react");

      fc.assert(
        fc.asyncProperty(
          fc.uuid(), // ユーザーID
          fc.emailAddress(), // メールアドレス
          fc.string({ minLength: 1, maxLength: 100 }), // 名前
          fc.string({ minLength: 1, maxLength: 100 }), // 職種
          async (userId, email, name, jobTitle) => {
            cleanup(); // 各反復前にクリーンアップ

            const mockUser: User = {
              id: userId,
              email,
              app_metadata: {},
              user_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
            };

            const mockCreateProfile = vi.fn().mockResolvedValue({
              id: "profile-id",
              user_id: userId,
              name,
              jobTitle,
              skills: [],
              socialLinks: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            vi.mocked(useAuth).mockReturnValue({
              user: mockUser,
              session: null,
              loading: false,
              error: null,
              signUp: vi.fn(),
              signIn: vi.fn(),
              signOut: vi.fn(),
              clearError: vi.fn(),
            });

            vi.mocked(useProfile).mockReturnValue({
              profile: null,
              loading: false,
              error: null,
              createProfile: mockCreateProfile,
              updateProfile: vi.fn(),
              deleteProfile: vi.fn(),
              loadProfile: vi.fn(),
              loadMyProfile: vi.fn(),
              clearError: vi.fn(),
            });

            render(
              <MemoryRouter>
                <CreateProfile />
              </MemoryRouter>
            );

            // フォームに入力
            const nameInput = screen.getByLabelText(/名前/);
            const jobTitleInput = screen.getByLabelText(/職種/);
            const submitButton = screen.getByRole("button", { name: "保存" });

            fireEvent.change(nameInput, { target: { value: name } });
            fireEvent.change(jobTitleInput, { target: { value: jobTitle } });
            fireEvent.click(submitButton);

            // createProfileが呼ばれることを確認
            await waitFor(() => {
              expect(mockCreateProfile).toHaveBeenCalledWith(
                userId,
                expect.objectContaining({
                  name,
                  jobTitle,
                })
              );
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Feature: engineer-profile-platform, Property 13: プロフィールと所有者の紐付け
   * 任意のプロフィール作成に対して、ログイン中のユーザーIDがプロフィールの所有者として記録される
   * Validates: Requirements 3.4, 11.1
   */
  describe("Property 13: プロフィールと所有者の紐付け", () => {
    it("プロフィール作成時、ログイン中のユーザーIDが渡される", async () => {
      const { useAuth } = await import("../../contexts/AuthContext/AuthContext");
      const { useProfile } = await import("../../contexts/ProfileContext/ProfileContext");
      const { fireEvent, waitFor } = await import("@testing-library/react");

      fc.assert(
        fc.asyncProperty(
          fc.uuid(), // ユーザーID
          fc.emailAddress(), // メールアドレス
          async (userId, email) => {
            cleanup(); // 各反復前にクリーンアップ

            const mockUser: User = {
              id: userId,
              email,
              app_metadata: {},
              user_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
            };

            const mockCreateProfile = vi.fn().mockResolvedValue({
              id: "profile-id",
              user_id: userId,
              name: "テスト",
              jobTitle: "エンジニア",
              skills: [],
              socialLinks: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            vi.mocked(useAuth).mockReturnValue({
              user: mockUser,
              session: null,
              loading: false,
              error: null,
              signUp: vi.fn(),
              signIn: vi.fn(),
              signOut: vi.fn(),
              clearError: vi.fn(),
            });

            vi.mocked(useProfile).mockReturnValue({
              profile: null,
              loading: false,
              error: null,
              createProfile: mockCreateProfile,
              updateProfile: vi.fn(),
              deleteProfile: vi.fn(),
              loadProfile: vi.fn(),
              loadMyProfile: vi.fn(),
              clearError: vi.fn(),
            });

            render(
              <MemoryRouter>
                <CreateProfile />
              </MemoryRouter>
            );

            // フォームに入力して送信
            const nameInput = screen.getByLabelText(/名前/);
            const jobTitleInput = screen.getByLabelText(/職種/);
            const submitButton = screen.getByRole("button", { name: "保存" });

            fireEvent.change(nameInput, { target: { value: "テスト" } });
            fireEvent.change(jobTitleInput, { target: { value: "エンジニア" } });
            fireEvent.click(submitButton);

            // createProfileが正しいユーザーIDで呼ばれることを確認
            await waitFor(() => {
              expect(mockCreateProfile).toHaveBeenCalledWith(userId, expect.any(Object));
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
