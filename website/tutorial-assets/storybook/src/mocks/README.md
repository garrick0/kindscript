# MSW Mock System - TypeSpec Generated Only ✅

## 🎯 Overview

This directory contains the **TypeSpec-generated MSW setup** for the Induction Studio platform. All manual handlers have been removed to eliminate maintenance burden and ensure API consistency.

## 🏆 Migration Complete - August 2024

- ✅ **100% TypeSpec-generated** handlers, types, and factories
- ✅ **Zero maintenance** - no manual handler updates needed
- ✅ **API contract consistency** - frontend mocks match backend exactly
- ✅ **33+ API endpoints** fully covered from TypeSpec definitions
- ✅ **Enhanced filtering** - includes authoritative document filtering
- ✅ **All manual files removed** - enhanced.ts, seed-handlers.ts, data/, etc.

## 🚀 Contract-First Architecture

```
TypeSpec Definitions → OpenAPI Spec → Generated MSW Handlers
```

All API mocking is generated from TypeSpec specifications, ensuring consistency between frontend mocks and backend implementation.

## Directory Structure

```
mocks/
├── browser.ts           # MSW browser setup for Storybook
├── server.ts           # MSW server setup for tests
├── generated/          # TypeSpec-generated code
│   ├── types.ts       # Generated TypeScript types
│   ├── factories.ts  # Factory functions for creating mock data
│   └── handlers.ts   # Basic CRUD handlers
├── handlers/          # Custom handler implementations
│   ├── index.ts      # Main handler export
│   ├── enhanced.ts   # Enhanced handlers with pagination/filtering
│   ├── overrides.ts  # Story-specific handler overrides
│   ├── seed-handlers.ts # Handlers using seed data
│   └── response-wrapper.ts # Response formatting utilities
├── data/             # Mock data generators
│   ├── realistic-data.ts # Realistic data factories
│   └── seed-data.ts     # Fixed seed data for consistent testing
├── services/         # Service adapters
│   └── msw-adapter-service.ts # MSW service adapter
└── types/           # Type utilities
    └── type-adapters.ts # Type conversion utilities
```

## Usage

### In Storybook Stories

```typescript
import { ServiceProvider } from '@/providers/ServiceProvider';
import { releaseHandlers, delayHandlers } from '@/mocks/handlers/overrides';

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: delayHandlers(2000), // Simulate 2s loading
    },
  },
  decorators: [
    (Story) => (
      <ServiceProvider useMocks={true}>
        <Story />
      </ServiceProvider>
    ),
  ],
};

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: releaseHandlers.empty, // Empty release list
    },
  },
};
```

### In Tests

```typescript
import { server } from '@/mocks/server';
import { releaseHandlers } from '@/mocks/handlers/overrides';

describe('Releases', () => {
  it('handles empty state', async () => {
    // Override default handlers for this test
    server.use(...releaseHandlers.empty);
    
    render(<ReleasesPage />);
    
    expect(await screen.findByText('No releases found')).toBeInTheDocument();
  });
});
```

## Handler Patterns

### Basic CRUD Handlers (Generated)

The generated handlers provide basic CRUD operations:

```typescript
// GET /api/releases
http.get('/api/releases', () => {
  return HttpResponse.json(factories.createReleaseList());
});

// POST /api/releases
http.post('/api/releases', async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json(factories.createRelease(body));
});
```

### Enhanced Handlers

Enhanced handlers add real-world features like pagination and filtering:

```typescript
// Pagination support
http.get('/api/releases', async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  const releases = generateReleases(50);
  const paginated = releases.slice((page - 1) * limit, page * limit);
  
  return HttpResponse.json({
    data: paginated,
    pagination: {
      page,
      limit,
      total: releases.length,
      totalPages: Math.ceil(releases.length / limit),
    },
  });
});
```

### Override Handlers

Override handlers simulate specific states for stories:

```typescript
export const releaseHandlers = {
  // Empty state
  empty: [
    http.get('/api/releases', () => HttpResponse.json([])),
  ],
  
  // Error state
  error: [
    http.get('/api/releases', () => 
      HttpResponse.json(
        { error: 'Failed to fetch releases' },
        { status: 500 }
      )
    ),
  ],
  
  // With specific status
  withStatus: (status: ReleaseStatus) => [
    http.get('/api/releases', () => {
      const releases = Array.from({ length: 5 }, () => 
        factories.createRelease({ status })
      );
      return HttpResponse.json(releases);
    }),
  ],
};
```

## Response Formats

### Adaptive Response Wrapper

The system supports both wrapped and unwrapped response formats:

```typescript
import { createAdaptiveResponse } from './handlers/response-wrapper';

// Automatically detects if wrapping is needed
const response = createAdaptiveResponse(data, {
  pagination: { page: 1, limit: 10, total: 100 },
  wrapped: true, // Optional, auto-detected if not specified
});
```

### Response Types

