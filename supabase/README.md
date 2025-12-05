# Supabaseデータベースマイグレーション

このディレクトリには、Supabaseデータベースのマイグレーションファイルが含まれています。

## マイグレーションファイル

### 001_create_profiles_table.sql

プロフィールテーブルとRow Level Security (RLS)ポリシーを作成します。

**含まれる内容:**
- `profiles`テーブルの作成
- インデックスの作成
- Row Level Security (RLS)の有効化
- RLSポリシーの作成（SELECT, INSERT, UPDATE, DELETE）
- `updated_at`自動更新トリガーの作成

## マイグレーションの実行方法

### 方法1: Supabase SQL Editorを使用（推奨）

1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. 左サイドバーの「SQL Editor」をクリック
4. 「New query」をクリック
5. マイグレーションファイルの内容をコピー＆ペースト
6. 「Run」をクリックして実行

### 方法2: Supabase CLIを使用

Supabase CLIをインストールしている場合：

```bash
# Supabase CLIのインストール（未インストールの場合）
npm install -g supabase

# プロジェクトの初期化
supabase init

# マイグレーションの実行
supabase db push
```

## テーブル構造

### profiles テーブル

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | プロフィールの一意のID |
| user_id | UUID | FOREIGN KEY, NOT NULL, UNIQUE | 所有者のユーザーID |
| name | TEXT | NOT NULL | エンジニアの名前 |
| job_title | TEXT | NOT NULL | 職種 |
| bio | TEXT | NULL | 自己紹介文 |
| skills | TEXT[] | DEFAULT '{}' | スキルの配列 |
| years_of_experience | INTEGER | NULL | 経験年数 |
| social_links | JSONB | DEFAULT '[]' | SNS・外部リンクのJSON配列 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | プロフィール作成日時 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | プロフィール更新日時 |

## Row Level Security (RLS) ポリシー

### SELECT ポリシー: "プロフィールは誰でも閲覧可能"
- すべてのユーザー（未認証含む）がプロフィールを閲覧可能

### INSERT ポリシー: "ユーザーは自分のプロフィールを作成可能"
- ログイン済みユーザーのみが自分のプロフィールを作成可能
- `user_id`が現在のユーザーIDと一致する必要がある

### UPDATE ポリシー: "ユーザーは自分のプロフィールのみ更新可能"
- ログイン済みユーザーのみが自分のプロフィールを更新可能
- `user_id`が現在のユーザーIDと一致する必要がある

### DELETE ポリシー: "ユーザーは自分のプロフィールのみ削除可能"
- ログイン済みユーザーのみが自分のプロフィールを削除可能
- `user_id`が現在のユーザーIDと一致する必要がある

## トリガー

### update_profiles_updated_at

プロフィールが更新されるたびに`updated_at`カラムを自動的に現在時刻に更新します。

## 確認方法

マイグレーション実行後、以下のSQLで確認できます：

```sql
-- テーブルの存在確認
SELECT * FROM information_schema.tables WHERE table_name = 'profiles';

-- カラムの確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- RLSポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- トリガーの確認
SELECT * FROM information_schema.triggers WHERE event_object_table = 'profiles';
```

## トラブルシューティング

### エラー: "permission denied for schema auth"

Supabase Dashboardから実行してください。ローカルのPostgreSQLクライアントでは`auth`スキーマへのアクセスが制限されている場合があります。

### エラー: "relation already exists"

テーブルが既に存在する場合は、以下のSQLで削除してから再実行してください：

```sql
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## 次のステップ

マイグレーション実行後：
1. Supabase Dashboardの「Table Editor」でテーブルを確認
2. テストデータを挿入して動作確認
3. アプリケーションからの接続をテスト
