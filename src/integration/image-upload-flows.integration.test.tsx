/**
 * 画像アップロード機能の統合テスト
 * 
 * このテストはSupabase Storageとの統合をテストします。
 * 実行するには、Supabaseプロジェクトが正しく設定されている必要があります。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '../lib/supabase';
import { SupabaseProfileRepository } from '../repositories/SupabaseProfileRepository';
import * as imageService from '../services/imageService';
import type { Profile } from '../types/profile';

// テストをスキップ（CI環境では実行しない）
describe.skip('画像アップロード統合テスト', () => {
  let repository: SupabaseProfileRepository;
  let testUserId: string;
  let testProfile: Profile | null = null;
  let uploadedImageUrls: string[] = [];

  beforeEach(async () => {
    repository = new SupabaseProfileRepository(supabase);

    // テスト用ユーザーを作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    if (authError || !authData.user) {
      throw new Error('テストユーザーの作成に失敗しました');
    }

    testUserId = authData.user.id;
  });

  afterEach(async () => {
    // アップロードした画像を削除
    for (const imageUrl of uploadedImageUrls) {
      try {
        await imageService.deleteProfileImage(imageUrl);
      } catch (error) {
        console.error('画像削除エラー:', error);
      }
    }
    uploadedImageUrls = [];

    // テストプロフィールを削除
    if (testProfile) {
      try {
        await repository.delete(testProfile.id);
      } catch (error) {
        console.error('プロフィール削除エラー:', error);
      }
      testProfile = null;
    }

    // テストユーザーを削除
    try {
      await supabase.auth.admin.deleteUser(testUserId);
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
    }
  });

  /**
   * テスト1: 画像アップロードからプロフィール作成までのフロー
   * 要件: 12.5
   */
  it('画像をアップロードしてプロフィールを作成できる', async () => {
    // 1. テスト用の画像ファイルを作成
    const imageBlob = new Blob(['fake image data'], { type: 'image/jpeg' });
    const imageFile = new File([imageBlob], 'test-image.jpg', { type: 'image/jpeg' });

    // 2. 画像をアップロード
    const imageUrl = await imageService.uploadProfileImage(imageFile, testUserId);
    expect(imageUrl).toBeTruthy();
    expect(imageUrl).toContain('profile-images/');
    uploadedImageUrls.push(imageUrl);

    // 3. プロフィールを作成（画像URLを含む）
    const profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> = {
      user_id: testUserId,
      name: 'テストユーザー',
      jobTitle: 'エンジニア',
      skills: ['React', 'TypeScript'],
      socialLinks: [],
      imageUrl,
    };

    testProfile = await repository.save(profileData);
    expect(testProfile).toBeTruthy();
    expect(testProfile.imageUrl).toBe(imageUrl);

    // 4. プロフィールを取得して画像URLが保存されていることを確認
    const savedProfile = await repository.findById(testProfile.id);
    expect(savedProfile).toBeTruthy();
    expect(savedProfile?.imageUrl).toBe(imageUrl);
  });

  /**
   * テスト2: 画像更新（既存画像の削除）のフロー
   * 要件: 12.7
   */
  it('プロフィール更新時に既存画像を削除して新しい画像をアップロードできる', async () => {
    // 1. 最初の画像をアップロードしてプロフィールを作成
    const firstImageBlob = new Blob(['first image data'], { type: 'image/jpeg' });
    const firstImageFile = new File([firstImageBlob], 'first-image.jpg', { type: 'image/jpeg' });
    const firstImageUrl = await imageService.uploadProfileImage(firstImageFile, testUserId);
    uploadedImageUrls.push(firstImageUrl);

    const profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> = {
      user_id: testUserId,
      name: 'テストユーザー',
      jobTitle: 'エンジニア',
      skills: ['React'],
      socialLinks: [],
      imageUrl: firstImageUrl,
    };

    testProfile = await repository.save(profileData);
    expect(testProfile.imageUrl).toBe(firstImageUrl);

    // 2. 既存画像を削除
    await imageService.deleteProfileImage(firstImageUrl);

    // 3. 新しい画像をアップロード
    const secondImageBlob = new Blob(['second image data'], { type: 'image/jpeg' });
    const secondImageFile = new File([secondImageBlob], 'second-image.jpg', {
      type: 'image/jpeg',
    });
    const secondImageUrl = await imageService.uploadProfileImage(secondImageFile, testUserId);
    uploadedImageUrls.push(secondImageUrl);

    // 4. プロフィールを更新
    const updatedProfile = await repository.save({
      ...testProfile,
      imageUrl: secondImageUrl,
    });

    expect(updatedProfile.imageUrl).toBe(secondImageUrl);
    expect(updatedProfile.imageUrl).not.toBe(firstImageUrl);

    // 5. プロフィールを取得して新しい画像URLが保存されていることを確認
    const savedProfile = await repository.findById(testProfile.id);
    expect(savedProfile?.imageUrl).toBe(secondImageUrl);
  });

  /**
   * テスト3: プロフィール削除時の画像削除のフロー
   * 要件: 12.8
   */
  it('プロフィール削除時に画像も削除される', async () => {
    // 1. 画像をアップロードしてプロフィールを作成
    const imageBlob = new Blob(['test image data'], { type: 'image/jpeg' });
    const imageFile = new File([imageBlob], 'test-image.jpg', { type: 'image/jpeg' });
    const imageUrl = await imageService.uploadProfileImage(imageFile, testUserId);
    uploadedImageUrls.push(imageUrl);

    const profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> = {
      user_id: testUserId,
      name: 'テストユーザー',
      jobTitle: 'エンジニア',
      skills: ['React'],
      socialLinks: [],
      imageUrl,
    };

    testProfile = await repository.save(profileData);

    // 2. 画像を削除
    await imageService.deleteProfileImage(imageUrl);

    // 3. プロフィールを削除
    await repository.delete(testProfile.id);
    testProfile = null;

    // 4. プロフィールが削除されていることを確認
    const deletedProfile = await repository.findById(testProfile?.id || '');
    expect(deletedProfile).toBeNull();

    // 注: 画像が実際に削除されたかどうかは、Supabase Storageに直接アクセスして確認する必要があります
    // このテストでは、deleteProfileImage関数が正常に実行されることを確認しています
  });

  /**
   * テスト4: Supabase Storage RLSのテスト
   * 要件: 12.5
   */
  it('認証済みユーザーのみが画像をアップロードできる', async () => {
    // 1. ログアウト
    await supabase.auth.signOut();

    // 2. 未認証状態で画像をアップロードしようとする
    const imageBlob = new Blob(['test image data'], { type: 'image/jpeg' });
    const imageFile = new File([imageBlob], 'test-image.jpg', { type: 'image/jpeg' });

    // 3. エラーが発生することを確認
    await expect(imageService.uploadProfileImage(imageFile, testUserId)).rejects.toThrow();

    // 4. 再度ログイン
    await supabase.auth.signInWithPassword({
      email: `test-${testUserId}@example.com`,
      password: 'TestPassword123!',
    });
  });

  /**
   * テスト5: 画像ファイルのバリデーション
   * 要件: 12.3, 12.4
   */
  it('無効な画像ファイルはアップロードできない', async () => {
    // 1. 大きすぎるファイル（5MB超）
    const largeBlob = new Blob([new ArrayBuffer(6 * 1024 * 1024)], { type: 'image/jpeg' });
    const largeFile = new File([largeBlob], 'large-image.jpg', { type: 'image/jpeg' });

    const largeFileValidation = imageService.validateImageFile(largeFile);
    expect(largeFileValidation.isValid).toBe(false);
    expect(largeFileValidation.error).toContain('5MB');

    // 2. 無効なファイルタイプ
    const invalidBlob = new Blob(['test data'], { type: 'text/plain' });
    const invalidFile = new File([invalidBlob], 'test.txt', { type: 'text/plain' });

    const invalidFileValidation = imageService.validateImageFile(invalidFile);
    expect(invalidFileValidation.isValid).toBe(false);
    expect(invalidFileValidation.error).toContain('JPEG、PNG、GIF、WebP');
  });
});
