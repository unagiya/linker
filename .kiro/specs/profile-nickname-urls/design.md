# 設計書

## 概要

プロフィールニックネームURL機能は、既存のLinkerプラットフォームに追加される機能です。この機能により、ユーザーは覚えやすいニックネームを設定し、そのニックネームを使用したカスタムURLでプロフィールにアクセスできるようになります。従来のUUID形式のURLを廃止し、`/profile/john-doe`のような人間が読みやすいURLを提供します。

### 主要機能
- アカウント登録時のニックネーム設定
- ニックネームのリアルタイムバリデーションと利用可能性チェック
- ニックネームベースURL（`/profile/nickname`）
- プロフィール編集でのニックネーム変更
- 既存ユーザーの自動マイグレーション
- SEO最適化とメタデータ管理

## アーキテクチャ

### 技術スタック
既存のLinkerプラットフォームの技術スタックを継承：
- **フロントエンド**: React 18+ with TypeScript
- **ルーティング**: React Router v6（ニックネームベースルーティング対応）
- **状態管理**: React Context API + useReducer
- **バックエンド**: Supabase
  - **認証**: Supabase Auth（既存）
  - **データベース**: PostgreSQL（nicknameカラム追加）
  - **アクセス制御**: Row Level Security (RLS)
- **バリデーション**: Zod（ニックネームバリデーション追加）
- **テスティング**: Vitest + React Testing Library
- **プロパティベーステスト**: fast-check

### アーキテクチャ拡張

既存のアーキテクチャに以下のコンポーネントを追加：

```
src/
├── components/
│   ├── NicknameInput/        # ニックネーム入力コンポーネント
│   ├── NicknameAvailability/ # 利用可能性表示コンポーネント
│   └── AuthForm/             # 既存（ニックネーム入力追加）
├── services/
│   ├── nicknameService.ts    # ニックネーム関連サービス
│   └── migrationService.ts   # マイグレーション処理
├── utils/
│   ├── nicknameValidation.ts # ニックネームバリデーション
│   └── urlUtils.ts           # URL変換ユーティリティ
├── hooks/
│   ├── useNicknameCheck.ts   # ニックネーム利用可能性チェック
│   └── useDebounce.ts        # デバウンス処理
└── types/
    └── nickname.ts           # ニックネーム関連型定義
```

## コンポーネントとインターフェース

### データモデル

#### 既存Profile型の拡張
```typescript
interface Profile {
  id: string;                    // 一意のID（UUID）
  user_id: string;               // 所有者のユーザーID（Supabase Auth）
  nickname: string;              // ニックネーム（新規追加、UNIQUE、NOT NULL）
  name: string;                  // 名前（必須）
  jobTitle: string;              // 職種（必須）
  bio?: string;                  // 自己紹介文
  imageUrl?: string;             // プロフィール画像のURL（Supabase Storage）
  skills: string[];              // スキルの配列
  yearsOfExperience?: number;    // 経験年数
  socialLinks: SocialLink[];     // SNS・外部リンクの配列
  createdAt: string;             // 作成日時（ISO 8601形式）
  updatedAt: string;             // 更新日時（ISO 8601形式）
}
```

#### ProfileFormData型の拡張
```typescript
interface ProfileFormData {
  nickname: string;              // ニックネーム（新規追加）
  name: string;
  jobTitle: string;
  bio: string;
  imageFile?: File;              // アップロードする画像ファイル
  imageUrl?: string;             // 既存の画像URL（編集時）
  skills: string[];
  yearsOfExperience: string;     // フォームでは文字列として扱う
  socialLinks: Array<{
    service: string;
    url: string;
  }>;
}
```

#### ニックネーム関連型定義
```typescript
// ニックネームバリデーション結果
interface NicknameValidationResult {
  isValid: boolean;
  error?: string;
}

// ニックネーム利用可能性チェック結果
interface NicknameAvailabilityResult {
  isAvailable: boolean;
  isChecking: boolean;
  error?: string;
}

// ニックネーム利用可能性チェック状態
type NicknameCheckStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

// 予約語リスト
const RESERVED_NICKNAMES = [
  'admin', 'api', 'www', 'profile', 'signin', 'signup', 'login', 'logout',
  'create', 'edit', 'delete', 'settings', 'help', 'about', 'contact',
  'terms', 'privacy', 'support', 'blog', 'news', 'docs', 'documentation'
] as const;
```

#### Supabaseデータベーススキーマ更新

