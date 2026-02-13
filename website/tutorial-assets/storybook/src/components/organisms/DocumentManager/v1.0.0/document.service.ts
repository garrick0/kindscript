import type { Document, DocumentFilters, DocumentVersion, Collaborator } from './document.types';

export interface DocumentCreateInput {
  title: string;
  content: string;
  type?: string;
  status?: 'draft' | 'review' | 'published' | 'archived';
  tags?: string[];
  authoritative?: boolean;
  metadata?: {
    version: string;
    lastModified: string;
    author: string;
    tags?: string[];
  };
}

export interface DocumentUpdateInput extends Partial<DocumentCreateInput> {
  id: string;
}

export class DocumentService {
  constructor(private apiUrl: string = '/api/documents') {}

  async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(`${this.apiUrl}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }
    return response.json();
  }

  async getDocument(id: string): Promise<Document> {
    const response = await fetch(`${this.apiUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }
    return response.json();
  }

  async createDocument(data: DocumentCreateInput): Promise<Document> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create document');
    }
    return response.json();
  }

  async updateDocument(id: string, data: Partial<DocumentUpdateInput>): Promise<Document> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update document');
    }
    return response.json();
  }

  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  }

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const response = await fetch(`${this.apiUrl}/${documentId}/versions`);
    if (!response.ok) {
      throw new Error('Failed to fetch versions');
    }
    return response.json();
  }

  async getCollaborators(documentId: string): Promise<Collaborator[]> {
    const response = await fetch(`${this.apiUrl}/${documentId}/collaborators`);
    if (!response.ok) {
      throw new Error('Failed to fetch collaborators');
    }
    return response.json();
  }

  async shareDocument(documentId: string, email: string, permission: 'read' | 'write' | 'admin'): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${documentId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, permission }),
    });
    if (!response.ok) {
      throw new Error('Failed to share document');
    }
  }

  async publishDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${this.apiUrl}/${documentId}/publish`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to publish document');
    }
    return response.json();
  }

  async archiveDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${this.apiUrl}/${documentId}/archive`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to archive document');
    }
    return response.json();
  }

  async restoreVersion(documentId: string, versionId: string): Promise<Document> {
    const response = await fetch(`${this.apiUrl}/${documentId}/versions/${versionId}/restore`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to restore version');
    }
    return response.json();
  }

  async addCollaborator(documentId: string, email: string, role: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${documentId}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    if (!response.ok) {
      throw new Error('Failed to add collaborator');
    }
  }

  async removeCollaborator(documentId: string, collaboratorId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${documentId}/collaborators/${collaboratorId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove collaborator');
    }
  }
}
