// Generated TypeScript types from TypeSpec
// Do not edit manually - regenerate using npm run typespec:generate

export interface Models_ActivityItem {
  /** Activity ID */
  id: string;
  /** Activity type */
  type: unknown;
  /** Activity action description */
  action: string;
  /** Time description (e.g., '2 hours ago') */
  time: string;
  /** User who performed the action */
  userName?: string;
  /** User ID */
  userId?: string;
  /** Related resource ID */
  resourceId?: string;
  /** Related resource name */
  resourceName?: string;
  /** Activity timestamp */
  timestamp: string;
}

export type Models_ActivityType = 'document' | 'release' | 'page' | 'workflow' | 'system' | 'user';

export interface Models_ApiError {
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

export interface Models_Artifact {
  /** Artifact ID */
  id: string;
  /** Artifact name */
  name: string;
  /** Artifact type */
  type: 'storybook' | 'docs' | 'api';
  /** Artifact version */
  version: string;
  /** Artifact URL */
  url: string;
}

export interface Models_ChatMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
}

export interface Models_ChatRequest {
  /** Array of messages in conversation */
  messages: Models_ChatMessage[];
}

export interface Models_ChatResponse {
  /** Response message ID */
  id: string;
  /** Response role */
  role: 'assistant';
  /** Response content */
  content: string;
  /** Response timestamp */
  timestamp: string;
}

export interface Models_ConsolidatedDocument {
  /** Generated document ID */
  id: string;
  /** Generated title */
  title: string;
  /** Consolidated content */
  content: string;
  /** Source document IDs */
  sources: string[];
  /** Creation timestamp */
  createdAt: string;
}

export interface Models_ConsolidationOptions {
  /** Strategy for merging documents */
  mergeStrategy?: 'chronological' | 'priority' | 'semantic';
}

export interface Models_ConsolidationRequest {
  /** Array of document IDs to consolidate */
  documents: string[];
  /** Consolidation options */
  options?: unknown;
}

export interface Models_CostBreakdown {
  /** Input tokens used */
  inputTokens: number;
  /** Output tokens generated */
  outputTokens: number;
  /** Cost for input tokens */
  inputCost: number;
  /** Cost for output tokens */
  outputCost: number;
}

export interface Models_CostEstimationRequest {
  /** Type of operation */
  operation: 'chat' | 'consolidate' | 'generate';
  /** Input size in characters or tokens */
  inputSize: number;
}

export interface Models_CreateDocumentInput {
  /** Document title */
  title: string;
  /** Document content */
  content: string;
  /** Document type */
  type: unknown;
  /** Parent document ID */
  parentId?: string;
  /** Tags */
  tags?: string[];
}

export interface Models_CreateReleaseInput {
  /** Release name */
  name: string;
  /** Release description */
  description?: string;
  /** Semantic version */
  version: string;
  /** Initial pages */
  pages?: string[];
  /** Tags */
  tags?: string[];
}

export interface Models_CustomizedTemplate {
  /** Generated template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template content */
  content: string;
  /** Template variables */
  variables: Record<string, unknown>;
}

export interface Models_DashboardData {
  /** Dashboard statistics */
  stats: unknown;
  /** Recent activity items */
  recentActivity: Models_ActivityItem[];
  /** Quick actions */
  quickActions: Models_QuickAction[];
  /** User's current projects */
  currentProjects?: Models_ProjectSummary[];
}

export interface Models_DashboardStats {
  /** Total number of documents */
  documents: number;
  /** Total number of releases */
  releases: number;
  /** Total number of pages */
  pages: number;
  /** Total number of workflows */
  workflows: number;
  /** Active users in last 24 hours */
  activeUsers?: number;
  /** AI operations in last 24 hours */
  aiOperations?: number;
}

export interface Models_Document {
  /** Unique identifier */
  id: string;
  /** Document title */
  title: string;
  /** Document content in markdown */
  content: string;
  /** Document type */
  type: unknown;
  /** Document status */
  status: unknown;
  /** Parent document ID for hierarchical structure */
  parentId?: string;
  /** Child document IDs */
  children?: string[];
  /** Document metadata */
  metadata?: unknown;
  /** Tags for categorization */
  tags?: string[];
  /** Whether this document is authoritative */
  authoritative: boolean;
  /** Created by user ID */
  createdBy: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Version number */
  version: number;
}

export interface Models_DocumentMetadata {
  /** Word count */
  wordCount?: number;
  /** Reading time in minutes */
  readingTime?: number;
  /** Last AI processing timestamp */
  lastProcessed?: string;
  /** AI-generated summary */
  summary?: string;
  /** Key topics extracted */
  topics?: string[];
  /** Related document IDs */
  relatedDocuments?: string[];
}

