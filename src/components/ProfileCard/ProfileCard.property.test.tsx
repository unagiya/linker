/**
 * ProfileCardコンポーネントのプロパティベーステスト
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import * as fc from "fast-check";
import { ProfileCard } from "./ProfileCard";
import type { Profile, SocialLink } from "../../types/profile";

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

describe("ProfileCard - Property Based Tests", () => {
  /**
   * Feature: engineer-profile-platform, Property 26: プロフィール情報の完全表示
   * 任意のプロフィールに対して、詳細ページにはすべての設定済みフィールド
   * （名前、職種、自己紹介、スキル、経験年数、SNSリンク）が表示される
   * Validates: Requirements 6.2
   */
  describe("Property 26: プロフィール情報の完全表示", () => {
    // 空白文字のみを除外し、末尾の空白もトリムし、連続する空白を1つにまとめた文字列ジェネレーター
    const nonEmptyString = (minLength: number, maxLength: number) =>
      fc
        .string({ minLength, maxLength })
        .filter((s) => s.trim().length > 0)
        .map((s) => s.trim().replace(/\s+/g, " "));

    // プロフィールジェネレーター
    const profileArbitrary = fc.record({
      id: fc.uuid(),
      user_id: fc.uuid(),
      name: nonEmptyString(1, 100),
      jobTitle: nonEmptyString(1, 100),
      bio: fc.option(nonEmptyString(1, 500), {
        nil: undefined,
      }),
      skills: fc.array(nonEmptyString(1, 50), {
        minLength: 0,
        maxLength: 20,
      }),
      yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 }), {
        nil: undefined,
      }),
      socialLinks: fc
        .array(
          fc.record({
            service: fc.oneof(
              fc.constant("github"),
              fc.constant("twitter"),
              fc.constant("facebook"),
              nonEmptyString(1, 50)
            ),
            url: fc.webUrl(),
          }),
          { minLength: 0, maxLength: 10 }
        )
        .map((links) =>
          links.map((link, index) => ({
            ...link,
            id: `link-${index}`,
          }))
        ),
      createdAt: fc.constant("2024-01-01T00:00:00.000Z"),
      updatedAt: fc.constant("2024-01-01T00:00:00.000Z"),
    });

    it("任意のプロフィールに対して、名前と職種が常に表示される", () => {
      fc.assert(
        fc.property(profileArbitrary, (profile: Profile) => {
          cleanup();
          render(<ProfileCard profile={profile} />);

          // 名前と職種は必須フィールドなので常に表示される
          // クラス名で要素を特定して、テキストコンテンツを確認
          const nameElement = document.querySelector(".profile-card-name");
          const jobTitleElement = document.querySelector(
            ".profile-card-job-title"
          );

          expect(nameElement).toBeInTheDocument();
          expect(nameElement).toHaveTextContent(profile.name);
          expect(jobTitleElement).toBeInTheDocument();
          expect(jobTitleElement).toHaveTextContent(profile.jobTitle);
        }),
        { numRuns: 100 }
      );
    });

    it("任意のプロフィールに対して、自己紹介が設定されている場合は表示される", () => {
      fc.assert(
        fc.property(profileArbitrary, (profile: Profile) => {
          cleanup();
          render(<ProfileCard profile={profile} />);

          if (profile.bio) {
            // 自己紹介が設定されている場合は表示される
            const bioElement = document.querySelector(".profile-card-bio");
            expect(bioElement).toBeInTheDocument();
            expect(bioElement).toHaveTextContent(profile.bio);
            expect(screen.getByText("自己紹介")).toBeInTheDocument();
          } else {
            // 自己紹介が設定されていない場合は表示されない
            expect(screen.queryByText("自己紹介")).not.toBeInTheDocument();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("任意のプロフィールに対して、経験年数が設定されている場合は表示される", () => {
      fc.assert(
        fc.property(profileArbitrary, (profile: Profile) => {
          cleanup();
          render(<ProfileCard profile={profile} />);

          if (
            profile.yearsOfExperience !== undefined &&
            profile.yearsOfExperience !== null
          ) {
            // 経験年数が設定されている場合は表示される
            expect(
              screen.getByText(`${profile.yearsOfExperience}年`)
            ).toBeInTheDocument();
            expect(screen.getByText("経験年数")).toBeInTheDocument();
          } else {
            // 経験年数が設定されていない場合は表示されない
            expect(screen.queryByText("経験年数")).not.toBeInTheDocument();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("任意のプロフィールに対して、すべてのスキルが表示される", () => {
      fc.assert(
        fc.property(profileArbitrary, (profile: Profile) => {
          cleanup();
          render(<ProfileCard profile={profile} />);

          if (profile.skills.length > 0) {
            // スキルが設定されている場合、すべてのスキルが表示される
            expect(screen.getByText("スキル")).toBeInTheDocument();
            const skillTags = document.querySelectorAll(
              ".profile-card-skill-tag"
            );
            expect(skillTags.length).toBe(profile.skills.length);
            
            // 各スキルタグのテキストを確認
            profile.skills.forEach((skill, index) => {
              expect(skillTags[index]).toHaveTextContent(skill);
            });
          } else {
            // スキルが設定されていない場合は表示されない
            expect(screen.queryByText("スキル")).not.toBeInTheDocument();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("任意のプロフィールに対して、すべてのSNSリンクが表示される", () => {
      fc.assert(
        fc.property(profileArbitrary, (profile: Profile) => {
          cleanup();
          render(<ProfileCard profile={profile} />);

          if (profile.socialLinks.length > 0) {
            // SNSリンクが設定されている場合、すべてのリンクが表示される
            expect(screen.getByText("SNS・外部リンク")).toBeInTheDocument();
            
            // すべてのリンク要素を取得
            const linkElements = screen.getAllByRole("link");
            
            // リンクの数が一致することを確認
            expect(linkElements.length).toBe(profile.socialLinks.length);
            
            // 各リンクの属性を確認
            profile.socialLinks.forEach((link: SocialLink, index: number) => {
              expect(linkElements[index]).toHaveAttribute("href", link.url);
              expect(linkElements[index]).toHaveAttribute("target", "_blank");
              expect(linkElements[index]).toHaveAttribute("rel", "noopener noreferrer");
            });
          } else {
            // SNSリンクが設定されていない場合は表示されない
            expect(
              screen.queryByText("SNS・外部リンク")
            ).not.toBeInTheDocument();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("任意のプロフィールに対して、すべての設定済みフィールドが同時に表示される", () => {
      fc.assert(
        fc.property(profileArbitrary, (profile: Profile) => {
          cleanup();
          render(<ProfileCard profile={profile} />);

          // 必須フィールド
          const nameElement = document.querySelector(".profile-card-name");
          const jobTitleElement = document.querySelector(
            ".profile-card-job-title"
          );
          expect(nameElement).toHaveTextContent(profile.name);
          expect(jobTitleElement).toHaveTextContent(profile.jobTitle);

          // オプショナルフィールド（設定されている場合のみ）
          if (profile.bio) {
            const bioElement = document.querySelector(".profile-card-bio");
            expect(bioElement).toHaveTextContent(profile.bio);
          }

          if (
            profile.yearsOfExperience !== undefined &&
            profile.yearsOfExperience !== null
          ) {
            expect(
              screen.getByText(`${profile.yearsOfExperience}年`)
            ).toBeInTheDocument();
          }

          if (profile.skills.length > 0) {
            const skillTags = document.querySelectorAll(
              ".profile-card-skill-tag"
            );
            expect(skillTags.length).toBe(profile.skills.length);
          }

          if (profile.socialLinks.length > 0) {
            const linkElements = screen.getAllByRole("link");
            expect(linkElements.length).toBe(profile.socialLinks.length);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