**profilesテーブルの拡張:**
```sql
-- nicknameカラムの追加
ALTER TABLE profiles 
ADD COLUMN nickname TEXT;

-- 大文字小文字を区別しないユニーク制約の追加
CREATE UNIQUE INDEX profiles_nickname_unique_ci 
ON profiles (LOWER(nickname));

-- NOT NULL制約の追加（既存データのマイグレーション後）
ALTER TABLE profiles 
ALTER COLUMN nickname SET NOT NULL;

-- 既存データのマイグレーション
UPDATE profiles 
SET nickname = id 
WHERE nickname IS NULL;

-- インデックスの追加（検索パフォーマンス向上）
CREATE INDEX profiles_nickname_idx ON profiles (nickname);
```

### 主要コンポーネント

#### NicknameInput
ニックネーム入力とリアルタイムバリデーションを担当するコンポーネント。

**Props:**
```typescript
interface NicknameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  showHelp?: boolean;
  currentNickname?: string; // 編集時の現在のニックネーム
}
```

**機能:**
- リアルタイムバリデーション（形式チェック）
- デバウンス付き利用可能性チェック（500ms）
- 視覚的フィードバック（チェックマーク、Xマーク、ローディング）
- ヘルプテキスト表示
- エラーメッセージ表示

#### NicknameAvailability
ニックネームの利用可能性状態を表示するコンポーネント。

**Props:**
```typescript
interface NicknameAvailabilityProps {
  status: NicknameCheckStatus;
  message?: string;
}
```

**機能:**
- 状態に応じたアイコン表示（チェック、X、ローディング）
- 色分けされたメッセージ表示
- アクセシビリティ対応（aria-live）

#### AuthForm拡張
既存のAuthFormコンポーネントにニックネーム入力を追加。

**追加機能:**
- ニックネーム入力フィールド
- ニックネームバリデーション統合
- 登録時のニックネーム必須チェック

### サービス層

#### nicknameService
ニックネーム関連のビジネスロジックを担当するサービス。

**関数:**
```typescript
// ニックネーム利用可能性チェック
async function checkNicknameAvailability(
  nickname: string, 
  currentNickname?: string
): Promise<NicknameAvailabilityResult>

// ニックネームでプロフィール検索
async function findProfileByNickname(nickname: string): Promise<Profile | null>

// ニックネーム更新
async function updateNickname(profileId: string, newNickname: string): Promise<void>

// 予約語チェック
function isReservedNickname(nickname: string): boolean

// ニックネーム正規化（小文字変換）
function normalizeNickname(nickname: string): string
```

#### migrationService
既存ユーザーのマイグレーション処理を担当するサービス。

**関数:**
```typescript
// 全プロフィールのマイグレーション
async function migrateAllProfiles(): Promise<void>

// 単一プロフィールのマイグレーション
async function migrateProfile(profileId: string): Promise<void>

// マイグレーション状態チェック
async function checkMigrationStatus(): Promise<boolean>
```

### バリデーション

#### ニックネームバリデーションルール
```typescript
import { z } from 'zod';

// ニックネーム形式バリデーション
const nicknameSchema = z
  .string()
  .min(3, "ニックネームは3文字以上で入力してください")
  .max(36, "ニックネームは36文字以下で入力してください")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "ニックネームは英数字、ハイフン、アンダースコアのみ使用可能です"
  )
  .regex(
    /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
    "ニックネームは記号で始まったり終わったりできません"
  )
  .regex(
    /^(?!.*[-_]{2,})/,
    "ニックネームに連続する記号は使用できません"
  )
  .refine(
    (value) => !RESERVED_NICKNAMES.includes(value.toLowerCase()),
    "このニックネームは予約語のため使用できません"
  );

// バリデーション関数
export function validateNickname(nickname: string): NicknameValidationResult {
  try {
    nicknameSchema.parse(nickname);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: "不明なエラーが発生しました" };
  }
}
```

### カスタムフック

#### useNicknameCheck
ニックネーム利用可能性チェックを管理するカスタムフック。

```typescript
interface UseNicknameCheckResult {
  status: NicknameCheckStatus;
  message: string;
  isValid: boolean;
  checkNickname: (nickname: string) => void;
}

export function useNicknameCheck(
  currentNickname?: string,
  debounceMs: number = 500
): UseNicknameCheckResult
```

**機能:**
- デバウンス処理
- 状態管理（idle, checking, available, unavailable, error）
- エラーハンドリング
- キャンセル処理（コンポーネントアンマウント時）

#### useDebounce
汎用デバウンスフック。

```typescript
export function useDebounce<T>(value: T, delay: number): T
```

