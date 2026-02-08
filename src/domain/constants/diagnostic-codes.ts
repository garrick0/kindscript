/** Centralized error codes for KindScript diagnostics (70000 range). */
export const DiagnosticCode = {
  ForbiddenDependency: 70001,
  MissingImplementation: 70002,
  ImpureImport: 70003,
  CircularDependency: 70004,
  MirrorMismatch: 70005,
  LocationNotFound: 70010,
  InvalidContract: 70099,
} as const;

export type DiagnosticCode = (typeof DiagnosticCode)[keyof typeof DiagnosticCode];
