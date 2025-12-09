/**
 * ProfileFormコンポーネントのユニットテスト
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileForm } from './ProfileForm';
import type { ProfileFormData } from '../../types/profile';

describe('ProfileForm', () => {
  describe('基本表示', () => {
    it('プロフィール作成フォームが表示される', () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('プロフィール作成')).toBeInTheDocument();
      expect(screen.getByLabelText(/名前/)).toBeInTheDocument();
      expect(screen.getByLabelText(/職種/)).toBeInTheDocument();
      expect(screen.getByLabelText(/自己紹介/)).toBeInTheDocument();
      expect(screen.getByLabelText(/経験年数/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    });

    it('初期データがある場合、編集フォームとして表示される', () => {
      const mockOnSubmit = vi.fn();
      const initialData: Partial<ProfileFormData> = {
        name: '山田太郎',
        jobTitle: 'フロントエンドエンジニア',
        bio: 'Reactが得意です',
        skills: ['React', 'TypeScript'],
        yearsOfExperience: '5',
        socialLinks: [{ service: 'github', url: 'https://github.com/test' }],
      };

      render(<ProfileForm onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByText('プロフィール編集')).toBeInTheDocument();
      expect(screen.getByDisplayValue('山田太郎')).toBeInTheDocument();
      expect(screen.getByDisplayValue('フロントエンドエンジニア')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Reactが得意です')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });
  });

  describe('フォーム送信', () => {
    it('有効なデータでフォームを送信できる', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/名前/);
      const jobTitleInput = screen.getByLabelText(/職種/);
      const submitButton = screen.getByRole('button', { name: '保存' });

      fireEvent.change(nameInput, { target: { value: '山田太郎' } });
      fireEvent.change(jobTitleInput, {
        target: { value: 'フロントエンドエンジニア' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: '山田太郎',
          jobTitle: 'フロントエンドエンジニア',
          bio: '',
          skills: [],
          yearsOfExperience: '',
          socialLinks: [],
          imageFile: undefined,
          imageUrl: undefined,
          removeImage: false,
        });
      });
    });

    it('名前が空の場合、エラーメッセージが表示される', async () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const jobTitleInput = screen.getByLabelText(/職種/);
      const submitButton = screen.getByRole('button', { name: '保存' });

      fireEvent.change(jobTitleInput, {
        target: { value: 'フロントエンドエンジニア' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/名前は必須です/)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('職種が空の場合、エラーメッセージが表示される', async () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/名前/);
      const submitButton = screen.getByRole('button', { name: '保存' });

      fireEvent.change(nameInput, { target: { value: '山田太郎' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/職種は必須です/)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('スキル管理', () => {
    it('スキルを追加できる', async () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const skillInput = screen.getByPlaceholderText('スキルを入力してEnter');
      const addButton = screen.getByRole('button', { name: '追加' });

      fireEvent.change(skillInput, { target: { value: 'React' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      // 入力フィールドがクリアされる
      expect(skillInput).toHaveValue('');
    });

    it('Enterキーでスキルを追加できる', async () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const skillInput = screen.getByPlaceholderText('スキルを入力してEnter');

      fireEvent.change(skillInput, { target: { value: 'TypeScript' } });
      fireEvent.keyDown(skillInput, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
      });
    });

    it('スキルを削除できる', async () => {
      const mockOnSubmit = vi.fn();
      const initialData: Partial<ProfileFormData> = {
        name: '山田太郎',
        jobTitle: 'エンジニア',
        skills: ['React', 'TypeScript'],
      };

      render(<ProfileForm onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();

      const removeButtons = screen.getAllByLabelText(/を削除/);
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('React')).not.toBeInTheDocument();
      });

      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('重複するスキルは追加されない', async () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const skillInput = screen.getByPlaceholderText('スキルを入力してEnter');
      const addButton = screen.getByRole('button', { name: '追加' });

      // 1回目の追加
      fireEvent.change(skillInput, { target: { value: 'React' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      // 2回目の追加（重複）
      fireEvent.change(skillInput, { target: { value: 'React' } });
      fireEvent.click(addButton);

      // Reactは1つだけ表示される
      const reactElements = screen.getAllByText('React');
      expect(reactElements).toHaveLength(1);
    });

    it('空白のスキルは追加されない', async () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const skillInput = screen.getByPlaceholderText('スキルを入力してEnter');
      const addButton = screen.getByRole('button', { name: '追加' });

      fireEvent.change(skillInput, { target: { value: '   ' } });
      fireEvent.click(addButton);

      // スキルタグが表示されない
      expect(screen.queryByRole('button', { name: /を削除/ })).not.toBeInTheDocument();
    });
  });

  describe('SNSリンク管理', () => {
    it('SNSリンクを追加できる', async () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const addLinkButton = screen.getByRole('button', { name: 'リンクを追加' });
      fireEvent.click(addLinkButton);

      await waitFor(() => {
        expect(screen.getByLabelText('サービス選択')).toBeInTheDocument();
      });
    });

    it('SNSリンクを削除できる', async () => {
      const mockOnSubmit = vi.fn();
      const initialData: Partial<ProfileFormData> = {
        name: '山田太郎',
        jobTitle: 'エンジニア',
        socialLinks: [{ service: 'github', url: 'https://github.com/test' }],
      };

      render(<ProfileForm onSubmit={mockOnSubmit} initialData={initialData} />);

      const deleteButton = screen.getByRole('button', { name: 'リンクを削除' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('https://github.com/test')).not.toBeInTheDocument();
      });
    });

    it('サービスとURLを入力できる', async () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const addLinkButton = screen.getByRole('button', { name: 'リンクを追加' });
      fireEvent.click(addLinkButton);

      await waitFor(() => {
        const serviceSelect = screen.getByLabelText('サービス選択');
        fireEvent.change(serviceSelect, { target: { value: 'github' } });
      });

      const urlInput = screen.getByPlaceholderText('https://example.com');
      fireEvent.change(urlInput, { target: { value: 'https://github.com/test' } });

      expect(urlInput).toHaveValue('https://github.com/test');
    });
  });

  describe('キャンセル機能', () => {
    it('キャンセルボタンが表示され、クリックできる', () => {
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      expect(cancelButton).toBeInTheDocument();

      fireEvent.click(cancelButton);
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('onCancelが指定されていない場合、キャンセルボタンは表示されない', () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はフォームが無効化される', () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} loading={true} />);

      const nameInput = screen.getByLabelText(/名前/);
      const jobTitleInput = screen.getByLabelText(/職種/);
      const submitButton = screen.getByRole('button', { name: '保存中...' });

      expect(nameInput).toBeDisabled();
      expect(jobTitleInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      const mockOnSubmit = vi.fn();

      render(<ProfileForm onSubmit={mockOnSubmit} error="プロフィールの保存に失敗しました" />);

      expect(screen.getByText('プロフィールの保存に失敗しました')).toBeInTheDocument();
    });
  });

  describe('画像アップロード', () => {
    it('画像ファイルを選択できる', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/画像ファイルを選択/);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByAltText('プロフィール画像プレビュー')).toBeInTheDocument();
      });
    });

    it('画像を削除できる', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const initialData: Partial<ProfileFormData> = {
        name: '山田太郎',
        jobTitle: 'エンジニア',
        imageUrl: 'https://example.com/image.jpg',
        skills: [],
        socialLinks: [],
      };

      render(<ProfileForm onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByAltText('プロフィール画像プレビュー')).toBeInTheDocument();

      const removeButton = screen.getByRole('button', { name: '画像を削除' });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByAltText('プロフィール画像プレビュー')).not.toBeInTheDocument();
      });
    });

    it('画像プレビューが表示される', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const initialData: Partial<ProfileFormData> = {
        name: '山田太郎',
        jobTitle: 'エンジニア',
        imageUrl: 'https://example.com/image.jpg',
        skills: [],
        socialLinks: [],
      };

      render(<ProfileForm onSubmit={mockOnSubmit} initialData={initialData} />);

      // 画像プレビューが表示されることを確認
      expect(screen.getByAltText('プロフィール画像プレビュー')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '画像を削除' })).toBeInTheDocument();
    });

    it('画像ファイルがフォーム送信に含まれる', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(<ProfileForm onSubmit={mockOnSubmit} />);

      // フォーム入力
      const nameInput = screen.getByLabelText(/名前/);
      const jobTitleInput = screen.getByLabelText(/職種/);

      fireEvent.change(nameInput, { target: { value: '山田太郎' } });
      fireEvent.change(jobTitleInput, { target: { value: 'エンジニア' } });

      // 画像ファイル選択
      const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/画像ファイルを選択/);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // フォーム送信
      const submitButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '山田太郎',
            jobTitle: 'エンジニア',
            imageFile: file,
          })
        );
      });
    });
  });
});
