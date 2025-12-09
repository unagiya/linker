/**
 * AuthContextのユニットテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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
import { supabase } from '../../lib/supabase';

describe('AuthContext', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('初期化', () => {
    it('初期状態ではloadingがtrueである', () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('セッションが存在する場合、ユーザー情報を設定する', async () => {
      const mockSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        expires_at: 1234567890,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(authService.getSession).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.session).toEqual(mockSession);
    });

    it('セッションが存在しない場合、userとsessionがnullである', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('onAuthStateChangeが呼ばれる', () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);

      renderHook(() => useAuth(), { wrapper });

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('signUp', () => {
    it('アカウント登録が成功する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        expires_at: 1234567890,
        token_type: 'bearer',
        user: mockUser,
      };

      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signUp).mockResolvedValue(mockUser);
      vi.mocked(authService.getSession).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();
    });

    it('アカウント登録が失敗した場合、エラーを設定する', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signUp).mockRejectedValue(new Error('登録エラー'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.signUp('test@example.com', 'password123');
        } catch (_error) {
          expect(_error).toBeDefined();
          // エラーが発生することを期待
          expect(_error).toBeDefined();
        }
      });

      expect(result.current.error).toBe('登録エラー');
      expect(result.current.user).toBeNull();
    });
  });

  describe('signIn', () => {
    it('ログインが成功する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        expires_at: 1234567890,
        token_type: 'bearer',
        user: mockUser,
      };

      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signIn).mockResolvedValue(mockUser);
      vi.mocked(authService.getSession).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();
    });

    it('ログインが失敗した場合、エラーを設定する', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signIn).mockRejectedValue(new Error('ログインエラー'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'password123');
        } catch (_error) {
          expect(_error).toBeDefined();
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe('ログインエラー');
      expect(result.current.user).toBeNull();
    });
  });

  describe('signOut', () => {
    it('ログアウトが成功する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        expires_at: 1234567890,
        token_type: 'bearer',
        user: mockUser,
      };

      vi.mocked(authService.getSession).mockResolvedValue(mockSession);
      vi.mocked(authService.signOut).mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('ログアウトが失敗した場合、エラーを設定する', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signOut).mockRejectedValue(new Error('ログアウトエラー'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (_error) {
          expect(_error).toBeDefined();
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe('ログアウトエラー');
    });
  });

  describe('clearError', () => {
    it('エラーをクリアする', async () => {
      vi.mocked(authService.getSession).mockResolvedValue(null);
      vi.mocked(authService.signIn).mockRejectedValue(new Error('ログインエラー'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // エラーを発生させる
      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'password123');
        } catch (_error) {
          expect(_error).toBeDefined();
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe('ログインエラー');

      // エラーをクリア
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('useAuth', () => {
    it('AuthProvider外で使用するとエラーをスローする', () => {
      // エラーをキャッチするためにconsole.errorをモック
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuthはAuthProvider内で使用する必要があります');

      consoleError.mockRestore();
    });
  });
});
