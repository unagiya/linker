/**
 * ProfileCardコンポーネント
 * プロフィール情報を名刺風に表示するコンポーネント
 */

import React from 'react';
import type { Profile } from '../../types/profile';
import { PredefinedService } from '../../types/profile';
import { Button } from '../common/Button';
import './ProfileCard.css';

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
 * SNSサービスのSVGアイコンを取得
 */
function getSocialIcon(service: string): JSX.Element | null {
  switch (service) {
    case PredefinedService.TWITTER:
      // X (Twitter) 公式アイコン
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case PredefinedService.GITHUB:
      // GitHub 公式アイコン
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      );
    case PredefinedService.FACEBOOK:
      // Facebook 公式アイコン
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case PredefinedService.LINKEDIN:
      // LinkedIn 公式アイコン
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * SNSサービスの表示名を取得
 */
function getSocialLabel(service: string): string {
  switch (service) {
    case PredefinedService.TWITTER:
      return 'Twitter';
    case PredefinedService.GITHUB:
      return 'GitHub';
    case PredefinedService.FACEBOOK:
      return 'Facebook';
    case PredefinedService.LINKEDIN:
      return 'LinkedIn';
    default:
      return service;
  }
}

export const ProfileCard = React.memo(function ProfileCard({
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
      {/* プロフィール画像 */}
      <div className="profile-card-image-container">
        {profile.imageUrl ? (
          <img
            src={profile.imageUrl}
            alt={`${profile.name}のプロフィール画像`}
            className="profile-card-image"
            loading="lazy"
          />
        ) : (
          <div className="profile-card-avatar" aria-label="デフォルトアバター">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="profile-card-avatar-icon"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

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

      {profile.yearsOfExperience !== undefined && profile.yearsOfExperience !== null && (
        <div className="profile-card-section">
          <h2 className="profile-card-section-title">経験年数</h2>
          <p className="profile-card-experience">{profile.yearsOfExperience}年</p>
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
            {profile.socialLinks.map((link) => {
              const icon = getSocialIcon(link.service);
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-card-social-link"
                  aria-label={`${getSocialLabel(link.service)}へのリンク`}
                >
                  {icon ? (
                    // 定義済みサービスは公式アイコンを表示
                    <span className="profile-card-social-icon">{icon}</span>
                  ) : (
                    // カスタムサービスはサービス名を表示
                    <span className="profile-card-social-custom">{link.service}</span>
                  )}
                  <span className="profile-card-social-label">{getSocialLabel(link.service)}</span>
                </a>
              );
            })}
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
});
