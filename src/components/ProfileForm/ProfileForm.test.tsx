/**
 * ProfileFormコンポーネントのユニットテスト
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "./ProfileForm";
import type { ProfileFormData } from "../../types";
import { PredefinedService } from "../../types";

describe("ProfileForm", () => {
  // テスト用の初期データ
  const createTestFormData = (): ProfileFormData => ({
    name: "テストユーザー",
    jobTitle: "ソフトウェアエンジニア",
    bio: "テスト用のプロフィールです",
    skills: ["React", "TypeScript"],
    yearsOfExperience: "5",
    socialLinks: [
      {
        service: PredefinedService.GITHUB,
        url: "https://github.com/test",
      },
    ],
  });

  describe("フォーム送信", () => {
    it("有効なデータでフォームを送信できる", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<ProfileForm onSubmit={onSubmit} />);

      // 必須項目を入力
      const nameInput = screen.getByLabelText(/名前/);
      const jobTitleInput = screen.getByLabelText(/職種/);

      await user.clear(nameInput);
      await user.type(nameInput, "テストユーザー");
      await user.clear(jobTitleInput);
      await user.type(jobTitleInput, "エンジニア");

      // フォームを送信
      const submitButton = screen.getByRole("button", { name: /保存/ });
      await user.click(submitButton);

      // onSubmitが呼ばれることを確認
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData = onSubmit.mock.calls[0][0];
      expect(submittedData.name).toBe("テストユーザー");
      expect(submittedData.jobTitle).toBe("エンジニア");
    });

    it("初期データが設定されている場合、フォームに表示される", () => {
      const initialData = createTestFormData();
      const onSubmit = vi.fn();

      render(<ProfileForm initialData={initialData} onSubmit={onSubmit} />);

      // 初期データが表示されることを確認
      expect(screen.getByDisplayValue("テストユーザー")).toBeInTheDocument();
      expect(screen.getByDisplayValue("ソフトウェアエンジニア")).toBeInTheDocument();
      expect(screen.getByDisplayValue("テスト用のプロフィールです")).toBeInTheDocument();
      expect(screen.getByDisplayValue("5")).toBeInTheDocument();

      // スキルが表示されることを確認
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();

      // SNSリンクが表示されることを確認
      expect(screen.getByText("github")).toBeInTheDocument();
      expect(screen.getByText("https://github.com/test")).toBeInTheDocument();
    });

    it("送信中はボタンが無効化される", async () => {
      const _user = userEvent.setup();
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ProfileForm onSubmit={onSubmit} isSubmitting={true} />);

      const submitButton = screen.getByRole("button", { name: /保存/ });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("バリデーションエラー表示", () => {
    it("名前が空の場合、エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // 職種のみ入力
      const jobTitleInput = screen.getByLabelText(/職種/);
      await user.type(jobTitleInput, "エンジニア");

      // フォームを送信
      const submitButton = screen.getByRole("button", { name: /保存/ });
      await user.click(submitButton);

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/名前は必須です/)).toBeInTheDocument();
      });

      // onSubmitが呼ばれないことを確認
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("職種が空の場合、エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // 名前のみ入力
      const nameInput = screen.getByLabelText(/名前/);
      await user.type(nameInput, "テストユーザー");

      // フォームを送信
      const submitButton = screen.getByRole("button", { name: /保存/ });
      await user.click(submitButton);

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/職種は必須です/)).toBeInTheDocument();
      });

      // onSubmitが呼ばれないことを確認
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("長すぎる名前の場合、エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // 101文字の名前を入力
      const longName = "a".repeat(101);
      const nameInput = screen.getByLabelText(/名前/);
      await user.type(nameInput, longName);

      // 職種を入力
      const jobTitleInput = screen.getByLabelText(/職種/);
      await user.type(jobTitleInput, "エンジニア");

      // フォームを送信
      const submitButton = screen.getByRole("button", { name: /保存/ });
      await user.click(submitButton);

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/名前は100文字以内で入力してください/)).toBeInTheDocument();
      });

      // onSubmitが呼ばれないことを確認
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("入力を修正するとエラーメッセージが消える", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // フォームを送信してエラーを表示
      const submitButton = screen.getByRole("button", { name: /保存/ });
      await user.click(submitButton);

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/名前は必須です/)).toBeInTheDocument();
      });

      // 名前を入力
      const nameInput = screen.getByLabelText(/名前/);
      await user.type(nameInput, "テストユーザー");

      // エラーメッセージが消えることを確認
      await waitFor(() => {
        expect(screen.queryByText(/名前は必須です/)).not.toBeInTheDocument();
      });
    });
  });

  describe("スキル追加・削除", () => {
    it("スキルを追加できる", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // スキルを入力
      const skillInput = screen.getByLabelText(/スキルを追加/);
      await user.type(skillInput, "React");

      // 追加ボタンをクリック（スキルセクション内のボタンを取得）
      const buttons = screen.getAllByRole("button", { name: /追加/ });
      const skillAddButton = buttons[0]; // スキルの追加ボタンは最初
      await user.click(skillAddButton);

      // スキルが表示されることを確認
      expect(screen.getByText("React")).toBeInTheDocument();

      // 入力フィールドがクリアされることを確認
      expect(skillInput).toHaveValue("");
    });

    it("Enterキーでスキルを追加できる", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // スキルを入力
      const skillInput = screen.getByLabelText(/スキルを追加/);
      await user.type(skillInput, "TypeScript{Enter}");

      // スキルが表示されることを確認
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("空のスキルは追加できない", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // 追加ボタンが無効化されていることを確認
      const buttons = screen.getAllByRole("button", { name: /追加/ });
      const skillAddButton = buttons[0]; // スキルの追加ボタンは最初
      expect(skillAddButton).toBeDisabled();

      // 空白のみのスキルを入力
      const skillInput = screen.getByLabelText(/スキルを追加/);
      await user.type(skillInput, "   ");

      // 追加ボタンが無効化されたままであることを確認
      expect(skillAddButton).toBeDisabled();
    });

    it("重複するスキルは追加できない", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // スキルを追加
      const skillInput = screen.getByLabelText(/スキルを追加/);
      await user.type(skillInput, "React");
      const buttons = screen.getAllByRole("button", { name: /追加/ });
      const skillAddButton = buttons[0]; // スキルの追加ボタンは最初
      await user.click(skillAddButton);

      // 同じスキルを再度追加しようとする
      await user.type(skillInput, "React");
      await user.click(skillAddButton);

      // スキルが1つだけ表示されることを確認
      const skillTags = screen.getAllByText("React");
      expect(skillTags).toHaveLength(1);
    });

    it("スキルを削除できる", async () => {
      const user = userEvent.setup();
      const initialData: ProfileFormData = {
        ...createTestFormData(),
        skills: ["React", "TypeScript"],
      };
      const onSubmit = vi.fn();

      render(<ProfileForm initialData={initialData} onSubmit={onSubmit} />);

      // スキルが表示されることを確認
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();

      // Reactを削除
      const removeButton = screen.getByLabelText(/Reactを削除/);
      await user.click(removeButton);

      // Reactが削除されることを確認
      expect(screen.queryByText("React")).not.toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });
  });

  describe("SNSリンク追加・削除", () => {
    it("定義済みサービスのリンクを追加できる", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // サービスを選択（デフォルトはTwitter）
      const serviceSelect = screen.getByLabelText(/サービス/);
      expect(serviceSelect).toHaveValue(PredefinedService.TWITTER);

      // URLを入力
      const urlInput = screen.getByLabelText(/^URL$/);
      await user.type(urlInput, "https://twitter.com/test");

      // リンクを追加
      const addLinkButton = screen.getByRole("button", { name: /リンクを追加/ });
      await user.click(addLinkButton);

      // リンクが表示されることを確認
      expect(screen.getByText("twitter")).toBeInTheDocument();
      expect(screen.getByText("https://twitter.com/test")).toBeInTheDocument();

      // 入力フィールドがクリアされることを確認
      expect(urlInput).toHaveValue("");
    });

    it("カスタムサービスのリンクを追加できる", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // "その他"を選択
      const serviceSelect = screen.getByLabelText(/サービス/);
      await user.selectOptions(serviceSelect, "custom");

      // カスタムサービス名を入力
      const customServiceInput = screen.getByLabelText(/カスタムサービス名/);
      await user.type(customServiceInput, "LinkedIn");

      // URLを入力
      const urlInput = screen.getByLabelText(/^URL$/);
      await user.type(urlInput, "https://linkedin.com/in/test");

      // リンクを追加
      const addLinkButton = screen.getByRole("button", { name: /リンクを追加/ });
      await user.click(addLinkButton);

      // リンクが表示されることを確認
      expect(screen.getByText("LinkedIn")).toBeInTheDocument();
      expect(screen.getByText("https://linkedin.com/in/test")).toBeInTheDocument();
    });

    it("GitHubのリンクを追加できる", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // GitHubを選択
      const serviceSelect = screen.getByLabelText(/サービス/);
      await user.selectOptions(serviceSelect, PredefinedService.GITHUB);

      // URLを入力
      const urlInput = screen.getByLabelText(/^URL$/);
      await user.type(urlInput, "https://github.com/test");

      // リンクを追加
      const addLinkButton = screen.getByRole("button", { name: /リンクを追加/ });
      await user.click(addLinkButton);

      // リンクが表示されることを確認
      expect(screen.getByText("github")).toBeInTheDocument();
      expect(screen.getByText("https://github.com/test")).toBeInTheDocument();
    });

    it("空のサービス名やURLではリンクを追加できない", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      // 追加ボタンが無効化されていることを確認
      const addLinkButton = screen.getByRole("button", { name: /リンクを追加/ });
      expect(addLinkButton).toBeDisabled();

      // URLのみ入力
      const urlInput = screen.getByLabelText(/^URL$/);
      await user.type(urlInput, "https://example.com");

      // ボタンが有効化されることを確認
      expect(addLinkButton).not.toBeDisabled();

      // URLをクリア
      await user.clear(urlInput);

      // ボタンが無効化されることを確認
      expect(addLinkButton).toBeDisabled();
    });

    it("SNSリンクを削除できる", async () => {
      const user = userEvent.setup();
      const initialData: ProfileFormData = {
        ...createTestFormData(),
        socialLinks: [
          {
            service: PredefinedService.GITHUB,
            url: "https://github.com/test",
          },
          {
            service: PredefinedService.TWITTER,
            url: "https://twitter.com/test",
          },
        ],
      };
      const onSubmit = vi.fn();

      render(<ProfileForm initialData={initialData} onSubmit={onSubmit} />);

      // リンクが表示されることを確認
      expect(screen.getByText("github")).toBeInTheDocument();
      expect(screen.getByText("twitter")).toBeInTheDocument();

      // GitHubのリンクを削除
      const removeButton = screen.getByLabelText(/githubのリンクを削除/);
      await user.click(removeButton);

      // GitHubのリンクが削除されることを確認
      expect(screen.queryByText("github")).not.toBeInTheDocument();
      expect(screen.getByText("twitter")).toBeInTheDocument();
    });
  });

  describe("キャンセル機能", () => {
    it("キャンセルボタンが表示される", () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} onCancel={onCancel} />);

      const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
      expect(cancelButton).toBeInTheDocument();
    });

    it("キャンセルボタンをクリックするとonCancelが呼ばれる", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} onCancel={onCancel} />);

      const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("onCancelが提供されていない場合、キャンセルボタンは表示されない", () => {
      const onSubmit = vi.fn();

      render(<ProfileForm onSubmit={onSubmit} />);

      const cancelButton = screen.queryByRole("button", { name: /キャンセル/ });
      expect(cancelButton).not.toBeInTheDocument();
    });
  });
});
