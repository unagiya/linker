/**
 * NotFoundページ
 * 404エラーページ
 */

import { Link } from 'react-router-dom';
import { Button } from '../../components/common';
import './NotFound.css';

export function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-container">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">ページが見つかりません</h2>
        <p className="not-found-message">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link to="/">
          <Button variant="primary">ホームに戻る</Button>
        </Link>
      </div>
    </div>
  );
}
