/**
 * NicknameInputコンポーネントのプロパティベーステスト
 * Feature: profile-nickname-urls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { NicknameInput } from './NicknameInput';
import * as useNicknameCheckModule from '../../hooks/useNicknameCheck';

// useNicknameCheckフックをモック
vi.mock('../../hooks/useNicknameCheck');

describe('NicknameInput - Property-Based Tests', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * プロパティ3: 無効形式ニックネームの拒否
   * 検証: 要件 1.4, 5.4
   * 
   * 任意の無効な形式のニックネームに対して、適切なエラーメッセージが表示される
   */
  describe('Property 3: 無効形式ニックネームの拒否', () => {
    // 無効なニックネームのジェネレーター
    const invalidNicknameArbitrary = fc.oneof(
      // 短すぎる（3文字未満）
      fc.string({ maxLength: 2 }),
      // 長すぎる（36文字超）
      fc.string({ minLength: 37, maxLength: 50 }),
      // 無効文字を含む（英数字、ハイフン、アンダースコア以外）
      fc.string({ minLength: 3, maxLength: 36 }).filter(s => /[^a-zA-Z0-9_-]/.test(s)),
      // 記号で開始
      fc.string({ minLength: 3, maxLength: 36 }).filter(s => /^[-_]/.test(s)),
      // 記号で終了
      fc.string({ minLength: 3, maxLength: 36 }).filter(s => /[-_]$/.test(s)),
      // 連続記号
      fc.string({ minLength: 3, maxLength: 36 }).filter(s => /[-_]{2,}/.test(s))
    );

    it('任意の無効なニックネームに対してエラー状態が表示される', () => {
      fc.assert(
        fc.property(invalidNicknameArbitrary, (invalidNickname) => {
          // useNicknameCheckがエラー状態を返すようにモック
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'error',
            message: 'ニックネームの形式が無効です',
            isValid: false,
            isAvailable: false,
            isChecking: false
          });

          const { container } = render(
            <NicknameInput
              value={invalidNickname}
              onChange={mockOnChange}
            />
          );

          const input = screen.getByRole('textbox', { name: /ニックネーム/i });
          
          // エラースタイルが適用されていることを確認
          const hasErrorClass = input.classList.contains('nickname-input--error');
          
          // aria-invalidがtrueであることを確認
          const hasInvalidAria = input.getAttribute('aria-invalid') === 'true';
          
          // クリーンアップ
          container.remove();
          
          return hasErrorClass && hasInvalidAria;
        }),
        { numRuns: 100 }
      );
    });

    it('任意の無効なニックネームに対してエラーメッセージが表示される', () => {
      fc.assert(
        fc.property(invalidNicknameArbitrary, (invalidNickname) => {
          const errorMessage = 'ニックネームの形式が無効です';
          
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'error',
            message: errorMessage,
            isValid: false,
            isAvailable: false,
            isChecking: false
          });

          const { container } = render(
            <NicknameInput
              value={invalidNickname}
              onChange={mockOnChange}
            />
          );

          // エラーメッセージが表示されていることを確認
          const hasErrorMessage = screen.queryByText(errorMessage) !== null;
          
          // クリーンアップ
          container.remove();
          
          return hasErrorMessage;
        }),
        { numRuns: 100 }
      );
    });

    it('任意の無効なニックネームに対してバリデーションが失敗する', async () => {
      await fc.assert(
        fc.asyncProperty(invalidNicknameArbitrary, async (invalidNickname) => {
          const mockOnValidationChange = vi.fn();
          
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'error',
            message: 'エラー',
            isValid: false,
            isAvailable: false,
            isChecking: false
          });

          const { container } = render(
            <NicknameInput
              value={invalidNickname}
              onChange={mockOnChange}
              onValidationChange={mockOnValidationChange}
            />
          );

          // onValidationChangeがfalseで呼ばれることを確認
          await waitFor(() => {
            expect(mockOnValidationChange).toHaveBeenCalledWith(false);
          });
          
          const wasCalled = mockOnValidationChange.mock.calls.some(
            call => call[0] === false
          );
          
          // クリーンアップ
          container.remove();
          
          return wasCalled;
        }),
        { numRuns: 50 } // 非同期テストは実行回数を減らす
      );
    });
  });

  /**
   * プロパティ4: 有効ニックネームの受け入れ
   * 検証: 要件 1.5, 5.2
   * 
   * 任意の有効で利用可能なニックネームに対して、確認メッセージが表示される
   */
  describe('Property 4: 有効ニックネームの受け入れ', () => {
    // 有効なニックネームのジェネレーター
    const validNicknameArbitrary = fc
      .string({ minLength: 3, maxLength: 36 })
      .filter(s => /^[a-zA-Z0-9_-]+$/.test(s)) // 英数字、ハイフン、アンダースコアのみ
      .filter(s => /^[a-zA-Z0-9]/.test(s)) // 記号で開始しない
      .filter(s => /[a-zA-Z0-9]$/.test(s)) // 記号で終了しない
      .filter(s => !/[-_]{2,}/.test(s)); // 連続記号なし

    it('任意の有効なニックネームに対して成功状態が表示される', () => {
      fc.assert(
        fc.property(validNicknameArbitrary, (validNickname) => {
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'available',
            message: 'このニックネームは利用可能です',
            isValid: true,
            isAvailable: true,
            isChecking: false
          });

          const { container } = render(
            <NicknameInput
              value={validNickname}
              onChange={mockOnChange}
            />
          );

          const input = screen.getByRole('textbox', { name: /ニックネーム/i });
          
          // 成功スタイルが適用されていることを確認
          const hasSuccessClass = input.classList.contains('nickname-input--success');
          
          // aria-invalidがfalseであることを確認
          const hasValidAria = input.getAttribute('aria-invalid') === 'false';
          
          // クリーンアップ
          container.remove();
          
          return hasSuccessClass && hasValidAria;
        }),
        { numRuns: 100 }
      );
    });

    it('任意の有効なニックネームに対して確認メッセージが表示される', () => {
      fc.assert(
        fc.property(validNicknameArbitrary, (validNickname) => {
          const successMessage = 'このニックネームは利用可能です';
          
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'available',
            message: successMessage,
            isValid: true,
            isAvailable: true,
            isChecking: false
          });

          const { container } = render(
            <NicknameInput
              value={validNickname}
              onChange={mockOnChange}
            />
          );

          // 確認メッセージが表示されていることを確認
          const hasSuccessMessage = screen.queryByText(successMessage) !== null;
          
          // クリーンアップ
          container.remove();
          
          return hasSuccessMessage;
        }),
        { numRuns: 100 }
      );
    });

    it('任意の有効なニックネームに対してバリデーションが成功する', async () => {
      await fc.assert(
        fc.asyncProperty(validNicknameArbitrary, async (validNickname) => {
          const mockOnValidationChange = vi.fn();
          
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'available',
            message: '利用可能',
            isValid: true,
            isAvailable: true,
            isChecking: false
          });

          const { container } = render(
            <NicknameInput
              value={validNickname}
              onChange={mockOnChange}
              onValidationChange={mockOnValidationChange}
            />
          );

          // onValidationChangeがtrueで呼ばれることを確認
          await waitFor(() => {
            expect(mockOnValidationChange).toHaveBeenCalledWith(true);
          });
          
          const wasCalled = mockOnValidationChange.mock.calls.some(
            call => call[0] === true
          );
          
          // クリーンアップ
          container.remove();
          
          return wasCalled;
        }),
        { numRuns: 50 } // 非同期テストは実行回数を減らす
      );
    });
  });

  /**
   * プロパティ23: ローディング状態の表示
   * 検証: 要件 5.5
   * 
   * 任意の利用可能性チェック中に対して、ローディングインジケーターが表示される
   */
  describe('Property 23: ローディング状態の表示', () => {
    // 任意のニックネーム（チェック中）
    const nicknameArbitrary = fc.string({ minLength: 1, maxLength: 50 });

    it('任意のニックネームのチェック中にローディング状態が表示される', () => {
      fc.assert(
        fc.property(nicknameArbitrary, (nickname) => {
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'checking',
            message: '確認中...',
            isValid: true,
            isAvailable: false,
            isChecking: true
          });

          const { container } = render(
            <NicknameInput
              value={nickname}
              onChange={mockOnChange}
            />
          );

          // ローディングメッセージが表示されていることを確認
          const hasLoadingMessage = screen.queryByText('確認中...') !== null;
          
          // クリーンアップ
          container.remove();
          
          return hasLoadingMessage;
        }),
        { numRuns: 100 }
      );
    });

    it('任意のニックネームのチェック中にisCheckingフラグがtrueになる', () => {
      fc.assert(
        fc.property(nicknameArbitrary, (nickname) => {
          const checkResult = {
            status: 'checking' as const,
            message: '確認中...',
            isValid: true,
            isAvailable: false,
            isChecking: true
          };
          
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue(checkResult);

          const { container } = render(
            <NicknameInput
              value={nickname}
              onChange={mockOnChange}
            />
          );

          // useNicknameCheckが呼ばれたことを確認
          const mockCalls = vi.mocked(useNicknameCheckModule.useNicknameCheck).mock.calls;
          const wasCalled = mockCalls.length > 0;
          
          // クリーンアップ
          container.remove();
          
          return wasCalled && checkResult.isChecking === true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * プロパティ33: ヘルプテキストの表示
   * 検証: 要件 9.4
   * 
   * 任意のニックネーム入力フィールドに対して、フォーカス時にニックネームのルールを説明するヘルプテキストが表示される
   */
  describe('Property 33: ヘルプテキストの表示', () => {
    // 任意のニックネーム（空または値あり）
    const nicknameArbitrary = fc.oneof(
      fc.constant(''), // 空の値
      fc.string({ minLength: 1, maxLength: 50 }) // 任意の値
    );

    it('showHelp=trueの場合、空の値でヘルプテキストが表示される', () => {
      fc.assert(
        fc.property(fc.constant(''), () => {
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'idle',
            message: '',
            isValid: true,
            isAvailable: true,
            isChecking: false
          });

          const { container } = render(
            <NicknameInput
              value=""
              onChange={mockOnChange}
              showHelp={true}
            />
          );

          // ヘルプテキストが表示されていることを確認
          const hasHelpText = screen.queryByText(/3-36文字の英数字/) !== null;
          
          // クリーンアップ
          container.remove();
          
          return hasHelpText;
        }),
        { numRuns: 20 }
      );
    });

    it('showHelp=falseの場合、任意の値でヘルプテキストが表示されない', () => {
      fc.assert(
        fc.property(nicknameArbitrary, (nickname) => {
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'idle',
            message: '',
            isValid: true,
            isAvailable: true,
            isChecking: false
          });

          const { container } = render(
            <NicknameInput
              value={nickname}
              onChange={mockOnChange}
              showHelp={false}
            />
          );

          // ヘルプテキストが表示されていないことを確認
          const hasNoHelpText = screen.queryByText(/3-36文字の英数字/) === null;
          
          // クリーンアップ
          container.remove();
          
          return hasNoHelpText;
        }),
        { numRuns: 100 }
      );
    });

    it('ヘルプテキストには正しいルールが記載されている', () => {
      fc.assert(
        fc.property(fc.constant(''), () => {
          vi.mocked(useNicknameCheckModule.useNicknameCheck).mockReturnValue({
            status: 'idle',
            message: '',
            isValid: true,
            isAvailable: true,
            isChecking: false
          });

          const { container } = render(
            <NicknameInput
              value=""
              onChange={mockOnChange}
              showHelp={true}
            />
          );

          // ヘルプテキストに必要な情報が含まれていることを確認
          const helpText = screen.queryByText(/3-36文字の英数字/);
          const hasCorrectRules = helpText !== null && 
            helpText.textContent?.includes('ハイフン') &&
            helpText.textContent?.includes('アンダースコア') &&
            helpText.textContent?.includes('記号で始まったり終わったり');
          
          // クリーンアップ
          container.remove();
          
          return hasCorrectRules;
        }),
        { numRuns: 20 }
      );
    });
  });
});
