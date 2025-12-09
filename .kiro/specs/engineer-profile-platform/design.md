# 設計書

## 概要

Linkerは、エンジニアが自己紹介プロフィールを作成・共有するためのReactベースのシングルページアプリケーション（SPA）です。名刺のように個人に渡せるプロフィールURLを生成し、Supabaseを使用して認証とデータ管理を行います。

### 主要機能
- アカウント登録・ログイン・ログアウト
- プロフィールの作成・編集・削除
- プロフィール情報の表示（名刺風レイアウト）
- 共有可能なURL生成
- Supabaseによるデータ永続化と認証
- Row Level Security (RLS)による所有者制御
- レスポンシブUI

## アーキテクチャ

### 技術スタック
- **フロントエンド**: React 18+ with TypeScript
- **ルーティング**: React Router v6
- **状態管理**: React Context API + useReducer
- **バックエンド**: Supabase
  - **認証**: Supabase Auth（メールアドレス + パスワード）
  - **データベース**: PostgreSQL（Supabase提供）
  - **アクセス制御**: Row Level Security (RLS)
- **Supabaseクライアント**: @supabase/supabase-js
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
│   ├── AuthForm/       # 認証フォーム（登録・ログイン）
│   └── common/         # 共通コンポーネント
├── contexts/           # React Context
│   ├── AuthContext/    # 認証状態管理
│   └── ProfileContext/ # プロフィール状態管理
├── hooks/              # カスタムフック
│   ├── useAuth/        # 認証操作
│   └── useProfile/     # プロフィール操作
├── lib/                # 外部ライブラリの設定
│   └── supabase.ts     # Supabaseクライアント初期化
├── repositories/       # データアクセス層（Repository パターン）
│   ├── ProfileRepository.ts         # Repository インターフェース
│   ├── SupabaseProfileRepository.ts # Supabase実装
│   └── index.ts                     # Repository のエクスポート
├── services/           # ビジネスロジック層
│   └── authService.ts  # 認証サービス
├── types/              # TypeScript型定義
│   ├── auth.ts         # 認証関連の型
│   ├── profile.ts      # プロフィール型
│   └── database.ts     # Supabaseデータベース型
├── utils/              # ユーティリティ関数
│   └── validation.ts   # バリデーション
├── pages/              # ページコンポーネント
│   ├── SignUp/         # アカウント登録ページ
│   ├── SignIn/         # ログインページ
│   ├── CreateProfile/  # プロフィール作成ページ
│   ├── EditProfile/    # プロフィール編集ページ
│   └── ViewProfile/    # プロフィール表示ページ
└── App.tsx             # ルートコンポーネント
```

## コンポーネントとインターフェース

### データモデル

#### User型（Supabase Auth）
```typescript
interface User {
  id: string;                    // SupabaseのユーザーID（UUID）
  email: string;                 // メールアドレス
  created_at: string;            // アカウント作成日時
}
```

#### SocialServiceType型
```typescript
enum PredefinedService {
  TWITTER = "twitter",
  GITHUB = "github",
  FACEBOOK = "facebook",
  LINKEDIN = "linkedin"
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
  user_id: string;               // 所有者のユーザーID（Supabase Auth）
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

#### ProfileFormData型
```typescript
interface ProfileFormData {
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

#### Supabaseデータベーススキーマ

**profilesテーブル:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  skills TEXT[] DEFAULT '{}',
  years_of_experience INTEGER,
  social_links JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)  -- 1ユーザー1プロフィール
);

-- Row Level Security (RLS) ポリシー
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 誰でもプロフィールを閲覧可能
CREATE POLICY "プロフィールは誰でも閲覧可能"
  ON profiles FOR SELECT
  USING (true);

-- ログイン済みユーザーは自分のプロフィールを作成可能
CREATE POLICY "ユーザーは自分のプロフィールを作成可能"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "ユーザーは自分のプロフィールのみ更新可能"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ削除可能
CREATE POLICY "ユーザーは自分のプロフィールのみ削除可能"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Supabase Storageバケット:**
```sql
-- profile-imagesバケットの作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true);

-- ストレージポリシー: 誰でも画像を閲覧可能
CREATE POLICY "プロフィール画像は誰でも閲覧可能"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

