/**
 * LocalStorageRepositoryのユニットテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from './LocalStorageRepository';
import type { Profile } from '../types';

describe('LocalStorageRepository', () => {
  let repository: LocalStorageRepository;

  // テスト用のプロフィールデータ
  const createTestProfile = (id: string): Profile => ({
    id,
    name: 'テストユーザー',
    jobTitle: 'ソフトウェアエンジニア',
    bio: 'テスト用のプロフィールです',
    skills: ['React', 'TypeScript'],
    yearsOfExperience: 5,
    socialLinks: [
      {
        id: 'link1',
        service: 'github',
        url: 'https://github.com/test',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    // 各テストの前にストレージをクリア
    await repository.clear();
  });

  describe('save', () => {
    it('プロフィールを保存できる', async () => {
      const profile = createTestProfile('test-id-1');

      await repository.save(profile);

      const saved = await repository.findById('test-id-1');
      expect(saved).toEqual(profile);
    });

    it('同じIDのプロフィールを上書きできる', async () => {
      const profile1 = createTestProfile('test-id-1');
      const profile2 = { ...profile1, name: '更新されたユーザー' };

      await repository.save(profile1);
      await repository.save(profile2);

      const saved = await repository.findById('test-id-1');
      expect(saved?.name).toBe('更新されたユーザー');
    });

    it('複数のプロフィールを保存できる', async () => {
      const profile1 = createTestProfile('test-id-1');
      const profile2 = createTestProfile('test-id-2');

      await repository.save(profile1);
      await repository.save(profile2);

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('存在するプロフィールを取得できる', async () => {
      const profile = createTestProfile('test-id-1');
      await repository.save(profile);

      const found = await repository.findById('test-id-1');

      expect(found).toEqual(profile);
    });

    it('存在しないプロフィールの場合nullを返す', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });

    it('空のストレージの場合nullを返す', async () => {
      const found = await repository.findById('test-id-1');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('すべてのプロフィールを取得できる', async () => {
      const profile1 = createTestProfile('test-id-1');
      const profile2 = createTestProfile('test-id-2');
      const profile3 = createTestProfile('test-id-3');

      await repository.save(profile1);
      await repository.save(profile2);
      await repository.save(profile3);

      const all = await repository.findAll();

      expect(all).toHaveLength(3);
      expect(all).toContainEqual(profile1);
      expect(all).toContainEqual(profile2);
      expect(all).toContainEqual(profile3);
    });

    it('空のストレージの場合空配列を返す', async () => {
      const all = await repository.findAll();

      expect(all).toEqual([]);
    });
  });

  describe('delete', () => {
    it('プロフィールを削除できる', async () => {
      const profile = createTestProfile('test-id-1');
      await repository.save(profile);

      await repository.delete('test-id-1');

      const found = await repository.findById('test-id-1');
      expect(found).toBeNull();
    });

    it('存在しないプロフィールを削除してもエラーにならない', async () => {
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });

    it('特定のプロフィールのみ削除される', async () => {
      const profile1 = createTestProfile('test-id-1');
      const profile2 = createTestProfile('test-id-2');

      await repository.save(profile1);
      await repository.save(profile2);

      await repository.delete('test-id-1');

      const all = await repository.findAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual(profile2);
    });
  });

  describe('exists', () => {
    it('存在するプロフィールの場合trueを返す', async () => {
      const profile = createTestProfile('test-id-1');
      await repository.save(profile);

      const exists = await repository.exists('test-id-1');

      expect(exists).toBe(true);
    });

    it('存在しないプロフィールの場合falseを返す', async () => {
      const exists = await repository.exists('non-existent-id');

      expect(exists).toBe(false);
    });
  });

  describe('エラーケース', () => {
    it('破損したデータがある場合、空配列を返す', async () => {
      // 破損したデータを直接localStorageに設定
      localStorage.setItem('linker_profiles', 'invalid json');

      const all = await repository.findAll();

      expect(all).toEqual([]);
    });

    it('破損したデータがある場合、findByIdはnullを返す', async () => {
      // 破損したデータを直接localStorageに設定
      localStorage.setItem('linker_profiles', 'invalid json');

      const found = await repository.findById('test-id-1');

      expect(found).toBeNull();
    });

    it('不正な形式のデータがある場合、空配列を返す', async () => {
      // 配列形式（期待される形式はオブジェクト）
      localStorage.setItem('linker_profiles', '[]');

      const all = await repository.findAll();

      expect(all).toEqual([]);
    });
  });

  describe('clear', () => {
    it('すべてのデータをクリアできる', async () => {
      const profile1 = createTestProfile('test-id-1');
      const profile2 = createTestProfile('test-id-2');

      await repository.save(profile1);
      await repository.save(profile2);

      await repository.clear();

      const all = await repository.findAll();
      expect(all).toEqual([]);
    });
  });
});
