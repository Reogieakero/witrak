import type { PermissionKey } from "@fhusocom/db";

export type UserAccess = {
  permissions: string[];
  scopeSectionIds: string[] | null;
};

export class ForbiddenError extends Error {
  constructor(key: PermissionKey) {
    super(`Forbidden: missing permission "${key}"`);
    this.name = "ForbiddenError";
  }
}

export function hasPermission(
  access: UserAccess | null | undefined,
  key: PermissionKey,
): boolean {
  return access?.permissions.includes(key) ?? false;
}

export function requirePermission(
  access: UserAccess | null | undefined,
  key: PermissionKey,
): asserts access is UserAccess {
  if (!hasPermission(access, key)) throw new ForbiddenError(key);
}

export function studentInScope(access: UserAccess) {
  if (access.scopeSectionIds === null) return {};
  return { sectionId: { in: access.scopeSectionIds } };
}
