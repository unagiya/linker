# パフォーマンス最適化

このドキュメントは、プロフィールニックネームURL機能のパフォーマンス最適化について説明します。

## 概要

要件10.1、10.2、10.4、10.5に基づいて、以下のパフォーマンス最適化を実装しています：

1. **ニックネーム利用可能性チェックの最適化** (要件10.1)
2. **データベースクエリの最適化** (要件10.2)
3. **キャッシュ機能の実装** (要件10.4)
4. **レート制限の実装** (要件10.5)

## 実装内容

### 1. キャッシュ機能

#### 概要
メモリベースのシンプルなキャッシュシステムを実装し、頻繁にアクセスされるデータをキャッシュすることで、データベースへのアクセスを削減します。

#### 実装ファイル
- `src/utils/cache.ts` - キャッシュユーティリティ
- `src/services/nicknameServiceOptimized.ts` - キャッシュ統合サービス

#### キャッシュ設定

```typescript
// ニックネーム利用可能性チェックのキャッシュ
const availabilityCache = new Cache<NicknameAvailabilityResult>({
  ttl: 30 * 1000, // 30秒
  maxSize: 200
});

// プロフィール検索のキャッシュ
const profileCache = new Cache<Profile | null>({
  ttl: 5 * 60 * 1000, // 5分
  maxSize: 100
});
```

#### キャッシュ戦略

- **ニックネーム利用可能性チェック**: 30秒のTTL（短めに設定して最新の状態を反映）
- **プロフィール検索**: 5分のTTL（比較的変更頻度が低いため）
- **キャッシュ無効化**: ニックネーム変更時に関連するキャッシュを自動的に無効化

#### 使用方法

```typescript
import { 
  checkNicknameAvailability, 
  findProfileByNickname,
  invalidateNicknameCache 
} from '@/services';

// キャッシュ機能付きで利用可能性チェック
const result = await checkNicknameAvailability('john-doe');

// キャッシュ機能付きでプロフィール検索
const profile = await findProfileByNickname('john-doe');

// ニックネーム変更時にキャッシュを無効化
await updateNickname(profileId, 'new-nickname', 'old-nickname');
// 自動的にキャッシュが無効化される
```

### 2. レート制限

#### 概要
APIリクエストの頻度を制限することで、サーバー負荷を制御し、DDoS攻撃を防止します。

#### 実装ファイル
- `src/utils/rateLimit.ts` - レート制限ユーティリティ
- `src/services/nicknameServiceOptimized.ts` - レート制限統合サービス

#### レート制限設定

```typescript
// ニックネーム利用可能性チェック: 1秒あたり5リクエスト
const availabilityRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 1000
});

// プロフィール検索: 1秒あたり10リクエスト
const profileSearchRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 1000
});

// ニックネーム更新: 1分あたり10リクエスト
const updateRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000
});
```

#### エラーハンドリング

レート制限に達した場合、`RateLimitError`がスローされます：

```typescript
try {
  await checkNicknameAvailability('john-doe');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`再試行まで ${error.retryAfter}ms 待機してください`);
  }
}
```

### 3. データベースクエリの最適化

#### 概要
データベースインデックスと最適化された関数を使用して、クエリのパフォーマンスを向上させます。

#### 実装内容

1. **インデックスの作成**
   ```sql
   -- 大文字小文字を区別しないユニークインデックス
   CREATE UNIQUE INDEX profiles_nickname_unique_ci 
   ON profiles (LOWER(nickname));
   
   -- 検索パフォーマンス向上のためのインデックス
   CREATE INDEX idx_profiles_nickname ON profiles (nickname);
   ```

2. **データベース関数の使用**
   ```sql
   -- ニックネーム検索用の最適化された関数
   CREATE FUNCTION find_profile_by_nickname(nickname_param TEXT)
   RETURNS TABLE (...) AS $$
   BEGIN
     RETURN QUERY
     SELECT * FROM profiles
     WHERE LOWER(nickname) = LOWER(nickname_param);
   END;
   $$ LANGUAGE plpgsql;
   ```

3. **リポジトリでの使用**
   ```typescript
   // データベース関数を使用した最適化された検索
   const { data } = await supabase
     .rpc('find_profile_by_nickname', { nickname_param: nickname });
   ```

#### パフォーマンス目標

- **ニックネーム利用可能性チェック**: 200ms以内（要件10.1）
- **プロフィール検索**: インデックスを使用した高速検索（要件10.2）

### 4. パフォーマンス監視