-- ストレージポリシー: ログイン済みユーザーは自分の画像をアップロード可能
CREATE POLICY "ユーザーは自分の画像をアップロード可能"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ストレージポリシー: ユーザーは自分の画像のみ更新可能
CREATE POLICY "ユーザーは自分の画像のみ更新可能"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ストレージポリシー: ユーザーは自分の画像のみ削除可能
CREATE POLICY "ユーザーは自分の画像のみ削除可能"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 主要コンポーネント

#### AuthContext
認証状態の管理を担当するContext。Supabase Authを使用して認証を行う。

**状態:**
- `user: User | null` - 現在のログインユーザー
- `session: Session | null` - 現在のセッション
- `loading: boolean` - ローディング状態
- `error: string | null` - エラーメッセージ

**アクション:**
- `signUp(email: string, password: string): Promise<void>` - アカウント登録
- `signIn(email: string, password: string): Promise<void>` - ログイン
- `signOut(): Promise<void>` - ログアウト
- `clearError(): void` - エラークリア

**使用例:**
```typescript
const { user, signIn, signOut } = useAuth();

// ログイン
await signIn('user@example.com', 'password');

// ログアウト
await signOut();
```

#### ProfileContext
プロフィールの状態管理を担当するContext。ProfileRepositoryを使用してデータアクセスを行う。

**依存:**
- `repository: ProfileRepository` - 注入されたRepository実装

**状態:**
- `profile: Profile | null` - 現在のプロフィール
- `loading: boolean` - ローディング状態
- `error: string | null` - エラーメッセージ

**アクション:**
- `createProfile(data: ProfileFormData): Promise<Profile>` - プロフィール作成
- `updateProfile(id: string, data: ProfileFormData): Promise<Profile>` - プロフィール更新
- `deleteProfile(id: string): Promise<void>` - プロフィール削除
- `loadProfile(id: string): Promise<Profile | null>` - プロフィール読み込み
- `loadMyProfile(): Promise<Profile | null>` - 自分のプロフィール読み込み
- `clearError(): void` - エラークリア

**Repository の注入:**
```typescript
<ProfileProvider repository={supabaseRepository}>
  <App />
</ProfileProvider>
```

**使用例:**
```typescript
const { profile, createProfile, loadMyProfile } = useProfile();

// 自分のプロフィールを読み込み
await loadMyProfile();

// プロフィール作成
await createProfile({
  name: '山田太郎',
  jobTitle: 'フロントエンドエンジニア',
  // ...
});
```

#### AuthForm
アカウント登録・ログインフォームコンポーネント。

**Props:**
- `mode: 'signup' | 'signin'` - モード（登録またはログイン）
- `onSubmit: (email: string, password: string) => Promise<void>` - 送信ハンドラ
- `onModeChange?: () => void` - モード切り替えハンドラ

**機能:**
- メールアドレスとパスワードの入力
- リアルタイムバリデーション
- エラーメッセージ表示
- ローディング状態の表示
- 登録/ログインモードの切り替え

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

#### ProtectedRoute
認証が必要なページを保護するコンポーネント。

**Props:**
- `children: ReactNode` - 保護するコンポーネント

**機能:**
- ログインしていない場合、ログインページにリダイレクト
- ログイン済みの場合、子コンポーネントを表示

**使用例:**
```typescript
<Route path="/create" element={
  <ProtectedRoute>
    <CreateProfile />
  </ProtectedRoute>
} />
```

## Repository パターンによる抽象化

データアクセス層をRepository パターンで抽象化することで、保存先の変更が容易になります。

### ProfileRepository（インターフェース）
プロフィールデータの永続化を抽象化するRepository。

**インターフェース:**
```typescript
interface ProfileRepository {
  save(profile: Profile): Promise<void>;
  findById(id: string): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile | null>;
  findAll(): Promise<Profile[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
```

**実装:**
- `SupabaseProfileRepository`: Supabaseデータベースを使用
- 将来的に追加可能: `LocalStorageRepository`, `ApiRepository` など

**利点:**
- ストレージの実装を簡単に切り替え可能
- テスト時にモックRepositoryを使用可能
- ビジネスロジックとデータアクセスの分離

### SupabaseProfileRepository 実装

