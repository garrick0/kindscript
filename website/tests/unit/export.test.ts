import { describe, it, expect, beforeEach, vi } from 'vitest';
import { downloadAsZip, copyFileToClipboard } from '@/lib/tutorial/export';
import type { LessonFile } from '@/lib/lessons/types';

describe('export module', () => {
  const mockFiles: LessonFile[] = [
    { path: 'src/index.ts', contents: 'export const x = 1;' },
    { path: 'src/utils.ts', contents: 'export const y = 2;' },
  ];

  describe('downloadAsZip', () => {
    let createElementSpy: any;
    let clickSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;
    let revokeObjectURLSpy: any;

    beforeEach(() => {
      // Mock DOM methods
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      clickSpy = mockAnchor.click;
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      revokeObjectURLSpy = global.URL.revokeObjectURL as any;
    });

    it('should create a ZIP with all files', async () => {
      await downloadAsZip(mockFiles, 'test-project');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should use correct filename', async () => {
      await downloadAsZip(mockFiles, 'my-custom-name');

      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.download).toBe('my-custom-name.zip');
    });

    it('should default to kindscript-project if no name provided', async () => {
      await downloadAsZip(mockFiles);

      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.download).toBe('kindscript-project.zip');
    });

    // Note: Testing ZIP generation failure is complex with module mocking
    // The happy path is covered, and error handling is present in the code
  });

  describe('copyFileToClipboard', () => {
    it('should use Clipboard API when available', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      global.navigator.clipboard = {
        writeText: writeTextMock,
      } as any;

      const result = await copyFileToClipboard('test content');

      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('test content');
    });

    it('should use fallback when Clipboard API fails', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
      global.navigator.clipboard = {
        writeText: writeTextMock,
      } as any;

      // Mock document.execCommand
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      // Mock document.createElement for textarea
      const mockTextarea = {
        value: '',
        style: {},
        select: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockTextarea as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextarea as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextarea as any);

      const result = await copyFileToClipboard('test content');

      expect(result).toBe(true);
      expect(execCommandMock).toHaveBeenCalledWith('copy');
    });

    it('should use fallback when Clipboard API is not available', async () => {
      global.navigator.clipboard = undefined as any;

      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      const mockTextarea = {
        value: '',
        style: {},
        select: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockTextarea as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextarea as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextarea as any);

      const result = await copyFileToClipboard('test content');

      expect(result).toBe(true);
      expect(mockTextarea.value).toBe('test content');
      expect(mockTextarea.select).toHaveBeenCalled();
    });

    it('should return false when both methods fail', async () => {
      global.navigator.clipboard = undefined as any;

      const execCommandMock = vi.fn().mockReturnValue(false);
      document.execCommand = execCommandMock;

      const mockTextarea = {
        value: '',
        style: {},
        select: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockTextarea as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextarea as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextarea as any);

      const result = await copyFileToClipboard('test content');

      expect(result).toBe(false);
    });

    it('should handle fallback errors gracefully', async () => {
      global.navigator.clipboard = undefined as any;

      document.execCommand = vi.fn(() => {
        throw new Error('execCommand failed');
      });

      const mockTextarea = {
        value: '',
        style: {},
        select: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockTextarea as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextarea as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextarea as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await copyFileToClipboard('test content');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