export type Models_DocumentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export type Models_DocumentType = 'prd' | 'spec' | 'story' | 'design' | 'api' | 'general';

export interface Models_EstimatedCost {
  /** Total tokens */
  tokens: number;
  /** Total cost */
  cost: number;
  /** Currency code */
  currency: string;
  /** AI model used */
  modelName: string;
}

export interface Models_HealthStatus {
  /** Overall system status */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unhealthy' | 'unhealthy' | 'unhealthy';
  /** Status check timestamp */
  timestamp: string;
  /** Individual service statuses */
  services: unknown;
}

export interface Models_OperationStatus {
  /** Operation ID */
  id: string;
  /** Operation status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  /** Progress percentage (0-100) */
  progress?: number;
  /** Status message */
  message?: string;
  /** Estimated completion time */
  estimatedCompletion?: string;
}

export interface Models_Organization {
  /** Organization ID */
  id: string;
  /** Organization name */
  name: string;
  /** User's role in organization */
  role: 'owner' | 'admin' | 'member';
}

export interface Models_Page {
  /** Page ID */
  id: string;
  /** Page name */
  name: string;
  /** Page path */
  path: string;
  /** Page type */
  type: 'wireframe' | 'component' | 'template';
  /** Page content */
  content?: string;
  /** Page metadata */
  metadata?: Record<string, unknown>;
}

export interface Models_PageConfig {
  /** Page ID */
  id: string;
  /** Page path */
  path: string;
  /** Page title */
  title: string;
  /** Component name */
  component: string;
  /** Page props */
  props?: Record<string, unknown>;
}

export interface Models_PaginationMeta {
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there's a next page */
  hasNext: boolean;
  /** Whether there's a previous page */
  hasPrev: boolean;
}

export interface Models_ProjectSummary {
  /** Project ID */
  id: string;
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** Last activity timestamp */
  lastActivity: string;
  /** Progress percentage */
  progress?: number;
  /** Project status */
  status: 'active' | 'paused' | 'completed' | 'draft' | 'archived';
}

export interface Models_QuickAction {
  /** Action ID */
  id: string;
  /** Action title */
  title: string;
  /** Action description */
  description: string;
  /** Action color theme */
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  /** Icon name */
  icon?: string;
  /** Action URL or route */
  href?: string;
  /** Click handler key */
  action?: string;
}

export interface Models_Release {
  /** Unique identifier */
  id: string;
  /** Release name */
  name: string;
  /** Release description */
  description?: string;
  /** Semantic version */
  version: string;
  /** Release status */
  status: unknown;
  /** Release manifest */
  manifest: unknown;
  /** Pages included in release */
  pages: Models_Page[];
  /** Created by user ID */
  createdBy: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Published timestamp */
  publishedAt?: string;
  /** Tags for categorization */
  tags?: string[];
}

export interface Models_ReleaseManifest {
  /** Manifest version */
  version: string;
  /** Release title */
  title: string;
  /** Release description */
  description?: string;
  /** Release metadata */
  metadata?: Record<string, unknown>;
  /** Page configurations */
  pages?: Models_PageConfig[];
}

export type Models_ReleaseStatus = 'draft' | 'review' | 'published' | 'archived';

export interface Models_SSEFallback {
  /** Fallback message */
  message: string;
  /** Fallback documents data */
  documents: Models_Document[];
}

export interface Models_SearchResults {
  /** Matching documents */
  documents: Models_Document[];
  /** Matching releases */
  releases: Models_Release[];
  /** Total number of results */
  total: number;
}

export interface Models_ServiceHealth {
  /** Service health status */
  database: 'healthy' | 'degraded' | 'unhealthy' | 'unhealthy' | 'unhealthy' | 'unhealthy';
  /** AI service status */
  ai: 'healthy' | 'degraded' | 'unhealthy' | 'unhealthy' | 'unhealthy' | 'unhealthy';
  /** Authentication service status */
  auth: 'healthy' | 'degraded' | 'unhealthy' | 'unhealthy' | 'unhealthy' | 'unhealthy';
}

export interface Models_StorybookHealthStatus {
  /** Health status */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unhealthy' | 'unhealthy' | 'unhealthy';
  /** Running mode */
  mode: 'storybook';
  /** Mock data enabled */
  mocking: boolean;
  /** Status timestamp */
  timestamp: string;
}

export interface Models_Template {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template category */
  category: string;
}

export interface Models_TemplateCustomizationRequest {
  /** Template ID to customize */
  templateId: string;
  /** Custom name */
  name?: string;
  /** Template variables */
  variables?: Record<string, unknown>;
}

