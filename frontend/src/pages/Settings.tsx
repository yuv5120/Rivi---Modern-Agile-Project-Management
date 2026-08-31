import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, UserPlus, Trash2, Zap, Plus } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Avatar } from '../components/ui/Avatar';
import { Spinner, LoadingScreen } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { projectsApi } from '../api/projects';
import { workflowsApi } from '../api/workflows';
import { useAuthStore } from '../store/authStore';
import type { Project, ProjectUpdate, Workflow } from '../types';

export const Settings: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'automations'>('general');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ['workflows', projectId],
    queryFn: () => workflowsApi.list(projectId!),
    enabled: !!projectId && activeTab === 'automations',
  });

  const [form, setForm] = useState<ProjectUpdate>({});

  React.useEffect(() => {
    if (project) {
      setForm({ name: project.name, description: project.description, board_type: project.board_type });
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data: ProjectUpdate) => projectsApi.update(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: () => projectsApi.addMember(projectId!, newMemberUsername, newMemberRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setAddMemberOpen(false);
      setNewMemberUsername('');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  if (isLoading || !project) return <LoadingScreen />;

  const isOwner = project.owner_id === user?.id;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar
          breadcrumb={[
            { label: project.name },
            { label: 'Settings' },
          ]}
        />

        <main className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Project Settings</h1>
              <p className="page-subtitle">{project.key} · {project.board_type} board</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {(['general', 'members', 'automations'] as const).map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                id={`settings-tab-${tab}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="card" style={{ maxWidth: 600 }}>
              <div className="card-header">
                <span className="card-title">General Settings</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input
                    className="form-input"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={!isOwner}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    disabled={!isOwner}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Board Type</label>
                  <select
                    className="form-select"
                    value={form.board_type || 'scrum'}
                    onChange={(e) => setForm({ ...form, board_type: e.target.value as 'scrum' | 'kanban' })}
                    disabled={!isOwner}
                  >
                    <option value="scrum">Scrum</option>
                    <option value="kanban">Kanban</option>
                  </select>
                </div>
                {isOwner && (
                  <button
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => updateMutation.mutate(form)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Spinner size="sm" /> : <><Save size={14} /> Save Changes</>}
                  </button>
                )}
                {updateMutation.isSuccess && (
                  <span style={{ fontSize: 13, color: 'var(--color-success)' }}>✓ Changes saved</span>
                )}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Team Members ({project.members.length + 1})</span>
                {isOwner && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setAddMemberOpen(true)}
                    id="add-member-btn"
                  >
                    <UserPlus size={14} /> Add Member
                  </button>
                )}
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {/* Owner row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', borderBottom: '1px solid var(--color-border-subtle)',
                }}>
                  <Avatar username={user?.username || ''} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{user?.email}</div>
                  </div>
                  <span className="badge badge-epic">Owner</span>
                </div>

                {project.members.map((member) => (
                  <div
                    key={member.user_id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px', borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <Avatar username={member.username} size="md" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{member.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{member.role}</div>
                    </div>
                    <span className={`badge badge-${member.role === 'admin' ? 'in_progress' : 'todo'}`}>
                      {member.role}
                    </span>
                    {isOwner && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => removeMemberMutation.mutate(member.user_id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {project.members.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: 13 }}>
                    No team members yet. Add collaborators to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Automations Tab */}
          {activeTab === 'automations' && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Automation Rules</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
                    {workflows.filter(w => w.enabled).length} active
                  </span>
                  <button className="btn btn-primary btn-sm">
                    <Plus size={14} /> Create Rule
                  </button>
                </div>
              </div>
              <div className="card-body">
                {workflows.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: 40,
                    background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)',
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No automation rules yet</div>
                    <p style={{ fontSize: 13, color: 'var(--color-text-subtle)', maxWidth: 320, margin: '0 auto 16px' }}>
                      Automate repetitive tasks like changing issue status, assigning team members, or sending notifications.
                    </p>
                    <button className="btn btn-primary btn-sm">
                      <Zap size={14} /> Create your first rule
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {workflows.map((wf) => (
                      <div key={wf.id} style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{wf.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
                            Trigger: {wf.trigger.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <span className={`badge ${wf.enabled ? 'badge-done' : 'badge-backlog'}`}>
                          {wf.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        title="Add Team Member"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddMemberOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => addMemberMutation.mutate()}
              disabled={!newMemberUsername || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? <Spinner size="sm" /> : 'Add Member'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              placeholder="Enter exact username"
              value={newMemberUsername}
              onChange={(e) => setNewMemberUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
