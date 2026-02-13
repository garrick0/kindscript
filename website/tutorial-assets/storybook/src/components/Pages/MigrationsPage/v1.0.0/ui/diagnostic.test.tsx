import { describe, it, expect, beforeAll, vi } from 'vitest';
import { handlers } from '../../../../../mocks/generated/handlers';

describe('MSW Diagnostic Test', () => {
  it('should show what handlers are registered', () => {
    console.log('Total handlers registered:', handlers.length);
    
    // Find migration handlers
    const migrationHandlers = handlers.filter(h => {
      const info = (h as any).info;
      return info?.path?.includes('migrations');
    });
    
    console.log('Migration handlers found:', migrationHandlers.length);
    migrationHandlers.forEach(h => {
      const info = (h as any).info;
      console.log(`  - ${info?.method} ${info?.path}`);
    });
    
    expect(handlers.length).toBeGreaterThan(0);
    expect(migrationHandlers.length).toBeGreaterThan(0);
  });

  it('should test direct fetch to /api/migrations', async () => {
    console.log('Testing fetch to /api/migrations...');
    
    try {
      const response = await fetch('http://localhost:3000/api/migrations');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('Response text:', text);
      
      if (response.ok) {
        const data = JSON.parse(text);
        console.log('Parsed data:', JSON.stringify(data, null, 2));
        expect(data).toBeDefined();
      } else {
        console.error('Response not OK:', response.status, text);
      }
      
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Fetch failed:', error);
      throw error;
    }
  });

  it('should check if MSW is intercepting requests', async () => {
    // Create a spy to track fetch calls
    const originalFetch = global.fetch;
    const fetchSpy = vi.fn(originalFetch);
    global.fetch = fetchSpy;
    
    try {
      await fetch('http://localhost:3000/api/migrations');
      
      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3000/api/migrations');
      console.log('Fetch was called with:', fetchSpy.mock.calls[0]);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should test what MigrationService.getMigrations returns', async () => {
    const { MigrationService } = await import('../data/migration.service');
    const service = new MigrationService();
    
    console.log('Testing MigrationService.getMigrations()...');
    
    try {
      const result = await service.getMigrations();
      console.log('Service returned:', result);
      console.log('Result length:', result?.length);
      console.log('First item:', result?.[0]);
      
      expect(result).toBeDefined();
    } catch (error) {
      console.error('Service call failed:', error);
      throw error;
    }
  });

  it('should inspect handler structure', () => {
    const firstHandler = handlers[0];
    console.log('First handler structure:', {
      type: typeof firstHandler,
      keys: Object.keys(firstHandler),
      info: (firstHandler as any).info,
      resolver: typeof (firstHandler as any).resolver
    });
    
    // Find GET /api/migrations handler specifically
    const migrationHandler = handlers.find(h => {
      const info = (h as any).info;
      return info?.method === 'GET' && info?.path === 'http://localhost:3000/api/migrations';
    });
    
    if (migrationHandler) {
      console.log('GET /api/migrations handler found:', migrationHandler);
      console.log('Handler info:', (migrationHandler as any).info);
    } else {
      console.error('GET /api/migrations handler NOT found!');
      
      // List all GET handlers
      const getHandlers = handlers.filter(h => (h as any).info?.method === 'GET');
      console.log('All GET handlers:');
      getHandlers.forEach(h => {
        const info = (h as any).info;
        console.log(`  - ${info?.path}`);
      });
    }
  });
});