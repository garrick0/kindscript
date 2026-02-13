import { vi } from 'vitest';

// Mock service for testing without DOM
export const createMockService = (methods: Record<string, any> = {}) => {
  return {
    getAll: vi.fn(() => Promise.resolve([])),
    getById: vi.fn(() => Promise.resolve({})),
    create: vi.fn((data) => Promise.resolve({ id: 'mock-id', ...data })),
    update: vi.fn((data) => Promise.resolve(data)),
    delete: vi.fn(() => Promise.resolve()),
    ...methods
  };
};

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});

export const createMockDocument = (overrides = {}) => ({
  id: 'doc-1',
  title: 'Test Document',
  content: 'Test content',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createMockRelease = (overrides = {}) => ({
  id: 'release-1',
  title: 'Test Release',
  description: 'Test description',
  status: 'draft',
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Test utilities
export const waitFor = (callback: () => void, timeout = 1000) => {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - start > timeout) {
          reject(error);
        } else {
          setTimeout(check, 10);
        }
      }
    };
    check();
  });
};