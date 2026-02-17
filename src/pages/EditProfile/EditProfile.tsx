/**
 * EditProfileページ
 * プロフィール編集ページ
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileForm } from '../../components/ProfileForm';
import type { ProfileFormData } from '../../types';
import { LoadingSpinner, ErrorMessage } from '../../components/common';
import { isUUID } from '../../utils/urlUtils';
import './EditProfile.css';

/**
 * 成功メッセージコンポーネント
 */
function SuccessMessage({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 5秒後に自動的に閉じる

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="edit-profile-success-message" role="alert" aria-live="polite">
      <div className="edit-profile-success-content">
        <span className="edit-profile-success-icon">✓</span>
        <span className="edit-profile-success-text">{message}</span>
        <button
          className="edit-profile-success-close"
          onClick={onClose}
          aria-label="メッセージを閉じる"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function EditProfile() {
  const { nickname } = useParams<{ nickname: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loadProfileByNickname, updateProfile, loading, error, clearError } = useProfile();
  const [initialData, setInitialData] = useState<ProfileFormData | undefined>();
  const [notFound, setNotFound] = useState(false);
  const [notOwner, setNotOwner] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previousNickname, setPreviousNickname] = useState<string | undefined>();

  useEffect(() => {
    if (nickname) {
      // UUID形式のURLは404エラーとして扱う（要件3.6）
      if (isUUID(nickname)) {
        setNotFound(true);
        return;
      }

      loadProfileByNickname(nickname).then((loadedProfile) => {
        if (!loadedProfile) {
          setNotFound(true);
        } else if (user && loadedProfile.user_id !== user.id) {
          // 所有者でない場合、アクセスを拒否
          setNotOwner(true);
        } else {
          // プロフィールデータをフォームデータに変換
          const formData: ProfileFormData = {
            nickname: loadedProfile.nickname,
            name: loadedProfile.name,
            jobTitle: loadedProfile.jobTitle,
            bio: loadedProfile.bio || '',
            skills: loadedProfile.skills,
            yearsOfExperience: loadedProfile.yearsOfExperience?.toString() || '',
            socialLinks: loadedProfile.socialLinks.map((link) => ({
              service: link.service,
              url: link.url,
            })),
          };
          setInitialData(formData);
          setPreviousNickname(loadedProfile.nickname);
        }
      });
    }
  }, [nickname, loadProfileByNickname, user]);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!profile?.id) return;

    try {
      const updatedProfile = await updateProfile(profile.id, data);
      
      // ニックネームが変更された場合、成功メッセージを表示（要件9.5）
      if (previousNickname && data.nickname !== previousNickname) {
        setSuccessMessage('ニックネームが正常に更新されました');
      }
      
      // 更新成功時、新しいニックネームベースURLにリダイレクト（要件4.5）
      navigate(`/profile/${updatedProfile.nickname}`);
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
      // エラーはProfileContextで処理され、errorステートに設定される
      // ニックネーム変更失敗時のエラーハンドリング（要件4.4, 9.5）
      if (err instanceof Error) {
        // エラーメッセージはProfileContextのerrorステートに設定されているため、
        // ErrorMessageコンポーネントで表示される
      }
    }
  };

  const handleCancel = () => {
    if (profile?.nickname) {
      navigate(`/profile/${profile.nickname}`);
    } else {
      navigate('/');
    }
  };

  if (loading && !initialData) {
    return (
      <div className="edit-profile">
        <LoadingSpinner message="プロフィールを読み込んでいます..." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="edit-profile">
        <div className="edit-profile-not-found">
          <h1 className="edit-profile-not-found-title">プロフィールが見つかりません</h1>
          <p className="edit-profile-not-found-message">
            指定されたプロフィールは存在しないか、削除された可能性があります。
          </p>
          <button className="edit-profile-not-found-button" onClick={() => navigate('/')}>
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (notOwner) {
    return (
      <div className="edit-profile">
        <div className="edit-profile-not-found">
          <h1 className="edit-profile-not-found-title">アクセスが拒否されました</h1>
          <p className="edit-profile-not-found-message">
            このプロフィールを編集する権限がありません。自分のプロフィールのみ編集できます。
          </p>
          <button
            className="edit-profile-not-found-button"
            onClick={() => navigate(profile?.nickname ? `/profile/${profile.nickname}` : '/')}
          >
            プロフィールページに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="edit-profile">
      <div className="edit-profile-container">
        <header className="edit-profile-header">
          <h1 className="edit-profile-title">プロフィール編集</h1>
          <p className="edit-profile-description">プロフィール情報を更新してください</p>
        </header>

        {error && <ErrorMessage message={error} onClose={clearError} />}

        {successMessage && (
          <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />
        )}

        <ProfileForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}
