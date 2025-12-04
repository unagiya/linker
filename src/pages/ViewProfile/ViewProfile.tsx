/**
 * ViewProfileページ
 * プロフィール表示ページ
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfileContext } from "../../contexts/ProfileContext";
import { ProfileCard } from "../../components/ProfileCard";
import { LoadingSpinner, ErrorMessage } from "../../components/common";
import "./ViewProfile.css";

export function ViewProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, loadProfile, loading, error, clearError } =
    useProfileContext();
  const [notFound, setNotFound] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

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
    if (id) {
      // 削除確認は後で実装
      navigate(`/profile/${id}/delete`);
    }
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
      </div>
    </div>
  );
}
