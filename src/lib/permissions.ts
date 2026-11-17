import { Role } from "@/generated/prisma/enums";

/**
 * One permission matrix for the whole product.
 *
 * The UI uses it to hide what a role cannot do; Server Actions use the same
 * functions to refuse it. Keeping both on one source of truth is what stops the
 * button and the endpoint from drifting apart.
 */
export const PERMISSIONS = [
  "org:read",
  "org:update",
  "org:delete",
  "member:invite",
  "member:manage",
  "data:read",
  "data:write",
  "product:write",
  "export",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, readonly Permission[]> = {
  OWNER: [
    "org:read",
    "org:update",
    "org:delete",
    "member:invite",
    "member:manage",
    "data:read",
    "data:write",
    "product:write",
    "export",
    "audit:read",
  ],
  ADMIN: [
    "org:read",
    "org:update",
    "member:invite",
    "member:manage",
    "data:read",
    "data:write",
    "product:write",
    "export",
    "audit:read",
  ],
  MANAGER: ["org:read", "data:read", "data:write", "export"],
  VIEWER: ["org:read", "data:read", "export"],
};

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  VIEWER: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: "Full control, including deleting the workspace. There must always be one.",
  ADMIN: "Manages members, invitations, settings and all data.",
  MANAGER: "Edits orders and customers and runs exports. Read-only catalogue.",
  VIEWER: "Reads dashboards, tables and exports. Cannot change anything.",
};

/** Higher outranks lower. An actor can never act on a peer or a superior. */
export const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

/** Roles an actor may hand out. Owners may mint Admins; Admins may not. */
export function assignableRoles(actor: Role): Role[] {
  if (actor === Role.OWNER) return [Role.ADMIN, Role.MANAGER, Role.VIEWER];
  if (actor === Role.ADMIN) return [Role.MANAGER, Role.VIEWER];
  return [];
}

/**
 * Owners are untouchable, including by themselves: the matrix says an Owner can
 * never be modified, which also protects the last Owner from being demoted.
 */
export function canManageMember(actor: Role, target: Role): boolean {
  if (!can(actor, "member:manage")) return false;
  if (target === Role.OWNER) return false;
  return ROLE_RANK[actor] > ROLE_RANK[target];
}