**実装例:**
```typescript
import { supabase } from '../lib/supabase';

export class SupabaseProfileRepository implements ProfileRepository {
  async save(profile: Profile): Promise<void> {
    // 既存のプロフィールがあるか確認
    const existing = await this.findById(profile.id);
    
    if (existing) {
      // 更新
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          job_title: profile.jobTitle,
          bio: profile.bio,
          skills: profile.skills,
          years_of_experience: profile.yearsOfExperience,
          social_links: profile.socialLinks,
          updated_at: profile.updatedAt,
        })
        .eq('id', profile.id);
      
      if (error) throw error;
    } else {
      // 新規作成
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          job_title: profile.jobTitle,
          bio: profile.bio,
          skills: profile.skills,
          years_of_experience: profile.yearsOfExperience,
          social_links: profile.socialLinks,
          created_at: profile.createdAt,
          updated_at: profile.updatedAt,
        });
      
      if (error) throw error;
    }
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return this.mapToProfile(data);
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return this.mapToProfile(data);
  }

  async findAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(this.mapToProfile);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async exists(id: string): Promise<boolean> {
    const profile = await this.findById(id);
    return profile !== null;
  }

  private mapToProfile(data: any): Profile {
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      jobTitle: data.job_title,
      bio: data.bio,
      skills: data.skills || [],
      yearsOfExperience: data.years_of_experience,
      socialLinks: data.social_links || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
```

### AuthService
Supabase Authを使用した認証サービス。Repositoryパターンとは別に、認証専用のサービスとして実装。

**関数:**
```typescript
// アカウント登録
async function signUp(email: string, password: string): Promise<User>

// ログイン
async function signIn(email: string, password: string): Promise<User>

// ログアウト
async function signOut(): Promise<void>

// 現在のセッションを取得
async function getSession(): Promise<Session | null>

// 現在のユーザーを取得
async function getCurrentUser(): Promise<User | null>
```

### ImageService
Supabase Storageを使用した画像管理サービス。

**関数:**
```typescript
// 画像をアップロード
async function uploadProfileImage(userId: string, file: File): Promise<string>

// 画像を削除
async function deleteProfileImage(imageUrl: string): Promise<void>

// 画像URLから公開URLを取得
function getPublicUrl(path: string): string

// ファイルバリデーション
function validateImageFile(file: File): { valid: boolean; error?: string }
```

**実装例:**
```typescript
import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'profile-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'JPEG、PNG、WebP形式の画像のみアップロード可能です' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'ファイルサイズは5MB以下にしてください' };
  }
  
  return { valid: true };
}

export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  return getPublicUrl(data.path);
}

export async function deleteProfileImage(imageUrl: string): Promise<void> {
  // URLからパスを抽出
  const url = new URL(imageUrl);
  const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/profile-images\/(.+)/);
  
  if (!pathMatch) {
    throw new Error('無効な画像URLです');
  }
  
  const filePath = pathMatch[1];
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);
  
  if (error) throw error;
}

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  
  return data.publicUrl;
}
```

**実装例:**
```typescript
import { supabase } from '../lib/supabase';

export async function signUp(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  if (!data.user) throw new Error('ユーザーの作成に失敗しました');
  
  return data.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  if (!data.user) throw new Error('ログインに失敗しました');
  
  return data.user;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

### Repository の注入

ProfileContextにRepositoryを注入することで、テスト時や将来の変更に柔軟に対応できます。

```typescript
// 本番環境
const supabaseRepository = new SupabaseProfileRepository();

<ProfileProvider repository={supabaseRepository}>
  <App />
</ProfileProvider>

// テスト環境
const mockRepository = new MockProfileRepository();

<ProfileProvider repository={mockRepository}>
  <TestComponent />
</ProfileProvider>
```

### URL構造

- `/` - ホームページ（ログイン済みの場合はプロフィール作成へのリンク）
- `/signup` - アカウント登録ページ
- `/signin` - ログインページ
- `/create` - プロフィール作成ページ（要認証）
- `/profile/:id` - プロフィール表示ページ（公開）
- `/profile/:id/edit` - プロフィール編集ページ（要認証・所有者のみ）

### バリデーションルール

Zodスキーマを使用してバリデーションを実装：

```typescript
// 認証用スキーマ
const signUpSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください")
});

const signInSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください")
});

// プロフィール用スキーマ
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

**画像バリデーション:**
```typescript
const imageFileSchema = z.instanceof(File).refine(
  (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
  "JPEG、PNG、WebP形式の画像のみアップロード可能です"
).refine(
  (file) => file.size <= 5 * 1024 * 1024,
  "ファイルサイズは5MB以下にしてください"
);
```

