.PHONY: help setup-env install dev build test lint format clean

# デフォルトターゲット
help:
	@echo "利用可能なコマンド:"
	@echo "  make setup-env  - 環境変数ファイル(.env.local)を作成"
	@echo "  make install    - 依存関係をインストール"
	@echo "  make dev        - 開発サーバーを起動"
	@echo "  make build      - プロダクションビルド"
	@echo "  make test       - テストを実行"
	@echo "  make test-watch - テストをウォッチモードで実行"
	@echo "  make lint       - ESLintでコードチェック"
	@echo "  make lint-fix   - ESLintで自動修正"
	@echo "  make format     - Prettierでコードフォーマット"
	@echo "  make clean      - ビルド成果物を削除"

# 環境変数ファイルのセットアップ
setup-env:
	@bash scripts/setup-env.sh

# 依存関係のインストール
install:
	npm install

# 開発サーバーの起動
dev:
	npm run dev

# プロダクションビルド
build:
	npm run build

# テストの実行
test:
	npm run test

# テストをウォッチモードで実行
test-watch:
	npm run test:watch

# ESLintでコードチェック
lint:
	npm run lint

# ESLintで自動修正
lint-fix:
	npm run lint:fix

# Prettierでコードフォーマット
format:
	npm run format

# ビルド成果物を削除
clean:
	rm -rf dist
	rm -rf node_modules/.vite
	rm -rf coverage
