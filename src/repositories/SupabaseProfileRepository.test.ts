/**
 * SupabaseProfileRepositoryのユニットテスト
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("SupabaseProfileRepository", () => {
  let repository: SupabaseProfileRepository;

  // テスト用のプロフィールデータ
  const mockProfile: Profile = {
    id: "profile-123",
    user_id: "user-123",
    name: "山田太郎",
    jobTitle: "フロントエンドエンジニア",
    bio: "Reactが得意です",
    skills: ["React", "TypeScript", "Node.js"],
    yearsOfExperience: 5,
    socialLinks: [
      {
        id: "link-1",
        service: "github",
        url: "https://github.com/yamada",
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  // データベースの行データ
  const mockProfileRow = {
    id: "profile-123",
    user_id: "user-123",
    name: "山田太郎",
    job_title: "フロントエンドエンジニア",
    bio: "Reactが得意です",
    skills: ["React", "TypeScript", "Node.js"],
    years_of_experience: 5,
    social_links: [
      {
        id: "link-1",
        service: "github",
        url: "https://github.com/yamada",
      },
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
    repository = new SupabaseProfileRepository();
  });

  describe("findById", () => {
    it("IDでプロフィールを取得する", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfileRow,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await repository.findById("profile-123");

      expect(result).toEqual(mockProfile);
      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("id", "profile-123");
    });

    it("プロフィールが見つからない場合、nullを返す", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });

    it("エラーが発生した場合、エラーをスローする", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "ERROR", message: "Database error" },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await expect(repository.findById("profile-123")).rejects.toThrow(
        "プロフィールの取得に失敗しました"
      );
    });
  });

  describe("findByUserId", () => {
    it("ユーザーIDでプロフィールを取得する", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfileRow,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await repository.findByUserId("user-123");

      expect(result).toEqual(mockProfile);
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("プロフィールが見つからない場合、nullを返す", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await repository.findByUserId("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("すべてのプロフィールを取得する", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockProfileRow],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      const result = await repository.findAll();

      expect(result).toEqual([mockProfile]);
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("エラーが発生した場合、エラーをスローする", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      await expect(repository.findAll()).rejects.toThrow(
        "プロフィール一覧の取得に失敗しました"
      );
    });
  });

  describe("save", () => {
    it("新しいプロフィールを作成する", async () => {
      // findByIdがnullを返す（プロフィールが存在しない）
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockProfileRow,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        insert: mockInsert,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await repository.save(mockProfile);

      expect(mockInsert).toHaveBeenCalledWith({
        id: mockProfile.id,
        user_id: mockProfile.user_id,
        name: mockProfile.name,
        job_title: mockProfile.jobTitle,
        bio: mockProfile.bio,
        skills: mockProfile.skills,
        years_of_experience: mockProfile.yearsOfExperience,
        social_links: mockProfile.socialLinks,
        created_at: mockProfile.createdAt,
        updated_at: mockProfile.updatedAt,
      });
    });

    it("既存のプロフィールを更新する", async () => {
      // findByIdが既存のプロフィールを返す
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfileRow,
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnThis();
      const mockUpdateEq = vi.fn().mockResolvedValue({
        data: mockProfileRow,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        update: mockUpdate,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: mockUpdateEq,
      });

      await repository.save(mockProfile);

      expect(mockUpdate).toHaveBeenCalledWith({
        name: mockProfile.name,
        job_title: mockProfile.jobTitle,
        bio: mockProfile.bio,
        skills: mockProfile.skills,
        years_of_experience: mockProfile.yearsOfExperience,
        social_links: mockProfile.socialLinks,
        updated_at: mockProfile.updatedAt,
      });
      expect(mockUpdateEq).toHaveBeenCalledWith("id", mockProfile.id);
    });

    it("作成時にエラーが発生した場合、エラーをスローする", async () => {
      // findByIdがnullを返す
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Insert error" },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        insert: mockInsert,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await expect(repository.save(mockProfile)).rejects.toThrow(
        "プロフィールの作成に失敗しました"
      );
    });
  });

  describe("delete", () => {
    it("プロフィールを削除する", async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
      } as any);

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      await repository.delete("profile-123");

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", "profile-123");
    });

    it("エラーが発生した場合、エラーをスローする", async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Delete error" },
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
      } as any);

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      await expect(repository.delete("profile-123")).rejects.toThrow(
        "プロフィールの削除に失敗しました"
      );
    });
  });

  describe("exists", () => {
    it("プロフィールが存在する場合、trueを返す", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfileRow,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await repository.exists("profile-123");

      expect(result).toBe(true);
    });

    it("プロフィールが存在しない場合、falseを返す", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await repository.exists("nonexistent");

      expect(result).toBe(false);
    });
  });
});
