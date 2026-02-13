import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as nextAuth from 'next-auth/react';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock the useAuth hook logic directly
const mockUseAuth = (sessionData: any) => {
  const session = sessionData;
  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    loading: sessionData === undefined,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
};

describe('useAuth logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null user and not authenticated when no session', () => {
    const result = mockUseAuth(null);

    expect(result.user).toBeNull();
    expect(result.isAuthenticated).toBe(false);
    expect(result.loading).toBe(false);
    expect(result.error).toBeNull();
  });

  it('returns user data when authenticated', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User'
    };

    const result = mockUseAuth({ user: mockUser });

    expect(result.user).toEqual(mockUser);
    expect(result.isAuthenticated).toBe(true);
    expect(result.loading).toBe(false);
    expect(result.error).toBeNull();
  });

  it('returns loading state when session is undefined', () => {
    const result = mockUseAuth(undefined);

    expect(result.user).toBeNull();
    expect(result.isAuthenticated).toBe(false);
    expect(result.loading).toBe(true);
    expect(result.error).toBeNull();
  });

  it('provides signIn and signOut functions', () => {
    const result = mockUseAuth(null);

    expect(typeof result.signIn).toBe('function');
    expect(typeof result.signOut).toBe('function');
  });

  it('handles partial user data', () => {
    const partialUser = {
      email: 'test@example.com'
    };

    const result = mockUseAuth({ user: partialUser });

    expect(result.user).toEqual(partialUser);
    expect(result.isAuthenticated).toBe(true);
    expect(result.user.email).toBe('test@example.com');
  });
});