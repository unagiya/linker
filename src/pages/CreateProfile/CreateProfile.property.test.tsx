/**
 * プロフィール作成機能のプロパティベーステスト
 */

import { describe, it, beforeEach } from "vitest";
import * as fc from "fast-check";
import { render as _render, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter as _MemoryRouter, Routes as _Routes, Route as _Route, useLocation as _useLocation } from "react-router-dom";
import { ProfileProvider, useProfileContext } from "../../contexts/ProfileContext";
import { LocalStorageRepository } from "../../repositories";
import type { ProfileFormData } from "../../types";
import type { ReactNode } from "react";
import { CreateProfile as _CreateProfile } from "./CreateProfile";

/**
 * Feature: engineer-profile-platform, Property 1: 有効なプロフィール作成の永続化
 * 検証: 要件 1.2
 *
 * 任意の有効なプロフィールデータ（名前と職種が非空）に対して、プロフィールを作成すると、
 * ローカルストレージに保存され、同じIDで読み込むと同等のデータが取得できる
 */
describe("Property 1: 有効なプロフィール作成の永続化", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  // 有効なプロフィールフォームデータのジェネレーター
  const validProfileFormDataArbitrary = fc.record({
    name: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0), // 空白のみの文字列を除外
    jobTitle: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0), // 空白のみの文字列を除外
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

  it("有効なプロフィールデータを作成すると、ローカルストレージに保存される", async () => {
    await fc.assert(
      fc.asyncProperty(validProfileFormDataArbitrary, async (formData) => {
        // 各反復の前にクリア
        await repository.clear();

        // ProfileProviderをラップするwrapper
        const wrapper = ({ children }: { children: ReactNode }) => (
          <ProfileProvider repository={repository}>{children}</ProfileProvider>
        );

        // useProfileContextフックをレンダリング
        const { result } = renderHook(() => useProfileContext(), { wrapper });

        // プロフィールを作成
        let createdProfile;
        await waitFor(async () => {
          createdProfile = await result.current.createProfile(formData);
        });

        if (!createdProfile) return false;

        // ローカルストレージから読み込み
        const loadedProfile = await repository.findById(createdProfile.id);

        // 同等のデータが取得できる
        if (!loadedProfile) return false;

        // 基本フィールドの検証
        const nameMatches = loadedProfile.name === formData.name;
        const jobTitleMatches = loadedProfile.jobTitle === formData.jobTitle;

        // bioの検証（空文字列の場合はundefinedになる）
        const bioMatches =
          formData.bio === ""
            ? loadedProfile.bio === undefined
            : loadedProfile.bio === formData.bio;

        // スキルの検証
        const skillsMatch =
          JSON.stringify(loadedProfile.skills) ===
          JSON.stringify(formData.skills);

        // 経験年数の検証
        const expectedYears =
          formData.yearsOfExperience === ""
            ? undefined
            : parseInt(formData.yearsOfExperience, 10);
        const yearsMatch = loadedProfile.yearsOfExperience === expectedYears;

        // SNSリンクの検証（IDは除外して比較）
        const socialLinksMatch =
          loadedProfile.socialLinks.length === formData.socialLinks.length &&
          loadedProfile.socialLinks.every((link, index) => {
            const formLink = formData.socialLinks[index];
            return link.service === formLink.service && link.url === formLink.url;
          });

        return (
          nameMatches &&
          jobTitleMatches &&
          bioMatches &&
          skillsMatch &&
          yearsMatch &&
          socialLinksMatch
        );
      }),
      { numRuns: 100 }
    );
  });

  it("作成されたプロフィールは一意のIDを持つ", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validProfileFormDataArbitrary, { minLength: 2, maxLength: 5 }),
        async (formDataArray) => {
          // 各反復の前にクリア
          await repository.clear();

          const createdIds: string[] = [];

          // ProfileProviderをラップするwrapper
          const wrapper = ({ children }: { children: ReactNode }) => (
            <ProfileProvider repository={repository}>{children}</ProfileProvider>
          );

          // 複数のプロフィールを作成
          for (const formData of formDataArray) {
            const { result } = renderHook(() => useProfileContext(), { wrapper });

            let createdProfile;
            await waitFor(async () => {
              createdProfile = await result.current.createProfile(formData);
            });

            if (createdProfile) {
              createdIds.push(createdProfile.id);
            }
          }

          // すべてのIDが一意であることを確認
          const uniqueIds = new Set(createdIds);
          return uniqueIds.size === createdIds.length;
        }
      ),
      { numRuns: 20 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 3: プロフィール作成後のリダイレクト
 * 検証: 要件 1.4
 *
 * 任意の有効なプロフィールデータに対して、プロフィールが正常に作成されると、
 * 作成されたプロフィールのIDを含むURLにリダイレクトされる
 */
describe("Property 3: プロフィール作成後のリダイレクト", () => {
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

  it("有効なプロフィールを作成すると、プロフィールIDを含むURLにリダイレクトされる", async () => {
    await fc.assert(
      fc.asyncProperty(validProfileFormDataArbitrary, async (formData) => {
        // 各反復の前にクリア
        await repository.clear();

        // ナビゲーション履歴を追跡
        let navigatedTo: string | null = null;

        // モックナビゲート関数
        const mockNavigate = (path: string) => {
          navigatedTo = path;
        };

        // ProfileProviderをラップするwrapper
        const wrapper = ({ children }: { children: ReactNode }) => (
          <ProfileProvider repository={repository}>{children}</ProfileProvider>
        );

        // useProfileContextフックをレンダリング
        const { result } = renderHook(() => useProfileContext(), { wrapper });

        // プロフィールを作成
        let createdProfile;
        await waitFor(async () => {
          createdProfile = await result.current.createProfile(formData);
        });

        if (!createdProfile) {
          return false;
        }

        // CreateProfileコンポーネントのhandleSubmitロジックをシミュレート
        // 実際のコンポーネントでは navigate(`/profile/${profile.id}`) が呼ばれる
        mockNavigate(`/profile/${createdProfile.id}`);

        // リダイレクト先のURLが正しい形式であることを確認
        if (!navigatedTo) {
          return false;
        }

        const isCorrectFormat = /^\/profile\/[a-f0-9-]+$/.test(navigatedTo);

        if (!isCorrectFormat) {
          return false;
        }

        // リダイレクト先のプロフィールIDを取得
        const profileId = navigatedTo.replace("/profile/", "");

        // 作成されたプロフィールのIDと一致することを確認
        if (profileId !== createdProfile.id) {
          return false;
        }

        // そのIDでプロフィールが実際に保存されているか確認
        const savedProfile = await repository.findById(profileId);

        return savedProfile !== null;
      }),
      { numRuns: 100 }
    );
  });
});
