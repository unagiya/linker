/**
 * ProfileCardコンポーネントのユニットテスト
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileCard } from './ProfileCard';
import type { Profile } from '../../types/profile';

describe('ProfileCard', () => {
  const mockProfile: Profile = {
    id: 'profile-1',
    user_id: 'user-1',
    name: '山田太郎',
    jobTitle: 'フロントエンドエンジニア',
    bio: 'Reactが得意です',
    skills: ['React', 'TypeScript', 'JavaScript'],
    yearsOfExperience: 5,
    socialLinks: [
      {
        id: 'link-1',
        service: 'github',
        url: 'https://github.com/test',
      },
      {
        id: 'link-2',
        service: 'twitter',
        url: 'https://twitter.com/test',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('プロフィール情報の表示', () => {
    it('名前と職種が表示される', () => {
      render(<ProfileCard profile={mockProfile} />);

      expect(screen.getByText('山田太郎')).toBeInTheDocument();
      expect(screen.getByText('フロントエンドエンジニア')).toBeInTheDocument();
    });

    it('自己紹介が表示される', () => {
      render(<ProfileCard profile={mockProfile} />);

      expect(screen.getByText('Reactが得意です')).toBeInTheDocument();
    });

    it('経験年数が表示される', () => {
      render(<ProfileCard profile={mockProfile} />);

      expect(screen.getByText('経験年数: 5年')).toBeInTheDocument();
    });

    it('スキルが表示される', () => {
      render(<ProfileCard profile={mockProfile} />);

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('自己紹介がない場合は表示されない', () => {
      const profileWithoutBio: Profile = {
        ...mockProfile,
        bio: undefined,
      };

      render(<ProfileCard profile={profileWithoutBio} />);

      expect(screen.queryByText('自己紹介')).not.toBeInTheDocument();
    });

    it('経験年数がない場合は表示されない', () => {
      const profileWithoutExperience: Profile = {
        ...mockProfile,
        yearsOfExperience: undefined,
      };

      render(<ProfileCard profile={profileWithoutExperience} />);

      expect(screen.queryByText(/経験年数:/)).not.toBeInTheDocument();
    });

    it('スキルがない場合は表示されない', () => {
      const profileWithoutSkills: Profile = {
        ...mockProfile,
        skills: [],
      };

      render(<ProfileCard profile={profileWithoutSkills} />);

      expect(screen.queryByText('スキル')).not.toBeInTheDocument();
    });
  });

  describe('SNSリンクの表示', () => {
    it('SNSリンクが表示される', () => {
      render(<ProfileCard profile={mockProfile} />);

      const githubLink = screen.getByLabelText('GitHubへのリンク');
      const twitterLink = screen.getByLabelText('Twitterへのリンク');

      expect(githubLink).toBeInTheDocument();
      expect(githubLink).toHaveAttribute('href', 'https://github.com/test');
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

      expect(twitterLink).toBeInTheDocument();
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/test');
    });

    it('SNSリンクがない場合は表示されない', () => {
      const profileWithoutLinks: Profile = {
        ...mockProfile,
        socialLinks: [],
      };

      render(<ProfileCard profile={profileWithoutLinks} />);

      expect(screen.queryByText('SNS・外部リンク')).not.toBeInTheDocument();
    });

    it('LinkedInのリンクが表示される', () => {
      const profileWithLinkedIn: Profile = {
        ...mockProfile,
        socialLinks: [
          {
            id: 'link-1',
            service: 'linkedin',
            url: 'https://linkedin.com/in/test',
          },
        ],
      };

      render(<ProfileCard profile={profileWithLinkedIn} />);

      const linkedinLink = screen.getByLabelText('LinkedInへのリンク');
      expect(linkedinLink).toBeInTheDocument();
      // SVGアイコンが含まれていることを確認
      expect(linkedinLink.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('ボタン表示制御（所有者判定）', () => {
    it('未認証ユーザーには編集・削除ボタンが表示されない', () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();

      render(
        <ProfileCard
          profile={mockProfile}
          currentUserId={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
    });

    it('他人のプロフィールには編集・削除ボタンが表示されない', () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();

      render(
        <ProfileCard
          profile={mockProfile}
          currentUserId="other-user"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
    });

    it('自分のプロフィールには編集・削除ボタンが表示される', () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();

      render(
        <ProfileCard
          profile={mockProfile}
          currentUserId="user-1"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    });

    it('onEditが指定されていない場合、編集ボタンは表示されない', () => {
      const mockOnDelete = vi.fn();

      render(<ProfileCard profile={mockProfile} currentUserId="user-1" onDelete={mockOnDelete} />);

      expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    });

    it('onDeleteが指定されていない場合、削除ボタンは表示されない', () => {
      const mockOnEdit = vi.fn();

      render(<ProfileCard profile={mockProfile} currentUserId="user-1" onEdit={mockOnEdit} />);

      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
    });
  });

  describe('ボタンのクリック', () => {
    it('編集ボタンをクリックするとonEditが呼ばれる', () => {
      const mockOnEdit = vi.fn();

      render(<ProfileCard profile={mockProfile} currentUserId="user-1" onEdit={mockOnEdit} />);

      const editButton = screen.getByRole('button', { name: '編集' });
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
      const mockOnDelete = vi.fn();

      render(<ProfileCard profile={mockProfile} currentUserId="user-1" onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole('button', { name: '削除' });
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('共有ボタンをクリックするとonShareが呼ばれる', () => {
      const mockOnShare = vi.fn();

      render(<ProfileCard profile={mockProfile} onShare={mockOnShare} />);

      const shareButton = screen.getByRole('button', { name: '共有' });
      fireEvent.click(shareButton);

      expect(mockOnShare).toHaveBeenCalledTimes(1);
    });

    it('onShareが指定されていない場合、共有ボタンは表示されない', () => {
      render(<ProfileCard profile={mockProfile} />);

      expect(screen.queryByRole('button', { name: '共有' })).not.toBeInTheDocument();
    });
  });

  describe('プロフィール画像の表示', () => {
    it('imageUrlがある場合、画像が表示される', () => {
      const profileWithImage: Profile = {
        ...mockProfile,
        imageUrl: 'https://example.com/image.jpg',
      };

      render(<ProfileCard profile={profileWithImage} />);

      const image = screen.getByAltText('山田太郎のプロフィール画像');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('imageUrlがない場合、デフォルトアバターが表示される', () => {
      render(<ProfileCard profile={mockProfile} />);

      expect(screen.getByLabelText('デフォルトアバター')).toBeInTheDocument();
    });
  });

  describe('SNSリンクアイコンの表示', () => {
    it('定義済みサービス（GitHub）は公式アイコンが表示される', () => {
      render(<ProfileCard profile={mockProfile} />);

      const githubLink = screen.getByLabelText('GitHubへのリンク');
      expect(githubLink).toBeInTheDocument();
      // SVGアイコンが含まれていることを確認
      expect(githubLink.querySelector('svg')).toBeInTheDocument();
    });

    it('定義済みサービス（Twitter）は公式アイコンが表示される', () => {
      render(<ProfileCard profile={mockProfile} />);

      const twitterLink = screen.getByLabelText('Twitterへのリンク');
      expect(twitterLink).toBeInTheDocument();
      // SVGアイコンが含まれていることを確認
      expect(twitterLink.querySelector('svg')).toBeInTheDocument();
    });

    it('カスタムサービスはサービス名が表示される', () => {
      const profileWithCustomService: Profile = {
        ...mockProfile,
        socialLinks: [
          {
            id: 'link-1',
            service: 'MyCustomService',
            url: 'https://example.com',
          },
        ],
      };

      const { container } = render(<ProfileCard profile={profileWithCustomService} />);

      // カスタムサービス名が表示されていることを確認
      const customServiceElement = container.querySelector('.profile-card-social-custom');
      expect(customServiceElement).toBeInTheDocument();
      expect(customServiceElement).toHaveTextContent('MyCustomService');
    });
  });
});
