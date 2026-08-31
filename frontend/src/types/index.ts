// ========================
// Core Types
// ========================

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: 'member' | 'admin';
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ========================
// Project
// ========================

export type BoardType = 'kanban' | 'scrum';

export interface ProjectMember {
  user_id: string;
  username: string;
  role: 'member' | 'admin' | 'viewer';
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  board_type: BoardType;
  icon?: string;
  owner_id: string;
  members: ProjectMember[];
  issue_counter: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  key: string;
  description?: string;
  board_type?: BoardType;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  board_type?: BoardType;
}

// ========================
// Issue
// ========================

export type IssueType = 'story' | 'bug' | 'task' | 'epic' | 'subtask';
export type IssuePriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Issue {
  id: string;
  key: string;
  title: string;
  description?: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  story_points?: number;
  labels: string[];
  assignee_id?: string;
  assignee_username?: string;
  reporter_id: string;
  reporter_username?: string;
  project_id: string;
  sprint_id?: string;
  parent_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface IssueCreate {
  title: string;
  description?: string;
  type?: IssueType;
  priority?: IssuePriority;
  status?: IssueStatus;
  story_points?: number;
  labels?: string[];
  assignee_id?: string;
  parent_id?: string;
  due_date?: string;
  project_id: string;
  sprint_id?: string;
}

export interface IssueUpdate {
  title?: string;
  description?: string;
  type?: IssueType;
  priority?: IssuePriority;
  status?: IssueStatus;
  story_points?: number;
  labels?: string[];
  assignee_id?: string;
  sprint_id?: string;
  parent_id?: string;
  due_date?: string;
}

export interface IssueFilters {
  status?: IssueStatus;
  assignee_id?: string;
  sprint_id?: string;
  label?: string;
  type?: IssueType;
  priority?: IssuePriority;
}

// ========================
// Sprint
// ========================

export type SprintStatus = 'planning' | 'active' | 'completed';

export interface Sprint {
  id: string;
  name: string;
  project_id: string;
  status: SprintStatus;
  goal?: string;
  start_date?: string;
  end_date?: string;
  issue_ids: string[];
  completed_issue_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface SprintCreate {
  name: string;
  project_id: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
}

// ========================
// Comment
// ========================

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  author_username?: string;
  author_avatar?: string;
  body: string;
  created_at: string;
  updated_at: string;
}

// ========================
// Workflow
// ========================

export type WorkflowTrigger =
  | 'issue_created'
  | 'issue_status_changed'
  | 'issue_assigned'
  | 'sprint_started'
  | 'sprint_completed';

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface WorkflowAction {
  type: string;
  params: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  project_id: string;
  name: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  created_at: string;
}

// ========================
// Reports
// ========================

export interface ProjectSummary {
  total_issues: number;
  done: number;
  in_progress: number;
  backlog: number;
  todo: number;
  bugs: number;
  completion_percentage: number;
  active_sprint?: Sprint;
}

export interface VelocityDataPoint {
  sprint_name: string;
  sprint_id: string;
  completed_issues: number;
  story_points: number;
  start_date?: string;
  end_date?: string;
}

export interface VelocityReport {
  velocity_data: VelocityDataPoint[];
  average_velocity: number;
}

export interface BurndownReport {
  sprint?: Sprint;
  total_story_points: number;
  completed_story_points: number;
  remaining_story_points: number;
  issue_count: number;
  done_count: number;
}

// ========================
// UI Helpers
// ========================

export const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export const BOARD_COLUMNS: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  highest: 'Highest',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  lowest: 'Lowest',
};

export const TYPE_LABELS: Record<IssueType, string> = {
  story: 'Story',
  bug: 'Bug',
  task: 'Task',
  epic: 'Epic',
  subtask: 'Subtask',
};
