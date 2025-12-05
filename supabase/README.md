# Supabaseデータベースマイグレーション

このディレクトリには、Supabaseデータベースのマイグレーションファイルが含まれています。

## マイグレーションファイルの命名規則

マイグレーションファイルは、Supabaseの標準形式に従って命名する必要があります：

```
YYYYMMDDHHMMSS_description.sql
```

**形式の説明：**
- `YYYYMMDD`: 年月日（例: 20251205）
- `HHMMSS`: 時分秒（例: 183531）
- `description`: マイグレーションの説明（スネークケース、例: create_profiles_table）

**例：**
- `20251205183531_create_profiles_table.sql`
- `20251205190000_add_avatar_to_profiles.sql`
- `20251206120000_create_comments_table.sql`

**タイムスタンプの生成方法：**

```bash
# 日本時間でタイムスタンプを生成
TZ=Asia/Tokyo date +%Y%m%d%H%M%S
```

**重要な注意事項：**
- タイムスタンプは作成順序を保証するため、必ず現在時刻を使用してください
- 同じタイムスタンプを持つ複数のマイグレーションファイルを作成しないでください
- ファイル名の説明部分は、マイグレーションの内容を明確に表すものにしてください

## マイグレーションファイル

### 20251205183531_create_profiles_table.sql

プロフィールテーブルとRow Level Security (RLS)ポリシーを作成します。

**含まれる内容:**
- `profiles`テーブルの作成
- インデックスの作成
- Row Level Security (RLS)の有効化
- RLSポリシーの作成（SELECT, INSERT, UPDATE, DELETE）
- `updated_at`自動更新トリガーの作成

## マイグレーションの実行方法

### 方法1: Supabase CLIを使用（推奨）

プロジェクトにはSupabase CLIが含まれています。以下のコマンドで簡単にマイグレーションを実行できます：

```bash
# 1. Supabaseプロジェクトにリンク（初回のみ）
make supabase-link

# 2. マイグレーションを実行
make supabase-migrate

# 3. マイグレーション状態を確認
make supabase-status
```

### 方法2: Supabase SQL Editorを使用

1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. 左サイドバーの「SQL Editor」をクリック
4. 「New query」をクリック
5. マイグレーションファイルの内容をコピー＆ペースト
6. 「Run」をクリックして実行

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
