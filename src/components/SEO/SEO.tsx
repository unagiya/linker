/**
 * SEOコンポーネント
 * ページタイトル、メタディスクリプション、Open Graphタグ、構造化データを動的に設定
 */

import { useEffect } from 'react';
import type { SEOMetadata } from '../../types/seo';

interface SEOProps {
  /** SEOメタデータ */
  metadata: SEOMetadata;
}

/**
 * SEOコンポーネント
 * 
 * プロフィールページのSEOメタデータを動的に設定します。
 * - ページタイトル
 * - メタディスクリプション
 * - Open Graphメタタグ
 * - 構造化データ（JSON-LD）
 */
export function SEO({ metadata }: SEOProps) {
  useEffect(() => {
    // ページタイトルの設定
    document.title = metadata.title;

    // メタディスクリプションの設定
    updateMetaTag('name', 'description', metadata.description);

    // Open Graphメタタグの設定
    updateMetaTag('property', 'og:title', metadata.openGraph.title);
    updateMetaTag('property', 'og:description', metadata.openGraph.description);
    updateMetaTag('property', 'og:url', metadata.openGraph.url);
    updateMetaTag('property', 'og:type', metadata.openGraph.type);
    updateMetaTag('property', 'og:site_name', metadata.openGraph.siteName);
    
    if (metadata.openGraph.image) {
      updateMetaTag('property', 'og:image', metadata.openGraph.image);
    }

    // Twitterカードメタタグの設定
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', metadata.openGraph.title);
    updateMetaTag('name', 'twitter:description', metadata.openGraph.description);
    
    if (metadata.openGraph.image) {
      updateMetaTag('name', 'twitter:image', metadata.openGraph.image);
    }

    // 構造化データ（JSON-LD）の設定
    updateStructuredData(metadata.structuredData);

    // クリーンアップ関数
    return () => {
      // デフォルトのタイトルに戻す
      document.title = 'Linker';
    };
  }, [metadata]);

  // このコンポーネントは何もレンダリングしない
  return null;
}

/**
 * メタタグを更新または作成
 * 
 * @param attributeName - 属性名（'name' または 'property'）
 * @param attributeValue - 属性値
 * @param content - コンテンツ
 */
function updateMetaTag(
  attributeName: 'name' | 'property',
  attributeValue: string,
  content: string
): void {
  // 既存のメタタグを検索
  let metaTag = document.querySelector(
    `meta[${attributeName}="${attributeValue}"]`
  ) as HTMLMetaElement | null;

  // メタタグが存在しない場合は作成
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attributeName, attributeValue);
    document.head.appendChild(metaTag);
  }

  // コンテンツを設定
  metaTag.setAttribute('content', content);
}

/**
 * 構造化データ（JSON-LD）を更新または作成
 * 
 * @param structuredData - 構造化データ
 */
function updateStructuredData(structuredData: object): void {
  // 既存の構造化データスクリプトを検索
  const existingScript = document.querySelector(
    'script[type="application/ld+json"]'
  );

  // 既存のスクリプトがあれば削除
  if (existingScript) {
    existingScript.remove();
  }

  // 新しいスクリプトタグを作成
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}
