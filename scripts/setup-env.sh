#!/bin/bash

# 環境変数ファイルのセットアップスクリプト

set -e

ENV_FILE=".env.local"
EXAMPLE_FILE=".env.local.example"

echo "🔧 環境変数ファイルのセットアップを開始します..."
echo ""

# .env.local.exampleが存在するか確認
if [ ! -f "$EXAMPLE_FILE" ]; then
  echo "❌ エラー: $EXAMPLE_FILE が見つかりません"
  exit 1
fi

# .env.localが既に存在する場合は確認
if [ -f "$ENV_FILE" ]; then
  echo "⚠️  $ENV_FILE は既に存在します"
  read -p "上書きしますか？ (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ セットアップをキャンセルしました"
    exit 0
  fi
  echo ""
fi

# Supabaseの情報を表示
echo "📝 Supabaseプロジェクトの情報を入力してください"
echo ""
echo "Supabaseプロジェクトをまだ作成していない場合:"
echo "1. https://supabase.com にアクセス"
echo "2. 新しいプロジェクトを作成"
echo "3. Settings → API から以下の情報を取得"
echo ""

# VITE_SUPABASE_URLの入力
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SupabaseプロジェクトURL を入力してください"
echo "例: https://xxxxxxxxxxxxx.supabase.co"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "VITE_SUPABASE_URL: " SUPABASE_URL

# 入力が空の場合はデフォルト値を使用
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="your-project-url"
  echo "⚠️  空の入力: デフォルト値を使用します"
fi

echo ""

# VITE_SUPABASE_ANON_KEYの入力
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Supabase匿名キー（anon public key）を入力してください"
echo "例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "VITE_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY

# 入力が空の場合はデフォルト値を使用
if [ -z "$SUPABASE_ANON_KEY" ]; then
  SUPABASE_ANON_KEY="your-anon-key"
  echo "⚠️  空の入力: デフォルト値を使用します"
fi

echo ""

# .env.localファイルを作成
cat > "$ENV_FILE" << EOF
# Supabase設定
# https://supabase.com でプロジェクトを作成し、以下の値を設定してください

# SupabaseプロジェクトURL
VITE_SUPABASE_URL=$SUPABASE_URL

# Supabase匿名キー（公開キー）
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

echo "✅ $ENV_FILE を作成しました"
echo ""

# 設定内容を表示
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "設定内容:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VITE_SUPABASE_URL: $SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..." # 最初の20文字のみ表示
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# デフォルト値が使用されている場合は警告
if [ "$SUPABASE_URL" = "your-project-url" ] || [ "$SUPABASE_ANON_KEY" = "your-anon-key" ]; then
  echo "⚠️  警告: デフォルト値が使用されています"
  echo "   $ENV_FILE を編集して、正しい値を設定してください"
  echo ""
fi

echo "📝 次のステップ:"
echo "1. 値が正しいか確認: cat $ENV_FILE"
echo "2. 開発サーバーを起動: make dev"
echo ""
echo "詳細は SETUP.md を参照してください"
