import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ConfigAdapter } from '../../src/infrastructure/adapters/config/config.adapter';

describe('ConfigAdapter', () => {
  let adapter: ConfigAdapter;
  let tmpDir: string;

  beforeEach(() => {
    adapter = new ConfigAdapter();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksc-config-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('readKindScriptConfig — packages field', () => {
    it('parses packages field correctly', () => {
      const config = {
        definitions: ['architecture.ts'],
        packages: ['@kindscript/clean-architecture', '@kindscript/hexagonal'],
      };
      fs.writeFileSync(path.join(tmpDir, 'kindscript.json'), JSON.stringify(config));

      const result = adapter.readKindScriptConfig(tmpDir);

      expect(result).toBeDefined();
      expect(result!.packages).toEqual(['@kindscript/clean-architecture', '@kindscript/hexagonal']);
    });

    it('returns empty array when packages is empty', () => {
      const config = {
        definitions: ['architecture.ts'],
        packages: [],
      };
      fs.writeFileSync(path.join(tmpDir, 'kindscript.json'), JSON.stringify(config));

      const result = adapter.readKindScriptConfig(tmpDir);

      expect(result).toBeDefined();
      expect(result!.packages).toEqual([]);
    });

    it('returns undefined packages when field is missing', () => {
      const config = {
        definitions: ['architecture.ts'],
      };
      fs.writeFileSync(path.join(tmpDir, 'kindscript.json'), JSON.stringify(config));

      const result = adapter.readKindScriptConfig(tmpDir);

      expect(result).toBeDefined();
      expect(result!.packages).toBeUndefined();
    });

    it('returns undefined when kindscript.json does not exist', () => {
      const result = adapter.readKindScriptConfig(tmpDir);
      expect(result).toBeUndefined();
    });

    it('preserves other config fields alongside packages', () => {
      const config = {
        definitions: ['architecture.ts'],
        packages: ['@kindscript/clean-architecture'],
        rootDir: 'src',
      };
      fs.writeFileSync(path.join(tmpDir, 'kindscript.json'), JSON.stringify(config));

      const result = adapter.readKindScriptConfig(tmpDir);

      expect(result).toBeDefined();
      expect(result!.definitions).toEqual(['architecture.ts']);
      expect(result!.packages).toEqual(['@kindscript/clean-architecture']);
      expect(result!.rootDir).toBe('src');
    });
  });
});
