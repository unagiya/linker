/**
 * ProfileFormコンポーネント
 * プロフィールの作成・編集フォーム
 */

import { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Button } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { validateProfileForm } from '../../utils/validation';
import { validateImageFile } from '../../services/imageService';
import { PredefinedService } from '../../types/profile';
import type { ProfileFormData } from '../../types/profile';
import './ProfileForm.css';

interface ProfileFormProps {
  /** 初期値（編集時） */
  initialData?: Partial<ProfileFormData>;
  /** 送信ハンドラ */
  onSubmit: (data: ProfileFormData) => Promise<void>;
  /** キャンセルハンドラ */
  onCancel?: () => void;
  /** ローディング状態 */
  loading?: boolean;
  /** エラーメッセージ */
  error?: string | null;
}

export function ProfileForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
}: ProfileFormProps) {
  // フォームの状態
  const [nickname, setNickname] = useState(initialData?.nickname || '');
  const [name, setName] = useState(initialData?.name || '');
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(initialData?.yearsOfExperience || '');
  const [socialLinks, setSocialLinks] = useState<Array<{ service: string; url: string }>>(
    initialData?.socialLinks || []
  );
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(initialData?.imageUrl);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // バリデーションエラー
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // 初期データが変更されたらフォームを更新
  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(initialData.name || '');
      setJobTitle(initialData.jobTitle || '');
      setBio(initialData.bio || '');
      setSkills(initialData.skills || []);
      setYearsOfExperience(initialData.yearsOfExperience || '');
      setSocialLinks(initialData.socialLinks || []);
      setImagePreview(initialData.imageUrl);
      setImageFile(undefined);
      setRemoveImage(false);
    }
  }, [initialData]);

  /**
   * 画像ファイル選択ハンドラ
   */
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像バリデーション
    try {
      validateImageFile(file);
      setImageFile(file);
      setRemoveImage(false);

      // プレビュー生成
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // エラーをクリア
      if (validationErrors.imageFile) {
        const newErrors = { ...validationErrors };
        delete newErrors.imageFile;
        setValidationErrors(newErrors);
      }
    } catch (error) {
      setValidationErrors((prev) => ({
        ...prev,
        imageFile: [error instanceof Error ? error.message : '画像の読み込みに失敗しました'],
      }));
    }
  };

  /**
   * 画像削除ハンドラ
   */
  const handleRemoveImage = () => {
    setImageFile(undefined);
    setImagePreview(undefined);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // エラーをクリア
    if (validationErrors.imageFile) {
      const newErrors = { ...validationErrors };
      delete newErrors.imageFile;
      setValidationErrors(newErrors);
    }
  };

  /**
   * フォーム送信ハンドラ
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData: ProfileFormData = {
      nickname,
      name,
      jobTitle,
      bio,
      skills,
      yearsOfExperience,
      socialLinks,
      imageFile,
      imageUrl: imagePreview,
      removeImage,
    };

    // バリデーション
    const validationResult = validateProfileForm(formData);

    if (!validationResult.success) {
      setValidationErrors(validationResult.errors);
      return;
    }

    // バリデーションエラーをクリア
    setValidationErrors({});

    // 送信
    try {
      await onSubmit(formData);
    } catch {
      // エラーは親コンポーネントで処理される
    }
  };

  /**
   * スキル追加ハンドラ
   */
  const handleAddSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      if (skills.length >= 20) {
        setValidationErrors((prev) => ({
          ...prev,
          skills: ['スキルは20個まで登録できます'],
        }));
        return;
      }
      setSkills([...skills, trimmedSkill]);
      setSkillInput('');
      // エラーをクリア
      if (validationErrors.skills) {
        const newErrors = { ...validationErrors };
        delete newErrors.skills;
        setValidationErrors(newErrors);
      }
    }
  };

  /**
   * スキル削除ハンドラ
   */
  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
    // エラーをクリア
    if (validationErrors.skills) {
      const newErrors = { ...validationErrors };
      delete newErrors.skills;
      setValidationErrors(newErrors);
    }
  };

  /**
   * スキル入力でEnterキーが押されたときの処理
   */
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  /**
   * SNSリンク追加ハンドラ
   */
  const handleAddSocialLink = () => {
    if (socialLinks.length >= 10) {
      setValidationErrors((prev) => ({
        ...prev,
        socialLinks: ['SNSリンクは10個まで登録できます'],
      }));
      return;
    }
    setSocialLinks([...socialLinks, { service: '', url: '' }]);
  };

  /**
   * SNSリンク削除ハンドラ
   */
  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
    // エラーをクリア
    const newErrors = { ...validationErrors };
    delete newErrors[`socialLinks.${index}.service`];
    delete newErrors[`socialLinks.${index}.url`];
    setValidationErrors(newErrors);
  };

  /**
   * SNSリンクのサービス変更ハンドラ
   */
  const handleSocialLinkServiceChange = (index: number, value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index] = { ...newLinks[index], service: value };
    setSocialLinks(newLinks);
    // エラーをクリア
    if (validationErrors[`socialLinks.${index}.service`]) {
      const newErrors = { ...validationErrors };
      delete newErrors[`socialLinks.${index}.service`];
      setValidationErrors(newErrors);
    }
  };

  /**
   * SNSリンクのURL変更ハンドラ
   */
  const handleSocialLinkUrlChange = (index: number, value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index] = { ...newLinks[index], url: value };
    setSocialLinks(newLinks);
    // エラーをクリア
    if (validationErrors[`socialLinks.${index}.url`]) {
      const newErrors = { ...validationErrors };
      delete newErrors[`socialLinks.${index}.url`];
      setValidationErrors(newErrors);
    }
  };

  return (
    <div className="profile-form-container">
      <div className="profile-form-card">
        <h1 className="profile-form-title">
          {initialData ? 'プロフィール編集' : 'プロフィール作成'}
        </h1>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* プロフィール画像 */}
          <div className="profile-form-section">
            <label className="profile-form-section-label">プロフィール画像</label>
            <div className="profile-form-image-upload">
              {imagePreview ? (
                <div className="profile-form-image-preview">
                  <img 
                    src={imagePreview} 
                    alt="プロフィール画像プレビュー" 
                    loading="lazy"
                  />
                  <Button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={loading}
                    variant="danger"
                    aria-label="画像を削除"
                  >
                    画像を削除
                  </Button>
                </div>
              ) : (
                <div className="profile-form-image-input">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="profile-form-file-input"
                    aria-label="画像ファイルを選択"
                  />
                  <p className="profile-form-image-hint">
                    JPEG、PNG、WebP形式、最大5MBまで
                  </p>
                </div>
              )}
            </div>
            {validationErrors.imageFile && (
              <span className="profile-form-error" role="alert">
                {validationErrors.imageFile[0]}
              </span>
            )}
          </div>

          {/* 名前 */}
          <Input
            label="名前"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={validationErrors.name?.[0]}
            required
            disabled={loading}
            placeholder="山田太郎"
          />

          {/* 職種 */}
          <Input
            label="職種"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            error={validationErrors.jobTitle?.[0]}
            required
            disabled={loading}
            placeholder="フロントエンドエンジニア"
          />

          {/* 自己紹介 */}
          <TextArea
            label="自己紹介"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            error={validationErrors.bio?.[0]}
            disabled={loading}
            placeholder="あなたの経験やスキルについて教えてください"
            rows={4}
          />

          {/* 経験年数 */}
          <Input
            label="経験年数"
            type="number"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            error={validationErrors.yearsOfExperience?.[0]}
            disabled={loading}
            placeholder="5"
            min="0"
            max="100"
          />

          {/* スキル */}
          <div className="profile-form-section">
            <label className="profile-form-section-label">スキル</label>
            <div className="profile-form-skill-input">
              <Input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                disabled={loading}
                placeholder="スキルを入力してEnter"
              />
              <Button
                type="button"
                onClick={handleAddSkill}
                disabled={loading || !skillInput.trim()}
                variant="secondary"
              >
                追加
              </Button>
            </div>
            {validationErrors.skills && (
              <span className="profile-form-error" role="alert">
                {validationErrors.skills[0]}
              </span>
            )}
            {skills.length > 0 && (
              <div className="profile-form-skill-tags">
                {skills.map((skill, index) => (
                  <div key={index} className="profile-form-skill-tag">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      disabled={loading}
                      className="profile-form-skill-tag-remove"
                      aria-label={`${skill}を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SNSリンク */}
          <div className="profile-form-section">
            <label className="profile-form-section-label">SNS・外部リンク</label>
            {socialLinks.map((link, index) => (
              <div key={index} className="profile-form-social-link">
                <div className="profile-form-social-link-inputs">
                  <div className="profile-form-social-link-service">
                    <select
                      value={link.service}
                      onChange={(e) => handleSocialLinkServiceChange(index, e.target.value)}
                      disabled={loading}
                      className="profile-form-select"
                      aria-label="サービス選択"
                    >
                      <option value="">サービスを選択</option>
                      <option value={PredefinedService.TWITTER}>Twitter</option>
                      <option value={PredefinedService.GITHUB}>GitHub</option>
                      <option value={PredefinedService.FACEBOOK}>Facebook</option>
                      <option value={PredefinedService.LINKEDIN}>LinkedIn</option>
                      <option value="custom">その他</option>
                    </select>
                    {link.service === 'custom' && (
                      <Input
                        type="text"
                        value={link.service === 'custom' ? '' : link.service}
                        onChange={(e) => handleSocialLinkServiceChange(index, e.target.value)}
                        disabled={loading}
                        placeholder="サービス名を入力"
                        error={validationErrors[`socialLinks.${index}.service`]?.[0]}
                      />
                    )}
                    {validationErrors[`socialLinks.${index}.service`] && (
                      <span className="profile-form-error" role="alert">
                        {validationErrors[`socialLinks.${index}.service`][0]}
                      </span>
                    )}
                  </div>
                  <div className="profile-form-social-link-url">
                    <Input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleSocialLinkUrlChange(index, e.target.value)}
                      disabled={loading}
                      placeholder="https://example.com"
                      error={validationErrors[`socialLinks.${index}.url`]?.[0]}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => handleRemoveSocialLink(index)}
                  disabled={loading}
                  variant="danger"
                  aria-label="リンクを削除"
                >
                  削除
                </Button>
              </div>
            ))}
            {validationErrors.socialLinks && (
              <span className="profile-form-error" role="alert">
                {validationErrors.socialLinks[0]}
              </span>
            )}
            <Button
              type="button"
              onClick={handleAddSocialLink}
              disabled={loading || socialLinks.length >= 10}
              variant="secondary"
            >
              リンクを追加
            </Button>
          </div>

          {/* 送信ボタン */}
          <div className="profile-form-actions">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                disabled={loading}
                variant="secondary"
                fullWidth
              >
                キャンセル
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
