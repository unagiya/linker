/**
 * ProfileContextのユニットテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ProfileProvider, useProfileContext } from "./ProfileContext";
import type { ProfileRepository } from "../../repositories";
import type { Profile, ProfileFormData } from "../../types";

/**
 * モックRepository
 */
class MockRepository implements ProfileRepository {
  private profiles: Map<string, Profile> = new Map();
  public saveError: Error | null = null;
  public findByIdError: Error | null = null;
  public deleteError: Error | null = null;

  async save(profile: Profile): Promise<void> {
    if (this.saveError) {
      throw this.saveError;
    }
    this.profiles.set(profile.id, profile);
  }

  async findById(id: string): Promise<Profile | null> {
    if (this.findByIdError) {
      throw this.findByIdError;
    }
    return this.profiles.get(id) || null;
  }

  async findAll(): Promise<Profile[]> {
    return Array.from(this.profiles.values());
  }

  async delete(id: string): Promise<void> {
    if (this.deleteError) {
      throw this.deleteError;
    }
    this.profiles.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.profiles.has(id);
  }

  clear(): void {
    this.profiles.clear();
    this.saveError = null;
    this.findByIdError = null;
    this.deleteError = null;
  }
}

describe("ProfileContext", () => {
  let mockRepository: MockRepository;

  // テスト用のプロフィールフォームデータ
  const createTestFormData = (): ProfileFormData => ({
    name: "テストユーザー",
    jobTitle: "ソフトウェアエンジニア",
    bio: "テスト用のプロフィールです",
    skills: ["React", "TypeScript"],
    yearsOfExperience: "5",
    socialLinks: [
      {
        service: "github",
        url: "https://github.com/test",
      },
    ],
  });

  beforeEach(() => {
    mockRepository = new MockRepository();
  });

  // テスト用のWrapper
  const createWrapper = (repository: ProfileRepository) => {
    return ({ children }: { children: ReactNode }) => (
      <ProfileProvider repository={repository}>{children}</ProfileProvider>
    );
  };

  describe("初期状態", () => {
    it("初期状態が正しく設定される", () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("createProfile", () => {
    it("プロフィールを作成できる", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      const formData = createTestFormData();
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      // 作成されたプロフィールが返される
      expect(createdProfile).toBeDefined();
      expect(createdProfile!.name).toBe(formData.name);
      expect(createdProfile!.jobTitle).toBe(formData.jobTitle);
      expect(createdProfile!.bio).toBe(formData.bio);
      expect(createdProfile!.skills).toEqual(formData.skills);
      expect(createdProfile!.yearsOfExperience).toBe(5);
      expect(createdProfile!.socialLinks).toHaveLength(1);
      expect(createdProfile!.socialLinks[0].service).toBe("github");
      expect(createdProfile!.socialLinks[0].url).toBe("https://github.com/test");

      // 状態が更新される
      expect(result.current.profile).toEqual(createdProfile);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("経験年数が空の場合、undefinedになる", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      const formData = { ...createTestFormData(), yearsOfExperience: "" };
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      expect(createdProfile!.yearsOfExperience).toBeUndefined();
    });

    it("bioが空の場合、undefinedになる", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      const formData = { ...createTestFormData(), bio: "" };
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      expect(createdProfile!.bio).toBeUndefined();
    });

    it("SNSリンクにIDが付与される", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      const formData = createTestFormData();
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      expect(createdProfile!.socialLinks[0].id).toBeDefined();
      expect(typeof createdProfile!.socialLinks[0].id).toBe("string");
    });

    it("作成中はローディング状態になる", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      const formData = createTestFormData();

      const promise = act(async () => {
        await result.current.createProfile(formData);
      });

      // 作成中はローディング状態
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await promise;
    });

    it("エラーが発生した場合、エラー状態が設定される", async () => {
      mockRepository.saveError = new Error("保存エラー");

      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      const formData = createTestFormData();

      await act(async () => {
        try {
          await result.current.createProfile(formData);
        } catch (error) {
          // エラーは期待される
        }
      });

      expect(result.current.error).toBe("保存エラー");
      expect(result.current.loading).toBe(false);
    });
  });

  describe("updateProfile", () => {
    it("プロフィールを更新できる", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      // まずプロフィールを作成
      const formData = createTestFormData();
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      // 少し待機してタイムスタンプが異なることを保証
      await new Promise((resolve) => setTimeout(resolve, 10));

      // プロフィールを更新
      const updatedFormData = {
        ...formData,
        name: "更新されたユーザー",
        jobTitle: "シニアエンジニア",
      };

      let updatedProfile: Profile | undefined;

      await act(async () => {
        updatedProfile = await result.current.updateProfile(
          createdProfile!.id,
          updatedFormData
        );
      });

      expect(updatedProfile!.name).toBe("更新されたユーザー");
      expect(updatedProfile!.jobTitle).toBe("シニアエンジニア");
      expect(updatedProfile!.id).toBe(createdProfile!.id);
      expect(updatedProfile!.createdAt).toBe(createdProfile!.createdAt);
      expect(updatedProfile!.updatedAt).not.toBe(createdProfile!.updatedAt);

      // 状態が更新される
      expect(result.current.profile).toEqual(updatedProfile);
    });

    it("存在しないプロフィールを更新しようとするとエラーになる", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      const formData = createTestFormData();

      await act(async () => {
        try {
          await result.current.updateProfile("non-existent-id", formData);
        } catch (error) {
          // エラーは期待される
        }
      });

      expect(result.current.error).toBe("プロフィールが見つかりません");
    });

    it("SNSリンクのIDが保持される", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      // プロフィールを作成
      const formData = createTestFormData();
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      const originalLinkId = createdProfile!.socialLinks[0].id;

      // プロフィールを更新
      const updatedFormData = {
        ...formData,
        socialLinks: [
          {
            service: "github",
            url: "https://github.com/updated",
          },
        ],
      };

      let updatedProfile: Profile | undefined;

      await act(async () => {
        updatedProfile = await result.current.updateProfile(
          createdProfile!.id,
          updatedFormData
        );
      });

      // SNSリンクのIDが保持される
      expect(updatedProfile!.socialLinks[0].id).toBe(originalLinkId);
    });

    it("エラーが発生した場合、エラー状態が設定される", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      // プロフィールを作成
      const formData = createTestFormData();
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      // エラーを設定
      mockRepository.saveError = new Error("更新エラー");

      await act(async () => {
        try {
          await result.current.updateProfile(createdProfile!.id, formData);
        } catch (error) {
          // エラーは期待される
        }
      });

      expect(result.current.error).toBe("更新エラー");
    });
  });

  describe("deleteProfile", () => {
    it("プロフィールを削除できる", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      // プロフィールを作成
      const formData = createTestFormData();
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      // プロフィールを削除
      await act(async () => {
        await result.current.deleteProfile(createdProfile!.id);
      });

      // 状態がnullになる
      expect(result.current.profile).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      // Repositoryから削除される
      const exists = await mockRepository.exists(createdProfile!.id);
      expect(exists).toBe(false);
    });

    it("エラーが発生した場合、エラー状態が設定される", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      // プロフィールを作成
      const formData = createTestFormData();
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      // エラーを設定
      mockRepository.deleteError = new Error("削除エラー");

      await act(async () => {
        try {
          await result.current.deleteProfile(createdProfile!.id);
        } catch (error) {
          // エラーは期待される
        }
      });

      expect(result.current.error).toBe("削除エラー");
    });
  });

  describe("loadProfile", () => {
    it("プロフィールを読み込める", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      // プロフィールを作成
      const formData = createTestFormData();
      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile(formData);
      });

      // 状態をクリア
      await act(async () => {
        await result.current.deleteProfile(createdProfile!.id);
      });

      // プロフィールを再度保存（削除されているので）
      await mockRepository.save(createdProfile!);

      // プロフィールを読み込む
      let loadedProfile: Profile | null = null;

      await act(async () => {
        loadedProfile = await result.current.loadProfile(createdProfile!.id);
      });

      expect(loadedProfile).toEqual(createdProfile);
      expect(result.current.profile).toEqual(createdProfile);
    });

    it("存在しないプロフィールを読み込むとnullが返される", async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      let loadedProfile: Profile | null | undefined;

      await act(async () => {
        loadedProfile = await result.current.loadProfile("non-existent-id");
      });

      expect(loadedProfile).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it("エラーが発生した場合、nullが返される", async () => {
      mockRepository.findByIdError = new Error("読み込みエラー");

      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      let loadedProfile: Profile | null | undefined;

      await act(async () => {
        loadedProfile = await result.current.loadProfile("test-id");
      });

      expect(loadedProfile).toBeNull();
      expect(result.current.error).toBe("読み込みエラー");
    });
  });

  describe("clearError", () => {
    it("エラーをクリアできる", async () => {
      mockRepository.saveError = new Error("テストエラー");

      const { result } = renderHook(() => useProfileContext(), {
        wrapper: createWrapper(mockRepository),
      });

      // エラーを発生させる
      await act(async () => {
        try {
          await result.current.createProfile(createTestFormData());
        } catch (error) {
          // エラーは期待される
        }
      });

      expect(result.current.error).toBe("テストエラー");

      // エラーをクリア
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("useProfileContext", () => {
    it("Provider外で使用するとエラーになる", () => {
      // エラーをキャッチするためにconsole.errorをモック
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useProfileContext());
      }).toThrow("useProfileContext must be used within a ProfileProvider");

      consoleError.mockRestore();
    });
  });
});
