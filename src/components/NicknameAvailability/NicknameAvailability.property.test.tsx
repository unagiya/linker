/**
 * NicknameAvailabilityコンポーネントのプロパティベーステスト
 * Feature: profile-nickname-urls
 */

import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { NicknameAvailability } from './NicknameAvailability';

describe('NicknameAvailability - Property-Based Tests', () => {
  /**
   * プロパティ2: 使用済みニックネームの拒否
   * 検証: 要件 1.3, 5.3
   * 
   * 任意の既に使用されているニックネームに対して、「このニックネームは既に使用されています」というエラーメッセージが表示される
   */
  describe('Property 2: 使用済みニックネームの拒否', () => {
    // 任意のエラーメッセージ
    const errorMessageArbitrary = fc.oneof(
      fc.constant('このニックネームは既に使用されています'),
      fc.constant('既に使用されています'),
      fc.constant('このニックネームは使用できません')
    );

    it('unavailable状態で任意のエラーメッセージが表示される', () => {
      fc.assert(
        fc.property(errorMessageArbitrary, (errorMessage) => {
          const { container } = render(
            <NicknameAvailability
              status="unavailable"
              message={errorMessage}
            />
          );

          // エラーメッセージが表示されていることを確認
          const hasErrorMessage = screen.queryByText(errorMessage) !== null;
          
          // クリーンアップ
          container.remove();
          
          return hasErrorMessage;
        }),
        { numRuns: 50 }
      );
    });

    it('unavailable状態で任意のメッセージに対してエラーアイコンが表示される', () => {
      fc.assert(
        fc.property(errorMessageArbitrary, (errorMessage) => {
          const { container } = render(
            <NicknameAvailability
              status="unavailable"
              message={errorMessage}
            />
          );

          // エラーアイコンが表示されていることを確認
          const errorIcon = screen.queryByLabelText('エラー');
          const hasErrorIcon = errorIcon !== null;
          
          // クリーンアップ
          container.remove();
          
          return hasErrorIcon;
        }),
        { numRuns: 50 }
      );
    });

    it('unavailable状態で任意のメッセージに対してエラースタイルが適用される', () => {
      fc.assert(
        fc.property(errorMessageArbitrary, (errorMessage) => {
          const { container } = render(
            <NicknameAvailability
              status="unavailable"
              message={errorMessage}
            />
          );

          // エラースタイルクラスが適用されていることを確認
          const errorElement = container.querySelector('.nickname-availability-message--error');
          const hasErrorStyle = errorElement !== null;
          
          // クリーンアップ
          container.remove();
          
          return hasErrorStyle;
        }),
        { numRuns: 50 }
      );
    });

    it('unavailable状態で任意のメッセージに対してaria-live="assertive"が設定される', () => {
      fc.assert(
        fc.property(errorMessageArbitrary, (errorMessage) => {
          const { container } = render(
            <NicknameAvailability
              status="unavailable"
              message={errorMessage}
            />
          );

          // aria-live属性が正しく設定されていることを確認
          const statusElement = screen.queryByRole('status');
          const hasCorrectAriaLive = statusElement?.getAttribute('aria-live') === 'assertive';
          
          // クリーンアップ
          container.remove();
          
          return hasCorrectAriaLive;
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * 追加のプロパティテスト: 状態遷移の一貫性
   * 
   * 任意の状態とメッセージの組み合わせに対して、コンポーネントが正しく表示される
   */
  describe('Property: 状態遷移の一貫性', () => {
    const statusArbitrary = fc.constantFrom(
      'idle' as const,
      'checking' as const,
      'available' as const,
      'unavailable' as const,
      'error' as const
    );

    const messageArbitrary = fc.string({ minLength: 1, maxLength: 100 });

    it('任意の状態とメッセージの組み合わせでエラーが発生しない', () => {
      fc.assert(
        fc.property(statusArbitrary, messageArbitrary, (status, message) => {
          const { container } = render(
            <NicknameAvailability
              status={status}
              message={message}
            />
          );

          // idle状態では何も表示されない
          if (status === 'idle') {
            const hasNoContent = container.firstChild === null;
            container.remove();
            return hasNoContent;
          }

          // その他の状態ではrole="status"が設定される
          const statusElement = screen.queryByRole('status');
          const hasStatusRole = statusElement !== null;
          
          // クリーンアップ
          container.remove();
          
          return hasStatusRole;
        }),
        { numRuns: 100 }
      );
    });

    it('任意の非idle状態でメッセージが渡された場合、メッセージが表示される', () => {
      const nonIdleStatusArbitrary = fc.constantFrom(
        'checking' as const,
        'available' as const,
        'unavailable' as const,
        'error' as const
      );

      // 空白文字のみを除外したメッセージ
      const nonEmptyMessageArbitrary = messageArbitrary.filter(msg => msg.trim().length > 0);

      fc.assert(
        fc.property(nonIdleStatusArbitrary, nonEmptyMessageArbitrary, (status, message) => {
          const { container } = render(
            <NicknameAvailability
              status={status}
              message={message}
            />
          );

          // メッセージテキスト要素が存在し、メッセージが含まれていることを確認
          const messageElement = container.querySelector('.nickname-availability-text');
          const hasMessage = messageElement !== null && messageElement.textContent === message;
          
          // クリーンアップ
          container.remove();
          
          return hasMessage;
        }),
        { numRuns: 100 }
      );
    });

    it('任意の非idle状態で適切なアイコンが表示される', () => {
      const nonIdleStatusArbitrary = fc.constantFrom(
        'checking' as const,
        'available' as const,
        'unavailable' as const,
        'error' as const
      );

      fc.assert(
        fc.property(nonIdleStatusArbitrary, (status) => {
          const { container } = render(
            <NicknameAvailability
              status={status}
              message="テスト"
            />
          );

          // 状態に応じたアイコンが表示されていることを確認
          let hasIcon = false;
          
          switch (status) {
            case 'checking':
              hasIcon = screen.queryByLabelText('チェック中') !== null;
              break;
            case 'available':
              hasIcon = screen.queryByLabelText('利用可能') !== null;
              break;
            case 'unavailable':
            case 'error':
              hasIcon = screen.queryByLabelText('エラー') !== null;
              break;
          }
          
          // クリーンアップ
          container.remove();
          
          return hasIcon;
        }),
        { numRuns: 100 }
      );
    });
  });
});
