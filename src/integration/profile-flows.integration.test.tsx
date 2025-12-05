/**
 * プロフィール機能の統合テスト
 * 複数のコンポーネントが連携して動作することを確認
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProfileProvider } from "../contexts/ProfileContext";
import { LocalStorageRepository } from "../repositories";
import { CreateProfile } from "../pages/CreateProfile";
import { ViewProfile } from "../pages/ViewProfile";
import { EditProfile } from "../pages/EditProfile";
import { Home } from "../pages/Home";

describe("プロフィール作成フローの統合テスト", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  it("プロフィールを作成し、詳細ページに遷移できる", async () => {
    const user = userEvent.setup();

    const { container: _container } = render(
      <MemoryRouter initialEntries={["/create"]}>
        <ProfileProvider repository={repository}>
          <Routes>
            <Route path="/create" element={<CreateProfile />} />
            <Route path="/profile/:id" element={<ViewProfile />} />
          </Routes>
        </ProfileProvider>
      </MemoryRouter>
    );

    // フォームに入力
    const nameInput = screen.getByLabelText(/名前/i);
    const jobTitleInput = screen.getByLabelText(/職種/i);

    await user.type(nameInput, "山田太郎");
    await user.type(jobTitleInput, "フロントエンドエンジニア");

    // フォームを送信
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // プロフィール詳細ページに遷移することを確認
    await waitFor(() => {
      expect(screen.getByText("山田太郎")).toBeInTheDocument();
      expect(screen.getByText("フロントエンドエンジニア")).toBeInTheDocument();
    });
  });

  it("スキルとSNSリンクを含むプロフィールを作成できる", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/create"]}>
        <ProfileProvider repository={repository}>
          <Routes>
            <Route path="/create" element={<CreateProfile />} />
            <Route path="/profile/:id" element={<ViewProfile />} />
          </Routes>
        </ProfileProvider>
      </MemoryRouter>
    );

    // 基本情報を入力
    await user.type(screen.getByLabelText(/名前/i), "佐藤花子");
    await user.type(screen.getByLabelText(/職種/i), "バックエンドエンジニア");
    await user.type(
      screen.getByLabelText(/自己紹介/i),
      "Pythonが得意です"
    );

    // スキルを追加
    const skillInput = screen.getByLabelText(/スキルを追加/i);
    await user.type(skillInput, "Python");
    const addSkillButtons = screen.getAllByRole("button", { name: /追加/i });
    await user.click(addSkillButtons[0]); // スキル追加ボタン

    await user.type(skillInput, "Django");
    await user.click(addSkillButtons[0]);

    // SNSリンクを追加
    const urlInput = screen.getByLabelText(/URL/i);
    await user.type(urlInput, "https://github.com/satoh");
    await user.click(screen.getByRole("button", { name: /リンクを追加/i }));

    // フォームを送信
    await user.click(screen.getByRole("button", { name: /保存/i }));

    // プロフィール詳細ページで情報が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("佐藤花子")).toBeInTheDocument();
      expect(screen.getByText("バックエンドエンジニア")).toBeInTheDocument();
      expect(screen.getByText("Pythonが得意です")).toBeInTheDocument();
      expect(screen.getByText("Python")).toBeInTheDocument();
      expect(screen.getByText("Django")).toBeInTheDocument();
    });
  });
});

describe("プロフィール編集フローの統合テスト", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  it("既存のプロフィールを編集し、変更が反映される", async () => {
    const user = userEvent.setup();

    // まずプロフィールを作成
    const { rerender: _rerender } = render(
      <MemoryRouter initialEntries={["/create"]}>
        <ProfileProvider repository={repository}>
          <Routes>
            <Route path="/create" element={<CreateProfile />} />
            <Route path="/profile/:id" element={<ViewProfile />} />
            <Route path="/profile/:id/edit" element={<EditProfile />} />
          </Routes>
        </ProfileProvider>
      </MemoryRouter>
    );

    // プロフィールを作成
    await user.type(screen.getByLabelText(/名前/i), "田中一郎");
    await user.type(screen.getByLabelText(/職種/i), "デザイナー");
    await user.click(screen.getByRole("button", { name: /保存/i }));

    // プロフィール詳細ページに遷移
    await waitFor(() => {
      expect(screen.getByText("田中一郎")).toBeInTheDocument();
    });

    // プロフィールIDを取得
    const profiles = await repository.findAll();
    const _profileId = profiles[0].id;

    // 編集ボタンをクリック
    const editButton = screen.getByRole("button", { name: /編集/i });
    await user.click(editButton);

    // 編集ページに遷移し、フォームが既存の値で初期化されることを確認
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/名前/i) as HTMLInputElement;
      expect(nameInput.value).toBe("田中一郎");
    });

    // 名前を変更
    const nameInput = screen.getByLabelText(/名前/i);
    await user.clear(nameInput);
    await user.type(nameInput, "田中次郎");

    // 保存
    await user.click(screen.getByRole("button", { name: /保存/i }));

    // プロフィール詳細ページで変更が反映されることを確認
    await waitFor(() => {
      expect(screen.getByText("田中次郎")).toBeInTheDocument();
      expect(screen.getByText("デザイナー")).toBeInTheDocument();
    });
  });
});

describe("プロフィール削除フローの統合テスト", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  it("プロフィールを削除できる", async () => {
    const user = userEvent.setup();

    // プロフィールを作成
    const { rerender: _rerender } = render(
      <MemoryRouter initialEntries={["/create"]}>
        <ProfileProvider repository={repository}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateProfile />} />
            <Route path="/profile/:id" element={<ViewProfile />} />
          </Routes>
        </ProfileProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/名前/i), "削除テスト");
    await user.type(screen.getByLabelText(/職種/i), "テストエンジニア");
    await user.click(screen.getByRole("button", { name: /保存/i }));

    // プロフィール詳細ページに遷移
    await waitFor(() => {
      expect(screen.getByText("削除テスト")).toBeInTheDocument();
    });

    // プロフィールIDを取得
    const profiles = await repository.findAll();
    expect(profiles).toHaveLength(1);
    const _profileId = profiles[0].id;

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole("button", { name: /削除/i });
    await user.click(deleteButton);

    // 確認ダイアログが表示されることを確認
    await waitFor(() => {
      expect(
        screen.getByText(/本当にこのプロフィールを削除しますか/)
      ).toBeInTheDocument();
    });

    // 削除を確認（ダイアログ内の削除ボタン）
    const deleteButtons = screen.getAllByRole("button", { name: /削除/i });
    const confirmButton = deleteButtons[1]; // ダイアログ内の削除ボタン
    await user.click(confirmButton);

    // ホームページにリダイレクトされることを確認
    await waitFor(() => {
      expect(screen.queryByText("削除テスト")).not.toBeInTheDocument();
    });

    // プロフィールが削除されたことを確認
    const remainingProfiles = await repository.findAll();
    expect(remainingProfiles).toHaveLength(0);
  });

  it("削除をキャンセルできる", async () => {
    const user = userEvent.setup();

    // プロフィールを作成
    render(
      <MemoryRouter initialEntries={["/create"]}>
        <ProfileProvider repository={repository}>
          <Routes>
            <Route path="/create" element={<CreateProfile />} />
            <Route path="/profile/:id" element={<ViewProfile />} />
          </Routes>
        </ProfileProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/名前/i), "キャンセルテスト");
    await user.type(screen.getByLabelText(/職種/i), "テストエンジニア");
    await user.click(screen.getByRole("button", { name: /保存/i }));

    // プロフィール詳細ページに遷移
    await waitFor(() => {
      expect(screen.getByText("キャンセルテスト")).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole("button", { name: /削除/i });
    await user.click(deleteButton);

    // 確認ダイアログが表示されることを確認
    await waitFor(() => {
      expect(
        screen.getByText(/本当にこのプロフィールを削除しますか/)
      ).toBeInTheDocument();
    });

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole("button", { name: /キャンセル/i });
    await user.click(cancelButton);

    // プロフィールが残っていることを確認
    await waitFor(() => {
      expect(screen.getByText("キャンセルテスト")).toBeInTheDocument();
    });

    const profiles = await repository.findAll();
    expect(profiles).toHaveLength(1);
  });
});

describe("ルーティングとナビゲーションのテスト", () => {
  let repository: LocalStorageRepository;

  beforeEach(async () => {
    repository = new LocalStorageRepository();
    await repository.clear();
  });

  it("存在しないプロフィールIDにアクセスすると404が表示される", async () => {
    render(
      <MemoryRouter initialEntries={["/profile/non-existent-id"]}>
        <ProfileProvider repository={repository}>
          <Routes>
            <Route path="/profile/:id" element={<ViewProfile />} />
          </Routes>
        </ProfileProvider>
      </MemoryRouter>
    );

    // 404メッセージが表示されることを確認
    await waitFor(() => {
      expect(
        screen.getByText(/プロフィールが見つかりません/)
      ).toBeInTheDocument();
    });
  });
});
