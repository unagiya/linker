/**
 * CreateProfileページ
 * プロフィール作成ページ
 */

import { useNavigate } from "react-router-dom";
import { useProfileContext } from "../../contexts/ProfileContext";
import { ProfileForm } from "../../components/ProfileForm";
import type { ProfileFormData } from "../../types";
import { ErrorMessage } from "../../components/common";
import "./CreateProfile.css";

export function CreateProfile() {
  const navigate = useNavigate();
  const { createProfile, loading, error, clearError } = useProfileContext();

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      const profile = await createProfile(data);
      // 作成成功時、プロフィール詳細ページにリダイレクト
      navigate(`/profile/${profile.id}`);
    } catch (err) {
      console.error("プロフィール作成エラー:", err);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="create-profile">
      <div className="create-profile-container">
        <header className="create-profile-header">
          <h1 className="create-profile-title">プロフィール作成</h1>
          <p className="create-profile-description">
            あなたのプロフィールを作成して、他のエンジニアとつながりましょう
          </p>
        </header>

        {error && (
          <ErrorMessage message={error} onClose={clearError} />
        )}

        <ProfileForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={loading}
        />
      </div>
    </div>
  );
}
