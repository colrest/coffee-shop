const request = require('supertest');
const app = require('../helpers/app');
const { loginAs, authHeader } = require('../helpers/auth');

/**
 * Approval endpoints (Approver actions)
 *   POST /api/documents/:id/approve
 *   POST /api/documents/:id/reject
 *   POST /api/documents/:id/revision
 *   GET  /api/approver/assigned
 *   GET  /api/approver/stats
 *   GET  /api/approvers/workload
 *
 * Requires seeded users + workflows so that an approver actually has documents
 * assigned to them. The approve/reject/revision tests act on the first document
 * returned by /api/approver/assigned, so they adapt to whatever is seeded.
 */
describe('Approvals (Approver)', () => {
  let approverToken;
  let submitterToken;
  let adminToken;

  beforeAll(async () => {
    approverToken = await loginAs('approver1');
    submitterToken = await loginAs('submitter');
    adminToken = await loginAs('admin');
  });

  describe('GET /api/approver/assigned', () => {
    test('returns the documents assigned to the approver', async () => {
      const res = await request(app)
        .get('/api/approver/assigned')
        .set(authHeader(approverToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('forbids a submitter', async () => {
      const res = await request(app)
        .get('/api/approver/assigned')
        .set(authHeader(submitterToken));
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('GET /api/approver/stats', () => {
    test('returns approver stats', async () => {
      const res = await request(app)
        .get('/api/approver/stats')
        .set(authHeader(approverToken));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pending');
      expect(res.body).toHaveProperty('approved');
    });
  });

  describe('GET /api/approvers/workload', () => {
    test('admin can view per-approver workload', async () => {
      const res = await request(app)
        .get('/api/approvers/workload')
        .set(authHeader(adminToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Approver actions on an assigned document', () => {
    async function firstAssignedPendingId() {
      const res = await request(app)
        .get('/api/approver/assigned')
        .set(authHeader(approverToken));
      const list = Array.isArray(res.body) ? res.body : [];
      const pending = list.find((d) => /pending/i.test(d.status || '')) || list[0];
      return pending && pending.id;
    }

    test('request revision returns "Revision Required"', async () => {
      const id = await firstAssignedPendingId();
      if (!id) return; // nothing assigned in this environment
      const res = await request(app)
        .post(`/api/documents/${id}/revision`)
        .set(authHeader(approverToken))
        .send({ comment: 'Please update the budget numbers and resubmit.' });
      expect([200, 201]).toContain(res.status);
      expect(String(res.body.status)).toMatch(/revision/i);
    });

    test('reject returns "Rejected"', async () => {
      const id = await firstAssignedPendingId();
      if (!id) return;
      const res = await request(app)
        .post(`/api/documents/${id}/reject`)
        .set(authHeader(approverToken))
        .send({ comment: 'Budget section is incorrect, cannot approve.' });
      expect([200, 201]).toContain(res.status);
      expect(String(res.body.status)).toMatch(/reject/i);
    });

    test('approve advances the stage', async () => {
      const id = await firstAssignedPendingId();
      if (!id) return;
      const res = await request(app)
        .post(`/api/documents/${id}/approve`)
        .set(authHeader(approverToken))
        .send({ comment: 'Looks good, approved for next stage.' });
      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('currentStage');
    });

    test('forbids a submitter from approving', async () => {
      const res = await request(app)
        .post('/api/documents/1/approve')
        .set(authHeader(submitterToken))
        .send({ comment: 'should not be allowed' });
      expect([401, 403]).toContain(res.status);
    });
  });
});
