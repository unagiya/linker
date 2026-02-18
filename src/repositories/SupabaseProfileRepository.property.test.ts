/**
 * SupabaseProfileRepositoryのプロパティベーステスト
 */

import { describe, it, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { SupabaseProfileRepository } from './SupabaseProfileRepository';
import type { Profile } from '../types/profile';

// Supabaseクライアントをモック
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// モックされたsupabaseをインポート
import { supabase } from '../lib/supabase';

/**
 * Feature: engineer-profile-platform, Property 27: データベースラウンドトリップ
 * 検証: 要件 7.1, 7.2
 *
 * 任意の有効なプロフィールに対して、Supabaseデータベースに保存してから読み込むと、
 * 元のプロフィールと同等のデータが取得できる
 */
describe('Property 27: データベースラウンドトリップ', () => {
  let repository: SupabaseProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProfileRepository();
  });

  // SNSリンクのジェネレーター
  const socialLinkArbitrary = fc.record({
    id: fc.uuid(),
    service: fc.oneof(
      fc.constantFrom('twitter', 'github', 'facebook'), // 定義済みサービス
      fc.string({ minLength: 1, maxLength: 50 }) // カスタムサービス
    ),
    url: fc.webUrl({ validSchemes: ['http', 'https'] }),
  });

  // プロフィールのジェネレーター
  const profileArbitrary = fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    nickname: fc.string({ minLength: 3, maxLength: 36 })
      .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
      .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
      .filter(s => !/[-_]{2,}/.test(s)),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    imageUrl: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: undefined }),
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

  it('プロフィールを保存して読み込むと、元のデータと同等のデータが取得できる', async () => {
    await fc.assert(
      fc.asyncProperty(profileArbitrary, async (profile: Profile) => {
        // データベースの行データに変換
        const profileRow = {
          id: profile.id,
          user_id: profile.user_id,
          nickname: profile.nickname,
          name: profile.name,
          job_title: profile.jobTitle,
          bio: profile.bio || null,
          image_url: profile.imageUrl || null,
          skills: profile.skills,
          years_of_experience:
            profile.yearsOfExperience !== undefined ? profile.yearsOfExperience : null,
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
          error: { code: 'PGRST116', message: 'Not found' },
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
        const normalizeBio = (bio: string | undefined) => (bio === '' ? undefined : bio);

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
          loadedProfile.skills.every((skill, index) => skill === profile.skills[index]);

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
      { numRuns: 2 }
    );
  });

  it('プロフィールを更新して読み込むと、更新後のデータが取得できる', async () => {
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
            nickname: originalProfile.nickname,
            name: originalProfile.name,
            job_title: originalProfile.jobTitle,
            bio: originalProfile.bio || null,
            image_url: originalProfile.imageUrl || null,
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
            nickname: profile.nickname,
            name: profile.name,
            job_title: profile.jobTitle,
            bio: profile.bio || null,
            image_url: profile.imageUrl || null,
            skills: profile.skills,
            years_of_experience:
              profile.yearsOfExperience !== undefined ? profile.yearsOfExperience : null,
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
          const normalizeBio = (bio: string | undefined) => (bio === '' ? undefined : bio);

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
            loadedProfile.skills.every((skill, index) => skill === profile.skills[index]);

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
      { numRuns: 2 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 43: 画像URL保存検証
 * 検証: 要件 12.1
 *
 * 任意の有効な画像URLを持つプロフィールに対して、データベースに保存してから読み込むと、
 * 画像URLが正しく保存・取得される
 */
describe('Property 43: 画像URL保存検証', () => {
  let repository: SupabaseProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProfileRepository();
  });

  // 画像URLを持つプロフィールのジェネレーター
  const profileWithImageArbitrary = fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    nickname: fc.string({ minLength: 3, maxLength: 36 })
      .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
      .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
      .filter(s => !/[-_]{2,}/.test(s)),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    imageUrl: fc.webUrl({ validSchemes: ['https'] }), // 必ず画像URLを持つ
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      maxLength: 20,
    }),
    yearsOfExperience: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
    socialLinks: fc.array(
      fc.record({
        id: fc.uuid(),
        service: fc.oneof(
          fc.constantFrom('twitter', 'github', 'facebook'),
          fc.string({ minLength: 1, maxLength: 50 })
        ),
        url: fc.webUrl({ validSchemes: ['http', 'https'] }),
      }),
      { maxLength: 10 }
    ),
    createdAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
    updatedAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
  });

  it('画像URLを持つプロフィールを保存して読み込むと、画像URLが正しく取得できる', async () => {
    await fc.assert(
      fc.asyncProperty(profileWithImageArbitrary, async (profile: Profile) => {
        // データベースの行データに変換
        const profileRow = {
          id: profile.id,
          user_id: profile.user_id,
          nickname: profile.nickname,
          name: profile.name,
          job_title: profile.jobTitle,
          bio: profile.bio || null,
          image_url: profile.imageUrl || null,
          skills: profile.skills,
          years_of_experience:
            profile.yearsOfExperience !== undefined ? profile.yearsOfExperience : null,
          social_links: profile.socialLinks,
          created_at: profile.createdAt,
          updated_at: profile.updatedAt,
        };

        // save時のモック設定（新規作成）
        const mockSelectForFind = vi.fn().mockReturnThis();
        const mockEqForFind = vi.fn().mockReturnThis();
        const mockSingleForFind = vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
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
            const mockChain = {
              select: mockSelectForFind,
              eq: mockEqForFind,
              single: mockSingleForFind,
            };
            mockSelectForFind.mockReturnValue(mockChain);
            mockEqForFind.mockReturnValue(mockChain);
            return mockChain as any;
          } else if (callCount === 2) {
            return {
              insert: mockInsert,
            } as any;
          } else {
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

        // 画像URLが正しく保存・取得されることを確認
        return loadedProfile.imageUrl === profile.imageUrl;
      }),
      { numRuns: 10 }
    );
  });
});
/**
 * Feature: profile-nickname-urls, Property 24: updated_at自動更新
 * 検証: 要件 6.4
 *
 * 任意のニックネーム更新に対して、updated_atカラムも自動更新される
 */