**サービス選択のUI:**
- ドロップダウンで定義済みサービス（Twitter, GitHub, Facebook, LinkedIn）を選択可能
- "その他"を選択した場合、カスタムサービス名の入力フィールドを表示
- 定義済みサービスには公式アイコン（react-icons等を使用）を表示
  - Twitter: FaXTwitter (旧Twitter/X)
  - GitHub: FaGithub
  - Facebook: FaFacebook
  - LinkedIn: FaLinkedin


## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性や動作のことです。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証との橋渡しをします。*

### プロパティ 1: 有効な認証情報でのアカウント作成
*任意の*有効なメールアドレスとパスワード（6文字以上）に対して、アカウント登録を行うと、Supabase Authに新しいアカウントが作成される
**検証: 要件 1.2**

### プロパティ 2: 無効なメールアドレスの拒否
*任意の*無効なメールアドレス形式に対して、アカウント登録は失敗し、エラーメッセージが表示される
**検証: 要件 1.3**

### プロパティ 3: 短いパスワードの拒否
*任意の*6文字未満のパスワードに対して、アカウント登録は失敗し、エラーメッセージが表示される
**検証: 要件 1.4**

### プロパティ 4: アカウント作成後の自動ログインとリダイレクト
*任意の*有効なアカウント作成に対して、ユーザーは自動的にログインされ、プロフィール作成ページにリダイレクトされる
**検証: 要件 1.5**

### プロパティ 5: 正しい認証情報でのログイン
*任意の*正しいメールアドレスとパスワードに対して、ログインが成功し、セッションが確立される
**検証: 要件 2.2**

### プロパティ 6: 間違った認証情報の拒否
*任意の*間違ったメールアドレスまたはパスワードに対して、ログインは失敗し、エラーメッセージが表示される
**検証: 要件 2.3**

### プロパティ 7: ログイン成功後のリダイレクト
*任意の*ログイン成功に対して、ユーザーはホームページまたはプロフィール作成ページにリダイレクトされる
**検証: 要件 2.4**

### プロパティ 8: ログアウト後のセッション終了
*任意の*ログイン済みユーザーに対して、ログアウトするとセッションが終了し、ログインページにリダイレクトされる
**検証: 要件 2.5**

### プロパティ 9: セッションの永続性
*任意の*ログイン済みユーザーに対して、ページをリロードしてもセッション情報が保持され、ログイン状態が維持される
**検証: 要件 2.6**

### プロパティ 10: 未認証ユーザーの保護されたページへのアクセス拒否
*任意の*未認証ユーザーに対して、プロフィール作成ページにアクセスしようとすると、ログインページにリダイレクトされる
**検証: 要件 3.1**

### プロパティ 11: 認証済みユーザーのプロフィール作成ページへのアクセス
*任意の*ログイン済みユーザーに対して、プロフィール作成ページにアクセスすると、プロフィール入力フォームが表示される
**検証: 要件 3.2**

### プロパティ 12: 有効なプロフィールデータの保存
*任意の*有効なプロフィールデータ（名前と職種が非空）に対して、プロフィールを作成すると、Supabaseデータベースに保存される
**検証: 要件 3.3**

### プロパティ 13: プロフィールと所有者の紐付け
*任意の*プロフィール作成に対して、ログイン中のユーザーIDがプロフィールの所有者として記録される
**検証: 要件 3.4, 11.1**

### プロパティ 14: 無効な必須項目の拒否
*任意の*プロフィールデータで、名前または職種が空文字列の場合、プロフィール作成は失敗し、エラーメッセージが表示される
**検証: 要件 3.5**

### プロパティ 15: プロフィール作成後のリダイレクト
*任意の*有効なプロフィール作成に対して、プロフィールが正常に作成されると、作成されたプロフィールのIDを含むURLにリダイレクトされる
**検証: 要件 3.6**

### プロパティ 16: URLバリデーション
*任意の*URL文字列に対して、有効なURL形式（http/https）の場合のみ受け入れられ、無効な形式の場合はバリデーションエラーが発生する
**検証: 要件 4.5**

### プロパティ 17: スキル配列の管理
*任意の*スキル文字列の配列（最大20個）に対して、すべてのスキルが保存され、読み込み時に同じ順序で取得できる
**検証: 要件 4.6**

### プロパティ 18: 経験年数の数値バリデーション
*任意の*入力値に対して、0以上の数値のみが受け入れられ、負の数や非数値はバリデーションエラーとなる
**検証: 要件 4.7**

