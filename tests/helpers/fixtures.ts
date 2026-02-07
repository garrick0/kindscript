import * as path from 'path';

/**
 * Base directory for integration test fixtures
 */
export const FIXTURES_BASE = path.resolve(__dirname, '../integration/fixtures');

/**
 * Fixture path constants for consistent access across tests
 */
export const FIXTURES = {
  // Basic clean architecture fixtures
  CLEAN_ARCH_VALID: path.join(FIXTURES_BASE, 'clean-arch-valid'),
  CLEAN_ARCH_VIOLATION: path.join(FIXTURES_BASE, 'clean-arch-violation'),

  // Architecture detection fixtures
  DETECT_CLEAN_ARCH: path.join(FIXTURES_BASE, 'detect-clean-arch'),
  DETECT_CLEAN_ARCH_IMPURE: path.join(FIXTURES_BASE, 'detect-clean-arch-impure'),
  DETECT_HEXAGONAL: path.join(FIXTURES_BASE, 'detect-hexagonal'),
  DETECT_UNKNOWN: path.join(FIXTURES_BASE, 'detect-unknown'),

  // Inference fixtures
  INFER_WITH_STDLIB: path.join(FIXTURES_BASE, 'infer-with-stdlib'),

  // Tier 2 (Kind-based) fixtures
  TIER2_CLEAN_ARCH: path.join(FIXTURES_BASE, 'tier2-clean-arch'),
  TIER2_VIOLATION: path.join(FIXTURES_BASE, 'tier2-violation'),

  // Contract-specific fixtures
  PURITY_CLEAN: path.join(FIXTURES_BASE, 'purity-clean'),
  PURITY_VIOLATION: path.join(FIXTURES_BASE, 'purity-violation'),
  NO_CYCLES_VIOLATION: path.join(FIXTURES_BASE, 'no-cycles-violation'),
  MUST_IMPLEMENT_CLEAN: path.join(FIXTURES_BASE, 'must-implement-clean'),
  MUST_IMPLEMENT_VIOLATION: path.join(FIXTURES_BASE, 'must-implement-violation'),
  COLOCATED_CLEAN: path.join(FIXTURES_BASE, 'colocated-clean'),
  COLOCATED_VIOLATION: path.join(FIXTURES_BASE, 'colocated-violation'),

  // Scaffolding fixtures
  SCAFFOLD_CLEAN_ARCH: path.join(FIXTURES_BASE, 'scaffold-clean-arch'),
  SCAFFOLD_MULTI_INSTANCE: path.join(FIXTURES_BASE, 'scaffold-multi-instance'),
  SCAFFOLD_NESTED: path.join(FIXTURES_BASE, 'scaffold-nested'),

  // Stdlib package fixtures
  STDLIB_CLEAN_ARCH: path.join(FIXTURES_BASE, 'stdlib-clean-arch'),
  STDLIB_CLEAN_ARCH_VIOLATION: path.join(FIXTURES_BASE, 'stdlib-clean-arch-violation'),
  STDLIB_MISSING_PKG: path.join(FIXTURES_BASE, 'stdlib-missing-pkg'),

  // locate<T>() feature fixtures
  LOCATE_CLEAN_ARCH: path.join(FIXTURES_BASE, 'locate-clean-arch'),
  LOCATE_VIOLATION: path.join(FIXTURES_BASE, 'locate-violation'),
  LOCATE_EXISTENCE: path.join(FIXTURES_BASE, 'locate-existence'),
  LOCATE_NESTED: path.join(FIXTURES_BASE, 'locate-nested'),
  LOCATE_STANDALONE_MEMBER: path.join(FIXTURES_BASE, 'locate-standalone-member'),
  LOCATE_PATH_OVERRIDE: path.join(FIXTURES_BASE, 'locate-path-override'),
  LOCATE_MULTI_INSTANCE: path.join(FIXTURES_BASE, 'locate-multi-instance'),
} as const;

/**
 * Fixture names for use with copyFixtureToTemp() in E2E tests
 */
export const FIXTURE_NAMES = {
  CLEAN_ARCH_VALID: 'clean-arch-valid',
  CLEAN_ARCH_VIOLATION: 'clean-arch-violation',
  DETECT_CLEAN_ARCH: 'detect-clean-arch',
  DETECT_CLEAN_ARCH_IMPURE: 'detect-clean-arch-impure',
  DETECT_HEXAGONAL: 'detect-hexagonal',
  DETECT_UNKNOWN: 'detect-unknown',
  INFER_WITH_STDLIB: 'infer-with-stdlib',
  TIER2_CLEAN_ARCH: 'tier2-clean-arch',
  TIER2_VIOLATION: 'tier2-violation',
  PURITY_CLEAN: 'purity-clean',
  PURITY_VIOLATION: 'purity-violation',
  NO_CYCLES_VIOLATION: 'no-cycles-violation',
  MUST_IMPLEMENT_CLEAN: 'must-implement-clean',
  MUST_IMPLEMENT_VIOLATION: 'must-implement-violation',
  COLOCATED_CLEAN: 'colocated-clean',
  COLOCATED_VIOLATION: 'colocated-violation',
  SCAFFOLD_CLEAN_ARCH: 'scaffold-clean-arch',
  SCAFFOLD_MULTI_INSTANCE: 'scaffold-multi-instance',
  SCAFFOLD_NESTED: 'scaffold-nested',
  STDLIB_CLEAN_ARCH: 'stdlib-clean-arch',
  STDLIB_CLEAN_ARCH_VIOLATION: 'stdlib-clean-arch-violation',
  STDLIB_MISSING_PKG: 'stdlib-missing-pkg',
  LOCATE_CLEAN_ARCH: 'locate-clean-arch',
  LOCATE_VIOLATION: 'locate-violation',
  LOCATE_EXISTENCE: 'locate-existence',
  LOCATE_NESTED: 'locate-nested',
  LOCATE_STANDALONE_MEMBER: 'locate-standalone-member',
  LOCATE_PATH_OVERRIDE: 'locate-path-override',
  LOCATE_MULTI_INSTANCE: 'locate-multi-instance',
} as const;
