# MigrationsPage Component

## Overview
The MigrationsPage provides a comprehensive visual interface for managing code migrations, tracking compliance, and running automated migration tools.

## Features
- **Migration Dashboard**: Overview of all migrations with progress metrics
- **Compliance Tracking**: Real-time compliance percentage with trend visualization
- **File Management**: Track individual file migration status
- **Auto-Migration Tools**: Run automated migration scripts with one click
- **History Timeline**: View complete migration history with success/failure tracking
- **Documentation**: Integrated documentation and golden examples

## Usage

```tsx
import { MigrationsPage } from '@induction/storybook';

export default function Migrations() {
  return <MigrationsPage />;
}
```

## Component Structure

```
MigrationsPage/
├── ui/
│   ├── MigrationsPage.tsx         # Main page component
│   └── MigrationsPage.stories.tsx # Storybook stories
├── domain/
│   └── useMigrations.ts           # Business logic hook
├── data/
│   └── migration.service.ts       # API service layer
├── types/
│   └── migration.types.ts         # TypeScript definitions
├── metadata.json                  # Component metadata
├── dependencies.json              # Dependency tracking
└── README.md                      # This file
```

## States

### Migration Status
- `pending` - Migration not started
- `in-progress` - Currently running
- `completed` - Successfully completed
- `failed` - Failed with errors
- `paused` - Temporarily paused

### File Status
- `pending` - Not yet migrated
- `in-progress` - Currently being migrated
- `completed` - Successfully migrated
- `failed` - Migration failed
- `skipped` - Skipped (complex patterns)

## API Integration

The component expects these API endpoints:
- `GET /api/migrations` - List all migrations
- `GET /api/migrations/:id` - Get migration details
- `GET /api/migrations/:id/compliance` - Get compliance report
- `POST /api/migrations/:id/start` - Start migration
- `POST /api/migrations/:id/pause` - Pause migration
- `POST /api/migrations/:id/check-compliance` - Run compliance check
- `POST /api/migrations/:id/auto-migrate` - Run auto-migration

## Mock Data
Currently using mock data in the service layer. Replace with actual API calls when backend is ready.

## Testing
```bash
# Run component tests
pnpm test MigrationsPage

# View in Storybook
pnpm storybook
# Navigate to Pages/MigrationsPage
```

## Related Documentation
- [Migration Process](../../../../../../../../../docs/MIGRATION_PROCESS.md)
- [Migration Lessons Learned](../../../../../../../../../docs/MIGRATION_LESSONS_LEARNED.md)