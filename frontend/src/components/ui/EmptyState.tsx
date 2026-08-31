import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
}) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      {icon || <Inbox size={28} />}
    </div>
    <h3 className="empty-state-title">{title}</h3>
    {description && <p className="empty-state-text">{description}</p>}
    {action}
  </div>
);
