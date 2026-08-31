import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { LoadingScreen } from '../components/ui/Spinner';
import { reportsApi } from '../api/reports';
import { projectsApi } from '../api/projects';
import type { Project, ProjectSummary, VelocityReport, BurndownReport } from '../types';



export const Reports: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<ProjectSummary>({
    queryKey: ['reports', 'summary', projectId],
    queryFn: () => reportsApi.summary(projectId!),
    enabled: !!projectId,
  });

  const { data: velocity, isLoading: velocityLoading } = useQuery<VelocityReport>({
    queryKey: ['reports', 'velocity', projectId],
    queryFn: () => reportsApi.velocity(projectId!),
    enabled: !!projectId,
  });

  const { data: burndown } = useQuery<BurndownReport>({
    queryKey: ['reports', 'burndown', projectId],
    queryFn: () => reportsApi.burndown(projectId!),
    enabled: !!projectId,
  });

  if (summaryLoading || velocityLoading) return <LoadingScreen />;

  const statusData = summary ? [
    { name: 'Done', value: summary.done, color: '#36B37E' },
    { name: 'In Progress', value: summary.in_progress, color: '#0052CC' },
    { name: 'To Do', value: summary.todo, color: '#DFE1E6' },
    { name: 'Backlog', value: summary.backlog, color: '#97A0AF' },
  ] : [];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar
          breadcrumb={[
            { label: project?.name || 'Project' },
            { label: 'Reports' },
          ]}
        />

        <main className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Reports</h1>
              <p className="page-subtitle">Project insights and sprint analytics</p>
            </div>
          </div>

          {/* Summary stats */}
          {summary && (
            <div className="stats-grid" style={{ marginBottom: 28 }}>
              <div className="stat-card">
                <div className="stat-card-icon blue">📋</div>
                <span className="stat-card-label">Total Issues</span>
                <span className="stat-card-value">{summary.total_issues}</span>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon green">✅</div>
                <span className="stat-card-label">Done</span>
                <span className="stat-card-value" style={{ color: 'var(--color-success)' }}>
                  {summary.done}
                </span>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon blue">🔄</div>
                <span className="stat-card-label">In Progress</span>
                <span className="stat-card-value">{summary.in_progress}</span>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon red">🐛</div>
                <span className="stat-card-label">Bugs</span>
                <span className="stat-card-value" style={{ color: 'var(--color-danger)' }}>
                  {summary.bugs}
                </span>
              </div>
            </div>
          )}

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Velocity Chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Sprint Velocity</span>
                {velocity && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
                    Avg: {velocity.average_velocity} pts
                  </span>
                )}
              </div>
              <div className="card-body">
                {velocity && velocity.velocity_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={velocity.velocity_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
                      <XAxis
                        dataKey="sprint_name"
                        tick={{ fontSize: 11, fill: '#6B778C' }}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#6B778C' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#fff', border: '1px solid #DFE1E6',
                          borderRadius: 6, fontSize: 12,
                        }}
                      />
                      <Bar dataKey="story_points" fill="#0052CC" radius={[4, 4, 0, 0]} name="Story Points" />
                      <Bar dataKey="completed_issues" fill="#4C9AFF" radius={[4, 4, 0, 0]} name="Issues" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-subtle)', fontSize: 13 }}>
                    Complete a sprint to see velocity data
                  </div>
                )}
              </div>
            </div>

            {/* Issue Distribution Pie */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Issue Status Distribution</span>
                {summary && (
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: summary.completion_percentage >= 75 ? 'var(--color-success)' : 'var(--color-primary)',
                  }}>
                    {summary.completion_percentage}% Done
                  </span>
                )}
              </div>
              <div className="card-body">
                {summary && summary.total_issues > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1 }}>
                      {statusData.filter(d => d.value > 0).map((item) => (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--color-text-subtle)', flex: 1 }}>{item.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-subtle)', fontSize: 13 }}>
                    No issues yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Burndown */}
          {burndown && burndown.sprint && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  Burndown — {burndown.sprint.name}
                </span>
                <span style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>
                  {burndown.done_count}/{burndown.issue_count} issues done
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)' }}>
                      {burndown.total_story_points}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 4 }}>Total Points</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-success)' }}>
                      {burndown.completed_story_points}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 4 }}>Completed</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-warning)' }}>
                      {burndown.remaining_story_points}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 4 }}>Remaining</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-subtle)', marginBottom: 6 }}>
                    <span>Progress</span>
                    <span>
                      {burndown.total_story_points > 0
                        ? Math.round((burndown.completed_story_points / burndown.total_story_points) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #0052CC, #4C9AFF)',
                      borderRadius: 5,
                      width: `${burndown.total_story_points > 0
                        ? Math.round((burndown.completed_story_points / burndown.total_story_points) * 100)
                        : 0}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
