/**
 * ProfileCardコンポーネントのプロパティベーステスト
 */

import { describe, it, afterEach } from "vitest";
import * as fc from "fast-check";
import { render, screen, cleanup } from "@testing-library/react";
import { ProfileCard } from "./ProfileCard";
import type { Profile } from "../../types";
import { PredefinedService } from "../../types";

/**
 * Feature: engineer-profile-platform, Property 12: プロフィール情報の完全表示
 * 検証: 要件 4.2
 *
 * 任意のプロフィールに対して、詳細ページにはすべての設定済みフィールド
 * （名前、職種、自己紹介、スキル、経験年数、SNSリンク）が表示される
 */
describe("Property 12: プロフィール情報の完全表示", () => {
  // 各テストの後にクリーンアップ
  afterEach(() => {
    cleanup();
  });

  // 有効な日付範囲を持つ日付ジェネレーター
  // タイムスタンプを使用してより安全に生成
  const validDateArbitrary = fc
    .integer({
      min: new Date("2000-01-01").getTime(),
      max: new Date("2099-12-31").getTime(),
    })
    .map((timestamp) => new Date(timestamp).toISOString());

  // SNSリンクのジェネレーター
  const socialLinkArbitrary = fc.record({
    id: fc.uuid(),
    service: fc.oneof(
      fc.constantFrom(
        PredefinedService.TWITTER,
        PredefinedService.GITHUB,
        PredefinedService.FACEBOOK
      ),
      fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => s.trim().length > 0) // 空白のみの文字列を除外
    ),
    url: fc.webUrl({ validSchemes: ["http", "https"] }),
  });

  // 完全なプロフィールのジェネレーター（すべてのフィールドが設定されている）
  const fullProfileArbitrary = fc.record({
    id: fc.uuid(),
    name: fc
      .string({ minLength: 2, maxLength: 100 })
      .filter((s) => s.trim().length > 1), // 最低2文字以上
    jobTitle: fc
      .string({ minLength: 2, maxLength: 100 })
      .filter((s) => s.trim().length > 1), // 最低2文字以上
    bio: fc.string({ minLength: 1, maxLength: 500 }),
    skills: fc.array(
      fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => s.trim().length > 0), // 空白のみの文字列を除外
      {
        minLength: 1,
        maxLength: 20,
      }
    ),
    yearsOfExperience: fc.integer({ min: 0, max: 100 }),
    socialLinks: fc.array(socialLinkArbitrary, {
      minLength: 1,
      maxLength: 10,
    }),
    createdAt: validDateArbitrary,
    updatedAt: validDateArbitrary,
  }) as fc.Arbitrary<Profile>;

  it("すべてのフィールドが設定されたプロフィールでは、すべての情報が表示される", () => {
    fc.assert(
      fc.property(fullProfileArbitrary, (profile) => {
        const { container } = render(
          <ProfileCard profile={profile} isOwner={false} />
        );

        // 名前が表示される
        if (!container.textContent?.includes(profile.name)) return false;

        // 職種が表示される
        if (!container.textContent?.includes(profile.jobTitle)) return false;

        // 自己紹介が表示される（bioが設定されている場合）
        if (profile.bio) {
          if (!container.textContent?.includes(profile.bio)) return false;
        }

        // 経験年数が表示される（yearsOfExperienceが設定されている場合）
        if (profile.yearsOfExperience !== undefined) {
          const yearsText = `${profile.yearsOfExperience}年`;
          if (!container.textContent?.includes(yearsText)) return false;
        }

        // すべてのスキルが表示される
        for (const skill of profile.skills) {
          if (!container.textContent?.includes(skill)) return false;
        }

        // すべてのSNSリンクが表示される
        for (const link of profile.socialLinks) {
          // サービス名が表示される
          if (!container.textContent?.includes(link.service)) return false;

          // URLがhref属性として設定されている
          const allLinks = container.querySelectorAll("a");
          const hasLink = Array.from(allLinks).some(
            (a) => a.getAttribute("href") === link.url
          );
          if (!hasLink) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  // 部分的なプロフィールのジェネレーター（オプションフィールドがない）
  const minimalProfileArbitrary = fc.record({
    id: fc.uuid(),
    name: fc
      .string({ minLength: 2, maxLength: 100 })
      .filter((s) => s.trim().length > 1),
    jobTitle: fc
      .string({ minLength: 2, maxLength: 100 })
      .filter((s) => s.trim().length > 1),
    bio: fc.constant(undefined),
    skills: fc.constant([]),
    yearsOfExperience: fc.constant(undefined),
    socialLinks: fc.constant([]),
    createdAt: validDateArbitrary,
    updatedAt: validDateArbitrary,
  }) as fc.Arbitrary<Profile>;

  it("必須フィールドのみのプロフィールでは、必須情報のみが表示される", () => {
    fc.assert(
      fc.property(minimalProfileArbitrary, (profile) => {
        const { container } = render(
          <ProfileCard profile={profile} isOwner={false} />
        );

        // 名前が表示される
        if (!container.textContent?.includes(profile.name)) return false;

        // 職種が表示される
        if (!container.textContent?.includes(profile.jobTitle)) return false;

        // オプションフィールドのセクションタイトルは表示されない
        const bioTitle = screen.queryByText("自己紹介");
        if (bioTitle) return false;

        const skillsTitle = screen.queryByText("スキル");
        if (skillsTitle) return false;

        const linksTitle = screen.queryByText("SNS・外部リンク");
        if (linksTitle) return false;

        const experienceLabel = screen.queryByText("経験年数");
        if (experienceLabel) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });

  // 経験年数が0のプロフィールのジェネレーター
  const zeroExperienceProfileArbitrary = fc.record({
    id: fc.uuid(),
    name: fc
      .string({ minLength: 2, maxLength: 100 })
      .filter((s) => s.trim().length > 1),
    jobTitle: fc
      .string({ minLength: 2, maxLength: 100 })
      .filter((s) => s.trim().length > 1),
    bio: fc.option(fc.string({ minLength: 1, maxLength: 500 }), {
      nil: undefined,
    }),
    skills: fc.array(
      fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => s.trim().length > 0), // 空白のみの文字列を除外
      {
        maxLength: 20,
      }
    ),
    yearsOfExperience: fc.constant(0),
    socialLinks: fc.array(socialLinkArbitrary, { maxLength: 10 }),
    createdAt: validDateArbitrary,
    updatedAt: validDateArbitrary,
  }) as fc.Arbitrary<Profile>;

  it("経験年数が0の場合も表示される", () => {
    fc.assert(
      fc.property(zeroExperienceProfileArbitrary, (profile) => {
        const { container } = render(
          <ProfileCard profile={profile} isOwner={false} />
        );

        // 経験年数が0年として表示される
        return container.textContent?.includes("0年") === true;
      }),
      { numRuns: 100 }
    );
  });

  // 各種サービスのプロフィールジェネレーター
  const profileWithSpecificServiceArbitrary = (
    service: string
  ): fc.Arbitrary<Profile> =>
    fc.record({
      id: fc.uuid(),
      name: fc
        .string({ minLength: 2, maxLength: 100 })
        .filter((s) => s.trim().length > 1),
      jobTitle: fc
        .string({ minLength: 2, maxLength: 100 })
        .filter((s) => s.trim().length > 1),
      bio: fc.option(fc.string({ minLength: 1, maxLength: 500 }), {
        nil: undefined,
      }),
      skills: fc.array(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0), // 空白のみの文字列を除外
        {
          maxLength: 20,
        }
      ),
      yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 }), {
        nil: undefined,
      }),
      socialLinks: fc
        .array(
          fc.record({
            id: fc.uuid(),
            service: fc.constant(service),
            url: fc.webUrl({ validSchemes: ["http", "https"] }),
          }),
          { minLength: 1, maxLength: 3 }
        )
        .map((links) => links as Profile["socialLinks"]),
      createdAt: validDateArbitrary,
      updatedAt: validDateArbitrary,
    }) as fc.Arbitrary<Profile>;

  it("定義済みサービス（Twitter）のリンクが正しく表示される", () => {
    fc.assert(
      fc.property(
        profileWithSpecificServiceArbitrary(PredefinedService.TWITTER),
        (profile) => {
          const { container } = render(
            <ProfileCard profile={profile} isOwner={false} />
          );

          // Twitterサービス名が表示される
          if (!container.textContent?.includes(PredefinedService.TWITTER))
            return false;

          // すべてのTwitterリンクが表示される
          const allLinks = container.querySelectorAll("a");
          for (const link of profile.socialLinks) {
            const hasLink = Array.from(allLinks).some(
              (a) => a.getAttribute("href") === link.url
            );
            if (!hasLink) return false;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("定義済みサービス（GitHub）のリンクが正しく表示される", () => {
    fc.assert(
      fc.property(
        profileWithSpecificServiceArbitrary(PredefinedService.GITHUB),
        (profile) => {
          const { container } = render(
            <ProfileCard profile={profile} isOwner={false} />
          );

          // GitHubサービス名が表示される
          if (!container.textContent?.includes(PredefinedService.GITHUB))
            return false;

          // すべてのGitHubリンクが表示される
          const allLinks = container.querySelectorAll("a");
          for (const link of profile.socialLinks) {
            const hasLink = Array.from(allLinks).some(
              (a) => a.getAttribute("href") === link.url
            );
            if (!hasLink) return false;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("定義済みサービス（Facebook）のリンクが正しく表示される", () => {
    fc.assert(
      fc.property(
        profileWithSpecificServiceArbitrary(PredefinedService.FACEBOOK),
        (profile) => {
          const { container } = render(
            <ProfileCard profile={profile} isOwner={false} />
          );

          // Facebookサービス名が表示される
          if (!container.textContent?.includes(PredefinedService.FACEBOOK))
            return false;

          // すべてのFacebookリンクが表示される
          const allLinks = container.querySelectorAll("a");
          for (const link of profile.socialLinks) {
            const hasLink = Array.from(allLinks).some(
              (a) => a.getAttribute("href") === link.url
            );
            if (!hasLink) return false;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("カスタムサービスのリンクが正しく表示される", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => s.trim().length > 1) // 空白のみの文字列を除外
          .filter(
            (s) =>
              s !== PredefinedService.TWITTER &&
              s !== PredefinedService.GITHUB &&
              s !== PredefinedService.FACEBOOK
          )
          .chain((customService) =>
            profileWithSpecificServiceArbitrary(customService)
          ),
        (profile) => {
          const { container } = render(
            <ProfileCard profile={profile} isOwner={false} />
          );

          // カスタムサービス名が表示される
          for (const link of profile.socialLinks) {
            if (!container.textContent?.includes(link.service)) return false;

            // リンクが表示される
            const allLinks = container.querySelectorAll("a");
            const hasLink = Array.from(allLinks).some(
              (a) => a.getAttribute("href") === link.url
            );
            if (!hasLink) return false;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("複数のスキルがすべて表示される", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc
            .string({ minLength: 2, maxLength: 100 })
            .filter((s) => s.trim().length > 1),
          jobTitle: fc
            .string({ minLength: 2, maxLength: 100 })
            .filter((s) => s.trim().length > 1),
          bio: fc.option(fc.string({ minLength: 1, maxLength: 500 }), {
            nil: undefined,
          }),
          skills: fc.array(
            fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0), // 空白のみの文字列を除外
            {
              minLength: 2,
              maxLength: 10,
            }
          ),
          yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 }), {
            nil: undefined,
          }),
          socialLinks: fc.array(socialLinkArbitrary, { maxLength: 10 }),
          createdAt: validDateArbitrary,
          updatedAt: validDateArbitrary,
        }) as fc.Arbitrary<Profile>,
        (profile) => {
          const { container } = render(
            <ProfileCard profile={profile} isOwner={false} />
          );

          // すべてのスキルが表示される
          for (const skill of profile.skills) {
            // 同じスキルが複数ある可能性があるので、containsで確認
            const skillElements = container.querySelectorAll(
              ".profile-card-skill"
            );
            const hasSkill = Array.from(skillElements).some(
              (el) => el.textContent === skill
            );
            if (!hasSkill) return false;
          }

          // スキルの数が正しい
          const skillElements = container.querySelectorAll(
            ".profile-card-skill"
          );
          return skillElements.length === profile.skills.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});
