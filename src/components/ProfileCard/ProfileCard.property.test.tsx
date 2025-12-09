/**
 * ProfileCardコンポーネントのプロパティベーステスト
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProfileCard } from './ProfileCard';
import type { Profile } from '../../types/profile';
import { PredefinedService } from '../../types/profile';

describe('ProfileCard - プロパティベーステスト', () => {
  /**
   * プロパティ47: 定義済みサービスの公式アイコン表示
   * 検証: 要件 6.5
   * 定義済みサービス（Twitter, GitHub, Facebook, LinkedIn）は公式アイコンが表示される
   */
  describe('プロパティ47: 定義済みサービスの公式アイコン表示', () => {
    const predefinedServices = [
      PredefinedService.TWITTER,
      PredefinedService.GITHUB,
      PredefinedService.FACEBOOK,
      PredefinedService.LINKEDIN,
    ];

    it.each(predefinedServices)(
      '定義済みサービス %s は公式SVGアイコンが表示される',
      (service) => {
        // 10回試行
        for (let i = 0; i < 10; i++) {
          const profile: Profile = {
            id: `profile-${i}`,
            user_id: `user-${i}`,
            name: `テストユーザー${i}`,
            jobTitle: 'エンジニア',
            skills: [],
            socialLinks: [
              {
                id: `link-${i}`,
                service,
                url: `https://example.com/${service}/${i}`,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const { container } = render(<ProfileCard profile={profile} />);

          // SVGアイコンが存在することを確認
          const socialLink = container.querySelector('.profile-card-social-link');
          expect(socialLink).toBeInTheDocument();

          const svgIcon = socialLink?.querySelector('svg');
          expect(svgIcon).toBeInTheDocument();
          expect(svgIcon).toHaveAttribute('width', '20');
          expect(svgIcon).toHaveAttribute('height', '20');

          // カスタムサービス名のテキストが表示されていないことを確認
          const customServiceText = container.querySelector('.profile-card-social-custom');
          expect(customServiceText).not.toBeInTheDocument();
        }
      }
    );
  });

  /**
   * プロパティ48: カスタムサービスのサービス名表示
   * 検証: 要件 6.6
   * カスタムサービスはサービス名がテキストで表示される
   */
  describe('プロパティ48: カスタムサービスのサービス名表示', () => {
    const customServices = [
      'MyCustomService',
      'AnotherService',
      'CustomPlatform',
      'PersonalWebsite',
      'Portfolio',
    ];

    it.each(customServices)('カスタムサービス %s はサービス名がテキストで表示される', (service) => {
      // 10回試行
      for (let i = 0; i < 10; i++) {
        const profile: Profile = {
          id: `profile-${i}`,
          user_id: `user-${i}`,
          name: `テストユーザー${i}`,
          jobTitle: 'エンジニア',
          skills: [],
          socialLinks: [
            {
              id: `link-${i}`,
              service,
              url: `https://example.com/${service}/${i}`,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const { container } = render(<ProfileCard profile={profile} />);

        // カスタムサービス名のテキストが表示されていることを確認
        const customServiceText = container.querySelector('.profile-card-social-custom');
        expect(customServiceText).toBeInTheDocument();
        expect(customServiceText).toHaveTextContent(service);

        // SVGアイコンが表示されていないことを確認（.profile-card-social-icon内のSVG）
        const iconContainer = container.querySelector('.profile-card-social-icon');
        expect(iconContainer).not.toBeInTheDocument();
      }
    });
  });
});
