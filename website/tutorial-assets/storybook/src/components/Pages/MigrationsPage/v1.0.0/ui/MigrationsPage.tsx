/**
 * MigrationsPage Component
 * 
 * A visual interface for managing code migrations across the codebase.
 * Allows users to track progress, run migrations, and monitor compliance.
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  Download,
  Terminal,
  GitBranch,
  Target,
  TrendingUp,
  FileCode,
  Settings,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Zap,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  FileCheck
} from 'lucide-react';
import { Button } from '../../../../atoms/Button/v1.0.0/Button';
import { Card } from '../../../../molecules/Card/v1.0.0/Card';
import { Badge } from '../../../../atoms/Badge/v1.0.0/Badge';
import { Progress } from '../../../../atoms/Progress/v1.0.0/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './SimpleTabs';
import { Alert, AlertDescription } from '../../../../molecules/Alert/v1.0.0/Alert';
import { Input } from '../../../../atoms/Input/v1.0.0/Input';
import { useMigrations } from '../domain/useMigrations';
import { cn } from '../../../../../utils/cn';
import { ModuleExplorer } from './ModuleExplorer';

export interface MigrationsPageProps {
  className?: string;
}

export const MigrationsPage: React.FC<MigrationsPageProps> = ({ className }) => {
  const {
    migrations,
    activeMigration,
    complianceData,
    migrationHistory,
    isRunning,
    isLoading,
    startMigration,
    pauseMigration,
    runComplianceCheck,
    runAutoMigration,
    exportReport,
    refreshData
  } = useMigrations();

  const [selectedMigration, setSelectedMigration] = useState(activeMigration?.id || 'portable-stories');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const currentMigration = migrations.find(m => m.id === selectedMigration) || migrations[0];

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center', className)}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading migrations...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no migrations
  if (!migrations || migrations.length === 0) {
    return (
      <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center', className)}>
        <div className="text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Migrations Found</h2>
          <p className="text-gray-500">Create your first migration to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <GitBranch className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Migration Manager
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage and track code migrations across your codebase
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Migration Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Active Migration
            </h2>
            <select 
              value={selectedMigration} 
              onChange={(e) => setSelectedMigration(e.target.value)}
              className="w-64 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {migrations.length === 0 && (
                <option value="">Select a migration</option>
              )}
              {migrations.map(migration => (
                <option key={migration.id} value={migration.id}>
                  {migration.name} ({migration.compliance.toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>

          {/* Current Migration Overview */}
          {currentMigration ? (
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {currentMigration.name}
                    </h3>
                    <Badge variant={
                      currentMigration.status === 'completed' ? 'secondary' :
                      currentMigration.status === 'in-progress' ? 'outline' : 'default'
                    }>
                      {currentMigration.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {currentMigration.description}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Compliance Progress
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {currentMigration.compliance}% / {currentMigration.target}%
                    </span>
                  </div>
                  <Progress 
                    value={currentMigration.compliance} 
                    max={100}
                    className="h-3"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {currentMigration.filesCompliant} of {currentMigration.totalFiles} files
                    </span>
                    <span className="text-xs text-gray-500">
                      {currentMigration.filesRemaining} remaining
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => runComplianceCheck(currentMigration.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileCheck className="h-4 w-4" />
                    Check Compliance
                  </Button>
                  <Button
                    onClick={() => runAutoMigration(currentMigration.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={isRunning}
                  >
                    <Zap className="h-4 w-4" />
                    Auto-Migrate
                  </Button>
                  <Button
                    onClick={() => isRunning ? pauseMigration() : startMigration(currentMigration.id)}
                    variant={isRunning ? 'destructive' : 'default'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Start Migration
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 ml-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMigration.timeEstimate}
                  </div>
                  <div className="text-xs text-gray-500">Est. Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentMigration.successRate}%
                  </div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
              </div>
            </div>
          </Card>
          ) : (
            <Card className="p-6">
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Migrations Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create a new migration or select an existing one to get started.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Tabs - Only show if there's a current migration */}
        {currentMigration && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Compliance Metrics */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Compliance Metrics
                  </h3>
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current</span>
                    <span className="font-semibold">{currentMigration.compliance}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Target</span>
                    <span className="font-semibold">{currentMigration.target}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gap</span>
                    <span className="font-semibold text-orange-600">
                      {currentMigration.target - currentMigration.compliance}%
                    </span>
                  </div>
                </div>
              </Card>

              {/* File Statistics */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    File Statistics
                  </h3>
                  <FileCode className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Files</span>
                    <span className="font-semibold">{currentMigration.totalFiles}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Compliant</span>
                    <span className="font-semibold text-green-600">
                      {currentMigration.filesCompliant}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <span className="font-semibold text-orange-600">
                      {currentMigration.filesRemaining}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Time Tracking */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Time Tracking
                  </h3>
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Started</span>
                    <span className="font-semibold">{currentMigration.startDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Elapsed</span>
                    <span className="font-semibold">{currentMigration.elapsedTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ETA</span>
                    <span className="font-semibold">{currentMigration.eta}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Migration Path */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Migration Path to {currentMigration.target}% Compliance
              </h3>
              <div className="space-y-3">
                {currentMigration.milestones?.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full",
                      milestone.completed 
                        ? "bg-green-100 text-green-600" 
                        : milestone.current
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-400"
                    )}>
                      {milestone.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : milestone.current ? (
                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {milestone.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {milestone.description}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {milestone.targetCompliance}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {milestone.filesNeeded} files
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {migrationHistory.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      activity.type === 'success' ? 'bg-green-100 text-green-600' :
                      activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      activity.type === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {activity.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
                       activity.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                       activity.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
                       <Info className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.message}
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            <ModuleExplorer />
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-40 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Files</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* File List */}
            <Card className="p-6">
              <div className="space-y-2">
                {currentMigration.files
                  ?.filter(file => 
                    (filterStatus === 'all' || file.status === filterStatus) &&
                    (searchQuery === '' || file.path.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          file.status === 'completed' ? 'bg-green-500' :
                          file.status === 'in-progress' ? 'bg-yellow-500' :
                          'bg-gray-300'
                        )} />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {file.path}
                          </div>
                          <div className="text-xs text-gray-500">
                            {file.type} • {file.complexity} complexity
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          file.status === 'completed' ? 'success' :
                          file.status === 'in-progress' ? 'warning' : 'default'
                        }>
                          {file.status}
                        </Badge>
                        <Button size="xs" variant="ghost">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Compliance Checker */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Compliance Checker
                  </h3>
                  <FileCheck className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Analyze all files to determine current compliance status
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <code className="text-xs">npm run migration:check</code>
                  </div>
                  <Button 
                    onClick={() => runComplianceCheck(currentMigration.id)}
                    className="w-full"
                    variant="outline"
                  >
                    Run Compliance Check
                  </Button>
                </div>
              </Card>

              {/* Auto-Migration */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Auto-Migration Tool
                  </h3>
                  <Zap className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Automatically migrate simple cases
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <code className="text-xs">npm run migration:auto</code>
                  </div>
                  <Button 
                    onClick={() => runAutoMigration(currentMigration.id)}
                    className="w-full"
                    variant="outline"
                  >
                    Run Auto-Migration
                  </Button>
                </div>
              </Card>

              {/* ESLint Rule */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    ESLint Enforcement
                  </h3>
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Enforce pattern compliance with ESLint rules
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <code className="text-xs">npm run migration:validate</code>
                  </div>
                  <Button className="w-full" variant="outline">
                    Run Validation
                  </Button>
                </div>
              </Card>

              {/* Terminal */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Terminal Output
                  </h3>
                  <Terminal className="h-5 w-5 text-green-600" />
                </div>
                <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs h-32 overflow-y-auto">
                  <div>$ npm run migration:check</div>
                  <div>🔍 Analyzing test files for compliance...</div>
                  <div>&nbsp;</div>
                  <div>📊 Portable Stories Compliance Report</div>
                  <div>&nbsp;</div>
                  <div>Summary:</div>
                  <div>  Total test files: 47</div>
                  <div>  Compliant: 28</div>
                  <div>  Non-compliant: 5</div>
                  <div>&nbsp;</div>
                  <div>Compliance Rate: 84.8%</div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                {migrationHistory.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className={cn(
                      "p-2 rounded-lg",
                      item.type === 'success' ? 'bg-green-100 text-green-600' :
                      item.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      item.type === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {item.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
                       item.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                       item.type === 'error' ? <AlertCircle className="h-5 w-5" /> :
                       <Info className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.message}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.details}
                      </p>
                      {item.files && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.files.map((file, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {file}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Migration Guide
                </h3>
                <div className="space-y-3">
                  <a href="#" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCode className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium">Migration Process</div>
                        <div className="text-xs text-gray-500">6-phase methodology</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </a>
                  <a href="#" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCode className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-sm font-medium">Golden Examples</div>
                        <div className="text-xs text-gray-500">Button, HomePage</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </a>
                  <a href="#" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCode className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="text-sm font-medium">Migration Example</div>
                        <div className="text-xs text-gray-500">DashboardPage step-by-step</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </a>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Resources
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Quick Start</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Run <code>npm run migration:check</code> to see current status
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Best Practices</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Start with simple components and work up to complex ones
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Common Issues</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Complex mocking patterns require manual migration
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
};