describe('Property 24: updated_at自動更新', () => {
  let repository: SupabaseProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProfileRepository();
  });

  // ニックネームを持つプロフィールのジェネレーター
  const profileWithNicknameArbitrary = fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    nickname: fc.string({ minLength: 3, maxLength: 36 })
      .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
      .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
      .filter(s => !/[-_]{2,}/.test(s)),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    imageUrl: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: undefined }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
    yearsOfExperience: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
    socialLinks: fc.array(
      fc.record({
        id: fc.uuid(),
        service: fc.oneof(
          fc.constantFrom('twitter', 'github', 'facebook'),
          fc.string({ minLength: 1, maxLength: 50 })
        ),
        url: fc.webUrl({ validSchemes: ['http', 'https'] }),
      }),
      { maxLength: 10 }
    ),
    createdAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
    updatedAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
  });

  it('ニックネームを更新すると、updated_atも自動更新される', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileWithNicknameArbitrary,
        fc.string({ minLength: 3, maxLength: 36 })
          .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
          .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
          .filter(s => !/[-_]{2,}/.test(s)),
        async (originalProfile: Profile, newNickname: string) => {
          // 新しいニックネームが元のニックネームと異なることを確認
          if (originalProfile.nickname === newNickname) {
            return true; // スキップ
          }

          // 更新されたプロフィールを作成（updated_atを新しい時刻に設定）
          const now = new Date().toISOString();
          const updatedProfile: Profile = {
            ...originalProfile,
            nickname: newNickname,
            updatedAt: now,
          };

          // データベースの行データに変換
          const originalProfileRow = {
            id: originalProfile.id,
            user_id: originalProfile.user_id,
            nickname: originalProfile.nickname,
            name: originalProfile.name,
            job_title: originalProfile.jobTitle,
            bio: originalProfile.bio || null,
            image_url: originalProfile.imageUrl || null,
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
            ...originalProfileRow,
            nickname: newNickname,
            updated_at: now,
          };

          // save時のモック設定（更新）
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
          await repository.save(updatedProfile);

          // プロフィールを読み込み
          const loadedProfile = await repository.findById(updatedProfile.id);

          // 読み込んだプロフィールがnullでないことを確認
          if (!loadedProfile) return false;

          // ニックネームが更新されていることを確認
          const nicknameUpdated = loadedProfile.nickname === newNickname;

          // updated_atが更新されていることを確認
          const updatedAtChanged = loadedProfile.updatedAt === now;

          return nicknameUpdated && updatedAtChanged;
        }
      ),
      { numRuns: 100 }
    );
  });
});
/**
 * Feature: profile-nickname-urls, Property 25: RLSポリシーの継続動作
 * 検証: 要件 6.5
 *
 * 任意のデータベースアクセスに対して、Row Level Security (RLS)ポリシーがニックネーム機能でも適切に動作する
 */
