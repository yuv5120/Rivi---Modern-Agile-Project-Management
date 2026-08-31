import React, { useState } from 'react';
import { Bell, Search, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../ui/Avatar';

interface TopbarProps {
  title?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({ title, breadcrumb, actions }) => {
  const { user } = useAuthStore();
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Breadcrumb or title */}
        {breadcrumb ? (
          <div className="topbar-breadcrumb">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ opacity: 0.5 }}>/</span>}
                <span style={{ opacity: i === breadcrumb.length - 1 ? 1 : 0.7 }}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{title}</span>
        )}
      </div>

      {/* Search */}
      <div className="topbar-search">
        <Search size={14} />
        <input
          placeholder="Search issues, projects..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Help">
          <HelpCircle size={16} />
        </button>
        <button className="topbar-icon-btn" title="Notifications">
          <Bell size={16} />
        </button>
        <Avatar
          username={user?.username || ''}
          avatarUrl={user?.avatar_url}
          size="sm"
        />
        {actions}
      </div>
    </header>
  );
};
