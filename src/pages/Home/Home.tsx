/**
 * Homeページ
 * ホームページ
 */

import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/common";
import "./Home.css";

export function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <div className="home-container">
        <div className="home-hero">
          <h1 className="home-title">Linker</h1>
          <p className="home-subtitle">
            エンジニアのためのプロフィール共有プラットフォーム
          </p>
          <p className="home-description">
            あなたのスキルや経験を共有して、他のエンジニアとつながりましょう。
            名刺のように簡単にプロフィールを作成・共有できます。
          </p>
          <div className="home-actions">
            {user ? (
              <Link to="/create">
                <Button variant="primary">プロフィールを作成</Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button variant="primary">アカウント登録</Button>
                </Link>
                <Link to="/signin">
                  <Button variant="secondary">ログイン</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="home-features">
          <div className="home-feature">
            <div className="home-feature-icon">📝</div>
            <h3 className="home-feature-title">簡単作成</h3>
            <p className="home-feature-description">
              必要な情報を入力するだけで、すぐにプロフィールを作成できます
            </p>
          </div>

          <div className="home-feature">
            <div className="home-feature-icon">🔗</div>
            <h3 className="home-feature-title">簡単共有</h3>
            <p className="home-feature-description">
              URLをコピーするだけで、誰とでもプロフィールを共有できます
            </p>
          </div>

          <div className="home-feature">
            <div className="home-feature-icon">✨</div>
            <h3 className="home-feature-title">名刺風デザイン</h3>
            <p className="home-feature-description">
              見やすく整理された名刺風のデザインで、あなたの情報を魅力的に表示
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
