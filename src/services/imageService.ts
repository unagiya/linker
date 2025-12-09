/**
 * 画像管理サービス
 * Supabase Storageを使用した画像のアップロード・削除を管理
 */

import { supabase } from '../lib/supabase';

// 定数
const BUCKET_NAME = 'profile-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * バリデーション結果の型
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 画像ファイルのバリデーション
 * @param file - バリデーションする画像ファイル
 * @returns バリデーション結果
 */
export function validateImageFile(file: File): ValidationResult {
  // ファイルタイプのチェック
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'JPEG、PNG、WebP形式の画像のみアップロード可能です',
    };
  }

  // ファイルサイズのチェック
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'ファイルサイズは5MB以下にしてください',
    };
  }

  return { valid: true };
}

/**
 * プロフィール画像をアップロード
 * @param userId - ユーザーID
 * @param file - アップロードする画像ファイル
 * @returns 画像の公開URL
 * @throws バリデーションエラーまたはアップロードエラー
 */
export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  // バリデーション
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // ファイル拡張子を取得
  const fileExt = file.name.split('.').pop();
  // 一意のファイル名を生成（userId + タイムスタンプ）
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  // Supabase Storageにアップロード
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
  }

  // 公開URLを取得
  return getPublicUrl(data.path);
}

/**
 * プロフィール画像を削除
 * @param imageUrl - 削除する画像のURL
 * @throws 削除エラー
 */
export async function deleteProfileImage(imageUrl: string): Promise<void> {
  try {
    // URLからパスを抽出
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/profile-images\/(.+)/);

    if (!pathMatch) {
      throw new Error('無効な画像URLです');
    }

    const filePath = pathMatch[1];

    // Supabase Storageから削除
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      throw new Error(`画像の削除に失敗しました: ${error.message}`);
    }
  } catch (error) {
    // URLのパースエラーなどをキャッチ
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('画像の削除に失敗しました');
  }
}

/**
 * ストレージパスから公開URLを取得
 * @param path - ストレージ内のファイルパス
 * @returns 公開URL
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}
