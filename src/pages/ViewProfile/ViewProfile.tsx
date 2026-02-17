/**
 * ViewProfileページ
 * プロフィール表示ページ
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileCard } from '../../components/ProfileCard';
import { LoadingSpinner, ErrorMessage, ConfirmDialog } from '../../components/common';
import { isUUID } from '../../utils/urlUtils';
import './ViewProfile.css';

export function ViewProfile() {
  const { nickname } = useParams<{ nickname: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loadProfileByNickname, deleteProfile, loading, error, clearError } = useProfile();
  const [notFound, setNotFound] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname]);

  const handleEdit = () => {
    if (profile?.nickname) {
      navigate(`/profile/${profile.nickname}/edit`);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!profile?.id) return;

    setIsDeleting(true);
    try {
      await deleteProfile(profile.id);
      // 削除成功時、ホームページにリダイレクト
      navigate('/');
    } catch (err) {
      console.error('プロフィール削除エラー:', err);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleShare = async () => {
    if (!profile?.nickname) return;

    // ニックネームベースURLを共有URLとして使用（要件3.3）
    const url = `${window.location.origin}/profile/${profile.nickname}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      console.error('URLのコピーに失敗しました:', err);
    }
  };

  if (loading) {
    return (
      <div className="view-profile">
        <LoadingSpinner message="プロフィールを読み込んでいます..." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="view-profile">
        <div className="view-profile-not-found">
          <h1 className="view-profile-not-found-title">プロフィールが見つかりません</h1>
          <p className="view-profile-not-found-message">
            指定されたプロフィールは存在しないか、削除された可能性があります。
          </p>
          <button className="view-profile-not-found-button" onClick={() => navigate('/')}>
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="view-profile">
      <div className="view-profile-container">
        {error && <ErrorMessage message={error} onClose={clearError} />}

        {shareSuccess && (
          <div className="view-profile-share-success" role="alert">
            URLをクリップボードにコピーしました！
          </div>
        )}

        <ProfileCard
          profile={profile}
          currentUserId={user?.id || null}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onShare={handleShare}
        />

        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="プロフィールを削除"
          message="本当にこのプロフィールを削除しますか？この操作は取り消せません。"
          confirmText="削除"
          cancelText="キャンセル"
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isProcessing={isDeleting}
        />
      </div>
    </div>
  );
}
