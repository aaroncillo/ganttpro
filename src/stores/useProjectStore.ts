import { create } from 'zustand';
import type { Project, Task, SubOC } from '@/types';
import { mockProjects } from '@/data/mock';
import { uid } from '@/lib/utils';

interface ProjectStore {
  // State
  projects: Project[];
  activeProjectId: string | null;

  // Computed
  activeProject: () => Project | undefined;

  // Project actions
  setActiveProject: (id: string | null) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Task actions
  addTask: (projectId: string, task: Omit<Task, 'id'>) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  setTasks: (projectId: string, tasks: Task[]) => void;

  // Sub-OC actions
  addSubOC: (projectId: string, subOC: Omit<SubOC, 'id'>) => void;
  updateSubOC: (projectId: string, subOCId: string, updates: Partial<SubOC>) => void;
  deleteSubOC: (projectId: string, subOCId: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: mockProjects,
  activeProjectId: null,

  activeProject: () => {
    const { projects, activeProjectId } = get();
    return projects.find((p) => p.id === activeProjectId);
  },

  setActiveProject: (id) => set({ activeProjectId: id }),

  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, { ...project, id: uid() }],
    })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId:
        state.activeProjectId === id ? null : state.activeProjectId,
    })),

  // ─── Tasks ───

  addTask: (projectId, task) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: [...p.tasks, { ...task, id: uid() }] }
          : p
      ),
    })),

  updateTask: (projectId, taskId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
            }
          : p
      ),
    })),

  deleteTask: (projectId, taskId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          : p
      ),
    })),

  setTasks: (projectId, tasks) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, tasks } : p
      ),
    })),

  // ─── Sub-OCs ───

  addSubOC: (projectId, subOC) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, subOCs: [...p.subOCs, { ...subOC, id: uid() }] }
          : p
      ),
    })),

  updateSubOC: (projectId, subOCId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              subOCs: p.subOCs.map((s) =>
                s.id === subOCId ? { ...s, ...updates } : s
              ),
            }
          : p
      ),
    })),

  deleteSubOC: (projectId, subOCId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, subOCs: p.subOCs.filter((s) => s.id !== subOCId) }
          : p
      ),
    })),
}));
