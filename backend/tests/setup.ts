// Set test environment variables before any module is imported.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://mjh:mjh@localhost:5432/mjh_test?schema=public';
process.env.JWT_SECRET = 'test-secret-0123456789abcdef';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
