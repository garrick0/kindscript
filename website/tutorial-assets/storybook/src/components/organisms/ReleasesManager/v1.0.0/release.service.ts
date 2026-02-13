import type { Release, ReleaseData } from './release.types';

export class ReleaseService {
  constructor(private apiUrl: string = '/api/releases') {}

  async getReleases(): Promise<Release[]> {
    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch releases');
    }
    return response.json();
  }


  async getRelease(id: string): Promise<Release> {
    const response = await fetch(`${this.apiUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch release');
    }
    return response.json();
  }

  async createRelease(data: ReleaseData): Promise<Release> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create release');
    }
    return response.json();
  }

  async create(data: ReleaseData): Promise<Release> {
    return this.createRelease(data);
  }

  async updateRelease(id: string, data: Partial<ReleaseData>): Promise<Release> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update release');
    }
    return response.json();
  }

  async update(data: { id: string } & Partial<ReleaseData>): Promise<Release> {
    const { id, ...updateData } = data;
    return this.updateRelease(id, updateData);
  }

  async deleteRelease(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete release');
    }
  }

  async publishRelease(id: string): Promise<Release> {
    const response = await fetch(`${this.apiUrl}/${id}/publish`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to publish release');
    }
    return response.json();
  }

  async publish(id: string): Promise<Release> {
    return this.publishRelease(id);
  }

  // Add missing methods for tests
  async getById(id: string): Promise<Release> {
    return this.getRelease(id);
  }

  async delete(id: string): Promise<void> {
    return this.deleteRelease(id);
  }

  // Add method with filters support
  async getAll(filters?: any): Promise<Release[]> {
    let url = this.apiUrl;
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      if (params.toString()) {
        url += `?${params}`;
      }
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch releases');
    }
    return response.json();
  }

  async archiveRelease(id: string): Promise<Release> {
    const response = await fetch(`${this.apiUrl}/${id}/archive`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to archive release');
    }
    return response.json();
  }

  async archive(id: string): Promise<Release> {
    return this.archiveRelease(id);
  }

  async duplicate(id: string): Promise<Release> {
    const response = await fetch(`${this.apiUrl}/${id}/duplicate`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to duplicate release');
    }
    return response.json();
  }
}