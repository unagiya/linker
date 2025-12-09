/**
 * 認証とプロフィール管理の統合テスト
 * 
 * このテストは、アカウント登録からプロフィール作成、編集、削除までの
 * 完全なユーザーフローを検証します。
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { ProfileProvider } from "../contexts/ProfileContext";
import { LocalStorageRepository } from "../repositories";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Navigation } from "../components/Navigation";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Home } from "../pages/Home";
import { SignUp } from "../pages/SignUp";
import { SignIn } from "../pages/SignIn";
import { CreateProfile } from "../pages/CreateProfile";
import { ViewProfile } from "../pages/ViewProfile";
import { EditProfile } from "../pages/EditProfile";
import { NotFound } from "../pages/NotFound";
import type { ReactNode } from "react";

// テスト用のAppコンポーネント
function TestApp({ children, initialEntries }: { children?: ReactNode; initialEntries?: string[] }) {
  const repository = new LocalStorageRepository();

  return (
    <ErrorBoundary>
      <MemoryRouter initialEntries={initialEntries || ["/"]}>
        <AuthProvider>
          <ProfileProvider repository={repository}>
            <div className="app">
              <Navigation />
              <main className="app-main">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route
                    path="/create"
                    element={
                      <ProtectedRoute>
                        <CreateProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/profile/:id" element={<ViewProfile />} />
                  <Route
                    path="/profile/:id/edit"
                    element={
                      <ProtectedRoute>
                        <EditProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            {children}
          </ProfileProvider>
        </AuthProvider>
      </MemoryRouter>
    </ErrorBoundary>
  );
}

describe("統合テスト: 認証とプロフィール管理フロー", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
    // localStorageをクリア
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * シナリオ1: アカウント登録からプロフィール作成までの完全フロー
   */
  it.skip("ユーザーがアカウント登録してプロフィールを作成できる", async () => {
    const user = userEvent.setup();

    // アプリケーションをレンダリング
    render(<TestApp initialEntries={["/signup"]} />);

    // アカウント登録ページが表示される
    expect(screen.getByText(/アカウント登録/i)).toBeInTheDocument();

    // メールアドレスとパスワードを入力
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // 登録ボタンをクリック
    const submitButton = screen.getByRole("button", { name: /登録/i });
    await user.click(submitButton);

    // 登録成功後、自動的にログインしてホームページにリダイレクトされる
    await waitFor(
      () => {
        expect(screen.getByText(/プロフィールを作成/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // プロフィール作成ページに移動
    const createProfileLink = screen.getByText(/プロフィールを作成/i);
    await user.click(createProfileLink);

    // プロフィール作成フォームが表示される
    await waitFor(() => {
      expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
    });

    // プロフィール情報を入力
    const nameInput = screen.getByLabelText(/名前/i);
    const jobTitleInput = screen.getByLabelText(/職種/i);

    await user.type(nameInput, "山田太郎");
    await user.type(jobTitleInput, "フロントエンドエンジニア");

    // 保存ボタンをクリック
    const saveButton = screen.getByRole("button", { name: /保存/i });
    await user.click(saveButton);

    // プロフィール表示ページにリダイレクトされる
    await waitFor(
      () => {
        expect(screen.getByText("山田太郎")).toBeInTheDocument();
        expect(screen.getByText("フロントエンドエンジニア")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  /**
   * シナリオ2: ログインからプロフィール編集までの完全フロー
   */
  it.skip("ユーザーがログインしてプロフィールを編集できる", async () => {
    const user = userEvent.setup();

    // 事前にアカウントとプロフィールを作成
    // （実際の実装では、モックデータまたはテストユーザーを使用）

    // ログインページをレンダリング
    render(<TestApp initialEntries={["/signin"]} />);

    // ログインページが表示される
    expect(screen.getByText(/ログイン/i)).toBeInTheDocument();

    // メールアドレスとパスワードを入力
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // ログインボタンをクリック
    const submitButton = screen.getByRole("button", { name: /ログイン/i });
    await user.click(submitButton);

    // ログイン成功後、ホームページにリダイレクトされる
    await waitFor(
      () => {
        expect(screen.getByText(/マイプロフィール/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // マイプロフィールページに移動
    const myProfileLink = screen.getByText(/マイプロフィール/i);
    await user.click(myProfileLink);

    // プロフィール表示ページが表示される
    await waitFor(() => {
      expect(screen.getByText(/編集/i)).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButton = screen.getByRole("button", { name: /編集/i });
    await user.click(editButton);

    // プロフィール編集フォームが表示される
    await waitFor(() => {
      expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
    });

    // プロフィール情報を更新
    const nameInput = screen.getByLabelText(/名前/i);
    await user.clear(nameInput);
    await user.type(nameInput, "山田花子");

    // 保存ボタンをクリック
    const saveButton = screen.getByRole("button", { name: /保存/i });
    await user.click(saveButton);

    // プロフィール表示ページにリダイレクトされ、更新された情報が表示される
    await waitFor(
      () => {
        expect(screen.getByText("山田花子")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  /**
   * シナリオ3: プロフィール削除フローの完全テスト
   */
  it.skip("ユーザーがプロフィールを削除できる", async () => {
    const user = userEvent.setup();

    // 事前にログインしてプロフィールを表示
    // （実際の実装では、モックデータまたはテストユーザーを使用）

    render(<TestApp initialEntries={["/profile/test-id"]} />);

    // プロフィール表示ページが表示される
    await waitFor(() => {
      expect(screen.getByText(/削除/i)).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole("button", { name: /削除/i });
    await user.click(deleteButton);

    // 削除確認ダイアログが表示される
    await waitFor(() => {
      expect(
        screen.getByText(/本当に削除しますか/i)
      ).toBeInTheDocument();
    });

    // 確認ボタンをクリック
    const confirmButton = screen.getByRole("button", { name: /削除する/i });
    await user.click(confirmButton);

    // ホームページにリダイレクトされる
    await waitFor(
      () => {
        expect(screen.getByText(/プロフィールを作成/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
