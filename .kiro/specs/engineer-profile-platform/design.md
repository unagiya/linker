# 設計書

## 概要

Linkerは、エンジニアが自己紹介プロフィールを作成・共有するためのReactベースのシングルページアプリケーション（SPA）です。名刺のように個人に渡せるプロフィールURLを生成し、ブラウザのローカルストレージを使用してデータを永続化します。

### 主要機能
- プロフィールの作成・編集・削除
- プロフィール情報の表示（名刺風レイアウト）
- 共有可能なURL生成
- ローカルストレージによるデータ永続化
- レスポンシブUI

## アーキテクチャ

### 技術スタック
- **フロントエンド**: React 18+ with TypeScript
- **ルーティング**: React Router v6
- **状態管理**: React Context API + useReducer
- **スタイリング**: CSS Modules または Tailwind CSS
- **バリデーション**: Zod
- **ビルドツール**: Vite
- **テスティング**: Vitest + React Testing Library
- **プロパティベーステスト**: fast-check

### アーキテクチャパターン

```
src/
├── components/          # UIコンポーネント
│   ├── ProfileForm/    # プロフィール入力フォーム
│   ├── ProfileCard/    # プロフィール表示カード
│   ├── Navigation/     # ナビゲーションバー
│   └── common/         # 共通コンポーネント
├── contexts/           # React Context
│   └── ProfileContext/ # プロフィール状態管理
├── hooks/              # カスタムフック
│   └── useProfile/     # プロフィール操作
├── repositories/       # データアクセス層（Repository パターン）
│   ├── ProfileRepository.ts      # Repository インターフェース
│   ├── LocalStorageRepository.ts # ローカルストレージ実装
│   └── index.ts                  # Repository のエクスポート
├── types/              # TypeScript型定義
│   └── profile.ts      # プロフィール型
├── utils/              # ユーティリティ関数
│   └── validation.ts   # バリデーション
├── pages/              # ページコンポーネント
│   ├── CreateProfile/  # プロフィール作成ページ
│   ├── EditProfile/    # プロフィール編集ページ
│   └── ViewProfile/    # プロフィール表示ページ
└── App.tsx             # ルートコンポーネント
```

## コンポーネントとインターフェース

### データモデル

#### SocialServiceType型
```typescript
enum PredefinedService {
  TWITTER = "twitter",
  GITHUB = "github",
  FACEBOOK = "facebook"
}

type SocialServiceType = PredefinedService | string;
```

#### SocialLink型
```typescript
interface SocialLink {
  id: string;                    // リンクの一意のID
  service: SocialServiceType;    // サービス名（定義済みまたはカスタム）
  url: string;                   // URL
}
```

#### Profile型
```typescript
interface Profile {
  id: string;                    // 一意のID（UUID）
  name: string;                  // 名前（必須）
  jobTitle: string;              // 職種（必須）
  bio?: string;                  // 自己紹介文
  skills: string[];              // スキルの配列
  yearsOfExperience?: number;    // 経験年数
  socialLinks: SocialLink[];     // SNS・外部リンクの配列
  createdAt: string;             // 作成日時（ISO 8601形式）
  updatedAt: string;             // 更新日時（ISO 8601形式）
}
```

#### ProfileFormData型
```typescript
interface ProfileFormData {
  name: string;
  jobTitle: string;
  bio: string;
  skills: string[];
  yearsOfExperience: string;     // フォームでは文字列として扱う
  socialLinks: Array<{
    service: string;
    url: string;
  }>;
}
```

### 主要コンポーネント

#### ProfileContext
プロフィールの状態管理を担当するContext。ProfileRepositoryを使用してデータアクセスを行う。

**依存:**
- `repository: ProfileRepository` - 注入されたRepository実装

**状態:**
- `profile: Profile | null` - 現在のプロフィール
- `loading: boolean` - ローディング状態
- `error: string | null` - エラーメッセージ

**アクション:**
- `createProfile(data: ProfileFormData): Promise<Profile>`
- `updateProfile(id: string, data: ProfileFormData): Promise<Profile>`
- `deleteProfile(id: string): Promise<void>`
- `loadProfile(id: string): Promise<Profile | null>`

**Repository の注入:**
```typescript
<ProfileProvider repository={localStorageRepository}>
  <App />
</ProfileProvider>
```

#### ProfileForm
プロフィールの作成・編集フォームコンポーネント。

**Props:**
- `initialData?: ProfileFormData` - 初期値（編集時）
- `onSubmit: (data: ProfileFormData) => Promise<void>` - 送信ハンドラ
- `onCancel?: () => void` - キャンセルハンドラ

