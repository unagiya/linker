/**
 * ViewProfileページのプロパティベーステスト
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen as _screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ProfileProvider } from '../../contexts/ProfileContext';
import { LocalStorageRepository } from '../../repositories';
import { ViewProfile } from './ViewProfile';
import type { Profile } from '../../types';
import type { ReactNode } from 'react';

/**
 * Feature: engineer-profile-platform, Property 11: プロフィールURLアクセス
 * 検証: 要件 4.1, 6.2
 *
 * 任意の保存されているプロフィールIDに対して、そのIDを含むURLにアクセスすると、
 * 対応するプロフィールの詳細ページが表示される
 */
describe.skip('Property 11: プロフィールURLアクセス', () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  afterEach(() => {
    cleanup();
  });

  // 有効な日付範囲を持つ日付ジェネレーター
  const validDateArbitrary = fc
    .integer({
      min: new Date('2000-01-01').getTime(),
      max: new Date('2099-12-31').getTime(),
    })
    .map((timestamp) => new Date(timestamp).toISOString());

  // SNSリンクのジェネレーター
  const socialLinkArbitrary = fc.record({
    id: fc.uuid(),
    service: fc.string({ minLength: 1, maxLength: 50 }),
    url: fc.webUrl({ validSchemes: ['http', 'https'] }),
  });

  // 完全なプロフィールのジェネレーター
  const profileArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    bio: fc.option(fc.string({ minLength: 1, maxLength: 500 }), {
      nil: undefined,
    }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      maxLength: 20,
    }),
    yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 }), {
      nil: undefined,
    }),
    socialLinks: fc.array(socialLinkArbitrary, { maxLength: 10 }),
    createdAt: validDateArbitrary,
    updatedAt: validDateArbitrary,
  }) as fc.Arbitrary<Profile>;

  it('保存されているプロフィールIDを含むURLにアクセスすると、対応するプロフィールが表示される', async () => {
    await fc.assert(
      fc.asyncProperty(profileArbitrary, async (profile) => {
        // 各反復の前にクリア
        cleanup();
        await repository.clear();

        // プロフィールを保存
        await repository.save(profile);

        // AuthProviderとProfileProviderをラップするwrapper
        const wrapper = ({ children }: { children: ReactNode }) => (
          <MemoryRouter initialEntries={[`/profile/${profile.id}`]}>
            <AuthProvider>
              <ProfileProvider repository={repository}>
                <Routes>
                  <Route path="/profile/:id" element={<ViewProfile />} />
                </Routes>
                {children}
              </ProfileProvider>
            </AuthProvider>
          </MemoryRouter>
        );

        // ViewProfileコンポーネントをレンダリング
        const { container, unmount } = render(<div />, { wrapper });

        try {
          // プロフィール情報が表示されるまで待機
          await waitFor(
            () => {
              // 名前が表示される
              if (!container.textContent?.includes(profile.name)) {
                throw new Error('名前が表示されていません');
              }
            },
            { timeout: 3000 }
          );

          // 職種が表示される
          if (!container.textContent?.includes(profile.jobTitle)) return false;

          // 自己紹介が表示される（設定されている場合）
          if (profile.bio) {
            if (!container.textContent?.includes(profile.bio)) return false;
          }

          // 経験年数が表示される（設定されている場合）
          if (profile.yearsOfExperience !== undefined) {
            const yearsText = `${profile.yearsOfExperience}年`;
            if (!container.textContent?.includes(yearsText)) return false;
          }

          // スキルが表示される（設定されている場合）
          for (const skill of profile.skills) {
            if (!container.textContent?.includes(skill)) return false;
          }

          // SNSリンクが表示される（設定されている場合）
          for (const link of profile.socialLinks) {
            if (!container.textContent?.includes(link.service)) return false;
          }

          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 1 }
    );
  });

  it('存在しないプロフィールIDにアクセスすると、404メッセージが表示される', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (nonExistentId) => {
        // 各反復の前にクリアとクリーンアップ
        cleanup();
        await repository.clear();

        // AuthProviderとProfileProviderをラップするwrapper
        const wrapper = ({ children }: { children: ReactNode }) => (
          <MemoryRouter initialEntries={[`/profile/${nonExistentId}`]}>
            <AuthProvider>
              <ProfileProvider repository={repository}>
                <Routes>
                  <Route path="/profile/:id" element={<ViewProfile />} />
                </Routes>
                {children}
              </ProfileProvider>
            </AuthProvider>
          </MemoryRouter>
        );

        // ViewProfileコンポーネントをレンダリング
        const { container, unmount } = render(<div />, { wrapper });

        try {
          // 404メッセージが表示されるまで待機
          await waitFor(
            () => {
              if (!container.textContent?.includes('プロフィールが見つかりません')) {
                throw new Error('404メッセージが表示されていません');
              }
            },
            { timeout: 3000 }
          );

          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 1 }
    );
  });

  it('複数のプロフィールが保存されている場合、正しいプロフィールが表示される', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArbitrary, { minLength: 2, maxLength: 5 }),
        async (profiles) => {
          // 各反復の前にクリア
          cleanup();
          await repository.clear();

          // すべてのプロフィールを保存
          for (const profile of profiles) {
            await repository.save(profile);
          }

          // ランダムに1つのプロフィールを選択
          const targetProfile = profiles[0];

          // AuthProviderとProfileProviderをラップするwrapper
          const wrapper = ({ children }: { children: ReactNode }) => (
            <MemoryRouter initialEntries={[`/profile/${targetProfile.id}`]}>
              <AuthProvider>
                <ProfileProvider repository={repository}>
                  <Routes>
                    <Route path="/profile/:id" element={<ViewProfile />} />
                  </Routes>
                  {children}
                </ProfileProvider>
              </AuthProvider>
            </MemoryRouter>
          );

          // ViewProfileコンポーネントをレンダリング
          const { container, unmount } = render(<div />, { wrapper });

          try {
            // ターゲットプロフィールの情報が表示されるまで待機
            await waitFor(
              () => {
                if (!container.textContent?.includes(targetProfile.name)) {
                  throw new Error('ターゲットプロフィールが表示されていません');
                }
              },
              { timeout: 3000 }
            );

            // ターゲットプロフィールの職種が表示される
            if (!container.textContent?.includes(targetProfile.jobTitle)) return false;

            // 他のプロフィールの名前が表示されていないことを確認
            for (const otherProfile of profiles) {
              if (otherProfile.id !== targetProfile.id) {
                // 他のプロフィールの名前が表示されていないか確認
                // ただし、名前が部分的に一致する可能性があるため、完全一致で確認
                const nameElements = container.querySelectorAll('.profile-card-name');
                const hasOtherName = Array.from(nameElements).some(
                  (el) => el.textContent === otherProfile.name
                );
                if (hasOtherName) return false;
              }
            }

            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 1 }
    );
  });
});
