const request = require('supertest');
const app = require('../helpers/app');
const { authHeader, extractToken } = require('../helpers/auth');

/**
 * Authentication endpoints
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 *
 * These are mostly self-contained: they register a fresh, uniquely-named user so
 * they do not depend on seeded data. A freshly registered user is assumed to
 * default to the "Submitter" role.
 */
describe('Auth', () => {
  const unique = Date.now();
  const newUser = {
    name: 'Test User',
    email: `test.user.${unique}@test.com`,
    password: 'Test@1234',
  };
  let token;

  describe('POST /api/auth/register', () => {
    test('registers a new user', async () => {
      const res = await request(app).post('/api/auth/register').send(newUser);
      expect([200, 201]).toContain(res.status);
    });

    test('rejects duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send(newUser);
      expect([400, 409, 422]).toContain(res.status);
    });

    test('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `only.email.${unique}@test.com` });
      expect([400, 422]).toContain(res.status);
    });
  });

  describe('POST /api/auth/login', () => {
    test('logs in with valid credentials and returns a token + role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: newUser.email, password: newUser.password });

      expect(res.status).toBe(200);
      token = extractToken(res.body);
      expect(token).toBeTruthy();

      // role is returned either at top level or under a user object
      const role = res.body.role || (res.body.user && res.body.user.role);
      expect(role).toBeTruthy();
    });

    test('rejects a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: newUser.email, password: 'WrongPassword!' });
      expect([400, 401]).toContain(res.status);
    });

    test('rejects a non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `nope.${unique}@test.com`, password: 'Test@1234' });
      expect([400, 401, 404]).toContain(res.status);
    });
  });

  describe('GET /api/auth/me', () => {
    test('returns the current user with a valid token', async () => {
      const res = await request(app).get('/api/auth/me').set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', newUser.email);
      expect(res.body).toHaveProperty('role');
    });

    test('rejects a request with no token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect([401, 403]).toContain(res.status);
    });

    test('rejects an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeader('not-a-real-token'));
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('logs out with a valid token', async () => {
      const res = await request(app).post('/api/auth/logout').set(authHeader(token));
      expect([200, 204]).toContain(res.status);
    });
  });
});
