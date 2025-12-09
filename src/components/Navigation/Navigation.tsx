/**
 * Navigationコンポーネント
 * ナビゲーションバー
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { Button } from '../common/Button';
import './Navigation.css';

export function Navigation() {
  const { user, signOut } = useAuth();
  const { loadMyProfile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleMyProfile = async () => {
    try {
      const profile = await loadMyProfile();
      if (profile) {
        navigate(`/profile/${profile.id}`);
      } else {
        navigate('/create');
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
      navigate('/create');
    }
  };

  return (
    <nav className="navigation">
      <div className="navigation-container">
        <Link to="/" className="navigation-logo">
          Linker
        </Link>
        <div className="navigation-links">
          {user ? (
            <>
              <button onClick={handleMyProfile} className="navigation-link navigation-button">
                マイプロフィール
              </button>
              <Link to="/create" className="navigation-link">
                プロフィール作成
              </Link>
              <Button onClick={handleSignOut} variant="secondary" size="small">
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Link to="/signin" className="navigation-link">
                ログイン
              </Link>
              <Link to="/signup" className="navigation-link">
                登録
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
