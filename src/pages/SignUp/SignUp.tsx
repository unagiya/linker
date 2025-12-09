/**
 * アカウント登録ページ
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { AuthForm } from '../../components/AuthForm/AuthForm';

export function SignUp() {
  const navigate = useNavigate();
  const { signUp, loading, error } = useAuth();

  /**
   * アカウント登録処理
   */
  const handleSignUp = async (email: string, password: string) => {
    try {
      await signUp(email, password);
      // 登録成功時、プロフィール作成ページにリダイレクト
      navigate('/create');
    } catch (error) {
      // エラーはAuthContextで管理されるため、ここでは何もしない
      console.error('アカウント登録エラー:', error);
    }
  };

  /**
   * ログインページへ遷移
   */
  const handleModeChange = () => {
    navigate('/signin');
  };

  return (
    <AuthForm
      mode="signup"
      onSubmit={handleSignUp}
      onModeChange={handleModeChange}
      loading={loading}
      error={error}
    />
  );
}
