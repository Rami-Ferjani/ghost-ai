import type { Project } from '@/types/project';

export const MOCK_USER_ID = 'user_1';
export const MOCK_SHARED_USER_ID = 'user_other';

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Phoenix Architecture', slug: 'phoenix-architecture', ownerId: MOCK_USER_ID },
  { id: 'p2', name: 'Ghost AI Canvas', slug: 'ghost-ai-canvas', ownerId: MOCK_USER_ID },
  { id: 'p3', name: 'Shared Workspace', slug: 'shared-workspace', ownerId: MOCK_SHARED_USER_ID },
  { id: 'p4', name: 'Ghost AI Studio', slug: 'ghost-ai-studio', ownerId: MOCK_SHARED_USER_ID },
  { id: 'p5', name: 'Shared Design System', slug: 'shared-design-system', ownerId: MOCK_SHARED_USER_ID },
];
