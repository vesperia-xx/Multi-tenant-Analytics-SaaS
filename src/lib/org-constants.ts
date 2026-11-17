/**
 * Organisation values shared by the server and the UI.
 * Slugs are immutable, so links stay stable once shared.
 */
export const INVITATION_TTL_DAYS = 7;
export const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000;

export const WORKSPACES_PER_USER_LIMIT = 10;
