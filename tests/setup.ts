import { vi } from 'vitest';

// Mock server-only in Vitest so server components and actions can be tested in jsdom
vi.mock('server-only', () => ({}));
