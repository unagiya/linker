/**
 * 型定義ファイル
 * プロフィール関連の型を定義
 */

/**
 * 定義済みSNSサービス
 */
export const PredefinedService = {
  TWITTER: 'twitter',
  GITHUB: 'github',
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
} as const;

/**
 * 定義済みSNSサービスの型
 */
export type PredefinedServiceType = (typeof PredefinedService)[keyof typeof PredefinedService];

/**
 * SNSサービスの型
 * 定義済みサービスまたはカスタムサービス名
 */
export type SocialServiceType = PredefinedServiceType | string;

/**
 * SNSリンクの型
 */
export interface SocialLink {
  /** リンクの一意のID */
  id: string;
  /** サービス名（定義済みまたはカスタム） */
  service: SocialServiceType;
  /** URL */
  url: string;
}

/**
 * プロフィールの型
 */
export interface Profile {
  /** 一意のID（UUID） */
  id: string;
  /** 所有者のユーザーID（Supabase Auth） */
  user_id: string;
  /** 名前（必須） */
  name: string;
  /** 職種（必須） */
  jobTitle: string;
  /** 自己紹介文 */
  bio?: string;
  /** プロフィール画像のURL（Supabase Storage） */
  imageUrl?: string;
  /** スキルの配列 */
  skills: string[];
  /** 経験年数 */
  yearsOfExperience?: number;
  /** SNS・外部リンクの配列 */
  socialLinks: SocialLink[];
  /** 作成日時（ISO 8601形式） */
  createdAt: string;
  /** 更新日時（ISO 8601形式） */
  updatedAt: string;
}

/**
 * プロフィールフォームデータの型
 * フォームでは経験年数を文字列として扱う
 */
export interface ProfileFormData {
  name: string;
  jobTitle: string;
  bio: string;
  /** アップロードする画像ファイル */
  imageFile?: File;
  /** 既存の画像URL（編集時） */
  imageUrl?: string;
  /** 画像削除フラグ */
  removeImage?: boolean;
  skills: string[];
  /** フォームでは文字列として扱う */
  yearsOfExperience: string;
  socialLinks: Array<{
    service: string;
    url: string;
  }>;
}
