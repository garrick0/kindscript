# DashboardPage - Golden Reference Implementation

## 🏆 Overview

This DashboardPage serves as the **Golden Reference** implementation demonstrating all architectural patterns, testing strategies, and TypeSpec integration within the Feature-Slice Architecture framework.

**Use this page as the definitive guide for implementing all future pages.**

## 🏗️ Feature-Slice Architecture Implementation

### Complete Directory Structure

```
DashboardPage/
├── index.ts                           # Clean exports
├── v1.0.0/
│   ├── README.md                     # Component documentation
│   ├── GOLDEN_PAGE_REFERENCE.md     # This reference guide
│   ├── metadata.json                 # Component metadata
│   ├── dependencies.json             # Dependency tracking
│   │
│   ├── ui/                          # 🎨 Presentation Layer
│   │   ├── DashboardPage.tsx         # Main React component
│   │   ├── DashboardPage.test.tsx    # Component tests (Vitest)
│   │   ├── DashboardPage.stories.tsx # Storybook stories
│   │   └── styles/                   # Component-specific styles
│   │
│   ├── domain/                      # 🧠 Business Logic Layer
│   │   ├── DashboardPageContext.tsx  # Context provider
│   │   ├── useDashboard.ts          # Main business logic hook
│   │   ├── useDashboard.test.ts     # Hook tests (Vitest)
│   │   ├── hooks/                   # Additional hooks
│   │   └── utils/                   # Domain utilities
│   │
│   ├── data/                        # 📊 Data Layer
│   │   ├── dashboard.queries.ts      # Legacy TanStack Query
│   │   ├── dashboard.queries.validated.ts # TypeSpec-validated queries
│   │   ├── dashboard.mocks.ts        # MSW mock data
│   │   └── __tests__/               # Data layer tests
│   │
│   ├── types/                       # 📝 Type Definitions
│   │   └── dashboard.types.ts        # Local TypeScript types
│   │
│   ├── validation/                  # ✅ Validation Layer
│   │   └── schemas (auto-generated)  # TypeSpec Zod schemas
│   │
│   └── tests/                       # 🧪 Integration Tests
│       └── dashboard.integration.test.ts
```

## 🎯 Architecture Principles Demonstrated

### 1. **Complete Self-Containment**
- ✅ All dependencies colocated within the page directory
- ✅ No external service layers or centralized types
- ✅ Moveable as a complete unit

### 2. **Clear Layer Separation**
- **UI Layer**: Pure presentation, no business logic
- **Domain Layer**: All business logic, state management
- **Data Layer**: API integration, caching, validation
- **Types Layer**: Component-specific type definitions

### 3. **TypeSpec Integration**
- ✅ Contract-first API development
- ✅ Auto-generated types and validation schemas
- ✅ Runtime validation with Zod
- ✅ MSW handlers generated from TypeSpec

### 4. **Testing Excellence**
- ✅ Vitest for all testing (not @storybook/test)
- ✅ Component tests with Testing Library
- ✅ Hook tests with renderHook
- ✅ Integration tests with MSW
- ✅ composeStories integration examples

## 🧪 Testing Patterns (Vitest + MSW)

### Component Testing Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { DashboardPage } from './DashboardPage';
import { TestWrapper } from '../../../../../test/test-utils';
import { server } from '../../../../../mocks/server';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state with skeletons', async () => {
    server.use(
      http.get('/api/dashboard/stats', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json(mockStats);
      })
    );

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
  });
});
```

### Hook Testing Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard } from './useDashboard';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDashboard', () => {
  it('should return dashboard data', async () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeDefined();
  });
});
```

### MSW Validation Pattern

```typescript
import { http, HttpResponse } from 'msw';
import { validateData } from '../../../../utils/validation/query-validation';

// MSW handler with TypeSpec validation
export const dashboardHandlers = [
  http.get('/api/dashboard/stats', () => {
    const mockData = {
      documents: 42,
      releases: 8,
      pages: 15,
      workflows: 23
    };

    // Runtime validation against TypeSpec schema
    const validatedData = validateData('DashboardStatsSchema', mockData);
    
    return HttpResponse.json(validatedData);
  })
];
```

