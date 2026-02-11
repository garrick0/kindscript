/** Centralized error codes for KindScript diagnostics (70000 range). */
export const DiagnosticCode = {
  ForbiddenDependency: 70001,
  ImpureImport: 70003,
  CircularDependency: 70004,
  ScopeMismatch: 70005,
  MemberOverlap: 70006,
  UnassignedCode: 70007,
  InvalidContract: 70099,
} as const;

export type DiagnosticCode = (typeof DiagnosticCode)[keyof typeof DiagnosticCode];
