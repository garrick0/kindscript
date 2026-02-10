/**
 * Scope override fixture — leaf Kind with folder scope.
 *
 * PureModule is a leaf Kind (no members) with scope="folder",
 * so it constrains the whole utils/ directory.
 */

import type { Kind, Instance } from 'kindscript';

type PureModule = Kind<"PureModule", {}, { pure: true }, "folder">;

export const _ = {} satisfies Instance<PureModule, '.'>;
