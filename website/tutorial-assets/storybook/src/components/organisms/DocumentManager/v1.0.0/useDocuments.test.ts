import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentService } from './document.service';
import type { Document, DocumentFilters } from './document.types';

describe('DocumentService', () => {
  let service: DocumentService;
  
  beforeEach(() => {
    service = new DocumentService();
    vi.clearAllMocks();
  });

  it('should fetch documents with filters', async () => {
    const filters: DocumentFilters = { status: 'published' };
    const documents = await service.getDocuments(filters);
    
    expect(Array.isArray(documents)).toBe(true);
    expect(documents.length).toBeGreaterThan(0);
    
    // Check that all returned documents match the filter
    documents.forEach((doc: Document) => {
      expect(doc.status).toBe('published');
    });
  });

  it('should fetch documents without filters', async () => {
    const documents = await service.getDocuments();
    
    expect(Array.isArray(documents)).toBe(true);
    expect(documents.length).toBeGreaterThan(0);
  });

  it('should fetch single document by ID', async () => {
    // First get all documents to get a valid ID
    const documents = await service.getDocuments();
    const firstDocument = documents[0];
    
    const document = await service.getDocument(firstDocument.id);
    
    expect(document).toBeDefined();
    expect(document.id).toBe(firstDocument.id);
    expect(document.title).toBeDefined();
  });

  it('should create a new document', async () => {
    const newDoc = {
      title: 'Test Document',
      content: 'Test content',
      status: 'draft' as const
    };
    
    const createdDoc = await service.createDocument(newDoc);
    
    expect(createdDoc).toBeDefined();
    expect(createdDoc.title).toBe(newDoc.title);
    expect(createdDoc.content).toBe(newDoc.content);
    expect(createdDoc.status).toBe(newDoc.status);
    expect(createdDoc.id).toBeDefined();
  });

  it('should update a document', async () => {
    // First create a document
    const newDoc = await service.createDocument({
      title: 'Test Document',
      content: 'Test content',
      status: 'draft'
    });
    
    const updatedData = {
      id: newDoc.id,
      title: 'Updated Test Document',
      content: 'Updated content'
    };
    
    const updatedDoc = await service.updateDocument(updatedData.id, updatedData);
    
    expect(updatedDoc.title).toBe(updatedData.title);
    expect(updatedDoc.content).toBe(updatedData.content);
  });

  it('should filter authoritative documents', async () => {
    const filters: DocumentFilters = { authoritative: true };
    const documents = await service.getDocuments(filters);
    
    documents.forEach((doc: Document) => {
      expect(doc.authoritative).toBe(true);
    });
  });
});