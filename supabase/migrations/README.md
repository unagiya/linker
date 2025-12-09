# Supabaseマイグレーション

このディレクトリには、Supabaseデータベースのマイグレーションファイルが含まれています。

## マイグレーションの実行方法

### ローカル開発環境

Supabase CLIを使用してローカルでマイグレーションを実行する場合：

```bash
# Supabase CLIのインストール（初回のみ）
npm install -g supabase

# ローカルSupabaseの起動
supabase start

# マイグレーションの実行
supabase db push
```

### 本番環境（Supabaseダッシュボード）

1. [Supabaseダッシュボード](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. マイグレーションファイルの内容をコピー&ペースト
5. 「Run」ボタンをクリックして実行

## マイグレーション一覧

### 20251205183531_create_profiles_table.sql
- profilesテーブルの作成
- RLSポリシーの設定
- インデックスの作成
- トリガーの作成

### 20251209163440_add_profile_images.sql
- profilesテーブルにimage_urlカラムを追加
- profile-imagesストレージバケットの作成
- ストレージRLSポリシーの設定

## 注意事項

- マイグレーションは順番に実行してください
- 本番環境で実行する前に、必ずローカル環境でテストしてください
- マイグレーションは冪等性を持つように設計されています（複数回実行しても安全）
