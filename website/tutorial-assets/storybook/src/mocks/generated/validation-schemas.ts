// Generated Zod type schemas from TypeSpec components
// Do not edit manually - regenerate using npm run typespec:generate-validation

import { z } from 'zod';

export const ActivityTypeSchema = z.enum(['document', 'release', 'page', 'workflow', 'system', 'user']);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const DocumentStatusSchema = z.enum(['draft', 'review', 'approved', 'published', 'archived']);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

export const DocumentTypeSchema = z.enum(['prd', 'spec', 'story', 'design', 'api', 'general']);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const ReleaseStatusSchema = z.enum(['draft', 'review', 'published', 'archived']);
export type ReleaseStatus = z.infer<typeof ReleaseStatusSchema>;

export const ActivityItemSchema = z.object({
  // Activity ID
  id: z.string(),
  // Activity type
  type: z.unknown(),
  // Activity action description
  action: z.string(),
  // Time description (e.g., '2 hours ago')
  time: z.string(),
  // User who performed the action
  userName: z.string().optional(),
  // User ID
  userId: z.string().optional(),
  // Related resource ID
  resourceId: z.string().optional(),
  // Related resource name
  resourceName: z.string().optional(),
  // Activity timestamp
  timestamp: z.string().datetime(),
}).strict();

export type ActivityItem = z.infer<typeof ActivityItemSchema>;

export const ApiErrorSchema = z.object({
  // Error message
  message: z.string(),
  // Error code
  code: z.string(),
  // Additional error details
  details: z.record(z.string(), z.unknown()).optional(),
}).strict();

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ArtifactSchema = z.object({
  // Artifact ID
  id: z.string(),
  // Artifact name
  name: z.string(),
  // Artifact type
  type: z.enum(['storybook', 'docs', 'api']),
  // Artifact version
  version: z.string(),
  // Artifact URL
  url: z.string(),
}).strict();

export type Artifact = z.infer<typeof ArtifactSchema>;

export const ChatMessageSchema = z.object({
  // Message role
  role: z.enum(['user', 'assistant', 'system']),
  // Message content
  content: z.string(),
}).strict();

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  // Array of messages in conversation
  messages: z.array(ChatMessageSchema),
}).strict();

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  // Response message ID
  id: z.string(),
  // Response role
  role: z.enum(['assistant']),
  // Response content
  content: z.string(),
  // Response timestamp
  timestamp: z.string(),
}).strict();

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const ConsolidatedDocumentSchema = z.object({
  // Generated document ID
  id: z.string(),
  // Generated title
  title: z.string(),
  // Consolidated content
  content: z.string(),
  // Source document IDs
  sources: z.array(z.string()),
  // Creation timestamp
  createdAt: z.string(),
}).strict();

export type ConsolidatedDocument = z.infer<typeof ConsolidatedDocumentSchema>;

export const ConsolidationOptionsSchema = z.object({
  // Strategy for merging documents
  mergeStrategy: z.enum(['chronological', 'priority', 'semantic']).optional(),
}).strict();

export type ConsolidationOptions = z.infer<typeof ConsolidationOptionsSchema>;

export const ConsolidationRequestSchema = z.object({
  // Array of document IDs to consolidate
  documents: z.array(z.string()),
  // Consolidation options
  options: z.unknown().optional(),
}).strict();

export type ConsolidationRequest = z.infer<typeof ConsolidationRequestSchema>;

export const CostBreakdownSchema = z.object({
  // Input tokens used
  inputTokens: z.number().int(),
  // Output tokens generated
  outputTokens: z.number().int(),
  // Cost for input tokens
  inputCost: z.number(),
  // Cost for output tokens
  outputCost: z.number(),
}).strict();

export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;

export const CostEstimationRequestSchema = z.object({
  // Type of operation
  operation: z.enum(['chat', 'consolidate', 'generate']),
  // Input size in characters or tokens
  inputSize: z.number().int(),
}).strict();

export type CostEstimationRequest = z.infer<typeof CostEstimationRequestSchema>;

export const CreateDocumentInputSchema = z.object({
  // Document title
  title: z.string(),
  // Document content
  content: z.string(),
  // Document type
  type: z.unknown(),
  // Parent document ID
  parentId: z.string().optional(),
  // Tags
  tags: z.array(z.string()).optional(),
}).strict();

