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

  // Scope override fixtures
  SCOPE_OVERRIDE_CLEAN: path.join(FIXTURES_BASE, 'scope-override-clean'),

  // Wrapped Kind composability fixtures
  WRAPPED_KIND_COMPOSABILITY_CLEAN: path.join(FIXTURES_BASE, 'wrapped-kind-composability-clean'),
  WRAPPED_KIND_COMPOSABILITY_VIOLATION: path.join(FIXTURES_BASE, 'wrapped-kind-composability-violation'),

  // Wrapped Kind purity fixtures (standalone wrapped Kind constraints)
  WRAPPED_KIND_PURITY_CLEAN: path.join(FIXTURES_BASE, 'wrapped-kind-purity-clean'),
  WRAPPED_KIND_PURITY_VIOLATION: path.join(FIXTURES_BASE, 'wrapped-kind-purity-violation'),

  // Explicit location fixtures
  EXPLICIT_LOCATION_EXTERNAL: path.join(FIXTURES_BASE, 'explicit-location-external'),

  // Scope mismatch fixtures
  SCOPE_MISMATCH_VIOLATION: path.join(FIXTURES_BASE, 'scope-mismatch-violation'),

  // Overlap fixture
  OVERLAP_VIOLATION: path.join(FIXTURES_BASE, 'overlap-violation'),

  // Exhaustiveness fixture
  EXHAUSTIVENESS_VIOLATION: path.join(FIXTURES_BASE, 'exhaustiveness-violation'),
} as const;
