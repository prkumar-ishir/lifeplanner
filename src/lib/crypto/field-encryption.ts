/**
 * Client-side field encryption using the Web Crypto API (SubtleCrypto).
 * Uses AES-GCM with a PBKDF2-derived key for encrypting sensitive planner fields.
 *
 * The key is derived from the user's ID + a salt, ensuring it stays stable across
 * sessions (unlike the ephemeral JWT access token).
 */

const SALT_PREFIX = "life-planner-encryption-v1";
const ITERATIONS = 100_000;

export async function deriveKey(
  userId: string,
  salt?: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(userId),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt ?? SALT_PREFIX),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string and returns a base64-encoded string
 * containing the IV (12 bytes) prepended to the ciphertext.
 */
export async function encryptField(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64-encoded ciphertext (with prepended IV) back to a plaintext string.
 */
export async function decryptField(
  ciphertext: string,
  key: CryptoKey
): Promise<string> {
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return new TextDecoder().decode(plainBuffer);
}
