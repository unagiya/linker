/**
 * SEOメタデータ生成ユーティリティ
 */

import type { Profile } from '../types/profile';
import type { SEOMetadata, OpenGraphMetadata, StructuredData } from '../types/seo';

/**
 * プロフィールからページタイトルを生成
 * 
 * @param profile - プロフィール情報
 * @returns ページタイトル（「{名前} | Linker」形式）
 */
export function generatePageTitle(profile: Profile): string {
  return `${profile.name} | Linker`;
}

/**
 * プロフィールからメタディスクリプションを生成
 * 
 * @param profile - プロフィール情報
 * @returns メタディスクリプション
 */
export function generateMetaDescription(profile: Profile): string {
  const parts: string[] = [];
  
  // 名前と職種
  parts.push(`${profile.name} - ${profile.jobTitle}`);
  
  // 経験年数
  if (profile.yearsOfExperience) {
    parts.push(`経験${profile.yearsOfExperience}年`);
  }
  
  // スキル（最大3つ）
  if (profile.skills.length > 0) {
    const skillsText = profile.skills.slice(0, 3).join(', ');
    parts.push(`スキル: ${skillsText}`);
  }
  
  // 自己紹介（最大100文字）
  if (profile.bio) {
    const bioText = profile.bio.length > 100 
      ? profile.bio.substring(0, 100) + '...' 
      : profile.bio;
    parts.push(bioText);
  }
  
  return parts.join(' | ');
}

/**
 * プロフィールからOpen Graphメタデータを生成
 * 
 * @param profile - プロフィール情報
 * @param currentUrl - 現在のページURL
 * @returns Open Graphメタデータ
 */
export function generateOpenGraphMetadata(
  profile: Profile,
  currentUrl: string
): OpenGraphMetadata {
  return {
    title: profile.name,
    description: generateMetaDescription(profile),
    url: currentUrl,
    type: 'profile',
    image: profile.imageUrl,
    siteName: 'Linker',
  };
}

/**
 * プロフィールから構造化データ（JSON-LD）を生成
 * 
 * @param profile - プロフィール情報
 * @param currentUrl - 現在のページURL
 * @returns 構造化データ
 */
export function generateStructuredData(
  profile: Profile,
  currentUrl: string
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    description: profile.bio,
    image: profile.imageUrl,
    jobTitle: profile.jobTitle,
    skills: profile.skills,
    url: currentUrl,
  };
}

/**
 * プロフィールから完全なSEOメタデータを生成
 * 
 * @param profile - プロフィール情報
 * @param currentUrl - 現在のページURL
 * @returns SEOメタデータ
 */
export function generateSEOMetadata(
  profile: Profile,
  currentUrl: string
): SEOMetadata {
  return {
    title: generatePageTitle(profile),
    description: generateMetaDescription(profile),
    openGraph: generateOpenGraphMetadata(profile, currentUrl),
    structuredData: generateStructuredData(profile, currentUrl),
  };
}
