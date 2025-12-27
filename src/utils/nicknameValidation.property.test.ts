/**
 * ニックネームバリデーションのプロパティベーステスト
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { validateNickname, isReservedNickname, normalizeNickname } from './nicknameValidation';
import { RESERVED_NICKNAMES } from '../types/nickname';

/**
 * Feature: profile-nickname-urls, Property 6: 文字数制限バリデーション
 * 検証: 要件 2.1
 *
 * 任意のニックネーム入力に対して、3文字以上36文字以下であることが検証される
 */
describe('Property 6: 文字数制限バリデーション', () => {
  // 有効な文字数のニックネームジェネレーター（3-36文字）
  const validLengthNicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s))
    .filter(s => !RESERVED_NICKNAMES.includes(s.toLowerCase() as any));

  // 短すぎるニックネームジェネレーター（0-2文字）
  const tooShortNicknameArbitrary = fc.string({ minLength: 0, maxLength: 2 })
    .filter(s => /^[a-zA-Z0-9_-]*$/.test(s));

  // 長すぎるニックネームジェネレーター（37文字以上）
  const tooLongNicknameArbitrary = fc.string({ minLength: 37, maxLength: 100 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s));

  it('3文字以上36文字以下の有効なニックネームは常にバリデーションを通る', () => {
    fc.assert(
      fc.property(validLengthNicknameArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        // 文字数制限に関してはバリデーションを通る（他の制限でエラーになる可能性はある）
        return result.isValid || (result.error !== undefined && 
          !result.error.includes('3文字以上') && 
          !result.error.includes('36文字以下'));
      }),
      { numRuns: 100 }
    );
  });

  it('2文字以下のニックネームは常に文字数制限エラーになる', () => {
    fc.assert(
      fc.property(tooShortNicknameArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        return !result.isValid && 
          result.error === 'ニックネームは3文字以上で入力してください';
      }),
      { numRuns: 100 }
    );
  });

  it('37文字以上のニックネームは常に文字数制限エラーになる', () => {
    fc.assert(
      fc.property(tooLongNicknameArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        return !result.isValid && 
          result.error === 'ニックネームは36文字以下で入力してください';
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: profile-nickname-urls, Property 7: 文字種制限バリデーション
 * 検証: 要件 2.2
 *
 * 任意のニックネーム入力に対して、英数字、ハイフン、アンダースコアのみが受け付けられる
 */
describe('Property 7: 文字種制限バリデーション', () => {
  // 有効な文字のみを含むニックネームジェネレーター
  const validCharactersNicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s))
    .filter(s => !RESERVED_NICKNAMES.includes(s.toLowerCase() as any));

  // 無効な文字を含むニックネームジェネレーター
  const invalidCharactersNicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /[^a-zA-Z0-9_-]/.test(s)); // 無効な文字を含む

  it('英数字、ハイフン、アンダースコアのみのニックネームは文字種制限を通る', () => {
    fc.assert(
      fc.property(validCharactersNicknameArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        // 文字種制限に関してはバリデーションを通る（他の制限でエラーになる可能性はある）
        return result.isValid || (result.error !== undefined && 
          !result.error.includes('英数字、ハイフン、アンダースコアのみ使用可能'));
      }),
      { numRuns: 100 }
    );
  });

  it('無効な文字を含むニックネームは常に文字種制限エラーになる', () => {
    fc.assert(
      fc.property(invalidCharactersNicknameArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        return !result.isValid && 
          result.error === 'ニックネームは英数字、ハイフン、アンダースコアのみ使用可能です';
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: profile-nickname-urls, Property 8: 記号位置制限バリデーション
 * 検証: 要件 2.3
 *
 * 任意のニックネーム入力に対して、記号で始まったり終わったりしないことが検証される
 */
describe('Property 8: 記号位置制限バリデーション', () => {
  // 記号で始まるニックネームジェネレーター
  const startsWithSymbolArbitrary = fc.tuple(
    fc.constantFrom('-', '_'),
    fc.string({ minLength: 2, maxLength: 35 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
  ).map(([symbol, rest]) => symbol + rest);

  // 記号で終わるニックネームジェネレーター
  const endsWithSymbolArbitrary = fc.tuple(
    fc.string({ minLength: 2, maxLength: 35 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
    fc.constantFrom('-', '_')
  ).map(([rest, symbol]) => rest + symbol);

  // 英数字で始まり英数字で終わるニックネームジェネレーター
  const validPositionNicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s))
    .filter(s => !RESERVED_NICKNAMES.includes(s.toLowerCase() as any));

  it('記号で始まるニックネームは常に記号位置制限エラーになる', () => {
    fc.assert(
      fc.property(startsWithSymbolArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        return !result.isValid && 
          result.error === 'ニックネームは記号で始まったり終わったりできません';
      }),
      { numRuns: 100 }
    );
  });

  it('記号で終わるニックネームは常に記号位置制限エラーになる', () => {
    fc.assert(
      fc.property(endsWithSymbolArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        return !result.isValid && 
          result.error === 'ニックネームは記号で始まったり終わったりできません';
      }),
      { numRuns: 100 }
    );
  });

  it('英数字で始まり英数字で終わるニックネームは記号位置制限を通る', () => {
    fc.assert(
      fc.property(validPositionNicknameArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        // 記号位置制限に関してはバリデーションを通る（他の制限でエラーになる可能性はある）
        return result.isValid || (result.error !== undefined && 
          !result.error.includes('記号で始まったり終わったり'));
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: profile-nickname-urls, Property 9: 連続記号制限バリデーション
 * 検証: 要件 2.4
 *
 * 任意のニックネーム入力に対して、連続する記号を含まないことが検証される
 */
describe('Property 9: 連続記号制限バリデーション', () => {
  // 連続する記号を含むニックネームジェネレーター
  const consecutiveSymbolsArbitrary = fc.tuple(
    fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]*$/.test(s)),
    fc.constantFrom('--', '__', '-_', '_-', '---', '___'),
    fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]*$/.test(s))
  ).map(([prefix, symbols, suffix]) => prefix + symbols + suffix)
    .filter(s => s.length >= 3 && s.length <= 36);

  // 連続する記号を含まないニックネームジェネレーター
  const noConsecutiveSymbolsArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s))
    .filter(s => !RESERVED_NICKNAMES.includes(s.toLowerCase() as any));

  it('連続する記号を含むニックネームは常に連続記号制限エラーになる', () => {
    fc.assert(
      fc.property(consecutiveSymbolsArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        return !result.isValid && 
          result.error === 'ニックネームに連続する記号は使用できません';
      }),
      { numRuns: 100 }
    );
  });

  it('連続する記号を含まないニックネームは連続記号制限を通る', () => {
    fc.assert(
      fc.property(noConsecutiveSymbolsArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        // 連続記号制限に関してはバリデーションを通る（他の制限でエラーになる可能性はある）
        return result.isValid || (result.error !== undefined && 
          !result.error.includes('連続する記号は使用できません'));
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: profile-nickname-urls, Property 11: 予約語制限
 * 検証: 要件 2.6
 *
 * 任意の予約語リストに含まれるニックネームに対して、使用が拒否される
 */
describe('Property 11: 予約語制限', () => {
  // 予約語ジェネレーター（大文字小文字のバリエーション含む）
  const reservedNicknameArbitrary = fc.tuple(
    fc.constantFrom(...RESERVED_NICKNAMES),
    fc.constantFrom('lower', 'upper', 'mixed')
  ).map(([reserved, caseType]) => {
    switch (caseType) {
      case 'upper':
        return reserved.toUpperCase();
      case 'mixed':
        return reserved.split('').map((char, index) => 
          index % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
        ).join('');
      default:
        return reserved;
    }
  });

  // 予約語でないニックネームジェネレーター
  const nonReservedNicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s))
    .filter(s => !RESERVED_NICKNAMES.includes(s.toLowerCase() as any));

  it('予約語は常に予約語制限エラーになる', () => {
    fc.assert(
      fc.property(reservedNicknameArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        return !result.isValid && 
          result.error === 'このニックネームは予約語のため使用できません';
      }),
      { numRuns: 100 }
    );
  });

  it('予約語でないニックネームは予約語制限を通る', () => {
    fc.assert(
      fc.property(nonReservedNicknameArbitrary, (nickname) => {
        const result = validateNickname(nickname);
        // 予約語制限に関してはバリデーションを通る（他の制限でエラーになる可能性はある）
        return result.isValid || (result.error !== undefined && 
          !result.error.includes('予約語のため使用できません'));
      }),
      { numRuns: 100 }
    );
  });

  it('isReservedNickname関数は予約語を正しく判定する', () => {
    fc.assert(
      fc.property(reservedNicknameArbitrary, (nickname) => {
        return isReservedNickname(nickname) === true;
      }),
      { numRuns: 100 }
    );
  });

  it('isReservedNickname関数は予約語でないニックネームを正しく判定する', () => {
    fc.assert(
      fc.property(nonReservedNicknameArbitrary, (nickname) => {
        return isReservedNickname(nickname) === false;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * normalizeNickname関数のプロパティテスト
 */
describe('normalizeNickname プロパティテスト', () => {
  it('任意の文字列を小文字に変換する', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = normalizeNickname(input);
        return result === input.toLowerCase();
      }),
      { numRuns: 100 }
    );
  });

  it('正規化は冪等性を持つ（2回実行しても結果は同じ）', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const once = normalizeNickname(input);
        const twice = normalizeNickname(once);
        return once === twice;
      }),
      { numRuns: 100 }
    );
  });
});