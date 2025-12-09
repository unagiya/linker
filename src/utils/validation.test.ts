/**
 * バリデーション関数のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  validateProfile,
  validateProfileForm,
  validateSocialLink,
  validateSignUp,
  validateSignIn,
  isValidUrl,
  parseYearsOfExperience,
} from './validation';

describe('validateSignUp', () => {
  it('有効なメールアドレスとパスワードを受け入れる', () => {
    const result = validateSignUp({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.password).toBe('password123');
    }
  });

  it('無効なメールアドレスの場合エラーを返す', () => {
    const result = validateSignUp({
      email: 'invalid-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toBeDefined();
      expect(result.errors.email[0]).toContain('有効なメールアドレス');
    }
  });

  it('短すぎるパスワード（6文字未満）の場合エラーを返す', () => {
    const result = validateSignUp({
      email: 'user@example.com',
      password: '12345',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.password).toBeDefined();
      expect(result.errors.password[0]).toContain('6文字以上');
    }
  });

  it('メールアドレスが空の場合エラーを返す', () => {
    const result = validateSignUp({
      email: '',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toBeDefined();
    }
  });

  it('パスワードが空の場合エラーを返す', () => {
    const result = validateSignUp({
      email: 'user@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.password).toBeDefined();
    }
  });
});

describe('validateSignIn', () => {
  it('有効なメールアドレスとパスワードを受け入れる', () => {
    const result = validateSignIn({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.password).toBe('password123');
    }
  });

  it('無効なメールアドレスの場合エラーを返す', () => {
    const result = validateSignIn({
      email: 'invalid-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toBeDefined();
      expect(result.errors.email[0]).toContain('有効なメールアドレス');
    }
  });

  it('パスワードが空の場合エラーを返す', () => {
    const result = validateSignIn({
      email: 'user@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.password).toBeDefined();
      expect(result.errors.password[0]).toContain('パスワードを入力');
    }
  });

  it('メールアドレスが空の場合エラーを返す', () => {
    const result = validateSignIn({
      email: '',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toBeDefined();
    }
  });
});

describe('isValidUrl', () => {
  it('有効なHTTP URLを受け入れる', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('有効なHTTPS URLを受け入れる', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('無効なURLを拒否する', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

describe('parseYearsOfExperience', () => {
  it('有効な数値文字列を数値に変換する', () => {
    expect(parseYearsOfExperience('5')).toBe(5);
    expect(parseYearsOfExperience('0')).toBe(0);
    expect(parseYearsOfExperience('100')).toBe(100);
  });

  it('空文字列の場合undefinedを返す', () => {
    expect(parseYearsOfExperience('')).toBeUndefined();
    expect(parseYearsOfExperience('  ')).toBeUndefined();
  });

  it('負の数の場合undefinedを返す', () => {
    expect(parseYearsOfExperience('-1')).toBeUndefined();
  });

  it('100を超える数の場合undefinedを返す', () => {
    expect(parseYearsOfExperience('101')).toBeUndefined();
  });

  it('非数値の場合undefinedを返す', () => {
    expect(parseYearsOfExperience('abc')).toBeUndefined();
  });
});

describe('validateSocialLink', () => {
  it('有効なSNSリンクを受け入れる', () => {
    const result = validateSocialLink({
      service: 'twitter',
      url: 'https://twitter.com/user',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.service).toBe('twitter');
      expect(result.data.url).toBe('https://twitter.com/user');
    }
  });

  it('サービス名が空の場合エラーを返す', () => {
    const result = validateSocialLink({
      service: '',
      url: 'https://example.com',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.service).toBeDefined();
    }
  });

  it('無効なURLの場合エラーを返す', () => {
    const result = validateSocialLink({
      service: 'twitter',
      url: 'not-a-url',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.url).toBeDefined();
    }
  });
});

describe('validateProfile', () => {
  it('有効なプロフィールを受け入れる', () => {
    const result = validateProfile({
      name: '山田太郎',
      jobTitle: 'ソフトウェアエンジニア',
      bio: 'Reactが好きです',
      skills: ['React', 'TypeScript'],
      yearsOfExperience: 5,
      socialLinks: [
        {
          service: 'github',
          url: 'https://github.com/user',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('名前が空の場合エラーを返す', () => {
    const result = validateProfile({
      name: '',
      jobTitle: 'エンジニア',
      skills: [],
      socialLinks: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
    }
  });

  it('職種が空の場合エラーを返す', () => {
    const result = validateProfile({
      name: '山田太郎',
      jobTitle: '',
      skills: [],
      socialLinks: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.jobTitle).toBeDefined();
    }
  });

  it('経験年数が負の数の場合エラーを返す', () => {
    const result = validateProfile({
      name: '山田太郎',
      jobTitle: 'エンジニア',
      skills: [],
      socialLinks: [],
      yearsOfExperience: -1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.yearsOfExperience).toBeDefined();
    }
  });

  it('スキルが20個を超える場合エラーを返す', () => {
    const skills = Array.from({ length: 21 }, (_, i) => `Skill${i}`);
    const result = validateProfile({
      name: '山田太郎',
      jobTitle: 'エンジニア',
      skills,
      socialLinks: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.skills).toBeDefined();
    }
  });

  it('SNSリンクが10個を超える場合エラーを返す', () => {
    const socialLinks = Array.from({ length: 11 }, (_, i) => ({
      service: `service${i}`,
      url: `https://example${i}.com`,
    }));
    const result = validateProfile({
      name: '山田太郎',
      jobTitle: 'エンジニア',
      skills: [],
      socialLinks,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.socialLinks).toBeDefined();
    }
  });
});

describe('validateProfileForm', () => {
  it('有効なフォームデータを受け入れる', () => {
    const result = validateProfileForm({
      name: '山田太郎',
      jobTitle: 'ソフトウェアエンジニア',
      bio: 'Reactが好きです',
      skills: ['React', 'TypeScript'],
      yearsOfExperience: '5',
      socialLinks: [
        {
          service: 'github',
          url: 'https://github.com/user',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('必須項目が空の場合エラーを返す', () => {
    const result = validateProfileForm({
      name: '',
      jobTitle: '',
      bio: '',
      skills: [],
      yearsOfExperience: '',
      socialLinks: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.jobTitle).toBeDefined();
    }
  });

  it('デフォルト値が適用される', () => {
    const result = validateProfileForm({
      name: '山田太郎',
      jobTitle: 'エンジニア',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBe('');
      expect(result.data.skills).toEqual([]);
      expect(result.data.yearsOfExperience).toBe('');
      expect(result.data.socialLinks).toEqual([]);
    }
  });
});