**機能:**
- リアルタイムバリデーション
- エラーメッセージ表示
- スキルのタグ入力
- SNSリンクの動的追加・削除
- サービス選択（定義済みサービスまたはカスタム入力）

#### ProfileCard
プロフィールを名刺風に表示するコンポーネント。

**Props:**
- `profile: Profile` - 表示するプロフィール
- `isOwner: boolean` - 所有者かどうか
- `onEdit?: () => void` - 編集ハンドラ
- `onDelete?: () => void` - 削除ハンドラ
- `onShare?: () => void` - 共有ハンドラ

**機能:**
- レスポンシブレイアウト
- 外部リンクの表示
- 所有者のみ編集・削除ボタン表示

#### ProfileRepository（インターフェース）
プロフィールデータの永続化を抽象化するRepository。

**インターフェース:**
```typescript
interface ProfileRepository {
  save(profile: Profile): Promise<void>;
  findById(id: string): Promise<Profile | null>;
  findAll(): Promise<Profile[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
```

**実装:**
- `LocalStorageRepository`: ブラウザのローカルストレージを使用
- 将来的に追加可能: `ApiRepository`, `IndexedDBRepository` など

**利点:**
- ストレージの実装を簡単に切り替え可能
- テスト時にモックRepositoryを使用可能
- ビジネスロジックとデータアクセスの分離

## データモデル

### Repository パターンによる抽象化

データアクセス層をRepository パターンで抽象化することで、保存先の変更が容易になります。

#### LocalStorageRepository 実装

**ストレージキー:** `linker_profiles`

**値の構造:**
```typescript
{
  [profileId: string]: Profile
}
```

複数のプロフィールをサポートするため、IDをキーとしたオブジェクトで管理します。

**実装例:**
```typescript
class LocalStorageRepository implements ProfileRepository {
  private readonly STORAGE_KEY = 'linker_profiles';

  async save(profile: Profile): Promise<void> {
    const profiles = await this.findAll();
    const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    profileMap[profile.id] = profile;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profileMap));
  }

  async findById(id: string): Promise<Profile | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;
    const profiles = JSON.parse(data);
    return profiles[id] || null;
  }

  async findAll(): Promise<Profile[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    const profiles = JSON.parse(data);
    return Object.values(profiles);
  }

  async delete(id: string): Promise<void> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return;
    const profiles = JSON.parse(data);
    delete profiles[id];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
  }

  async exists(id: string): Promise<boolean> {
    const profile = await this.findById(id);
    return profile !== null;
  }
}
```

#### 将来の拡張性

**API Repository 実装例:**
```typescript
class ApiRepository implements ProfileRepository {
  constructor(private baseUrl: string) {}

  async save(profile: Profile): Promise<void> {
    await fetch(`${this.baseUrl}/profiles/${profile.id}`, {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
  }

  async findById(id: string): Promise<Profile | null> {
    const response = await fetch(`${this.baseUrl}/profiles/${id}`);
    if (!response.ok) return null;
    return response.json();
  }

  // ... 他のメソッド
}
```

**切り替え方法:**
```typescript
// ローカルストレージを使用
const repository = new LocalStorageRepository();

// APIを使用（将来）
// const repository = new ApiRepository('https://api.example.com');

<ProfileProvider repository={repository}>
  <App />
</ProfileProvider>
```

### URL構造

- `/` - ホームページ（プロフィール作成へのリンク）
- `/create` - プロフィール作成ページ
- `/profile/:id` - プロフィール表示ページ
- `/profile/:id/edit` - プロフィール編集ページ

### バリデーションルール

Zodスキーマを使用してバリデーションを実装：

```typescript
const socialLinkSchema = z.object({
  service: z.string().min(1, "サービス名は必須です").max(50, "サービス名は50文字以内で入力してください"),
  url: z.string().url("有効なURLを入力してください")
});

const profileSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100, "名前は100文字以内で入力してください"),
  jobTitle: z.string().min(1, "職種は必須です").max(100, "職種は100文字以内で入力してください"),
  bio: z.string().max(500, "自己紹介は500文字以内で入力してください").optional(),
  skills: z.array(z.string()).max(20, "スキルは20個まで登録できます"),
  yearsOfExperience: z.number().min(0, "経験年数は0以上で入力してください").max(100).optional(),
  socialLinks: z.array(socialLinkSchema).max(10, "SNSリンクは10個まで登録できます")
});
```

