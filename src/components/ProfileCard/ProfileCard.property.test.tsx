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

/**
 * Feature: engineer-profile-platform, Property 13: 外部リンクのレンダリング
 * 検証: 要件 4.3
 *
 * 任意のURL付きプロフィールに対して、GitHub、Twitter、ポートフォリオのURLが
 * クリック可能なリンク要素としてレンダリングされる
 */
describe("Property 13: 外部リンクのレンダリング", () => {
  // 各テストの後にクリーンアップ
  afterEach(() => {
    cleanup();
  });

  // 有効な日付範囲を持つ日付ジェネレーター
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

  // URL付きプロフィールのジェネレーター
  const profileWithLinksArbitrary = fc.record({
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
        .filter((s) => s.trim().length > 0),
      { maxLength: 20 }
    ),
    yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 }), {
      nil: undefined,
    }),
    socialLinks: fc.array(socialLinkArbitrary, {
      minLength: 1,
      maxLength: 10,
    }),
    createdAt: validDateArbitrary,
    updatedAt: validDateArbitrary,
  }) as fc.Arbitrary<Profile>;

  it("すべての外部リンクがクリック可能なリンク要素としてレンダリングされる", () => {
    fc.assert(
      fc.property(profileWithLinksArbitrary, (profile) => {
        const { container } = render(
          <ProfileCard profile={profile} isOwner={false} />
        );

        // すべてのSNSリンクがa要素としてレンダリングされている
        const allLinks = container.querySelectorAll("a");

        for (const socialLink of profile.socialLinks) {
          // 各SNSリンクのURLがhref属性として設定されている
          const hasLink = Array.from(allLinks).some(
            (a) => a.getAttribute("href") === socialLink.url
          );
          if (!hasLink) return false;

          // リンクがクリック可能（target="_blank"とrel="noopener noreferrer"が設定されている）
          const linkElement = Array.from(allLinks).find(
            (a) => a.getAttribute("href") === socialLink.url
          );
          if (!linkElement) return false;
          if (linkElement.getAttribute("target") !== "_blank") return false;
          if (linkElement.getAttribute("rel") !== "noopener noreferrer")
            return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("各リンクにサービス名が表示される", () => {
    fc.assert(
      fc.property(profileWithLinksArbitrary, (profile) => {
        const { container } = render(
          <ProfileCard profile={profile} isOwner={false} />
        );

        // すべてのSNSリンクのサービス名が表示されている
        for (const socialLink of profile.socialLinks) {
          if (!container.textContent?.includes(socialLink.service))
            return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("定義済みサービス（GitHub、Twitter、Facebook）のリンクが正しくレンダリングされる", () => {
    // 定義済みサービスのみを含むプロフィールジェネレーター
    const predefinedServicesProfileArbitrary = fc.record({
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
          .filter((s) => s.trim().length > 0),
        { maxLength: 20 }
      ),
      yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 }), {
        nil: undefined,
      }),
      socialLinks: fc.array(
        fc.record({
          id: fc.uuid(),
          service: fc.constantFrom(
            PredefinedService.TWITTER,
            PredefinedService.GITHUB,
            PredefinedService.FACEBOOK
          ),
          url: fc.webUrl({ validSchemes: ["http", "https"] }),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      createdAt: validDateArbitrary,
      updatedAt: validDateArbitrary,
    }) as fc.Arbitrary<Profile>;

    fc.assert(
      fc.property(predefinedServicesProfileArbitrary, (profile) => {
        const { container } = render(
          <ProfileCard profile={profile} isOwner={false} />
        );

        const allLinks = container.querySelectorAll("a");

        // すべての定義済みサービスのリンクが正しくレンダリングされている
        for (const socialLink of profile.socialLinks) {
          const linkElement = Array.from(allLinks).find(
            (a) => a.getAttribute("href") === socialLink.url
          );
          if (!linkElement) return false;

          // サービス名が表示されている
          if (!container.textContent?.includes(socialLink.service))
            return false;

          // 適切なアイコンが表示されている
          const hasIcon =
            (socialLink.service === PredefinedService.GITHUB &&
              container.textContent?.includes("💻")) ||
            (socialLink.service === PredefinedService.TWITTER &&
              container.textContent?.includes("🐦")) ||
            (socialLink.service === PredefinedService.FACEBOOK &&
              container.textContent?.includes("👥"));

          if (!hasIcon) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("カスタムサービスのリンクが正しくレンダリングされる", () => {
    // カスタムサービスのみを含むプロフィールジェネレーター
    const customServicesProfileArbitrary = fc.record({
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
          .filter((s) => s.trim().length > 0),
        { maxLength: 20 }
      ),
      yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 }), {
        nil: undefined,
      }),
      socialLinks: fc.array(
        fc.record({
          id: fc.uuid(),
          service: fc
            .string({ minLength: 2, maxLength: 50 })
            .filter((s) => s.trim().length > 1)
            .filter(
              (s) =>
                s !== PredefinedService.TWITTER &&
                s !== PredefinedService.GITHUB &&
                s !== PredefinedService.FACEBOOK
            ),
          url: fc.webUrl({ validSchemes: ["http", "https"] }),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      createdAt: validDateArbitrary,
      updatedAt: validDateArbitrary,
    }) as fc.Arbitrary<Profile>;

    fc.assert(
      fc.property(customServicesProfileArbitrary, (profile) => {
        const { container } = render(
          <ProfileCard profile={profile} isOwner={false} />
        );

        const allLinks = container.querySelectorAll("a");

        // すべてのカスタムサービスのリンクが正しくレンダリングされている
        for (const socialLink of profile.socialLinks) {
          const linkElement = Array.from(allLinks).find(
            (a) => a.getAttribute("href") === socialLink.url
          );
          if (!linkElement) return false;

          // カスタムサービス名が表示されている
          if (!container.textContent?.includes(socialLink.service))
            return false;

          // デフォルトアイコン（🔗）が表示されている
          if (!container.textContent?.includes("🔗")) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("複数の異なるサービスのリンクが同時に正しくレンダリングされる", () => {
    // 定義済みとカスタムサービスが混在するプロフィールジェネレーター
    const mixedServicesProfileArbitrary = fc.record({
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
          .filter((s) => s.trim().length > 0),
        { maxLength: 20 }
      ),
      yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 }), {
        nil: undefined,
      }),
      socialLinks: fc
        .tuple(
          // 定義済みサービス
          fc.array(
            fc.record({
              id: fc.uuid(),
              service: fc.constantFrom(
                PredefinedService.TWITTER,
                PredefinedService.GITHUB,
                PredefinedService.FACEBOOK
              ),
              url: fc.webUrl({ validSchemes: ["http", "https"] }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          // カスタムサービス
          fc.array(
            fc.record({
              id: fc.uuid(),
              service: fc
                .string({ minLength: 2, maxLength: 50 })
                .filter((s) => s.trim().length > 1)
                .filter(
                  (s) =>
                    s !== PredefinedService.TWITTER &&
                    s !== PredefinedService.GITHUB &&
                    s !== PredefinedService.FACEBOOK
                ),
              url: fc.webUrl({ validSchemes: ["http", "https"] }),
            }),
            { minLength: 1, maxLength: 3 }
          )
        )
        .map(([predefined, custom]) => [...predefined, ...custom]),
      createdAt: validDateArbitrary,
      updatedAt: validDateArbitrary,
    }) as fc.Arbitrary<Profile>;

    fc.assert(
      fc.property(mixedServicesProfileArbitrary, (profile) => {
        const { container } = render(
          <ProfileCard profile={profile} isOwner={false} />
        );

        const allLinks = container.querySelectorAll("a");

        // すべてのリンクが正しくレンダリングされている
        for (const socialLink of profile.socialLinks) {
          // リンク要素が存在する
          const linkElement = Array.from(allLinks).find(
            (a) => a.getAttribute("href") === socialLink.url
          );
          if (!linkElement) return false;

          // target="_blank"とrel="noopener noreferrer"が設定されている
          if (linkElement.getAttribute("target") !== "_blank") return false;
          if (linkElement.getAttribute("rel") !== "noopener noreferrer")
            return false;

          // サービス名が表示されている
          if (!container.textContent?.includes(socialLink.service))
            return false;
        }

        // リンクの数が正しい
        return allLinks.length >= profile.socialLinks.length;
      }),
      { numRuns: 100 }
    );
  });

  it("リンクのURLが正しくエンコードされている", () => {
    fc.assert(
      fc.property(profileWithLinksArbitrary, (profile) => {
        const { container } = render(
          <ProfileCard profile={profile} isOwner={false} />
        );

        const allLinks = container.querySelectorAll("a");

        // すべてのリンクのhref属性が元のURLと一致する
        for (const socialLink of profile.socialLinks) {
          const linkElement = Array.from(allLinks).find(
            (a) => a.getAttribute("href") === socialLink.url
          );
          if (!linkElement) return false;

          // href属性が正しく設定されている
          if (linkElement.getAttribute("href") !== socialLink.url) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