export type CreateDocumentInput = z.infer<typeof CreateDocumentInputSchema>;

export const CreateReleaseInputSchema = z.object({
  // Release name
  name: z.string(),
  // Release description
  description: z.string().optional(),
  // Semantic version
  version: z.string(),
  // Initial pages
  pages: z.array(z.string()).optional(),
  // Tags
  tags: z.array(z.string()).optional(),
}).strict();

export type CreateReleaseInput = z.infer<typeof CreateReleaseInputSchema>;

export const CustomizedTemplateSchema = z.object({
  // Generated template ID
  id: z.string(),
  // Template name
  name: z.string(),
  // Template content
  content: z.string(),
  // Template variables
  variables: z.record(z.string(), z.unknown()),
}).strict();

export type CustomizedTemplate = z.infer<typeof CustomizedTemplateSchema>;

export const DashboardStatsSchema = z.object({
  // Total number of documents
  documents: z.number().int(),
  // Total number of releases
  releases: z.number().int(),
  // Total number of pages
  pages: z.number().int(),
  // Total number of workflows
  workflows: z.number().int(),
  // Active users in last 24 hours
  activeUsers: z.number().int().optional(),
  // AI operations in last 24 hours
  aiOperations: z.number().int().optional(),
}).strict();

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const QuickActionSchema = z.object({
  // Action ID
  id: z.string(),
  // Action title
  title: z.string(),
  // Action description
  description: z.string(),
  // Action color theme
  color: z.enum(['blue', 'green', 'purple', 'orange', 'red']),
  // Icon name
  icon: z.string().optional(),
  // Action URL or route
  href: z.string().optional(),
  // Click handler key
  action: z.string().optional(),
}).strict();

export type QuickAction = z.infer<typeof QuickActionSchema>;

export const ProjectSummarySchema = z.object({
  // Project ID
  id: z.string(),
  // Project name
  name: z.string(),
  // Project description
  description: z.string().optional(),
  // Last activity timestamp
  lastActivity: z.string().datetime(),
  // Progress percentage
  progress: z.number().int().optional(),
  // Project status
  status: z.enum(['active', 'paused', 'completed', 'draft', 'archived']),
}).strict();

export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;

export const DashboardDataSchema = z.object({
  // Dashboard statistics
  stats: z.unknown(),
  // Recent activity items
  recentActivity: z.array(ActivityItemSchema),
  // Quick actions
  quickActions: z.array(QuickActionSchema),
  // User's current projects
  currentProjects: z.array(ProjectSummarySchema).optional(),
}).strict();

export type DashboardData = z.infer<typeof DashboardDataSchema>;

export const DocumentMetadataSchema = z.object({
  // Word count
  wordCount: z.number().int().optional(),
  // Reading time in minutes
  readingTime: z.number().int().optional(),
  // Last AI processing timestamp
  lastProcessed: z.string().datetime().optional(),
  // AI-generated summary
  summary: z.string().optional(),
  // Key topics extracted
  topics: z.array(z.string()).optional(),
  // Related document IDs
  relatedDocuments: z.array(z.string()).optional(),
}).strict();

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

export const DocumentSchema = z.object({
  // Unique identifier
  id: z.string(),
  // Document title
  title: z.string(),
  // Document content in markdown
  content: z.string(),
  // Document type
  type: z.unknown(),
  // Document status
  status: z.unknown(),
  // Parent document ID for hierarchical structure
  parentId: z.string().optional(),
  // Child document IDs
  children: z.array(z.string()).optional(),
  // Document metadata
  metadata: z.unknown().optional(),
  // Tags for categorization
  tags: z.array(z.string()).optional(),
  // Whether this document is authoritative
  authoritative: z.boolean().default(false),
  // Created by user ID
  createdBy: z.string(),
  // Creation timestamp
  createdAt: z.string().datetime(),
  // Last update timestamp
  updatedAt: z.string().datetime(),
  // Version number
  version: z.number().int().default(1),
}).strict();

export type Document = z.infer<typeof DocumentSchema>;

