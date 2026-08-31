import React from 'react';

interface AvatarProps {
  username?: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const COLORS = [
  '#0052CC', '#6554C0', '#00A3BF', '#36B37E',
  '#FF5630', '#FF7452', '#FFAB00', '#6B778C',
];

function getColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  username = '',
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`avatar avatar-${size} ${className}`}
      />
    );
  }

  const initials = username.slice(0, 2).toUpperCase();
  const bg = getColor(username);

  return (
    <div
      className={`avatar-placeholder avatar-${size} ${className}`}
      style={{ background: bg }}
      title={username}
    >
      {initials}
    </div>
  );
};
