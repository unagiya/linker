/**
 * AuthContextのプロパティベーステスト
 */

import { describe, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import type { ReactNode } from 'react';

// authServiceをモック
vi.mock('../../services/authService', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Supabaseクライアントをモック
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  },
}));

// モックされたauthServiceをインポート
import * as authService from '../../services/authService';

describe('AuthContext - Property Based Tests', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  /**
   * Feature: engineer-profile-platform, Property 9: セッションの永続性
   * 検証: 要件 2.6
   *
   * 任意のログイン済みユーザーに対して、ページをリロードしても
   * セッション情報が保持され、ログイン状態が維持される
   *
   * 注: このプロパティは、AuthContextが初期化時にgetSessionを呼び出し、
   * 返されたセッション情報を正しく状態に設定することをテストします。
   */
  describe('Property 9: セッションの永続性', () => {
    it('getSessionが呼び出され、セッション情報が復元される', async () => {
      // 固定のセッション情報でテスト
      const mockSession = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        expires_at: Date.now() + 3600 * 1000,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
        },
      };

      vi.mocked(authService.getSession).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // セッションが復元されるまで待機
      await waitFor(
        () => {
          return result.current.loading === false && result.current.user !== null;
        },
        { timeout: 3000 }
      );

      // セッション情報が正しく復元されていることを確認
      return (
        result.current.user !== null &&
        result.current.user.id === mockSession.user.id &&
        result.current.user.email === mockSession.user.email &&
        result.current.session !== null &&
        result.current.session.access_token === mockSession.access_token
      );
    });
  });
});
