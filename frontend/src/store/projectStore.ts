import { create } from 'zustand';
import type { Project, Sprint } from '../types';

interface ProjectState {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  currentSprint: Sprint | null;
  setCurrentSprint: (sprint: Sprint | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  currentSprint: null,
  setCurrentSprint: (sprint) => set({ currentSprint: sprint }),
}));
