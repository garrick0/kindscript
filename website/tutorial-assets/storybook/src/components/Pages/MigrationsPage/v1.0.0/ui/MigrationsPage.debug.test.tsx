/**
 * Debug test to understand the fetch issue
 */

import { describe, it, expect, vi } from 'vitest';
import { MigrationService } from '../data/migration.service';

describe.skip('MigrationsPage Debug', () => {
  it('should debug fetch behavior', async () => {
    const service = new MigrationService();
    
    // Check if global fetch has been overridden
    console.log('Global fetch:', global.fetch.toString().slice(0, 200));
    
    // Spy on global fetch to see what's happening
    const fetchSpy = vi.spyOn(global, 'fetch');
    
    // First test the direct relative URL
    console.log('\nTesting direct relative URL fetch...');
    try {
      const relativeResponse = await fetch('/api/migrations');
      console.log('Relative URL status:', relativeResponse.status);
      console.log('Relative URL statusText:', relativeResponse.statusText);
      if (!relativeResponse.ok) {
        const text = await relativeResponse.text();
        console.log('Error response body:', text);
      }
    } catch (e) {
      console.error('Direct relative fetch error:', e);
    }
    
    // Check what URL the service is generating
    console.log('\ntypeof window:', typeof window);
    console.log('Service URL will be:', typeof window === 'undefined' 
      ? 'http://localhost/api/migrations' 
      : '/api/migrations');
    
    try {
      console.log('\nCalling service.getMigrations()...');
      const result = await service.getMigrations();
      console.log('Success! Got migrations:', result.length);
    } catch (error) {
      console.error('Error from service:', error);
    }
    
    // Check what fetch was called with
    if (fetchSpy.mock.calls.length > 0) {
      console.log('Fetch was called with:', fetchSpy.mock.calls[0]);
      const [url, options] = fetchSpy.mock.calls[0];
      console.log('URL type:', typeof url);
      console.log('URL value:', url);
      
      // Try fetching directly with the modified URL
      console.log('\nTrying direct fetch with http://localhost prefix...');
      const directResponse = await fetch('http://localhost/api/migrations');
      console.log('Direct fetch status:', directResponse.status);
      const directData = await directResponse.json();
      console.log('Direct fetch data length:', Array.isArray(directData) ? directData.length : 'not array');
    }
    
    fetchSpy.mockRestore();
  });
});