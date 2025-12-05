# Linker セットアップガイド

このドキュメントでは、Linkerプロジェクトのセットアップ手順を説明します。

## 前提条件

- Node.js 18以上
- npm または yarn
- Supabaseアカウント

## 1. Supabaseプロジェクトのセットアップ

### 1.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成またはログイン
2. 「New Project」をクリックして新しいプロジェクトを作成
3. プロジェクト名を入力（例: linker）
4. データベースパスワードを設定（安全なパスワードを使用）
5. リージョンを選択（日本の場合は「Northeast Asia (Tokyo)」を推奨）
6. 「Create new project」をクリック

### 1.2 APIキーの取得

プロジェクトが作成されたら：

1. 左サイドバーの「Settings」→「API」をクリック
2. 以下の情報をコピー：
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.3 環境変数の設定

#### 方法1: Makefileを使用（推奨）

```bash
make setup-env
```

このコマンドで`.env.local`ファイルが自動的に作成されます。

#### 方法2: 手動で作成

1. プロジェクトルートに`.env.local`ファイルを作成
2. `.env.local.example`を参考に、以下の内容を記述：

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **注意**: `.env.local`ファイルは`.gitignore`に含まれており、Gitにコミットされません。

### 1.4 環境変数の編集

`.env.local`ファイルを開き、Supabaseから取得した値を設定してください：

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2. 依存関係のインストール

```bash
make install
# または
npm install
```

## 3. 開発サーバーの起動

```bash
make dev
# または
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてアプリケーションを確認できます。

## 4. Supabaseプロジェクトにリンク

```bash
make supabase-link
```

プロジェクトIDを入力してください（Supabase Dashboard > Settings > General で確認できます）。

## 5. データベーススキーマの作成

### 5.1 マイグレーションを実行

```bash
make supabase-migrate
```

このコマンドで`supabase/migrations/`内のマイグレーションファイルが実行されます。

### 5.2 実行結果の確認

```bash
make supabase-status
```

または、Supabase Dashboardで確認：

1. 左サイドバーの「Table Editor」をクリック
2. `profiles`テーブルが作成されていることを確認
3. テーブルの構造とRLSポリシーが正しく設定されていることを確認

詳細は `supabase/README.md` を参照してください。

## その他のコマンド

### Makefileコマンド

**セットアップ:**
- `make setup-env` - 環境変数ファイルを作成
- `make supabase-init` - Supabaseプロジェクトを初期化
- `make supabase-link` - Supabaseプロジェクトにリンク

**マイグレーション:**
- `make supabase-migrate` - マイグレーションを実行
- `make supabase-status` - マイグレーション状態を確認
- `make supabase-reset` - ローカルDBをリセット

**開発:**
- `make install` - 依存関係をインストール
- `make dev` - 開発サーバーを起動
- `make build` - プロダクションビルド

**テスト:**
- `make test` - テスト実行
- `make test-watch` - テストをウォッチモードで実行

**コード品質:**
- `make lint` - ESLintでコードチェック
- `make lint-fix` - ESLintで自動修正
- `make format` - Prettierでコードフォーマット

**その他:**
- `make clean` - ビルド成果物を削除

### npmコマンド

- `npm run build` - プロダクションビルド
- `npm run test` - テスト実行
- `npm run test:watch` - テストをウォッチモードで実行
- `npm run lint` - ESLintでコードチェック
- `npm run format` - Prettierでコードフォーマット

## トラブルシューティング

### Supabaseクライアントの初期化エラー

環境変数が正しく設定されているか確認してください：

```bash
# .env.localファイルが存在するか確認
ls -la .env.local

# 環境変数の内容を確認（値は表示されません）
cat .env.local
```

### ポート5173が既に使用されている

別のポートを使用する場合：

```bash
npm run dev -- --port 3000
```

## 次のステップ

セットアップが完了したら、タスク2「データベーススキーマの作成」に進んでください。
