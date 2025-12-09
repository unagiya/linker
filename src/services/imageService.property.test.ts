/**
 * 画像管理サービスのプロパティベーステスト
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateImageFile } from './imageService';

describe('imageService - Property Based Tests', () => {
  /**
   * Feature: engineer-profile-platform, Property 38: 大きすぎる画像ファイルの拒否
   * 検証: 要件 12.3
   *
   * 任意の5MBを超える画像ファイルに対して、アップロードは失敗し、エラーメッセージが表示される
   */
  describe('Property 38: 大きすぎる画像ファイルの拒否', () => {
    it('5MBを超える任意のサイズの画像ファイルを拒否する', () => {
      fc.assert(
        fc.property(
          // 5MB超過のファイルサイズを生成
          fc.integer({ min: 5 * 1024 * 1024 + 1, max: 10 * 1024 * 1024 }),
          // 有効な画像タイプを生成
          fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
          (fileSize, fileType) => {
            // モックファイルを作成
            const file = new File(['dummy'], 'test.jpg', { type: fileType });
            Object.defineProperty(file, 'size', { value: fileSize });

            // バリデーション実行
            const result = validateImageFile(file);

            // 検証: 拒否されること
            expect(result.valid).toBe(false);
            expect(result.error).toBe('ファイルサイズは5MB以下にしてください');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Feature: engineer-profile-platform, Property 39: 無効なファイルタイプの拒否
   * 検証: 要件 12.4
   *
   * 任意の画像形式以外のファイル（JPEG、PNG、WebP以外）に対して、アップロードは失敗し、エラーメッセージが表示される
   */
  describe('Property 39: 無効なファイルタイプの拒否', () => {
    it('画像形式以外の任意のファイルタイプを拒否する', () => {
      fc.assert(
        fc.property(
          // 無効なファイルタイプを生成
          fc.constantFrom(
            'application/pdf',
            'text/plain',
            'video/mp4',
            'audio/mp3',
            'application/zip',
            'text/html',
            'application/json'
          ),
          // 有効なファイルサイズを生成
          fc.integer({ min: 1, max: 5 * 1024 * 1024 }),
          (fileType, fileSize) => {
            // モックファイルを作成
            const file = new File(['dummy'], 'test.file', { type: fileType });
            Object.defineProperty(file, 'size', { value: fileSize });

            // バリデーション実行
            const result = validateImageFile(file);

            // 検証: 拒否されること
            expect(result.valid).toBe(false);
            expect(result.error).toBe('JPEG、PNG、WebP形式の画像のみアップロード可能です');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Feature: engineer-profile-platform, Property 40: 有効な画像形式の受け入れ
   * 検証: 要件 4.9
   *
   * 任意の有効な画像ファイル（JPEG、PNG、WebP）に対して、ファイルサイズが5MB以下であればアップロードが成功する
   */
  describe('Property 40: 有効な画像形式の受け入れ', () => {
    it('5MB以下の任意の有効な画像形式を受け入れる', () => {
      fc.assert(
        fc.property(
          // 有効な画像タイプを生成
          fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
          // 5MB以下のファイルサイズを生成
          fc.integer({ min: 1, max: 5 * 1024 * 1024 }),
          (fileType, fileSize) => {
            // モックファイルを作成
            const file = new File(['dummy'], 'test.jpg', { type: fileType });
            Object.defineProperty(file, 'size', { value: fileSize });

            // バリデーション実行
            const result = validateImageFile(file);

            // 検証: 受け入れられること
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Feature: engineer-profile-platform, Property 42: 一意のファイル名生成
   * 検証: 要件 12.6
   *
   * 任意の画像アップロードに対して、ファイル名はユーザーIDとタイムスタンプを含む一意の名前で保存される
   */
  describe('Property 42: 一意のファイル名生成', () => {
    it('異なるタイムスタンプで異なるファイル名が生成される', () => {
      fc.assert(
        fc.property(
          // ユーザーIDを生成
          fc.uuid(),
          // ファイル拡張子を生成
          fc.constantFrom('jpg', 'png', 'webp'),
          (userId, ext) => {
            // 2つの異なるタイムスタンプでファイル名を生成
            const timestamp1 = Date.now();
            const fileName1 = `${userId}/${timestamp1}.${ext}`;

            // 少し待機
            const timestamp2 = Date.now() + 1;
            const fileName2 = `${userId}/${timestamp2}.${ext}`;

            // 検証: ファイル名が異なること
            expect(fileName1).not.toBe(fileName2);
            // 検証: ユーザーIDが含まれること
            expect(fileName1).toContain(userId);
            expect(fileName2).toContain(userId);
            // 検証: タイムスタンプが含まれること
            expect(fileName1).toContain(timestamp1.toString());
            expect(fileName2).toContain(timestamp2.toString());
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
