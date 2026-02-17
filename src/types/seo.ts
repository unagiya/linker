/**
 * SEO関連の型定義
 */

/**
 * Open Graphメタタグの型
 */
export interface OpenGraphMetadata {
  /** ページタイトル */
  title: string;
  /** ページの説明 */
  description: string;
  /** ページのURL */
  url: string;
  /** ページの種類（profile, website等） */
  type: string;
  /** 画像URL */
  image?: string;
  /** サイト名 */
  siteName: string;
}

/**
 * 構造化データ（JSON-LD）の型
 */
export interface StructuredData {
  /** スキーマタイプ */
  '@context': string;
  /** データタイプ */
  '@type': string;
  /** 名前 */
  name: string;
  /** 説明 */
  description?: string;
  /** 画像URL */
  image?: string;
  /** 職種 */
  jobTitle?: string;
  /** スキル */
  skills?: string[];
  /** URL */
  url?: string;
}

/**
 * SEOメタデータの型
 */
export interface SEOMetadata {
  /** ページタイトル */
  title: string;
  /** メタディスクリプション */
  description: string;
  /** Open Graphメタデータ */
  openGraph: OpenGraphMetadata;
  /** 構造化データ（JSON-LD） */
  structuredData: StructuredData;
}