#### 概要
関数の実行時間を測定し、パフォーマンス要件を満たしているか監視します。

#### 実装ファイル
- `src/utils/performanceMonitor.ts` - パフォーマンス監視ユーティリティ

#### 使用方法

```typescript
import { measurePerformance, withPerformanceMonitoring } from '@/utils/performanceMonitor';

// 個別の測定
const { result, metrics } = await measurePerformance(
  () => checkNicknameAvailability('john-doe'),
  'checkNicknameAvailability',
  { warningThreshold: 200 }
);

// 関数にパフォーマンス監視を適用
const monitoredFunction = withPerformanceMonitoring(
  checkNicknameAvailability,
  'checkNicknameAvailability',
  { warningThreshold: 200 }
);
```

#### メトリクスの取得

```typescript
import { getMetricsStats, generatePerformanceReport } from '@/utils/performanceMonitor';

// 統計情報を取得
const stats = getMetricsStats('checkNicknameAvailability');
console.log(`平均時間: ${stats.average}ms`);

// レポートを生成
const report = generatePerformanceReport();
console.log(report);
```

## 設定

パフォーマンス最適化の設定は `src/config/performance.ts` で管理されています：

```typescript
export const CACHE_CONFIG = {
  AVAILABILITY_TTL: 30 * 1000,
  PROFILE_TTL: 5 * 60 * 1000,
  MAX_CACHE_SIZE: {
    AVAILABILITY: 200,
    PROFILE: 100
  }
};

export const RATE_LIMIT_CONFIG = {
  AVAILABILITY_CHECK: {
    maxRequests: 5,
    windowMs: 1000
  },
  PROFILE_SEARCH: {
    maxRequests: 10,
    windowMs: 1000
  }
};

export const PERFORMANCE_CONFIG = {
  AVAILABILITY_CHECK_TARGET: 200, // 要件10.1
  WARNING_THRESHOLD: 200
};
```

## メンテナンス

### 定期的なクリーンアップ

キャッシュとレート制限の記録を定期的にクリーンアップするために、以下の関数を使用します：

```typescript
import { startPeriodicCleanup } from '@/services';

// アプリケーション起動時に開始
const stopCleanup = startPeriodicCleanup();

// アプリケーション終了時に停止
stopCleanup();
```

### 手動クリーンアップ

```typescript
import { 
  cleanupCaches, 
  cleanupRateLimiters,
  clearAllCaches 
} from '@/services';

// 期限切れのキャッシュをクリーンアップ
cleanupCaches();

// レート制限の記録をクリーンアップ
cleanupRateLimiters();

// すべてのキャッシュをクリア
clearAllCaches();
```

## パフォーマンステスト

パフォーマンス要件を満たしているか確認するために、以下のテストを実行します：

```bash
# パフォーマンステストの実行
npm run test:performance

# 特定の機能のテスト
npm test -- src/services/nicknameServiceOptimized.test.ts
```

## ベストプラクティス

1. **キャッシュの適切な使用**
   - 頻繁にアクセスされるデータをキャッシュ
   - 適切なTTLを設定（データの更新頻度に応じて）
   - データ更新時にキャッシュを無効化

2. **レート制限の適切な設定**
   - ユーザー体験を損なわない範囲で制限
   - 重要な操作には厳しい制限を適用
   - エラーメッセージで再試行時間を通知

3. **データベースクエリの最適化**
   - インデックスを活用
   - データベース関数を使用
   - 必要なカラムのみを取得

4. **パフォーマンス監視**
   - 本番環境でのパフォーマンスを定期的に確認
   - 閾値を超えた場合はアラートを出す
   - メトリクスを分析して改善点を特定

## トラブルシューティング

### キャッシュが効いていない

- キャッシュのTTLが短すぎないか確認
- キャッシュサイズが十分か確認
- キャッシュキーが正しく生成されているか確認

### レート制限エラーが頻発する

- レート制限の設定が厳しすぎないか確認
- ユーザーの使用パターンを分析
- 必要に応じて制限を緩和

### パフォーマンスが目標を達成できない

- データベースインデックスが正しく作成されているか確認
- ネットワーク遅延を確認
- データベースサーバーの負荷を確認
- キャッシュが適切に機能しているか確認

## 参考資料

- [要件定義書](../.kiro/specs/profile-nickname-urls/requirements.md)
- [設計書](../.kiro/specs/profile-nickname-urls/design.md)
- [Supabaseパフォーマンスガイド](https://supabase.com/docs/guides/database/performance)
