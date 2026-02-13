import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as storage from '@/lib/tutorial/storage';
import type { LessonFile } from '@/lib/lessons/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// Setup global mocks
beforeEach(() => {
  localStorageMock.clear();
  global.localStorage = localStorageMock as unknown as Storage;
  global.window = { localStorage: localStorageMock } as unknown as Window & typeof globalThis;
});

describe('storage module', () => {
  const mockFiles: LessonFile[] = [
    { path: 'src/index.ts', contents: 'export const x = 1;' },
    { path: 'src/utils.ts', contents: 'export const y = 2;' },
  ];

  describe('autoSave', () => {
    it('should save files to localStorage', () => {
      storage.autoSave('test-lesson', mockFiles, 'src/index.ts');

      const saved = localStorage.getItem('ks:tutorial:test-lesson:auto');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.version).toBe(1);
      expect(parsed.lessonSlug).toBe('test-lesson');
      expect(parsed.slotName).toBeNull();
      expect(parsed.files).toEqual(mockFiles);
      expect(parsed.activeFile).toBe('src/index.ts');
      expect(parsed.timestamp).toBeTypeOf('number');
    });

    it('should overwrite previous auto-save', () => {
      storage.autoSave('test-lesson', mockFiles, 'src/index.ts');

      const newFiles = [{ path: 'src/new.ts', contents: 'new' }];
      storage.autoSave('test-lesson', newFiles, 'src/new.ts');

      const saved = storage.loadAutoSave('test-lesson');
      expect(saved?.files).toEqual(newFiles);
      expect(saved?.activeFile).toBe('src/new.ts');
    });

    it('should handle errors gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Temporarily replace setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        storage.autoSave('test-lesson', mockFiles, 'src/index.ts');
      }).not.toThrow();

      expect(consoleWarn).toHaveBeenCalledWith('Failed to auto-save:', expect.any(Error));

      // Restore
      localStorage.setItem = originalSetItem;
      consoleWarn.mockRestore();
    });
  });

  describe('loadAutoSave', () => {
    it('should load auto-saved data', () => {
      storage.autoSave('test-lesson', mockFiles, 'src/index.ts');

      const loaded = storage.loadAutoSave('test-lesson');
      expect(loaded).toBeTruthy();
      expect(loaded?.files).toEqual(mockFiles);
      expect(loaded?.activeFile).toBe('src/index.ts');
    });

    it('should return null if no auto-save exists', () => {
      const loaded = storage.loadAutoSave('nonexistent-lesson');
      expect(loaded).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('ks:tutorial:test-lesson:auto', 'invalid json');

      const loaded = storage.loadAutoSave('test-lesson');
      expect(loaded).toBeNull();
    });

    it('should return null for invalid schema', () => {
      localStorage.setItem('ks:tutorial:test-lesson:auto', JSON.stringify({
        version: 1,
        // missing required fields
      }));

      const loaded = storage.loadAutoSave('test-lesson');
      expect(loaded).toBeNull();
    });
  });

  describe('hasAutoSave', () => {
    it('should return true when auto-save exists', () => {
      storage.autoSave('test-lesson', mockFiles, 'src/index.ts');
      expect(storage.hasAutoSave('test-lesson')).toBe(true);
    });

    it('should return false when no auto-save exists', () => {
      expect(storage.hasAutoSave('nonexistent-lesson')).toBe(false);
    });
  });

  describe('clearAutoSave', () => {
    it('should remove auto-save', () => {
      storage.autoSave('test-lesson', mockFiles, 'src/index.ts');
      expect(storage.hasAutoSave('test-lesson')).toBe(true);

      storage.clearAutoSave('test-lesson');
      expect(storage.hasAutoSave('test-lesson')).toBe(false);
    });
  });

  describe('namedSave', () => {
    it('should save with a name', () => {
      storage.namedSave('test-lesson', 'my-save', mockFiles, 'src/index.ts');

      const saved = localStorage.getItem('ks:tutorial:test-lesson:save:my-save');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.slotName).toBe('my-save');
      expect(parsed.label).toBe('my-save');
    });

    it('should save with custom label', () => {
      storage.namedSave('test-lesson', 'save1', mockFiles, 'src/index.ts', 'My Custom Label');

      const loaded = storage.loadNamedSave('test-lesson', 'save1');
      expect(loaded?.label).toBe('My Custom Label');
    });

    it('should throw error for empty name', () => {
      expect(() => {
        storage.namedSave('test-lesson', '', mockFiles, 'src/index.ts');
      }).toThrow('Save name cannot be empty');

      expect(() => {
        storage.namedSave('test-lesson', '   ', mockFiles, 'src/index.ts');
      }).toThrow('Save name cannot be empty');
    });

    it('should throw error on quota exceeded', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        storage.namedSave('test-lesson', 'save1', mockFiles, 'src/index.ts');
      }).toThrow('Failed to save: storage quota exceeded');

      localStorage.setItem = originalSetItem;
    });
  });

  describe('loadNamedSave', () => {
    it('should load named save', () => {
      storage.namedSave('test-lesson', 'my-save', mockFiles, 'src/index.ts');

      const loaded = storage.loadNamedSave('test-lesson', 'my-save');
      expect(loaded).toBeTruthy();
      expect(loaded?.files).toEqual(mockFiles);
      expect(loaded?.slotName).toBe('my-save');
    });

    it('should return null for nonexistent save', () => {
      const loaded = storage.loadNamedSave('test-lesson', 'nonexistent');
      expect(loaded).toBeNull();
    });
  });

  describe('listNamedSaves', () => {
    it('should list all named saves for a lesson', () => {
      storage.namedSave('test-lesson', 'save1', mockFiles, 'src/index.ts');
      storage.namedSave('test-lesson', 'save2', mockFiles, 'src/utils.ts');
      storage.namedSave('other-lesson', 'save3', mockFiles, 'src/index.ts');

      const saves = storage.listNamedSaves('test-lesson');
      expect(saves).toHaveLength(2);
      expect(saves.map(s => s.slotName)).toEqual(expect.arrayContaining(['save1', 'save2']));
    });

    it('should return empty array when no saves exist', () => {
      const saves = storage.listNamedSaves('nonexistent-lesson');
      expect(saves).toEqual([]);
    });

    it('should sort saves by timestamp (newest first)', () => {
      // Add saves with artificial delays to ensure different timestamps
      storage.namedSave('test-lesson', 'old', mockFiles, 'src/index.ts');

      // Manually update timestamp to simulate time passing
      const oldKey = 'ks:tutorial:test-lesson:save:old';
      const oldData = JSON.parse(localStorage.getItem(oldKey)!);
      oldData.timestamp = Date.now() - 10000;
      localStorage.setItem(oldKey, JSON.stringify(oldData));

      storage.namedSave('test-lesson', 'new', mockFiles, 'src/index.ts');

      const saves = storage.listNamedSaves('test-lesson');
      expect(saves[0].slotName).toBe('new');
      expect(saves[1].slotName).toBe('old');
    });

    it('should skip invalid saves', () => {
      localStorage.setItem('ks:tutorial:test-lesson:save:invalid', 'not json');
      storage.namedSave('test-lesson', 'valid', mockFiles, 'src/index.ts');

      const saves = storage.listNamedSaves('test-lesson');
      expect(saves).toHaveLength(1);
      expect(saves[0].slotName).toBe('valid');
    });
  });

  describe('deleteNamedSave', () => {
    it('should delete named save', () => {
      storage.namedSave('test-lesson', 'my-save', mockFiles, 'src/index.ts');
      expect(storage.loadNamedSave('test-lesson', 'my-save')).toBeTruthy();

      storage.deleteNamedSave('test-lesson', 'my-save');
      expect(storage.loadNamedSave('test-lesson', 'my-save')).toBeNull();
    });
  });

  describe('clearAllSaves', () => {
    it('should clear all tutorial saves', () => {
      storage.autoSave('lesson1', mockFiles, 'src/index.ts');
      storage.namedSave('lesson1', 'save1', mockFiles, 'src/index.ts');
      storage.namedSave('lesson2', 'save2', mockFiles, 'src/index.ts');

      // Add non-tutorial item
      localStorage.setItem('other:key', 'value');

      storage.clearAllSaves();

      expect(storage.hasAutoSave('lesson1')).toBe(false);
      expect(storage.listNamedSaves('lesson1')).toHaveLength(0);
      expect(storage.listNamedSaves('lesson2')).toHaveLength(0);

      // Non-tutorial item should remain
      expect(localStorage.getItem('other:key')).toBe('value');
    });
  });

  describe('getTotalSaveSize', () => {
    it('should calculate total size of all saves', () => {
      expect(storage.getTotalSaveSize()).toBe(0);

      storage.autoSave('lesson1', mockFiles, 'src/index.ts');
      const sizeAfterOne = storage.getTotalSaveSize();
      expect(sizeAfterOne).toBeGreaterThan(0);

      storage.namedSave('lesson2', 'save1', mockFiles, 'src/index.ts');
      const sizeAfterTwo = storage.getTotalSaveSize();
      expect(sizeAfterTwo).toBeGreaterThan(sizeAfterOne);
    });
  });
});
