# Linker

エンジニアが自己紹介プロフィールを作成・共有するためのプラットフォーム

## 概要

Linkerは、エンジニアが自身のプロフィール情報を登録し、スキル、経験、プロジェクトなどを共有できるReactベースのシングルページアプリケーションです。名刺のように個人に渡せるプロフィールURLを生成します。

## 技術スタック

- **フロントエンド**: React 18+ with TypeScript
- **ルーティング**: React Router v6
- **状態管理**: React Context API + useReducer
- **バリデーション**: Zod
- **ビルドツール**: Vite
- **テスティング**: Vitest + React Testing Library + fast-check

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# テストの実行
npm test

# テストのウォッチモード
npm run test:watch

# リント
npm run lint

# フォーマット
npm run format
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
│   └── ProfileContext/ # プロフィール状態管理
├── hooks/              # カスタムフック
├── repositories/       # データアクセス層
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
├── pages/              # ページコンポーネント
└── test/               # テスト設定
```

## 開発ガイドライン

詳細は `.kiro/steering/project-standards.md` を参照してください。
