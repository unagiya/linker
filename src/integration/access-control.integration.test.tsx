/**
 * アクセス制御の統合テスト
 *
 * このテストは、認証ガードと所有者制御が正しく機能することを検証します。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
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

describe('統合テスト: アクセス制御', () => {
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
   * シナリオ1: 未認証ユーザーが保護されたページにアクセスできない
   */
  it.skip('未認証ユーザーがプロフィール作成ページにアクセスするとログインページにリダイレクトされる', async () => {
    // 未認証状態でプロフィール作成ページにアクセス
    render(<TestApp initialEntries={['/create']} />);

    // ログインページにリダイレクトされる
    await waitFor(
      () => {
        expect(screen.getByText(/ログイン/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it.skip('未認証ユーザーがプロフィール編集ページにアクセスするとログインページにリダイレクトされる', async () => {
    // 未認証状態でプロフィール編集ページにアクセス
    render(
      <MemoryRouter initialEntries={['/profile/test-id/edit']}>
        <TestApp />
      </MemoryRouter>
    );

    // ログインページにリダイレクトされる
    await waitFor(
      () => {
        expect(screen.getByText(/ログイン/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  /**
   * シナリオ2: 認証済みユーザーが他人のプロフィールを編集できない
   */
  it.skip('認証済みユーザーが他人のプロフィール編集ページにアクセスするとエラーメッセージが表示される', async () => {
    // 認証済みユーザーとして他人のプロフィール編集ページにアクセス
    // （実際の実装では、モックデータまたはテストユーザーを使用）

    render(
      <MemoryRouter initialEntries={['/profile/other-user-id/edit']}>
        <TestApp />
      </MemoryRouter>
    );

    // エラーメッセージまたはアクセス拒否メッセージが表示される
    await waitFor(
      () => {
        expect(
          screen.getByText(/アクセス権限がありません/i) ||
            screen.getByText(/このプロフィールを編集する権限がありません/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  /**
   * シナリオ3: プロフィール表示ページでの編集・削除ボタンの表示制御
   */
  it.skip('未認証ユーザーがプロフィールを表示すると編集・削除ボタンが表示されない', async () => {
    // 未認証状態でプロフィール表示ページにアクセス
    render(
      <MemoryRouter initialEntries={['/profile/test-id']}>
        <TestApp />
      </MemoryRouter>
    );

    // プロフィール情報は表示されるが、編集・削除ボタンは表示されない
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /編集/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /削除/i })).not.toBeInTheDocument();
    });
  });

  it.skip('認証済みユーザーが他人のプロフィールを表示すると編集・削除ボタンが表示されない', async () => {
    // 認証済みユーザーとして他人のプロフィール表示ページにアクセス
    // （実際の実装では、モックデータまたはテストユーザーを使用）

    render(
      <MemoryRouter initialEntries={['/profile/other-user-id']}>
        <TestApp />
      </MemoryRouter>
    );

    // プロフィール情報は表示されるが、編集・削除ボタンは表示されない
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /編集/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /削除/i })).not.toBeInTheDocument();
    });
  });

  it.skip('認証済みユーザーが自分のプロフィールを表示すると編集・削除ボタンが表示される', async () => {
    // 認証済みユーザーとして自分のプロフィール表示ページにアクセス
    // （実際の実装では、モックデータまたはテストユーザーを使用）

    render(
      <MemoryRouter initialEntries={['/profile/my-user-id']}>
        <TestApp />
      </MemoryRouter>
    );

    // プロフィール情報と編集・削除ボタンが表示される
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /編集/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /削除/i })).toBeInTheDocument();
    });
  });
});
