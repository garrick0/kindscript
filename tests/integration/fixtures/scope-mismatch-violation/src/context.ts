/**
 * Scope mismatch fixture — Kind requires folder scope but instance points at a file.
 *
 * FolderModule declares scope='folder', but the instance path
 * './context.ts' resolves to this file (not a directory).
 * This should produce a KS70005 ScopeMismatch diagnostic.
 */

import type { Kind, Instance } from 'kindscript';

type FolderModule = Kind<"FolderModule", {}, {}, "folder">;

export const wrong = {} satisfies Instance<FolderModule, './context.ts'>;