**サービス選択のUI:**
- ドロップダウンで定義済みサービス（Twitter, GitHub, Facebook）を選択可能
- "その他"を選択した場合、カスタムサービス名の入力フィールドを表示
- 定義済みサービスには適切なアイコンを表示


## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性や動作のことです。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証との橋渡しをします。*

### プロパティ 1: 有効なプロフィール作成の永続化
*任意の*有効なプロフィールデータ（名前と職種が非空）に対して、プロフィールを作成すると、ローカルストレージに保存され、同じIDで読み込むと同等のデータが取得できる
**検証: 要件 1.2**

### プロパティ 2: 無効な必須項目の拒否
*任意の*プロフィールデータで、名前または職種が空文字列・null・undefinedの場合、プロフィール作成は失敗し、エラーメッセージが表示される
**検証: 要件 1.3**

### プロパティ 3: プロフィール作成後のリダイレクト
*任意の*有効なプロフィールデータに対して、プロフィールが正常に作成されると、作成されたプロフィールのIDを含むURLにリダイレクトされる
**検証: 要件 1.4**

### プロパティ 4: URLバリデーション
*任意の*URL文字列に対して、有効なURL形式（http/https）の場合のみ受け入れられ、無効な形式の場合はバリデーションエラーが発生する
**検証: 要件 2.2**

### プロパティ 5: スキル配列の管理
*任意の*スキル文字列の配列（最大20個）に対して、すべてのスキルが保存され、読み込み時に同じ順序で取得できる
**検証: 要件 2.3**

### プロパティ 6: 経験年数の数値バリデーション
*任意の*入力値に対して、0以上の数値のみが受け入れられ、負の数や非数値はバリデーションエラーとなる
**検証: 要件 2.4**

### プロパティ 7: 編集フォームへのデータ読み込み
*任意の*既存プロフィールに対して、編集モードに入ると、すべてのフィールドに現在の値が正しく設定される
**検証: 要件 3.1**

### プロパティ 8: プロフィール更新の永続化
*任意の*既存プロフィールと更新データに対して、更新を保存すると、ローカルストレージに反映され、再読み込み時に更新後のデータが取得できる
**検証: 要件 3.2**

### プロパティ 9: 更新後のデータ表示
*任意の*プロフィール更新に対して、保存が成功すると、更新されたデータがプロフィール詳細ページに表示される
**検証: 要件 3.3**

### プロパティ 10: 編集キャンセルの不変性
*任意の*プロフィールと変更に対して、編集をキャンセルすると、元のプロフィールデータが変更されずに保持される
**検証: 要件 3.4**

### プロパティ 11: プロフィールURLアクセス
*任意の*保存されているプロフィールIDに対して、そのIDを含むURLにアクセスすると、対応するプロフィールの詳細ページが表示される
**検証: 要件 4.1, 6.2**

### プロパティ 12: プロフィール情報の完全表示
*任意の*プロフィールに対して、詳細ページにはすべての設定済みフィールド（名前、職種、自己紹介、スキル、経験年数、SNSリンク）が表示される
**検証: 要件 4.2**

### プロパティ 13: 外部リンクのレンダリング
*任意の*URL付きプロフィールに対して、GitHub、Twitter、ポートフォリオのURLがクリック可能なリンク要素としてレンダリングされる
**検証: 要件 4.3**

### プロパティ 14: ローカルストレージのラウンドトリップ
*任意の*有効なプロフィールに対して、保存してから読み込むと、元のプロフィールと同等のデータが取得できる（シリアライゼーション・デシリアライゼーションの一貫性）
**検証: 要件 5.1, 5.2**

### プロパティ 15: 不正データのエラーハンドリング
*任意の*破損したJSONデータや不正な形式のデータに対して、読み込み時にエラーが適切に処理され、システムは空の状態またはデフォルト状態で起動する
**検証: 要件 5.3, 5.4**

### プロパティ 16: 共有URL生成
*任意の*プロフィールに対して、プロフィールページには共有可能なURL（プロフィールIDを含む）が生成され表示される
**検証: 要件 6.1**

### プロパティ 17: クリップボードへのURLコピー
*任意の*プロフィールに対して、共有ボタンをクリックすると、プロフィールURLがクリップボードにコピーされる
**検証: 要件 6.4**

### プロパティ 18: バリデーションエラーメッセージ表示
*任意の*無効な入力に対して、対応するフィールドの近くに明確なエラーメッセージが表示される
**検証: 要件 7.2**

### プロパティ 19: ローディング状態の表示
*任意の*非同期操作（保存、読み込み、削除）中は、ローディングインジケーターが表示される
**検証: 要件 7.4**

