/**
 * Migration Service
 * 
 * Handles API interactions for migration management.
 * Uses absolute URLs for consistent behavior across all environments.
 */

import type { 
  Migration, 
  ComplianceReport, 
  MigrationHistory, 
  AutoMigrationResult,
  MigrationFile 
} from '../types/migration.types';

export class MigrationService {
  // Use relative URLs to work with MSW wildcards in all environments
  private baseUrl = '/api/migrations';

  async getMigrations(): Promise<Migration[]> {
    // Use relative URL - MSW will intercept with */api/migrations pattern
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch migrations: ${response.statusText}`);
    }
    const data = await response.json();
    // Handle both wrapped { migrations: [] } and direct array responses
    // The TypeSpec defines { migrations: [] } but current handlers return array directly
    if (Array.isArray(data)) {
      return data;
    }
    return data.migrations || data || [];
    
    // Old mock data (keeping for reference)
    /* return Promise.resolve([
      {
        id: 'portable-stories',
        name: 'Portable Stories Migration',
        description: 'Migrate test files to use Storybook portable stories pattern',
        status: 'in-progress' as const,
        compliance: 84.8,
        target: 95,
        totalFiles: 47,
        filesCompliant: 28,
        filesRemaining: 5,
        startDate: '2025-08-20',
        elapsedTime: '5 days',
        timeEstimate: '2-4 hours',
        eta: '2025-08-25',
        successRate: 100,
        milestones: [
          {
            id: '1',
            name: 'Golden Examples',
            description: 'Establish reference implementations',
            targetCompliance: 70,
            filesNeeded: 2,
            completed: true,
            current: false,
            completedAt: '2025-08-21'
          },
          {
            id: '2',
            name: 'Simple Components',
            description: 'Migrate atoms and molecules',
            targetCompliance: 80,
            filesNeeded: 15,
            completed: true,
            current: false,
            completedAt: '2025-08-22'
          },
          {
            id: '3',
            name: 'Complex Components',
            description: 'Migrate organisms and pages',
            targetCompliance: 90,
            filesNeeded: 10,
            completed: false,
            current: true
          },
          {
            id: '4',
            name: 'Target Compliance',
            description: 'Reach 95% compliance target',
            targetCompliance: 95,
            filesNeeded: 4,
            completed: false,
            current: false
          }
        ],
        files: [
          {
            id: '1',
            path: 'apps/storybook/src/components/Pages/DashboardPage/v1.0.0/ui/DashboardPage.test.tsx',
            type: 'test',
            status: 'pending',
            complexity: 'complex',
            hasStories: true
          },
          {
            id: '2',
            path: 'apps/storybook/src/components/Pages/DashboardPage/v1.1.0/ui/DashboardPage.test.tsx',
            type: 'test',
            status: 'pending',
            complexity: 'complex',
            hasStories: true
          },
          {
            id: '3',
            path: 'apps/storybook/src/components/atoms/Button/v1.0.0/Button.test.tsx',
            type: 'test',
            status: 'completed',
            complexity: 'simple',
            hasStories: true,
            migratedAt: '2025-08-21',
            migratedBy: 'auto-migration'
          }
        ],
        tools: [
          {
            id: 'compliance-check',
            name: 'Compliance Checker',
            description: 'Analyze files for pattern compliance',
            command: 'npm run migration:check',
            lastRun: '2025-08-25T10:00:00Z',
            runCount: 47,
            successRate: 100
          },
          {
            id: 'auto-migrate',
            name: 'Auto-Migration',
            description: 'Automatically migrate simple cases',
            command: 'npm run migration:auto',
            lastRun: '2025-08-24T15:30:00Z',
            runCount: 12,
            successRate: 41.7
          }
        ]
      },
      {
        id: 'typescript-strict',
        name: 'TypeScript Strict Mode',
        description: 'Enable strict TypeScript checking across all files',
        status: 'pending' as const,
        compliance: 45,
        target: 100,
        totalFiles: 250,
        filesCompliant: 112,
        filesRemaining: 138,
        startDate: '2025-09-01',
        elapsedTime: '0 days',
        timeEstimate: '2 weeks',
        eta: '2025-09-15',
        successRate: 0
      }
    ]); */
  }

  async getMigration(id: string): Promise<Migration | null> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch migration ${id}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.migration || data;
  }

  async getComplianceReport(migrationId: string): Promise<ComplianceReport> {
    const response = await fetch(`${this.baseUrl}/${migrationId}/compliance`);
    if (!response.ok) {
      throw new Error(`Failed to fetch compliance report: ${response.statusText}`);
    }
    const data = await response.json();
    return data.compliance || data;
    
    // Mock compliance report (keeping for reference)
    /* return Promise.resolve({
      timestamp: new Date().toISOString(),
      migrationId,
      summary: {
        total: 47,
        compliant: 28,
        nonCompliant: 5,
        needsStories: 9,
        exceptions: 5,
        complianceRate: 84.8
      },
      files: {
        compliant: [],
        nonCompliant: [],
        needsStories: [],
        exceptions: []
      },
      recommendations: [
        'Migrate 5 test files to portable stories pattern',
        'Create story files for 9 components before migrating tests',
        'Increase compliance rate from 84.8% to 95%'
      ],
      trends: [
        { date: '2025-08-20', complianceRate: 65, filesCompliant: 20, filesMigrated: 0 },
        { date: '2025-08-21', complianceRate: 70, filesCompliant: 22, filesMigrated: 2 },
        { date: '2025-08-22', complianceRate: 75, filesCompliant: 25, filesMigrated: 3 },
        { date: '2025-08-23', complianceRate: 80, filesCompliant: 27, filesMigrated: 2 },
        { date: '2025-08-24', complianceRate: 84.8, filesCompliant: 28, filesMigrated: 1 }
      ]
    }); */
  }

  async getMigrationHistory(): Promise<MigrationHistory[]> {
    const response = await fetch(`${this.baseUrl}/history`);
    if (!response.ok) {
      throw new Error(`Failed to fetch migration history: ${response.statusText}`);
    }
    const data = await response.json();
    // Handle both wrapped { history: [] } and direct array responses
    if (Array.isArray(data)) {
      return data;
    }
    // Ensure we always return an array
    const history = data.history || data || [];
    return Array.isArray(history) ? history : [];
    
    // Mock history data (keeping for reference)
    /* return Promise.resolve([
      {
        id: '1',
        timestamp: '2025-08-25T10:00:00Z',
        type: 'success',
        message: 'Compliance check completed',
        details: 'Found 28 compliant files out of 33 applicable files',
        migrationId: 'portable-stories',
        changes: { before: 84.8, after: 84.8 }
      },
      {
        id: '2',
        timestamp: '2025-08-24T15:30:00Z',
        type: 'warning',
        message: 'Auto-migration partially successful',
        details: '5 files migrated, 7 files skipped due to complex patterns',
        migrationId: 'portable-stories',
        files: ['Button.test.tsx', 'Icon.test.tsx', 'Input.test.tsx'],
        changes: { before: 80, after: 84.8 }
      },
      {
        id: '3',
        timestamp: '2025-08-24T14:00:00Z',
        type: 'info',
        message: 'Migration started',
        details: 'Beginning portable stories migration for 47 test files',
        migrationId: 'portable-stories'
      },
      {
        id: '4',
        timestamp: '2025-08-23T16:45:00Z',
        type: 'error',
        message: 'Migration failed for DashboardPage',
        details: 'Permission denied when writing to file',
        migrationId: 'portable-stories',
        files: ['DashboardPage.test.tsx']
      },
      {
        id: '5',
        timestamp: '2025-08-23T12:00:00Z',
        type: 'success',
        message: 'Golden examples created',
        details: 'Button and HomePage components established as reference implementations',
        migrationId: 'portable-stories',
        files: ['Button.test.tsx', 'HomePage.test.tsx']
      }
    ]); */
  }

  async startMigration(migrationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${migrationId}/start`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Failed to start migration: ${response.statusText}`);
    }
  }

  async pauseMigration(migrationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${migrationId}/pause`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Failed to pause migration: ${response.statusText}`);
    }
  }

  async runComplianceCheck(migrationId: string): Promise<ComplianceReport> {
    const response = await fetch(`${this.baseUrl}/${migrationId}/check-compliance`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Failed to run compliance check: ${response.statusText}`);
    }
    const data = await response.json();
    return data.compliance || data;
  }

  async runAutoMigration(migrationId: string): Promise<AutoMigrationResult> {
    const response = await fetch(`${this.baseUrl}/${migrationId}/auto-migrate`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Failed to run auto-migration: ${response.statusText}`);
    }
    const data = await response.json();
    return data.result || data;
  }

  async exportReport(migrationId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${migrationId}/export`);
    if (!response.ok) {
      throw new Error(`Failed to export report: ${response.statusText}`);
    }
    return response.json();
  }

  async migrateFile(migrationId: string, fileId: string): Promise<void> {
    // In production: POST /api/migrations/{id}/files/{fileId}/migrate
    console.log(`Migrating file ${fileId} for migration ${migrationId}`);
    return Promise.resolve();
  }

  async validateFile(migrationId: string, fileId: string): Promise<boolean> {
    // In production: POST /api/migrations/{id}/files/{fileId}/validate
    console.log(`Validating file ${fileId} for migration ${migrationId}`);
    return Promise.resolve(true);
  }
}