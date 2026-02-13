// Document types
export interface Document {
  id: string;
  title: string;
  content: string;
  authoritative: boolean;
  metadata?: {
    version: string;
    lastModified: string;
    author: string;
    tags?: string[];
  };
  collaborators?: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  content: string;
  changes?: string;
  author: string;
  createdAt: string;
}

export interface DocumentFilters {
  status?: string;
  authoritative?: boolean;
  author?: string;
  tags?: string[];
  search?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'viewer' | 'editor' | 'owner';
  active?: boolean;
}

// Input types for creating and updating documents
export interface CreateDocumentInput {
  title: string;
  content: string;
  authoritative?: boolean;
  metadata?: {
    version?: string;
    author: string;
    tags?: string[];
  };
  collaborators?: string[];
  status?: 'draft' | 'review' | 'published' | 'archived';
}