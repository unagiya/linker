-- ニックネーム機能の追加
-- このマイグレーションは、プロフィールニックネームURL機能を追加します

-- 1. profilesテーブルにnicknameカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 2. 既存のプロフィールにUUIDベースのニックネームを設定
-- 既存データがある場合、idをnicknameとして使用
UPDATE profiles 
SET nickname = id::text 
WHERE nickname IS NULL;

-- 3. nicknameカラムにNOT NULL制約を追加
ALTER TABLE profiles ALTER COLUMN nickname SET NOT NULL;

-- 4. 大文字小文字を区別しないユニーク制約を追加
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_unique_ci 
ON profiles (LOWER(nickname));

-- 5. 検索パフォーマンス向上のためのインデックスを追加
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles (nickname);

-- 6. ニックネーム検索用の関数を作成
CREATE OR REPLACE FUNCTION find_profile_by_nickname(nickname_param TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  nickname TEXT,
  name TEXT,
  job_title TEXT,
  bio TEXT,
  image_url TEXT,
  skills TEXT[],
  years_of_experience INTEGER,
  social_links JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.nickname,
    p.name,
    p.job_title,
    p.bio,
    p.image_url,
    p.skills,
    p.years_of_experience,
    p.social_links,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE LOWER(p.nickname) = LOWER(nickname_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ニックネーム利用可能性チェック用の関数を作成
CREATE OR REPLACE FUNCTION check_nickname_availability(
  nickname_param TEXT,
  current_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 現在のユーザーのニックネームと同じ場合は利用可能とする
  IF current_user_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = current_user_id 
      AND LOWER(nickname) = LOWER(nickname_param)
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- 他のユーザーが使用していないかチェック
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE LOWER(nickname) = LOWER(nickname_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLSポリシーの更新（既存のポリシーはそのまま適用される）
-- ニックネーム機能でも既存のRLSポリシーが適切に動作することを確認

-- 9. コメントの追加
COMMENT ON COLUMN profiles.nickname IS 'プロフィールURL用のニックネーム（一意、大文字小文字無視）';
COMMENT ON FUNCTION find_profile_by_nickname(TEXT) IS 'ニックネームでプロフィールを検索する関数';
COMMENT ON FUNCTION check_nickname_availability(TEXT, UUID) IS 'ニックネームの利用可能性をチェックする関数';

-- 10. 予約語チェック用の関数を作成
CREATE OR REPLACE FUNCTION is_reserved_nickname(nickname_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  reserved_nicknames TEXT[] := ARRAY[
    'admin', 'api', 'www', 'profile', 'signin', 'signup', 'login', 'logout',
    'create', 'edit', 'delete', 'settings', 'help', 'about', 'contact',
    'terms', 'privacy', 'support', 'blog', 'news', 'docs', 'documentation'
  ];
BEGIN
  RETURN LOWER(nickname_param) = ANY(reserved_nicknames);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_reserved_nickname(TEXT) IS '予約語かどうかをチェックする関数';