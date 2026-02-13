import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;

@service({
  title: "Induction Studio API",
})
@server("http://localhost:3000/api", "Development server")
namespace InductionStudioAPI;

// ========================
// Authentication Models
// ========================

@doc("JWT authentication token")
model AuthToken {
  token: string;
  expiresIn: int32;
  tokenType: string;
}

@doc("User authentication credentials")
model LoginCredentials {
  email: string;
  password: string;
}

@doc("User profile information")
model UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  picture?: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

@doc("User role in the system")
enum UserRole {
  admin: "admin",
  user: "user",
  viewer: "viewer",
}

// ========================
// Document Models
// ========================

@doc("Document metadata")
model DocumentMetadata {
  author?: string;
  authoritative?: boolean;
  lastSyncedAt?: utcDateTime;
  tags?: string[];
  category?: string;
}

@doc("Document content and metadata")
model Document {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  metadata?: DocumentMetadata;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
  userId: string;
  versionNumber: int32;
  isActive: boolean;
}

@doc("Document type classification")
enum DocumentType {
  prd: "prd",
  spec: "spec",
  design: "design",
  note: "note",
  analysis: "analysis",
  implementation: "implementation",
}

@doc("Document version history")
model DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: int32;
  content: string;
  metadata?: DocumentMetadata;
  createdAt: utcDateTime;
  createdBy: string;
  changeLog?: string;
}

// ========================
// Release Models
// ========================

@doc("Release information")
model Release {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: ReleaseStatus;
  pages: PageReference[];
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
  publishedAt?: utcDateTime;
  author: string;
  metadata?: ReleaseMetadata;
}

@doc("Release metadata")
model ReleaseMetadata {
  tags?: string[];
  targetAudience?: string;
  dependencies?: string[];
  changelog?: string;
}

@doc("Release status")
enum ReleaseStatus {
  draft: "draft",
  published: "published",
  archived: "archived",
}

@doc("Reference to a page in a release")
model PageReference {
  pageId: string;
  version: string;
  order: int32;
}

// ========================
// Page Models
// ========================

@doc("Page definition")
model Page {
  id: string;
  name: string;
  title: string;
  description?: string;
  version: string;
  component: string;
  props?: Record<unknown>;
  layout?: string;
  route?: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
  author: string;
}

// ========================
// AI Models
// ========================

@doc("AI generation request")
model AIGenerationRequest {
  prompt: string;
  context?: string;
  type: AIGenerationType;
  parameters?: AIParameters;
}

@doc("AI generation parameters")
model AIParameters {
  temperature?: float32;
  maxTokens?: int32;
  modelName?: string;
  style?: string;
  tone?: string;
}

@doc("Type of AI generation")
enum AIGenerationType {
  component: "component",
  document: "document",
  page: "page",
  wireframe: "wireframe",
  spec: "spec",
  code: "code",
}

@doc("AI generation response")
model AIGenerationResponse {
  id: string;
  content: string;
  type: AIGenerationType;
  metadata?: Record<unknown>;
  createdAt: utcDateTime;
  processingTime: int32;
  tokensUsed: int32;
}

// ========================
// Common Models
// ========================

@doc("Pagination parameters")
model PaginationParams {
  @query page?: int32;
  @query limit?: int32;
  @query sortBy?: string;
  @query sortOrder?: "asc" | "desc";
}

@doc("Paginated response wrapper")
model PaginatedResponse<T> {
  data: T[];
  total: int32;
  page: int32;
  limit: int32;
  hasMore: boolean;
}

@doc("Error response")
@error
model ErrorResponse {
  error: string;
  message: string;
  statusCode: int32;
  details?: Record<unknown>;
}

@doc("Success response")
model SuccessResponse {
  success: boolean;
  message?: string;
  data?: Record<unknown>;
}

// ========================
// Authentication Endpoints
// ========================

@route("/auth")
namespace Auth {
  @post
  @doc("Authenticate user and get token")
  op login(@body credentials: LoginCredentials): AuthToken | ErrorResponse;

  @post
  @route("/logout")
  @doc("Logout current user")
  op logout(@header authorization: string): SuccessResponse | ErrorResponse;

  @get
  @route("/profile")
  @doc("Get current user profile")
  op getProfile(@header authorization: string): UserProfile | ErrorResponse;

  @put
  @route("/profile")
  @doc("Update user profile")
  op updateProfile(
    @header authorization: string,
    @body profile: UserProfile
  ): UserProfile | ErrorResponse;
}

// ========================
// Document Endpoints
// ========================

@route("/documents")
namespace Documents {
  @get
  @doc("List all documents with pagination")
  op listDocuments(
    @header authorization: string,
    ...PaginationParams,
    @query type?: DocumentType,
    @query search?: string
  ): PaginatedResponse<Document> | ErrorResponse;

