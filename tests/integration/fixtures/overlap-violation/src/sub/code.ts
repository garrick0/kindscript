// This file lives in ./sub, which is claimed by member b.
// But member a claims '.', which includes everything — including this file.
// This causes a member overlap violation (KS70006).
export const shared = 'shared';