export const EstimatedCostSchema = z.object({
  // Total tokens
  tokens: z.number().int(),
  // Total cost
  cost: z.number(),
  // Currency code
  currency: z.string(),
  // AI model used
  modelName: z.string(),
}).strict();

export type EstimatedCost = z.infer<typeof EstimatedCostSchema>;

export const ServiceHealthSchema = z.object({
  // Service health status
  database: z.enum(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
  // AI service status
  ai: z.enum(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
  // Authentication service status
  auth: z.enum(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
}).strict();

export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;

export const HealthStatusSchema = z.object({
  // Overall system status
  status: z.enum(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
  // Status check timestamp
  timestamp: z.string(),
  // Individual service statuses
  services: z.unknown(),
}).strict();

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const OperationStatusSchema = z.object({
  // Operation ID
  id: z.string(),
  // Operation status
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  // Progress percentage (0-100)
  progress: z.number().int().optional(),
  // Status message
  message: z.string().optional(),
  // Estimated completion time
  estimatedCompletion: z.string().optional(),
}).strict();

export type OperationStatus = z.infer<typeof OperationStatusSchema>;

export const OrganizationSchema = z.object({
  // Organization ID
  id: z.string(),
  // Organization name
  name: z.string(),
  // User's role in organization
  role: z.enum(['owner', 'admin', 'member']),
}).strict();

export type Organization = z.infer<typeof OrganizationSchema>;

export const PageSchema = z.object({
  // Page ID
  id: z.string(),
  // Page name
  name: z.string(),
  // Page path
  path: z.string(),
  // Page type
  type: z.enum(['wireframe', 'component', 'template']),
  // Page content
  content: z.string().optional(),
  // Page metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();

export type Page = z.infer<typeof PageSchema>;

export const PageConfigSchema = z.object({
  // Page ID
  id: z.string(),
  // Page path
  path: z.string(),
  // Page title
  title: z.string(),
  // Component name
  component: z.string(),
  // Page props
  props: z.record(z.string(), z.unknown()).optional(),
}).strict();

export type PageConfig = z.infer<typeof PageConfigSchema>;

export const PaginationMetaSchema = z.object({
  // Current page number
  page: z.number().int(),
  // Number of items per page
  limit: z.number().int(),
  // Total number of items
  total: z.number().int(),
  // Total number of pages
  totalPages: z.number().int(),
  // Whether there's a next page
  hasNext: z.boolean(),
  // Whether there's a previous page
  hasPrev: z.boolean(),
}).strict();

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const ReleaseManifestSchema = z.object({
  // Manifest version
  version: z.string().default('1.0.0'),
  // Release title
  title: z.string(),
  // Release description
  description: z.string().optional(),
  // Release metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
  // Page configurations
  pages: z.array(PageConfigSchema).optional(),
}).strict();

export type ReleaseManifest = z.infer<typeof ReleaseManifestSchema>;

export const ReleaseSchema = z.object({
  // Unique identifier
  id: z.string(),
  // Release name
  name: z.string(),
  // Release description
  description: z.string().optional(),
  // Semantic version
  version: z.string(),
  // Release status
  status: z.unknown(),
  // Release manifest
  manifest: z.unknown(),
  // Pages included in release
  pages: z.array(PageSchema),
  // Created by user ID
  createdBy: z.string(),
  // Creation timestamp
  createdAt: z.string().datetime(),
  // Last update timestamp
  updatedAt: z.string().datetime(),
  // Published timestamp
  publishedAt: z.string().datetime().optional(),
  // Tags for categorization
  tags: z.array(z.string()).optional(),
}).strict();

export type Release = z.infer<typeof ReleaseSchema>;

export const SSEFallbackSchema = z.object({
  // Fallback message
  message: z.string(),
  // Fallback documents data
  documents: z.array(DocumentSchema),
}).strict();

export type SSEFallback = z.infer<typeof SSEFallbackSchema>;

export const SearchResultsSchema = z.object({
  // Matching documents
  documents: z.array(DocumentSchema),
  // Matching releases
  releases: z.array(ReleaseSchema),
  // Total number of results
  total: z.number().int(),
}).strict();

export type SearchResults = z.infer<typeof SearchResultsSchema>;

export const StorybookHealthStatusSchema = z.object({
  // Health status
  status: z.enum(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
  // Running mode
  mode: z.enum(['storybook']),
  // Mock data enabled
  mocking: z.enum(['true']),
  // Status timestamp
  timestamp: z.string(),
}).strict();

export type StorybookHealthStatus = z.infer<typeof StorybookHealthStatusSchema>;

export const TemplateSchema = z.object({
  // Template ID
  id: z.string(),
  // Template name
  name: z.string(),
  // Template description
  description: z.string(),
  // Template category
  category: z.string(),
}).strict();

export type Template = z.infer<typeof TemplateSchema>;

export const TemplateCustomizationRequestSchema = z.object({
  // Template ID to customize
  templateId: z.string(),
  // Custom name
  name: z.string().optional(),
  // Template variables
  variables: z.record(z.string(), z.unknown()).optional(),
}).strict();

export type TemplateCustomizationRequest = z.infer<typeof TemplateCustomizationRequestSchema>;

export const UpdateDocumentInputSchema = z.object({
  // Document title
  title: z.string().optional(),
  // Document content
  content: z.string().optional(),
  // Document status
  status: z.unknown().optional(),
  // Tags
  tags: z.array(z.string()).optional(),
}).strict();

export type UpdateDocumentInput = z.infer<typeof UpdateDocumentInputSchema>;

export const UsageLimitsSchema = z.object({
  // Monthly request limit
  monthlyRequests: z.number().int(),
  // Monthly token limit
  monthlyTokens: z.number().int(),
  // Monthly cost limit
  monthlyCost: z.number(),
}).strict();

export type UsageLimits = z.infer<typeof UsageLimitsSchema>;

export const UsagePeriodSchema = z.object({
  // Number of API requests
  requests: z.number().int(),
  // Total tokens used
  tokens: z.number().int(),
  // Total cost
  cost: z.number(),
}).strict();

export type UsagePeriod = z.infer<typeof UsagePeriodSchema>;

export const UsageMetricsSchema = z.object({
  // Current month usage
  currentMonth: z.unknown(),
  // Previous month usage
  lastMonth: z.unknown(),
  // Account limits
  limits: z.unknown(),
}).strict();

export type UsageMetrics = z.infer<typeof UsageMetricsSchema>;

export const UserPreferencesSchema = z.object({
  // UI theme preference
  theme: z.enum(['light', 'dark', 'auto']),
  // Email notifications enabled
  notifications: z.boolean().default(true),
  // Language preference
  language: z.string().default('en'),
  // Timezone
  timezone: z.string().optional(),
}).strict();

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const UserSchema = z.object({
  // Unique identifier
  id: z.string(),
  // User's email address
  email: z.string(),
  // User's display name
  name: z.string().optional(),
  // User's avatar URL
  avatar: z.string().optional(),
  // User's role in the system
  role: z.enum(['admin', 'user', 'viewer']),
  // Organization information
  organization: z.unknown().optional(),
  // User preferences
  preferences: z.unknown().optional(),
  // Account creation timestamp
  createdAt: z.string().datetime(),
  // Last update timestamp
  updatedAt: z.string().datetime(),
  // Is user account active
  isActive: z.boolean().default(true),
}).strict();

export type User = z.infer<typeof UserSchema>;

export const WorkflowSchema = z.object({
  // Workflow ID
  id: z.string(),
  // Workflow name
  name: z.string(),
  // Workflow description
  description: z.string(),
  // Workflow status
  status: z.enum(['active', 'paused', 'completed', 'draft', 'archived']),
  // Number of workflow steps
  steps: z.number().int(),
  // Creation timestamp
  createdAt: z.string(),
}).strict();

export type Workflow = z.infer<typeof WorkflowSchema>;

export const WorkflowExecutionSchema = z.object({
  // Execution ID
  executionId: z.string(),
  // Workflow ID
  workflowId: z.string(),
  // Execution status
  status: z.enum(['running', 'completed', 'failed']),
  // Start timestamp
  startedAt: z.string(),
  // Estimated completion time
  estimatedDuration: z.string().optional(),
}).strict();

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;

