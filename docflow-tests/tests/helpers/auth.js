const request = require('supertest');
const app = require('./app');

/**
 * Log in and return the JWT access token.
 * Adjust `extractToken` if your login response nests the token differently.
 */
function extractToken(body) {
  // Common shapes: { token }, { accessToken }, { data: { token } }, { user, token }
  return (
    body.token ||
    body.accessToken ||
    (body.data && (body.data.token || body.data.accessToken)) ||
    null
  );
}

async function login(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  const token = extractToken(res.body);
  if (!token) {
    throw new Error(
      `login() could not find a token in the response for ${email}. ` +
      `Got status ${res.status} and body keys: ${Object.keys(res.body || {}).join(', ')}. ` +
      `Update extractToken() in tests/helpers/auth.js to match your API.`
    );
  }
  return token;
}

/** Build an Authorization header object for supertest .set(...) */
function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

/** Convenience: log in as each seeded role. Requires fixtures/users.json to be seeded. */
const SEED_PASSWORD = 'Test@1234';
const SEED = {
  submitter: 'submitter@test.com',
  approver1: 'approver1@test.com',
  approver2: 'approver2@test.com',
  admin: 'admin@test.com',
};

async function loginAs(roleKey) {
  const email = SEED[roleKey];
  if (!email) throw new Error(`Unknown seeded role key: ${roleKey}`);
  return login(email, SEED_PASSWORD);
}

module.exports = { login, loginAs, authHeader, extractToken, SEED, SEED_PASSWORD };
