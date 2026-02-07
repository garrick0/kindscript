import { GeneratedTSConfig } from '../../../src/domain/value-objects/generated-tsconfig';

describe('GeneratedTSConfig', () => {
  describe('toJSON', () => {
    it('returns pretty-printed JSON with trailing newline', () => {
      const config = new GeneratedTSConfig('src/domain/tsconfig.json', {
        compilerOptions: { composite: true },
      });

      const json = config.toJSON();
      expect(json).toBe('{\n  "compilerOptions": {\n    "composite": true\n  }\n}\n');
    });

    it('ends with a newline character', () => {
      const config = new GeneratedTSConfig('tsconfig.build.json', { files: [] });

      expect(config.toJSON().endsWith('\n')).toBe(true);
    });

    it('preserves the output path', () => {
      const config = new GeneratedTSConfig('src/domain/tsconfig.json', {});

      expect(config.outputPath).toBe('src/domain/tsconfig.json');
    });
  });
});
