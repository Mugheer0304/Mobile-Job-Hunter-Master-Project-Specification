import { registerSchema, loginSchema, createJobSchema } from '../../src/validators';

describe('auth validators', () => {
  it('accepts a valid registration', () => {
    const result = registerSchema.parse({
      email: 'user@example.com',
      password: 'Password123!',
      fullName: 'Test User',
    });
    expect(result.email).toBe('user@example.com');
  });

  it('rejects a weak password', () => {
    expect(() =>
      registerSchema.parse({ email: 'user@example.com', password: 'short', fullName: 'T' }),
    ).toThrow();
  });

  it('rejects an invalid email', () => {
    expect(() => loginSchema.parse({ email: 'not-an-email', password: 'x' })).toThrow();
  });
});

describe('job validators', () => {
  it('applies defaults for employmentType and status', () => {
    const result = createJobSchema.parse({
      companyId: 'c1',
      title: 'Engineer',
      description: 'Build things',
    });
    expect(result.employmentType).toBe('FULL_TIME');
    expect(result.status).toBe('OPEN');
    expect(result.skills).toEqual([]);
  });
});
