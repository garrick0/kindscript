// Generated mock factories from TypeSpec
// Do not edit manually - regenerate using npm run typespec:generate

import { faker } from '@faker-js/faker';
import type * as Types from './types';

export function createActivityItem(overrides?: Partial<Types.ActivityItem>): Types.ActivityItem {
  return {
    id: faker.string.uuid(),
    type: 'general',
    action: faker.lorem.word(),
    time: faker.lorem.word(),
    userName: faker.person.fullName(),
    userId: faker.string.uuid(),
    resourceId: faker.string.uuid(),
    resourceName: faker.commerce.productName(),
    timestamp: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createApiError(overrides?: Partial<Types.ApiError>): Types.ApiError {
  return {
    message: faker.lorem.word(),
    code: faker.lorem.word(),
    details: {},
    ...overrides,
  };
}

export function createArtifact(overrides?: Partial<Types.Artifact>): Types.Artifact {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    type: faker.helpers.arrayElement(['storybook', 'docs', 'api']),
    version: faker.lorem.word(),
    url: faker.lorem.word(),
    ...overrides,
  };
}

export function createChatMessage(overrides?: Partial<Types.ChatMessage>): Types.ChatMessage {
  return {
    role: faker.helpers.arrayElement(['user', 'assistant', 'system']),
    content: faker.lorem.paragraphs(3),
    ...overrides,
  };
}

export function createChatRequest(overrides?: Partial<Types.ChatRequest>): Types.ChatRequest {
  return {
    messages: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createChatMessage()),
    ...overrides,
  };
}

export function createChatResponse(overrides?: Partial<Types.ChatResponse>): Types.ChatResponse {
  return {
    id: faker.string.uuid(),
    role: faker.helpers.arrayElement(['assistant']),
    content: faker.lorem.paragraphs(3),
    timestamp: faker.lorem.word(),
    ...overrides,
  };
}

export function createConsolidatedDocument(overrides?: Partial<Types.ConsolidatedDocument>): Types.ConsolidatedDocument {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    sources: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createConsolidationOptions(overrides?: Partial<Types.ConsolidationOptions>): Types.ConsolidationOptions {
  return {
    mergeStrategy: faker.helpers.arrayElement(['chronological', 'priority', 'semantic']),
    ...overrides,
  };
}

export function createConsolidationRequest(overrides?: Partial<Types.ConsolidationRequest>): Types.ConsolidationRequest {
  return {
    documents: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    options: null,
    ...overrides,
  };
}

export function createCostBreakdown(overrides?: Partial<Types.CostBreakdown>): Types.CostBreakdown {
  return {
    inputTokens: faker.number.int({ min: 1, max: 100 }),
    outputTokens: faker.number.int({ min: 1, max: 100 }),
    inputCost: faker.number.int({ min: 1, max: 100 }),
    outputCost: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}

export function createCostEstimationRequest(overrides?: Partial<Types.CostEstimationRequest>): Types.CostEstimationRequest {
  return {
    operation: faker.helpers.arrayElement(['chat', 'consolidate', 'generate']),
    inputSize: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}

export function createCreateDocumentInput(overrides?: Partial<Types.CreateDocumentInput>): Types.CreateDocumentInput {
  return {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    type: 'general',
    parentId: faker.string.uuid(),
    tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    ...overrides,
  };
}

export function createCreateReleaseInput(overrides?: Partial<Types.CreateReleaseInput>): Types.CreateReleaseInput {
  return {
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    version: faker.lorem.word(),
    pages: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    ...overrides,
  };
}

export function createCustomizedTemplate(overrides?: Partial<Types.CustomizedTemplate>): Types.CustomizedTemplate {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    content: faker.lorem.paragraphs(3),
    variables: {},
    ...overrides,
  };
}

export function createDashboardData(overrides?: Partial<Types.DashboardData>): Types.DashboardData {
  return {
    stats: createDashboardStats(),
    recentActivity: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createActivityItem()),
    quickActions: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createQuickAction()),
    currentProjects: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createProjectSummary()),
    ...overrides,
  };
}