### URL構造の変更

**新しいURL構造:**
- `/profile/{nickname}` - プロフィール表示ページ
- `/profile/{nickname}/edit` - プロフィール編集ページ
- `/signup` - アカウント登録ページ（ニックネーム入力追加）
- `/signin` - ログインページ（変更なし）
- `/create` - プロフィール作成ページ（変更なし）

**廃止されるURL:**
- `/profile/{uuid}` - UUID形式のプロフィールURL（404エラー）
- `/profile/{uuid}/edit` - UUID形式の編集URL（404エラー）

### ルーティング更新

React Routerの設定を更新してニックネームベースルーティングに対応：

```typescript
// ルート定義
const routes = [
  {
    path: "/",
    element: <Home />
  },
  {
    path: "/signup",
    element: <SignUp /> // ニックネーム入力追加
  },
  {
    path: "/signin",
    element: <SignIn />
  },
  {
    path: "/create",
    element: <ProtectedRoute><CreateProfile /></ProtectedRoute>
  },
  {
    path: "/profile/:nickname",
    element: <ViewProfile />, // ニックネームベース
    loader: nicknameProfileLoader
  },
  {
    path: "/profile/:nickname/edit",
    element: <ProtectedRoute><EditProfile /></ProtectedRoute>, // ニックネームベース
    loader: nicknameProfileLoader
  }
];

// ニックネームベースプロフィールローダー
async function nicknameProfileLoader({ params }: LoaderFunctionArgs) {
  const { nickname } = params;
  if (!nickname) throw new Response("Not Found", { status: 404 });
  
  const profile = await findProfileByNickname(nickname);
  if (!profile) throw new Response("Not Found", { status: 404 });
  
  return { profile };
}
```

## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性や動作のことです。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証との橋渡しをします。*

### プロパティ 1: ニックネームリアルタイムチェック
*任意の*ニックネーム入力に対して、入力後500ms以内に利用可能性チェックが実行される
**検証: 要件 1.2, 5.1**

### プロパティ 2: 使用済みニックネームの拒否
*任意の*既に使用されているニックネームに対して、「このニックネームは既に使用されています」というエラーメッセージが表示される
**検証: 要件 1.3, 5.3**

### プロパティ 3: 無効形式ニックネームの拒否
*任意の*無効な形式のニックネームに対して、適切なエラーメッセージが表示される
**検証: 要件 1.4, 5.4**

### プロパティ 4: 有効ニックネームの受け入れ
*任意の*有効で利用可能なニックネームに対して、「このニックネームは利用可能です」という確認メッセージが表示される
**検証: 要件 1.5, 5.2**

### プロパティ 5: ニックネーム保存の永続化
*任意の*有効なアカウント登録に対して、ニックネームがプロフィールに関連付けて保存される
**検証: 要件 1.6**

### プロパティ 6: 文字数制限バリデーション
*任意の*ニックネーム入力に対して、3文字以上36文字以下であることが検証される
**検証: 要件 2.1**

### プロパティ 7: 文字種制限バリデーション
*任意の*ニックネーム入力に対して、英数字、ハイフン、アンダースコアのみが受け付けられる
**検証: 要件 2.2**

### プロパティ 8: 記号位置制限バリデーション
*任意の*ニックネーム入力に対して、記号で始まったり終わったりしないことが検証される
**検証: 要件 2.3**

### プロパティ 9: 連続記号制限バリデーション
*任意の*ニックネーム入力に対して、連続する記号を含まないことが検証される
**検証: 要件 2.4**

### プロパティ 10: 大文字小文字無視ユニーク性
*任意の*大文字小文字の違いがあるニックネームに対して、大文字小文字を区別せずにユニーク性がチェックされる
**検証: 要件 2.5**

### プロパティ 11: 予約語制限
*任意の*予約語リストに含まれるニックネームに対して、使用が拒否される
**検証: 要件 2.6**

### プロパティ 12: ニックネームベースURL解決
*任意の*有効なニックネームに対して、`/profile/nickname`でアクセスすると対応するプロフィールが表示される
**検証: 要件 3.1**

### プロパティ 13: 存在しないニックネームの404エラー
*任意の*存在しないニックネームに対して、404エラーページが表示される
**検証: 要件 3.2**

### プロパティ 14: 共有URLのニックネームベース化
*任意の*プロフィール所有者に対して、ニックネームベースURLが共有URLとして提供される
**検証: 要件 3.3**

### プロパティ 15: 編集ページのニックネームベースURL
*任意の*プロフィールに対して、編集ページや削除確認ページでニックネームベースURLが使用される
**検証: 要件 3.5**

