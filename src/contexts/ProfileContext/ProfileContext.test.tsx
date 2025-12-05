/**
 * ProfileContextのユニットテスト
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ProfileProvider, useProfile } from "./ProfileContext";
import type { ReactNode } from "react";
import type { ProfileRepository } from "../../repositories/ProfileRepository";
import type { Profile } from "../../types/profile";

describe("ProfileContext", () => {
  let mockRepository: ProfileRepository;

  beforeEach(() => {
    // モックRepositoryを作成
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };
  });

  const wrapper =
    (repository: ProfileRepository) =>
    ({ children }: { children: ReactNode }) => (
      <ProfileProvider repository={repository}>{children}</ProfileProvider>
    );

  describe("初期化", () => {
    it("初期状態ではprofileがnullである", () => {
      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("createProfile", () => {
    it("プロフィールを作成できる", async () => {
      vi.mocked(mockRepository.save).mockResolvedValue();

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      const formData = {
        name: "山田太郎",
        jobTitle: "フロントエンドエンジニア",
        bio: "Reactが得意です",
        skills: ["React", "TypeScript"],
        yearsOfExperience: "5",
        socialLinks: [
          {
            service: "github",
            url: "https://github.com/yamada",
          },
        ],
      };

      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile("user-123", formData);
      });

      expect(createdProfile).toBeDefined();
      expect(createdProfile!.name).toBe("山田太郎");
      expect(createdProfile!.jobTitle).toBe("フロントエンドエンジニア");
      expect(createdProfile!.bio).toBe("Reactが得意です");
      expect(createdProfile!.skills).toEqual(["React", "TypeScript"]);
      expect(createdProfile!.yearsOfExperience).toBe(5);
      expect(createdProfile!.socialLinks).toHaveLength(1);
      expect(createdProfile!.user_id).toBe("user-123");

      expect(result.current.profile).toEqual(createdProfile);
      expect(result.current.error).toBeNull();
      expect(mockRepository.save).toHaveBeenCalledWith(createdProfile);
    });

    it("bioが空文字列の場合、undefinedに変換される", async () => {
      vi.mocked(mockRepository.save).mockResolvedValue();

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      const formData = {
        name: "山田太郎",
        jobTitle: "エンジニア",
        bio: "",
        skills: [],
        yearsOfExperience: "",
        socialLinks: [],
      };

      let createdProfile: Profile | undefined;

      await act(async () => {
        createdProfile = await result.current.createProfile("user-123", formData);
      });

      expect(createdProfile!.bio).toBeUndefined();
      expect(createdProfile!.yearsOfExperience).toBeUndefined();
    });

    it("プロフィール作成が失敗した場合、エラーを設定する", async () => {
      vi.mocked(mockRepository.save).mockRejectedValue(new Error("保存エラー"));

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      const formData = {
        name: "山田太郎",
        jobTitle: "エンジニア",
        bio: "",
        skills: [],
        yearsOfExperience: "",
        socialLinks: [],
      };

      await act(async () => {
        try {
          await result.current.createProfile("user-123", formData);
        } catch (error) {
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe("保存エラー");
      expect(result.current.profile).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("プロフィールを更新できる", async () => {
      const existingProfile: Profile = {
        id: "profile-123",
        user_id: "user-123",
        name: "山田太郎",
        jobTitle: "エンジニア",
        skills: [],
        socialLinks: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingProfile);
      vi.mocked(mockRepository.save).mockResolvedValue();

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      const formData = {
        name: "山田花子",
        jobTitle: "シニアエンジニア",
        bio: "更新されました",
        skills: ["React"],
        yearsOfExperience: "10",
        socialLinks: [],
      };

      let updatedProfile: Profile | undefined;

      await act(async () => {
        updatedProfile = await result.current.updateProfile("profile-123", formData);
      });

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile!.name).toBe("山田花子");
      expect(updatedProfile!.jobTitle).toBe("シニアエンジニア");
      expect(updatedProfile!.bio).toBe("更新されました");
      expect(updatedProfile!.yearsOfExperience).toBe(10);

      expect(result.current.profile).toEqual(updatedProfile);
      expect(result.current.error).toBeNull();
      expect(mockRepository.save).toHaveBeenCalledWith(updatedProfile);
    });

    it("存在しないプロフィールを更新しようとするとエラーになる", async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      const formData = {
        name: "山田太郎",
        jobTitle: "エンジニア",
        bio: "",
        skills: [],
        yearsOfExperience: "",
        socialLinks: [],
      };

      await act(async () => {
        try {
          await result.current.updateProfile("nonexistent", formData);
        } catch (error) {
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe("プロフィールが見つかりません");
    });

    it("プロフィール更新が失敗した場合、エラーを設定する", async () => {
      const existingProfile: Profile = {
        id: "profile-123",
        user_id: "user-123",
        name: "山田太郎",
        jobTitle: "エンジニア",
        skills: [],
        socialLinks: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingProfile);
      vi.mocked(mockRepository.save).mockRejectedValue(new Error("更新エラー"));

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      const formData = {
        name: "山田太郎",
        jobTitle: "エンジニア",
        bio: "",
        skills: [],
        yearsOfExperience: "",
        socialLinks: [],
      };

      await act(async () => {
        try {
          await result.current.updateProfile("profile-123", formData);
        } catch (error) {
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe("更新エラー");
    });
  });

  describe("deleteProfile", () => {
    it("プロフィールを削除できる", async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue();

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      await act(async () => {
        await result.current.deleteProfile("profile-123");
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockRepository.delete).toHaveBeenCalledWith("profile-123");
    });

    it("プロフィール削除が失敗した場合、エラーを設定する", async () => {
      vi.mocked(mockRepository.delete).mockRejectedValue(new Error("削除エラー"));

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      await act(async () => {
        try {
          await result.current.deleteProfile("profile-123");
        } catch (error) {
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe("削除エラー");
    });
  });

  describe("loadProfile", () => {
    it("プロフィールを読み込める", async () => {
      const mockProfile: Profile = {
        id: "profile-123",
        user_id: "user-123",
        name: "山田太郎",
        jobTitle: "エンジニア",
        skills: [],
        socialLinks: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      let loadedProfile: Profile | null | undefined;

      await act(async () => {
        loadedProfile = await result.current.loadProfile("profile-123");
      });

      expect(loadedProfile).toEqual(mockProfile);
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.error).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith("profile-123");
    });

    it("存在しないプロフィールを読み込むとnullを返す", async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      let loadedProfile: Profile | null | undefined;

      await act(async () => {
        loadedProfile = await result.current.loadProfile("nonexistent");
      });

      expect(loadedProfile).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it("プロフィール読み込みが失敗した場合、エラーを設定する", async () => {
      vi.mocked(mockRepository.findById).mockRejectedValue(new Error("読み込みエラー"));

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      await act(async () => {
        try {
          await result.current.loadProfile("profile-123");
        } catch (error) {
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe("読み込みエラー");
    });
  });

  describe("loadMyProfile", () => {
    it("自分のプロフィールを読み込める", async () => {
      const mockProfile: Profile = {
        id: "profile-123",
        user_id: "user-123",
        name: "山田太郎",
        jobTitle: "エンジニア",
        skills: [],
        socialLinks: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      let loadedProfile: Profile | null | undefined;

      await act(async () => {
        loadedProfile = await result.current.loadMyProfile("user-123");
      });

      expect(loadedProfile).toEqual(mockProfile);
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.error).toBeNull();
      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-123");
    });

    it("プロフィールが存在しない場合、nullを返す", async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      let loadedProfile: Profile | null | undefined;

      await act(async () => {
        loadedProfile = await result.current.loadMyProfile("user-123");
      });

      expect(loadedProfile).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it("プロフィール読み込みが失敗した場合、エラーを設定する", async () => {
      vi.mocked(mockRepository.findByUserId).mockRejectedValue(
        new Error("読み込みエラー")
      );

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      await act(async () => {
        try {
          await result.current.loadMyProfile("user-123");
        } catch (error) {
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe("読み込みエラー");
    });
  });

  describe("clearError", () => {
    it("エラーをクリアする", async () => {
      vi.mocked(mockRepository.findById).mockRejectedValue(new Error("読み込みエラー"));

      const { result } = renderHook(() => useProfile(), {
        wrapper: wrapper(mockRepository),
      });

      // エラーを発生させる
      await act(async () => {
        try {
          await result.current.loadProfile("profile-123");
        } catch (error) {
          // エラーが発生することを期待
        }
      });

      expect(result.current.error).toBe("読み込みエラー");

      // エラーをクリア
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("useProfile", () => {
    it("ProfileProvider外で使用するとエラーをスローする", () => {
      // エラーをキャッチするためにconsole.errorをモック
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useProfile());
      }).toThrow("useProfileはProfileProvider内で使用する必要があります");

      consoleError.mockRestore();
    });
  });
});
