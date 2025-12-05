/**
 * Navigationコンポーネント
 * ナビゲーションバー
 */

import { Link } from "react-router-dom";
import "./Navigation.css";

export function Navigation() {
  return (
    <nav className="navigation">
      <div className="navigation-container">
        <Link to="/" className="navigation-logo">
          Linker
        </Link>
        <div className="navigation-links">
          <Link to="/create" className="navigation-link">
            プロフィール作成
          </Link>
        </div>
      </div>
    </nav>
  );
}
