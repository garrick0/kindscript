import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Document, DocumentFilters, DocumentVersion, Collaborator } from './document.types';
import { useServices } from '../../../../providers/ServiceProvider';
// Removed Supabase import - handled by backend

interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: Error | null;
  filters: DocumentFilters;
  selectedDocument: Document | null;
  versions: DocumentVersion[];
  collaborators: Collaborator[];
  actions: {
    setFilters: (filters: DocumentFilters) => void;
    selectDocument: (id: string | null) => void;
    createDocument: (data: Partial<Document>) => Promise<Document>;
    updateDocument: (id: string, data: Partial<Document>) => Promise<Document>;
    deleteDocument: (id: string) => Promise<void>;
    publishDocument: (id: string) => Promise<Document>;
    archiveDocument: (id: string) => Promise<Document>;
    loadVersions: (documentId: string) => Promise<void>;
    restoreVersion: (documentId: string, versionId: string) => Promise<Document>;
    loadCollaborators: (documentId: string) => Promise<void>;
    addCollaborator: (documentId: string, email: string, role: string) => Promise<void>;
    removeCollaborator: (documentId: string, collaboratorId: string) => Promise<void>;
    refetch: () => Promise<void>;
  };
}

// Optimistic document mutations
export function useOptimisticCreateDocument() {
  const queryClient = useQueryClient();
  const { documents: documentService } = useServices();

  return useMutation({
    mutationFn: async (document: Partial<Document>) => {
      if (!documentService) throw new Error('Document service not available');
      return documentService.createDocument({
        title: document.title || '',
        content: document.content || '',
        status: document.status,
        authoritative: document.authoritative,
        metadata: document.metadata,
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      const previousDocuments = queryClient.getQueryData(['documents']);
      
      const optimisticDoc = {
        id: `temp-${Date.now()}`,
        ...variables,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        document_versions: [],
      };

      queryClient.setQueryData(['documents'], (old: Document[] = []) => [
        optimisticDoc as Document,
        ...old,
      ]);

      return { previousDocuments };
    },
    onError: (error, variables, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents'], context.previousDocuments);
      }
      console.error('Failed to create document:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useOptimisticUpdateDocument() {
  const queryClient = useQueryClient();
  const { documents: documentService } = useServices();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Document> }) => {
      if (!documentService) throw new Error('Document service not available');
      return documentService.updateDocument(id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      await queryClient.cancelQueries({ queryKey: ['document', id] });
      
      const previousDocuments = queryClient.getQueryData(['documents']);
      const previousDocument = queryClient.getQueryData(['document', id]);

      queryClient.setQueryData(['documents'], (old: Document[] = []) =>
        old.map(doc => 
          doc.id === id 
            ? { ...doc, ...data, updated_at: new Date().toISOString() }
            : doc
        )
      );

      queryClient.setQueryData(['document', id], (old: Document) =>
        old ? { ...old, ...data, updated_at: new Date().toISOString() } : old
      );

      return { previousDocuments, previousDocument };
    },
    onError: (error, variables, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents'], context.previousDocuments);
      }
      if (context?.previousDocument) {
        queryClient.setQueryData(['document', variables.id], context.previousDocument);
      }
      console.error('Failed to update document:', error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
    },
  });
}

export function useOptimisticDeleteDocument() {
  const queryClient = useQueryClient();
  const { documents: documentService } = useServices();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!documentService) throw new Error('Document service not available');
      return documentService.deleteDocument(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      const previousDocuments = queryClient.getQueryData(['documents']);

      queryClient.setQueryData(['documents'], (old: Document[] = []) =>
        old.filter(doc => doc.id !== id)
      );

      return { previousDocuments };
    },
    onError: (error, variables, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents'], context.previousDocuments);
      }
      console.error('Failed to delete document:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// Document collaboration with realtime updates
export function useDocumentCollaboration(documentId?: string, supabase?: any) {
  const [isConnected, setIsConnected] = useState(false);
  const [documentUpdates, setDocumentUpdates] = useState<any[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase || !documentId) return;

    let channel: any; // RealtimeChannel type from Supabase

    const setupChannel = () => {
      channel = supabase
        .channel(`document:${documentId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'documents',
            filter: `id=eq.${documentId}`,
          },
          (payload: any) => {
            console.log('Document realtime event:', payload);
            setDocumentUpdates(prev => [...prev, { type: payload.eventType, ...payload }]);
            
            // Invalidate React Query caches
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['document', documentId] });
          }
        )
        .subscribe((status: any) => {
          console.log('Document realtime subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        setIsConnected(false);
      }
    };
  }, [documentId, supabase, queryClient]);

  return {
    isConnected,
    documentUpdates,
  };
}

export function useDocuments(initialFilters?: DocumentFilters): UseDocumentsReturn {
  const { documents: documentService } = useServices();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>(initialFilters || {});
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const fetchDocuments = useCallback(async () => {
    if (!documentService) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await documentService.getDocuments(filters);
      setDocuments(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, [documentService, filters]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const selectDocument = useCallback(async (id: string | null) => {
    if (!id) {
      setSelectedDocument(null);
      setVersions([]);
      setCollaborators([]);
      return;
    }

    if (!documentService) return;

    try {
      const doc = await documentService.getDocument(id);
      setSelectedDocument(doc);
    } catch (err) {
      console.error('Failed to select document:', err);
      setError(err as Error);
    }
  }, [documentService]);

  const createDocument = useCallback(async (data: Partial<Document>): Promise<Document> => {
    if (!documentService) throw new Error('Document service not available');

    const createData = {
      title: data.title || 'Untitled',
      content: data.content || '',
      status: data.status,
      authoritative: data.authoritative,
      metadata: data.metadata,
    };
    const newDoc = await documentService.createDocument(createData);
    await fetchDocuments();
    return newDoc;
  }, [documentService, fetchDocuments]);

  const updateDocument = useCallback(async (id: string, data: Partial<Document>): Promise<Document> => {
    if (!documentService) throw new Error('Document service not available');

    const updatedDoc = await documentService.updateDocument(id, data);
    await fetchDocuments();
    if (selectedDocument?.id === id) {
      setSelectedDocument(updatedDoc);
    }
    return updatedDoc;
  }, [documentService, fetchDocuments, selectedDocument]);

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    if (!documentService) throw new Error('Document service not available');

    await documentService.deleteDocument(id);
    await fetchDocuments();
    if (selectedDocument?.id === id) {
      setSelectedDocument(null);
    }
  }, [documentService, fetchDocuments, selectedDocument]);

  const publishDocument = useCallback(async (id: string): Promise<Document> => {
    if (!documentService) throw new Error('Document service not available');

    const doc = await documentService.publishDocument(id);
    await fetchDocuments();
    if (selectedDocument?.id === id) {
      setSelectedDocument(doc);
    }
    return doc;
  }, [documentService, fetchDocuments, selectedDocument]);

  const archiveDocument = useCallback(async (id: string): Promise<Document> => {
    if (!documentService) throw new Error('Document service not available');

    const doc = await documentService.archiveDocument(id);
    await fetchDocuments();
    if (selectedDocument?.id === id) {
      setSelectedDocument(doc);
    }
    return doc;
  }, [documentService, fetchDocuments, selectedDocument]);

  const loadVersions = useCallback(async (documentId: string): Promise<void> => {
    if (!documentService) return;

    try {
      const versionList = await documentService.getVersions(documentId);
      setVersions(versionList);
    } catch (err) {
      console.error('Failed to load versions:', err);
      setError(err as Error);
    }
  }, [documentService]);

  const restoreVersion = useCallback(async (documentId: string, versionId: string): Promise<Document> => {
    if (!documentService) throw new Error('Document service not available');

    const doc = await documentService.restoreVersion(documentId, versionId);
    await fetchDocuments();
    if (selectedDocument?.id === documentId) {
      setSelectedDocument(doc);
    }
    return doc;
  }, [documentService, fetchDocuments, selectedDocument]);

  const loadCollaborators = useCallback(async (documentId: string): Promise<void> => {
    if (!documentService) return;

    try {
      const collabs = await documentService.getCollaborators(documentId);
      setCollaborators(collabs);
    } catch (err) {
      console.error('Failed to load collaborators:', err);
      setError(err as Error);
    }
  }, [documentService]);

  const addCollaborator = useCallback(async (documentId: string, email: string, role: string): Promise<void> => {
    if (!documentService) throw new Error('Document service not available');

    await documentService.addCollaborator(documentId, email, role);
    await loadCollaborators(documentId);
  }, [documentService, loadCollaborators]);

  const removeCollaborator = useCallback(async (documentId: string, collaboratorId: string): Promise<void> => {
    if (!documentService) throw new Error('Document service not available');

    await documentService.removeCollaborator(documentId, collaboratorId);
    await loadCollaborators(documentId);
  }, [documentService, loadCollaborators]);

  return {
    documents,
    loading,
    error,
    filters,
    selectedDocument,
    versions,
    collaborators,
    actions: {
      setFilters,
      selectDocument,
      createDocument,
      updateDocument,
      deleteDocument,
      publishDocument,
      archiveDocument,
      loadVersions,
      restoreVersion,
      loadCollaborators,
      addCollaborator,
      removeCollaborator,
      refetch: fetchDocuments
    }
  };
}