export function createDashboardStats(overrides?: Partial<Types.DashboardStats>): Types.DashboardStats {
  return {
    documents: faker.number.int({ min: 1, max: 100 }),
    releases: faker.number.int({ min: 1, max: 100 }),
    pages: faker.number.int({ min: 1, max: 100 }),
    workflows: faker.number.int({ min: 1, max: 100 }),
    activeUsers: faker.number.int({ min: 1, max: 100 }),
    aiOperations: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}

export function createDocument(overrides?: Partial<Types.Document>): Types.Document {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    type: 'general',
    status: 'draft',
    parentId: faker.string.uuid(),
    children: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    metadata: { version: '1.0.0', author: faker.person.fullName() },
    tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    authoritative: faker.datatype.boolean(),
    createdBy: faker.lorem.word(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.past().toISOString(),
    version: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}

export function createDocumentMetadata(overrides?: Partial<Types.DocumentMetadata>): Types.DocumentMetadata {
  return {
    wordCount: faker.number.int({ min: 1, max: 100 }),
    readingTime: faker.number.int({ min: 1, max: 100 }),
    lastProcessed: faker.date.recent().toISOString(),
    summary: faker.lorem.word(),
    topics: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    relatedDocuments: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    ...overrides,
  };
}

export function createEstimatedCost(overrides?: Partial<Types.EstimatedCost>): Types.EstimatedCost {
  return {
    tokens: faker.number.int({ min: 1, max: 100 }),
    cost: faker.number.int({ min: 1, max: 100 }),
    currency: faker.lorem.word(),
    modelName: faker.commerce.productName(),
    ...overrides,
  };
}

export function createHealthStatus(overrides?: Partial<Types.HealthStatus>): Types.HealthStatus {
  return {
    status: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
    timestamp: faker.lorem.word(),
    services: null,
    ...overrides,
  };
}

export function createOperationStatus(overrides?: Partial<Types.OperationStatus>): Types.OperationStatus {
  return {
    id: faker.string.uuid(),
    status: faker.helpers.arrayElement(['pending', 'processing', 'completed', 'failed', 'cancelled']),
    progress: faker.number.int({ min: 1, max: 100 }),
    message: faker.lorem.word(),
    estimatedCompletion: faker.lorem.word(),
    ...overrides,
  };
}

export function createOrganization(overrides?: Partial<Types.Organization>): Types.Organization {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    role: faker.helpers.arrayElement(['owner', 'admin', 'member']),
    ...overrides,
  };
}

export function createPage(overrides?: Partial<Types.Page>): Types.Page {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    path: faker.lorem.word(),
    type: faker.helpers.arrayElement(['wireframe', 'component', 'template']),
    content: faker.lorem.paragraphs(3),
    metadata: { version: '1.0.0', author: faker.person.fullName() },
    ...overrides,
  };
}

export function createPageConfig(overrides?: Partial<Types.PageConfig>): Types.PageConfig {
  return {
    id: faker.string.uuid(),
    path: faker.lorem.word(),
    title: faker.lorem.sentence(),
    component: faker.lorem.word(),
    props: {},
    ...overrides,
  };
}

export function createPaginationMeta(overrides?: Partial<Types.PaginationMeta>): Types.PaginationMeta {
  return {
    page: faker.number.int({ min: 1, max: 100 }),
    limit: faker.number.int({ min: 1, max: 100 }),
    total: faker.number.int({ min: 1, max: 100 }),
    totalPages: faker.number.int({ min: 1, max: 100 }),
    hasNext: faker.datatype.boolean(),
    hasPrev: faker.datatype.boolean(),
    ...overrides,
  };
}

export function createProjectSummary(overrides?: Partial<Types.ProjectSummary>): Types.ProjectSummary {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    lastActivity: faker.date.recent().toISOString(),
    progress: faker.number.int({ min: 1, max: 100 }),
    status: faker.helpers.arrayElement(['active', 'paused', 'completed', 'draft', 'archived']),
    ...overrides,
  };
}

export function createQuickAction(overrides?: Partial<Types.QuickAction>): Types.QuickAction {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    color: faker.helpers.arrayElement(['blue', 'green', 'purple', 'orange', 'red']),
    icon: faker.lorem.word(),
    href: faker.lorem.word(),
    action: faker.lorem.word(),
    ...overrides,
  };
}

