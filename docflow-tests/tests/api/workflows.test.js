const request = require('supertest');
const app = require('../helpers/app');
const { loginAs, authHeader } = require('../helpers/auth');

/**
 * Workflow endpoints (Admin only)
 *   GET /api/workflows
 *   PUT /api/workflows/:id
 *   GET /api/approvers
 *
 * Requires seeded users + workflows.
 */
describe('Workflows (Admin)', () => {
  let adminToken;
  let submitterToken;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    submitterToken = await loginAs('submitter');
  });

  describe('GET /api/workflows', () => {
    test('admin can list workflow configs', async () => {
      const res = await request(app).get('/api/workflows').set(authHeader(adminToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length) {
        expect(res.body[0]).toHaveProperty('name');
        expect(res.body[0]).toHaveProperty('initial');
        expect(res.body[0]).toHaveProperty('compliance');
        expect(res.body[0]).toHaveProperty('final');
      }
    });

    test('forbids a non-admin', async () => {
      const res = await request(app).get('/api/workflows').set(authHeader(submitterToken));
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('GET /api/approvers', () => {
    test('admin can list approver users', async () => {
      const res = await request(app).get('/api/approvers').set(authHeader(adminToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PUT /api/workflows/:id', () => {
    test('admin can update a workflow\'s approver assignments', async () => {
      const list = await request(app).get('/api/workflows').set(authHeader(adminToken));
      if (!list.body.length) return; // nothing seeded

      const wf = list.body[0];
      const res = await request(app)
        .put(`/api/workflows/${wf.id}`)
        .set(authHeader(adminToken))
        .send({
          initial: wf.initial,
          compliance: wf.compliance,
          final: wf.final,
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', wf.id);
    });

    test('forbids a non-admin from updating workflows', async () => {
      const res = await request(app)
        .put('/api/workflows/1')
        .set(authHeader(submitterToken))
        .send({ initial: 'x', compliance: 'y', final: 'z' });
      expect([401, 403]).toContain(res.status);
    });
  });
});
