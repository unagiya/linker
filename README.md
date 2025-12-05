# Linker

エンジニアが自己紹介プロフィールを作成・共有するためのプラットフォーム

## 概要

Linkerは、エンジニアが自身のスキル、経験、プロジェクトなどを登録し、名刺のように他のエンジニアと共有できるプラットフォームです。

### 主な機能

- 🔐 アカウント登録・ログイン（Supabase Auth）
- 👤 プロフィールの作成・編集・削除
- 🎨 名刺風のプロフィール表示
- 🔗 共有可能なURL生成
- 💾 データの永続化（Supabase）
- 🔒 Row Level Security (RLS)による所有者制御
- 📱 レスポンシブUI

## クイックスタート

### 1. 環境変数の設定

```bash
make setup-env
```

`.env.local`ファイルが作成されるので、Supabaseの設定値を入力してください。

### 2. 依存関係のインストール

```bash
make install
```

### 3. 開発サーバーの起動

```bash
make dev
```

ブラウザで `http://localhost:5173` にアクセスしてください。

## セットアップ

詳細なセットアップ手順は [SETUP.md](./SETUP.md) を参照してください。

## 技術スタック

- **フロントエンド**: React 18+ with TypeScript
- **ルーティング**: React Router v6
- **状態管理**: React Context API + useReducer
- **バックエンド**: Supabase
  - 認証: Supabase Auth
  - データベース: PostgreSQL
  - アクセス制御: Row Level Security (RLS)
- **バリデーション**: Zod
- **ビルドツール**: Vite
- **テスティング**: Vitest + React Testing Library
- **プロパティベーステスト**: fast-check

## 利用可能なコマンド

```bash
make help              # コマンド一覧を表示
make setup-env         # 環境変数ファイルを作成
make install           # 依存関係をインストール
make dev               # 開発サーバーを起動
make build             # プロダクションビルド
make test              # テストを実行
make test-watch        # テストをウォッチモードで実行
make lint              # ESLintでコードチェック
make lint-fix          # ESLintで自動修正
make format            # Prettierでコードフォーマット
make clean             # ビルド成果物を削除
```

## プロジェクト構造

```
src/
├── components/          # UIコンポーネント
│   ├── ProfileForm/    # プロフィール入力フォーム
│   ├── ProfileCard/    # プロフィール表示カード
│   ├── Navigation/     # ナビゲーションバー
│   └── common/         # 共通コンポーネント
├── contexts/           # React Context
│   ├── AuthContext/    # 認証状態管理
│   └── ProfileContext/ # プロフィール状態管理
├── hooks/              # カスタムフック
├── lib/                # 外部ライブラリの設定
├── repositories/       # データアクセス層
├── services/           # ビジネスロジック層
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
└── pages/              # ページコンポーネント
```

## 開発ガイドライン

- コードは日本語でコメントを記述
- 変数名・関数名は英語を使用
- すべての新機能にはテストを書く
- コミットメッセージは日本語で明確に記述

## ライセンス

MIT
