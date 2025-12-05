import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseの設定を取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 環境変数が設定されているか確認
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabaseの環境変数が設定されていません。.env.localファイルにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください。'
  );
}

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
