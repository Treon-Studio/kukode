import { describe, expect, it } from 'vitest';
import { hashPasswordBase as hashPassword, verifyPasswordBase as verifyPassword } from './auth.crypto';
import { AUTH_CONFIG } from '@/lib/constants';

describe('Auth Cryptography', () => {
  const plainPassword = 'SuperSecretPassword123';

  it('should hash password with PBKDF2 format', async () => {
    const hashed = await hashPassword(plainPassword);

    // Check PBKDF2 standard output format: "iterations$salt$hash"
    const parts = hashed.split('$');
    expect(parts).toHaveLength(3);

    // Check configured iterations
    expect(parseInt(parts[0], 10)).toBe(AUTH_CONFIG.HASH_ITERATIONS);
    expect(parts[1]).toBeDefined(); // Salt
    expect(parts[2]).toBeDefined(); // Hash Hex
  });

  it('should verify correct password successfully', async () => {
    const hashed = await hashPassword(plainPassword);
    const isValid = await verifyPassword(plainPassword, hashed);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hashed = await hashPassword(plainPassword);
    const isValid = await verifyPassword('WrongPasswordGoesHere', hashed);
    expect(isValid).toBe(false);
  });
});
