/**
 * 画像管理サービスのユニットテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateImageFile,
  uploadProfileImage,
  deleteProfileImage,
  getPublicUrl,
} from './imageService';

// Supabaseクライアントをモック
vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
}));

// モックされたsupabaseをインポート
import { supabase } from '../lib/supabase';

describe('imageService', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
  });

  describe('validateImageFile', () => {
    it('有効なJPEG画像を受け入れる', () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('有効なPNG画像を受け入れる', () => {
      const file = new File(['dummy'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('有効なWebP画像を受け入れる', () => {
      const file = new File(['dummy'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('5MB以下の画像を受け入れる', () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('5MBを超える画像を拒否する', () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1 }); // 5MB + 1byte

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('ファイルサイズは5MB以下にしてください');
    });

    it('無効なファイルタイプ（PDF）を拒否する', () => {
      const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('JPEG、PNG、WebP形式の画像のみアップロード可能です');
    });

    it('無効なファイルタイプ（テキスト）を拒否する', () => {
      const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('JPEG、PNG、WebP形式の画像のみアップロード可能です');
    });
  });

  describe('uploadProfileImage', () => {
    it('有効な画像をアップロードする', async () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      const userId = 'user-123';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: `${userId}/1234567890.jpg` },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: `https://example.com/storage/v1/object/public/profile-images/${userId}/1234567890.jpg` },
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as any);

      const result = await uploadProfileImage(userId, file);

      expect(result).toContain('profile-images');
      expect(mockUpload).toHaveBeenCalled();
      expect(mockGetPublicUrl).toHaveBeenCalled();
    });

    it('無効な画像の場合、エラーをスローする', async () => {
      const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      const userId = 'user-123';

      await expect(uploadProfileImage(userId, file)).rejects.toThrow(
        'JPEG、PNG、WebP形式の画像のみアップロード可能です'
      );
    });

    it('アップロードエラーの場合、エラーをスローする', async () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      const userId = 'user-123';

      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
      } as any);

      await expect(uploadProfileImage(userId, file)).rejects.toThrow(
        '画像のアップロードに失敗しました: Upload failed'
      );
    });
  });

  describe('deleteProfileImage', () => {
    it('有効なURLの画像を削除する', async () => {
      const imageUrl =
        'https://example.com/storage/v1/object/public/profile-images/user-123/1234567890.jpg';

      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any);

      await expect(deleteProfileImage(imageUrl)).resolves.toBeUndefined();
      expect(mockRemove).toHaveBeenCalledWith(['user-123/1234567890.jpg']);
    });

    it('無効なURLの場合、エラーをスローする', async () => {
      const imageUrl = 'https://example.com/invalid-url';

      await expect(deleteProfileImage(imageUrl)).rejects.toThrow('無効な画像URLです');
    });

    it('削除エラーの場合、エラーをスローする', async () => {
      const imageUrl =
        'https://example.com/storage/v1/object/public/profile-images/user-123/1234567890.jpg';

      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any);

      await expect(deleteProfileImage(imageUrl)).rejects.toThrow(
        '画像の削除に失敗しました: Delete failed'
      );
    });
  });

  describe('getPublicUrl', () => {
    it('ストレージパスから公開URLを取得する', () => {
      const path = 'user-123/1234567890.jpg';
      const expectedUrl = `https://example.com/storage/v1/object/public/profile-images/${path}`;

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: expectedUrl },
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        getPublicUrl: mockGetPublicUrl,
      } as any);

      const result = getPublicUrl(path);

      expect(result).toBe(expectedUrl);
      expect(mockGetPublicUrl).toHaveBeenCalledWith(path);
    });
  });
});
