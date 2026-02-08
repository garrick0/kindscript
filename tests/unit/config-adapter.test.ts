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

  describe('readKindScriptConfig', () => {
    it('returns undefined when kindscript.json does not exist', () => {
      const result = adapter.readKindScriptConfig(tmpDir);
      expect(result).toBeUndefined();
    });

    it('parses rootDir field correctly', () => {
      const config = {
        rootDir: 'src',
      };
      fs.writeFileSync(path.join(tmpDir, 'kindscript.json'), JSON.stringify(config));

      const result = adapter.readKindScriptConfig(tmpDir);

      expect(result).toBeDefined();
      expect(result!.rootDir).toBe('src');
    });

    it('preserves all config fields', () => {
      const config = {
        rootDir: 'src',
        compilerOptions: { strict: true },
      };
      fs.writeFileSync(path.join(tmpDir, 'kindscript.json'), JSON.stringify(config));

      const result = adapter.readKindScriptConfig(tmpDir);

      expect(result).toBeDefined();
      expect(result!.rootDir).toBe('src');
      expect(result!.compilerOptions).toEqual({ strict: true });
    });
  });
});