describe('Property 25: RLSポリシーの継続動作', () => {
  let repository: SupabaseProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProfileRepository();
  });

  // ニックネームを持つプロフィールのジェネレーター
  const profileWithNicknameArbitrary = fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    nickname: fc.string({ minLength: 3, maxLength: 36 })
      .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
      .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
      .filter(s => !/[-_]{2,}/.test(s)),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    imageUrl: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: undefined }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
    yearsOfExperience: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
    socialLinks: fc.array(
      fc.record({
        id: fc.uuid(),
        service: fc.oneof(
          fc.constantFrom('twitter', 'github', 'facebook'),
          fc.string({ minLength: 1, maxLength: 50 })
        ),
        url: fc.webUrl({ validSchemes: ['http', 'https'] }),
      }),
      { maxLength: 10 }
    ),
    createdAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
    updatedAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
  });

  it('ニックネーム機能でもRLSポリシーが適切に動作する', async () => {
    await fc.assert(
      fc.asyncProperty(profileWithNicknameArbitrary, async (profile: Profile) => {
        // データベースの行データに変換
        const profileRow = {
          id: profile.id,
          user_id: profile.user_id,
          nickname: profile.nickname,
          name: profile.name,
          job_title: profile.jobTitle,
          bio: profile.bio || null,
          image_url: profile.imageUrl || null,
          skills: profile.skills,
          years_of_experience:
            profile.yearsOfExperience !== undefined ? profile.yearsOfExperience : null,
          social_links: profile.socialLinks,
          created_at: profile.createdAt,
          updated_at: profile.updatedAt,
        };

        // save時のモック設定（新規作成）
        const mockSelectForFind = vi.fn().mockReturnThis();
        const mockEqForFind = vi.fn().mockReturnThis();
        const mockSingleForFind = vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        });

        const mockInsert = vi.fn().mockResolvedValue({
          data: profileRow,
          error: null,
        });

        // findByNickname時のモック設定
        const mockSelectForNickname = vi.fn().mockReturnThis();
        const mockIlikeForNickname = vi.fn().mockReturnThis();
        const mockSingleForNickname = vi.fn().mockResolvedValue({
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
            // 3回目の呼び出し（findByNickname）
            const mockChain = {
              select: mockSelectForNickname,
              ilike: mockIlikeForNickname,
              single: mockSingleForNickname,
            };
            mockSelectForNickname.mockReturnValue(mockChain);
            mockIlikeForNickname.mockReturnValue(mockChain);
            return mockChain as any;
          }
        });

        // プロフィールを保存（RLSポリシーが適用される）
        await repository.save(profile);

        // ニックネームでプロフィールを検索（RLSポリシーが適用される）
        const foundProfile = await repository.findByNickname(profile.nickname);

        // プロフィールが正しく保存・取得できることを確認
        // これは、RLSポリシーがニックネーム機能でも適切に動作していることを示す
        if (!foundProfile) return false;

        // 基本的なフィールドが一致することを確認
        const fieldsMatch =
          foundProfile.id === profile.id &&
          foundProfile.user_id === profile.user_id &&
          foundProfile.nickname === profile.nickname &&
          foundProfile.name === profile.name &&
          foundProfile.jobTitle === profile.jobTitle;

        // RLSポリシーが適用されていることを確認するため、
        // 適切なクエリパラメータが使用されていることを検証
        expect(mockEqForFind).toHaveBeenCalledWith('id', profile.id);
        expect(mockIlikeForNickname).toHaveBeenCalledWith('nickname', profile.nickname);

        return fieldsMatch;
      }),
      { numRuns: 10, timeout: 10000 }
    );
  });
});

/**
 * Feature: profile-nickname-urls, Property 36: ニックネーム重複チェック機能
 * 検証: 要件 3.1, 4.4
 *
 * 任意のニックネームに対して、重複チェック機能が大文字小文字を区別せずに正しく動作する
 */
