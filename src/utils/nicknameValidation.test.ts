/**
 * ニックネームバリデーションのユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { validateNickname, isReservedNickname, normalizeNickname } from './nicknameValidation';

describe('validateNickname', () => {
  describe('有効なニックネーム', () => {
    it('英数字のみのニックネームは有効', () => {
      const result = validateNickname('user123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('ハイフンを含むニックネームは有効', () => {
      const result = validateNickname('user-name');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('アンダースコアを含むニックネームは有効', () => {
      const result = validateNickname('user_name');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('3文字のニックネームは有効', () => {
      const result = validateNickname('abc');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('36文字のニックネームは有効', () => {
      const result = validateNickname('a'.repeat(36));
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('大文字小文字混在のニックネームは有効', () => {
      const result = validateNickname('UserName123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('文字数制限', () => {
    it('2文字以下のニックネームは無効', () => {
      const result = validateNickname('ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは3文字以上で入力してください');
    });

    it('37文字以上のニックネームは無効', () => {
      const result = validateNickname('a'.repeat(37));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは36文字以下で入力してください');
    });

    it('空文字列は無効', () => {
      const result = validateNickname('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは3文字以上で入力してください');
    });
  });

  describe('文字種制限', () => {
    it('スペースを含むニックネームは無効', () => {
      const result = validateNickname('user name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは英数字、ハイフン、アンダースコアのみ使用可能です');
    });

    it('特殊文字を含むニックネームは無効', () => {
      const result = validateNickname('user@name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは英数字、ハイフン、アンダースコアのみ使用可能です');
    });

    it('日本語を含むニックネームは無効', () => {
      const result = validateNickname('ユーザー名');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは英数字、ハイフン、アンダースコアのみ使用可能です');
    });

    it('ドットを含むニックネームは無効', () => {
      const result = validateNickname('user.name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは英数字、ハイフン、アンダースコアのみ使用可能です');
    });
  });

  describe('記号位置制限', () => {
    it('ハイフンで始まるニックネームは無効', () => {
      const result = validateNickname('-username');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは記号で始まったり終わったりできません');
    });

    it('ハイフンで終わるニックネームは無効', () => {
      const result = validateNickname('username-');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは記号で始まったり終わったりできません');
    });

    it('アンダースコアで始まるニックネームは無効', () => {
      const result = validateNickname('_username');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは記号で始まったり終わったりできません');
    });

    it('アンダースコアで終わるニックネームは無効', () => {
      const result = validateNickname('username_');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームは記号で始まったり終わったりできません');
    });
  });

  describe('連続記号制限', () => {
    it('連続するハイフンを含むニックネームは無効', () => {
      const result = validateNickname('user--name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームに連続する記号は使用できません');
    });

    it('連続するアンダースコアを含むニックネームは無効', () => {
      const result = validateNickname('user__name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームに連続する記号は使用できません');
    });

    it('ハイフンとアンダースコアの連続は無効', () => {
      const result = validateNickname('user-_name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームに連続する記号は使用できません');
    });

    it('3つ以上の連続する記号は無効', () => {
      const result = validateNickname('user---name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ニックネームに連続する記号は使用できません');
    });
  });

  describe('予約語制限', () => {
    it('adminは予約語のため無効', () => {
      const result = validateNickname('admin');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('このニックネームは予約語のため使用できません');
    });

    it('大文字のADMINも予約語のため無効', () => {
      const result = validateNickname('ADMIN');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('このニックネームは予約語のため使用できません');
    });

    it('apiは予約語のため無効', () => {
      const result = validateNickname('api');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('このニックネームは予約語のため使用できません');
    });

    it('profileは予約語のため無効', () => {
      const result = validateNickname('profile');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('このニックネームは予約語のため使用できません');
    });

    it('signinは予約語のため無効', () => {
      const result = validateNickname('signin');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('このニックネームは予約語のため使用できません');
    });
  });
});

describe('isReservedNickname', () => {
  it('予約語の場合trueを返す', () => {
    expect(isReservedNickname('admin')).toBe(true);
    expect(isReservedNickname('api')).toBe(true);
    expect(isReservedNickname('profile')).toBe(true);
  });

  it('大文字小文字を区別せずに判定する', () => {
    expect(isReservedNickname('ADMIN')).toBe(true);
    expect(isReservedNickname('Admin')).toBe(true);
    expect(isReservedNickname('API')).toBe(true);
  });

  it('予約語でない場合falseを返す', () => {
    expect(isReservedNickname('user')).toBe(false);
    expect(isReservedNickname('myname')).toBe(false);
    expect(isReservedNickname('test123')).toBe(false);
  });
});

describe('normalizeNickname', () => {
  it('小文字に変換する', () => {
    expect(normalizeNickname('UserName')).toBe('username');
    expect(normalizeNickname('TEST123')).toBe('test123');
    expect(normalizeNickname('My-Name_123')).toBe('my-name_123');
  });

  it('既に小文字の場合はそのまま返す', () => {
    expect(normalizeNickname('username')).toBe('username');
    expect(normalizeNickname('test-123')).toBe('test-123');
  });

  it('空文字列の場合は空文字列を返す', () => {
    expect(normalizeNickname('')).toBe('');
  });
});