const request = require('supertest');
const app = require('../helpers/app');
const { loginAs, authHeader } = require('../helpers/auth');

/**
 * Users endpoints (Admin only)
 *   GET /api/users            (?search=, ?role=)
 *   PUT /api/users/:id/role
 *   GET /api/users/stats
 *
 * Requires seeded users (see tests/fixtures/users.json): an Admin and a Submitter.
 */
describe('Users (Admin)', () => {
  let adminToken;
  let submitterToken;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    submitterToken = await loginAs('submitter');
  });

  describe('GET /api/users', () => {
    test('admin can list all users', async () => {
      const res = await request(app).get('/api/users').set(authHeader(adminToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length) {
        expect(res.body[0]).toHaveProperty('email');
        expect(res.body[0]).toHaveProperty('role');
      }
    });

    test('supports ?role= filter', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ role: 'Approver' })
        .set(authHeader(adminToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('supports ?search= filter', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ search: 'admin' })
        .set(authHeader(adminToken));
      expect(res.status).toBe(200);
    });

    test('rejects an unauthenticated request', async () => {
      const res = await request(app).get('/api/users');
      expect([401, 403]).toContain(res.status);
    });

    test('forbids a non-admin (submitter)', async () => {
      const res = await request(app).get('/api/users').set(authHeader(submitterToken));
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/stats', () => {
    test('admin gets role counts', async () => {
      const res = await request(app).get('/api/users/stats').set(authHeader(adminToken));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalSubmitters');
      expect(res.body).toHaveProperty('totalApprovers');
    });
  });

  describe('PUT /api/users/:id/role', () => {
    test('admin can change a user role', async () => {
      // find a submitter to promote
      const list = await request(app)
        .get('/api/users')
        .query({ role: 'Submitter' })
        .set(authHeader(adminToken));
      if (!list.body.length) return; // nothing to update in this environment

      const target = list.body[0];
      const res = await request(app)
        .put(`/api/users/${target.id}/role`)
        .set(authHeader(adminToken))
        .send({ role: 'Approver' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('role', 'Approver');

      // revert so the suite is repeatable
      await request(app)
        .put(`/api/users/${target.id}/role`)
        .set(authHeader(adminToken))
        .send({ role: 'Submitter' });
    });

    test('forbids a non-admin from changing roles', async () => {
      const res = await request(app)
        .put('/api/users/1/role')
        .set(authHeader(submitterToken))
        .send({ role: 'Admin' });
      expect(res.status).toBe(403);
    });
  });
});