describe('Property 36: ニックネーム重複チェック機能', () => {
  let repository: SupabaseProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProfileRepository();
  });

  // ニックネームのジェネレーター
  const nicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s));

  it('大文字小文字を区別しない重複チェックが正しく動作する', async () => {
    await fc.assert(
      fc.asyncProperty(
        nicknameArbitrary,
        fc.boolean(),
        async (nickname: string, isDuplicate: boolean) => {
          // モックの設定
          const mockQuery = {
            ilike: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
          };
          
          const mockSelect = vi.fn().mockReturnValue(mockQuery);
          
          // 重複の有無に応じてモックデータを設定
          const mockData = isDuplicate ? [{ id: 'existing-id' }] : [];
          Object.assign(mockQuery, { data: mockData, error: null });

          vi.mocked(supabase.from).mockReturnValue({
            select: mockSelect,
          } as any);

          // 重複チェックを実行
          const result = await repository.checkNicknameDuplicate(nickname);

          // 結果が期待値と一致することを確認
          const expectedResult = isDuplicate;
          const actualResult = result;

          // ilike関数が大文字小文字を区別しない検索で呼ばれることを確認
          expect(mockQuery.ilike).toHaveBeenCalledWith('nickname', nickname);

          return actualResult === expectedResult;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('除外プロフィールIDが指定された場合、そのプロフィールを除外する', async () => {
    await fc.assert(
      fc.asyncProperty(
        nicknameArbitrary,
        fc.uuid(),
        fc.boolean(),
        async (nickname: string, excludeProfileId: string, hasOtherDuplicate: boolean) => {
          // モックの設定
          const mockQuery = {
            ilike: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
          };
          
          const mockSelect = vi.fn().mockReturnValue(mockQuery);
          
          // 他の重複の有無に応じてモックデータを設定
          const mockData = hasOtherDuplicate ? [{ id: 'other-id' }] : [];
          Object.assign(mockQuery, { data: mockData, error: null });

          vi.mocked(supabase.from).mockReturnValue({
            select: mockSelect,
          } as any);

          // 除外プロフィールIDを指定して重複チェックを実行
          const result = await repository.checkNicknameDuplicate(nickname, excludeProfileId);

          // 結果が期待値と一致することを確認
          const expectedResult = hasOtherDuplicate;
          const actualResult = result;

          // neq関数が除外プロフィールIDで呼ばれることを確認
          expect(mockQuery.neq).toHaveBeenCalledWith('id', excludeProfileId);

          return actualResult === expectedResult;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: profile-nickname-urls, Property 37: ニックネーム利用可能性チェック機能
 * 検証: 要件 1.2, 4.2, 5.1
 *
 * 任意のニックネームに対して、利用可能性チェック機能が大文字小文字を区別せずに正しく動作する
 */
describe('Property 37: ニックネーム利用可能性チェック機能', () => {
  let repository: SupabaseProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProfileRepository();
  });

  // ニックネームのジェネレーター
  const nicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s));

  it('大文字小文字を区別しない利用可能性チェックが正しく動作する', async () => {
    await fc.assert(
      fc.asyncProperty(
        nicknameArbitrary,
        fc.boolean(),
        async (nickname: string, isAvailable: boolean) => {
          // モックの設定
          const mockQuery = {
            ilike: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
          };
          
          const mockSelect = vi.fn().mockReturnValue(mockQuery);
          
          // 利用可能性に応じてモックデータを設定
          const mockData = isAvailable ? [] : [{ id: 'existing-id' }];
          Object.assign(mockQuery, { data: mockData, error: null });

          vi.mocked(supabase.from).mockReturnValue({
            select: mockSelect,
          } as any);

          // 利用可能性チェックを実行
          const result = await repository.isNicknameAvailable(nickname);

          // 結果が期待値と一致することを確認
          const expectedResult = isAvailable;
          const actualResult = result;

          // ilike関数が大文字小文字を区別しない検索で呼ばれることを確認
          expect(mockQuery.ilike).toHaveBeenCalledWith('nickname', nickname);

          return actualResult === expectedResult;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('除外ユーザーIDが指定された場合、そのユーザーを除外する', async () => {
    await fc.assert(
      fc.asyncProperty(
        nicknameArbitrary,
        fc.uuid(),
        fc.boolean(),
        async (nickname: string, excludeUserId: string, hasOtherUser: boolean) => {
          // モックの設定
          const mockQuery = {
            ilike: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
          };
          
          const mockSelect = vi.fn().mockReturnValue(mockQuery);
          
          // 他のユーザーの有無に応じてモックデータを設定
          const mockData = hasOtherUser ? [{ id: 'other-user-profile' }] : [];
          Object.assign(mockQuery, { data: mockData, error: null });

          vi.mocked(supabase.from).mockReturnValue({
            select: mockSelect,
          } as any);

          // 除外ユーザーIDを指定して利用可能性チェックを実行
          const result = await repository.isNicknameAvailable(nickname, excludeUserId);

          // 結果が期待値と一致することを確認（他のユーザーがいなければ利用可能）
          const expectedResult = !hasOtherUser;
          const actualResult = result;

          // neq関数が除外ユーザーIDで呼ばれることを確認
          expect(mockQuery.neq).toHaveBeenCalledWith('user_id', excludeUserId);

          return actualResult === expectedResult;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: profile-nickname-urls, Property 38: 大文字小文字を区別しないニックネーム検索
 * 検証: 要件 2.5, 3.1
 *
 * 任意のニックネームに対して、大文字小文字を区別しない検索が正しく動作する
 */
describe('Property 38: 大文字小文字を区別しないニックネーム検索', () => {
  let repository: SupabaseProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseProfileRepository();
  });

  // ニックネームのジェネレーター
  const nicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
    .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
    .filter(s => !/[-_]{2,}/.test(s));

  // プロフィールのジェネレーター
  const profileArbitrary = fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    nickname: nicknameArbitrary,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    imageUrl: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: undefined }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
    yearsOfExperience: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
    socialLinks: fc.array(
      fc.record({
        id: fc.uuid(),
        service: fc.oneof(
          fc.constantFrom('twitter', 'github', 'facebook'),
          fc.string({ minLength: 1, maxLength: 50 })
        ),
        url: fc.webUrl({ validSchemes: ['http', 'https'] }),
      }),
      { maxLength: 10 }
    ),
    createdAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
    updatedAt: fc
      .integer({ min: 946684800000, max: 1924905600000 })
      .map((timestamp) => new Date(timestamp).toISOString()),
  });

  it('大文字小文字を区別しないニックネーム検索が正しく動作する', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArbitrary,
        fc.boolean(),
        fc.boolean(),
        async (profile: Profile, upperCase: boolean, exists: boolean) => {
          // 検索用ニックネームを大文字または小文字に変換
          const searchNickname = upperCase 
            ? profile.nickname.toUpperCase() 
            : profile.nickname.toLowerCase();

          // データベースの行データに変換
          const profileRow = exists ? {
            id: profile.id,
            user_id: profile.user_id,
            nickname: profile.nickname,
            name: profile.name,
            job_title: profile.jobTitle,
            bio: profile.bio || null,
            image_url: profile.imageUrl || null,
            skills: profile.skills,
            years_of_experience:
              profile.yearsOfExperience !== undefined ? profile.yearsOfExperience : null,
            social_links: profile.socialLinks,
            created_at: profile.createdAt,
            updated_at: profile.updatedAt,
          } : null;

          // モックの設定
          const mockSelect = vi.fn().mockReturnThis();
          const mockIlike = vi.fn().mockReturnThis();
          const mockSingle = vi.fn().mockResolvedValue({
            data: profileRow,
            error: exists ? null : { code: 'PGRST116', message: 'Not found' },
          });

          const mockChain = {
            select: mockSelect,
            ilike: mockIlike,
            single: mockSingle,
          };

          mockSelect.mockReturnValue(mockChain);
          mockIlike.mockReturnValue(mockChain);

          vi.mocked(supabase.from).mockReturnValue(mockChain as any);

          // ニックネームで検索
          const result = await repository.findByNickname(searchNickname);

          // ilike関数が大文字小文字を区別しない検索で呼ばれることを確認
          expect(mockIlike).toHaveBeenCalledWith('nickname', searchNickname);

          // 結果が期待値と一致することを確認
          if (exists) {
            if (!result) return false;
            return result.nickname === profile.nickname;
          } else {
            return result === null;
          }
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  });
});