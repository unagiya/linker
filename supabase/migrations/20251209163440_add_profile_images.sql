-- プロフィール画像機能の追加
-- このマイグレーションは、プロフィール画像のアップロード機能を追加します

-- 1. profilesテーブルにimage_urlカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- コメントの追加
COMMENT ON COLUMN profiles.image_url IS 'プロフィール画像のURL（Supabase Storage）';

-- 2. profile-imagesストレージバケットの作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. ストレージRLSポリシー: 誰でも画像を閲覧可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'プロフィール画像は誰でも閲覧可能'
  ) THEN
    CREATE POLICY "プロフィール画像は誰でも閲覧可能"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'profile-images');
  END IF;
END $$;

-- 4. ストレージRLSポリシー: ログイン済みユーザーは自分の画像をアップロード可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'ユーザーは自分の画像をアップロード可能'
  ) THEN
    CREATE POLICY "ユーザーは自分の画像をアップロード可能"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- 5. ストレージRLSポリシー: ユーザーは自分の画像のみ更新可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'ユーザーは自分の画像のみ更新可能'
  ) THEN
    CREATE POLICY "ユーザーは自分の画像のみ更新可能"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- 6. ストレージRLSポリシー: ユーザーは自分の画像のみ削除可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'ユーザーは自分の画像のみ削除可能'
  ) THEN
    CREATE POLICY "ユーザーは自分の画像のみ削除可能"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
