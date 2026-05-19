/**
 * Edge-compatible password hashing and verification using Web Crypto API.
 * Natively supported in Cloudflare Workers and standard JS runtimes.
 */

import { AUTH_CONFIG } from '@/lib/constants';

// Helper to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hashes a password using PBKDF2-HMAC-SHA256 with a generated salt.
 * Returns a string formatted as "iterations$salt$hash".
 */
export async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bufferToHex(saltBytes.buffer);

  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ]);

  const iterations = AUTH_CONFIG.HASH_ITERATIONS;
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  const hashHex = bufferToHex(exportedKey);

  return `${iterations}$${saltHex}$${hashHex}`;
}

/**
 * Verifies a password against an existing hash string.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 3) {
    return false;
  }

  const iterations = parseInt(parts[0], 10);
  const saltHex = parts[1];
  const hashHex = parts[2];

  const saltBytes = hexToBytes(saltHex);
  const encoder = new TextEncoder();

  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ]);

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  const verifyHashHex = bufferToHex(exportedKey);

  return verifyHashHex === hashHex;
}