export function createRelease(overrides?: Partial<Types.Release>): Types.Release {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    version: faker.lorem.word(),
    status: 'draft',
    manifest: createReleaseManifest(),
    pages: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createPage()),
    createdBy: faker.lorem.word(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.past().toISOString(),
    publishedAt: faker.date.recent().toISOString(),
    tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    ...overrides,
  };
}

export function createReleaseManifest(overrides?: Partial<Types.ReleaseManifest>): Types.ReleaseManifest {
  return {
    version: faker.lorem.word(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    metadata: { version: '1.0.0', author: faker.person.fullName() },
    pages: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createPageConfig()),
    ...overrides,
  };
}

export function createSSEFallback(overrides?: Partial<Types.SSEFallback>): Types.SSEFallback {
  return {
    message: faker.lorem.word(),
    documents: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createDocument()),
    ...overrides,
  };
}

export function createSearchResults(overrides?: Partial<Types.SearchResults>): Types.SearchResults {
  return {
    documents: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createDocument()),
    releases: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => createRelease()),
    total: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}

export function createServiceHealth(overrides?: Partial<Types.ServiceHealth>): Types.ServiceHealth {
  return {
    database: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
    ai: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
    auth: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
    ...overrides,
  };
}

export function createStorybookHealthStatus(overrides?: Partial<Types.StorybookHealthStatus>): Types.StorybookHealthStatus {
  return {
    status: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy', 'unhealthy', 'unhealthy', 'unhealthy']),
    mode: faker.helpers.arrayElement(['storybook']),
    mocking: faker.datatype.boolean(),
    timestamp: faker.lorem.word(),
    ...overrides,
  };
}

export function createTemplate(overrides?: Partial<Types.Template>): Types.Template {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    category: faker.lorem.word(),
    ...overrides,
  };
}

export function createTemplateCustomizationRequest(overrides?: Partial<Types.TemplateCustomizationRequest>): Types.TemplateCustomizationRequest {
  return {
    templateId: faker.string.uuid(),
    name: faker.commerce.productName(),
    variables: {},
    ...overrides,
  };
}

export function createUpdateDocumentInput(overrides?: Partial<Types.UpdateDocumentInput>): Types.UpdateDocumentInput {
  return {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    status: 'draft',
    tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()),
    ...overrides,
  };
}

export function createUsageLimits(overrides?: Partial<Types.UsageLimits>): Types.UsageLimits {
  return {
    monthlyRequests: faker.number.int({ min: 1, max: 100 }),
    monthlyTokens: faker.number.int({ min: 1, max: 100 }),
    monthlyCost: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}

export function createUsageMetrics(overrides?: Partial<Types.UsageMetrics>): Types.UsageMetrics {
  return {
    currentMonth: null,
    lastMonth: null,
    limits: null,
    ...overrides,
  };
}

export function createUsagePeriod(overrides?: Partial<Types.UsagePeriod>): Types.UsagePeriod {
  return {
    requests: faker.number.int({ min: 1, max: 100 }),
    tokens: faker.number.int({ min: 1, max: 100 }),
    cost: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}

export function createUser(overrides?: Partial<Types.User>): Types.User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.commerce.productName(),
    avatar: faker.image.avatar(),
    role: faker.helpers.arrayElement(['admin', 'user', 'viewer']),
    organization: { id: faker.string.uuid(), name: faker.company.name() },
    preferences: null,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.past().toISOString(),
    isActive: faker.datatype.boolean(),
    ...overrides,
  };
}

export function createUserPreferences(overrides?: Partial<Types.UserPreferences>): Types.UserPreferences {
  return {
    theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
    notifications: faker.datatype.boolean(),
    language: faker.lorem.word(),
    timezone: faker.lorem.word(),
    ...overrides,
  };
}

export function createWorkflow(overrides?: Partial<Types.Workflow>): Types.Workflow {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['active', 'paused', 'completed', 'draft', 'archived']),
    steps: faker.number.int({ min: 1, max: 100 }),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createWorkflowExecution(overrides?: Partial<Types.WorkflowExecution>): Types.WorkflowExecution {
  return {
    executionId: faker.string.uuid(),
    workflowId: faker.string.uuid(),
    status: faker.helpers.arrayElement(['running', 'completed', 'failed']),
    startedAt: faker.lorem.word(),
    estimatedDuration: faker.lorem.word(),
    ...overrides,
  };
}

