# セキュリティガイド

このドキュメントは、Linkerプラットフォームのセキュリティ対策について説明します。

## 目次

1. [SQLインジェクション対策](#sqlインジェクション対策)
2. [XSS（クロスサイトスクリプティング）対策](#xssクロスサイトスクリプティング対策)
3. [レート制限とDDoS対策](#レート制限とddos対策)
4. [入力サニタイゼーション](#入力サニタイゼーション)
5. [認証とアクセス制御](#認証とアクセス制御)
6. [セキュリティヘッダー](#セキュリティヘッダー)

## SQLインジェクション対策

### 実装方法

Linkerは**Supabaseのパラメータ化クエリ**を使用してSQLインジェクション攻撃を防いでいます。

#### パラメータ化クエリの例

```typescript
// ✅ 安全: パラメータ化クエリ
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .ilike('nickname', userInput)  // Supabaseが自動的にエスケープ
  .single();

// ❌ 危険: 文字列連結（使用しない）
const query = `SELECT * FROM profiles WHERE nickname = '${userInput}'`;
```

### 追加の防御層

入力サニタイゼーション機能により、危険なパターンを事前に検出します。

```typescript
import { sanitizeNickname } from '../utils/sanitization';

// 入力をサニタイズ
const sanitized = sanitizeNickname(userInput);
```

### 対策のポイント

- ✅ すべてのデータベースクエリでSupabaseのクエリビルダーを使用
- ✅ 生のSQLクエリは使用しない
- ✅ 入力値を直接文字列連結しない
- ✅ 危険なパターンを検出するサニタイゼーション機能を使用

## XSS（クロスサイトスクリプティング）対策

### 実装方法

Reactのデフォルトのエスケープ機能と追加のサニタイゼーション機能を使用します。

#### HTMLエスケープ

```typescript
import { escapeHtml, sanitizeText } from '../utils/sanitization';

// HTML特殊文字をエスケープ
const safe = escapeHtml(userInput);

// HTMLタグを削除してエスケープ
const sanitized = sanitizeText(userInput);
```

#### Reactの自動エスケープ

```tsx
// ✅ 安全: Reactが自動的にエスケープ
<div>{userInput}</div>

// ❌ 危険: dangerouslySetInnerHTMLは使用しない
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 対策のポイント

- ✅ Reactのデフォルトエスケープ機能を活用
- ✅ `dangerouslySetInnerHTML`は使用しない
- ✅ ユーザー入力をHTMLとして解釈しない
- ✅ Content Security Policy (CSP) ヘッダーを設定

## レート制限とDDoS対策

### 実装方法

`RateLimiter`クラスを使用して、APIリクエストの頻度を制限します。

#### レート制限の設定

```typescript
import { RateLimiter } from '../utils/rateLimit';

// ニックネームチェック用のレート制限
const rateLimiter = new RateLimiter({
  maxRequests: 20,      // 最大リクエスト数
  windowMs: 60 * 1000,  // 時間枠（1分）
});

// リクエストを試行
try {
  await rateLimiter.tryRequest(userId);
  // リクエスト処理
} catch (error) {
  // レート制限エラー
  console.error('レート制限に達しました');
}
```

#### 現在のレート制限設定

| 機能 | 最大リクエスト数 | 時間枠 |
|------|-----------------|--------|
| ニックネームチェック | 20回 | 1分 |
| プロフィール更新 | 10回 | 1分 |
| 認証リクエスト | 5回 | 15分 |

### 対策のポイント

- ✅ すべての公開APIにレート制限を適用
- ✅ ユーザーIDまたはIPアドレスでレート制限を管理
- ✅ 適切なエラーメッセージを返す
- ✅ 定期的に古い記録をクリーンアップ

## 入力サニタイゼーション

### 実装方法

すべてのユーザー入力をサニタイズして、危険な文字やパターンを除去します。

#### ニックネームのサニタイゼーション

```typescript
import { sanitizeNickname } from '../utils/sanitization';

// 許可された文字のみを残す
const sanitized = sanitizeNickname(userInput);
// 結果: 英数字、ハイフン、アンダースコアのみ
```

#### テキストのサニタイゼーション

```typescript
import { sanitizeText } from '../utils/sanitization';

// HTMLタグを削除し、特殊文字をエスケープ
const sanitized = sanitizeText(userInput, 500); // 最大500文字
```

#### URLのサニタイゼーション

```typescript
import { sanitizeUrl } from '../utils/sanitization';

// 危険なプロトコルをチェック
const sanitized = sanitizeUrl(userInput);
// 許可: http:, https:, mailto:
// 拒否: javascript:, data:, vbscript:
```

### 対策のポイント

- ✅ すべてのユーザー入力をサニタイズ
- ✅ 許可リスト方式（ホワイトリスト）を使用
- ✅ 危険なパターンを検出して拒否
- ✅ 適切なエラーメッセージを表示

## 認証とアクセス制御

### 実装方法

Supabase Authを使用した認証とRow Level Security (RLS) によるアクセス制御。

#### Row Level Security (RLS)

```sql
-- プロフィールの読み取り: 全員に許可
CREATE POLICY "プロフィールは全員が閲覧可能"
ON profiles FOR SELECT
USING (true);

-- プロフィールの更新: 所有者のみ許可
CREATE POLICY "プロフィールは所有者のみ更新可能"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);
```

### 対策のポイント

- ✅ Supabase Authで認証を管理
- ✅ RLSポリシーでデータアクセスを制御
- ✅ クライアント側でも権限チェックを実施
- ✅ セッション管理を適切に行う

## セキュリティヘッダー

### 実装方法

HTTPセキュリティヘッダーを設定して、様々な攻撃を防ぎます。

#### 推奨ヘッダー

```typescript
// Content Security Policy
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"

// XSS対策
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'

// リファラー制御
'Referrer-Policy': 'strict-origin-when-cross-origin'
```

### 対策のポイント

- ✅ Content Security Policy (CSP) を設定
- ✅ クリックジャッキング対策（X-Frame-Options）
- ✅ MIME タイプスニッフィング対策
- ✅ リファラー情報の制御

## セキュリティチェックリスト

開発時に以下の項目を確認してください。

### 入力検証
- [ ] すべてのユーザー入力をバリデーション
- [ ] サニタイゼーション機能を使用
- [ ] 適切なエラーメッセージを表示

### データベース
- [ ] パラメータ化クエリを使用
- [ ] RLSポリシーを設定
- [ ] 適切なインデックスを作成

### API
- [ ] レート制限を適用
- [ ] 認証を実装
- [ ] エラーハンドリングを実装

### フロントエンド
- [ ] XSS対策を実施
- [ ] CSRFトークンを使用（必要に応じて）
- [ ] セキュリティヘッダーを設定

## セキュリティインシデント対応

セキュリティ上の問題を発見した場合は、以下の手順で報告してください。

1. **報告**: セキュリティチームに連絡
2. **評価**: 問題の深刻度を評価
3. **対応**: 修正パッチを作成
4. **展開**: 修正を本番環境に適用
5. **通知**: 影響を受けるユーザーに通知

## 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 更新履歴

- 2024-01-XX: 初版作成
- セキュリティ対策の実装完了
  - SQLインジェクション対策
  - XSS対策
  - レート制限
  - 入力サニタイゼーション
