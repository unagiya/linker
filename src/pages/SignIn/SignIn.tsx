/**
 * ログインページ
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthContext";
import { AuthForm } from "../../components/AuthForm/AuthForm";

export function SignIn() {
  const navigate = useNavigate();
  const { signIn, loading, error } = useAuth();

  /**
   * ログイン処理
   */
  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      // ログイン成功時、ホームページにリダイレクト
      navigate("/");
    } catch (error) {
      // エラーはAuthContextで管理されるため、ここでは何もしない
      console.error("ログインエラー:", error);
    }
  };

  /**
   * 登録ページへ遷移
   */
  const handleModeChange = () => {
    navigate("/signup");
  };

  return (
    <AuthForm
      mode="signin"
      onSubmit={handleSignIn}
      onModeChange={handleModeChange}
      loading={loading}
      error={error}
    />
  );
}
