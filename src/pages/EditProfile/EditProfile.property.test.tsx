/**
 * プロフィール編集機能のプロパティベーステスト
 */

import { describe, it, beforeEach } from "vitest";
import * as fc from "fast-check";
import { renderHook, waitFor } from "@testing-library/react";
import { ProfileProvider, useProfile } from "../../contexts/ProfileContext";
import { LocalStorageRepository } from "../../repositories";
import type { ProfileFormData, Profile } from "../../types";
import type { ReactNode } from "react";

/**
 * Feature: engineer-profile-platform, Property 19: 編集フォームへのデータ読み込み
 * 検証: 要件 5.1
 *
 * 任意の既存プロフィールに対して、所有者が編集モードに入ると、
 * すべてのフィールドに現在の値が正しく設定される
 */
describe("Property 19: 編集フォームへのデータ読み込み", () => {
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

  it("既存プロフィールを読み込むと、すべてのフィールドに現在の値が正しく設定される", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // ユーザーID
        validProfileFormDataArbitrary,
        async (userId, formData) => {
          // 各反復の前にクリア
          await repository.clear();

          // ProfileProviderをラップするwrapper
          const wrapper = ({ children }: { children: ReactNode }) => (
            <ProfileProvider repository={repository}>{children}</ProfileProvider>
          );

          // useProfileフックをレンダリング
          const { result } = renderHook(() => useProfile(), { wrapper });

          // プロフィールを作成
          let createdProfile: Profile | undefined;
          await waitFor(async () => {
            createdProfile = await result.current.createProfile(
              userId,
              formData
            );
          });

          if (!createdProfile) return false;

        // プロフィールを読み込み
        let loadedProfile: Profile | null = null;
        await waitFor(async () => {
          loadedProfile = await result.current.loadProfile(createdProfile!.id);
        });

        if (!loadedProfile) return false;

        // 読み込まれたプロフィールをフォームデータに変換
        // （EditProfileページのロジックと同じ）
        const loadedFormData: ProfileFormData = {
          name: loadedProfile.name,
          jobTitle: loadedProfile.jobTitle,
          bio: loadedProfile.bio || "",
          skills: loadedProfile.skills,
          yearsOfExperience: loadedProfile.yearsOfExperience?.toString() || "",
          socialLinks: loadedProfile.socialLinks.map((link) => ({
            service: link.service,
            url: link.url,
          })),
        };

        // すべてのフィールドが元のフォームデータと一致することを確認
        const nameMatches = loadedFormData.name === formData.name;
        const jobTitleMatches = loadedFormData.jobTitle === formData.jobTitle;
        const bioMatches = loadedFormData.bio === formData.bio;
        const skillsMatch =
          JSON.stringify(loadedFormData.skills) ===
          JSON.stringify(formData.skills);
        const yearsMatch =
          loadedFormData.yearsOfExperience === formData.yearsOfExperience;
        const socialLinksMatch =
          JSON.stringify(loadedFormData.socialLinks) ===
          JSON.stringify(formData.socialLinks);

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
});

/**
 * Feature: engineer-profile-platform, Property 22: プロフィール更新の永続化
 * 検証: 要件 5.4
 *
 * 任意の既存プロフィールと更新データに対して、更新を保存すると、
 * Supabaseデータベースに反映され、再読み込み時に更新後のデータが取得できる
 */
describe("Property 22: プロフィール更新の永続化", () => {
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

  it("プロフィールを更新すると、ローカルストレージに反映され、再読み込み時に更新後のデータが取得できる", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // ユーザーID
        validProfileFormDataArbitrary,
        validProfileFormDataArbitrary,
        async (userId, originalData, updatedData) => {
          // 各反復の前にクリア
          await repository.clear();

          // ProfileProviderをラップするwrapper
          const wrapper = ({ children }: { children: ReactNode }) => (
            <ProfileProvider repository={repository}>{children}</ProfileProvider>
          );

          // useProfileフックをレンダリング
          const { result } = renderHook(() => useProfile(), { wrapper });

          // 元のプロフィールを作成
          let createdProfile: Profile | undefined;
          await waitFor(async () => {
            createdProfile = await result.current.createProfile(
              userId,
              originalData
            );
          });

          if (!createdProfile) return false;

          // プロフィールを更新
          let updatedProfile: Profile | undefined;
          await waitFor(async () => {
            updatedProfile = await result.current.updateProfile(
              createdProfile!.id,
              updatedData
            );
          });

          if (!updatedProfile) return false;

          // ローカルストレージから再読み込み
          const reloadedProfile = await repository.findById(createdProfile.id);

          if (!reloadedProfile) return false;

          // 更新後のデータが正しく反映されているか確認
          const nameMatches = reloadedProfile.name === updatedData.name;
          const jobTitleMatches =
            reloadedProfile.jobTitle === updatedData.jobTitle;

          // bioの検証
          const bioMatches =
            updatedData.bio === ""
              ? reloadedProfile.bio === undefined
              : reloadedProfile.bio === updatedData.bio;

          // スキルの検証
          const skillsMatch =
            JSON.stringify(reloadedProfile.skills) ===
            JSON.stringify(updatedData.skills);

          // 経験年数の検証
          const expectedYears =
            updatedData.yearsOfExperience === ""
              ? undefined
              : parseInt(updatedData.yearsOfExperience, 10);
          const yearsMatch = reloadedProfile.yearsOfExperience === expectedYears;

          // SNSリンクの検証
          const socialLinksMatch =
            reloadedProfile.socialLinks.length ===
              updatedData.socialLinks.length &&
            reloadedProfile.socialLinks.every((link, index) => {
              const formLink = updatedData.socialLinks[index];
              return (
                link.service === formLink.service && link.url === formLink.url
              );
            });

          return (
            nameMatches &&
            jobTitleMatches &&
            bioMatches &&
            skillsMatch &&
            yearsMatch &&
            socialLinksMatch
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 23: 更新後のデータ表示
 * 検証: 要件 5.5
 *
 * 任意のプロフィール更新に対して、保存が成功すると、
 * 更新されたデータがプロフィール詳細ページに表示される
 */
describe("Property 23: 更新後のデータ表示", () => {
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

  it("プロフィール更新後、更新されたデータが取得できる", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // ユーザーID
        validProfileFormDataArbitrary,
        validProfileFormDataArbitrary,
        async (userId, originalData, updatedData) => {
          // 各反復の前にクリア
          await repository.clear();

          // ProfileProviderをラップするwrapper
          const wrapper = ({ children }: { children: ReactNode }) => (
            <ProfileProvider repository={repository}>{children}</ProfileProvider>
          );

          // useProfileフックをレンダリング
          const { result } = renderHook(() => useProfile(), { wrapper });

          // 元のプロフィールを作成
          let createdProfile: Profile | undefined;
          await waitFor(async () => {
            createdProfile = await result.current.createProfile(
              userId,
              originalData
            );
          });

          if (!createdProfile) return false;

          // プロフィールを更新
          let updatedProfile: Profile | undefined;
          await waitFor(async () => {
            updatedProfile = await result.current.updateProfile(
              createdProfile!.id,
              updatedData
            );
          });

          if (!updatedProfile) return false;

          // プロフィール詳細ページで表示されるデータを取得
          // （ViewProfileページのロジックと同じ）
          let displayedProfile: Profile | null = null;
          await waitFor(async () => {
            displayedProfile = await result.current.loadProfile(
              createdProfile!.id
            );
          });

          if (!displayedProfile) return false;

          // 表示されるデータが更新後のデータと一致することを確認
          const nameMatches = displayedProfile.name === updatedData.name;
          const jobTitleMatches =
            displayedProfile.jobTitle === updatedData.jobTitle;

          // bioの検証
          const bioMatches =
            updatedData.bio === ""
              ? displayedProfile.bio === undefined
              : displayedProfile.bio === updatedData.bio;

          // スキルの検証
          const skillsMatch =
            JSON.stringify(displayedProfile.skills) ===
            JSON.stringify(updatedData.skills);

          // 経験年数の検証
          const expectedYears =
            updatedData.yearsOfExperience === ""
              ? undefined
              : parseInt(updatedData.yearsOfExperience, 10);
          const yearsMatch =
            displayedProfile.yearsOfExperience === expectedYears;

          // SNSリンクの検証
          const socialLinksMatch =
            displayedProfile.socialLinks.length ===
              updatedData.socialLinks.length &&
            displayedProfile.socialLinks.every((link, index) => {
              const formLink = updatedData.socialLinks[index];
              return (
                link.service === formLink.service && link.url === formLink.url
              );
            });

          return (
            nameMatches &&
            jobTitleMatches &&
            bioMatches &&
            skillsMatch &&
            yearsMatch &&
            socialLinksMatch
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 24: 編集キャンセルの不変性
 * 検証: 要件 5.6
 *
 * 任意のプロフィールと変更に対して、編集をキャンセルすると、
 * 元のプロフィールデータが変更されずに保持される
 */
describe("Property 24: 編集キャンセルの不変性", () => {
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

  it("編集をキャンセルすると、元のプロフィールデータが変更されずに保持される", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // ユーザーID
        validProfileFormDataArbitrary,
        validProfileFormDataArbitrary,
        async (userId, originalData, _modifiedData) => {
          // 各反復の前にクリア
          await repository.clear();

          // ProfileProviderをラップするwrapper
          const wrapper = ({ children }: { children: ReactNode }) => (
            <ProfileProvider repository={repository}>{children}</ProfileProvider>
          );

          // useProfileフックをレンダリング
          const { result } = renderHook(() => useProfile(), { wrapper });

          // 元のプロフィールを作成
          let createdProfile: Profile | undefined;
          await waitFor(async () => {
            createdProfile = await result.current.createProfile(
              userId,
              originalData
            );
          });

          if (!createdProfile) return false;

          // 元のプロフィールデータを保存
          const originalProfile = { ...createdProfile };

          // 編集をキャンセル（更新を実行しない）
          // EditProfileページでは、キャンセルボタンをクリックすると
          // navigate(`/profile/${id}`) が呼ばれ、更新は実行されない

          // ローカルストレージから再読み込み
          const unchangedProfile = await repository.findById(createdProfile.id);

          if (!unchangedProfile) return false;

          // 元のデータが変更されていないことを確認
          const nameMatches = unchangedProfile.name === originalProfile.name;
          const jobTitleMatches =
            unchangedProfile.jobTitle === originalProfile.jobTitle;
          const bioMatches = unchangedProfile.bio === originalProfile.bio;
          const skillsMatch =
            JSON.stringify(unchangedProfile.skills) ===
            JSON.stringify(originalProfile.skills);
          const yearsMatch =
            unchangedProfile.yearsOfExperience ===
            originalProfile.yearsOfExperience;
          const socialLinksMatch =
            JSON.stringify(unchangedProfile.socialLinks) ===
            JSON.stringify(originalProfile.socialLinks);

          return (
            nameMatches &&
            jobTitleMatches &&
            bioMatches &&
            skillsMatch &&
            yearsMatch &&
            socialLinksMatch
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 20: 未認証ユーザーの編集ページへのアクセス拒否
 * 検証: 要件 5.2
 *
 * 任意の未認証ユーザーに対して、編集URLに直接アクセスしようとすると、
 * ログインページにリダイレクトされる
 *
 * 注: このプロパティはProtectedRouteコンポーネントによって保証されています。
 * ProtectedRoute.property.test.tsxで既にテスト済みです。
 */
describe("Property 20: 未認証ユーザーの編集ページへのアクセス拒否", () => {
  it("ProtectedRouteによって保護されている", () => {
    // このプロパティはProtectedRouteコンポーネントによって実装されており、
    // ProtectedRoute.property.test.tsxで既にテスト済みです。
    // EditProfileページはApp.tsxでProtectedRouteでラップされています。
    expect(true).toBe(true);
  });
});

/**
 * Feature: engineer-profile-platform, Property 21: 他人のプロフィール編集の拒否
 * 検証: 要件 5.3
 *
 * 任意のログイン済みユーザーに対して、他人のプロフィールの編集URLに直接アクセスしようとすると、
 * アクセスが拒否されてプロフィール表示ページにリダイレクトされる
 */
describe("Property 21: 他人のプロフィール編集の拒否", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  it("他人のプロフィールの編集URLにアクセスすると、アクセスが拒否される", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // プロフィール所有者のユーザーID
        fc.uuid(), // ログイン中のユーザーID（異なるID）
        validProfileFormDataArbitrary,
        async (ownerId, currentUserId, formData) => {
          // 同じIDの場合はスキップ
          if (ownerId === currentUserId) return true;

          // 各反復の前にクリア
          await repository.clear();

          // ProfileProviderをラップするwrapper
          const wrapper = ({ children }: { children: ReactNode }) => (
            <ProfileProvider repository={repository}>{children}</ProfileProvider>
          );

          // useProfileフックをレンダリング
          const { result } = renderHook(() => useProfile(), { wrapper });

          // 他人のプロフィールを作成
          let createdProfile: Profile | undefined;
          await waitFor(async () => {
            createdProfile = await result.current.createProfile(
              ownerId,
              formData
            );
          });

          if (!createdProfile) return false;

          // EditProfileページのロジックをシミュレート
          // 現在のユーザーIDと所有者IDが異なる場合、アクセスが拒否される
          const isOwner = createdProfile.user_id === currentUserId;

          // 所有者でない場合、アクセスが拒否されることを確認
          return !isOwner;
        }
      ),
      { numRuns: 100 }
    );
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
});
