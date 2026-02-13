import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';

/**
 * Override handlers for specific story variations
 * These can be used in stories to override default mock behavior
 */

// Error state handlers
export const errorHandlers: RequestHandler[] = [
  http.get('/api/documents', () => {
    return HttpResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }),
  
  http.get('/api/releases', () => {
    return HttpResponse.json(
      { error: 'Failed to fetch releases' },
      { status: 500 }
    );
  }),
  
  http.get('/api/settings/:userId', () => {
    return HttpResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }),
  
  http.get('/api/dashboard', () => {
    return HttpResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }),
];

// Loading state handlers (delayed response)
export const loadingHandlers: RequestHandler[] = [
  http.get('/api/documents', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return HttpResponse.json([]);
  }),
  
  http.get('/api/releases', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return HttpResponse.json([]);
  }),
  
  http.get('/api/settings/:userId', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return HttpResponse.json({});
  }),
  
  http.get('/api/dashboard', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return HttpResponse.json({ stats: [], recentActivity: [] });
  }),
];

// Empty state handlers
export const emptyHandlers: RequestHandler[] = [
  http.get('/api/documents', () => {
    return HttpResponse.json([]);
  }),
  
  http.get('/api/releases', () => {
    return HttpResponse.json([]);
  }),
  
  http.get('/api/dashboard/activity', () => {
    return HttpResponse.json([]);
  }),
  
  http.get('/api/dashboard/quick-actions', () => {
    return HttpResponse.json([]);
  }),
  
  http.get('/api/dashboard/notifications', () => {
    return HttpResponse.json([]);
  }),
];

// Dashboard handlers with proper data structure
export const dashboardHandlers: RequestHandler[] = [
  http.get('/api/dashboard/stats', () => {
    return HttpResponse.json({
      documents: 42,
      releases: 3, 
      pages: 8,
      workflows: 5
    });
  }),
  
  http.get('/api/dashboard/activity', () => {
    return HttpResponse.json([
      {
        id: '1',
        type: 'document',
        action: 'created document',
        target: 'New Project Proposal',
        user: 'John Doe',
        timestamp: new Date().toISOString()
      }
    ]);
  }),
  
  http.get('/api/dashboard/quick-actions', () => {
    return HttpResponse.json([
      { id: 'create-document', title: 'Create Document', color: 'blue' },
      { id: 'generate-page', title: 'Generate Page', color: 'green' },
      { id: 'start-workflow', title: 'Start Workflow', color: 'purple' }
    ]);
  }),
  
  http.get('/api/dashboard/notifications', () => {
    return HttpResponse.json([]);
  }),
];

// Network error handlers
export const networkErrorHandlers: RequestHandler[] = [
  http.get('/api/*', () => {
    return HttpResponse.error();
  }),
];

// Named exports for story compatibility
export const documentHandlers = [
  http.get('/api/documents', () => HttpResponse.json([])),
  http.post('/api/documents', () => HttpResponse.json({ id: '1', title: 'New Document' })),
];

export const releaseHandlers = [
  http.get('/api/releases', () => HttpResponse.json([])),
  http.post('/api/releases', () => HttpResponse.json({ id: '1', title: 'New Release' })),
];

export const delayHandlers = loadingHandlers;

export const authHandlers = [
  http.get('/api/auth/session', () => HttpResponse.json({ user: { name: 'Test User', email: 'test@example.com' } })),
];

export const settingsHandlers = [
  http.get('/api/settings/:userId', () => HttpResponse.json({ theme: 'light', notifications: true })),
];

export default {
  error: errorHandlers,
  loading: loadingHandlers,
  empty: emptyHandlers,
  networkError: networkErrorHandlers,
};