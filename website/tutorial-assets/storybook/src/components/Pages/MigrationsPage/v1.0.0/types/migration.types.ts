/**
 * Migration Types
 * 
 * Type definitions for the migration management system.
 */

export type MigrationStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'paused';

export type FileStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';

export type MigrationComplexity = 'simple' | 'medium' | 'complex';

export type HistoryItemType = 'info' | 'success' | 'warning' | 'error';

export interface Migration {
  id: string;
  name: string;
  description: string;
  status: MigrationStatus;
  compliance: number; // Current compliance percentage
  target: number; // Target compliance percentage
  totalFiles: number;
  filesCompliant: number;
  filesRemaining: number;
  startDate: string;
  endDate?: string;
  elapsedTime: string;
  timeEstimate: string;
  eta: string;
  successRate: number;
  files?: MigrationFile[];
  milestones?: MigrationMilestone[];
  tools?: MigrationTool[];
}

export interface MigrationFile {
  id: string;
  path: string;
  type: string;
  status: FileStatus;
  complexity: MigrationComplexity;
  hasStories?: boolean;
  isException?: boolean;
  exceptionReason?: string;
  lastModified?: string;
  migratedAt?: string;
  migratedBy?: string;
  error?: string;
}

export interface MigrationMilestone {
  id: string;
  name: string;
  description: string;
  targetCompliance: number;
  filesNeeded: number;
  completed: boolean;
  current: boolean;
  completedAt?: string;
}

export interface MigrationTool {
  id: string;
  name: string;
  description: string;
  command: string;
  icon?: string;
  lastRun?: string;
  runCount: number;
  successRate: number;
}

export interface ComplianceReport {
  timestamp: string;
  migrationId: string;
  summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
    needsStories: number;
    exceptions: number;
    complianceRate: number;
  };
  files: {
    compliant: MigrationFile[];
    nonCompliant: MigrationFile[];
    needsStories: MigrationFile[];
    exceptions: MigrationFile[];
  };
  recommendations: string[];
  trends?: ComplianceTrend[];
}

export interface ComplianceTrend {
  date: string;
  complianceRate: number;
  filesCompliant: number;
  filesMigrated: number;
}

export interface MigrationHistory {
  id: string;
  timestamp: string;
  type: HistoryItemType;
  message: string;
  details?: string;
  migrationId: string;
  files?: string[];
  user?: string;
  duration?: number;
  changes?: {
    before: number;
    after: number;
  };
}

export interface AutoMigrationResult {
  migrationId: string;
  timestamp: string;
  filesProcessed: number;
  filesSuccessful: number;
  filesFailed: number;
  filesSkipped: number;
  results: Array<{
    file: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
    changes?: string[];
  }>;
  duration: number;
}

export interface MigrationConfig {
  id: string;
  name: string;
  pattern: string;
  targetPattern: string;
  eslintRule?: string;
  complianceScript?: string;
  autoMigrationScript?: string;
  documentation?: string;
  goldenExamples?: string[];
  excludePaths?: string[];
  targetCompliance: number;
}

export interface MigrationStats {
  totalMigrations: number;
  completedMigrations: number;
  averageCompliance: number;
  averageDuration: number;
  totalFilesMigrated: number;
  successRate: number;
  topContributors: Array<{
    user: string;
    filesMigrated: number;
  }>;
}