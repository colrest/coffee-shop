# Tests — Document Approval System (DocFlow)

This folder contains everything needed to test the project:

- **Automated API tests** — Jest + Supertest integration tests for every implemented
  endpoint (auth, users, documents, approvals, workflows).
- **Test data fixtures** — seed users, documents, workflows, comments, and sample
  upload files.
- **Manual QA test cases** — `TEST_CASES.md`, a full test-case matrix (positive,
  negative, role-based, and end-to-end flows) you can execute by hand or hand to QA.

The automated tests are written against the **documented API contract**, so they are
implementation-agnostic. You wire them to your backend in two small places (below).

---

## 1. Install

From the repository root:

```bash
npm install --save-dev jest supertest
# optional, to load .env.test automatically:
npm install --save-dev dotenv
```

Add scripts to your root (or backend) `package.json`:

```json
{
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch --runInBand"
  }
}
```

`--runInBand` runs suites serially, which is safest when they share one test database.

## 2. Configure (two small edits)

1. **Point the tests at your app.** Open `tests/helpers/app.js`. By default it imports
   your Express app from `../../backend/app`. Your backend should export the app
   instance *without* calling `app.listen()` in the same file:

   ```js
   // backend/app.js
   const express = require('express');
   const app = express();
   // ... routes/middleware ...
   module.exports = app;          // <- tests need this

   // backend/server.js (separate)
   const app = require('./app');
   app.listen(process.env.PORT || 5000);
   ```

   If you can't refactor, instead run your server and set `BASE_URL` (see `.env.test.example`)
   to test over HTTP — no app export required.

2. **Match your login response shape.** `tests/helpers/auth.js` reads the JWT from
   `res.body.token` (with a few fallbacks). If your API returns it elsewhere, update
   `extractToken()` there.

## 3. Seed the test database

Use a **throwaway test database** (set its connection string in `.env.test`).
The auth and document-upload suites are largely self-contained (they register their
own users), but the role-restricted suites (**users**, **workflows**, **approvals**)
need pre-seeded accounts and workflows. Seed from the fixtures:

- `tests/fixtures/users.json` — one Admin, two Approvers, two Submitters (password `Test@1234`)
- `tests/fixtures/documents.json` — documents in each status/stage
- `tests/fixtures/workflows.json` — three-stage workflow configs
- `tests/fixtures/comments.json` — sample comments

> Seed using your own seed script / DB tooling so passwords are hashed exactly the way
> your app hashes them. The emails/roles above are what the test helpers log in with.

## 4. Run

```bash
npm test                       # all suites
npx jest tests/api/auth.test.js   # a single suite
```

## 5. What's covered

| Suite | File | Endpoints |
|-------|------|-----------|
| Auth | `tests/api/auth.test.js` | register, login, me, logout |
| Users (Admin) | `tests/api/users.test.js` | GET /users, PUT /users/:id/role, GET /users/stats |
| Documents | `tests/api/documents.test.js` | upload, list, detail, comments, history, download, stats |
| Approvals | `tests/api/approvals.test.js` | approve, reject, revision, assigned, approver stats, workload |
| Workflows (Admin) | `tests/api/workflows.test.js` | GET /workflows, PUT /workflows/:id, GET /approvers |

Tests assert on **status codes and the response fields** from the API contract, and
include negative cases (no token, wrong role, missing data, non-existent IDs). Where a
test depends on seeded data that may not exist in a given environment, it degrades
gracefully (skips the action) rather than failing spuriously — so seeding more data
gives you stronger coverage.

## 6. Folder structure

```
tests/
├── README.md               # this file
├── TEST_CASES.md           # manual / QA test-case matrix
├── .env.test.example       # env template (BASE_URL, test DB, JWT secret)
├── setup.js                # loads .env.test
├── helpers/
│   ├── app.js              # resolves app import vs BASE_URL  (EDIT path here)
│   └── auth.js             # login + auth-header helpers      (EDIT token shape here)
├── fixtures/
│   ├── users.json
│   ├── documents.json
│   ├── workflows.json
│   ├── comments.json
│   └── files/
│       ├── sample.pdf      # upload fixture
│       └── sample.png      # upload fixture
└── api/
    ├── auth.test.js
    ├── users.test.js
    ├── documents.test.js
    ├── approvals.test.js
    └── workflows.test.js

jest.config.js              # at the repo root
```

## 7. Notes & assumptions

- A freshly registered user is assumed to default to the **Submitter** role.
- Notifications endpoints are excluded (marked *planned* in the project docs).
- Acceptable status codes are written as sets (e.g. `200/201`) because exact codes
  vary by implementation; tighten them once your conventions are fixed.
