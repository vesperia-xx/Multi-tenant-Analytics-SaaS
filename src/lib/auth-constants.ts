/**
 * Values shared by the session helper (server) and the proxy (edge).
 * Kept dependency-free on purpose: importing the Prisma-backed session module
 * from the proxy would pull the whole data layer into the edge bundle.
 */
export const SESSION_COOKIE = "vortex_session";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

/** Password reset links live for one hour. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
