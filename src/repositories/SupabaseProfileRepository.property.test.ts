/**
 * SupabaseProfileRepositoryのプロパティベーステスト
 */

import { describe, it, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { SupabaseProfileRepository } from "./SupabaseProfileRepository";
import { Profile } from "../types/profile";

// Supabaseクライアントをモック
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// モックされたsupabaseをインポート
import { supabase } from "../lib/supabase";

/**
 * Feature: engineer-profile-platform, Property 27: データベースラウンドトリップ
 * 検証: 要件 7.1, 7.2
 *
 * 任意の有効なプロフィールに対して、Supabaseデータベースに保存してから読み込むと、
 * 元のプロフィールと同等のデータが取得できる
 */
describe("Property 27: データベースラウンドトリップ", () => {
  let repository: SupabaseProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProfileRepository();
  });

  // SNSリンクのジェネレーター
  const socialLinkArbitrary = fc.record({
    id: fc.uuid(),
    service: fc.oneof(
      fc.constantFrom("twitter", "github", "facebook"), // 定義済みサービス
      fc.string({ minLength: 1, maxLength: 50 }) // カスタムサービス
    ),
    url: fc.webUrl({ validSchemes: ["http", "https"] }),
  });

  // プロフィールのジェネレーター
  const profileArbitrary = fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      maxLength: 20,
    }),
    yearsOfExperience: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
    socialLinks: fc.array(socialLinkArbitrary, { maxLength: 10 }),
    // タイムスタンプを使用して有効な日付を生成
    createdAt: fc
      .integer({ min: 946684800000, max: 1924905600000 }) // 2000-01-01 to 2030-12-31
      .map((timestamp) => new Date(timestamp).toISOString()),
    updatedAt: fc
      .integer({ min: 946684800000, max: 1924905600000 }) // 2000-01-01 to 2030-12-31
      .map((timestamp) => new Date(timestamp).toISOString()),
  });

  it("プロフィールを保存して読み込むと、元のデータと同等のデータが取得できる", async () => {
    await fc.assert(
      fc.asyncProperty(profileArbitrary, async (profile: Profile) => {
        // データベースの行データに変換
        const profileRow = {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          job_title: profile.jobTitle,
          bio: profile.bio || null,
          skills: profile.skills,
          years_of_experience:
            profile.yearsOfExperience !== undefined
              ? profile.yearsOfExperience
              : null,
          social_links: profile.socialLinks,
          created_at: profile.createdAt,
          updated_at: profile.updatedAt,
        };

        // save時のモック設定（新規作成）
        // findByIdがnullを返す（プロフィールが存在しない）
        const mockSelectForFind = vi.fn().mockReturnThis();
        const mockEqForFind = vi.fn().mockReturnThis();
        const mockSingleForFind = vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const mockInsert = vi.fn().mockResolvedValue({
          data: profileRow,
          error: null,
        });

        // findById時のモック設定（保存後の読み込み）
        const mockSelectForLoad = vi.fn().mockReturnThis();
        const mockEqForLoad = vi.fn().mockReturnThis();
        const mockSingleForLoad = vi.fn().mockResolvedValue({
          data: profileRow,
          error: null,
        });

        // モックの設定
        let callCount = 0;
        vi.mocked(supabase.from).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // 最初の呼び出し（save内のfindById）
            const mockChain = {
              select: mockSelectForFind,
              eq: mockEqForFind,
              single: mockSingleForFind,
            };
            mockSelectForFind.mockReturnValue(mockChain);
            mockEqForFind.mockReturnValue(mockChain);
            return mockChain as any;
          } else if (callCount === 2) {
            // 2回目の呼び出し（save内のinsert）
            return {
              insert: mockInsert,
            } as any;
          } else {
            // 3回目の呼び出し（findById）
            const mockChain = {
              select: mockSelectForLoad,
              eq: mockEqForLoad,
              single: mockSingleForLoad,
            };
            mockSelectForLoad.mockReturnValue(mockChain);
            mockEqForLoad.mockReturnValue(mockChain);
            return mockChain as any;
          }
        });

        // プロフィールを保存
        await repository.save(profile);

        // プロフィールを読み込み
        const loadedProfile = await repository.findById(profile.id);

        // 読み込んだプロフィールがnullでないことを確認
        if (!loadedProfile) return false;

        // bioの正規化（空文字列とundefinedを同等として扱う）
        const normalizeBio = (bio: string | undefined) =>
          bio === "" ? undefined : bio;

        // すべてのフィールドが一致することを確認
        const fieldsMatch =
          loadedProfile.id === profile.id &&
          loadedProfile.user_id === profile.user_id &&
          loadedProfile.name === profile.name &&
          loadedProfile.jobTitle === profile.jobTitle &&
          normalizeBio(loadedProfile.bio) === normalizeBio(profile.bio) &&
          loadedProfile.yearsOfExperience === profile.yearsOfExperience &&
          loadedProfile.createdAt === profile.createdAt &&
          loadedProfile.updatedAt === profile.updatedAt;

        // スキル配列が一致することを確認
        const skillsMatch =
          loadedProfile.skills.length === profile.skills.length &&
          loadedProfile.skills.every(
            (skill, index) => skill === profile.skills[index]
          );

        // SNSリンク配列が一致することを確認
        const socialLinksMatch =
          loadedProfile.socialLinks.length === profile.socialLinks.length &&
          loadedProfile.socialLinks.every((link, index) => {
            const originalLink = profile.socialLinks[index];
            return (
              link.id === originalLink.id &&
              link.service === originalLink.service &&
              link.url === originalLink.url
            );
          });

        return fieldsMatch && skillsMatch && socialLinksMatch;
      }),
      { numRuns: 100 }
    );
  });

  it("プロフィールを更新して読み込むと、更新後のデータが取得できる", async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArbitrary,
        profileArbitrary,
        async (originalProfile: Profile, updatedProfile: Profile) => {
          // IDとuser_idは同じにする
          const profile = {
            ...updatedProfile,
            id: originalProfile.id,
            user_id: originalProfile.user_id,
          };

          // データベースの行データに変換
          const originalProfileRow = {
            id: originalProfile.id,
            user_id: originalProfile.user_id,
            name: originalProfile.name,
            job_title: originalProfile.jobTitle,
            bio: originalProfile.bio || null,
            skills: originalProfile.skills,
            years_of_experience:
              originalProfile.yearsOfExperience !== undefined
                ? originalProfile.yearsOfExperience
                : null,
            social_links: originalProfile.socialLinks,
            created_at: originalProfile.createdAt,
            updated_at: originalProfile.updatedAt,
          };

          const updatedProfileRow = {
            id: profile.id,
            user_id: profile.user_id,
            name: profile.name,
            job_title: profile.jobTitle,
            bio: profile.bio || null,
            skills: profile.skills,
            years_of_experience:
              profile.yearsOfExperience !== undefined
                ? profile.yearsOfExperience
                : null,
            social_links: profile.socialLinks,
            created_at: profile.createdAt,
            updated_at: profile.updatedAt,
          };

          // save時のモック設定（更新）
          // findByIdが既存のプロフィールを返す
          const mockSelectForFind = vi.fn().mockReturnThis();
          const mockEqForFind = vi.fn().mockReturnThis();
          const mockSingleForFind = vi.fn().mockResolvedValue({
            data: originalProfileRow,
            error: null,
          });

          const mockUpdate = vi.fn().mockReturnThis();
          const mockUpdateEq = vi.fn().mockResolvedValue({
            data: updatedProfileRow,
            error: null,
          });

          // findById時のモック設定（更新後の読み込み）
          const mockSelectForLoad = vi.fn().mockReturnThis();
          const mockEqForLoad = vi.fn().mockReturnThis();
          const mockSingleForLoad = vi.fn().mockResolvedValue({
            data: updatedProfileRow,
            error: null,
          });

          // モックの設定
          let callCount = 0;
          vi.mocked(supabase.from).mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // 最初の呼び出し（save内のfindById）
              const mockChain = {
                select: mockSelectForFind,
                eq: mockEqForFind,
                single: mockSingleForFind,
              };
              mockSelectForFind.mockReturnValue(mockChain);
              mockEqForFind.mockReturnValue(mockChain);
              return mockChain as any;
            } else if (callCount === 2) {
              // 2回目の呼び出し（save内のupdate）
              const mockChain = {
                update: mockUpdate,
              };
              mockUpdate.mockReturnValue({ eq: mockUpdateEq });
              return mockChain as any;
            } else {
              // 3回目の呼び出し（findById）
              const mockChain = {
                select: mockSelectForLoad,
                eq: mockEqForLoad,
                single: mockSingleForLoad,
              };
              mockSelectForLoad.mockReturnValue(mockChain);
              mockEqForLoad.mockReturnValue(mockChain);
              return mockChain as any;
            }
          });

          // プロフィールを更新
          await repository.save(profile);

          // プロフィールを読み込み
          const loadedProfile = await repository.findById(profile.id);

          // 読み込んだプロフィールがnullでないことを確認
          if (!loadedProfile) return false;

          // bioの正規化（空文字列とundefinedを同等として扱う）
          const normalizeBio = (bio: string | undefined) =>
            bio === "" ? undefined : bio;

          // すべてのフィールドが更新後のデータと一致することを確認
          const fieldsMatch =
            loadedProfile.id === profile.id &&
            loadedProfile.user_id === profile.user_id &&
            loadedProfile.name === profile.name &&
            loadedProfile.jobTitle === profile.jobTitle &&
            normalizeBio(loadedProfile.bio) === normalizeBio(profile.bio) &&
            loadedProfile.yearsOfExperience === profile.yearsOfExperience &&
            loadedProfile.createdAt === profile.createdAt &&
            loadedProfile.updatedAt === profile.updatedAt;

          // スキル配列が一致することを確認
          const skillsMatch =
            loadedProfile.skills.length === profile.skills.length &&
            loadedProfile.skills.every(
              (skill, index) => skill === profile.skills[index]
            );

          // SNSリンク配列が一致することを確認
          const socialLinksMatch =
            loadedProfile.socialLinks.length === profile.socialLinks.length &&
            loadedProfile.socialLinks.every((link, index) => {
              const originalLink = profile.socialLinks[index];
              return (
                link.id === originalLink.id &&
                link.service === originalLink.service &&
                link.url === originalLink.url
              );
            });

          return fieldsMatch && skillsMatch && socialLinksMatch;
        }
      ),
      { numRuns: 100 }
    );
  });
});
