import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const CHALLENGE_TTL_SECONDS = 5 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function encryptionKey() {
  const configuredKey = process.env.TOTP_ENCRYPTION_KEY;
  if (!configuredKey || configuredKey.length < 32) {
    throw new Error("TOTP_ENCRYPTION_KEY must be configured with at least 32 characters.");
  }
  return createHash("sha256").update(configuredKey).digest();
}

function encodeBase32(buffer) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(value) {
  let bits = 0;
  let buffer = 0;
  const output = [];

  for (const character of value.toUpperCase().replace(/=+$/, "")) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) throw new Error("Invalid authenticator secret.");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function createAuthenticatorSecret() {
  return encodeBase32(randomBytes(20));
}

export function encryptAuthenticatorSecret(secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

function decryptAuthenticatorSecret(encryptedSecret) {
  const [iv, authTag, ciphertext] = encryptedSecret.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !authTag || !ciphertext || iv.length !== 12 || authTag.length !== 16) {
    throw new Error("Invalid encrypted authenticator secret.");
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

function totpAtStep(secret, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary =
    ((digest[offset] & 127) << 24) |
    ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) |
    (digest[offset + 3] & 255);
  return String(binary % 1_000_000).padStart(6, "0");
}

export function verifyAuthenticatorCode(encryptedSecret, code, lastUsedStep = -1) {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) return null;

  const secret = decryptAuthenticatorSecret(encryptedSecret);
  const currentStep = Math.floor(Date.now() / 30_000);
  for (const step of [currentStep - 1, currentStep, currentStep + 1]) {
    if (step <= lastUsedStep) continue;
    const expected = Buffer.from(totpAtStep(secret, step));
    const provided = Buffer.from(code);
    if (timingSafeEqual(expected, provided)) return step;
  }
  return null;
}

export function createAuthenticatorUri(secret, accountLabel) {
  const label = encodeURIComponent(`Food Delivery:${accountLabel}`);
  const query = new URLSearchParams({
    secret,
    issuer: "Food Delivery",
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}

export function createLoginChallenge(accountType, accountId) {
  const payload = Buffer.from(JSON.stringify({
    type: accountType,
    id: String(accountId),
    expiresAt: Math.floor(Date.now() / 1000) + CHALLENGE_TTL_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
  })).toString("base64url");
  const signature = createHmac("sha256", encryptionKey()).update(`login.${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyLoginChallenge(challenge) {
  if (typeof challenge !== "string") return null;
  const [payload, signature, extra] = challenge.split(".");
  if (!payload || !signature || extra) return null;

  const expected = createHmac("sha256", encryptionKey()).update(`login.${payload}`).digest();
  const provided = Buffer.from(signature, "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) return null;

  try {
    const contents = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!["user", "restaurant", "delivery"].includes(contents.type)) return null;
    if (typeof contents.id !== "string" || contents.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return { type: contents.type, id: contents.id };
  } catch {
    return null;
  }
}

export function createAuthSessionToken(accountType, accountId) {
  const payload = Buffer.from(JSON.stringify({
    type: accountType,
    id: String(accountId),
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
  })).toString("base64url");
  const signature = createHmac("sha256", encryptionKey()).update(`session.${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function setAuthSessionCookie(response, accountType, accountId) {
  response.cookies.set("auth_session", createAuthSessionToken(accountType, accountId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export function publicAccount(account) {
  const result = account.toObject ? account.toObject() : { ...account };
  delete result.password;
  delete result.twoFactorSecret;
  delete result.twoFactorPendingSecret;
  delete result.twoFactorLastUsedStep;
  delete result.twoFactorFailedAttempts;
  delete result.twoFactorLockUntil;
  result.twoFactorEnabled = Boolean(result.twoFactorEnabled);
  return result;
}
