import { describe, it, expect } from 'vitest';
import { SANDBOX_TEMPLATES, getTemplate, getDefaultTemplate } from '@/lib/tutorial/sandbox-templates';

describe('sandbox-templates', () => {
  describe('SANDBOX_TEMPLATES', () => {
    it('should have at least 4 templates', () => {
      expect(SANDBOX_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    });

    it('should have unique IDs', () => {
      const ids = SANDBOX_TEMPLATES.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have required properties for each template', () => {
      SANDBOX_TEMPLATES.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(Array.isArray(template.files)).toBe(true);
        expect(template.files.length).toBeGreaterThan(0);
      });
    });

    it('should have valid file structures', () => {
      SANDBOX_TEMPLATES.forEach((template) => {
        template.files.forEach((file) => {
          expect(file.path).toBeTruthy();
          expect(typeof file.contents).toBe('string');
          expect(file.path).not.toContain('\\\\'); // No backslashes
        });
      });
    });
  });

  describe('Clean Architecture template', () => {
    it('should have domain, application, and infrastructure files', () => {
      const cleanArch = SANDBOX_TEMPLATES.find((t) => t.id === 'clean');
      expect(cleanArch).toBeDefined();

      const paths = cleanArch!.files.map((f) => f.path);
      expect(paths.some((p) => p.includes('domain'))).toBe(true);
      expect(paths.some((p) => p.includes('application'))).toBe(true);
      expect(paths.some((p) => p.includes('infrastructure'))).toBe(true);
    });

    it('should have kindscript.config.ts', () => {
      const cleanArch = SANDBOX_TEMPLATES.find((t) => t.id === 'clean');
      const hasConfig = cleanArch!.files.some((f) => f.path.includes('kindscript.config.ts'));
      expect(hasConfig).toBe(true);
    });
  });

  describe('Hexagonal Architecture template', () => {
    it('should have core, ports, and adapters files', () => {
      const hexagonal = SANDBOX_TEMPLATES.find((t) => t.id === 'hexagonal');
      expect(hexagonal).toBeDefined();

      const paths = hexagonal!.files.map((f) => f.path);
      expect(paths.some((p) => p.includes('core'))).toBe(true);
      expect(paths.some((p) => p.includes('ports'))).toBe(true);
      expect(paths.some((p) => p.includes('adapters'))).toBe(true);
    });
  });

  describe('DDD template', () => {
    it('should have bounded context directories', () => {
      const ddd = SANDBOX_TEMPLATES.find((t) => t.id === 'ddd');
      expect(ddd).toBeDefined();

      const paths = ddd!.files.map((f) => f.path);
      // Should have at least 2 bounded contexts
      const contextDirs = new Set(
        paths
          .filter((p) => p.startsWith('src/domain/'))
          .map((p) => p.split('/')[2])
      );
      expect(contextDirs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Empty template', () => {
    it('should have minimal files', () => {
      const empty = SANDBOX_TEMPLATES.find((t) => t.id === 'empty');
      expect(empty).toBeDefined();
      expect(empty!.files.length).toBeLessThanOrEqual(3);
    });

    it('should have index.ts and config', () => {
      const empty = SANDBOX_TEMPLATES.find((t) => t.id === 'empty');
      const paths = empty!.files.map((f) => f.path);
      expect(paths.some((p) => p.includes('index.ts'))).toBe(true);
      expect(paths.some((p) => p.includes('kindscript.config.ts'))).toBe(true);
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', () => {
      const clean = getTemplate('clean');
      expect(clean).toBeDefined();
      expect(clean?.id).toBe('clean');
    });

    it('should return undefined for non-existent ID', () => {
      const result = getTemplate('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getDefaultTemplate', () => {
    it('should return first template', () => {
      const defaultTemplate = getDefaultTemplate();
      expect(defaultTemplate).toEqual(SANDBOX_TEMPLATES[0]);
    });

    it('should return Clean Architecture template', () => {
      const defaultTemplate = getDefaultTemplate();
      expect(defaultTemplate.id).toBe('clean');
    });
  });
});