### プロパティ 19: 編集フォームへのデータ読み込み
*任意の*既存プロフィールに対して、所有者が編集モードに入ると、すべてのフィールドに現在の値が正しく設定される
**検証: 要件 5.1**

### プロパティ 20: 未認証ユーザーの編集ページへのアクセス拒否
*任意の*未認証ユーザーに対して、編集URLに直接アクセスしようとすると、ログインページにリダイレクトされる
**検証: 要件 5.2**

### プロパティ 21: 他人のプロフィール編集の拒否
*任意の*ログイン済みユーザーに対して、他人のプロフィールの編集URLに直接アクセスしようとすると、アクセスが拒否されてプロフィール表示ページにリダイレクトされる
**検証: 要件 5.3**

### プロパティ 22: プロフィール更新の永続化
*任意の*既存プロフィールと更新データに対して、更新を保存すると、Supabaseデータベースに反映され、再読み込み時に更新後のデータが取得できる
**検証: 要件 5.4**

### プロパティ 23: 更新後のデータ表示
*任意の*プロフィール更新に対して、保存が成功すると、更新されたデータがプロフィール詳細ページに表示される
**検証: 要件 5.5**

### プロパティ 24: 編集キャンセルの不変性
*任意の*プロフィールと変更に対して、編集をキャンセルすると、元のプロフィールデータが変更されずに保持される
**検証: 要件 5.6**

### プロパティ 25: プロフィールURLアクセス
*任意の*保存されているプロフィールIDに対して、そのIDを含むURLにアクセスすると、対応するプロフィールの詳細ページが表示される
**検証: 要件 6.1**

### プロパティ 26: プロフィール情報の完全表示
*任意の*プロフィールに対して、詳細ページにはすべての設定済みフィールド（名前、職種、自己紹介、スキル、経験年数、SNSリンク）が表示される
**検証: 要件 6.2**

### プロパティ 27: データベースラウンドトリップ
*任意の*有効なプロフィールに対して、Supabaseデータベースに保存してから読み込むと、元のプロフィールと同等のデータが取得できる
**検証: 要件 7.1, 7.2**

### プロパティ 28: クリップボードへのURLコピー
*任意の*プロフィールに対して、共有ボタンをクリックすると、プロフィールURLがクリップボードにコピーされる
**検証: 要件 8.4**

### プロパティ 29: バリデーションエラーメッセージ表示
*任意の*無効な入力に対して、対応するフィールドの近くに明確なエラーメッセージが表示される
**検証: 要件 9.2**

### プロパティ 30: ローディング状態の表示
*任意の*非同期操作（保存、読み込み、削除）中は、ローディングインジケーターが表示される
**検証: 要件 9.4**

### プロパティ 31: プロフィール削除確認ダイアログの表示
*任意の*自分のプロフィールに対して、削除ボタンをクリックすると、削除確認ダイアログが表示される
**検証: 要件 10.1**

### プロパティ 32: プロフィール削除の永続化
*任意の*既存プロフィールに対して、削除を確認すると、Supabaseデータベースからプロフィールが削除され、同じIDでの読み込みは失敗する
**検証: 要件 10.2**

### プロパティ 33: 削除後のリダイレクト
*任意の*プロフィール削除に対して、削除が成功すると、ホームページにリダイレクトされる
**検証: 要件 10.3**

### プロパティ 34: 削除キャンセルの不変性
*任意の*プロフィールに対して、削除をキャンセルすると、プロフィールデータが保持され、プロフィールページに留まる
**検証: 要件 10.4**

### プロパティ 35: 未認証ユーザーへの編集・削除ボタン非表示
*任意の*プロフィールに対して、ログインしていないユーザーがプロフィールページを閲覧すると、編集ボタンと削除ボタンが非表示になる
**検証: 要件 11.2**

### プロパティ 36: 他人のプロフィールへの編集・削除ボタン非表示
*任意の*他人のプロフィールに対して、ログイン済みユーザーがプロフィールページを閲覧すると、編集ボタンと削除ボタンが非表示になる
**検証: 要件 11.3**

### プロパティ 37: 自分のプロフィールへの編集・削除ボタン表示
*任意の*自分のプロフィールに対して、ログイン済みユーザーがプロフィールページを閲覧すると、編集ボタンと削除ボタンが表示される
**検証: 要件 11.4**

