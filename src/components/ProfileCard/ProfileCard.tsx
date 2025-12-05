/**
 * ProfileCardコンポーネント
 * プロフィール情報を名刺風に表示するコンポーネント
 */

import type { Profile } from "../../types/profile";
import { PredefinedService } from "../../types/profile";
import { Button } from "../common/Button";
import "./ProfileCard.css";

interface ProfileCardProps {
  /** 表示するプロフィール */
  profile: Profile;
  /** 現在のユーザーID（所有者判定用） */
  currentUserId?: string | null;
  /** 編集ボタンのクリックハンドラ */
  onEdit?: () => void;
  /** 削除ボタンのクリックハンドラ */
  onDelete?: () => void;
  /** 共有ボタンのクリックハンドラ */
  onShare?: () => void;
}

/**
 * SNSサービスのアイコンを取得
 */
function getSocialIcon(service: string): string {
  switch (service) {
    case PredefinedService.TWITTER:
      return "𝕏"; // Twitter/X のアイコン
    case PredefinedService.GITHUB:
      return "⚙"; // GitHub のアイコン
    case PredefinedService.FACEBOOK:
      return "f"; // Facebook のアイコン
    default:
      return "🔗"; // その他のリンク
  }
}

/**
 * SNSサービスの表示名を取得
 */
function getSocialLabel(service: string): string {
  switch (service) {
    case PredefinedService.TWITTER:
      return "Twitter";
    case PredefinedService.GITHUB:
      return "GitHub";
    case PredefinedService.FACEBOOK:
      return "Facebook";
    default:
      return service;
  }
}

export function ProfileCard({
  profile,
  currentUserId,
  onEdit,
  onDelete,
  onShare,
}: ProfileCardProps) {
  // 所有者判定
  const isOwner = currentUserId && currentUserId === profile.user_id;

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <h1 className="profile-card-name">{profile.name}</h1>
        <p className="profile-card-job-title">{profile.jobTitle}</p>
      </div>

      {profile.bio && (
        <div className="profile-card-section">
          <h2 className="profile-card-section-title">自己紹介</h2>
          <p className="profile-card-bio">{profile.bio}</p>
        </div>
      )}

      {profile.yearsOfExperience !== undefined &&
        profile.yearsOfExperience !== null && (
          <div className="profile-card-section">
            <h2 className="profile-card-section-title">経験年数</h2>
            <p className="profile-card-experience">
              {profile.yearsOfExperience}年
            </p>
          </div>
        )}

      {profile.skills.length > 0 && (
        <div className="profile-card-section">
          <h2 className="profile-card-section-title">スキル</h2>
          <div className="profile-card-skills">
            {profile.skills.map((skill, index) => (
              <span key={index} className="profile-card-skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.socialLinks.length > 0 && (
        <div className="profile-card-section">
          <h2 className="profile-card-section-title">SNS・外部リンク</h2>
          <div className="profile-card-social-links">
            {profile.socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-card-social-link"
                aria-label={`${getSocialLabel(link.service)}へのリンク`}
              >
                <span className="profile-card-social-icon">
                  {getSocialIcon(link.service)}
                </span>
                <span className="profile-card-social-label">
                  {getSocialLabel(link.service)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="profile-card-actions">
        {onShare && (
          <Button onClick={onShare} variant="secondary" fullWidth>
            共有
          </Button>
        )}
        {isOwner && onEdit && (
          <Button onClick={onEdit} variant="primary" fullWidth>
            編集
          </Button>
        )}
        {isOwner && onDelete && (
          <Button onClick={onDelete} variant="danger" fullWidth>
            削除
          </Button>
        )}
      </div>
    </div>
  );
}
