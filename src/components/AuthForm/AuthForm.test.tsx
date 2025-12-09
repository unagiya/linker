/**
 * AuthFormコンポーネントのユニットテスト
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from './AuthForm';

describe('AuthForm', () => {
  describe('signup モード', () => {
    it('登録フォームが表示される', () => {
      const mockOnSubmit = vi.fn();

      render(<AuthForm mode="signup" onSubmit={mockOnSubmit} />);

      expect(screen.getByText('アカウント登録')).toBeInTheDocument();
      expect(screen.getByLabelText(/メールアドレス/)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
    });

    it('有効なデータでフォームを送信できる', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(<AuthForm mode="signup" onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/メールアドレス/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const submitButton = screen.getByRole('button', { name: '登録' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('無効なメールアドレスの場合、エラーメッセージが表示される', async () => {
      const mockOnSubmit = vi.fn();

      render(<AuthForm mode="signup" onSubmit={mockOnSubmit} noValidate />);

      const emailInput = screen.getByLabelText(/メールアドレス/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const submitButton = screen.getByRole('button', { name: '登録' });

      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/有効なメールアドレスを入力してください/)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('短いパスワードの場合、エラーメッセージが表示される', async () => {
      const mockOnSubmit = vi.fn();

      render(<AuthForm mode="signup" onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/メールアドレス/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const submitButton = screen.getByRole('button', { name: '登録' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '12345' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/パスワードは6文字以上で入力してください/)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('モード切り替えボタンが表示される', () => {
      const mockOnSubmit = vi.fn();
      const mockOnModeChange = vi.fn();

      render(<AuthForm mode="signup" onSubmit={mockOnSubmit} onModeChange={mockOnModeChange} />);

      expect(screen.getByText('既にアカウントをお持ちですか？')).toBeInTheDocument();
      const modeChangeButton = screen.getByRole('button', { name: 'ログイン' });
      expect(modeChangeButton).toBeInTheDocument();

      fireEvent.click(modeChangeButton);
      expect(mockOnModeChange).toHaveBeenCalled();
    });
  });

  describe('signin モード', () => {
    it('ログインフォームが表示される', () => {
      const mockOnSubmit = vi.fn();

      render(<AuthForm mode="signin" onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
      expect(screen.getByLabelText(/メールアドレス/)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    });

    it('有効なデータでフォームを送信できる', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(<AuthForm mode="signin" onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/メールアドレス/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('モード切り替えボタンが表示される', () => {
      const mockOnSubmit = vi.fn();
      const mockOnModeChange = vi.fn();

      render(<AuthForm mode="signin" onSubmit={mockOnSubmit} onModeChange={mockOnModeChange} />);

      expect(screen.getByText('アカウントをお持ちでないですか？')).toBeInTheDocument();
      const modeChangeButton = screen.getByRole('button', { name: '登録' });
      expect(modeChangeButton).toBeInTheDocument();

      fireEvent.click(modeChangeButton);
      expect(mockOnModeChange).toHaveBeenCalled();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はフォームが無効化される', () => {
      const mockOnSubmit = vi.fn();

      render(<AuthForm mode="signup" onSubmit={mockOnSubmit} loading={true} />);

      const emailInput = screen.getByLabelText(/メールアドレス/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const submitButton = screen.getByRole('button', { name: '処理中...' });

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      const mockOnSubmit = vi.fn();

      render(<AuthForm mode="signup" onSubmit={mockOnSubmit} error="ログインに失敗しました" />);

      expect(screen.getByText('ログインに失敗しました')).toBeInTheDocument();
    });
  });

  describe('リアルタイムバリデーション', () => {
    it('無効なメールアドレスを入力後、有効なメールアドレスに修正するとエラーが消える', async () => {
      const mockOnSubmit = vi.fn();

      render(<AuthForm mode="signup" onSubmit={mockOnSubmit} noValidate />);

      const emailInput = screen.getByLabelText(/メールアドレス/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const submitButton = screen.getByRole('button', { name: '登録' });

      // 無効なメールアドレスで送信
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/有効なメールアドレスを入力してください/)).toBeInTheDocument();
      });

      // 有効なメールアドレスに修正
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      await waitFor(() => {
        expect(
          screen.queryByText(/有効なメールアドレスを入力してください/)
        ).not.toBeInTheDocument();
      });
    });
  });
});