### プロパティ 16: UUID形式URLの404エラー
*任意の*UUID形式URLに対して、404エラーが返される
**検証: 要件 3.6**

### プロパティ 17: 編集フォームのニックネーム表示
*任意の*プロフィールに対して、編集ページで現在のニックネームが入力フィールドに表示される
**検証: 要件 4.1**

### プロパティ 18: ニックネーム変更時のリアルタイムチェック
*任意の*ニックネーム変更に対して、リアルタイムで新しいニックネームの利用可能性がチェックされる
**検証: 要件 4.2**

### プロパティ 19: 使用済みニックネームへの変更拒否
*任意の*既存のニックネームへの変更に対して、エラーメッセージが表示されて変更が防止される
**検証: 要件 4.3**

### プロパティ 20: 有効ニックネーム変更の保存
*任意の*有効で利用可能なニックネーム変更に対して、変更が保存されてSupabaseデータベースが更新される
**検証: 要件 4.4**

### プロパティ 21: ニックネーム変更後のリダイレクト
*任意の*成功したニックネーム変更に対して、新しいニックネームベースURLにリダイレクトされる
**検証: 要件 4.5**

### プロパティ 22: 古いニックネームURLのリダイレクト
*任意の*変更されたニックネームに対して、古いニックネームのURLから新しいニックネームのURLにリダイレクトされる
**検証: 要件 4.6**

### プロパティ 23: ローディング状態の表示
*任意の*利用可能性チェック中に対して、ローディングインジケーターが表示される
**検証: 要件 5.5**

### プロパティ 24: updated_at自動更新
*任意の*ニックネーム更新に対して、updated_atカラムも自動更新される
**検証: 要件 6.4**

### プロパティ 25: RLSポリシーの継続動作
*任意の*データベースアクセスに対して、Row Level Security (RLS)ポリシーがニックネーム機能でも適切に動作する
**検証: 要件 6.5**

### プロパティ 26: 既存ユーザーのニックネーム表示
*任意の*既存ユーザーに対して、プロフィール編集ページで現在のニックネーム（UUID）が表示されてカスタマイズ可能になる
**検証: 要件 7.2**

### プロパティ 27: UUID形式ニックネームの通知
*任意の*UUID形式のニックネームを持つユーザーに対して、「ニックネームをカスタマイズできます」という通知が表示される
**検証: 要件 7.4**

### プロパティ 28: ページタイトルの設定
*任意の*ニックネームベースURLに対して、適切なページタイトル（「{名前} | Linker」）が設定される
**検証: 要件 8.1**

### プロパティ 29: メタディスクリプションの設定
*任意の*プロフィールページに対して、メタディスクリプションにプロフィール情報が含まれる
**検証: 要件 8.2**

### プロパティ 30: Open Graphメタタグの設定
*任意の*ニックネームベースURLに対して、Open Graphメタタグが適切に設定される
**検証: 要件 8.3**

### プロパティ 31: 構造化データの提供
*任意の*プロフィールページに対して、構造化データ（JSON-LD）でプロフィール情報が提供される
**検証: 要件 8.4**

### プロパティ 32: 404ページのメッセージ表示
*任意の*無効なニックネームに対して、404ページに「プロフィールが見つかりません」というメッセージが表示される
**検証: 要件 9.3**

### プロパティ 33: ヘルプテキストの表示
*任意の*ニックネーム入力フィールドに対して、フォーカス時にニックネームのルールを説明するヘルプテキストが表示される
**検証: 要件 9.4**

### プロパティ 34: 成功メッセージの表示
*任意の*成功したニックネーム変更に対して、「ニックネームが正常に更新されました」という成功メッセージが表示される
**検証: 要件 9.5**

### プロパティ 35: キャッシュ無効化
*任意の*ニックネーム変更に対して、古いニックネームのキャッシュが適切に無効化される
**検証: 要件 10.5**

## エラーハンドリング

### ニックネームバリデーションエラー
- 文字数制限違反: 「ニックネームは3-36文字で入力してください」
- 文字種制限違反: 「ニックネームは英数字、ハイフン、アンダースコアのみ使用可能です」
- 記号位置違反: 「ニックネームは記号で始まったり終わったりできません」
- 連続記号違反: 「ニックネームに連続する記号は使用できません」
- 予約語違反: 「このニックネームは予約語のため使用できません」

