/**
 * Global test setup. Loads environment variables from .env.test if present so you
 * can point tests at a test database / BASE_URL without touching dev config.
 */
try {
  // optional: only runs if dotenv is installed
  // eslint-disable-next-line global-require
  require('dotenv').config({ path: '.env.test' });
} catch (e) {
  // dotenv not installed — that's fine, env can be set another way
}
