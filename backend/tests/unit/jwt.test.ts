import { signAccessToken, signRefreshToken, verifyToken, AccessTokenPayload } from '../../src/utils/jwt';

describe('jwt utils', () => {
  it('signs and verifies an access token', () => {
    const token = signAccessToken({ sub: 'u1', email: 'a@b.c', role: 'USER' });
    const payload = verifyToken<AccessTokenPayload>(token);
    expect(payload.sub).toBe('u1');
    expect(payload.email).toBe('a@b.c');
    expect(payload.role).toBe('USER');
    expect(payload.type).toBe('access');
  });

  it('signs a refresh token with type refresh', () => {
    const token = signRefreshToken({ sub: 'u1', jti: 'j1' });
    const payload = verifyToken<{ type: string; jti: string }>(token);
    expect(payload.type).toBe('refresh');
    expect(payload.jti).toBe('j1');
  });

  it('throws on a tampered token', () => {
    expect(() => verifyToken('not-a-valid-token')).toThrow();
  });
});
