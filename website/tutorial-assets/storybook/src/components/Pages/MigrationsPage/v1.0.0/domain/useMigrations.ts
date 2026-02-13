/**
 * useMigrations Hook
 * 
 * Manages migration state and operations for the MigrationsPage component.
 * Handles compliance checking, auto-migration, and progress tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MigrationService } from '../data/migration.service';
import type { 
  Migration, 
  MigrationFile, 
  ComplianceReport, 
  MigrationHistory,
  MigrationStatus 
} from '../types/migration.types';

const migrationService = new MigrationService();

export const useMigrations = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedMigrationId, setSelectedMigrationId] = useState<string | null>(null);

  // Fetch all migrations
  const { data: migrations = [], isLoading: loadingMigrations } = useQuery({
    queryKey: ['migrations'],
    queryFn: () => migrationService.getMigrations(),
    refetchInterval: isRunning ? 5000 : false, // Poll when migration is running
  });

  // Fetch active migration details
  const { data: activeMigration } = useQuery({
    queryKey: ['migration', selectedMigrationId],
    queryFn: () => selectedMigrationId ? migrationService.getMigration(selectedMigrationId) : null,
    enabled: !!selectedMigrationId,
  });

  // Fetch compliance data
  const { data: complianceData } = useQuery({
    queryKey: ['compliance', selectedMigrationId],
    queryFn: () => selectedMigrationId ? migrationService.getComplianceReport(selectedMigrationId) : null,
    enabled: !!selectedMigrationId,
  });

  // Fetch migration history
  const { data: migrationHistory = [] } = useQuery({
    queryKey: ['migration-history'],
    queryFn: () => migrationService.getMigrationHistory(),
  });

  // Start migration mutation
  const startMigrationMutation = useMutation({
    mutationFn: (migrationId: string) => migrationService.startMigration(migrationId),
    onSuccess: () => {
      setIsRunning(true);
      queryClient.invalidateQueries({ queryKey: ['migrations'] });
      queryClient.invalidateQueries({ queryKey: ['migration-history'] });
    },
  });

  // Pause migration mutation
  const pauseMigrationMutation = useMutation({
    mutationFn: (migrationId: string) => migrationService.pauseMigration(migrationId),
    onSuccess: () => {
      setIsRunning(false);
      queryClient.invalidateQueries({ queryKey: ['migrations'] });
    },
  });

  // Run compliance check mutation
  const runComplianceCheckMutation = useMutation({
    mutationFn: (migrationId: string) => migrationService.runComplianceCheck(migrationId),
    onSuccess: (data) => {
      queryClient.setQueryData(['compliance', selectedMigrationId], data);
      queryClient.invalidateQueries({ queryKey: ['migrations'] });
      queryClient.invalidateQueries({ queryKey: ['migration-history'] });
    },
  });

  // Run auto-migration mutation
  const runAutoMigrationMutation = useMutation({
    mutationFn: (migrationId: string) => migrationService.runAutoMigration(migrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migrations'] });
      queryClient.invalidateQueries({ queryKey: ['migration-history'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });

  // Export report mutation
  const exportReportMutation = useMutation({
    mutationFn: () => migrationService.exportReport(selectedMigrationId || ''),
    onSuccess: (data) => {
      // Download the report
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration-report-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  // Callbacks
  const startMigration = useCallback((migrationId: string) => {
    startMigrationMutation.mutate(migrationId);
  }, [startMigrationMutation]);

  const pauseMigration = useCallback(() => {
    if (selectedMigrationId) {
      pauseMigrationMutation.mutate(selectedMigrationId);
    }
  }, [selectedMigrationId, pauseMigrationMutation]);

  const runComplianceCheck = useCallback((migrationId: string) => {
    runComplianceCheckMutation.mutate(migrationId);
  }, [runComplianceCheckMutation]);

  const runAutoMigration = useCallback((migrationId: string) => {
    runAutoMigrationMutation.mutate(migrationId);
  }, [runAutoMigrationMutation]);

  const exportReport = useCallback(() => {
    exportReportMutation.mutate();
  }, [exportReportMutation]);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['migrations'] });
    queryClient.invalidateQueries({ queryKey: ['compliance'] });
    queryClient.invalidateQueries({ queryKey: ['migration-history'] });
  }, [queryClient]);

  // Set default selected migration
  useEffect(() => {
    if (migrations.length > 0 && !selectedMigrationId) {
      const activeMigration = migrations.find(m => m.status === 'in-progress') || migrations[0];
      setSelectedMigrationId(activeMigration.id);
    }
  }, [migrations, selectedMigrationId]);

  // Check if any migration is running
  useEffect(() => {
    const runningMigration = migrations.find(m => m.status === 'in-progress');
    setIsRunning(!!runningMigration);
  }, [migrations]);

  return {
    // Data
    migrations,
    activeMigration,
    complianceData,
    migrationHistory,
    
    // State
    isRunning,
    isLoading: loadingMigrations,
    
    // Actions
    startMigration,
    pauseMigration,
    runComplianceCheck,
    runAutoMigration,
    exportReport,
    refreshData,
    
    // Mutations state
    isStarting: startMigrationMutation.isPending,
    isPausing: pauseMigrationMutation.isPending,
    isCheckingCompliance: runComplianceCheckMutation.isPending,
    isAutoMigrating: runAutoMigrationMutation.isPending,
    isExporting: exportReportMutation.isPending,
  };
};