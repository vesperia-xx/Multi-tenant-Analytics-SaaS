import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with Node's built-in scrypt.
 *
 * Stored format: `scrypt$1$N$r$p$salt$key` (salt and key are base64url).
 * - No native dependency, so no platform-specific binary on Vercel.
 * - The version and cost parameters travel with the hash, which lets a future
 *   migration to Argon2id (or a higher N) rehash on next login instead of
 *   invalidating every password.
 * - `timingSafeEqual` avoids leaking the comparison result through timing.
 */
const VERSION = "1";
const COST = { N: 16_384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

const DUMMY_SALT = Buffer.alloc(16, 7);
const DUMMY_KEY = Buffer.alloc(KEY_LENGTH, 7);

type ParsedHash = {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  key: Buffer;
};

function derive(
  password: string,
  salt: Buffer,
  params: { N: number; r: number; p: number },
  keyLength = KEY_LENGTH,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      { N: params.N, r: params.r, p: params.p, maxmem: MAX_MEM },
      (error, derivedKey) => (error ? reject(error) : resolve(derivedKey)),
    );
  });
}

function parseHash(value: string | null | undefined): ParsedHash | null {
  if (!value) return null;

  const parts = value.split("$");
  if (parts.length !== 7 || parts[0] !== "scrypt" || parts[1] !== VERSION) return null;

  const N = Number(parts[2]);
  const r = Number(parts[3]);
  const p = Number(parts[4]);

  // Bounds keep a tampered database row from becoming a CPU/memory bomb.
  if (!Number.isInteger(N) || N < 4096 || N > 131_072) return null;
  if (!Number.isInteger(r) || r < 1 || r > 32) return null;
  if (!Number.isInteger(p) || p < 1 || p > 8) return null;

  const salt = Buffer.from(parts[5], "base64url");
  const key = Buffer.from(parts[6], "base64url");

  if (salt.length < 16 || key.length < 32) return null;

  return { N, r, p, salt, key };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST);

  return ["scrypt", VERSION, COST.N, COST.r, COST.p, salt.toString("base64url"), key.toString("base64url")].join(
    "$",
  );
}

/**
 * Verifies a password against a stored hash. Unknown users hit the same scrypt
 * work as real ones, so response time does not reveal whether an account exists.
 */
export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  const parsed = parseHash(storedHash);
  const params = parsed ?? { ...COST, salt: DUMMY_SALT, key: DUMMY_KEY };

  const candidate = await derive(password, params.salt, params, params.key.length);
  const matches =
    candidate.length === params.key.length && timingSafeEqual(candidate, params.key);

  return parsed !== null && matches;
}

/** Exposed for the database-free test suite. */
export const passwordHashInternals = { parseHash, COST, KEY_LENGTH };
