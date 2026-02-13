# MSW and TypeSpec Integration Guide

*Date: 2025-01-20*
*Status: ✅ Fully Integrated*

## 🎯 Overview

Successfully integrated Mock Service Worker (MSW) with TypeSpec API definitions to enable comprehensive API mocking in Storybook. This allows for realistic component testing with mocked backend responses generated directly from our API specification.

## 🏗 Architecture

```
TypeSpec API Definition (.tsp)
        ↓
OpenAPI Specification (JSON)
        ↓
MSW Handler Generator (Script)
        ↓
Generated Handlers & Types
        ↓
Storybook Stories with MSW
```

## 📁 File Structure

```
apps/storybook/
├── typespec/
│   ├── main.tsp              # Entry point for TypeSpec
│   ├── api.tsp               # Complete API specification
│   └── generated/
│       └── openapi.json      # Generated OpenAPI spec
├── src/mocks/
│   ├── browser.ts            # MSW browser setup
│   └── generated/
│       ├── types.ts          # Generated TypeScript types
│       ├── handlers.ts       # Generated MSW handlers
│       └── factories.ts      # Generated mock data factories
├── scripts/
│   └── generate-from-typespec.js  # Generator script
├── .storybook/
│   └── preview.tsx           # MSW initialization
└── tspconfig.yaml            # TypeSpec configuration
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Generate MSW Handlers
```bash
# Compile TypeSpec and generate MSW handlers
pnpm run msw:init

# Or step by step:
pnpm run typespec:compile  # Generate OpenAPI from TypeSpec
pnpm run typespec:generate  # Generate MSW handlers from OpenAPI
```

### 3. Use in Stories
```typescript
import { http, HttpResponse } from 'msw';

export const MyStory: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/documents', () => {
          return HttpResponse.json({
            data: [...],
            total: 10,
            page: 1,
            limit: 20,
            hasMore: false
          });
        }),
      ],
    },
  },
};
```

## 📝 TypeSpec API Definition

The API is defined in `typespec/api.tsp` using TypeSpec's declarative syntax:

```typescript
@service({
  title: "Induction Studio API",
})
namespace InductionStudioAPI;

model Document {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  // ...
}

@route("/documents")
namespace Documents {
  @get
  op listDocuments(...): PaginatedResponse<Document>;
  
  @post
  op createDocument(@body document: Document): Document;
  // ...
}
```

## 🔧 Generated Artifacts

### Types (`src/mocks/generated/types.ts`)
```typescript
export interface Document {
  id: string;
  title: string;
  content: string;
  type: "prd" | "spec" | "design" | "note" | "analysis" | "implementation";
  metadata?: DocumentMetadata;
  createdAt: string;
  updatedAt: string;
  userId: string;
  versionNumber: number;
  isActive: boolean;
}
```

### Handlers (`src/mocks/generated/handlers.ts`)
```typescript
export const handlers = [
  // List all documents with pagination
  http.get('/api/documents', () => {
    const responseData = Array.from(
      { length: faker.number.int({ min: 1, max: 5 }) }, 
      () => factories.createDocument()
    );
    return HttpResponse.json(responseData);
  }),
  // ...
];
```

### Factories (`src/mocks/generated/factories.ts`)
```typescript
export function createDocument(overrides = {}) {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    type: faker.helpers.arrayElement([
      "prd", "spec", "design", "note", "analysis", "implementation"
    ]),
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    userId: faker.string.uuid(),
    versionNumber: faker.number.int({ min: 1, max: 10 }),
    isActive: faker.datatype.boolean(),
    ...overrides,
  };
}
```

## 🎨 Using MSW in Storybook

### Basic Usage
```typescript
// DocumentList.stories.tsx
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/documents', () => {
          return HttpResponse.json({
            data: [/* your mock data */],
            total: 3,
            page: 1,
            limit: 20,
            hasMore: false,
          });
        }),
      ],
    },
  },
};
```

### Testing Different States
```typescript
// Empty state
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/documents', () => {
          return HttpResponse.json({ data: [] });
        }),
      ],
    },
  },
};

// Error state
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/documents', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      ],
    },
  },
};

// Loading state (delayed response)
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/documents', async () => {
          await new Promise(resolve => setTimeout(resolve, 5000));
          return HttpResponse.json({ data: [] });
        }),
      ],
    },
  },
};
```

## 📚 Available API Endpoints

The following endpoints are automatically mocked:

### Authentication
- `POST /api/auth` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `GET /api/documents/:id` - Get document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/versions` - Get versions

### Releases
- `GET /api/releases` - List releases
- `POST /api/releases` - Create release
- `GET /api/releases/:id` - Get release
- `PUT /api/releases/:id` - Update release
- `POST /api/releases/:id/publish` - Publish release

### Pages
- `GET /api/pages` - List pages
- `POST /api/pages` - Create page
- `GET /api/pages/:id` - Get page
- `PUT /api/pages/:id` - Update page

### AI
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/analyze` - Analyze content

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id/role` - Update role
- `DELETE /api/users/:id` - Delete user

### Health
- `GET /api/health` - Health check

## 🔄 Updating the API

1. **Edit TypeSpec Definition**
   ```bash
   # Edit typespec/api.tsp
   ```

2. **Regenerate Handlers**
   ```bash
   pnpm run typespec:generate
   ```

3. **Use New Endpoints**
   - Generated types will be in `src/mocks/generated/types.ts`
   - Generated handlers will be in `src/mocks/generated/handlers.ts`
   - Generated factories will be in `src/mocks/generated/factories.ts`

## 🧪 Testing Components with API Dependencies

Example component that fetches data:

```typescript
// DocumentList.tsx
export const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(data.data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id}>{doc.title}</div>
      ))}
    </div>
  );
};
```

The MSW handlers automatically intercept these API calls in Storybook, providing realistic responses without needing a backend.

## 🎯 Benefits

1. **Type Safety**: TypeScript types generated from API specification
2. **Consistency**: Single source of truth for API definition
3. **Realistic Testing**: Test components with actual API shapes
4. **Parallel Development**: Frontend can work without backend
5. **Documentation**: API is self-documenting through TypeSpec
6. **Automation**: Changes to API spec automatically update mocks

## 🚨 Troubleshooting

### MSW Not Working in Storybook
1. Check browser console for MSW initialization message
2. Ensure `initialize()` is called in `.storybook/preview.tsx`
3. Clear browser cache and reload

### TypeSpec Compilation Errors
1. Check syntax in `.tsp` files
2. Avoid TypeSpec reserved keywords (e.g., use `modelName` instead of `model`)
3. Don't use default values in model properties

### Generated Handlers Not Updating
1. Delete `typespec/generated/` directory
2. Run `pnpm run typespec:generate` again
3. Restart Storybook

## 📈 Next Steps

1. **Expand Coverage**: Add more API endpoints as needed
2. **Custom Scenarios**: Create specific mock scenarios for edge cases
3. **Integration Tests**: Use MSW handlers in integration tests
4. **CI/CD**: Validate TypeSpec compilation in CI pipeline

## 📖 Resources

- [TypeSpec Documentation](https://typespec.io/)
- [MSW Documentation](https://mswjs.io/)
- [MSW Storybook Addon](https://github.com/mswjs/msw-storybook-addon)
- [OpenAPI Specification](https://swagger.io/specification/)

---

*This integration enables comprehensive API mocking for Storybook stories, allowing realistic component testing without backend dependencies.*