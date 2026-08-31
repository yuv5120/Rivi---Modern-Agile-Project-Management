import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Trash2, Save, X } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { TypeBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Spinner, LoadingScreen } from '../components/ui/Spinner';
import { issuesApi } from '../api/issues';
import { commentsApi } from '../api/comments';

import { useAuthStore } from '../store/authStore';
import type {
  Issue, Comment, IssueUpdate, IssueStatus, IssueType, IssuePriority,
} from '../types';
import { formatDistanceToNow, format } from 'date-fns';

export const IssueDetail: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  const { data: issue, isLoading } = useQuery<Issue>({
    queryKey: ['issue', issueId],
    queryFn: () => issuesApi.get(issueId!),
    enabled: !!issueId,
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['comments', issueId],
    queryFn: () => commentsApi.list(issueId!),
    enabled: !!issueId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: IssueUpdate) => issuesApi.update(issueId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setEditingTitle(false);
      setEditingDescription(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => issuesApi.delete(issueId!),
    onSuccess: () => {
      navigate(-1);
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (body: string) => commentsApi.create(issueId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
      setCommentText('');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      commentsApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
      setEditingComment(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) => commentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
    },
  });

  if (isLoading || !issue) return <LoadingScreen />;

  const startEditTitle = () => {
    setTitleValue(issue.title);
    setEditingTitle(true);
  };

  const startEditDesc = () => {
    setDescValue(issue.description || '');
    setEditingDescription(true);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar
          breadcrumb={[
            { label: 'Project' },
            { label: issue.key },
          ]}
        />

        <main className="page-content">
          {/* Back button */}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 16 }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="issue-detail-layout">
            {/* Main content */}
            <div className="issue-detail-main">
              {/* Type + Key row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TypeBadge type={issue.type} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-subtle)' }}>
                  {issue.key}
                </span>
              </div>

              {/* Title */}
              {editingTitle ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <input
                    className="form-input"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    style={{ fontSize: 18, fontWeight: 600 }}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => updateMutation.mutate({ title: titleValue })}
                  >
                    <Save size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingTitle(false)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <h1
                  className="issue-detail-title"
                  onClick={startEditTitle}
                  id="issue-title"
                >
                  {issue.title}
                  <Edit2 size={14} style={{ marginLeft: 8, opacity: 0.4, display: 'inline' }} />
                </h1>
              )}

              {/* Description */}
              <div className="card">
                <div className="card-body">
                  <div className="issue-detail-section-title">Description</div>
                  {editingDescription ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        className="form-textarea"
                        value={descValue}
                        onChange={(e) => setDescValue(e.target.value)}
                        rows={6}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateMutation.mutate({ description: descValue })}
                        >
                          Save
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingDescription(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={startEditDesc}
                      style={{
                        minHeight: 60,
                        fontSize: 14,
                        color: issue.description ? 'var(--color-text)' : 'var(--color-text-subtlest)',
                        lineHeight: 1.7,
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid transparent',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                    >
                      {issue.description || 'Click to add a description...'}
                    </div>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Comments ({comments.length})</span>
                </div>
                <div className="card-body">
                  {/* Add comment */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <Avatar username={user?.username || ''} size="md" />
                    <div style={{ flex: 1 }}>
                      <textarea
                        className="form-textarea"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={2}
                      />
                      {commentText && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => addCommentMutation.mutate(commentText)}
                            disabled={addCommentMutation.isPending}
                          >
                            {addCommentMutation.isPending ? <Spinner size="sm" /> : 'Save'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setCommentText('')}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment list */}
                  {comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <Avatar username={comment.author_username || ''} avatarUrl={comment.author_avatar} size="md" />
                      <div className="comment-content">
                        <div className="comment-header">
                          <span className="comment-author">{comment.author_username}</span>
                          <span className="comment-time">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                          {comment.author_id === user?.id && (
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 6px' }}
                                onClick={() => {
                                  setEditingComment(comment.id);
                                  setEditCommentText(comment.body);
                                }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 6px', color: 'var(--color-danger)' }}
                                onClick={() => deleteCommentMutation.mutate(comment.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        {editingComment === comment.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <textarea
                              className="form-textarea"
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              rows={2}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => updateCommentMutation.mutate({ id: comment.id, body: editCommentText })}
                              >
                                Save
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingComment(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="comment-body">{comment.body}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <p style={{ color: 'var(--color-text-subtle)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar fields */}
            <div className="issue-detail-sidebar">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Details</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => {
                      if (confirm('Delete this issue?')) deleteMutation.mutate();
                    }}
                    title="Delete issue"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="card-body" style={{ padding: '12px 16px' }}>
                  {/* Status */}
                  <div className="field-row">
                    <span className="field-label">Status</span>
                    <select
                      className="form-select"
                      value={issue.status}
                      onChange={(e) =>
                        updateMutation.mutate({ status: e.target.value as IssueStatus })
                      }
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="field-row">
                    <span className="field-label">Priority</span>
                    <select
                      className="form-select"
                      value={issue.priority}
                      onChange={(e) =>
                        updateMutation.mutate({ priority: e.target.value as IssuePriority })
                      }
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      <option value="highest">Highest</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="lowest">Lowest</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div className="field-row">
                    <span className="field-label">Type</span>
                    <select
                      className="form-select"
                      value={issue.type}
                      onChange={(e) =>
                        updateMutation.mutate({ type: e.target.value as IssueType })
                      }
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      <option value="task">Task</option>
                      <option value="story">Story</option>
                      <option value="bug">Bug</option>
                      <option value="epic">Epic</option>
                      <option value="subtask">Subtask</option>
                    </select>
                  </div>

                  {/* Story Points */}
                  <div className="field-row">
                    <span className="field-label">Points</span>
                    <input
                      type="number"
                      className="form-input"
                      value={issue.story_points ?? ''}
                      onChange={(e) =>
                        updateMutation.mutate({
                          story_points: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      min={0}
                      max={100}
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    />
                  </div>

                  {/* Reporter */}
                  <div className="field-row">
                    <span className="field-label">Reporter</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar username={issue.reporter_username || ''} size="sm" />
                      <span style={{ fontSize: 12 }}>{issue.reporter_username}</span>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="field-row">
                    <span className="field-label">Assignee</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {issue.assignee_username ? (
                        <>
                          <Avatar username={issue.assignee_username} size="sm" />
                          <span style={{ fontSize: 12 }}>{issue.assignee_username}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Created */}
                  <div className="field-row">
                    <span className="field-label">Created</span>
                    <span style={{ fontSize: 12 }}>
                      {format(new Date(issue.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>

                  {/* Updated */}
                  <div className="field-row">
                    <span className="field-label">Updated</span>
                    <span style={{ fontSize: 12 }}>
                      {formatDistanceToNow(new Date(issue.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Labels */}
              {issue.labels.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Labels</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {issue.labels.map((label) => (
                      <span key={label} className="badge badge-task">{label}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