### プロパティ 38: 大きすぎる画像ファイルの拒否
*任意の*5MBを超える画像ファイルに対して、アップロードは失敗し、エラーメッセージが表示される
**検証: 要件 12.3**

### プロパティ 39: 無効なファイルタイプの拒否
*任意の*画像形式以外のファイル（JPEG、PNG、WebP以外）に対して、アップロードは失敗し、エラーメッセージが表示される
**検証: 要件 12.4**

### プロパティ 40: 有効な画像形式の受け入れ
*任意の*有効な画像ファイル（JPEG、PNG、WebP）に対して、ファイルサイズが5MB以下であればアップロードが成功する
**検証: 要件 4.9**

### プロパティ 41: 画像のStorageアップロード
*任意の*有効な画像ファイルに対して、プロフィール保存時にSupabase Storageの`profile-images`バケットにアップロードされる
**検証: 要件 12.5**

### プロパティ 42: 一意のファイル名生成
*任意の*画像アップロードに対して、ファイル名はユーザーIDとタイムスタンプを含む一意の名前で保存される
**検証: 要件 12.6**

### プロパティ 43: 画像URLのプロフィールへの記録
*任意の*画像アップロードに対して、アップロード成功後に画像の公開URLがプロフィールのimage_urlフィールドに記録される
**検証: 要件 4.12**

### プロパティ 44: 既存画像の削除（更新時）
*任意の*既存の画像を持つプロフィールに対して、新しい画像をアップロードすると、古い画像がSupabase Storageから削除される
**検証: 要件 12.7**

### プロパティ 45: 画像の削除（プロフィール削除時）
*任意の*画像を持つプロフィールに対して、プロフィールを削除すると、関連する画像もSupabase Storageから削除される
**検証: 要件 12.8**

### プロパティ 46: 画像の削除（ユーザー操作）
*任意の*画像を持つプロフィールに対して、ユーザーが画像削除を実行すると、プロフィールからimage_urlが削除され、Supabase Storageから画像が削除される
**検証: 要件 12.10**

### プロパティ 47: 定義済みサービスの公式アイコン表示
*任意の*定義済みサービス（Twitter、GitHub、Facebook、LinkedIn）のSNSリンクに対して、プロフィール表示時に対応する公式アイコンが表示される
**検証: 要件 6.5**

### プロパティ 48: カスタムサービスのサービス名表示
*任意の*カスタムサービスのSNSリンクに対して、プロフィール表示時にサービス名がテキストとして表示される
**検証: 要件 6.6**

## エラーハンドリング

### バリデーションエラー
- フォーム送信時にZodスキーマでバリデーション
- エラーは各フィールドの下に表示
- エラーメッセージは日本語で明確に

### 認証エラー
- 無効な認証情報の場合、エラーメッセージを表示
- セッション期限切れの場合、ログインページにリダイレクト
- Supabase Authのエラーを適切にハンドリング

### データベースエラー
- Supabaseへの接続失敗時は、エラーメッセージを表示
- データ取得失敗時は、リトライまたはエラー通知
- RLSによるアクセス拒否時は、適切なエラーメッセージを表示

### ネットワークエラー
- Supabaseへのリクエスト失敗時は、エラーメッセージを表示
- タイムアウト時は、リトライロジックを実装
- オフライン時は、ユーザーに通知

### 404エラー
- 存在しないプロフィールIDへのアクセス時は、404ページを表示
- ホームページへのリンクを提供

### 認可エラー
- 他人のプロフィールを編集・削除しようとした場合、アクセス拒否
- 適切なエラーメッセージを表示し、プロフィール表示ページにリダイレクト

## テスト戦略

### ユニットテスト

**対象:**
- バリデーション関数（`validation.ts`）
- Repository実装（`SupabaseProfileRepository`）
- サービス層（`authService.ts`）
- カスタムフック（`useAuth`, `useProfile`）
- 個別コンポーネントのロジック

**ツール:**
- Vitest
- React Testing Library
- @testing-library/user-event
- Supabaseモッククライアント

**例:**
- URLバリデーション関数のテスト（有効/無効なURL）
- SupabaseProfileRepositoryの各メソッド（save, findById, findByUserId, delete等）
- authServiceの各メソッド（signUp, signIn, signOut等）
- プロフィール作成・更新・削除の各操作
- モックRepositoryを使用したビジネスロジックのテスト

### プロパティベーステスト

