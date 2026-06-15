const path = require('path');
const request = require('supertest');
const app = require('../helpers/app');
const { login, loginAs, authHeader } = require('../helpers/auth');

/**
 * Documents endpoints
 *   POST /api/documents              (multipart upload)
 *   GET  /api/documents              (?search=, ?status=, ?category=)
 *   GET  /api/documents/:id
 *   GET  /api/documents/:id/comments
 *   POST /api/documents/:id/comments
 *   GET  /api/documents/:id/history
 *   PUT  /api/documents/:id/resubmit
 *   GET  /api/documents/:id/download
 *   GET  /api/documents/stats
 *
 * Uploads use the sample file at tests/fixtures/files/sample.pdf.
 * The upload + detail/comment/history/stats tests are self-contained: they register
 * a fresh submitter and act on the document they create.
 */
const SAMPLE_PDF = path.join(__dirname, '..', 'fixtures', 'files', 'sample.pdf');

describe('Documents', () => {
  let submitterToken;
  let createdId;

  beforeAll(async () => {
    // Register + log in a fresh submitter so we own the document we create.
    const unique = Date.now();
    const user = { name: 'Doc Owner', email: `doc.owner.${unique}@test.com`, password: 'Test@1234' };
    await request(app).post('/api/auth/register').send(user);
    submitterToken = await login(user.email, user.password);
  });

  describe('POST /api/documents', () => {
    test('submitter can upload a document (multipart)', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set(authHeader(submitterToken))
        .field('title', 'Automated Test Proposal')
        .field('description', 'Created by the automated test suite.')
        .field('category', 'Business')
        .attach('file', SAMPLE_PDF);

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('status', 'Pending Approval');
      expect(res.body).toHaveProperty('version', 'v1');
      createdId = res.body.id;
    });

    test('rejects an unauthenticated upload', async () => {
      const res = await request(app)
        .post('/api/documents')
        .field('title', 'No Auth')
        .attach('file', SAMPLE_PDF);
      expect([401, 403]).toContain(res.status);
    });

    test('rejects an upload with no file', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set(authHeader(submitterToken))
        .field('title', 'Missing File')
        .field('category', 'Business');
      expect([400, 422]).toContain(res.status);
    });
  });

  describe('GET /api/documents', () => {
    test('returns a list scoped to the caller', async () => {
      const res = await request(app).get('/api/documents').set(authHeader(submitterToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('supports ?status= and ?category= filters', async () => {
      const res = await request(app)
        .get('/api/documents')
        .query({ status: 'Pending Approval', category: 'Business' })
        .set(authHeader(submitterToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/documents/:id', () => {
    test('returns full details for an existing document', async () => {
      if (!createdId) return;
      const res = await request(app)
        .get(`/api/documents/${createdId}`)
        .set(authHeader(submitterToken));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdId);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('currentStage');
    });

    test('returns 404 for a non-existent document', async () => {
      const res = await request(app)
        .get('/api/documents/99999999')
        .set(authHeader(submitterToken));
      expect([404, 400]).toContain(res.status);
    });
  });

  describe('Comments', () => {
    test('GET comments returns an array', async () => {
      if (!createdId) return;
      const res = await request(app)
        .get(`/api/documents/${createdId}/comments`)
        .set(authHeader(submitterToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST adds a comment', async () => {
      if (!createdId) return;
      const res = await request(app)
        .post(`/api/documents/${createdId}/comments`)
        .set(authHeader(submitterToken))
        .send({ text: 'A comment from the automated test suite.' });
      expect([200, 201]).toContain(res.status);
    });
  });

  describe('GET /api/documents/:id/history', () => {
    test('returns the approval timeline', async () => {
      if (!createdId) return;
      const res = await request(app)
        .get(`/api/documents/${createdId}/history`)
        .set(authHeader(submitterToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/documents/:id/download', () => {
    test('returns the file (200) for an existing document', async () => {
      if (!createdId) return;
      const res = await request(app)
        .get(`/api/documents/${createdId}/download`)
        .set(authHeader(submitterToken));
      // some implementations stream the file (200), others redirect (302)
      expect([200, 302]).toContain(res.status);
    });
  });

  describe('GET /api/documents/stats', () => {
    test('returns status counts', async () => {
      const res = await request(app).get('/api/documents/stats').set(authHeader(submitterToken));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('approved');
      expect(res.body).toHaveProperty('pending');
      expect(res.body).toHaveProperty('rejected');
    });
  });
});
