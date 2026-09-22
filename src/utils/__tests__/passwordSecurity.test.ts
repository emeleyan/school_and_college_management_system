import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../db/indexedDB';

describe('Password Security & PBKDF2 Modernization', () => {
  it('generates a salted PBKDF2 hash format with 100,000 iterations', async () => {
    const password = 'AdminPassword123!';
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^pbkdf2\$100000\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  });

  it('generates unique salts and hashes for the same password', async () => {
    const password = 'SharedSecretPassword';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toEqual(hash2);

    // Both should verify successfully
    const verify1 = await verifyPassword(password, hash1);
    const verify2 = await verifyPassword(password, hash2);

    expect(verify1.valid).toBe(true);
    expect(verify1.needsUpgrade).toBe(false);
    expect(verify2.valid).toBe(true);
    expect(verify2.needsUpgrade).toBe(false);
  });

  it('correctly rejects incorrect passwords for PBKDF2 hashes', async () => {
    const hash = await hashPassword('CorrectPassword123');
    const result = await verifyPassword('WrongPassword321', hash);

    expect(result.valid).toBe(false);
  });

  it('verifies legacy unsalted SHA-256 hashes and flags them for upgrade', async () => {
    // Generate a legacy SHA-256 hash for 'admin123'
    const encoder = new TextEncoder();
    const data = encoder.encode('admin123');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const legacyHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Legacy verification
    const validLegacy = await verifyPassword('admin123', legacyHash);
    expect(validLegacy.valid).toBe(true);
    expect(validLegacy.needsUpgrade).toBe(true); // Must trigger automatic upgrade!

    // Incorrect password on legacy hash
    const invalidLegacy = await verifyPassword('wrongpass', legacyHash);
    expect(invalidLegacy.valid).toBe(false);
  });

  it('handles empty inputs or corrupted hash strings safely', async () => {
    expect((await verifyPassword('', 'somehash')).valid).toBe(false);
    expect((await verifyPassword('password', '')).valid).toBe(false);
    expect((await verifyPassword('password', 'pbkdf2$100000$malformed')).valid).toBe(false);
  });
});
