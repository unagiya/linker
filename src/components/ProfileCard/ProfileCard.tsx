/**
 * ProfileCardコンポーネント
 * プロフィールを名刺風に表示
 */

import type { Profile } from "../../types";
import { PredefinedService } from "../../types";
import { Button } from "../common";
import "./ProfileCard.css";

interface ProfileCardProps {
  /** 表示するプロフィール */
  profile: Profile;
  /** 所有者かどうか */
  isOwner: boolean;
  /** 編集ハンドラ */
  onEdit?: () => void;
  /** 削除ハンドラ */
  onDelete?: () => void;
  /** 共有ハンドラ */
  onShare?: () => void;
}

/**
 * SNSサービスのアイコンを取得
 */
function getServiceIcon(service: string): string {
  switch (service) {
    case PredefinedService.TWITTER:
      return "🐦"; // Twitter/X
    case PredefinedService.GITHUB:
      return "💻"; // GitHub
    case PredefinedService.FACEBOOK:
      return "👥"; // Facebook
    default:
      return "🔗"; // その他
  }
}

export function ProfileCard({
  profile,
  isOwner,
  onEdit,
  onDelete,
  onShare,
}: ProfileCardProps) {
  return (
    <div className="profile-card">
      {/* ヘッダー */}
      <div className="profile-card-header">
        <div className="profile-card-avatar">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-card-basic">
          <h1 className="profile-card-name">{profile.name}</h1>
          <p className="profile-card-job-title">{profile.jobTitle}</p>
        </div>
      </div>

      {/* 経験年数 */}
      {profile.yearsOfExperience !== undefined && (
        <div className="profile-card-experience">
          <span className="profile-card-label">経験年数</span>
          <span className="profile-card-value">
            {profile.yearsOfExperience}年
          </span>
        </div>
      )}

      {/* 自己紹介 */}
      {profile.bio && (
        <div className="profile-card-section">
          <h2 className="profile-card-section-title">自己紹介</h2>
          <p className="profile-card-bio">{profile.bio}</p>
        </div>
      )}

      {/* スキル */}
      {profile.skills.length > 0 && (
        <div className="profile-card-section">
          <h2 className="profile-card-section-title">スキル</h2>
          <div className="profile-card-skills">
            {profile.skills.map((skill, index) => (
              <span key={index} className="profile-card-skill">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SNSリンク */}
      {profile.socialLinks.length > 0 && (
        <div className="profile-card-section">
          <h2 className="profile-card-section-title">SNS・外部リンク</h2>
          <div className="profile-card-links">
            {profile.socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-card-link"
              >
                <span className="profile-card-link-icon">
                  {getServiceIcon(link.service)}
                </span>
                <span className="profile-card-link-text">{link.service}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="profile-card-actions">
        {onShare && (
          <Button variant="secondary" onClick={onShare} fullWidth>
            共有
          </Button>
        )}
        {isOwner && onEdit && (
          <Button variant="primary" onClick={onEdit} fullWidth>
            編集
          </Button>
        )}
        {isOwner && onDelete && (
          <Button variant="danger" onClick={onDelete} fullWidth>
            削除
          </Button>
        )}
      </div>

      {/* メタ情報 */}
      <div className="profile-card-meta">
        <span className="profile-card-meta-text">
          作成日: {new Date(profile.createdAt).toLocaleDateString("ja-JP")}
        </span>
        {profile.updatedAt !== profile.createdAt && (
          <span className="profile-card-meta-text">
            更新日: {new Date(profile.updatedAt).toLocaleDateString("ja-JP")}
          </span>
        )}
      </div>
    </div>
  );
}
