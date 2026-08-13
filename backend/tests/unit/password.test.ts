import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('password utils', () => {
  it('hashes a password to a non-plaintext value', async () => {
    const hash = await hashPassword('Password123!');
    expect(hash).not.toBe('Password123!');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('Password123!');
    await expect(verifyPassword('Password123!', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Password123!');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});
