/**
 * ProfileCardコンポーネントのユニットテスト
 * 要件: 4.2, 4.3
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileCard } from "./ProfileCard";
import type { Profile } from "../../types";
import { PredefinedService } from "../../types";

describe("ProfileCard", () => {
  // テスト用のプロフィールデータ
  const createTestProfile = (): Profile => ({
    id: "test-id-123",
    name: "テストユーザー",
    jobTitle: "ソフトウェアエンジニア",
    bio: "テスト用のプロフィールです。\nReactとTypeScriptが得意です。",
    skills: ["React", "TypeScript", "Node.js"],
    yearsOfExperience: 5,
    socialLinks: [
      {
        id: "link-1",
        service: PredefinedService.GITHUB,
        url: "https://github.com/testuser",
      },
      {
        id: "link-2",
        service: PredefinedService.TWITTER,
        url: "https://twitter.com/testuser",
      },
      {
        id: "link-3",
        service: "LinkedIn",
        url: "https://linkedin.com/in/testuser",
      },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  });

  describe("プロフィール情報表示", () => {
    it("すべてのプロフィール情報が表示される", () => {
      const profile = createTestProfile();
      render(<ProfileCard profile={profile} isOwner={false} />);

      // 名前と職種が表示される
      expect(screen.getByText("テストユーザー")).toBeInTheDocument();
      expect(screen.getByText("ソフトウェアエンジニア")).toBeInTheDocument();

      // 経験年数が表示される
      expect(screen.getByText("経験年数")).toBeInTheDocument();
      expect(screen.getByText("5年")).toBeInTheDocument();

      // 自己紹介が表示される
      expect(screen.getByText("自己紹介")).toBeInTheDocument();
      expect(
        screen.getByText(/テスト用のプロフィールです/)
      ).toBeInTheDocument();

      // スキルが表示される
      expect(screen.getByText("スキル")).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Node.js")).toBeInTheDocument();

      // SNSリンクセクションが表示される
      expect(screen.getByText("SNS・外部リンク")).toBeInTheDocument();
    });

    it("オプション項目がない場合は表示されない", () => {
      const profile: Profile = {
        id: "test-id-456",
        name: "ミニマルユーザー",
        jobTitle: "デザイナー",
        skills: [],
        socialLinks: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      render(<ProfileCard profile={profile} isOwner={false} />);

      // 必須項目のみ表示される
      expect(screen.getByText("ミニマルユーザー")).toBeInTheDocument();
      expect(screen.getByText("デザイナー")).toBeInTheDocument();

      // オプション項目は表示されない
      expect(screen.queryByText("経験年数")).not.toBeInTheDocument();
      expect(screen.queryByText("自己紹介")).not.toBeInTheDocument();
      expect(screen.queryByText("スキル")).not.toBeInTheDocument();
      expect(screen.queryByText("SNS・外部リンク")).not.toBeInTheDocument();
    });

    it("経験年数が0の場合も表示される", () => {
      const profile: Profile = {
        ...createTestProfile(),
        yearsOfExperience: 0,
      };

      render(<ProfileCard profile={profile} isOwner={false} />);

      expect(screen.getByText("経験年数")).toBeInTheDocument();
      expect(screen.getByText("0年")).toBeInTheDocument();
    });

    it("アバターに名前の最初の文字が大文字で表示される", () => {
      const profile = createTestProfile();
      render(<ProfileCard profile={profile} isOwner={false} />);

      const avatar = screen.getByText("テ");
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass("profile-card-avatar");
    });

    it("作成日と更新日が表示される", () => {
      const profile = createTestProfile();
      render(<ProfileCard profile={profile} isOwner={false} />);

      // 日付が表示される（日本語フォーマット）
      expect(screen.getByText(/作成日:/)).toBeInTheDocument();
      expect(screen.getByText(/更新日:/)).toBeInTheDocument();
    });

    it("作成日と更新日が同じ場合、更新日は表示されない", () => {
      const profile: Profile = {
        ...createTestProfile(),
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      render(<ProfileCard profile={profile} isOwner={false} />);

      expect(screen.getByText(/作成日:/)).toBeInTheDocument();
      expect(screen.queryByText(/更新日:/)).not.toBeInTheDocument();
    });
  });

  describe("SNSリンク表示", () => {
    it("定義済みサービスのリンクが正しく表示される", () => {
      const profile = createTestProfile();
      render(<ProfileCard profile={profile} isOwner={false} />);

      // GitHubリンクが表示される
      const githubLink = screen.getByRole("link", { name: /github/ });
      expect(githubLink).toBeInTheDocument();
      expect(githubLink).toHaveAttribute("href", "https://github.com/testuser");
      expect(githubLink).toHaveAttribute("target", "_blank");
      expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");

      // Twitterリンクが表示される
      const twitterLink = screen.getByRole("link", { name: /twitter/ });
      expect(twitterLink).toBeInTheDocument();
      expect(twitterLink).toHaveAttribute(
        "href",
        "https://twitter.com/testuser"
      );
    });

    it("カスタムサービスのリンクが正しく表示される", () => {
      const profile = createTestProfile();
      render(<ProfileCard profile={profile} isOwner={false} />);

      // LinkedInリンクが表示される
      const linkedinLink = screen.getByRole("link", { name: /LinkedIn/ });
      expect(linkedinLink).toBeInTheDocument();
      expect(linkedinLink).toHaveAttribute(
        "href",
        "https://linkedin.com/in/testuser"
      );
      expect(linkedinLink).toHaveAttribute("target", "_blank");
      expect(linkedinLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("各サービスに適切なアイコンが表示される", () => {
      const profile = createTestProfile();
      render(<ProfileCard profile={profile} isOwner={false} />);

      // GitHubアイコン（💻）が表示される
      expect(screen.getByText("💻")).toBeInTheDocument();

      // Twitterアイコン（🐦）が表示される
      expect(screen.getByText("🐦")).toBeInTheDocument();

      // カスタムサービスアイコン（🔗）が表示される
      expect(screen.getByText("🔗")).toBeInTheDocument();
    });

    it("Facebookのリンクが正しく表示される", () => {
      const profile: Profile = {
        ...createTestProfile(),
        socialLinks: [
          {
            id: "link-fb",
            service: PredefinedService.FACEBOOK,
            url: "https://facebook.com/testuser",
          },
        ],
      };

      render(<ProfileCard profile={profile} isOwner={false} />);

      const facebookLink = screen.getByRole("link", { name: /facebook/ });
      expect(facebookLink).toBeInTheDocument();
      expect(facebookLink).toHaveAttribute(
        "href",
        "https://facebook.com/testuser"
      );

      // Facebookアイコン（👥）が表示される
      expect(screen.getByText("👥")).toBeInTheDocument();
    });

    it("複数のSNSリンクがすべて表示される", () => {
      const profile = createTestProfile();
      render(<ProfileCard profile={profile} isOwner={false} />);

      // すべてのリンクが表示される
      const links = screen.getAllByRole("link");
      // 3つのSNSリンクが存在する
      expect(links.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("ボタン表示制御", () => {
    it("所有者の場合、編集と削除ボタンが表示される", () => {
      const profile = createTestProfile();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <ProfileCard
          profile={profile}
          isOwner={true}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      expect(screen.getByRole("button", { name: /編集/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("所有者でない場合、編集と削除ボタンは表示されない", () => {
      const profile = createTestProfile();

      render(<ProfileCard profile={profile} isOwner={false} />);

      expect(
        screen.queryByRole("button", { name: /編集/ })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /削除/ })
      ).not.toBeInTheDocument();
    });

    it("共有ボタンが提供されている場合、表示される", () => {
      const profile = createTestProfile();
      const onShare = vi.fn();

      render(
        <ProfileCard profile={profile} isOwner={false} onShare={onShare} />
      );

      expect(screen.getByRole("button", { name: /共有/ })).toBeInTheDocument();
    });

    it("共有ボタンが提供されていない場合、表示されない", () => {
      const profile = createTestProfile();

      render(<ProfileCard profile={profile} isOwner={false} />);

      expect(
        screen.queryByRole("button", { name: /共有/ })
      ).not.toBeInTheDocument();
    });

    it("編集ボタンをクリックするとonEditが呼ばれる", async () => {
      const user = userEvent.setup();
      const profile = createTestProfile();
      const onEdit = vi.fn();

      render(
        <ProfileCard profile={profile} isOwner={true} onEdit={onEdit} />
      );

      const editButton = screen.getByRole("button", { name: /編集/ });
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it("削除ボタンをクリックするとonDeleteが呼ばれる", async () => {
      const user = userEvent.setup();
      const profile = createTestProfile();
      const onDelete = vi.fn();

      render(
        <ProfileCard profile={profile} isOwner={true} onDelete={onDelete} />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("共有ボタンをクリックするとonShareが呼ばれる", async () => {
      const user = userEvent.setup();
      const profile = createTestProfile();
      const onShare = vi.fn();

      render(
        <ProfileCard profile={profile} isOwner={false} onShare={onShare} />
      );

      const shareButton = screen.getByRole("button", { name: /共有/ });
      await user.click(shareButton);

      expect(onShare).toHaveBeenCalledTimes(1);
    });

    it("所有者で全てのハンドラが提供されている場合、すべてのボタンが表示される", () => {
      const profile = createTestProfile();
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onShare = vi.fn();

      render(
        <ProfileCard
          profile={profile}
          isOwner={true}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
        />
      );

      expect(screen.getByRole("button", { name: /共有/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /編集/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });
  });
});