export interface Models_UpdateDocumentInput {
  /** Document title */
  title?: string;
  /** Document content */
  content?: string;
  /** Document status */
  status?: unknown;
  /** Tags */
  tags?: string[];
}

export interface Models_UsageLimits {
  /** Monthly request limit */
  monthlyRequests: number;
  /** Monthly token limit */
  monthlyTokens: number;
  /** Monthly cost limit */
  monthlyCost: number;
}

export interface Models_UsageMetrics {
  /** Current month usage */
  currentMonth: unknown;
  /** Previous month usage */
  lastMonth: unknown;
  /** Account limits */
  limits: unknown;
}

export interface Models_UsagePeriod {
  /** Number of API requests */
  requests: number;
  /** Total tokens used */
  tokens: number;
  /** Total cost */
  cost: number;
}

export interface Models_User {
  /** Unique identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name?: string;
  /** User's avatar URL */
  avatar?: string;
  /** User's role in the system */
  role: 'admin' | 'user' | 'viewer';
  /** Organization information */
  organization?: unknown;
  /** User preferences */
  preferences?: unknown;
  /** Account creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Is user account active */
  isActive: boolean;
}

export interface Models_UserPreferences {
  /** UI theme preference */
  theme: 'light' | 'dark' | 'auto';
  /** Email notifications enabled */
  notifications: boolean;
  /** Language preference */
  language: string;
  /** Timezone */
  timezone?: string;
}

export interface Models_Workflow {
  /** Workflow ID */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow description */
  description: string;
  /** Workflow status */
  status: 'active' | 'paused' | 'completed' | 'draft' | 'archived';
  /** Number of workflow steps */
  steps: number;
  /** Creation timestamp */
  createdAt: string;
}

export interface Models_WorkflowExecution {
  /** Execution ID */
  executionId: string;
  /** Workflow ID */
  workflowId: string;
  /** Execution status */
  status: 'running' | 'completed' | 'failed';
  /** Start timestamp */
  startedAt: string;
  /** Estimated completion time */
  estimatedDuration?: string;
}


// Clean exports without namespace for direct imports
export type ActivityItem = Models_ActivityItem;
export type ActivityType = Models_ActivityType;
export type ApiError = Models_ApiError;
export type Artifact = Models_Artifact;
export type ChatMessage = Models_ChatMessage;
export type ChatRequest = Models_ChatRequest;
export type ChatResponse = Models_ChatResponse;
export type ConsolidatedDocument = Models_ConsolidatedDocument;
export type ConsolidationOptions = Models_ConsolidationOptions;
export type ConsolidationRequest = Models_ConsolidationRequest;
export type CostBreakdown = Models_CostBreakdown;
export type CostEstimationRequest = Models_CostEstimationRequest;
export type CreateDocumentInput = Models_CreateDocumentInput;
export type CreateReleaseInput = Models_CreateReleaseInput;
export type CustomizedTemplate = Models_CustomizedTemplate;
export type DashboardData = Models_DashboardData;
export type DashboardStats = Models_DashboardStats;
export type Document = Models_Document;
export type DocumentMetadata = Models_DocumentMetadata;
export type DocumentStatus = Models_DocumentStatus;
export type DocumentType = Models_DocumentType;
export type EstimatedCost = Models_EstimatedCost;
export type HealthStatus = Models_HealthStatus;
export type OperationStatus = Models_OperationStatus;
export type Organization = Models_Organization;
export type Page = Models_Page;
export type PageConfig = Models_PageConfig;
export type PaginationMeta = Models_PaginationMeta;
export type ProjectSummary = Models_ProjectSummary;
export type QuickAction = Models_QuickAction;
export type Release = Models_Release;
export type ReleaseManifest = Models_ReleaseManifest;
export type ReleaseStatus = Models_ReleaseStatus;
export type SSEFallback = Models_SSEFallback;
export type SearchResults = Models_SearchResults;
export type ServiceHealth = Models_ServiceHealth;
export type StorybookHealthStatus = Models_StorybookHealthStatus;
export type Template = Models_Template;
export type TemplateCustomizationRequest = Models_TemplateCustomizationRequest;
export type UpdateDocumentInput = Models_UpdateDocumentInput;
export type UsageLimits = Models_UsageLimits;
export type UsageMetrics = Models_UsageMetrics;
export type UsagePeriod = Models_UsagePeriod;
export type User = Models_User;
export type UserPreferences = Models_UserPreferences;
export type Workflow = Models_Workflow;
export type WorkflowExecution = Models_WorkflowExecution;
