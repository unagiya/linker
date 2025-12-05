-- プロフィールテーブルの作成
-- このマイグレーションは、エンジニアプロフィールを保存するためのテーブルを作成します

-- profilesテーブルの作成
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  years_of_experience INTEGER,
  social_links JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)  -- 1ユーザー1プロフィール
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Row Level Security (RLS) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 誰でもプロフィールを閲覧可能
CREATE POLICY "プロフィールは誰でも閲覧可能"
  ON profiles FOR SELECT
  USING (true);

-- RLSポリシー: ログイン済みユーザーは自分のプロフィールを作成可能
CREATE POLICY "ユーザーは自分のプロフィールを作成可能"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "ユーザーは自分のプロフィールのみ更新可能"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のプロフィールのみ削除可能
CREATE POLICY "ユーザーは自分のプロフィールのみ削除可能"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at自動更新トリガーの作成
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメントの追加（ドキュメント目的）
COMMENT ON TABLE profiles IS 'エンジニアのプロフィール情報を保存するテーブル';
COMMENT ON COLUMN profiles.id IS 'プロフィールの一意のID';
COMMENT ON COLUMN profiles.user_id IS '所有者のユーザーID（auth.usersテーブルへの外部キー）';
COMMENT ON COLUMN profiles.name IS 'エンジニアの名前（必須）';
COMMENT ON COLUMN profiles.job_title IS '職種（必須）';
COMMENT ON COLUMN profiles.bio IS '自己紹介文（任意）';
COMMENT ON COLUMN profiles.skills IS 'スキルの配列';
COMMENT ON COLUMN profiles.years_of_experience IS '経験年数（任意）';
COMMENT ON COLUMN profiles.social_links IS 'SNS・外部リンクのJSON配列';
COMMENT ON COLUMN profiles.created_at IS 'プロフィール作成日時';
COMMENT ON COLUMN profiles.updated_at IS 'プロフィール更新日時';
