import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceProvider } from '../providers/ServiceProvider';
import { SessionProvider } from 'next-auth/react';
import { SafeAuthProvider } from '../core/auth/SafeAuthProvider';

// Create a test query client with no retries and immediate garbage collection
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// MSW handles all API mocking - no need for mock services
// ServiceProvider will automatically detect MSW and use real services

// Mock session for tests
const mockSession = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Test auth provider that can override auth state
interface TestAuthProviderProps {
  children: React.ReactNode;
  authProps?: {
    isAuthenticated?: boolean;
    loading?: boolean;
    user?: any;
  };
}

function TestAuthProvider({ children, authProps }: TestAuthProviderProps) {
  // Convert test authProps to SafeAuthProvider props
  const mockUser = authProps?.isAuthenticated === false 
    ? null 
    : authProps?.user || {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
      };

  return (
    <SafeAuthProvider 
      mockUser={mockUser} 
      initialLoading={authProps?.loading || false}
    >
      {children}
    </SafeAuthProvider>
  );
}

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  useMocks?: boolean;
  session?: any;
  authProps?: {
    isAuthenticated?: boolean;
    loading?: boolean;
    user?: any;
  };
}

// Wrapper component with all providers
// ServiceProvider will automatically detect MSW and use real services
export function AllTheProviders({ 
  children, 
  queryClient = createTestQueryClient(),
  useMocks = true, // MSW is enabled by default in tests
  session = mockSession,
  authProps
}: AllTheProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <TestAuthProvider authProps={authProps}>
          <ServiceProvider useMocks={useMocks}>
            {children}
          </ServiceProvider>
        </TestAuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

// Custom render function
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient;
    session?: any;
  }
): ReturnType<typeof render> {
  const { queryClient, session, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient} session={session}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithProviders as render };