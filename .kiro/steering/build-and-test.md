---
inclusion: manual
---

# ビルドとテストのガイド

このドキュメントは、プロジェクトのビルドとテストの実行方法を説明します。

## ビルド方法

プロジェクトのビルド手順:

```bash
# 依存関係のインストール
npm install

# ビルドの実行
npm run build
```

## テストの実行

### 重要: npmコマンド実行前の確認

**npmコマンドを実行する前に、必ずpackage.jsonを確認してください。**

- package.jsonのscriptsセクションを確認して、既に含まれているオプションを把握する
- 重複するオプションを指定しないようにする
- 例: `npm test`が既に`vitest --run`を含む場合、`npm test -- --run`は不要

### すべてのテストを実行
```bash
npm test
```

### 特定のテストファイルを実行
```bash
npm test -- <test-file-path>
```

注意: package.jsonの`test`スクリプトに既に`--run`が含まれている場合、追加で`--run`を指定する必要はありません。

### ウォッチモードでテストを実行
```bash
npm run test:watch
```

または

```bash
npm test -- --watch
```

## 開発サーバー

開発サーバーの起動:

```bash
npm run dev
```

## リンティング

コードの品質チェック:

```bash
npm run lint
```

## トラブルシューティング

### よくある問題

1. **依存関係のエラー**: `node_modules`を削除して再インストール
2. **ビルドエラー**: キャッシュをクリアして再ビルド
3. **テストの失敗**: テストの依存関係を確認
