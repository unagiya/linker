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

1. プロジェクトルートに`.env.local`ファイルを作成
2. `.env.local.example`を参考に、以下の内容を記述：

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **注意**: `.env.local`ファイルは`.gitignore`に含まれており、Gitにコミットされません。

## 2. 依存関係のインストール

```bash
npm install
```

## 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてアプリケーションを確認できます。

## 4. データベーススキーマの作成

次のタスク（タスク2）で、Supabaseのデータベーススキーマを作成します。

## その他のコマンド

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
