/** Centralized error codes for KindScript diagnostics (70000 range). */
export const DiagnosticCode = {
  ForbiddenDependency: 70001,
  MissingImplementation: 70002,
  ImpureImport: 70003,
  CircularDependency: 70004,
  NotColocated: 70005,
  InvalidContract: 70099,
} as const;

export type DiagnosticCode = (typeof DiagnosticCode)[keyof typeof DiagnosticCode];