  @post
  @doc("Create a new document")
  op createDocument(
    @header authorization: string,
    @body document: Document
  ): Document | ErrorResponse;

  @get
  @route("/{id}")
  @doc("Get document by ID")
  op getDocument(
    @header authorization: string,
    @path id: string
  ): Document | ErrorResponse;

  @put
  @route("/{id}")
  @doc("Update document")
  op updateDocument(
    @header authorization: string,
    @path id: string,
    @body document: Document
  ): Document | ErrorResponse;

  @delete
  @route("/{id}")
  @doc("Delete document")
  op deleteDocument(
    @header authorization: string,
    @path id: string
  ): SuccessResponse | ErrorResponse;

  @get
  @route("/{id}/versions")
  @doc("Get document version history")
  op getDocumentVersions(
    @header authorization: string,
    @path id: string
  ): DocumentVersion[] | ErrorResponse;
}

// ========================
// Release Endpoints
// ========================

@route("/releases")
namespace Releases {
  @get
  @doc("List all releases")
  op listReleases(
    @header authorization: string,
    ...PaginationParams,
    @query status?: ReleaseStatus
  ): PaginatedResponse<Release> | ErrorResponse;

  @post
  @doc("Create a new release")
  op createRelease(
    @header authorization: string,
    @body release: Release
  ): Release | ErrorResponse;

  @get
  @route("/{id}")
  @doc("Get release by ID")
  op getRelease(
    @header authorization: string,
    @path id: string
  ): Release | ErrorResponse;

  @put
  @route("/{id}")
  @doc("Update release")
  op updateRelease(
    @header authorization: string,
    @path id: string,
    @body release: Release
  ): Release | ErrorResponse;

  @post
  @route("/{id}/publish")
  @doc("Publish a release")
  op publishRelease(
    @header authorization: string,
    @path id: string
  ): Release | ErrorResponse;
}

// ========================
// Page Endpoints
// ========================

@route("/pages")
namespace Pages {
  @get
  @doc("List all pages")
  op listPages(
    @header authorization: string,
    ...PaginationParams
  ): PaginatedResponse<Page> | ErrorResponse;

  @post
  @doc("Create a new page")
  op createPage(
    @header authorization: string,
    @body page: Page
  ): Page | ErrorResponse;

  @get
  @route("/{id}")
  @doc("Get page by ID")
  op getPage(
    @header authorization: string,
    @path id: string
  ): Page | ErrorResponse;

  @put
  @route("/{id}")
  @doc("Update page")
  op updatePage(
    @header authorization: string,
    @path id: string,
    @body page: Page
  ): Page | ErrorResponse;
}

// ========================
// AI Endpoints
// ========================

@route("/ai")
namespace AI {
  @post
  @route("/generate")
  @doc("Generate content using AI")
  op generate(
    @header authorization: string,
    @body request: AIGenerationRequest
  ): AIGenerationResponse | ErrorResponse;

  @post
  @route("/chat")
  @doc("Chat with AI assistant")
  op chat(
    @header authorization: string,
    @body message: {
      content: string;
      context?: string;
      conversationId?: string;
    }
  ): {
    response: string;
    conversationId: string;
    metadata?: Record<unknown>;
  } | ErrorResponse;

  @post
  @route("/analyze")
  @doc("Analyze content with AI")
  op analyze(
    @header authorization: string,
    @body request: {
      content: string;
      analysisType: "sentiment" | "summary" | "keywords" | "classification";
      options?: Record<unknown>;
    }
  ): {
    result: Record<unknown>;
    confidence: float32;
    metadata?: Record<unknown>;
  } | ErrorResponse;
}

// ========================
// User Management Endpoints
// ========================

@route("/users")
namespace Users {
  @get
  @doc("List all users (admin only)")
  op listUsers(
    @header authorization: string,
    ...PaginationParams,
    @query role?: UserRole,
    @query search?: string
  ): PaginatedResponse<UserProfile> | ErrorResponse;

  @get
  @route("/{id}")
  @doc("Get user by ID")
  op getUser(
    @header authorization: string,
    @path id: string
  ): UserProfile | ErrorResponse;

  @put
  @route("/{id}/role")
  @doc("Update user role (admin only)")
  op updateUserRole(
    @header authorization: string,
    @path id: string,
    @body role: { role: UserRole }
  ): UserProfile | ErrorResponse;

  @delete
  @route("/{id}")
  @doc("Delete user (admin only)")
  op deleteUser(
    @header authorization: string,
    @path id: string
  ): SuccessResponse | ErrorResponse;
}

// ========================
// Health Check
// ========================

@route("/health")
@get
@doc("Health check endpoint")
op healthCheck(): {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: utcDateTime;
  services?: Record<unknown>;
} | ErrorResponse;