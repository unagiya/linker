# Supabase Storage セットアップガイド

このドキュメントでは、プロフィール画像アップロード機能のためのSupabase Storageの設定方法を説明します。

## 前提条件

- Supabaseプロジェクトが作成されていること
- プロジェクトのURLとAPIキーが`.env.local`に設定されていること

## セットアップ手順

### 方法1: SQLエディタを使用（推奨）

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard にアクセス
   - プロジェクトを選択

2. **SQL Editorを開く**
   - 左メニューから「SQL Editor」を選択
   - 「New query」をクリック

3. **マイグレーションSQLを実行**
   - `supabase/migrations/20251209163440_add_profile_images.sql` の内容をコピー
   - SQL Editorにペースト
   - 「Run」ボタンをクリック

4. **実行結果を確認**
   - エラーがないことを確認
   - 成功メッセージが表示されることを確認

### 方法2: ダッシュボードから手動設定

#### ステップ1: ストレージバケットの作成

1. 左メニューから「Storage」を選択
2. 「Create a new bucket」をクリック
3. 以下の設定を入力：
   - **Name**: `profile-images`
   - **Public bucket**: チェックを入れる（誰でも画像を閲覧可能にする）
4. 「Create bucket」をクリック

#### ステップ2: ストレージポリシーの設定

1. 作成した`profile-images`バケットを選択
2. 「Policies」タブを選択
3. 以下のポリシーを追加：

**ポリシー1: 画像の閲覧（SELECT）**
```sql
CREATE POLICY "プロフィール画像は誰でも閲覧可能"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');
```

**ポリシー2: 画像のアップロード（INSERT）**
```sql
CREATE POLICY "ユーザーは自分の画像をアップロード可能"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**ポリシー3: 画像の更新（UPDATE）**
```sql
CREATE POLICY "ユーザーは自分の画像のみ更新可能"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**ポリシー4: 画像の削除（DELETE）**
```sql
CREATE POLICY "ユーザーは自分の画像のみ削除可能"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### ステップ3: データベーステーブルの更新

1. 左メニューから「SQL Editor」を選択
2. 以下のSQLを実行：

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT;
COMMENT ON COLUMN profiles.image_url IS 'プロフィール画像のURL（Supabase Storage）';
```

## 設定の確認

### 1. バケットの確認

```bash
# Supabase CLIを使用する場合
supabase storage list
```

または、ダッシュボードの「Storage」セクションで`profile-images`バケットが表示されることを確認。

### 2. ポリシーの確認

ダッシュボードの「Storage」→「profile-images」→「Policies」で、4つのポリシーが設定されていることを確認。

### 3. テーブルの確認

```sql
-- SQL Editorで実行
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'image_url';
```

`image_url`カラムが存在することを確認。

## トラブルシューティング

### エラー: "bucket already exists"

バケットが既に存在する場合は、このエラーは無視して問題ありません。マイグレーションSQLは冪等性を持つように設計されています。

### エラー: "policy already exists"

ポリシーが既に存在する場合も、このエラーは無視して問題ありません。

### 画像がアップロードできない

1. バケットが公開設定になっているか確認
2. RLSポリシーが正しく設定されているか確認
3. ユーザーがログインしているか確認
4. ファイルパスが`{userId}/{filename}`の形式になっているか確認

### 画像が表示されない

1. 画像URLが正しく生成されているか確認
2. バケットが公開設定になっているか確認
3. ブラウザのコンソールでCORSエラーが出ていないか確認

## 参考リンク

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
