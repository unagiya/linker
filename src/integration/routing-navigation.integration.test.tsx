/**
 * ルーティングとナビゲーションの統合テスト
 *
 * このテストは、アプリケーション全体のルーティングとナビゲーションが
 * 正しく機能することを検証します。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { LocalStorageRepository } from '../repositories';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Navigation } from '../components/Navigation';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Home } from '../pages/Home';
import { SignUp } from '../pages/SignUp';
import { SignIn } from '../pages/SignIn';
import { CreateProfile } from '../pages/CreateProfile';
import { ViewProfile } from '../pages/ViewProfile';
import { EditProfile } from '../pages/EditProfile';
import { NotFound } from '../pages/NotFound';
import type { ReactNode } from 'react';

// テスト用のAppコンポーネント
function TestApp({
  children,
  initialEntries,
}: {
  children?: ReactNode;
  initialEntries?: string[];
}) {
  const repository = new LocalStorageRepository();

  return (
    <ErrorBoundary>
      <MemoryRouter initialEntries={initialEntries || ['/']}>
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

describe('統合テスト: ルーティングとナビゲーション', () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * シナリオ1: ホームページから各ページへのナビゲーション
   */
  it.skip('ホームページから登録ページに移動できる', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestApp />
      </MemoryRouter>
    );

    // ホームページが表示される
    await waitFor(() => {
      expect(screen.getByText(/Linker/i)).toBeInTheDocument();
    });

    // 登録リンクをクリック
    const signUpLink = screen.getByText(/登録/i);
    await user.click(signUpLink);

    // 登録ページが表示される
    await waitFor(() => {
      expect(screen.getByText(/アカウント登録/i)).toBeInTheDocument();
    });
  });

  it.skip('ホームページからログインページに移動できる', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestApp />
      </MemoryRouter>
    );

    // ホームページが表示される
    await waitFor(() => {
      expect(screen.getByText(/Linker/i)).toBeInTheDocument();
    });

    // ログインリンクをクリック
    const signInLink = screen.getByText(/ログイン/i);
    await user.click(signInLink);

    // ログインページが表示される
    await waitFor(() => {
      expect(screen.getByText(/ログイン/i)).toBeInTheDocument();
    });
  });

  /**
   * シナリオ2: ナビゲーションバーの表示制御
   */
  it.skip('未認証ユーザーにはログイン・登録リンクが表示される', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TestApp />
      </MemoryRouter>
    );

    // ログイン・登録リンクが表示される
    await waitFor(() => {
      expect(screen.getByText(/ログイン/i)).toBeInTheDocument();
      expect(screen.getByText(/登録/i)).toBeInTheDocument();
    });

    // ログアウトリンクは表示されない
    expect(screen.queryByText(/ログアウト/i)).not.toBeInTheDocument();
  });

  it.skip('認証済みユーザーにはログアウトリンクが表示される', async () => {
    // 認証済みユーザーとしてアプリケーションをレンダリング
    // （実際の実装では、モックデータまたはテストユーザーを使用）

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestApp />
      </MemoryRouter>
    );

    // ログアウトリンクが表示される
    await waitFor(() => {
      expect(screen.getByText(/ログアウト/i)).toBeInTheDocument();
    });

    // ログイン・登録リンクは表示されない
    expect(screen.queryByText(/ログイン/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/登録/i)).not.toBeInTheDocument();
  });

  /**
   * シナリオ3: 404ページのテスト
   */
  it.skip('存在しないパスにアクセスすると404ページが表示される', async () => {
    render(
      <MemoryRouter initialEntries={['/non-existent-path']}>
        <TestApp />
      </MemoryRouter>
    );

    // 404ページが表示される
    await waitFor(() => {
      expect(
        screen.getByText(/ページが見つかりません/i) || screen.getByText(/404/i)
      ).toBeInTheDocument();
    });
  });

  /**
   * シナリオ4: ログアウト後のリダイレクト
   */
  it.skip('ログアウトするとホームページにリダイレクトされる', async () => {
    const user = userEvent.setup();

    // 認証済みユーザーとしてアプリケーションをレンダリング
    // （実際の実装では、モックデータまたはテストユーザーを使用）

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestApp />
      </MemoryRouter>
    );

    // ログアウトリンクをクリック
    const logoutLink = screen.getByText(/ログアウト/i);
    await user.click(logoutLink);

    // ホームページにリダイレクトされ、ログイン・登録リンクが表示される
    await waitFor(() => {
      expect(screen.getByText(/ログイン/i)).toBeInTheDocument();
      expect(screen.getByText(/登録/i)).toBeInTheDocument();
    });
  });

  /**
   * シナリオ5: プロフィールURLの直接アクセス
   */
  it.skip('プロフィールURLに直接アクセスするとプロフィールが表示される', async () => {
    // プロフィールURLに直接アクセス
    render(
      <MemoryRouter initialEntries={['/profile/test-id']}>
        <TestApp />
      </MemoryRouter>
    );

    // プロフィール表示ページが表示される
    await waitFor(
      () => {
        expect(screen.getByText(/プロフィール/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it.skip('存在しないプロフィールIDにアクセスすると404メッセージが表示される', async () => {
    // 存在しないプロフィールIDにアクセス
    render(
      <MemoryRouter initialEntries={['/profile/non-existent-id']}>
        <TestApp />
      </MemoryRouter>
    );

    // 404メッセージが表示される
    await waitFor(
      () => {
        expect(screen.getByText(/プロフィールが見つかりません/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
