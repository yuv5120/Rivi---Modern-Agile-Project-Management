import React, { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  List,
  BarChart2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Zap,
  Plus,
  FolderKanban,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects';
import { Avatar } from '../ui/Avatar';
import type { Project } from '../../types';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <NavLink to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={16} color="var(--color-primary)" fill="var(--color-primary)" />
        </div>
        <span className="sidebar-logo-text">Rivi</span>
      </NavLink>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Main nav */}
        <div className="sidebar-section-label">Main</div>

        <NavLink to="/" end className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon"><LayoutDashboard size={16} /></span>
          Dashboard
        </NavLink>

        {/* Projects section */}
        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Projects</div>

        <button
          className="sidebar-item"
          onClick={() => setProjectsExpanded(!projectsExpanded)}
          style={{ justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="sidebar-item-icon"><FolderKanban size={16} /></span>
            All Projects
          </span>
          {projectsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {projectsExpanded && projects.map((project) => (
          <div key={project.id}>
            <NavLink
              to={`/projects/${project.id}/board`}
              className={() =>
                `sidebar-item ${projectId === project.id ? 'active' : ''}`
              }
              style={{ paddingLeft: 36 }}
            >
              <div className="sidebar-project-key">{project.key.slice(0, 2)}</div>
              <span style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.name}
              </span>
            </NavLink>

            {projectId === project.id && (
              <div style={{ animation: 'fadeSlideIn 150ms ease' }}>
                <NavLink
                  to={`/projects/${project.id}/board`}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  style={{ paddingLeft: 52 }}
                >
                  <span className="sidebar-item-icon"><Kanban size={14} /></span>
                  Board
                </NavLink>
                <NavLink
                  to={`/projects/${project.id}/backlog`}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  style={{ paddingLeft: 52 }}
                >
                  <span className="sidebar-item-icon"><List size={14} /></span>
                  Backlog
                </NavLink>
                <NavLink
                  to={`/projects/${project.id}/reports`}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  style={{ paddingLeft: 52 }}
                >
                  <span className="sidebar-item-icon"><BarChart2 size={14} /></span>
                  Reports
                </NavLink>
                <NavLink
                  to={`/projects/${project.id}/settings`}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  style={{ paddingLeft: 52 }}
                >
                  <span className="sidebar-item-icon"><Settings size={14} /></span>
                  Settings
                </NavLink>
              </div>
            )}
          </div>
        ))}

        <button
          className="sidebar-item"
          onClick={() => navigate('/?create=true')}
          style={{ marginTop: 4 }}
        >
          <span className="sidebar-item-icon"><Plus size={16} /></span>
          New Project
        </button>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
          <Avatar username={user?.username || ''} avatarUrl={user?.avatar_url} size="sm" />
          <span className="sidebar-user-name">{user?.username}</span>
          <LogOut size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
};
