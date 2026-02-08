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

  // Tier 2 (Kind-based) fixtures
  TIER2_CLEAN_ARCH: path.join(FIXTURES_BASE, 'tier2-clean-arch'),
  TIER2_VIOLATION: path.join(FIXTURES_BASE, 'tier2-violation'),

  // Contract-specific fixtures
  PURITY_CLEAN: path.join(FIXTURES_BASE, 'purity-clean'),
  PURITY_VIOLATION: path.join(FIXTURES_BASE, 'purity-violation'),
  NO_CYCLES_VIOLATION: path.join(FIXTURES_BASE, 'no-cycles-violation'),
  MUST_IMPLEMENT_CLEAN: path.join(FIXTURES_BASE, 'must-implement-clean'),
  MUST_IMPLEMENT_VIOLATION: path.join(FIXTURES_BASE, 'must-implement-violation'),
  MIRRORS_CLEAN: path.join(FIXTURES_BASE, 'mirrors-clean'),
  MIRRORS_VIOLATION: path.join(FIXTURES_BASE, 'mirrors-violation'),

  // InstanceConfig<T> feature fixtures
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
  TIER2_CLEAN_ARCH: 'tier2-clean-arch',
  TIER2_VIOLATION: 'tier2-violation',
  PURITY_CLEAN: 'purity-clean',
  PURITY_VIOLATION: 'purity-violation',
  NO_CYCLES_VIOLATION: 'no-cycles-violation',
  MUST_IMPLEMENT_CLEAN: 'must-implement-clean',
  MUST_IMPLEMENT_VIOLATION: 'must-implement-violation',
  MIRRORS_CLEAN: 'mirrors-clean',
  MIRRORS_VIOLATION: 'mirrors-violation',
  LOCATE_CLEAN_ARCH: 'locate-clean-arch',
  LOCATE_VIOLATION: 'locate-violation',
  LOCATE_EXISTENCE: 'locate-existence',
  LOCATE_NESTED: 'locate-nested',
  LOCATE_STANDALONE_MEMBER: 'locate-standalone-member',
  LOCATE_PATH_OVERRIDE: 'locate-path-override',
  LOCATE_MULTI_INSTANCE: 'locate-multi-instance',
} as const;
