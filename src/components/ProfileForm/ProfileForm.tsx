/**
 * ProfileFormコンポーネント
 * プロフィールの作成・編集フォーム
 */

import { useState } from "react";
import type { ProfileFormData } from "../../types";
import { PredefinedService } from "../../types";
import { validateProfileForm } from "../../utils";
import { Button, Input, TextArea } from "../common";
import "./ProfileForm.css";

interface ProfileFormProps {
  /** 初期値（編集時） */
  initialData?: ProfileFormData;
  /** 送信ハンドラ */
  onSubmit: (data: ProfileFormData) => Promise<void>;
  /** キャンセルハンドラ */
  onCancel?: () => void;
  /** 送信中フラグ */
  isSubmitting?: boolean;
}

export function ProfileForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProfileFormProps) {
  // フォームデータ（初期値を直接設定）
  const [formData, setFormData] = useState<ProfileFormData>(
    initialData || {
      name: "",
      jobTitle: "",
      bio: "",
      skills: [],
      yearsOfExperience: "",
      socialLinks: [],
    }
  );

  // スキル入力用の一時的な値
  const [skillInput, setSkillInput] = useState("");

  // SNSリンク入力用の一時的な値
  const [linkService, setLinkService] = useState<string>(PredefinedService.TWITTER);
  const [linkUrl, setLinkUrl] = useState("");
  const [isCustomService, setIsCustomService] = useState(false);

  // バリデーションエラー
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // フィールド変更ハンドラ
  const handleChange = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // スキル追加
  const handleAddSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
      handleChange("skills", [...formData.skills, trimmedSkill]);
      setSkillInput("");
    }
  };

  // スキル削除
  const handleRemoveSkill = (index: number) => {
    handleChange(
      "skills",
      formData.skills.filter((_, i) => i !== index)
    );
  };

  // SNSリンク追加
  const handleAddSocialLink = () => {
    const trimmedUrl = linkUrl.trim();
    const service = linkService.trim();

    if (service && trimmedUrl) {
      const newLink = { service, url: trimmedUrl };
      handleChange("socialLinks", [...formData.socialLinks, newLink]);
      setLinkUrl("");
      setLinkService(PredefinedService.TWITTER);
      setIsCustomService(false);
    }
  };

  // SNSリンク削除
  const handleRemoveSocialLink = (index: number) => {
    handleChange(
      "socialLinks",
      formData.socialLinks.filter((_, i) => i !== index)
    );
  };

  // サービス選択変更
  const handleServiceChange = (value: string) => {
    if (value === "custom") {
      setIsCustomService(true);
      setLinkService("");
    } else {
      setIsCustomService(false);
      setLinkService(value);
    }
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    const result = validateProfileForm(formData);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("フォーム送信エラー:", error);
    }
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      {/* 基本情報 */}
      <div className="profile-form-section">
        <h2 className="profile-form-section-title">基本情報</h2>

        <Input
          label="名前"
          required
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={errors.name?.[0]}
          disabled={isSubmitting}
        />

        <Input
          label="職種"
          required
          value={formData.jobTitle}
          onChange={(e) => handleChange("jobTitle", e.target.value)}
          error={errors.jobTitle?.[0]}
          disabled={isSubmitting}
        />

        <TextArea
          label="自己紹介"
          value={formData.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
          error={errors.bio?.[0]}
          disabled={isSubmitting}
          placeholder="あなたについて教えてください"
        />

        <Input
          label="経験年数"
          type="number"
          min="0"
          max="100"
          value={formData.yearsOfExperience}
          onChange={(e) => handleChange("yearsOfExperience", e.target.value)}
          error={errors.yearsOfExperience?.[0]}
          disabled={isSubmitting}
        />
      </div>

      {/* スキル */}
      <div className="profile-form-section">
        <h2 className="profile-form-section-title">スキル</h2>

        <div className="profile-form-skill-input">
          <Input
            label="スキルを追加"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            disabled={isSubmitting}
            placeholder="例: React, TypeScript"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddSkill}
            disabled={isSubmitting || !skillInput.trim()}
          >
            追加
          </Button>
        </div>

        {formData.skills.length > 0 && (
          <div className="profile-form-tags">
            {formData.skills.map((skill, index) => (
              <div key={index} className="profile-form-tag">
                <span>{skill}</span>
                <button
                  type="button"
                  className="profile-form-tag-remove"
                  onClick={() => handleRemoveSkill(index)}
                  disabled={isSubmitting}
                  aria-label={`${skill}を削除`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.skills?.[0] && (
          <span className="profile-form-error">{errors.skills[0]}</span>
        )}
      </div>

      {/* SNSリンク */}
      <div className="profile-form-section">
        <h2 className="profile-form-section-title">SNS・外部リンク</h2>

        <div className="profile-form-social-input">
          <div className="profile-form-social-service">
            <label htmlFor="service-select" className="profile-form-label">
              サービス
            </label>
            <select
              id="service-select"
              className="profile-form-select"
              value={isCustomService ? "custom" : linkService}
              onChange={(e) => handleServiceChange(e.target.value)}
              disabled={isSubmitting}
            >
              <option value={PredefinedService.TWITTER}>Twitter</option>
              <option value={PredefinedService.GITHUB}>GitHub</option>
              <option value={PredefinedService.FACEBOOK}>Facebook</option>
              <option value="custom">その他</option>
            </select>
          </div>

          {isCustomService && (
            <Input
              label="カスタムサービス名"
              value={linkService}
              onChange={(e) => setLinkService(e.target.value)}
              disabled={isSubmitting}
              placeholder="例: LinkedIn"
            />
          )}

          <Input
            label="URL"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            disabled={isSubmitting}
            placeholder="https://example.com"
          />

          <Button
            type="button"
            variant="secondary"
            onClick={handleAddSocialLink}
            disabled={
              isSubmitting || !linkService.trim() || !linkUrl.trim()
            }
          >
            リンクを追加
          </Button>
        </div>

        {formData.socialLinks.length > 0 && (
          <div className="profile-form-links">
            {formData.socialLinks.map((link, index) => (
              <div key={index} className="profile-form-link">
                <div className="profile-form-link-info">
                  <span className="profile-form-link-service">
                    {link.service}
                  </span>
                  <span className="profile-form-link-url">{link.url}</span>
                </div>
                <button
                  type="button"
                  className="profile-form-link-remove"
                  onClick={() => handleRemoveSocialLink(index)}
                  disabled={isSubmitting}
                  aria-label={`${link.service}のリンクを削除`}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.socialLinks?.[0] && (
          <span className="profile-form-error">{errors.socialLinks[0]}</span>
        )}
      </div>

      {/* アクションボタン */}
      <div className="profile-form-actions">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
