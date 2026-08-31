import React from 'react';
import type { IssueType, IssuePriority, IssueStatus } from '../../types';

// ========================
// Type Badge
// ========================
interface TypeBadgeProps {
  type: IssueType;
}

const TYPE_ICONS: Record<IssueType, string> = {
  story: '📖',
  bug: '🐛',
  task: '✓',
  epic: '⚡',
  subtask: '↗',
};

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => (
  <span className={`badge badge-${type}`}>
    <span>{TYPE_ICONS[type]}</span>
    {type}
  </span>
);

// ========================
// Priority Badge
// ========================
interface PriorityBadgeProps {
  priority: IssuePriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{priority}</span>
);

// ========================
// Status Badge
// ========================
interface StatusBadgeProps {
  status: IssueStatus;
}

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
);

// ========================
// Generic Badge
// ========================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
  className?: string;
}

const VARIANT_CLASSES: Record<string, string> = {
  blue: 'badge-task',
  green: 'badge-story',
  red: 'badge-bug',
  orange: 'badge-medium',
  purple: 'badge-epic',
  gray: 'badge-backlog',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  className = '',
}) => (
  <span className={`badge ${VARIANT_CLASSES[variant]} ${className}`}>
    {children}
  </span>
);
