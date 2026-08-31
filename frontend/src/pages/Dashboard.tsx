import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Kanban, Users, Calendar, ArrowRight, Zap, BarChart2 } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Modal } from '../components/ui/Modal';
import { Spinner, LoadingScreen } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { projectsApi } from '../api/projects';
import type { Project, ProjectCreate } from '../types';
import { formatDistanceToNow } from 'date-fns';

const PROJECT_COLORS = [
  '#0052CC', '#6554C0', '#00A3BF', '#36B37E',
  '#FF5630', '#FFAB00', '#00875A', '#253858',
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isCreateOpen = searchParams.get('create') === 'true';

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const [form, setForm] = useState<ProjectCreate>({
    name: '',
    key: '',
    description: '',
    board_type: 'scrum',
  });
  const [formError, setFormError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSearchParams({});
      navigate(`/projects/${project.id}/board`);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to create project');
    },
  });

  const openCreateModal = () => {
    setForm({ name: '', key: '', description: '', board_type: 'scrum' });
    setFormError('');
    setSearchParams({ create: 'true' });
  };

  const handleNameChange = (name: string) => {
    const key = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    setForm((f) => ({ ...f, name, key }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    createMutation.mutate(form);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Dashboard" />
        <main className="page-content">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Your Projects</h1>
              <p className="page-subtitle">
                {projects.length} project{projects.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <button id="create-project-btn" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              New Project
            </button>
          </div>

          {/* Stats row */}
          {projects.length > 0 && (
            <div className="stats-grid" style={{ marginBottom: 28 }}>
              <div className="stat-card">
                <div className="stat-card-icon blue"><Zap size={18} /></div>
                <span className="stat-card-label">Total Projects</span>
                <span className="stat-card-value">{projects.length}</span>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon green"><BarChart2 size={18} /></div>
                <span className="stat-card-label">Scrum Projects</span>
                <span className="stat-card-value">
                  {projects.filter((p) => p.board_type === 'scrum').length}
                </span>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon orange"><Kanban size={18} /></div>
                <span className="stat-card-label">Kanban Projects</span>
                <span className="stat-card-value">
                  {projects.filter((p) => p.board_type === 'kanban').length}
                </span>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon blue"><Users size={18} /></div>
                <span className="stat-card-label">Collaborators</span>
                <span className="stat-card-value">
                  {projects.reduce((acc, p) => acc + p.members.length, 0)}
                </span>
              </div>
            </div>
          )}

          {/* Projects grid */}
          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Create your first project to start tracking issues and sprints."
              action={
                <button className="btn btn-primary" onClick={openCreateModal}>
                  <Plus size={16} />
                  Create Project
                </button>
              }
            />
          ) : (
            <div className="projects-grid">
              {projects.map((project, i) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}/board`}
                  className="project-card"
                  id={`project-card-${project.id}`}
                >
                  <div className="project-card-header">
                    <div
                      className="project-icon"
                      style={{ background: PROJECT_COLORS[i % PROJECT_COLORS.length] }}
                    >
                      {project.key.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="project-name truncate">{project.name}</div>
                      <div className="project-key">{project.key}</div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--color-text-subtlest)', flexShrink: 0 }} />
                  </div>

                  {project.description && (
                    <p style={{
                      fontSize: 13,
                      color: 'var(--color-text-subtle)',
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {project.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-subtle)' }}>
                      {project.board_type === 'scrum' ? <Kanban size={12} /> : <Kanban size={12} />}
                      {project.board_type === 'scrum' ? 'Scrum' : 'Kanban'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-subtle)' }}>
                      <Users size={12} />
                      {project.members.length + 1} member{project.members.length !== 0 ? 's' : ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-subtle)', marginLeft: 'auto' }}>
                      <Calendar size={12} />
                      {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setSearchParams({})}
        title="Create new project"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSearchParams({})}>
              Cancel
            </button>
            <button
              id="create-project-confirm"
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Spinner size="sm" /> : 'Create Project'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formError && (
            <div style={{
              padding: '8px 12px',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
            }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              id="project-name-input"
              className="form-input"
              placeholder="e.g. My Awesome App"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Project Key *</label>
            <input
              id="project-key-input"
              className="form-input"
              placeholder="e.g. APP"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) })}
              required
            />
            <span className="form-error" style={{ color: 'var(--color-text-subtle)' }}>
              This prefix will appear in issue keys (e.g. {form.key || 'APP'}-1)
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="What's this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Board Type</label>
            <select
              id="project-board-type"
              className="form-select"
              value={form.board_type}
              onChange={(e) => setForm({ ...form, board_type: e.target.value as 'scrum' | 'kanban' })}
            >
              <option value="scrum">Scrum</option>
              <option value="kanban">Kanban</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
