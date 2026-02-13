// Generated MSW handlers from TypeSpec
// Do not edit manually - regenerate using npm run typespec:generate

import { http, HttpResponse, delay } from 'msw';
import * as factories from './factories';
import type * as Types from './types';

// URL configuration for test environment
const BASE_URL = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';

function createUrl(path: string): string {
  return BASE_URL ? `${BASE_URL}${path}` : path;
}

export const handlers = [
  // Chat with AI assistant
  http.post(createUrl('/api/ai/chat'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createChatResponse();
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: generatedData.id,
      createdAt: generatedData.createdAt || new Date().toISOString(),
      updatedAt: generatedData.updatedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Consolidate multiple documents
  http.post(createUrl('/api/ai/consolidate'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = {
    consolidatedDocument: factories.createConsolidatedDocument()
    };
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: generatedData.id,
      createdAt: generatedData.createdAt || new Date().toISOString(),
      updatedAt: generatedData.updatedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Estimate AI operation cost
  http.post(createUrl('/api/ai/estimate-cost'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = {
    estimatedCost: factories.createEstimatedCost(),
    breakdown: factories.createCostBreakdown()
    };
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: generatedData.id,
      createdAt: generatedData.createdAt || new Date().toISOString(),
      updatedAt: generatedData.updatedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Start long-running AI operation
  http.post(createUrl('/api/ai/operations'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    return new HttpResponse(null, { status: 204 });
  }),

  // Get operation status
  http.get(createUrl('/api/ai/operations/:id'), async ({ params, request }) => {
    await delay(100);

    // Generate mock response
    // Try to find the item from the list first
    const allItems = Array.from({ length: 10 }, () => factories.createOperationStatus());
    const foundItem = allItems.find(item => item.id === params.id);
    const responseData = foundItem || { ...factories.createOperationStatus(), id: params.id };
    return HttpResponse.json(responseData);
  }),

  // Get available templates
  http.get(createUrl('/api/ai/templates'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = Array.from({ length: 5 }, () => factories.createTemplate());
    return HttpResponse.json(responseData);
  }),

  // Customize a template
  http.post(createUrl('/api/ai/templates/customize'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = {
    customizedTemplate: factories.createCustomizedTemplate()
    };
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: generatedData.id,
      createdAt: generatedData.createdAt || new Date().toISOString(),
      updatedAt: generatedData.updatedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Get AI usage metrics
  http.get(createUrl('/api/ai/usage-metrics'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = factories.createUsageMetrics();
    return HttpResponse.json(responseData);
  }),

  // List available artifacts
  http.get(createUrl('/api/artifacts'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = Array.from({ length: 5 }, () => factories.createArtifact());
    return HttpResponse.json(responseData);
  }),

  // Get current user
  http.get(createUrl('/api/auth'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = factories.createUser();
    return HttpResponse.json(responseData);
  }),

  // Get auth callback URL
  http.get(createUrl('/api/auth/callback-url'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = null;
    return HttpResponse.json(responseData);
  }),

  // Login user
  http.post(createUrl('/api/auth/login'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createUser();
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: generatedData.id,
      createdAt: generatedData.createdAt || new Date().toISOString(),
      updatedAt: generatedData.updatedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Logout user
  http.post(createUrl('/api/auth/logout'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    return new HttpResponse(null, { status: 204 });
  }),

  // Handle auth redirect
  http.get(createUrl('/api/auth/redirect'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    return new HttpResponse(null, { status: 204 });
  }),

  // Get current session
  http.get(createUrl('/api/auth/session'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = {
    user: factories.createUser(),
    expires: 'mock-1zzza1k5u',
    accessToken: 'mock-bfbjfy8x0'
    };
    return HttpResponse.json(responseData);
  }),

  // Get complete dashboard data
  http.get(createUrl('/api/dashboard'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = factories.createDashboardData();
    return HttpResponse.json(responseData);
  }),

  // Get recent activity
  http.get(createUrl('/api/dashboard/activity'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = Array.from({ length: 5 }, () => factories.createActivityItem());
    return HttpResponse.json(responseData);
  }),

  // Get dashboard statistics
  http.get(createUrl('/api/dashboard/stats'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = factories.createDashboardStats();
    return HttpResponse.json(responseData);
  }),

  // Get dashboard quick actions
  http.get(createUrl('/api/dashboard/quick-actions'), async ({ params, request }) => {
    // No delay for tests
    
    // Generate mock quick actions
    const responseData = [
      { id: 'create-document', title: 'Create Document', color: 'blue' },
      { id: 'generate-page', title: 'Generate Page', color: 'green' },
      { id: 'start-workflow', title: 'Start Workflow', color: 'purple' }
    ];
    return HttpResponse.json(responseData);
  }),

  // Get dashboard notifications
  http.get(createUrl('/api/dashboard/notifications'), async ({ params, request }) => {
    // No delay for tests
    
    // Generate mock notifications
    const responseData = [];
    return HttpResponse.json(responseData);
  }),

  // Debug authentication state
  http.get(createUrl('/api/debug/-auth'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = {
    session: null,
    env: null
    };
    return HttpResponse.json(responseData);
  }),

  // Debug environment variables
  http.get(createUrl('/api/debug/-env'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = {
    nodeEnv: 'mock-fiqmyq3zm',
    nextAuthUrl: 'mock-5qas67bw9',
    auth0Domain: 'mock-udj361uyn',
    supabaseUrl: 'mock-dhtb2cfah'
    };
    return HttpResponse.json(responseData);
  }),

  // List all documents
  http.get(createUrl('/api/documents'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = generateFilteredData([
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'published', authoritative: true })),
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'published', authoritative: false })),
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'draft' })),
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'review' })),
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'approved' }))
      ], filters);
    return HttpResponse.json(responseData);
  }),

  // Create new document
  http.post(createUrl('/api/documents'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createDocument();
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: generatedData.id,
      createdAt: generatedData.createdAt || new Date().toISOString(),
      updatedAt: generatedData.updatedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData, { status: 201 });
  }),

  // Get document by ID
  http.get(createUrl('/api/documents/:id'), async ({ params, request }) => {
    await delay(100);

    // Generate mock response
    // Try to find the item from the list first
    const allItems = [
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'published', authoritative: true })),
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'published', authoritative: false })),
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'draft' })),
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'review' })),
        ...Array.from({ length: 2 }, () => factories.createDocument({ status: 'approved' }))
      ];
    const foundItem = allItems.find(item => item.id === params.id);
    const responseData = foundItem || { ...factories.createDocument(), id: params.id };
    return HttpResponse.json(responseData);
  }),

  // Update document
  http.put(createUrl('/api/documents/:id'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createDocument();
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: params.id || generatedData.id,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Delete document
  http.delete(createUrl('/api/documents/:id'), async ({ params, request }) => {
    await delay(100);

    return new HttpResponse(null, { status: 204 });
  }),

  // Generate page from document
  http.post(createUrl('/api/documents/:id/generate-page'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createPage();
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: generatedData.id,
      createdAt: generatedData.createdAt || new Date().toISOString(),
      updatedAt: generatedData.updatedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Get API health status
  http.get(createUrl('/api/health'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = factories.createHealthStatus();
    return HttpResponse.json(responseData);
  }),

  // Get Storybook health status
  http.get(createUrl('/api/health/storybook'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = factories.createStorybookHealthStatus();
    return HttpResponse.json(responseData);
  }),

  // Test protected endpoint
  http.get(createUrl('/api/protected'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = {
    message: 'mock-4tnl5zg6j',
    user: factories.createUser()
    };
    return HttpResponse.json(responseData);
  }),

  // List all releases
  http.get(createUrl('/api/releases'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = generateFilteredData([
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'published', version: '1.0.0' })),
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'published', version: '1.0.1' })),
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'draft', version: '1.0.2' })),
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'draft', version: '2.0.0' })),
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'archived', version: '0.9.0' }))
      ], filters);
    return HttpResponse.json(responseData);
  }),

  // Create new release
  http.post(createUrl('/api/releases'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createRelease();
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: generatedData.id,
      createdAt: generatedData.createdAt || new Date().toISOString(),
      updatedAt: generatedData.updatedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData, { status: 201 });
  }),

  // Get release by ID
  http.get(createUrl('/api/releases/:id'), async ({ params, request }) => {
    await delay(100);

    // Generate mock response
    // Try to find the item from the list first
    const allItems = [
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'published', version: '1.0.0' })),
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'published', version: '1.0.1' })),
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'draft', version: '1.0.2' })),
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'draft', version: '2.0.0' })),
        ...Array.from({ length: 2 }, () => factories.createRelease({ status: 'archived', version: '0.9.0' }))
      ];
    const foundItem = allItems.find(item => item.id === params.id);
    const responseData = foundItem || { ...factories.createRelease(), id: params.id };
    return HttpResponse.json(responseData);
  }),

  // Update release
  http.put(createUrl('/api/releases/:id'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createRelease();
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: params.id || generatedData.id,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Delete release
  http.delete(createUrl('/api/releases/:id'), async ({ params, request }) => {
    await delay(100);

    return new HttpResponse(null, { status: 204 });
  }),

  // Publish release
  http.post(createUrl('/api/releases/:id/publish'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createRelease();
    const responseData = {
      ...generatedData,
      ...requestBody,
      id: generatedData.id,
      createdAt: generatedData.createdAt || new Date().toISOString(),
      updatedAt: generatedData.updatedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Search across all content
  http.get(createUrl('/api/search'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = factories.createSearchResults();
    return HttpResponse.json(responseData);
  }),

  // Get user settings
  http.get(createUrl('/api/settings/:userId'), async ({ params, request }) => {
    await delay(100);

    // Generate mock response
    const responseData = factories.createUserPreferences();
    return HttpResponse.json(responseData);
  }),

  // Update user settings
  http.put(createUrl('/api/settings/:userId'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createUserPreferences();
    const responseData = {
      ...generatedData,
      ...requestBody,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // Server-sent events for documents (simplified for Storybook)
  http.get(createUrl('/api/sse/documents'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = factories.createSSEFallback();
    return HttpResponse.json(responseData);
  }),

  // List all workflows
  http.get(createUrl('/api/workflows'), async ({ params, request }) => {
    await delay(100);

    // Handle query parameters for filtering
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams);
    
    // Generate mock response
    const responseData = Array.from({ length: 5 }, () => factories.createWorkflow());
    return HttpResponse.json(responseData);
  }),

  // Execute a workflow
  http.post(createUrl('/api/workflows/:id/execute'), async ({ params, request }) => {
    await delay(100);

    // Parse request body
    const requestBody = await request.json().catch(() => ({}));

    // Generate mock response
    const generatedData = factories.createWorkflowExecution();
    const responseData = {
      ...generatedData,
      ...requestBody,
      executionId: generatedData.executionId,
      startedAt: generatedData.startedAt || new Date().toISOString(),
    };
    return HttpResponse.json(responseData);
  }),

  // List all migrations
  http.get(createUrl('/api/migrations'), async ({ params, request }) => {
    await delay(100);

    // Generate mock migration data
    const responseData = [
      {
        id: 'portable-stories',
        name: 'Portable Stories Migration',
        description: 'Migrate test files to use Storybook portable stories pattern',
        status: 'in-progress',
        compliance: 84.8,
        target: 95,
        totalFiles: 47,
        filesCompliant: 28,
        filesRemaining: 5,
        startDate: '2025-08-20',
        elapsedTime: '5 days',
        timeEstimate: '2-4 hours',
        eta: '2025-08-25',
        successRate: 100,
        milestones: [
          {
            id: '1',
            name: 'Golden Examples',
            description: 'Establish reference implementations',
            targetCompliance: 70,
            filesNeeded: 2,
            completed: true,
            current: false,
            completedAt: '2025-08-21'
          },
          {
            id: '2',
            name: 'Simple Components',
            description: 'Migrate atoms and molecules',
            targetCompliance: 80,
            filesNeeded: 15,
            completed: true,
            current: false,
            completedAt: '2025-08-22'
          },
          {
            id: '3',
            name: 'Complex Components',
            description: 'Migrate organisms and pages',
            targetCompliance: 90,
            filesNeeded: 10,
            completed: false,
            current: true
          },
          {
            id: '4',
            name: 'Target Compliance',
            description: 'Reach 95% compliance target',
            targetCompliance: 95,
            filesNeeded: 4,
            completed: false,
            current: false
          }
        ],
        files: [
          {
            id: '1',
            path: 'apps/storybook/src/components/Pages/DashboardPage/v1.0.0/ui/DashboardPage.test.tsx',
            type: 'test',
            status: 'pending',
            complexity: 'complex',
            hasStories: true
          },
          {
            id: '2',
            path: 'apps/storybook/src/components/atoms/Button/v1.0.0/Button.test.tsx',
            type: 'test',
            status: 'completed',
            complexity: 'simple',
            hasStories: true,
            migratedAt: '2025-08-21',
            migratedBy: 'auto-migration'
          }
        ],
        tools: [
          {
            id: 'compliance-check',
            name: 'Compliance Checker',
            description: 'Analyze files for pattern compliance',
            command: 'npm run migration:check',
            lastRun: '2025-08-25T10:00:00Z',
            runCount: 47,
            successRate: 100
          }
        ]
      },
      {
        id: 'typescript-strict',
        name: 'TypeScript Strict Mode',
        description: 'Enable strict TypeScript checking across all files',
        status: 'pending',
        compliance: 45,
        target: 100,
        totalFiles: 250,
        filesCompliant: 112,
        filesRemaining: 138,
        startDate: '2025-09-01',
        elapsedTime: '0 days',
        timeEstimate: '2 weeks',
        eta: '2025-09-15',
        successRate: 0
      }
    ];
    return HttpResponse.json(responseData);
  }),

  // Get migration by ID
  http.get(createUrl('/api/migrations/:id'), async ({ params, request }) => {
    await delay(100);

    const mockMigration = {
      id: params.id,
      name: 'Test Migration',
      description: 'A test migration',
      status: 'in-progress',
      compliance: 75,
      target: 95,
      totalFiles: 20,
      filesCompliant: 15,
      filesRemaining: 5
    };
    return HttpResponse.json(mockMigration);
  }),

  // Get migration compliance report
  http.get(createUrl('/api/migrations/:id/compliance'), async ({ params, request }) => {
    await delay(100);

    const responseData = {
      timestamp: new Date().toISOString(),
      migrationId: params.id,
      summary: {
        total: 47,
        compliant: 28,
        nonCompliant: 5,
        needsStories: 9,
        exceptions: 5,
        complianceRate: 84.8
      },
      files: {
        compliant: [],
        nonCompliant: [],
        needsStories: [],
        exceptions: []
      },
      recommendations: [
        'Migrate 5 test files to portable stories pattern',
        'Create story files for 9 components before migrating tests',
        'Increase compliance rate from 84.8% to 95%'
      ],
      trends: [
        { date: '2025-08-20', complianceRate: 65, filesCompliant: 20, filesMigrated: 0 },
        { date: '2025-08-21', complianceRate: 70, filesCompliant: 22, filesMigrated: 2 },
        { date: '2025-08-24', complianceRate: 84.8, filesCompliant: 28, filesMigrated: 1 }
      ]
    };
    return HttpResponse.json(responseData);
  }),

  // Get migration history
  http.get(createUrl('/api/migrations/history'), async ({ params, request }) => {
    await delay(100);

    const responseData = [
      {
        id: '1',
        timestamp: '2025-08-25T10:00:00Z',
        type: 'success',
        message: 'Compliance check completed',
        details: 'Found 28 compliant files out of 33 applicable files',
        migrationId: 'portable-stories',
        changes: { before: 84.8, after: 84.8 }
      },
      {
        id: '2',
        timestamp: '2025-08-24T15:30:00Z',
        type: 'warning',
        message: 'Auto-migration partially successful',
        details: '5 files migrated, 7 files skipped due to complex patterns',
        migrationId: 'portable-stories',
        files: ['Button.test.tsx', 'Icon.test.tsx', 'Input.test.tsx'],
        changes: { before: 80, after: 84.8 }
      }
    ];
    return HttpResponse.json(responseData);
  }),

  // Start migration
  http.post(createUrl('/api/migrations/:id/start'), async ({ params, request }) => {
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),

  // Pause migration
  http.post(createUrl('/api/migrations/:id/pause'), async ({ params, request }) => {
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),

  // Run compliance check
  http.post(createUrl('/api/migrations/:id/check-compliance'), async ({ params, request }) => {
    await delay(100);

    const responseData = {
      timestamp: new Date().toISOString(),
      migrationId: params.id,
      summary: {
        total: 47,
        compliant: 28,
        nonCompliant: 5,
        complianceRate: 84.8
      }
    };
    return HttpResponse.json(responseData);
  }),

  // Run auto-migration
  http.post(createUrl('/api/migrations/:id/auto-migrate'), async ({ params, request }) => {
    await delay(100);

    const responseData = {
      migrationId: params.id,
      filesProcessed: 5,
      filesSuccessful: 3,
      filesFailed: 2,
      successRate: 60,
      results: [
        { file: 'Button.test.tsx', status: 'success' },
        { file: 'Input.test.tsx', status: 'success' },
        { file: 'ComplexPage.test.tsx', status: 'failed', reason: 'Complex patterns detected' }
      ]
    };
    return HttpResponse.json(responseData);
  }),

  // Export migration report
  http.get(createUrl('/api/migrations/:id/export'), async ({ params, request }) => {
    await delay(100);

    const responseData = {
      reportId: `${params.id}-export-${Date.now()}`,
      format: 'json',
      data: {
        migration: { id: params.id, status: 'in-progress' },
        compliance: { rate: 84.8, target: 95 },
        exportedAt: new Date().toISOString()
      }
    };
    return HttpResponse.json(responseData);
  }),

  // Dev interface endpoints
  http.get(createUrl('/api/dev-interface/apps'), async ({ params, request }) => {
    await delay(100);

    const responseData = [
      {
        id: 'platform',
        name: 'Platform App',
        port: 3000,
        status: 'running',
        pid: 12345,
        uptime: '2h 34m',
        lastRestart: '2025-08-26T08:00:00Z'
      },
      {
        id: 'storybook',
        name: 'Storybook',
        port: 6006,
        status: 'running',
        pid: 12346,
        uptime: '2h 32m',
        lastRestart: '2025-08-26T08:02:00Z'
      },
      {
        id: 'studio',
        name: 'Studio',
        port: 6007,
        status: 'stopped',
        pid: null,
        uptime: null,
        lastRestart: null
      }
    ];
    return HttpResponse.json(responseData);
  }),

  // Start app
  http.post(createUrl('/api/dev-interface/apps/:id/start'), async ({ params, request }) => {
    await delay(100);
    return HttpResponse.json({ status: 'starting', appId: params.id });
  }),

  // Stop app
  http.post(createUrl('/api/dev-interface/apps/:id/stop'), async ({ params, request }) => {
    await delay(100);
    return HttpResponse.json({ status: 'stopping', appId: params.id });
  }),

  // Restart app
  http.post(createUrl('/api/dev-interface/apps/:id/restart'), async ({ params, request }) => {
    await delay(100);
    return HttpResponse.json({ status: 'restarting', appId: params.id });
  }),

  // Get system resources
  http.get(createUrl('/api/dev-interface/resources'), async ({ params, request }) => {
    await delay(100);

    const responseData = {
      cpu: {
        usage: 45.2,
        cores: 8,
        loadAverage: [1.2, 1.5, 1.8]
      },
      memory: {
        used: 6.2,
        total: 16,
        percentage: 38.75
      },
      disk: {
        used: 124.5,
        total: 500,
        percentage: 24.9
      },
      network: {
        rx: 1024000,
        tx: 512000
      },
      timestamp: new Date().toISOString()
    };
    return HttpResponse.json(responseData);
  }),

  // Get file list
  http.get(createUrl('/api/dev-interface/files'), async ({ params, request }) => {
    await delay(100);

    const responseData = {
      files: [
        {
          path: '/src/components/atoms/Button',
          type: 'directory',
          size: null,
          modified: '2025-08-25T10:00:00Z'
        },
        {
          path: '/src/components/atoms/Button/Button.tsx',
          type: 'file',
          size: 2048,
          modified: '2025-08-25T09:30:00Z'
        },
        {
          path: '/src/components/atoms/Button/Button.test.tsx',
          type: 'file',
          size: 1024,
          modified: '2025-08-25T09:15:00Z'
        }
      ],
      totalFiles: 1247,
      totalDirectories: 156
    };
    return HttpResponse.json(responseData);
  }),

  // Get file content
  http.get(createUrl('/api/dev-interface/files/content'), async ({ params, request }) => {
    await delay(100);

    const url = new URL(request.url);
    const filePath = url.searchParams.get('path') || '';
    
    const responseData = {
      path: filePath,
      content: `// Mock file content for ${filePath}\nexport default function Component() {\n  return <div>Hello World</div>;\n}`,
      language: 'typescript',
      size: 120,
      lastModified: '2025-08-25T10:00:00Z'
    };
    return HttpResponse.json(responseData);
  }),

  // Search files
  http.get(createUrl('/api/dev-interface/files/search'), async ({ params, request }) => {
    await delay(100);

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    const responseData = {
      query,
      results: [
        {
          path: '/src/components/atoms/Button/Button.tsx',
          matches: [
            {
              line: 5,
              column: 10,
              text: `export default function Button() {`,
              context: 'Component definition'
            }
          ]
        }
      ],
      totalMatches: 1,
      searchTime: 45
    };
    return HttpResponse.json(responseData);
  }),

  // Kill process
  http.post(createUrl('/api/dev-interface/processes/:pid/kill'), async ({ params, request }) => {
    await delay(100);
    return HttpResponse.json({ status: 'killed', pid: params.pid });
  }),

  // Dev interface chat (AI assistant)
  http.post(createUrl('/api/dev-interface/chat'), async ({ params, request }) => {
    await delay(100);

    const requestBody = await request.json().catch(() => ({}));
    
    const responseData = {
      id: `msg-${Date.now()}`,
      message: `Mock AI response to: "${requestBody.message || 'Hello'}"`,
      timestamp: new Date().toISOString(),
      type: 'assistant'
    };
    return HttpResponse.json(responseData);
  }),

  // Module endpoints
  http.get(createUrl('/api/modules'), async ({ params, request }) => {
    await delay(100);

    const responseData = [
      {
        id: 'button-v1',
        name: 'Button',
        version: '1.0.0',
        type: 'atom',
        status: 'active',
        path: '/src/components/atoms/Button/v1.0.0',
        description: 'Basic button component',
        dependencies: [],
        exports: ['Button', 'ButtonProps'],
        createdAt: '2025-08-20T10:00:00Z',
        updatedAt: '2025-08-25T09:30:00Z'
      },
      {
        id: 'dashboard-page-v1',
        name: 'DashboardPage',
        version: '1.0.0',
        type: 'page',
        status: 'active',
        path: '/src/components/Pages/DashboardPage/v1.0.0',
        description: 'Main dashboard page component',
        dependencies: ['button-v1', 'card-v1'],
        exports: ['DashboardPage', 'useDashboard'],
        createdAt: '2025-08-20T10:00:00Z',
        updatedAt: '2025-08-25T11:15:00Z'
      }
    ];
    return HttpResponse.json(responseData);
  }),

  // Get module by ID
  http.get(createUrl('/api/modules/:id'), async ({ params, request }) => {
    await delay(100);

    const responseData = {
      id: params.id,
      name: 'Test Module',
      version: '1.0.0',
      type: 'component',
      status: 'active',
      path: `/src/components/test/${params.id}`,
      description: 'A test module',
      dependencies: [],
      exports: ['TestComponent'],
      createdAt: '2025-08-20T10:00:00Z',
      updatedAt: '2025-08-25T10:00:00Z'
    };
    return HttpResponse.json(responseData);
  }),

];

// Helper function for filtering data based on query parameters
function generateFilteredData(allItems: any[], filters: Record<string, string>) {
  let filteredItems = allItems;
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'page' || key === 'limit') return; // Skip pagination params
    
    filteredItems = filteredItems.filter(item => {
      if (key === 'status' && item.status) {
        return item.status === value;
      }
      if (key === 'authoritative' && item.authoritative !== undefined) {
        return String(item.authoritative) === value;
      }
      if (key === 'search' && (item.title || item.name)) {
        const searchText = (item.title || item.name).toLowerCase();
        return searchText.includes(value.toLowerCase());
      }
      if (key === 'version' && item.version) {
        return item.version.includes(value);
      }
      if (key === 'type' && item.type) {
        return item.type === value;
      }
      return true;
    });
  });
  
  return filteredItems;
}

export default handlers;
