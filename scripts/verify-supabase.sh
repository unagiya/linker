#!/bin/bash

# Supabaseデータベース接続確認スクリプト

set -e

echo "🔍 Supabase接続確認を開始します..."
echo ""

# .env.localファイルの存在確認
if [ ! -f ".env.local" ]; then
  echo "❌ エラー: .env.local ファイルが見つかりません"
  echo "   make setup-env を実行して環境変数を設定してください"
  exit 1
fi

# 環境変数の読み込み
source .env.local

# 環境変数の確認
if [ -z "$VITE_SUPABASE_URL" ] || [ "$VITE_SUPABASE_URL" = "your-project-url" ]; then
  echo "❌ エラー: VITE_SUPABASE_URL が設定されていません"
  echo "   .env.local を編集して正しい値を設定してください"
  exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ] || [ "$VITE_SUPABASE_ANON_KEY" = "your-anon-key" ]; then
  echo "❌ エラー: VITE_SUPABASE_ANON_KEY が設定されていません"
  echo "   .env.local を編集して正しい値を設定してください"
  exit 1
fi

echo "✅ 環境変数が設定されています"
echo "   URL: $VITE_SUPABASE_URL"
echo "   Key: ${VITE_SUPABASE_ANON_KEY:0:20}..."
echo ""

# Supabase APIへの接続確認
echo "🌐 Supabase APIへの接続を確認中..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VITE_SUPABASE_URL/rest/v1/" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Supabase APIへの接続に成功しました"
else
  echo "❌ エラー: Supabase APIへの接続に失敗しました (HTTP $HTTP_STATUS)"
  echo "   URLとAPIキーが正しいか確認してください"
  exit 1
fi

echo ""

# profilesテーブルの存在確認
echo "📊 profilesテーブルの存在を確認中..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VITE_SUPABASE_URL/rest/v1/profiles" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ profilesテーブルが存在します"
elif [ "$HTTP_STATUS" = "404" ]; then
  echo "⚠️  警告: profilesテーブルが見つかりません"
  echo "   supabase/migrations/001_create_profiles_table.sql を実行してください"
  echo ""
  echo "実行方法:"
  echo "1. https://supabase.com/dashboard でプロジェクトを開く"
  echo "2. SQL Editor を開く"
  echo "3. マイグレーションファイルの内容を実行"
  exit 1
else
  echo "❌ エラー: テーブルの確認に失敗しました (HTTP $HTTP_STATUS)"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ すべての確認が完了しました！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "次のステップ:"
echo "  make dev  # 開発サーバーを起動"
