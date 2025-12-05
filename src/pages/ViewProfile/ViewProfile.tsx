/**
 * ViewProfileページ
 * プロフィール表示ページ
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfileContext } from "../../contexts/ProfileContext";
import { ProfileCard } from "../../components/ProfileCard";
import {
  LoadingSpinner,
  ErrorMessage,
  ConfirmDialog,
} from "../../components/common";
import "./ViewProfile.css";

export function ViewProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    profile,
    loadProfile,
    deleteProfile,
    loading,
    error,
    clearError,
  } = useProfileContext();
  const [notFound, setNotFound] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProfile(id).then((loadedProfile) => {
        if (!loadedProfile) {
          setNotFound(true);
        }
      });
    }
  }, [id, loadProfile]);

  const handleEdit = () => {
    if (id) {
      navigate(`/profile/${id}/edit`);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteProfile(id);
      // 削除成功時、ホームページにリダイレクト
      navigate("/");
    } catch (err) {
      console.error("プロフィール削除エラー:", err);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleShare = async () => {
    if (!id) return;

    const url = `${window.location.origin}/profile/${id}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      console.error("URLのコピーに失敗しました:", err);
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
          <h1 className="view-profile-not-found-title">
            プロフィールが見つかりません
          </h1>
          <p className="view-profile-not-found-message">
            指定されたプロフィールは存在しないか、削除された可能性があります。
          </p>
          <button
            className="view-profile-not-found-button"
            onClick={() => navigate("/")}
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // 所有者判定（簡易版：現在は常にtrueとする。将来的に認証機能を追加）
  const isOwner = true;

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
          isOwner={isOwner}
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
