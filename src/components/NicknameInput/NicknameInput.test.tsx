/**
 * NicknameInputコンポーネントのユニットテスト
 * 要件: 1.2, 1.4, 1.5, 5.2, 5.4, 9.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NicknameInput } from './NicknameInput';
import * as useNicknameCheckModule from '../../hooks/useNicknameCheck';

// useNicknameCheckフックをモック
vi.mock('../../hooks/useNicknameCheck');

describe('NicknameInput', () => {
  const mockOnChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('入力値の変更', () => {
    it('ユーザーが入力した値がonChangeハンドラに渡される', async () => {
      const user = userEvent.setup();
      
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      await user.type(input, 'test-user');

      expect(mockOnChange).toHaveBeenCalledTimes(9); // 'test-user'の文字数
      // user.typeは各文字を個別に入力するため、最後の呼び出しは最後の文字
      expect(mockOnChange).toHaveBeenLastCalledWith('r');
      // 最初の呼び出しで't'が渡されることを確認
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 't');
    });

    it('value propが変更されると入力フィールドの値が更新される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      const { rerender } = render(
        <NicknameInput
          value="initial"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      expect(input).toHaveValue('initial');

      rerender(
        <NicknameInput
          value="updated"
          onChange={mockOnChange}
        />
      );

      expect(input).toHaveValue('updated');
    });
  });

  describe('バリデーション表示', () => {
    it('利用可能なニックネームの場合、成功スタイルが適用される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'available',
        message: 'このニックネームは利用可能です',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value="valid-nickname"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      expect(input).toHaveClass('nickname-input--success');
    });

    it('使用済みニックネームの場合、エラースタイルが適用される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'unavailable',
        message: 'このニックネームは既に使用されています',
        isValid: true,
        isAvailable: false,
        isChecking: false
      });

      render(
        <NicknameInput
          value="taken-nickname"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      expect(input).toHaveClass('nickname-input--error');
    });

    it('無効な形式の場合、エラースタイルが適用される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'error',
        message: 'ニックネームは3文字以上で入力してください',
        isValid: false,
        isAvailable: false,
        isChecking: false
      });

      render(
        <NicknameInput
          value="ab"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      expect(input).toHaveClass('nickname-input--error');
    });

    it('外部エラーが渡された場合、エラースタイルが適用される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value="test"
          onChange={mockOnChange}
          error="外部エラーメッセージ"
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      expect(input).toHaveClass('nickname-input--error');
    });
  });

  describe('利用可能性チェック表示', () => {
    it('チェック中の場合、ローディング状態が表示される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'checking',
        message: '確認中...',
        isValid: true,
        isAvailable: false,
        isChecking: true
      });

      render(
        <NicknameInput
          value="checking-nickname"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('確認中...')).toBeInTheDocument();
    });

    it('利用可能な場合、成功メッセージが表示される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'available',
        message: 'このニックネームは利用可能です',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value="available-nickname"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('このニックネームは利用可能です')).toBeInTheDocument();
    });

    it('使用済みの場合、エラーメッセージが表示される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'unavailable',
        message: 'このニックネームは既に使用されています',
        isValid: true,
        isAvailable: false,
        isChecking: false
      });

      render(
        <NicknameInput
          value="taken-nickname"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('このニックネームは既に使用されています')).toBeInTheDocument();
    });

    it('バリデーションエラーの場合、エラーメッセージが表示される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'error',
        message: 'ニックネームは3文字以上で入力してください',
        isValid: false,
        isAvailable: false,
        isChecking: false
      });

      render(
        <NicknameInput
          value="ab"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('ニックネームは3文字以上で入力してください')).toBeInTheDocument();
    });

    it('idle状態の場合、利用可能性メッセージは表示されない', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value=""
          onChange={mockOnChange}
        />
      );

      // NicknameAvailabilityコンポーネントが表示されないことを確認
      const availabilityMessages = screen.queryByText(/利用可能|使用されています|確認中/);
      expect(availabilityMessages).not.toBeInTheDocument();
    });
  });

  describe('ヘルプテキスト表示', () => {
    it('showHelp=trueでフォーカス時にヘルプテキストが表示される', async () => {
      const user = userEvent.setup();
      
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value=""
          onChange={mockOnChange}
          showHelp={true}
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      
      // フォーカス前はヘルプテキストが表示されている（空の値の場合）
      expect(screen.getByText(/3-36文字の英数字/)).toBeInTheDocument();

      await user.click(input);
      
      // フォーカス後もヘルプテキストが表示される
      expect(screen.getByText(/3-36文字の英数字/)).toBeInTheDocument();
    });

    it('showHelp=falseの場合、ヘルプテキストが表示されない', async () => {
      const user = userEvent.setup();
      
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value=""
          onChange={mockOnChange}
          showHelp={false}
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      await user.click(input);

      expect(screen.queryByText(/3-36文字の英数字/)).not.toBeInTheDocument();
    });

    it('値が入力されていてフォーカスがない場合、ヘルプテキストが非表示になる', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value="test-user"
          onChange={mockOnChange}
          showHelp={true}
        />
      );

      expect(screen.queryByText(/3-36文字の英数字/)).not.toBeInTheDocument();
    });
  });

  describe('バリデーション状態の通知', () => {
    it('バリデーションが成功した場合、onValidationChangeがtrueで呼ばれる', async () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'available',
        message: 'このニックネームは利用可能です',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value="valid-nickname"
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(true);
      });
    });

    it('バリデーションが失敗した場合、onValidationChangeがfalseで呼ばれる', async () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'error',
        message: 'ニックネームは3文字以上で入力してください',
        isValid: false,
        isAvailable: false,
        isChecking: false
      });

      render(
        <NicknameInput
          value="ab"
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(false);
      });
    });

    it('ニックネームが使用済みの場合、onValidationChangeがfalseで呼ばれる', async () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'unavailable',
        message: 'このニックネームは既に使用されています',
        isValid: true,
        isAvailable: false,
        isChecking: false
      });

      render(
        <NicknameInput
          value="taken-nickname"
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('エラー時にaria-invalidがtrueになる', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'error',
        message: 'エラー',
        isValid: false,
        isAvailable: false,
        isChecking: false
      });

      render(
        <NicknameInput
          value="invalid"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('正常時にaria-invalidがfalseになる', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'available',
        message: '利用可能',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value="valid"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox', { name: /ニックネーム/i });
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('外部エラーが表示される場合、role="alert"が設定される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value="test"
          onChange={mockOnChange}
          error="外部エラー"
        />
      );

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent('外部エラー');
    });

    it('必須フィールドの場合、アスタリスクが表示される', () => {
      vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value=""
          onChange={mockOnChange}
          required={true}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('currentNicknameプロパティ', () => {
    it('currentNicknameが渡された場合、useNicknameCheckに渡される', () => {
      const mockUseNicknameCheck = vi.mocked(useNicknameCheckModule.useNicknameCheck);
      mockUseNicknameCheck.mockReturnValue({
        status: 'idle',
        message: '',
        isValid: true,
        isAvailable: true,
        isChecking: false
      });

      render(
        <NicknameInput
          value="new-nickname"
          onChange={mockOnChange}
          currentNickname="old-nickname"
        />
      );

      expect(mockUseNicknameCheck).toHaveBeenCalledWith(
        'new-nickname',
        expect.objectContaining({
          currentNickname: 'old-nickname'
        })
      );
    });
  });
});