### Storybook Stories with composeStories

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import * as DashboardStories from './DashboardPage.stories';

const { Default, LoadingState, ErrorState } = composeStories(DashboardStories);

describe('DashboardPage Stories', () => {
  it('should render Default story', () => {
    render(<Default />);
    // Story is now a fully composed component
  });

  it('should render LoadingState story', () => {
    render(<LoadingState />);
  });
});
```

## 🔧 TypeSpec Integration Patterns

### 1. TypeSpec Model Definition

```typescript
// specs/models/dashboard.tsp
@doc("Dashboard statistics")
model DashboardStats {
  @doc("Total number of documents")
  documents: int32;
  
  @doc("Total number of releases") 
  releases: int32;
  
  @doc("Total number of pages")
  pages: int32;
  
  @doc("Total number of workflows")
  workflows: int32;
}
```

### 2. Generated Types Integration

```typescript
// data/dashboard.queries.validated.ts
import { 
  createValidatedQuery,
  type DashboardStats,
  type ActivityItem 
} from '../../../../utils/validation/query-validation';

export const useValidatedDashboardStats = createValidatedQuery<DashboardStats>(
  {
    endpoint: '/api/dashboard/stats',
    schemaKey: 'DashboardStatsSchema',
    logValidationErrors: process.env.NODE_ENV === 'development',
  },
  () => dashboardQueryKeys.stats()
);
```

### 3. Backward Compatibility Layer

```typescript
// Transform TypeSpec data to maintain existing interfaces
function transformStatsToLegacyFormat(stats: DashboardStats): DashboardStat[] {
  return [
    { name: 'documents', label: 'Documents', value: stats.documents, icon: 'FileText' },
    { name: 'releases', label: 'Releases', value: stats.releases, icon: 'Package' },
    // ... other transformations
  ];
}

export function useDashboardStats() {
  const validatedQuery = useValidatedDashboardStats();
  
  return {
    ...validatedQuery,
    // Transform for backward compatibility
    data: validatedQuery.data ? transformStatsToLegacyFormat(validatedQuery.data) : undefined,
  };
}
```

## 📊 Data Flow Architecture

```
TypeSpec Models → Generated Types → Zod Schemas → Runtime Validation
     ↓               ↓                ↓              ↓
API Contract → TypeScript Types → MSW Handlers → Component Props
     ↓               ↓                ↓              ↓
Backend API → TanStack Query → React Components → User Interface
```

## 🚀 Performance Optimizations

### Query Optimization
```typescript
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  data: () => [...dashboardKeys.all, 'data'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: (limit?: number) => [...dashboardKeys.all, 'activity', { limit }] as const,
};

