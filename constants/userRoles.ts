/** Account types: contributors donate and track impact; organizations run causes. */
export const USER_ROLE = {
  CONTRIBUTOR: 'contributor',
  ORGANIZATION: 'organization',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export function isOrganizationRole(role: string | undefined | null): boolean {
  return role === USER_ROLE.ORGANIZATION;
}

export function isContributorRole(role: string | undefined | null): boolean {
  return role === USER_ROLE.CONTRIBUTOR || !role;
}
