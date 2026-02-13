export interface ReleaseManifest {
  id: string
  name: string
  version: string
  description: string
  pages: Record<string, any>
  navigation: {
    sections: Record<string, string[]>
  }
  statistics: {
    totalPages: number
    completedPages: number
    inProgressPages: number
    byPriority?: Record<string, number>
    bySection?: Record<string, number>
  }
}

export interface Release {
  id: string
  name: string
  description?: string
  status: 'draft' | 'published' | 'archived'
  version: string
  pages?: PageReference[]
  manifest?: ReleaseManifest
  metadata?: {
    tags?: string[]
    author?: string
    authoritative?: boolean
  }
  created_at: string
  updated_at: string
  published_at?: string
  created_by?: string
}

export interface PageReference {
  id: string
  path: string
  version: string
  title?: string
}

export interface ReleaseData {
  name: string
  description?: string
  status?: 'draft' | 'published' | 'archived'
  version?: string
  pages?: PageReference[]
  manifest?: ReleaseManifest
  metadata?: Record<string, any>
}

export interface ReleaseFilters {
  status?: 'all' | 'draft' | 'published' | 'archived'
  search?: string
  tags?: string[]
  author?: string
  page?: number
  version?: string
}

export type FilterState = ReleaseFilters

// Input types for creating and updating releases
export interface CreateReleaseInput {
  name: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  version?: string;
  pages?: PageReference[];
  metadata?: Record<string, any>;
}

export interface UpdateReleaseInput extends Partial<CreateReleaseInput> {
  id: string;
}