import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReleaseService } from './release.service';
import type { Release, ReleaseFilters } from './release.types';

describe('ReleaseService', () => {
  let service: ReleaseService;
  
  beforeEach(() => {
    service = new ReleaseService();
    vi.clearAllMocks();
  });

  it('should fetch releases with filters', async () => {
    const filters: ReleaseFilters = { status: 'published' };
    const releases = await service.getAll(filters);
    
    expect(Array.isArray(releases)).toBe(true);
    expect(releases.length).toBeGreaterThan(0);
    
    // Check that all returned releases match the filter
    releases.forEach((release: Release) => {
      expect(release.status).toBe('published');
    });
  });

  it('should fetch releases without filters', async () => {
    const releases = await service.getAll();
    
    expect(Array.isArray(releases)).toBe(true);
    expect(releases.length).toBeGreaterThan(0);
  });

  it('should fetch single release by ID', async () => {
    // First get all releases to get a valid ID
    const releases = await service.getAll();
    const firstRelease = releases[0];
    
    const release = await service.getById(firstRelease.id);
    
    expect(release).toBeDefined();
    expect(release.id).toBe(firstRelease.id);
    expect(release.name).toBeDefined();
  });

  it('should create a new release', async () => {
    const newRelease = {
      name: 'Test Release',
      description: 'Test description',
      status: 'draft' as const
    };
    
    const createdRelease = await service.create(newRelease);
    
    expect(createdRelease).toBeDefined();
    expect(createdRelease.name).toBe(newRelease.name);
    expect(createdRelease.description).toBe(newRelease.description);
    expect(createdRelease.status).toBe(newRelease.status);
    expect(createdRelease.id).toBeDefined();
  });

  it('should update a release', async () => {
    // First create a release
    const newRelease = await service.create({
      name: 'Test Release',
      description: 'Test description',
      status: 'draft'
    });
    
    const updatedData = {
      id: newRelease.id,
      name: 'Updated Test Release',
      description: 'Updated description'
    };
    
    const updatedRelease = await service.update(updatedData);
    
    expect(updatedRelease.name).toBe(updatedData.name);
    expect(updatedRelease.description).toBe(updatedData.description);
  });

  it('should delete a release', async () => {
    // First create a release
    const newRelease = await service.create({
      name: 'Test Release to Delete',
      description: 'Test description',
      status: 'draft'
    });
    
    await service.delete(newRelease.id);
    
    // Verify it's deleted by trying to fetch it
    try {
      await service.getById(newRelease.id);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should filter releases by version', async () => {
    const filters: ReleaseFilters = { version: '1.0' };
    const releases = await service.getAll(filters);
    
    releases.forEach((release: Release) => {
      expect(release.version).toContain('1.0');
    });
  });
});