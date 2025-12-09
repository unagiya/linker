/**
 * Supabaseデータベース型定義
 * データベーススキーマに対応する型を定義
 */

import type { SocialLink } from './profile';

/**
 * profilesテーブルの行型
 * データベースのカラム名（スネークケース）を使用
 */
export interface ProfileRow {
  /** 一意のID（UUID） */
  id: string;
  /** 所有者のユーザーID（Supabase Auth） */
  user_id: string;
  /** 名前（必須） */
  name: string;
  /** 職種（必須） */
  job_title: string;
  /** 自己紹介文 */
  bio: string | null;
  /** スキルの配列 */
  skills: string[];
  /** 経験年数 */
  years_of_experience: number | null;
  /** SNS・外部リンクの配列（JSONB） */
  social_links: SocialLink[];
  /** 作成日時 */
  created_at: string;
  /** 更新日時 */
  updated_at: string;
}

/**
 * profilesテーブルへの挿入データ型
 */
export interface ProfileInsert {
  /** 一意のID（UUID、オプション） */
  id?: string;
  /** 所有者のユーザーID（Supabase Auth） */
  user_id: string;
  /** 名前（必須） */
  name: string;
  /** 職種（必須） */
  job_title: string;
  /** 自己紹介文 */
  bio?: string | null;
  /** スキルの配列 */
  skills?: string[];
  /** 経験年数 */
  years_of_experience?: number | null;
  /** SNS・外部リンクの配列（JSONB） */
  social_links?: SocialLink[];
  /** 作成日時（オプション） */
  created_at?: string;
  /** 更新日時（オプション） */
  updated_at?: string;
}

/**
 * profilesテーブルの更新データ型
 */
export interface ProfileUpdate {
  /** 名前 */
  name?: string;
  /** 職種 */
  job_title?: string;
  /** 自己紹介文 */
  bio?: string | null;
  /** スキルの配列 */
  skills?: string[];
  /** 経験年数 */
  years_of_experience?: number | null;
  /** SNS・外部リンクの配列（JSONB） */
  social_links?: SocialLink[];
  /** 更新日時 */
  updated_at?: string;
}