### ニックネーム利用可能性エラー
- 重複エラー: 「このニックネームは既に使用されています」
- ネットワークエラー: 「接続エラーが発生しました。再試行してください」
- サーバーエラー: 「サーバーエラーが発生しました。しばらく待ってから再試行してください」

### URL解決エラー
- 存在しないニックネーム: 404ページ「プロフィールが見つかりません」
- 無効なニックネーム形式: 404ページ「無効なURLです」

### データベースエラー
- 保存失敗: 「変更の保存に失敗しました。しばらく待ってから再試行してください」
- 制約違反: 「このニックネームは既に使用されています」
- 接続エラー: 「データベース接続エラーが発生しました」

## テスト戦略

### ユニットテスト

**対象:**
- ニックネームバリデーション関数（`nicknameValidation.ts`）
- ニックネームサービス（`nicknameService.ts`）
- カスタムフック（`useNicknameCheck`, `useDebounce`）
- URL変換ユーティリティ（`urlUtils.ts`）

**ツール:**
- Vitest
- React Testing Library
- @testing-library/user-event

**例:**
- ニックネーム形式バリデーションのテスト（有効/無効な形式）
- 予約語チェックのテスト
- 利用可能性チェックAPIのテスト
- デバウンス処理のテスト

### プロパティベーステスト

**ライブラリ:** fast-check

**設定:**
- 各プロパティテストは最低100回の反復実行
- 各テストには設計書のプロパティ番号を明記
- コメント形式: `// Feature: profile-nickname-urls, Property X: [プロパティ説明]`

**対象プロパティ:**
- プロパティ1〜35（上記の正確性プロパティセクション参照）

**ジェネレーター:**
```typescript
// 有効なニックネームのジェネレーター
const validNicknameArbitrary = fc.string({ minLength: 3, maxLength: 36 })
  .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
  .filter(s => /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(s))
  .filter(s => !/[-_]{2,}/.test(s))
  .filter(s => !RESERVED_NICKNAMES.includes(s.toLowerCase()));

// 無効なニックネームのジェネレーター
const invalidNicknameArbitrary = fc.oneof(
  fc.string({ maxLength: 2 }), // 短すぎる
  fc.string({ minLength: 37 }), // 長すぎる
  fc.string().filter(s => /[^a-zA-Z0-9_-]/.test(s)), // 無効文字
  fc.string().filter(s => /^[-_]|[-_]$/.test(s)), // 記号で開始/終了
  fc.string().filter(s => /[-_]{2,}/.test(s)), // 連続記号
  fc.constantFrom(...RESERVED_NICKNAMES) // 予約語
);

// 既存ニックネームのジェネレーター（テスト用）
const existingNicknameArbitrary = fc.constantFrom(
  'john-doe', 'jane-smith', 'test-user', 'admin-user'
);

// UUIDのジェネレーター
const uuidArbitrary = fc.uuid();
```

### 統合テスト

**対象:**
- アカウント登録フロー（ニックネーム入力含む）
- ニックネーム変更フロー
- ニックネームベースURL解決
- マイグレーション処理
- エラーハンドリング

**シナリオ:**
1. アカウント登録時のニックネーム設定と利用可能性チェック
2. プロフィール編集でのニックネーム変更
3. ニックネームベースURLでのプロフィールアクセス
4. 存在しないニックネームでの404エラー
5. 既存ユーザーのマイグレーション処理
6. ニックネーム重複時のエラーハンドリング

## 実装の優先順位

### フェーズ1: データベーススキーマ更新とマイグレーション
1. profilesテーブルにnicknameカラム追加
2. ユニーク制約とインデックスの設定
3. 既存データのマイグレーション処理
4. RLSポリシーの更新

### フェーズ2: ニックネームバリデーションとサービス層
1. ニックネームバリデーション関数の実装
2. ニックネームサービスの実装
3. 利用可能性チェックAPI
4. カスタムフックの実装

### フェーズ3: UI コンポーネント
1. NicknameInputコンポーネント
2. NicknameAvailabilityコンポーネント
3. AuthFormの拡張
4. ProfileFormの拡張

### フェーズ4: ルーティングとURL処理
1. React Routerの設定更新
2. ニックネームベースルーティング
3. URL解決ロジック
4. 404エラーハンドリング

### フェーズ5: SEOとメタデータ
1. ページタイトルの動的設定
2. メタディスクリプションの設定
3. Open Graphメタタグ
4. 構造化データ（JSON-LD）

### フェーズ6: テストとリファクタリング
1. ユニットテスト（バリデーション、サービス層）
2. プロパティベーステスト
3. 統合テスト（フロー全体）
4. パフォーマンステスト
