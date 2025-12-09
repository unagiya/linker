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
import './EditProfile.css';

export function EditProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadProfile, updateProfile, loading, error, clearError } = useProfile();
  const [initialData, setInitialData] = useState<ProfileFormData | undefined>();
  const [notFound, setNotFound] = useState(false);
  const [notOwner, setNotOwner] = useState(false);

  useEffect(() => {
    if (id) {
      loadProfile(id).then((loadedProfile) => {
        if (!loadedProfile) {
          setNotFound(true);
        } else if (user && loadedProfile.user_id !== user.id) {
          // 所有者でない場合、アクセスを拒否
          setNotOwner(true);
        } else {
          // プロフィールデータをフォームデータに変換
          const formData: ProfileFormData = {
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
        }
      });
    }
  }, [id, loadProfile, user]);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!id) return;

    try {
      await updateProfile(id, data);
      // 更新成功時、プロフィール詳細ページにリダイレクト
      navigate(`/profile/${id}`);
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
    }
  };

  const handleCancel = () => {
    if (id) {
      navigate(`/profile/${id}`);
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
            onClick={() => navigate(id ? `/profile/${id}` : '/')}
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
