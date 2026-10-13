import React from 'react';

export const BADGE_URLS = {
  badge1: '/spark/app/app_17cteejgcjt/runtime/api/v1/storage/object/bucket_aadkruh7jsqgo_static/static%2Faadks7vzhzgiu_ve_miaoda',
  badge2: '/spark/app/app_17cteejgcjt/runtime/api/v1/storage/object/bucket_aadkruh7jsqgo_static/static%2Faadks7ykbp6fs_ve_miaoda',
  badge3: 'https://picsum.photos/seed/badge3-violettrophy/200/200',
};

interface AppBadgeProps {
  variant?: 'badge1' | 'badge2' | 'badge3';
  size?: number;
  className?: string;
  rounded?: boolean;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  variant = 'badge1',
  size = 40,
  className = '',
  rounded = false,
}) => {
  const url = BADGE_URLS[variant];
  return (
    <img
      src={url}
      alt=""
      className={`object-contain ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
};

export const getLevelBadge = (level: string): 'badge2' => {
  return 'badge2';
};

export const getCategoryCoverBadge = (category: string): 'badge1' => {
  return 'badge1';
};
