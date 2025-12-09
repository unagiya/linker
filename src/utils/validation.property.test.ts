/**
 * バリデーション機能のプロパティベーステスト
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import {
  validateProfileForm,
  validateSignUp,
  isValidUrl,
  parseYearsOfExperience,
} from './validation';

/**
 * Feature: engineer-profile-platform, Property 2: 無効なメールアドレスの拒否
 * 検証: 要件 1.3
 *
 * 任意の無効なメールアドレス形式に対して、アカウント登録は失敗し、エラーメッセージが表示される
 */
describe('Property 2: 無効なメールアドレスの拒否', () => {
  // 無効なメールアドレスのジェネレーター
  const invalidEmailArbitrary = fc.oneof(
    fc.constant(''),
    fc.constant('invalid'),
    fc.constant('invalid@'),
    fc.constant('@invalid.com'),
    fc.constant('invalid..email@example.com'),
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@')),
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.includes('@') && !s.includes('.'))
  );

  it('無効なメールアドレスに対して、バリデーションが失敗する', async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidEmailArbitrary,
        fc.string({ minLength: 6, maxLength: 50 }),
        async (invalidEmail, password) => {
          const result = validateSignUp({
            email: invalidEmail,
            password,
          });

          // バリデーションが失敗することを確認
          if (result.success) return false;

          // emailフィールドにエラーがあることを確認
          const hasEmailError = 'email' in result.errors;

          // エラーメッセージが存在することを確認
          const hasErrorMessage = hasEmailError && result.errors.email.length > 0;

          return hasEmailError && hasErrorMessage;
        }
      ),
      { numRuns: 2 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 3: 短いパスワードの拒否
 * 検証: 要件 1.4
 *
 * 任意の6文字未満のパスワードに対して、アカウント登録は失敗し、エラーメッセージが表示される
 */
describe('Property 3: 短いパスワードの拒否', () => {
  // 短いパスワードのジェネレーター（0〜5文字）
  const shortPasswordArbitrary = fc.string({ maxLength: 5 });

  it('6文字未満のパスワードに対して、バリデーションが失敗する', async () => {
    await fc.assert(
      fc.asyncProperty(fc.emailAddress(), shortPasswordArbitrary, async (email, shortPassword) => {
        const result = validateSignUp({
          email,
          password: shortPassword,
        });

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // passwordフィールドにエラーがあることを確認
        const hasPasswordError = 'password' in result.errors;

        // エラーメッセージが存在し、「6文字以上」を含むことを確認
        const hasErrorMessage =
          hasPasswordError &&
          result.errors.password.length > 0 &&
          result.errors.password.some((msg) => msg.includes('6文字以上'));

        return hasPasswordError && hasErrorMessage;
      }),
      { numRuns: 2 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 16: URLバリデーション
 * 検証: 要件 4.5
 *
 * 任意のURL文字列に対して、有効なURL形式（http/https）の場合のみ受け入れられ、
 * 無効な形式の場合はバリデーションエラーが発生する
 */
describe('Property 16: URLバリデーション', () => {
  // 有効なURLのジェネレーター
  const validUrlArbitrary = fc.webUrl({ validSchemes: ['http', 'https'] });

  // 無効なURLのジェネレーター
  const invalidUrlArbitrary = fc.oneof(
    fc.constant(''),
    fc.constant('not-a-url'),
    fc.constant('ftp://example.com'),
    fc.constant('javascript:alert(1)'),
    fc.constant('file:///etc/passwd'),
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('://'))
  );

  it('有効なURL（http/https）に対して、isValidUrlがtrueを返す', async () => {
    await fc.assert(
      fc.asyncProperty(validUrlArbitrary, async (validUrl) => {
        return isValidUrl(validUrl);
      }),
      { numRuns: 2 }
    );
  });

  it('無効なURLに対して、isValidUrlがfalseを返す', async () => {
    await fc.assert(
      fc.asyncProperty(invalidUrlArbitrary, async (invalidUrl) => {
        return !isValidUrl(invalidUrl);
      }),
      { numRuns: 2 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 18: 経験年数の数値バリデーション
 * 検証: 要件 4.7
 *
 * 任意の入力値に対して、0以上の数値のみが受け入れられ、
 * 負の数や非数値はバリデーションエラーとなる
 */
describe('Property 18: 経験年数の数値バリデーション', () => {
  // 有効な経験年数のジェネレーター（0〜100）
  const validYearsArbitrary = fc.integer({ min: 0, max: 100 });

  // 無効な経験年数のジェネレーター（負の数）
  const negativeYearsArbitrary = fc.integer({ max: -1 });

  // 無効な経験年数のジェネレーター（100を超える数）
  const tooLargeYearsArbitrary = fc.integer({ min: 101, max: 1000 });

  // 非数値文字列のジェネレーター
  const nonNumericArbitrary = fc.oneof(
    fc.constant('abc'),
    fc.constant('not a number'),
    fc.constant('12.5.3'),
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => isNaN(Number(s)))
  );

  it('0以上100以下の数値に対して、parseYearsOfExperienceが数値を返す', async () => {
    await fc.assert(
      fc.asyncProperty(validYearsArbitrary, async (validYears) => {
        const result = parseYearsOfExperience(validYears.toString());
        return result === validYears;
      }),
      { numRuns: 2 }
    );
  });

  it('負の数に対して、parseYearsOfExperienceがundefinedを返す', async () => {
    await fc.assert(
      fc.asyncProperty(negativeYearsArbitrary, async (negativeYears) => {
        const result = parseYearsOfExperience(negativeYears.toString());
        return result === undefined;
      }),
      { numRuns: 2 }
    );
  });

  it('100を超える数に対して、parseYearsOfExperienceがundefinedを返す', async () => {
    await fc.assert(
      fc.asyncProperty(tooLargeYearsArbitrary, async (tooLargeYears) => {
        const result = parseYearsOfExperience(tooLargeYears.toString());
        return result === undefined;
      }),
      { numRuns: 2 }
    );
  });

  it('非数値文字列に対して、parseYearsOfExperienceがundefinedを返す', async () => {
    await fc.assert(
      fc.asyncProperty(nonNumericArbitrary, async (nonNumeric) => {
        const result = parseYearsOfExperience(nonNumeric);
        return result === undefined;
      }),
      { numRuns: 2 }
    );
  });

  it('空文字列に対して、parseYearsOfExperienceがundefinedを返す', async () => {
    const result = parseYearsOfExperience('');
    return result === undefined;
  });
});

/**
 * Feature: engineer-profile-platform, Property 18: バリデーションエラーメッセージ表示
 * 検証: 要件 7.2
 *
 * 任意の無効な入力に対して、対応するフィールドの近くに明確なエラーメッセージが表示される
 */
describe('Property 18: バリデーションエラーメッセージ表示', () => {
  // 無効な名前のジェネレーター（空文字列または101文字以上）
  const invalidNameArbitrary = fc.oneof(
    fc.constant(''),
    fc.string({ minLength: 101, maxLength: 200 })
  );

  // 無効な職種のジェネレーター（空文字列または101文字以上）
  const invalidJobTitleArbitrary = fc.oneof(
    fc.constant(''),
    fc.string({ minLength: 101, maxLength: 200 })
  );

  // 無効な自己紹介のジェネレーター（501文字以上）
  const invalidBioArbitrary = fc.string({ minLength: 501, maxLength: 600 });

  // 無効なスキル配列のジェネレーター（21個以上）
  const invalidSkillsArbitrary = fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
    minLength: 21,
    maxLength: 30,
  });

  // 無効なSNSリンク配列のジェネレーター（11個以上）
  const invalidSocialLinksArbitrary = fc.array(
    fc.record({
      service: fc.string({ minLength: 1, maxLength: 50 }),
      url: fc.webUrl({ validSchemes: ['http', 'https'] }),
    }),
    { minLength: 11, maxLength: 15 }
  );

  // 無効なURLのジェネレーター
  const invalidUrlArbitrary = fc.oneof(
    fc.constant('not-a-url'),
    fc.constant('javascript:alert(1)'),
    fc.constant('invalid url with spaces'),
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('://'))
  );

  it('無効な名前に対して、エラーメッセージが返される', async () => {
    await fc.assert(
      fc.asyncProperty(invalidNameArbitrary, async (invalidName) => {
        const formData = {
          name: invalidName,
          jobTitle: 'エンジニア',
          bio: '',
          skills: [],
          yearsOfExperience: '',
          socialLinks: [],
        };

        const result = validateProfileForm(formData);

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // nameフィールドにエラーがあることを確認
        const hasNameError = 'name' in result.errors;

        // エラーメッセージが存在することを確認
        const hasErrorMessage = hasNameError && result.errors.name.length > 0;

        return hasNameError && hasErrorMessage;
      }),
      { numRuns: 2 }
    );
  });

  it('無効な職種に対して、エラーメッセージが返される', async () => {
    await fc.assert(
      fc.asyncProperty(invalidJobTitleArbitrary, async (invalidJobTitle) => {
        const formData = {
          name: '山田太郎',
          jobTitle: invalidJobTitle,
          bio: '',
          skills: [],
          yearsOfExperience: '',
          socialLinks: [],
        };

        const result = validateProfileForm(formData);

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // jobTitleフィールドにエラーがあることを確認
        const hasJobTitleError = 'jobTitle' in result.errors;

        // エラーメッセージが存在することを確認
        const hasErrorMessage = hasJobTitleError && result.errors.jobTitle.length > 0;

        return hasJobTitleError && hasErrorMessage;
      }),
      { numRuns: 2 }
    );
  });

  it('無効な自己紹介に対して、エラーメッセージが返される', async () => {
    await fc.assert(
      fc.asyncProperty(invalidBioArbitrary, async (invalidBio) => {
        const formData = {
          name: '山田太郎',
          jobTitle: 'エンジニア',
          bio: invalidBio,
          skills: [],
          yearsOfExperience: '',
          socialLinks: [],
        };

        const result = validateProfileForm(formData);

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // bioフィールドにエラーがあることを確認
        const hasBioError = 'bio' in result.errors;

        // エラーメッセージが存在することを確認
        const hasErrorMessage = hasBioError && result.errors.bio.length > 0;

        return hasBioError && hasErrorMessage;
      }),
      { numRuns: 2 }
    );
  });

  it('無効なスキル配列に対して、エラーメッセージが返される', async () => {
    await fc.assert(
      fc.asyncProperty(invalidSkillsArbitrary, async (invalidSkills) => {
        const formData = {
          name: '山田太郎',
          jobTitle: 'エンジニア',
          bio: '',
          skills: invalidSkills,
          yearsOfExperience: '',
          socialLinks: [],
        };

        const result = validateProfileForm(formData);

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // skillsフィールドにエラーがあることを確認
        const hasSkillsError = 'skills' in result.errors;

        // エラーメッセージが存在することを確認
        const hasErrorMessage = hasSkillsError && result.errors.skills.length > 0;

        return hasSkillsError && hasErrorMessage;
      }),
      { numRuns: 2 }
    );
  });

  it('無効なSNSリンク配列に対して、エラーメッセージが返される', async () => {
    await fc.assert(
      fc.asyncProperty(invalidSocialLinksArbitrary, async (invalidSocialLinks) => {
        const formData = {
          name: '山田太郎',
          jobTitle: 'エンジニア',
          bio: '',
          skills: [],
          yearsOfExperience: '',
          socialLinks: invalidSocialLinks,
        };

        const result = validateProfileForm(formData);

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // socialLinksフィールドにエラーがあることを確認
        const hasSocialLinksError = 'socialLinks' in result.errors;

        // エラーメッセージが存在することを確認
        const hasErrorMessage = hasSocialLinksError && result.errors.socialLinks.length > 0;

        return hasSocialLinksError && hasErrorMessage;
      }),
      { numRuns: 2 }
    );
  });

  it('無効なURLに対して、エラーメッセージが返される', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        invalidUrlArbitrary,
        async (service, invalidUrl) => {
          const formData = {
            name: '山田太郎',
            jobTitle: 'エンジニア',
            bio: '',
            skills: [],
            yearsOfExperience: '',
            socialLinks: [
              {
                service,
                url: invalidUrl,
              },
            ],
          };

          const result = validateProfileForm(formData);

          // バリデーションが失敗することを確認
          if (result.success) return false;

          // socialLinks.0.urlフィールドにエラーがあることを確認
          const hasUrlError = 'socialLinks.0.url' in result.errors;

          // エラーメッセージが存在することを確認
          const hasErrorMessage = hasUrlError && result.errors['socialLinks.0.url'].length > 0;

          return hasUrlError && hasErrorMessage;
        }
      ),
      { numRuns: 2 }
    );
  });

  it('複数のフィールドが無効な場合、すべてのフィールドにエラーメッセージが返される', async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidNameArbitrary,
        invalidJobTitleArbitrary,
        async (invalidName, invalidJobTitle) => {
          const formData = {
            name: invalidName,
            jobTitle: invalidJobTitle,
            bio: '',
            skills: [],
            yearsOfExperience: '',
            socialLinks: [],
          };

          const result = validateProfileForm(formData);

          // バリデーションが失敗することを確認
          if (result.success) return false;

          // 両方のフィールドにエラーがあることを確認
          const hasNameError = 'name' in result.errors;
          const hasJobTitleError = 'jobTitle' in result.errors;

          return hasNameError && hasJobTitleError;
        }
      ),
      { numRuns: 2 }
    );
  });
});
