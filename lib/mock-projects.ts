import type { Project } from '@/types/project';

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Phoenix Architecture', slug: 'phoenix-architecture', ownerId: 'user_1' },
  { id: 'p2', name: 'Ghost AI Canvas', slug: 'ghost-ai-canvas', ownerId: 'user_1' },
  { id: 'p3', name: 'Shared Workspace', slug: 'shared-workspace', ownerId: 'user_other' },
  { id: 'p4', name: 'Ghost AI Studio', slug: 'ghost-ai-studio', ownerId: 'user_other' },
  { id: 'p5', name: 'Shared Design System', slug: 'shared-design-system', ownerId: 'user_other' },
];
