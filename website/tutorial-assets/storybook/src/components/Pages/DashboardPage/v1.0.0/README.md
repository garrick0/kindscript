# DashboardPage

## Overview
DashboardPage page component following Feature-Slice Architecture.

## Structure
- **ui/**: Presentation layer components
- **domain/**: Business logic and state management
- **data/**: Data fetching with TanStack Query
- **types/**: TypeScript type definitions
- **validation/**: Zod schemas for runtime validation
- **tests/**: Integration tests

## State Management
Uses page-level Context for all state management.

## API Integration
Direct fetch with TanStack Query (no service layer).

## Testing
- Component tests: ui/DashboardPage.test.tsx
- Hook tests: domain/useDashboardPage.test.ts
- Integration tests: tests/dashboardpage.integration.test.ts

## Migration Status
✅ Migrated from old structure
⚠️ Review and test required
