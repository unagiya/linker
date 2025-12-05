/**
 * バリデーション機能のプロパティベーステスト
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { validateProfileForm } from "./validation";

/**
 * Feature: engineer-profile-platform, Property 18: バリデーションエラーメッセージ表示
 * 検証: 要件 7.2
 *
 * 任意の無効な入力に対して、対応するフィールドの近くに明確なエラーメッセージが表示される
 */
describe("Property 18: バリデーションエラーメッセージ表示", () => {
  // 無効な名前のジェネレーター（空文字列または101文字以上）
  const invalidNameArbitrary = fc.oneof(
    fc.constant(""),
    fc.string({ minLength: 101, maxLength: 200 })
  );

  // 無効な職種のジェネレーター（空文字列または101文字以上）
  const invalidJobTitleArbitrary = fc.oneof(
    fc.constant(""),
    fc.string({ minLength: 101, maxLength: 200 })
  );

  // 無効な自己紹介のジェネレーター（501文字以上）
  const invalidBioArbitrary = fc.string({ minLength: 501, maxLength: 600 });

  // 無効なスキル配列のジェネレーター（21個以上）
  const invalidSkillsArbitrary = fc.array(
    fc.string({ minLength: 1, maxLength: 50 }),
    { minLength: 21, maxLength: 30 }
  );

  // 無効なSNSリンク配列のジェネレーター（11個以上）
  const invalidSocialLinksArbitrary = fc.array(
    fc.record({
      service: fc.string({ minLength: 1, maxLength: 50 }),
      url: fc.webUrl({ validSchemes: ["http", "https"] }),
    }),
    { minLength: 11, maxLength: 15 }
  );

  // 無効なURLのジェネレーター
  const invalidUrlArbitrary = fc.oneof(
    fc.constant("not-a-url"),
    fc.constant("javascript:alert(1)"),
    fc.constant("invalid url with spaces"),
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("://"))
  );

  it("無効な名前に対して、エラーメッセージが返される", async () => {
    await fc.assert(
      fc.asyncProperty(invalidNameArbitrary, async (invalidName) => {
        const formData = {
          name: invalidName,
          jobTitle: "エンジニア",
          bio: "",
          skills: [],
          yearsOfExperience: "",
          socialLinks: [],
        };

        const result = validateProfileForm(formData);

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // nameフィールドにエラーがあることを確認
        const hasNameError = "name" in result.errors;

        // エラーメッセージが存在することを確認
        const hasErrorMessage =
          hasNameError && result.errors.name.length > 0;

        return hasNameError && hasErrorMessage;
      }),
      { numRuns: 100 }
    );
  });

  it("無効な職種に対して、エラーメッセージが返される", async () => {
    await fc.assert(
      fc.asyncProperty(invalidJobTitleArbitrary, async (invalidJobTitle) => {
        const formData = {
          name: "山田太郎",
          jobTitle: invalidJobTitle,
          bio: "",
          skills: [],
          yearsOfExperience: "",
          socialLinks: [],
        };

        const result = validateProfileForm(formData);

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // jobTitleフィールドにエラーがあることを確認
        const hasJobTitleError = "jobTitle" in result.errors;

        // エラーメッセージが存在することを確認
        const hasErrorMessage =
          hasJobTitleError && result.errors.jobTitle.length > 0;

        return hasJobTitleError && hasErrorMessage;
      }),
      { numRuns: 100 }
    );
  });

  it("無効な自己紹介に対して、エラーメッセージが返される", async () => {
    await fc.assert(
      fc.asyncProperty(invalidBioArbitrary, async (invalidBio) => {
        const formData = {
          name: "山田太郎",
          jobTitle: "エンジニア",
          bio: invalidBio,
          skills: [],
          yearsOfExperience: "",
          socialLinks: [],
        };

        const result = validateProfileForm(formData);

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // bioフィールドにエラーがあることを確認
        const hasBioError = "bio" in result.errors;

        // エラーメッセージが存在することを確認
        const hasErrorMessage = hasBioError && result.errors.bio.length > 0;

        return hasBioError && hasErrorMessage;
      }),
      { numRuns: 100 }
    );
  });

  it("無効なスキル配列に対して、エラーメッセージが返される", async () => {
    await fc.assert(
      fc.asyncProperty(invalidSkillsArbitrary, async (invalidSkills) => {
        const formData = {
          name: "山田太郎",
          jobTitle: "エンジニア",
          bio: "",
          skills: invalidSkills,
          yearsOfExperience: "",
          socialLinks: [],
        };

        const result = validateProfileForm(formData);

        // バリデーションが失敗することを確認
        if (result.success) return false;

        // skillsフィールドにエラーがあることを確認
        const hasSkillsError = "skills" in result.errors;

        // エラーメッセージが存在することを確認
        const hasErrorMessage =
          hasSkillsError && result.errors.skills.length > 0;

        return hasSkillsError && hasErrorMessage;
      }),
      { numRuns: 100 }
    );
  });

  it("無効なSNSリンク配列に対して、エラーメッセージが返される", async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidSocialLinksArbitrary,
        async (invalidSocialLinks) => {
          const formData = {
            name: "山田太郎",
            jobTitle: "エンジニア",
            bio: "",
            skills: [],
            yearsOfExperience: "",
            socialLinks: invalidSocialLinks,
          };

          const result = validateProfileForm(formData);

          // バリデーションが失敗することを確認
          if (result.success) return false;

          // socialLinksフィールドにエラーがあることを確認
          const hasSocialLinksError = "socialLinks" in result.errors;

          // エラーメッセージが存在することを確認
          const hasErrorMessage =
            hasSocialLinksError && result.errors.socialLinks.length > 0;

          return hasSocialLinksError && hasErrorMessage;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("無効なURLに対して、エラーメッセージが返される", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        invalidUrlArbitrary,
        async (service, invalidUrl) => {
          const formData = {
            name: "山田太郎",
            jobTitle: "エンジニア",
            bio: "",
            skills: [],
            yearsOfExperience: "",
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
          const hasUrlError = "socialLinks.0.url" in result.errors;

          // エラーメッセージが存在することを確認
          const hasErrorMessage =
            hasUrlError && result.errors["socialLinks.0.url"].length > 0;

          return hasUrlError && hasErrorMessage;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("複数のフィールドが無効な場合、すべてのフィールドにエラーメッセージが返される", async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidNameArbitrary,
        invalidJobTitleArbitrary,
        async (invalidName, invalidJobTitle) => {
          const formData = {
            name: invalidName,
            jobTitle: invalidJobTitle,
            bio: "",
            skills: [],
            yearsOfExperience: "",
            socialLinks: [],
          };

          const result = validateProfileForm(formData);

          // バリデーションが失敗することを確認
          if (result.success) return false;

          // 両方のフィールドにエラーがあることを確認
          const hasNameError = "name" in result.errors;
          const hasJobTitleError = "jobTitle" in result.errors;

          return hasNameError && hasJobTitleError;
        }
      ),
      { numRuns: 100 }
    );
  });
});
