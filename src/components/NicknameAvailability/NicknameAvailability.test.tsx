/**
 * NicknameAvailabilityコンポーネントのユニットテスト
 * 要件: 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NicknameAvailability } from './NicknameAvailability';
import type { NicknameCheckStatus } from '../../hooks/useNicknameCheck';

describe('NicknameAvailability', () => {
  describe('各状態でのアイコン表示', () => {
    it('checking状態でローディングアイコンが表示される', () => {
      render(
        <NicknameAvailability
          status="checking"
          message="確認中..."
        />
      );

      const icon = screen.getByLabelText('チェック中');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('nickname-availability-icon--loading');
    });

    it('available状態でチェックマークアイコンが表示される', () => {
      render(
        <NicknameAvailability
          status="available"
          message="利用可能です"
        />
      );

      const icon = screen.getByLabelText('利用可能');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('nickname-availability-icon--success');
    });

    it('unavailable状態でXマークアイコンが表示される', () => {
      render(
        <NicknameAvailability
          status="unavailable"
          message="既に使用されています"
        />
      );

      const icon = screen.getByLabelText('エラー');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('nickname-availability-icon--error');
    });

    it('error状態でXマークアイコンが表示される', () => {
      render(
        <NicknameAvailability
          status="error"
          message="エラーが発生しました"
        />
      );

      const icon = screen.getByLabelText('エラー');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('nickname-availability-icon--error');
    });

    it('idle状態では何も表示されない', () => {
      const { container } = render(
        <NicknameAvailability
          status="idle"
          message="アイドル"
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('メッセージ表示', () => {
    it('messageが渡された場合、メッセージが表示される', () => {
      const message = 'このニックネームは利用可能です';
      
      render(
        <NicknameAvailability
          status="available"
          message={message}
        />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('messageが渡されない場合、メッセージテキストは表示されない', () => {
      const { container } = render(
        <NicknameAvailability
          status="available"
        />
      );

      const messageElement = container.querySelector('.nickname-availability-text');
      expect(messageElement).not.toBeInTheDocument();
    });

    it('checking状態でメッセージが表示される', () => {
      const message = '確認中...';
      
      render(
        <NicknameAvailability
          status="checking"
          message={message}
        />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('unavailable状態でメッセージが表示される', () => {
      const message = 'このニックネームは既に使用されています';
      
      render(
        <NicknameAvailability
          status="unavailable"
          message={message}
        />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('error状態でメッセージが表示される', () => {
      const message = 'ニックネームは3文字以上で入力してください';
      
      render(
        <NicknameAvailability
          status="error"
          message={message}
        />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('メッセージスタイルクラス', () => {
    it('checking状態で適切なスタイルクラスが適用される', () => {
      const { container } = render(
        <NicknameAvailability
          status="checking"
          message="確認中..."
        />
      );

      const element = container.querySelector('.nickname-availability-message--checking');
      expect(element).toBeInTheDocument();
    });

    it('available状態で適切なスタイルクラスが適用される', () => {
      const { container } = render(
        <NicknameAvailability
          status="available"
          message="利用可能です"
        />
      );

      const element = container.querySelector('.nickname-availability-message--success');
      expect(element).toBeInTheDocument();
    });

    it('unavailable状態で適切なスタイルクラスが適用される', () => {
      const { container } = render(
        <NicknameAvailability
          status="unavailable"
          message="既に使用されています"
        />
      );

      const element = container.querySelector('.nickname-availability-message--error');
      expect(element).toBeInTheDocument();
    });

    it('error状態で適切なスタイルクラスが適用される', () => {
      const { container } = render(
        <NicknameAvailability
          status="error"
          message="エラー"
        />
      );

      const element = container.querySelector('.nickname-availability-message--error');
      expect(element).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ属性', () => {
    it('role="status"が設定される', () => {
      render(
        <NicknameAvailability
          status="available"
          message="利用可能です"
        />
      );

      const element = screen.getByRole('status');
      expect(element).toBeInTheDocument();
    });

    it('checking状態でaria-live="polite"が設定される', () => {
      render(
        <NicknameAvailability
          status="checking"
          message="確認中..."
        />
      );

      const element = screen.getByRole('status');
      expect(element).toHaveAttribute('aria-live', 'polite');
    });

    it('available状態でaria-live="assertive"が設定される', () => {
      render(
        <NicknameAvailability
          status="available"
          message="利用可能です"
        />
      );

      const element = screen.getByRole('status');
      expect(element).toHaveAttribute('aria-live', 'assertive');
    });

    it('unavailable状態でaria-live="assertive"が設定される', () => {
      render(
        <NicknameAvailability
          status="unavailable"
          message="既に使用されています"
        />
      );

      const element = screen.getByRole('status');
      expect(element).toHaveAttribute('aria-live', 'assertive');
    });

    it('error状態でaria-live="assertive"が設定される', () => {
      render(
        <NicknameAvailability
          status="error"
          message="エラー"
        />
      );

      const element = screen.getByRole('status');
      expect(element).toHaveAttribute('aria-live', 'assertive');
    });

    it('アイコンに適切なaria-labelが設定される', () => {
      const statuses: Array<{ status: NicknameCheckStatus; label: string }> = [
        { status: 'checking', label: 'チェック中' },
        { status: 'available', label: '利用可能' },
        { status: 'unavailable', label: 'エラー' },
        { status: 'error', label: 'エラー' }
      ];

      statuses.forEach(({ status, label }) => {
        const { unmount } = render(
          <NicknameAvailability
            status={status}
            message="テスト"
          />
        );

        expect(screen.getByLabelText(label)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('カスタムクラス', () => {
    it('classNameプロパティが渡された場合、追加のクラスが適用される', () => {
      const customClass = 'custom-availability-class';
      
      const { container } = render(
        <NicknameAvailability
          status="available"
          message="利用可能です"
          className={customClass}
        />
      );

      const element = container.querySelector(`.${customClass}`);
      expect(element).toBeInTheDocument();
    });

    it('classNameが渡されない場合でも正常に動作する', () => {
      const { container } = render(
        <NicknameAvailability
          status="available"
          message="利用可能です"
        />
      );

      const element = container.querySelector('.nickname-availability');
      expect(element).toBeInTheDocument();
    });
  });

  describe('SVGアイコンの表示', () => {
    it('available状態でチェックマークSVGが表示される', () => {
      const { container } = render(
        <NicknameAvailability
          status="available"
          message="利用可能です"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
    });

    it('error状態でXマークSVGが表示される', () => {
      const { container } = render(
        <NicknameAvailability
          status="error"
          message="エラー"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
    });

    it('checking状態でスピナーが表示される', () => {
      const { container } = render(
        <NicknameAvailability
          status="checking"
          message="確認中..."
        />
      );

      const spinner = container.querySelector('.nickname-availability-spinner');
      expect(spinner).toBeInTheDocument();
    });
  });
});
