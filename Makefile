.PHONY: help setup-env supabase-init supabase-link supabase-status supabase-migrate supabase-reset install dev build test lint format clean

# デフォルトターゲット
help:
	@echo "利用可能なコマンド:"
	@echo ""
	@echo "セットアップ:"
	@echo "  make setup-env       - 環境変数ファイル(.env.local)を作成"
	@echo "  make supabase-init   - Supabaseプロジェクトを初期化"
	@echo "  make supabase-link   - Supabaseプロジェクトにリンク"
	@echo ""
	@echo "マイグレーション:"
	@echo "  make supabase-migrate - マイグレーションを実行"
	@echo "  make supabase-status  - マイグレーション状態を確認"
	@echo "  make supabase-reset   - ローカルDBをリセット"
	@echo ""
	@echo "開発:"
	@echo "  make install         - 依存関係をインストール"
	@echo "  make dev             - 開発サーバーを起動"
	@echo "  make build           - プロダクションビルド"
	@echo ""
	@echo "テスト:"
	@echo "  make test            - テストを実行"
	@echo "  make test-watch      - テストをウォッチモードで実行"
	@echo ""
	@echo "コード品質:"
	@echo "  make lint            - ESLintでコードチェック"
	@echo "  make lint-fix        - ESLintで自動修正"
	@echo "  make format          - Prettierでコードフォーマット"
	@echo ""
	@echo "その他:"
	@echo "  make clean           - ビルド成果物を削除"

# 環境変数ファイルのセットアップ
setup-env:
	@bash scripts/setup-env.sh

# Supabaseプロジェクトの初期化
supabase-init:
	@echo "🔧 Supabaseプロジェクトを初期化します..."
	@npx supabase init

# Supabaseプロジェクトにリンク
supabase-link:
	@echo "🔗 Supabaseプロジェクトにリンクします..."
	@echo "プロジェクトIDを入力してください（Supabase Dashboard > Settings > General で確認）:"
	@npx supabase link

# マイグレーションを実行
supabase-migrate:
	@echo "🚀 マイグレーションを実行します..."
	@npx supabase db push

# マイグレーション状態を確認
supabase-status:
	@echo "📊 マイグレーション状態を確認します..."
	@npx supabase migration list

# ローカルDBをリセット
supabase-reset:
	@echo "⚠️  ローカルDBをリセットします..."
	@npx supabase db reset

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
