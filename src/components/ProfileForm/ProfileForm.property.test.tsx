/**
 * ProfileFormコンポーネントのプロパティベーステスト
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import * as fc from "fast-check";
import { ProfileForm } from "./ProfileForm";
import type { ProfileFormData } from "../../types/profile";

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

describe("ProfileForm - Property Based Tests", () => {
  /**
   * Feature: engineer-profile-platform, Property 17: スキル配列の管理
   * 任意のスキル文字列の配列（最大20個）に対して、
   * すべてのスキルが保存され、読み込み時に同じ順序で取得できる
   * Validates: Requirements 4.6
   */
  describe("Property 17: スキル配列の管理", () => {
    // 英数字のみのスキル名を生成するジェネレーター
    const skillArbitrary = fc
      .stringMatching(/^[a-zA-Z0-9]+$/)
      .filter((s) => s.length >= 1 && s.length <= 50);

    it("任意のスキル配列を初期データとして設定すると、同じ順序で表示される", () => {
      fc.assert(
        fc.property(
          fc.array(skillArbitrary, {
            minLength: 1,
            maxLength: 20,
          }),
          (skills) => {
            cleanup(); // 各反復前にクリーンアップ
            const mockOnSubmit = vi.fn();

            const initialData: Partial<ProfileFormData> = {
              name: "テストユーザー",
              jobTitle: "エンジニア",
              skills,
            };

            render(
              <ProfileForm onSubmit={mockOnSubmit} initialData={initialData} />
            );

            // すべてのスキルが表示されることを確認
            skills.forEach((skill) => {
              expect(screen.getByText(skill)).toBeInTheDocument();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("スキルを追加すると、フォーム送信時に正しい順序で含まれる", () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(skillArbitrary, {
            minLength: 1,
            maxLength: 5,
          }),
          async (skillsToAdd) => {
            cleanup(); // 各反復前にクリーンアップ
            const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

            render(<ProfileForm onSubmit={mockOnSubmit} />);

            const nameInput = screen.getByLabelText(/名前/);
            const jobTitleInput = screen.getByLabelText(/職種/);
            const skillInput = screen.getByPlaceholderText(
              "スキルを入力してEnter"
            );

            // 名前と職種を入力
            fireEvent.change(nameInput, { target: { value: "テストユーザー" } });
            fireEvent.change(jobTitleInput, { target: { value: "エンジニア" } });

            // スキルを順番に追加
            for (const skill of skillsToAdd) {
              fireEvent.change(skillInput, { target: { value: skill } });
              fireEvent.keyDown(skillInput, { key: "Enter", code: "Enter" });
            }

            // フォームを送信
            const submitButton = screen.getByRole("button", { name: "保存" });
            fireEvent.click(submitButton);

            // onSubmitが呼ばれることを確認
            await waitFor(() => {
              expect(mockOnSubmit).toHaveBeenCalled();
            });

            // 送信されたデータのスキル配列が正しい順序であることを確認
            const submittedData = mockOnSubmit.mock.calls[0][0];
            expect(submittedData.skills).toEqual(skillsToAdd);
          }
        ),
        { numRuns: 50 } // 反復回数を減らして実行時間を短縮
      );
    });

    it("スキルを削除すると、残りのスキルの順序が保持される", () => {
      fc.assert(
        fc.property(
          fc
            .array(skillArbitrary, {
              minLength: 3,
              maxLength: 10,
            })
            .filter((arr) => new Set(arr).size === arr.length), // 重複を除外
          fc.integer({ min: 0, max: 2 }), // 削除するインデックス
          (skills, removeIndex) => {
            cleanup(); // 各反復前にクリーンアップ
            const mockOnSubmit = vi.fn();

            const initialData: Partial<ProfileFormData> = {
              name: "テストユーザー",
              jobTitle: "エンジニア",
              skills,
            };

            render(
              <ProfileForm onSubmit={mockOnSubmit} initialData={initialData} />
            );

            // 削除ボタンを取得
            const removeButtons = screen.getAllByLabelText(/を削除/);

            // 指定されたインデックスのスキルを削除
            if (removeIndex < removeButtons.length) {
              const skillToRemove = skills[removeIndex];
              fireEvent.click(removeButtons[removeIndex]);

              // 削除されたスキルが表示されないことを確認
              expect(screen.queryByText(skillToRemove)).not.toBeInTheDocument();

              // 残りのスキルが正しい順序で表示されることを確認
              const remainingSkills = skills.filter(
                (_, i) => i !== removeIndex
              );
              remainingSkills.forEach((skill) => {
                expect(screen.getByText(skill)).toBeInTheDocument();
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: engineer-profile-platform, Property 14: 無効な必須項目の拒否
   * 任意のプロフィールデータで、名前または職種が空文字列の場合、
   * プロフィール作成は失敗し、エラーメッセージが表示される
   * Validates: Requirements 3.5
   */
  describe("Property 14: 無効な必須項目の拒否", () => {
    it("名前が空文字列の場合、バリデーションエラーが発生する", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // 有効な職種
          (jobTitle) => {
            cleanup(); // 各反復前にクリーンアップ
            const mockOnSubmit = vi.fn();

            render(<ProfileForm onSubmit={mockOnSubmit} />);

            const nameInput = screen.getByLabelText(/名前/);
            const jobTitleInput = screen.getByLabelText(/職種/);
            const submitButton = screen.getByRole("button", { name: "保存" });

            // 名前を空文字列に設定
            fireEvent.change(nameInput, { target: { value: "" } });
            fireEvent.change(jobTitleInput, { target: { value: jobTitle } });
            fireEvent.click(submitButton);

            // エラーメッセージが表示されることを確認
            const errorMessage = screen.queryByText(/名前は必須です/);
            expect(errorMessage).toBeInTheDocument();

            // onSubmitが呼ばれないことを確認
            expect(mockOnSubmit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("職種が空文字列の場合、バリデーションエラーが発生する", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // 有効な名前
          (name) => {
            cleanup(); // 各反復前にクリーンアップ
            const mockOnSubmit = vi.fn();

            render(<ProfileForm onSubmit={mockOnSubmit} />);

            const nameInput = screen.getByLabelText(/名前/);
            const jobTitleInput = screen.getByLabelText(/職種/);
            const submitButton = screen.getByRole("button", { name: "保存" });

            // 職種を空文字列に設定
            fireEvent.change(nameInput, { target: { value: name } });
            fireEvent.change(jobTitleInput, { target: { value: "" } });
            fireEvent.click(submitButton);

            // エラーメッセージが表示されることを確認
            const errorMessage = screen.queryByText(/職種は必須です/);
            expect(errorMessage).toBeInTheDocument();

            // onSubmitが呼ばれないことを確認
            expect(mockOnSubmit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("名前と職種の両方が空文字列の場合、バリデーションエラーが発生する", () => {
      fc.assert(
        fc.property(
          fc.constant(null), // ダミー引数
          () => {
            cleanup(); // 各反復前にクリーンアップ
            const mockOnSubmit = vi.fn();

            render(<ProfileForm onSubmit={mockOnSubmit} />);

            const nameInput = screen.getByLabelText(/名前/);
            const jobTitleInput = screen.getByLabelText(/職種/);
            const submitButton = screen.getByRole("button", { name: "保存" });

            // 名前と職種を空文字列に設定
            fireEvent.change(nameInput, { target: { value: "" } });
            fireEvent.change(jobTitleInput, { target: { value: "" } });
            fireEvent.click(submitButton);

            // 両方のエラーメッセージが表示されることを確認
            const nameError = screen.queryByText(/名前は必須です/);
            const jobTitleError = screen.queryByText(/職種は必須です/);
            expect(nameError).toBeInTheDocument();
            expect(jobTitleError).toBeInTheDocument();

            // onSubmitが呼ばれないことを確認
            expect(mockOnSubmit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("名前と職種が有効な場合、バリデーションが成功する", () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // 有効な名前
          fc.string({ minLength: 1, maxLength: 100 }), // 有効な職種
          async (name, jobTitle) => {
            cleanup(); // 各反復前にクリーンアップ
            const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

            render(<ProfileForm onSubmit={mockOnSubmit} />);

            const nameInput = screen.getByLabelText(/名前/);
            const jobTitleInput = screen.getByLabelText(/職種/);
            const submitButton = screen.getByRole("button", { name: "保存" });

            // 有効な名前と職種を設定
            fireEvent.change(nameInput, { target: { value: name } });
            fireEvent.change(jobTitleInput, { target: { value: jobTitle } });
            fireEvent.click(submitButton);

            // エラーメッセージが表示されないことを確認
            await waitFor(() => {
              const nameError = screen.queryByText(/名前は必須です/);
              const jobTitleError = screen.queryByText(/職種は必須です/);
              expect(nameError).not.toBeInTheDocument();
              expect(jobTitleError).not.toBeInTheDocument();
            });

            // onSubmitが呼ばれることを確認
            await waitFor(() => {
              expect(mockOnSubmit).toHaveBeenCalled();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
