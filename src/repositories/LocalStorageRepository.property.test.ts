/**
 * LocalStorageRepositoryのプロパティベーステスト
 */

import { describe, it, beforeEach } from "vitest";
import * as fc from "fast-check";
import { LocalStorageRepository } from "./LocalStorageRepository";
import type { Profile } from "../types";

/**
 * Feature: engineer-profile-platform, Property 14: ローカルストレージのラウンドトリップ
 * 検証: 要件 5.1, 5.2
 *
 * 任意の有効なプロフィールに対して、保存してから読み込むと、
 * 元のプロフィールと同等のデータが取得できる
 */
describe("Property 14: ローカルストレージのラウンドトリップ", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  // プロフィールのジェネレーター
  const profileArbitrary = fc.record({
    id: fc.uuid(),
    name: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0), // 空白のみの文字列を除外
    jobTitle: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0), // 空白のみの文字列を除外
    bio: fc.option(fc.string({ maxLength: 500 })),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      maxLength: 20,
    }),
    yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 })),
    socialLinks: fc.array(
      fc.record({
        id: fc.uuid(),
        service: fc.string({ minLength: 1, maxLength: 50 }),
        url: fc.webUrl({ validSchemes: ["http", "https"] }),
      }),
      { maxLength: 10 }
    ),
    createdAt: fc
      .integer({ min: 946684800000, max: 1924905600000 }) // 2000-01-01 to 2030-12-31 in milliseconds
      .map((timestamp) => new Date(timestamp).toISOString()),
    updatedAt: fc
      .integer({ min: 946684800000, max: 1924905600000 }) // 2000-01-01 to 2030-12-31 in milliseconds
      .map((timestamp) => new Date(timestamp).toISOString()),
  }) as fc.Arbitrary<Profile>;

  it("保存したプロフィールを読み込むと同じデータが取得できる", async () => {
    await fc.assert(
      fc.asyncProperty(profileArbitrary, async (profile) => {
        // 各反復の前にクリア
        await repository.clear();

        // 保存
        await repository.save(profile);

        // 読み込み
        const loaded = await repository.findById(profile.id);

        // 同等のデータが取得できる
        return (
          loaded !== null &&
          loaded.id === profile.id &&
          loaded.name === profile.name &&
          loaded.jobTitle === profile.jobTitle &&
          loaded.bio === profile.bio &&
          JSON.stringify(loaded.skills) === JSON.stringify(profile.skills) &&
          loaded.yearsOfExperience === profile.yearsOfExperience &&
          JSON.stringify(loaded.socialLinks) ===
            JSON.stringify(profile.socialLinks) &&
          loaded.createdAt === profile.createdAt &&
          loaded.updatedAt === profile.updatedAt
        );
      }),
      { numRuns: 100 }
    );
  });

  it("複数のプロフィールを保存して読み込める", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArbitrary, { minLength: 1, maxLength: 5 }),
        async (profiles) => {
          // 各反復の前にクリア
          await repository.clear();

          // IDをユニークにする
          const uniqueProfiles = profiles.map((profile, index) => ({
            ...profile,
            id: `${profile.id}-${index}`,
          }));

          // すべて保存
          for (const profile of uniqueProfiles) {
            await repository.save(profile);
          }

          // すべて読み込み
          const allLoaded = await repository.findAll();

          // 保存した数と一致する
          return allLoaded.length === uniqueProfiles.length;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("保存、削除、再保存のラウンドトリップが正しく動作する", async () => {
    await fc.assert(
      fc.asyncProperty(profileArbitrary, async (profile) => {
        // 各反復の前にクリア
        await repository.clear();

        // 保存
        await repository.save(profile);

        // 削除
        await repository.delete(profile.id);

        // 存在しないことを確認
        const afterDelete = await repository.findById(profile.id);
        if (afterDelete !== null) return false;

        // 再保存
        await repository.save(profile);

        // 再度読み込み
        const reloaded = await repository.findById(profile.id);

        // 同等のデータが取得できる
        return (
          reloaded !== null &&
          reloaded.id === profile.id &&
          reloaded.name === profile.name
        );
      }),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 15: 不正データのエラーハンドリング
 * 検証: 要件 5.3, 5.4
 *
 * 任意の破損したJSONデータや不正な形式のデータに対して、
 * 読み込み時にエラーが適切に処理され、システムは空の状態またはデフォルト状態で起動する
 */
describe("Property 15: 不正データのエラーハンドリング", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  it("破損したJSONデータの場合、空配列を返す", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => {
          try {
            JSON.parse(s);
            return false; // 有効なJSONは除外
          } catch {
            return true; // 無効なJSONのみ
          }
        }),
        async (invalidJson) => {
          // 破損したデータを設定
          localStorage.setItem("linker_profiles", invalidJson);

          // 読み込み
          const all = await repository.findAll();

          // 空配列を返す
          return all.length === 0;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("不正な形式のデータの場合、空配列を返す", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant("[]"), // 配列（期待される形式はオブジェクト）
          fc.constant("null"),
          fc.constant("123"),
          fc.constant('"string"')
        ),
        async (invalidFormat) => {
          // 不正な形式のデータを設定
          localStorage.setItem("linker_profiles", invalidFormat);

          // 読み込み
          const all = await repository.findAll();

          // 空配列を返す
          return all.length === 0;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("破損したデータがある場合、findByIdはnullを返す", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => {
          try {
            JSON.parse(s);
            return false;
          } catch {
            return true;
          }
        }),
        fc.uuid(),
        async (invalidJson, id) => {
          // 破損したデータを設定
          localStorage.setItem("linker_profiles", invalidJson);

          // 読み込み
          const found = await repository.findById(id);

          // nullを返す
          return found === null;
        }
      ),
      { numRuns: 50 }
    );
  });
});
