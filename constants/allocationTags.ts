/** Where money went — shown on org transparency posts (demo taxonomy). */
export const ALLOCATION_TAGS = ['Program', 'Staff', 'Operations', 'Infrastructure'] as const;
export type AllocationTag = (typeof ALLOCATION_TAGS)[number];
