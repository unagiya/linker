/**
 * 認証サービスのユニットテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp, signIn, signOut, getSession, getCurrentUser } from './authService';

// Supabaseクライアントをモック
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

// モックされたsupabaseをインポート
import { supabase } from '../lib/supabase';

describe('authService', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('有効なメールアドレスとパスワードでアカウントを作成する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: mockUser,
          session: null,
        },
        error: null,
      });

      const result = await signUp('test@example.com', 'password123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('エラーが発生した場合、エラーをスローする', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: {
          message: 'Invalid email',
          name: 'AuthError',
          status: 400,
        },
      });

      await expect(signUp('invalid', 'password123')).rejects.toThrow('Invalid email');
    });

    it('ユーザーが作成されなかった場合、エラーをスローする', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: null,
      });

      await expect(signUp('test@example.com', 'password123')).rejects.toThrow(
        'ユーザーの作成に失敗しました'
      );
    });
  });

  describe('signIn', () => {
    it('正しいメールアドレスとパスワードでログインする', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockUser,
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: mockUser,
          },
        },
        error: null,
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('間違ったパスワードの場合、エラーをスローする', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: {
          message: 'Invalid login credentials',
          name: 'AuthError',
          status: 400,
        },
      });

      await expect(signIn('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid login credentials'
      );
    });

    it('ユーザーが取得できなかった場合、エラーをスローする', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: null,
      });

      await expect(signIn('test@example.com', 'password123')).rejects.toThrow(
        'ログインに失敗しました'
      );
    });
  });

  describe('signOut', () => {
    it('正常にログアウトする', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      await expect(signOut()).resolves.toBeUndefined();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('エラーが発生した場合、エラーをスローする', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: {
          message: 'Logout failed',
          name: 'AuthError',
          status: 500,
        },
      });

      await expect(signOut()).rejects.toThrow('Logout failed');
    });
  });

  describe('getSession', () => {
    it('現在のセッションを取得する', async () => {
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

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: mockSession,
        },
        error: null,
      });

      const result = await getSession();

      expect(result).toEqual({
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
      });
    });

    it('セッションが存在しない場合、nullを返す', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: null,
        },
        error: null,
      });

      const result = await getSession();

      expect(result).toBeNull();
    });

    it('エラーが発生した場合、エラーをスローする', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: null,
        },
        error: {
          message: 'Session error',
          name: 'AuthError',
          status: 500,
        },
      });

      await expect(getSession()).rejects.toThrow('Session error');
    });
  });

  describe('getCurrentUser', () => {
    it('現在のユーザーを取得する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: {
          user: mockUser,
        },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      });
    });

    it('ユーザーが存在しない場合、nullを返す', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: {
          user: null,
        },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('エラーが発生した場合、エラーをスローする', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: {
          user: null,
        },
        error: {
          message: 'User error',
          name: 'AuthError',
          status: 500,
        },
      });

      await expect(getCurrentUser()).rejects.toThrow('User error');
    });
  });
});