export function useDashboardStats() {
  return useValidatedDashboardStats({
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Component Optimization
```typescript
const DashboardPageContent = React.memo(({ userId }: DashboardPageProps) => {
  const { stats, loading, error } = useDashboard();
  
  // Memoized calculations
  const chartData = useMemo(() => 
    transformStatsToChartData(stats), [stats]
  );
  
  const handleQuickAction = useCallback((actionId: string) => {
    // Action handling logic
  }, []);
  
  return (
    <ErrorBoundary>
      {/* Component JSX */}
    </ErrorBoundary>
  );
});
```

## 🎨 Styling Patterns

### Tailwind with CSS Variables
```typescript
const iconMap = {
  'Documents': FileText,
  'Releases': Package,
  'Pages': GitBranch,
  'Workflows': Workflow,
};

const colorMap = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
};
```

### Responsive Design
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {stats.map((stat) => (
    <div key={stat.name} className="bg-white rounded-lg shadow p-6">
      {/* Stat content */}
    </div>
  ))}
</div>
```

## 🔍 Error Handling Patterns

### Component-Level Error Boundaries
```typescript
import { ErrorBoundary } from '../../../../molecules/ErrorBoundary';

export function DashboardPage(props: DashboardPageProps) {
  return (
    <DashboardPageProvider>
      <ErrorBoundary>
        <DashboardPageContent {...props} />
      </ErrorBoundary>
    </DashboardPageProvider>
  );
}
```

### Query Error Handling
```typescript
const { stats, error, refetch } = useDashboard();

if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-lg text-red-600 mb-4">
        Error loading dashboard: {error.message}
      </div>
      <Button onClick={() => refetch()}>Retry</Button>
    </div>
  );
}
```

## 📚 Context Pattern

### Page-Level Context
```typescript
// domain/DashboardPageContext.tsx
interface DashboardPageContextValue {
  // Context state and methods
}

const DashboardPageContext = createContext<DashboardPageContextValue | undefined>(undefined);

export function DashboardPageProvider({ children }: { children: React.ReactNode }) {
  // Context implementation
  return (
    <DashboardPageContext.Provider value={contextValue}>
      {children}
    </DashboardPageContext.Provider>
  );
}

export function useDashboardPageContext() {
  const context = useContext(DashboardPageContext);
  if (!context) {
    throw new Error('useDashboardPageContext must be used within DashboardPageProvider');
  }
  return context;
}
```

## 🚦 Loading and Error States

### Skeleton Loading
```typescript
if (authLoading || dashboardLoading) {
  return (
    <ErrorBoundary>
      <div className="p-8 min-h-screen bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width="80px" height={32} />
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}
```

## 📋 Implementation Checklist

When creating a new page using this pattern:

### ✅ Structure Setup
- [ ] Create versioned directory structure (v1.0.0/)
- [ ] Add ui/, domain/, data/, types/, validation/, tests/ folders
- [ ] Create index.ts with clean exports
- [ ] Add metadata.json and dependencies.json

### ✅ TypeSpec Integration
- [ ] Define models in specs/models/
- [ ] Generate types and schemas
- [ ] Create validated query hooks
- [ ] Set up MSW handlers with validation

### ✅ Component Development
- [ ] Implement React component with proper props
- [ ] Add Context provider for state management
- [ ] Create business logic hooks
- [ ] Implement error boundaries

### ✅ Testing Implementation
- [ ] Write component tests with Vitest + Testing Library
- [ ] Create hook tests with renderHook
- [ ] Add integration tests with MSW
- [ ] Set up Storybook stories with composeStories tests

### ✅ Performance & Accessibility
- [ ] Add React.memo for performance
- [ ] Implement proper loading states
- [ ] Add error handling and retry logic
- [ ] Ensure accessibility compliance

### ✅ Documentation
- [ ] Update README with component overview
- [ ] Document API integration
- [ ] Add usage examples
- [ ] Create migration notes if applicable

## 🎓 Key Learning Points

### **Do's:**
- ✅ Use Vitest for ALL testing (not @storybook/test)
- ✅ Validate API responses with TypeSpec-generated schemas
- ✅ Keep all related code colocated within the page directory
- ✅ Use composeStories for testing Storybook stories
- ✅ Implement proper error boundaries and loading states
- ✅ Create transformation layers for backward compatibility

### **Don'ts:**
- ❌ Don't use @storybook/test - use Vitest instead
- ❌ Don't create centralized service layers
- ❌ Don't skip TypeSpec validation in development
- ❌ Don't mix business logic in UI components
- ❌ Don't forget error handling and loading states
- ❌ Don't break backward compatibility without migration plan

## 🔮 Future Enhancements

- **Real-time updates**: WebSocket integration for live dashboard data
- **Advanced caching**: Implement optimistic updates with TanStack Query
- **Enhanced validation**: Add runtime type checking in production
- **Performance monitoring**: Add React DevTools profiler integration
- **Accessibility**: Enhanced keyboard navigation and screen reader support

---

**This DashboardPage serves as the gold standard for all page implementations.** Reference this documentation when implementing new pages or refactoring existing ones.