**ライブラリ:** fast-check

**設定:**
- 各プロパティテストは最低100回の反復実行
- 各テストには設計書のプロパティ番号を明記
- コメント形式: `// Feature: engineer-profile-platform, Property X: [プロパティ説明]`

**対象プロパティ:**
- プロパティ1〜48（上記の正確性プロパティセクション参照）

**ジェネレーター:**
```typescript
// メールアドレスのジェネレーター
const emailArbitrary = fc.emailAddress();

// パスワードのジェネレーター
const passwordArbitrary = fc.string({ minLength: 6, maxLength: 50 });

// 短いパスワードのジェネレーター
const shortPasswordArbitrary = fc.string({ maxLength: 5 });

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

// 画像ファイルのジェネレーター（モック）
const imageFileArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
  type: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
  size: fc.integer({ min: 1, max: 5 * 1024 * 1024 }) // 5MB以下
});

// 大きすぎる画像ファイルのジェネレーター
const oversizedImageFileArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
  type: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
  size: fc.integer({ min: 5 * 1024 * 1024 + 1, max: 10 * 1024 * 1024 }) // 5MB超過
});

// 無効なファイルタイプのジェネレーター
const invalidFileTypeArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
  type: fc.constantFrom('application/pdf', 'text/plain', 'video/mp4'),
  size: fc.integer({ min: 1, max: 1024 * 1024 })
});
```

### 統合テスト

**対象:**
- ページ全体のフロー（登録→ログイン→作成→表示→編集→削除）
- ルーティングとナビゲーション
- Context + コンポーネントの統合
- Supabaseとの統合

**シナリオ:**
1. アカウント登録からプロフィール作成までの完全フロー
2. ログインからプロフィール編集までの完全フロー
3. プロフィール削除フローの完全テスト
4. Supabaseデータベースの永続化テスト
5. Row Level Security (RLS)のテスト
6. 認証ガードのテスト（未認証ユーザーのアクセス制御）
7. 所有者制御のテスト（他人のプロフィール編集の拒否）

### E2Eテスト（オプション）

将来的にPlaywrightまたはCypressを使用して、ブラウザ環境での完全なユーザーフローをテスト。

## 実装の優先順位

### フェーズ1: Supabaseセットアップと認証機能
1. プロジェクトセットアップ（Vite + React + TypeScript）
2. Supabaseプロジェクトの作成と設定
3. Supabaseクライアントの初期化
4. データベーススキーマの作成（profilesテーブル）
5. Row Level Security (RLS)ポリシーの設定
6. 認証機能の実装（AuthContext, authService）
7. アカウント登録・ログイン・ログアウトページの実装
8. ProtectedRouteコンポーネントの実装

### フェーズ2: プロフィール基本機能
1. データモデルとバリデーション
2. プロフィールサービス層の実装（profileService）
3. ProfileContextの実装
4. プロフィール作成機能
5. プロフィール表示機能
6. 所有者判定ロジックの実装

### フェーズ3: 編集・削除機能
1. プロフィール編集機能
2. 編集権限チェック（所有者のみ）
3. プロフィール削除機能
4. 削除権限チェック（所有者のみ）
5. エラーハンドリング

### フェーズ4: 共有機能とUI改善
1. URL共有機能
2. クリップボードコピー
3. レスポンシブデザイン
4. ローディング状態
5. ナビゲーションの改善（ログイン状態に応じた表示）

### フェーズ5: テストとリファクタリング
1. ユニットテスト（サービス層、バリデーション）
2. プロパティベーステスト
3. 統合テスト（認証フロー、プロフィールCRUD、RLS）
4. コードリファクタリング

### フェーズ6: 画像アップロード機能とSNSリンク改修
1. Supabase Storageバケットの作成とRLSポリシーの設定
2. ImageServiceの実装（アップロード、削除、バリデーション）
3. Profile型とProfileFormData型の更新（imageUrl、imageFileフィールド追加）
4. データベーススキーマの更新（image_urlカラム追加）
5. PredefinedServiceにLinkedInを追加
6. ProfileFormコンポーネントに画像アップロード機能を追加
7. ProfileCardコンポーネントに画像表示機能を追加
8. SNSリンクに公式アイコン（react-icons）を統合
9. 画像バリデーションのユニットテスト
10. 画像アップロード・削除のプロパティベーステスト
11. SNSアイコン表示のテスト
