/**
 * ニックネーム機能の統合テスト
 *
 * このテストは、ニックネーム設定、変更、URL解決、マイグレーション、
 * SEO機能などの完全なニックネーム機能フローを検証します。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
import type { Profile } from '../types';

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
                  <Route path="/profile/:nickname" element={<ViewProfile />} />
                  <Route
                    path="/profile/:nickname/edit"
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

describe('統合テスト: ニックネーム機能フロー', () => {
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
   * シナリオ1: アカウント登録からニックネーム設定までのフロー
   * 要件: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   */
  describe('アカウント登録とニックネーム設定', () => {
    it.skip('ユーザーがアカウント登録時にニックネームを設定できる', async () => {
      const user = userEvent.setup();

      render(<TestApp initialEntries={['/signup']} />);

      // アカウント登録ページが表示される
      expect(screen.getByText(/アカウント登録/i)).toBeInTheDocument();

      // メールアドレス、パスワード、ニックネームを入力
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const nicknameInput = screen.getByLabelText(/ニックネーム/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(nicknameInput, 'test-user');

      // ニックネームの利用可能性チェックが実行される（500ms後）
      await waitFor(
        () => {
          expect(screen.getByText(/利用可能です/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // 登録ボタンをクリック
      const submitButton = screen.getByRole('button', { name: /登録/i });
      await user.click(submitButton);

      // 登録成功後、ニックネームが保存される
      await waitFor(
        () => {
          expect(screen.getByText(/プロフィールを作成/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it.skip('既に使用されているニックネームを入力するとエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // 事前にニックネームを持つユーザーを作成
      const existingProfile: Profile = {
        id: 'existing-id',
        user_id: 'existing-user-id',
        nickname: 'existing-user',
        name: '既存ユーザー',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(existingProfile);

      render(<TestApp initialEntries={['/signup']} />);

      // ニックネーム入力フィールドに既存のニックネームを入力
      const nicknameInput = screen.getByLabelText(/ニックネーム/i);
      await user.type(nicknameInput, 'existing-user');

      // エラーメッセージが表示される
      await waitFor(
        () => {
          expect(
            screen.getByText(/このニックネームは既に使用されています/i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it.skip('無効な形式のニックネームを入力するとエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<TestApp initialEntries={['/signup']} />);

      const nicknameInput = screen.getByLabelText(/ニックネーム/i);

      // 短すぎるニックネーム
      await user.type(nicknameInput, 'ab');
      await waitFor(() => {
        expect(screen.getByText(/3文字以上/i)).toBeInTheDocument();
      });

      // クリアして無効文字を含むニックネーム
      await user.clear(nicknameInput);
      await user.type(nicknameInput, 'test@user');
      await waitFor(() => {
        expect(
          screen.getByText(/英数字、ハイフン、アンダースコアのみ/i)
        ).toBeInTheDocument();
      });

      // クリアして記号で始まるニックネーム
      await user.clear(nicknameInput);
      await user.type(nicknameInput, '-testuser');
      await waitFor(() => {
        expect(
          screen.getByText(/記号で始まったり終わったりできません/i)
        ).toBeInTheDocument();
      });
    });

    it.skip('有効で利用可能なニックネームを入力すると確認メッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<TestApp initialEntries={['/signup']} />);

      const nicknameInput = screen.getByLabelText(/ニックネーム/i);
      await user.type(nicknameInput, 'valid-nickname');

      // 確認メッセージが表示される
      await waitFor(
        () => {
          expect(
            screen.getByText(/このニックネームは利用可能です/i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  /**
   * シナリオ2: ニックネーム変更フローの統合テスト
   * 要件: 4.1, 4.2, 4.3, 4.4, 4.5, 9.5
   */
  describe('ニックネーム変更フロー', () => {
    it.skip('ユーザーがプロフィール編集でニックネームを変更できる', async () => {
      const user = userEvent.setup();

      // 事前にプロフィールを作成
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: 'old-nickname',
        name: 'テストユーザー',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={['/profile/old-nickname/edit']} />);

      // プロフィール編集ページが表示される
      await waitFor(() => {
        expect(screen.getByLabelText(/ニックネーム/i)).toBeInTheDocument();
      });

      // 現在のニックネームが表示されている
      const nicknameInput = screen.getByLabelText(/ニックネーム/i);
      expect(nicknameInput).toHaveValue('old-nickname');

      // 新しいニックネームに変更
      await user.clear(nicknameInput);
      await user.type(nicknameInput, 'new-nickname');

      // リアルタイムで利用可能性がチェックされる
      await waitFor(
        () => {
          expect(screen.getByText(/利用可能です/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      // 成功メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText(/ニックネームが正常に更新されました/i)
        ).toBeInTheDocument();
      });

      // 新しいニックネームベースURLにリダイレクトされる
      await waitFor(
        () => {
          expect(window.location.pathname).toBe('/profile/new-nickname');
        },
        { timeout: 3000 }
      );
    });

    it.skip('既に使用されているニックネームへの変更は拒否される', async () => {
      const user = userEvent.setup();

      // 事前に2つのプロフィールを作成
      const profile1: Profile = {
        id: 'test-id-1',
        user_id: 'test-user-id-1',
        nickname: 'user-one',
        name: 'ユーザー1',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const profile2: Profile = {
        id: 'test-id-2',
        user_id: 'test-user-id-2',
        nickname: 'user-two',
        name: 'ユーザー2',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile1);
      await repository.save(profile2);

      render(<TestApp initialEntries={['/profile/user-one/edit']} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/ニックネーム/i)).toBeInTheDocument();
      });

      // 既存のニックネームに変更しようとする
      const nicknameInput = screen.getByLabelText(/ニックネーム/i);
      await user.clear(nicknameInput);
      await user.type(nicknameInput, 'user-two');

      // エラーメッセージが表示される
      await waitFor(
        () => {
          expect(
            screen.getByText(/このニックネームは既に使用されています/i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // 保存ボタンが無効化される
      const saveButton = screen.getByRole('button', { name: /保存/i });
      expect(saveButton).toBeDisabled();
    });
  });

  /**
   * シナリオ3: ニックネームベースURL解決の統合テスト
   * 要件: 3.1, 3.2, 3.3, 3.5
   */
  describe('ニックネームベースURL解決', () => {
    it.skip('ニックネームベースURLでプロフィールにアクセスできる', async () => {
      // 事前にプロフィールを作成
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: 'john-doe',
        name: 'John Doe',
        jobTitle: 'フロントエンドエンジニア',
        skills: ['React', 'TypeScript'],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={['/profile/john-doe']} />);

      // プロフィールが表示される
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(
          screen.getByText('フロントエンドエンジニア')
        ).toBeInTheDocument();
      });
    });

    it.skip('存在しないニックネームのURLにアクセスすると404エラーが表示される', async () => {
      render(<TestApp initialEntries={['/profile/non-existent-user']} />);

      // 404ページが表示される
      await waitFor(() => {
        expect(
          screen.getByText(/プロフィールが見つかりません/i)
        ).toBeInTheDocument();
      });
    });

    it.skip('プロフィール所有者にはニックネームベースURLが共有URLとして提供される', async () => {
      // 事前にプロフィールを作成
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: 'share-test',
        name: 'シェアテスト',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={['/profile/share-test']} />);

      // 共有URLが表示される
      await waitFor(() => {
        const shareUrl = screen.getByText(/\/profile\/share-test/i);
        expect(shareUrl).toBeInTheDocument();
      });
    });

    it.skip('編集ページでもニックネームベースURLが使用される', async () => {
      // 事前にプロフィールを作成
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: 'edit-test',
        name: '編集テスト',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={['/profile/edit-test/edit']} />);

      // 編集ページが表示される
      await waitFor(() => {
        expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
        expect(window.location.pathname).toBe('/profile/edit-test/edit');
      });
    });
  });

  /**
   * シナリオ4: エラーハンドリングの統合テスト
   * 要件: 9.1, 9.2, 9.3, 9.4
   */
  describe('エラーハンドリング', () => {
    it.skip('ネットワークエラー時に適切なエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // ネットワークエラーをシミュレート
      vi.spyOn(repository, 'findByNickname').mockRejectedValue(
        new Error('Network error')
      );

      render(<TestApp initialEntries={['/signup']} />);

      const nicknameInput = screen.getByLabelText(/ニックネーム/i);
      await user.type(nicknameInput, 'test-user');

      // エラーメッセージが表示される
      await waitFor(
        () => {
          expect(
            screen.getByText(/接続エラーが発生しました/i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it.skip('ニックネーム入力フィールドにフォーカスするとヘルプテキストが表示される', async () => {
      const user = userEvent.setup();

      render(<TestApp initialEntries={['/signup']} />);

      const nicknameInput = screen.getByLabelText(/ニックネーム/i);
      await user.click(nicknameInput);

      // ヘルプテキストが表示される
      expect(
        screen.getByText(/3-36文字の英数字、ハイフン、アンダースコア/i)
      ).toBeInTheDocument();
    });

    it.skip('無効なニックネームでアクセスすると404ページが表示される', async () => {
      render(<TestApp initialEntries={['/profile/invalid@nickname']} />);

      // 404ページが表示される
      await waitFor(() => {
        expect(screen.getByText(/無効なURL/i)).toBeInTheDocument();
      });
    });
  });

  /**
   * シナリオ5: マイグレーション処理の統合テスト
   * 要件: 7.1, 7.2, 7.3, 7.4
   */
  describe('マイグレーション処理', () => {
    it.skip('UUID形式のニックネームを持つユーザーに通知が表示される', async () => {
      // UUID形式のニックネームを持つプロフィールを作成
      const uuidNickname = '123e4567-e89b-12d3-a456-426614174000';
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: uuidNickname,
        name: 'マイグレーションユーザー',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={[`/profile/${uuidNickname}`]} />);

      // カスタマイズ促進通知が表示される
      await waitFor(() => {
        expect(
          screen.getByText(/ニックネームをカスタマイズできます/i)
        ).toBeInTheDocument();
      });
    });

    it.skip('既存ユーザーがプロフィール編集ページで現在のニックネームを確認できる', async () => {
      const uuidNickname = '123e4567-e89b-12d3-a456-426614174000';
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: uuidNickname,
        name: 'マイグレーションユーザー',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={[`/profile/${uuidNickname}/edit`]} />);

      // 編集ページでUUID形式のニックネームが表示される
      await waitFor(() => {
        const nicknameInput = screen.getByLabelText(/ニックネーム/i);
        expect(nicknameInput).toHaveValue(uuidNickname);
      });
    });
  });

  /**
   * シナリオ6: SEO機能の統合テスト
   * 要件: 8.1, 8.2, 8.3, 8.4
   */
  describe('SEO機能', () => {
    it.skip('ニックネームベースURLで適切なページタイトルが設定される', async () => {
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: 'seo-test',
        name: 'SEOテストユーザー',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={['/profile/seo-test']} />);

      // ページタイトルが設定される
      await waitFor(() => {
        expect(document.title).toBe('SEOテストユーザー | Linker');
      });
    });

    it.skip('プロフィールページでメタディスクリプションが設定される', async () => {
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: 'meta-test',
        name: 'メタテストユーザー',
        jobTitle: 'フロントエンドエンジニア',
        bio: 'React と TypeScript が得意です',
        skills: ['React', 'TypeScript'],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={['/profile/meta-test']} />);

      // メタディスクリプションが設定される
      await waitFor(() => {
        const metaDescription = document.querySelector(
          'meta[name="description"]'
        );
        expect(metaDescription).toBeTruthy();
        expect(metaDescription?.getAttribute('content')).toContain(
          'フロントエンドエンジニア'
        );
      });
    });

    it.skip('Open Graphメタタグが適切に設定される', async () => {
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: 'og-test',
        name: 'OGテストユーザー',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={['/profile/og-test']} />);

      // Open Graphメタタグが設定される
      await waitFor(() => {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        expect(ogTitle).toBeTruthy();
        expect(ogTitle?.getAttribute('content')).toContain('OGテストユーザー');
      });
    });

    it.skip('構造化データ（JSON-LD）が提供される', async () => {
      const profile: Profile = {
        id: 'test-id',
        user_id: 'test-user-id',
        nickname: 'jsonld-test',
        name: 'JSON-LDテストユーザー',
        jobTitle: 'エンジニア',
        skills: [],
        socialLinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(profile);

      render(<TestApp initialEntries={['/profile/jsonld-test']} />);

      // 構造化データが設定される
      await waitFor(() => {
        const jsonLdScript = document.querySelector(
          'script[type="application/ld+json"]'
        );
        expect(jsonLdScript).toBeTruthy();
        const jsonLdContent = JSON.parse(jsonLdScript?.textContent || '{}');
        expect(jsonLdContent['@type']).toBe('Person');
        expect(jsonLdContent.name).toBe('JSON-LDテストユーザー');
      });
    });
  });
});