### プロパティ 20: プロフィール削除の永続化
*任意の*既存プロフィールに対して、削除を確認すると、ローカルストレージからプロフィールが削除され、同じIDでの読み込みは失敗する
**検証: 要件 8.2**

### プロパティ 21: 削除後のリダイレクト
*任意の*プロフィール削除に対して、削除が成功すると、ホームページまたはプロフィール作成ページにリダイレクトされる
**検証: 要件 8.3**

### プロパティ 22: 削除キャンセルの不変性
*任意の*プロフィールに対して、削除をキャンセルすると、プロフィールデータが保持され、プロフィールページに留まる
**検証: 要件 8.4**

## エラーハンドリング

### バリデーションエラー
- フォーム送信時にZodスキーマでバリデーション
- エラーは各フィールドの下に表示
- エラーメッセージは日本語で明確に

### ストレージエラー
- ローカルストレージへのアクセス失敗時は、エラーメッセージを表示
- データ破損時は、デフォルト状態にフォールバック
- QuotaExceededErrorの場合は、ユーザーに通知

### ネットワークエラー
- 現在のフェーズではバックエンドがないため、該当なし
- 将来的にバックエンドを追加する場合は、リトライロジックとエラー通知を実装

### 404エラー
- 存在しないプロフィールIDへのアクセス時は、404ページを表示
- ホームページへのリンクを提供

## テスト戦略

### ユニットテスト

**対象:**
- バリデーション関数（`validation.ts`）
- Repository実装（`LocalStorageRepository`）
- カスタムフック（`useProfile`）
- 個別コンポーネントのロジック

**ツール:**
- Vitest
- React Testing Library
- @testing-library/user-event

**例:**
- URLバリデーション関数のテスト（有効/無効なURL）
- LocalStorageRepositoryの各メソッド（save, findById, delete等）
- プロフィール作成・更新・削除の各操作
- モックRepositoryを使用したビジネスロジックのテスト

### プロパティベーステスト

**ライブラリ:** fast-check

**設定:**
- 各プロパティテストは最低100回の反復実行
- 各テストには設計書のプロパティ番号を明記
- コメント形式: `// Feature: engineer-profile-platform, Property X: [プロパティ説明]`

**対象プロパティ:**
- プロパティ1〜22（上記の正確性プロパティセクション参照）

**ジェネレーター:**
```typescript
// SNSリンクのジェネレーター
const socialLinkArbitrary = fc.record({
  service: fc.oneof(
    fc.constantFrom("twitter", "github", "facebook"),  // 定義済みサービス
    fc.string({ minLength: 1, maxLength: 50 })         // カスタムサービス
  ),
  url: fc.webUrl()
});

// プロフィールデータのジェネレーター
const profileArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
  bio: fc.option(fc.string({ maxLength: 500 })),
  skills: fc.array(fc.string(), { maxLength: 20 }),
  yearsOfExperience: fc.option(fc.nat({ max: 100 })),
  socialLinks: fc.array(socialLinkArbitrary, { maxLength: 10 })
});

// 無効なプロフィールデータのジェネレーター
const invalidProfileArbitrary = fc.record({
  name: fc.constantFrom("", null, undefined),
  jobTitle: fc.constantFrom("", null, undefined)
});
```

### 統合テスト

**対象:**
- ページ全体のフロー（作成→表示→編集→削除）
- ルーティングとナビゲーション
- Context + コンポーネントの統合

**シナリオ:**
1. プロフィール作成フローの完全テスト
2. プロフィール編集フローの完全テスト
3. プロフィール削除フローの完全テスト
4. ローカルストレージの永続化テスト

### E2Eテスト（オプション）

将来的にPlaywrightまたはCypressを使用して、ブラウザ環境での完全なユーザーフローをテスト。

## 実装の優先順位

### フェーズ1: 基本機能
1. プロジェクトセットアップ（Vite + React + TypeScript）
2. データモデルとバリデーション
3. Repository インターフェースと LocalStorageRepository 実装
4. プロフィール作成機能
5. プロフィール表示機能

### フェーズ2: 編集・削除機能
1. プロフィール編集機能
2. プロフィール削除機能
3. エラーハンドリング

### フェーズ3: 共有機能とUI改善
1. URL共有機能
2. クリップボードコピー
3. レスポンシブデザイン
4. ローディング状態

### フェーズ4: テストとリファクタリング
1. ユニットテスト
2. プロパティベーステスト
3. 統合テスト
4. コードリファクタリング
