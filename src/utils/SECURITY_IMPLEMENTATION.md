# セキュリティ実装ガイド

このドキュメントは、Linkerプラットフォームのセキュリティ実装の詳細を説明します。

## 実装済みのセキュリティ対策

### 1. SQLインジェクション対策

#### 実装場所
- `src/services/nicknameService.ts`
- `src/repositories/SupabaseProfileRepository.ts`

#### 対策内容

**パラメータ化クエリの使用**

Supabaseは自動的にパラメータ化クエリを使用するため、SQLインジェクション攻撃を防ぎます。

```typescript
// ✅ 安全: Supabaseのパラメータ化クエリ
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .ilike('nickname', userInput)  // 自動的にエスケープされる
  .single();
```

**入力サニタイゼーション**

追加の防御層として、危険なパターンを検出します。

```typescript
import { sanitizeNickname } from '../utils/sanitization';

// SQLインジェクションパターンをチェック
const sanitized = sanitizeNickname(userInput);
```

### 2. XSS（クロスサイトスクリプティング）対策

#### 実装場所
- `src/utils/sanitization.ts`

#### 対策内容

**HTMLエスケープ**

```typescript
import { escapeHtml, sanitizeText } from '../utils/sanitization';

// HTML特殊文字をエスケープ
const safe = escapeHtml(userInput);

// HTMLタグを削除してエスケープ
const sanitized = sanitizeText(userInput);
```

**Reactの自動エスケープ**

Reactは自動的にJSX内の値をエスケープします。

```tsx
// ✅ 安全: 自動エスケープ
<div>{userInput}</div>

// ❌ 危険: 使用禁止
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 3. レート制限とDDoS対策

#### 実装場所
- `src/utils/rateLimit.ts`
- `src/services/nicknameServiceWithRateLimit.ts`
- `src/config/security.ts`

#### 対策内容

**レート制限の実装**

```typescript
import { RateLimiter } from '../utils/rateLimit';

// レート制限インスタンスの作成
const rateLimiter = new RateLimiter({
  maxRequests: 20,      // 最大リクエスト数
  windowMs: 60 * 1000,  // 時間枠（1分）
});

// リクエストのチェック
await rateLimiter.tryRequest(userId);
```

**適用箇所**

| 機能 | 最大リクエスト数 | 時間枠 | ファイル |
|------|-----------------|--------|----------|
| ニックネームチェック | 20回 | 1分 | `nicknameServiceWithRateLimit.ts` |
| プロフィール更新 | 10回 | 1分 | 設定のみ（実装予定） |
| 認証リクエスト | 5回 | 15分 | 設定のみ（実装予定） |

### 4. 入力サニタイゼーション

#### 実装場所
- `src/utils/sanitization.ts`

#### 対策内容

**ニックネームのサニタイゼーション**

```typescript
export function sanitizeNickname(nickname: string): string {
  const trimmed = nickname.trim();
  
  // SQLインジェクションパターンのチェック
  if (containsSqlInjectionPattern(trimmed)) {
    throw new Error('無効な文字が含まれています');
  }
  
  // 許可された文字のみを残す
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
}
```

**テキストのサニタイゼーション**

```typescript
export function sanitizeText(text: string, maxLength?: number): string {
  let sanitized = text.trim();
  
  // HTMLタグを削除
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // HTML特殊文字をエスケープ
  sanitized = escapeHtml(sanitized);
  
  // 最大文字数制限
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}
```

**URLのサニタイゼーション**

```typescript
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  
  // 危険なプロトコルのチェック
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    throw new Error('無効なURLプロトコルです');
  }
  
  return trimmed;
}
```

## 使用方法

### ニックネームチェックでレート制限を使用

```typescript
import { checkNicknameAvailabilityWithRateLimit } from '../services/nicknameServiceWithRateLimit';

// レート制限付きでチェック
const result = await checkNicknameAvailabilityWithRateLimit(
  nickname,
  currentNickname,
  userId  // レート制限のキー
);
```

### 入力をサニタイズ

```typescript
import { sanitizeNickname, sanitizeText, sanitizeUrl } from '../utils/sanitization';

// ニックネームをサニタイズ
const safeNickname = sanitizeNickname(userInput);

// テキストをサニタイズ
const safeText = sanitizeText(userInput, 500);

// URLをサニタイズ
const safeUrl = sanitizeUrl(userInput);
```

### レート制限の状態を確認

```typescript
import { 
  getRemainingNicknameChecks,
  getNicknameCheckRetryAfter 
} from '../services/nicknameServiceWithRateLimit';

// 残りのリクエスト数
const remaining = getRemainingNicknameChecks(userId);

// 次のリクエストまでの待機時間
const retryAfter = getNicknameCheckRetryAfter(userId);
```

## セキュリティチェックリスト

新しい機能を実装する際は、以下を確認してください。

### データベースアクセス
- [ ] Supabaseのクエリビルダーを使用
- [ ] 生のSQLクエリは使用しない
- [ ] 入力値を文字列連結しない
- [ ] サニタイゼーション関数を使用

### ユーザー入力
- [ ] すべての入力をバリデーション
- [ ] サニタイゼーション関数を適用
- [ ] 適切なエラーメッセージを表示
- [ ] 最大文字数を制限

### API
- [ ] レート制限を適用
- [ ] 認証を確認
- [ ] エラーハンドリングを実装
- [ ] ログを記録

### フロントエンド
- [ ] Reactの自動エスケープを活用
- [ ] `dangerouslySetInnerHTML`は使用しない
- [ ] ユーザー入力をHTMLとして解釈しない
- [ ] 適切なバリデーションメッセージを表示

## テスト

セキュリティ機能のテストは以下のファイルで実装されています。

- `src/utils/sanitization.test.ts` - サニタイゼーション機能のテスト
- `src/utils/rateLimit.test.ts` - レート制限機能のテスト
- `src/services/nicknameService.test.ts` - ニックネームサービスのテスト

## 今後の改善

以下の機能を今後実装する予定です。

1. **CSRF対策**: トークンベースの保護
2. **セキュリティヘッダー**: CSP、X-Frame-Optionsなど
3. **監査ログ**: セキュリティイベントの記録
4. **IPベースのレート制限**: より厳格な制限
5. **自動ブロック**: 悪意のあるリクエストの検出と遮断

## 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
