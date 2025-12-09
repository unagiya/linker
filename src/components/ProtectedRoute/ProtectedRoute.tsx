/**
 * ProtectedRouteコンポーネント
 * 認証が必要なページを保護するコンポーネント
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  /** 保護するコンポーネント */
  children: React.ReactNode;
}

/**
 * 認証が必要なページを保護するコンポーネント
 * ログインしていない場合、ログインページにリダイレクト
 * ログイン済みの場合、子コンポーネントを表示
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // ローディング中はスピナーを表示
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  // 未認証の場合、ログインページにリダイレクト
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // 認証済みの場合、子コンポーネントを表示
  return <>{children}</>;
}
