/**
 * プロフィール作成ページ
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthContext";
import { useProfile } from "../../contexts/ProfileContext/ProfileContext";
import { ProfileForm } from "../../components/ProfileForm/ProfileForm";
import type { ProfileFormData } from "../../types/profile";

export function CreateProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProfile, loading, error } = useProfile();

  /**
   * プロフィール作成処理
   */
  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) {
      console.error("ユーザーが認証されていません");
      return;
    }

    try {
      const profile = await createProfile(user.id, data);
      // 作成成功時、プロフィール詳細ページにリダイレクト
      navigate(`/profile/${profile.id}`);
    } catch (error) {
      // エラーはProfileContextで管理されるため、ここでは何もしない
      console.error("プロフィール作成エラー:", error);
    }
  };

  /**
   * キャンセル処理
   */
  const handleCancel = () => {
    navigate("/");
  };

  return (
    <ProfileForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      error={error}
    />
  );
}
