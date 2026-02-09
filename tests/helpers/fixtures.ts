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

  // Instance<T> feature fixtures
  LOCATE_CLEAN_ARCH: path.join(FIXTURES_BASE, 'locate-clean-arch'),
  LOCATE_VIOLATION: path.join(FIXTURES_BASE, 'locate-violation'),
  LOCATE_EXISTENCE: path.join(FIXTURES_BASE, 'locate-existence'),
  LOCATE_NESTED: path.join(FIXTURES_BASE, 'locate-nested'),
  LOCATE_STANDALONE_MEMBER: path.join(FIXTURES_BASE, 'locate-standalone-member'),
  LOCATE_MULTI_INSTANCE: path.join(FIXTURES_BASE, 'locate-multi-instance'),

  // Design system (atomic design) fixtures
  DESIGN_SYSTEM_CLEAN: path.join(FIXTURES_BASE, 'design-system-clean'),
  DESIGN_SYSTEM_VIOLATION: path.join(FIXTURES_BASE, 'design-system-violation'),
} as const;
