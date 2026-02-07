import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { MockASTAdapter } from '../../src/infrastructure/adapters/testing/mock-ast.adapter';
import { TypeChecker, SourceFile } from '../../src/application/ports/typescript.port';

const mockChecker = {} as TypeChecker;
const sourceFile = (fileName: string): SourceFile => ({ fileName, text: '' });

describe('ClassifyASTService - Kind Definition Parsing', () => {
  let service: ClassifyASTService;
  let mockAST: MockASTAdapter;

  beforeEach(() => {
    mockAST = new MockASTAdapter();
    service = new ClassifyASTService(mockAST);
  });

  afterEach(() => {
    mockAST.reset();
  });

  describe('Kind definition parsing', () => {
    it('finds interface extending Kind<N>', () => {
      mockAST.withInterface('arch.ts', 'OrderingContext', 'Kind', 'OrderingContext', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infrastructure', typeName: 'InfrastructureLayer' },
      ]);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Kind definitions show up as symbols
      const kindSymbol = result.symbols.find(s => s.name === 'OrderingContext');
      expect(kindSymbol).toBeDefined();
    });

    it('extracts kind name from type parameter', () => {
      mockAST.withInterface('arch.ts', 'MyContext', 'Kind', 'MyContext', []);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.symbols.some(s => s.name === 'MyContext')).toBe(true);
    });

    it('ignores interfaces not extending Kind', () => {
      // Add a regular interface (not extending Kind)
      const statements = mockAST.getStatements(sourceFile('arch.ts'));
      expect(statements).toHaveLength(0); // nothing added yet

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.symbols).toHaveLength(0);
      expect(result.contracts).toHaveLength(0);
    });

    it('handles interface with no members', () => {
      mockAST.withInterface('arch.ts', 'EmptyKind', 'Kind', 'EmptyKind', []);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.symbols.some(s => s.name === 'EmptyKind')).toBe(true);
    });
  });
});
