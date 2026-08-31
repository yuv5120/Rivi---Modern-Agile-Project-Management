import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Modal } from '../components/ui/Modal';
import { TypeBadge, PriorityBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Spinner, LoadingScreen } from '../components/ui/Spinner';
import { issuesApi } from '../api/issues';
import { projectsApi } from '../api/projects';
import { sprintsApi } from '../api/sprints';
import type {
  Issue,
  IssueStatus,
  IssueCreate,
  IssueType,
  IssuePriority,
  Project,
  Sprint,
} from '../types';
import { STATUS_LABELS } from '../types';

const COLUMNS: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

// ========================
// Draggable Issue Card
// ========================
interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
}

const SortableIssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="issue-card"
      onClick={onClick}
      id={`issue-card-${issue.id}`}
    >
      <div className="issue-card-header">
        <span className="issue-card-title">{issue.title}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        <TypeBadge type={issue.type} />
        <PriorityBadge priority={issue.priority} />
        {issue.labels.slice(0, 2).map((label) => (
          <span key={label} className="badge badge-backlog">{label}</span>
        ))}
      </div>
      <div className="issue-card-footer">
        <span className="issue-key">{issue.key}</span>
        <div className="issue-card-meta">
          {issue.story_points != null && (
            <span style={{
              fontSize: 11,
              background: 'var(--color-primary-lightest)',
              color: 'var(--color-primary)',
              borderRadius: '50%',
              width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700,
            }}>
              {issue.story_points}
            </span>
          )}
          {issue.assignee_username && (
            <Avatar username={issue.assignee_username} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
};

// ========================
// Droppable Column
// ========================
interface ColumnProps {
  status: IssueStatus;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onAddIssue: (status: IssueStatus) => void;
}

const BoardColumn: React.FC<ColumnProps> = ({ status, issues, onIssueClick, onAddIssue }) => {
  return (
    <div className="board-column">
      <div className="board-column-header">
        <span className="board-column-title">{STATUS_LABELS[status]}</span>
        <span className="board-column-count">{issues.length}</span>
      </div>
      <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="board-column-body">
          {issues.map((issue) => (
            <SortableIssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick(issue)}
            />
          ))}
          <button
            className="btn btn-ghost btn-sm"
            style={{ justifyContent: 'flex-start', color: 'var(--color-text-subtle)', marginTop: 4 }}
            onClick={() => onAddIssue(status)}
          >
            <Plus size={14} /> Add issue
          </button>
        </div>
      </SortableContext>
    </div>
  );
};

// ========================
// Quick Create Issue Form
// ========================
interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultStatus: IssueStatus;
  activeSprint?: Sprint | null;
  onCreate: () => void;
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen, onClose, projectId, defaultStatus, activeSprint, onCreate,
}) => {
  const [form, setForm] = useState<IssueCreate>({
    title: '',
    type: 'task',
    priority: 'medium',
    status: defaultStatus,
    project_id: projectId,
    sprint_id: activeSprint?.id,
    story_points: undefined,
    labels: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await issuesApi.create(projectId, { ...form, status: defaultStatus });
      onCreate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Issue"
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            id="create-issue-confirm"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Create Issue'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '8px 12px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            id="issue-title-input"
            className="form-input"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            autoFocus
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as IssueType })}
            >
              <option value="task">Task</option>
              <option value="story">Story</option>
              <option value="bug">Bug</option>
              <option value="epic">Epic</option>
              <option value="subtask">Subtask</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as IssuePriority })}
            >
              <option value="highest">Highest</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="lowest">Lowest</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Story Points</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            min={0}
            max={100}
            value={form.story_points ?? ''}
            onChange={(e) => setForm({ ...form, story_points: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="Add a description..."
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
};

// ========================
// Board Page
// ========================
export const ProjectBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<IssueStatus>('todo');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  const { data: sprints = [] } = useQuery<Sprint[]>({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintsApi.list(projectId!),
    enabled: !!projectId,
  });

  const activeSprint = sprints.find((s) => s.status === 'active') || null;

  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: ['issues', projectId, 'board', activeSprint?.id],
    queryFn: () =>
      issuesApi.list(projectId!, activeSprint ? { sprint_id: activeSprint.id } : { status: 'todo' }),
    enabled: !!projectId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: IssueStatus }) =>
      issuesApi.updateStatus(issueId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
    },
  });

  const issuesByColumn = COLUMNS.reduce((acc, status) => {
    acc[status] = issues.filter((i) => i.status === status);
    return acc;
  }, {} as Record<IssueStatus, Issue[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const issue = issues.find((i) => i.id === event.active.id);
    setActiveIssue(issue || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    // Determine target column from droppable id or issue id
    const overId = String(over.id);
    const targetIssue = issues.find((i) => i.id === overId);
    const targetStatus = COLUMNS.includes(overId as IssueStatus)
      ? (overId as IssueStatus)
      : targetIssue?.status;

    const sourceIssue = issues.find((i) => i.id === String(active.id));
    if (sourceIssue && targetStatus && sourceIssue.status !== targetStatus) {
      updateStatusMutation.mutate({ issueId: sourceIssue.id, status: targetStatus });
    }
  };

  const handleAddIssue = (status: IssueStatus) => {
    setCreateStatus(status);
    setCreateModalOpen(true);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar
          breadcrumb={[
            { label: project?.name || 'Project' },
            { label: 'Board' },
          ]}
          actions={
            <button
              id="board-create-issue"
              className="btn btn-primary btn-sm"
              onClick={() => handleAddIssue('todo')}
            >
              <Plus size={14} /> Create
            </button>
          }
        />

        <main className="page-content" style={{ paddingTop: 16 }}>
          {/* Sprint banner */}
          {activeSprint && (
            <div style={{
              background: 'var(--color-primary-lightest)',
              border: '1px solid var(--color-primary-lighter)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
            }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                🏃 Active Sprint: {activeSprint.name}
              </span>
              {activeSprint.goal && (
                <span style={{ color: 'var(--color-text-subtle)' }}>
                  Goal: {activeSprint.goal}
                </span>
              )}
            </div>
          )}

          {!activeSprint && (
            <div style={{
              background: 'var(--color-warning-bg)',
              border: '1px solid rgba(255,171,0,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              marginBottom: 16,
              fontSize: 13,
              color: '#7a4f00',
            }}>
              No active sprint. Go to <strong
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate(`/projects/${projectId}/backlog`)}
              >Backlog</strong> to start a sprint.
            </div>
          )}

          {/* Kanban Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="board-layout">
              {COLUMNS.map((status) => (
                <BoardColumn
                  key={status}
                  status={status}
                  issues={issuesByColumn[status] || []}
                  onIssueClick={(issue) => navigate(`/issues/${issue.id}`)}
                  onAddIssue={handleAddIssue}
                />
              ))}
            </div>

            <DragOverlay>
              {activeIssue && (
                <div className="issue-card" style={{ opacity: 0.9, boxShadow: 'var(--shadow-xl)', cursor: 'grabbing' }}>
                  <div className="issue-card-title">{activeIssue.title}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    <TypeBadge type={activeIssue.type} />
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </main>
      </div>

      <CreateIssueModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId!}
        defaultStatus={createStatus}
        activeSprint={activeSprint}
        onCreate={() => queryClient.invalidateQueries({ queryKey: ['issues', projectId] })}
      />
    </div>
  );
};
