/**
 * Resolves the target that supertest will drive.
 *
 * Two supported modes:
 *   1) In-process (default): import your Express `app` instance directly. Fast, no
 *      server needs to be running. Your backend must export the app WITHOUT calling
 *      app.listen() in the same module — e.g. `module.exports = app;` in app.js and
 *      `app.listen()` only in a separate server.js / index.js.
 *
 *   2) Against a live server: set BASE_URL (e.g. http://localhost:5000) and these
 *      tests will run over HTTP against your running instance.
 *
 * ▶ EDIT the require path below to point at your app export if it differs.
 */
let target;

if (process.env.BASE_URL) {
  target = process.env.BASE_URL;
} else {
  // eslint-disable-next-line global-require, import/no-unresolved
  target = require('../../backend/app'); // <-- change to '../../backend/server' etc. if needed
}

module.exports = target;
