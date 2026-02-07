import * as path from 'path';

const PLUGIN_PATH = path.resolve(__dirname, '../../dist/infrastructure/plugin/index.js');

describe('Plugin Loading E2E', () => {
  it('plugin module exports a function', () => {
    const pluginInit = require(PLUGIN_PATH);
    expect(typeof pluginInit).toBe('function');
  });

  it('plugin factory returns an object with create method', () => {
    const pluginInit = require(PLUGIN_PATH);
    const mockTypescript = { DiagnosticCategory: { Error: 1 } };
    const pluginModule = pluginInit({ typescript: mockTypescript });

    expect(pluginModule).toBeDefined();
    expect(typeof pluginModule.create).toBe('function');
  });

  it('plugin create produces a LanguageService with getSemanticDiagnostics', () => {
    const pluginInit = require(PLUGIN_PATH);
    const mockTypescript = { DiagnosticCategory: { Error: 1 } };
    const pluginModule = pluginInit({ typescript: mockTypescript });

    // Create a minimal mock PluginCreateInfo
    const mockLanguageService: Record<string, unknown> = {
      getSemanticDiagnostics: () => [],
      getCodeFixesAtPosition: () => [],
    };

    const mockInfo = {
      languageService: mockLanguageService,
      project: {
        getCurrentDirectory: () => '/mock-project',
        getFileNames: () => [],
      },
    };

    const proxy = pluginModule.create(mockInfo);
    expect(typeof proxy.getSemanticDiagnostics).toBe('function');
  });

  it('plugin create produces a LanguageService with getCodeFixesAtPosition', () => {
    const pluginInit = require(PLUGIN_PATH);
    const mockTypescript = { DiagnosticCategory: { Error: 1 } };
    const pluginModule = pluginInit({ typescript: mockTypescript });

    const mockLanguageService: Record<string, unknown> = {
      getSemanticDiagnostics: () => [],
      getCodeFixesAtPosition: () => [],
    };

    const mockInfo = {
      languageService: mockLanguageService,
      project: {
        getCurrentDirectory: () => '/mock-project',
        getFileNames: () => [],
      },
    };

    const proxy = pluginModule.create(mockInfo);
    expect(typeof proxy.getCodeFixesAtPosition).toBe('function');
  });

  it('plugin does not throw when initialized', () => {
    const pluginInit = require(PLUGIN_PATH);
    const mockTypescript = { DiagnosticCategory: { Error: 1 } };

    expect(() => {
      const pluginModule = pluginInit({ typescript: mockTypescript });

      const mockLanguageService: Record<string, unknown> = {
        getSemanticDiagnostics: () => [],
        getCodeFixesAtPosition: () => [],
      };

      const mockInfo = {
        languageService: mockLanguageService,
        project: {
          getCurrentDirectory: () => '/mock-project',
          getFileNames: () => [],
        },
      };

      pluginModule.create(mockInfo);
    }).not.toThrow();
  });
});