1. **Simple Array Response**
```json
[
  { "id": "1", "name": "Release 1" },
  { "id": "2", "name": "Release 2" }
]
```

2. **Wrapped Response with Metadata**
```json
{
  "data": [
    { "id": "1", "name": "Release 1" },
    { "id": "2", "name": "Release 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

## Seed Data

### Fixed Seed Data

Use seed data for consistent testing scenarios:

```typescript
import { seedReleases, seedDocuments, getSeedDataForScenario } from './data/seed-data';

// Get scenario-specific data
const { releases, documents, user } = getSeedDataForScenario('active-team');

// Available scenarios:
// - 'new-user': Empty workspace for new users
// - 'active-team': Active team with ongoing work
// - 'enterprise': Large dataset for enterprise testing
// - 'demo': Default demo data
```

### Realistic Data Generation

Generate realistic mock data on the fly:

```typescript
import { generateReleases, generateDocuments } from './data/realistic-data';

// Generate 10 random releases
const releases = generateReleases(10);

// Generate documents with filtering
const documents = generateDocuments(20).filter(d => d.status === 'published');
```

## ⚙️ TypeSpec Integration (Contract-First Development)

### Quick Commands

```bash
# Regenerate everything from TypeSpec (recommended)
pnpm mocks:generate

# Or run steps separately
pnpm typespec:compile   # TypeSpec → OpenAPI
pnpm typespec:generate  # OpenAPI → MSW handlers

# Verify API coverage
npx tsx scripts/verify-api-parity.ts
```

### Adding New API Endpoints

1. **Define in TypeSpec** (`specs/api.tsp`):
```typescript
@route("/api/my-feature")
namespace MyFeature {
  @doc("Get feature data")
  @get
  op getData(): {
    @body data: MyFeatureData;
  } | {
    @statusCode statusCode: 404;
    @body error: {
      message: string;
      code: "NOT_FOUND";
    };
  };
}
```

2. **Add models** (`specs/models/my-feature.tsp`):
```typescript
@doc("My feature data")
model MyFeatureData {
  id: string;
  name: string;
  status: "active" | "inactive";
}
```

3. **Regenerate**:
```bash
pnpm mocks:generate
```

4. **Automatically generated**:
- ✅ TypeScript types for `MyFeatureData` 
- ✅ MSW handler for `GET /api/my-feature`
- ✅ Factory function `createMyFeatureData()`
- ✅ Error responses (404 with proper structure)
- ✅ Realistic mock data using Faker.js

### Generated Artifacts

When you run `pnpm mocks:generate`:
1. **TypeSpec compilation** (`specs/api.tsp` → `tsp-output/openapi.json`)
2. **Code generation** (`openapi.json` → MSW artifacts):
   - `types.ts` - TypeScript interfaces and types
   - `handlers.ts` - MSW request handlers with 100ms delays
   - `factories.ts` - Mock data generators using Faker.js
3. **Full error handling** - All TypeSpec-defined error responses

### Type Safety

All handlers use TypeSpec-generated types for consistency:

```typescript
import type * as Types from './generated/types';

// Type-safe release creation
const release: Types.Release = factories.createRelease({
  name: 'Q1 Release',
  status: 'published', // TypeScript enforces valid status
});
```

## Testing Utilities

### Network Error Simulation

```typescript
import { networkErrorHandlers } from './handlers/overrides';

// Simulate timeout
server.use(...networkErrorHandlers.timeout);

// Simulate offline
server.use(...networkErrorHandlers.offline);

// Simulate rate limiting
server.use(...networkErrorHandlers.rateLimit);
```

### Delay Simulation

```typescript
import { delayHandlers } from './handlers/overrides';

// Add 2 second delay to all requests
server.use(...delayHandlers(2000));
```

## Best Practices

1. **Use TypeSpec Types**: Always use generated types for consistency
2. **Leverage Factories**: Use factory functions for creating test data
3. **Override Sparingly**: Only override handlers when testing specific scenarios
4. **Seed for Consistency**: Use seed data for predictable test scenarios
5. **Test Error States**: Always test error and edge cases
6. **Document Overrides**: Comment why specific overrides are needed

## Troubleshooting

### Handlers Not Working

1. Check that MSW is initialized in browser/server
2. Verify handler URL patterns match your API calls
3. Check browser DevTools Network tab for MSW indicators

### Type Mismatches

1. Regenerate types with `pnpm typespec:generate`
2. Check that component types align with API types
3. Use type adapters if needed for legacy code

### Storybook Integration Issues

1. Ensure ServiceProvider has `useMocks={true}`
2. Check that MSW addon is configured in `.storybook/preview.js`
3. Verify handlers are exported correctly

## Migration from Old Mock System

If migrating from the old mock system:

1. Replace imports from `test/mocks` with `mocks`
2. Update service implementations to use MSW adapters
3. Convert static mock data to use factories
4. Update test setup to use new server configuration