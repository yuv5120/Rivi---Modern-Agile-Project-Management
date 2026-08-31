import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronRight, Play, CheckCircle } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Modal } from '../components/ui/Modal';
import { TypeBadge, PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Spinner, LoadingScreen } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { issuesApi } from '../api/issues';
import { sprintsApi } from '../api/sprints';
import { projectsApi } from '../api/projects';
import type { Issue, Sprint, Project, IssueCreate, IssueType, IssuePriority, SprintCreate } from '../types';

export const Backlog: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set(['backlog']));
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueType, setNewIssueType] = useState<IssueType>('task');
  const [newIssuePriority, setNewIssuePriority] = useState<IssuePriority>('medium');
  const [sprintForm, setSprintForm] = useState<SprintCreate>({ name: '', project_id: projectId!, goal: '' });



  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  const { data: sprints = [], isLoading: sprintsLoading } = useQuery<Sprint[]>({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintsApi.list(projectId!),
    enabled: !!projectId,
  });

  const { data: allIssues = [], isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ['issues', projectId, 'all'],
    queryFn: () => issuesApi.list(projectId!),
    enabled: !!projectId,
  });

  const backlogIssues = allIssues.filter((i) => !i.sprint_id || i.status === 'backlog');

  const createIssueMutation = useMutation({
    mutationFn: (data: IssueCreate) => issuesApi.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      setNewIssueTitle('');
      setCreateIssueOpen(false);
    },
  });

  const createSprintMutation = useMutation({
    mutationFn: (data: SprintCreate) => sprintsApi.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      setCreateSprintOpen(false);
      setSprintForm({ name: '', project_id: projectId!, goal: '' });
    },
  });

  const startSprintMutation = useMutation({
    mutationFn: (sprintId: string) => sprintsApi.start(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });

  const completeSprintMutation = useMutation({
    mutationFn: (sprintId: string) => sprintsApi.complete(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
    },
  });

  const addToSprintMutation = useMutation({
    mutationFn: ({ sprintId, issueId }: { sprintId: string; issueId: string }) =>
      sprintsApi.addIssue(sprintId, issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });

  const toggleSprint = (id: string) => {
    setExpandedSprints((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getSprintIssues = (sprint: Sprint) =>
    allIssues.filter((i) => i.sprint_id === sprint.id);

  if (issuesLoading || sprintsLoading) return <LoadingScreen />;

  const activeSprint = sprints.find((s) => s.status === 'active');

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar
          breadcrumb={[
            { label: project?.name || 'Project' },
            { label: 'Backlog' },
          ]}
          actions={
            <button
              id="create-sprint-btn"
              className="btn btn-secondary btn-sm"
              onClick={() => setCreateSprintOpen(true)}
            >
              <Plus size={14} /> Sprint
            </button>
          }
        />

        <main className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Backlog</h1>
              <p className="page-subtitle">{allIssues.length} issues total</p>
            </div>
            <button
              id="backlog-create-issue"
              className="btn btn-primary"
              onClick={() => setCreateIssueOpen(true)}
            >
              <Plus size={16} /> Create Issue
            </button>
          </div>

          <div className="backlog-layout">
            {/* Sprint sections */}
            {sprints
              .filter((s) => s.status !== 'completed')
              .map((sprint) => {
                const sprintIssues = getSprintIssues(sprint);
                const expanded = expandedSprints.has(sprint.id);
                return (
                  <div key={sprint.id} className="sprint-section">
                    <div className="sprint-section-header" onClick={() => toggleSprint(sprint.id)}>
                      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="sprint-section-title">{sprint.name}</span>
                      {sprint.status === 'active' && (
                        <span className="badge badge-in_progress" style={{ fontSize: 10 }}>ACTIVE</span>
                      )}
                      {sprint.status === 'planning' && (
                        <span className="badge badge-backlog" style={{ fontSize: 10 }}>PLANNING</span>
                      )}
                      <span className="sprint-section-meta">{sprintIssues.length} issues</span>

                      {/* Sprint actions */}
                      <div style={{ display: 'flex', gap: 6, marginLeft: 8 }} onClick={(e) => e.stopPropagation()}>
                        {sprint.status === 'planning' && sprintIssues.length > 0 && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!!activeSprint}
                            onClick={() => startSprintMutation.mutate(sprint.id)}
                          >
                            <Play size={12} /> Start Sprint
                          </button>
                        )}
                        {sprint.status === 'active' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => completeSprintMutation.mutate(sprint.id)}
                          >
                            <CheckCircle size={12} /> Complete Sprint
                          </button>
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <>
                        {sprintIssues.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: 13 }}>
                            No issues in this sprint. Drag issues from backlog or add new ones.
                          </div>
                        ) : (
                          sprintIssues.map((issue) => (
                            <div
                              key={issue.id}
                              className="backlog-issue-row"
                              onClick={() => navigate(`/issues/${issue.id}`)}
                              id={`backlog-issue-${issue.id}`}
                            >
                              <TypeBadge type={issue.type} />
                              <span className="issue-key">{issue.key}</span>
                              <span className="backlog-issue-title">{issue.title}</span>
                              <PriorityBadge priority={issue.priority} />
                              <StatusBadge status={issue.status} />
                              {issue.story_points != null && (
                                <span style={{
                                  fontSize: 11, background: 'var(--color-primary-lightest)', color: 'var(--color-primary)',
                                  borderRadius: '50%', width: 20, height: 20, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0,
                                }}>
                                  {issue.story_points}
                                </span>
                              )}
                              {issue.assignee_username && (
                                <Avatar username={issue.assignee_username} size="sm" />
                              )}
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                );
              })}

            {/* Backlog section */}
            <div className="sprint-section">
              <div className="sprint-section-header" onClick={() => toggleSprint('backlog')}>
                {expandedSprints.has('backlog') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="sprint-section-title">Backlog</span>
                <span className="sprint-section-meta">{backlogIssues.filter(i => i.status === 'backlog').length} issues</span>
              </div>

              {expandedSprints.has('backlog') && (
                <>
                  {backlogIssues.filter(i => i.status === 'backlog').length === 0 ? (
                    <EmptyState
                      title="Backlog is empty"
                      description="Create issues to add to the backlog"
                    />
                  ) : (
                    backlogIssues.filter(i => i.status === 'backlog').map((issue) => (
                      <div
                        key={issue.id}
                        className="backlog-issue-row"
                        onClick={() => navigate(`/issues/${issue.id}`)}
                        id={`backlog-issue-${issue.id}`}
                      >
                        <TypeBadge type={issue.type} />
                        <span className="issue-key">{issue.key}</span>
                        <span className="backlog-issue-title">{issue.title}</span>
                        <PriorityBadge priority={issue.priority} />
                        {issue.assignee_username && (
                          <Avatar username={issue.assignee_username} size="sm" />
                        )}

                        {/* Add to sprint dropdown */}
                        {sprints.filter(s => s.status !== 'completed').length > 0 && (
                          <select
                            className="form-select"
                            style={{ width: 'auto', padding: '3px 8px', fontSize: 12 }}
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                addToSprintMutation.mutate({ sprintId: e.target.value, issueId: issue.id });
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Move to sprint...</option>
                            {sprints.filter(s => s.status !== 'completed').map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))
                  )}

                  {/* Inline add issue */}
                  <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-text-subtle)' }}
                      onClick={() => setCreateIssueOpen(true)}
                    >
                      <Plus size={14} /> Create issue
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Issue Modal */}
      <Modal
        isOpen={createIssueOpen}
        onClose={() => setCreateIssueOpen(false)}
        title="Create Issue"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateIssueOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() =>
                createIssueMutation.mutate({
                  title: newIssueTitle,
                  type: newIssueType,
                  priority: newIssuePriority,
                  status: 'backlog',
                  project_id: projectId!,
                })
              }
              disabled={!newIssueTitle || createIssueMutation.isPending}
            >
              {createIssueMutation.isPending ? <Spinner size="sm" /> : 'Create'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              placeholder="What needs to be done?"
              value={newIssueTitle}
              onChange={(e) => setNewIssueTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={newIssueType} onChange={(e) => setNewIssueType(e.target.value as IssueType)}>
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="epic">Epic</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={newIssuePriority} onChange={(e) => setNewIssuePriority(e.target.value as IssuePriority)}>
                <option value="highest">Highest</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="lowest">Lowest</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create Sprint Modal */}
      <Modal
        isOpen={createSprintOpen}
        onClose={() => setCreateSprintOpen(false)}
        title="Create Sprint"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateSprintOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => createSprintMutation.mutate({ ...sprintForm, project_id: projectId! })}
              disabled={!sprintForm.name || createSprintMutation.isPending}
            >
              {createSprintMutation.isPending ? <Spinner size="sm" /> : 'Create Sprint'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Sprint Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Sprint 1"
              value={sprintForm.name}
              onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Sprint Goal</label>
            <textarea
              className="form-textarea"
              placeholder="What do you want to achieve in this sprint?"
              value={sprintForm.goal || ''}
              onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
              rows={2}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={sprintForm.start_date ? sprintForm.start_date.slice(0, 10) : ''}
                onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={sprintForm.end_date ? sprintForm.end_date.slice(0, 10) : ''}
                onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
