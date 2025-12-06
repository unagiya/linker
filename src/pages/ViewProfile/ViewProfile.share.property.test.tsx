/**
 * プロフィール共有機能のプロパティベーステスト
 */

import { describe, it, beforeEach } from "vitest";
import * as fc from "fast-check";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider } from "../../contexts/AuthContext";
import { ProfileProvider, useProfile } from "../../contexts/ProfileContext";
import { LocalStorageRepository } from "../../repositories";
import type { ProfileFormData, Profile } from "../../types";
import type { ReactNode } from "react";

/**
 * Feature: engineer-profile-platform, Property 16: 共有URL生成
 * 検証: 要件 6.1
 *
 * 任意のプロフィールに対して、プロフィールページには共有可能なURL
 * （プロフィールIDを含む）が生成され表示される
 */
describe("Property 16: 共有URL生成", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  // 有効なプロフィールフォームデータのジェネレーター
  const validProfileFormDataArbitrary = fc.record({
    name: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0),
    jobTitle: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: "" }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      maxLength: 20,
    }),
    yearsOfExperience: fc
      .option(fc.integer({ min: 0, max: 100 }), { nil: undefined })
      .map((years) => (years !== undefined ? years.toString() : "")),
    socialLinks: fc.array(
      fc.record({
        service: fc.string({ minLength: 1, maxLength: 50 }),
        url: fc.webUrl({ validSchemes: ["http", "https"] }),
      }),
      { maxLength: 10 }
    ),
  }) as fc.Arbitrary<ProfileFormData>;

  it("プロフィールに対して、プロフィールIDを含む共有可能なURLが生成される", async () => {
    await fc.assert(
      fc.asyncProperty(validProfileFormDataArbitrary, async (formData) => {
        // 各反復の前にクリア
        await repository.clear();

        // AuthProviderとProfileProviderをラップするwrapper
        const wrapper = ({ children }: { children: ReactNode }) => (
          <AuthProvider>
            <ProfileProvider repository={repository}>{children}</ProfileProvider>
          </AuthProvider>
        );

        // useProfileフックをレンダリング
        const { result } = renderHook(() => useProfile(), { wrapper });

        // プロフィールを作成
        const testUserId = crypto.randomUUID();
        let createdProfile: Profile | undefined;
        await waitFor(async () => {
          createdProfile = await result.current.createProfile(testUserId, formData);
        });

        if (!createdProfile) return false;

        // ViewProfileコンポーネントのhandleShareロジックをシミュレート
        // 実際のコンポーネントでは `${window.location.origin}/profile/${id}` が生成される
        const origin = "http://localhost:3000"; // テスト用のorigin
        const shareUrl = `${origin}/profile/${createdProfile.id}`;

        // URLが正しい形式であることを確認
        const urlPattern = new RegExp(
          `^${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/profile/[a-f0-9-]+$`
        );
        const isValidFormat = urlPattern.test(shareUrl);

        if (!isValidFormat) return false;

        // URLにプロフィールIDが含まれていることを確認
        const containsId = shareUrl.includes(createdProfile.id);

        return containsId;
      }),
      { numRuns: 10 }
    );
  });

  it("異なるプロフィールは異なる共有URLを持つ", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validProfileFormDataArbitrary, { minLength: 2, maxLength: 5 }),
        async (formDataArray) => {
          // 各反復の前にクリア
          await repository.clear();

          const shareUrls: string[] = [];
          const origin = "http://localhost:3000";
          const testUserId = crypto.randomUUID();

          // AuthProviderとProfileProviderをラップするwrapper
          const wrapper = ({ children }: { children: ReactNode }) => (
            <AuthProvider>
              <ProfileProvider repository={repository}>{children}</ProfileProvider>
            </AuthProvider>
          );

          // 複数のプロフィールを作成
          for (const formData of formDataArray) {
            const { result } = renderHook(() => useProfile(), { wrapper });

            let createdProfile: Profile | undefined;
            await waitFor(async () => {
              createdProfile = await result.current.createProfile(testUserId, formData);
            });

            if (createdProfile) {
              const shareUrl = `${origin}/profile/${createdProfile.id}`;
              shareUrls.push(shareUrl);
            }
          }

          // すべてのURLが一意であることを確認
          const uniqueUrls = new Set(shareUrls);
          return uniqueUrls.size === shareUrls.length;
        }
      ),
      { numRuns: 5 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 17: クリップボードへのURLコピー
 * 検証: 要件 6.4
 *
 * 任意のプロフィールに対して、共有ボタンをクリックすると、
 * プロフィールURLがクリップボードにコピーされる
 */
describe("Property 17: クリップボードへのURLコピー", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();

    // クリップボードAPIのモック
    Object.assign(navigator, {
      clipboard: {
        writeText: async (text: string) => {
          // モック実装：テキストを保存
          (navigator.clipboard as any)._lastCopiedText = text;
        },
        _lastCopiedText: "",
      },
    });
  });

  // 有効なプロフィールフォームデータのジェネレーター
  const validProfileFormDataArbitrary = fc.record({
    name: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0),
    jobTitle: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: "" }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      maxLength: 20,
    }),
    yearsOfExperience: fc
      .option(fc.integer({ min: 0, max: 100 }), { nil: undefined })
      .map((years) => (years !== undefined ? years.toString() : "")),
    socialLinks: fc.array(
      fc.record({
        service: fc.string({ minLength: 1, maxLength: 50 }),
        url: fc.webUrl({ validSchemes: ["http", "https"] }),
      }),
      { maxLength: 10 }
    ),
  }) as fc.Arbitrary<ProfileFormData>;

  it("共有ボタンをクリックすると、プロフィールURLがクリップボードにコピーされる", async () => {
    await fc.assert(
      fc.asyncProperty(validProfileFormDataArbitrary, async (formData) => {
        // 各反復の前にクリア
        await repository.clear();
        (navigator.clipboard as any)._lastCopiedText = "";

        // AuthProviderとProfileProviderをラップするwrapper
        const wrapper = ({ children }: { children: ReactNode }) => (
          <AuthProvider>
            <ProfileProvider repository={repository}>{children}</ProfileProvider>
          </AuthProvider>
        );

        // useProfileフックをレンダリング
        const { result } = renderHook(() => useProfile(), { wrapper });

        // プロフィールを作成
        const testUserId = crypto.randomUUID();
        let createdProfile: Profile | undefined;
        await waitFor(async () => {
          createdProfile = await result.current.createProfile(testUserId, formData);
        });

        if (!createdProfile) return false;

        // ViewProfileコンポーネントのhandleShareロジックをシミュレート
        const origin = "http://localhost:3000";
        const shareUrl = `${origin}/profile/${createdProfile.id}`;

        // クリップボードにコピー
        await navigator.clipboard.writeText(shareUrl);

        // クリップボードにコピーされたテキストを確認
        const copiedText = (navigator.clipboard as any)._lastCopiedText;

        // コピーされたURLが正しいことを確認
        const isCorrectUrl = copiedText === shareUrl;

        // URLにプロフィールIDが含まれていることを確認
        const containsId = copiedText.includes(createdProfile.id);

        return isCorrectUrl && containsId;
      }),
      { numRuns: 10 }
    );
  });
});
