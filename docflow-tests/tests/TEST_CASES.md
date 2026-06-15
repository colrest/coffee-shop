# Test Cases — Document Approval System (DocFlow)

A structured set of manual / QA test cases covering authentication, role-based
access, document submission, the multi-stage approval workflow, comments,
history, statistics, and workflow administration.

**Roles:** Submitter · Approver · Admin
**Statuses:** Pending Approval · Approved · Rejected · Revision Required
**Stages:** Initial Level → Compliance Level → Final Level

Priority key: **P1** critical · **P2** important · **P3** minor.

---

## 1. Authentication & Session

| ID | Title | Precondition | Steps | Test Data | Expected Result | Priority |
|----|-------|--------------|-------|-----------|-----------------|----------|
| AUTH-01 | Register new user | No account with this email | Submit register form | name: Test User, email: new@test.com, password: Test@1234 | Account created (200/201); user defaults to Submitter role | P1 |
| AUTH-02 | Register with existing email | Email already registered | Submit register with same email | email: new@test.com | Rejected with a duplicate-email error (400/409) | P1 |
| AUTH-03 | Register missing fields | — | Submit register without password | email only | Validation error (400/422) | P2 |
| AUTH-04 | Login valid credentials | Account exists | Submit login | new@test.com / Test@1234 | 200; returns access token + role | P1 |
| AUTH-05 | Login wrong password | Account exists | Submit login with wrong password | new@test.com / wrong | Rejected (400/401); no token | P1 |
| AUTH-06 | Login non-existent user | — | Submit login | ghost@test.com / Test@1234 | Rejected (400/401/404) | P2 |
| AUTH-07 | Get current user | Logged in | GET /api/auth/me with token | valid Bearer token | 200; returns id, name, email, role | P1 |
| AUTH-08 | Access protected route without token | — | GET /api/auth/me with no header | — | 401 Unauthorized | P1 |
| AUTH-09 | Access with invalid/expired token | — | GET /api/auth/me with bad token | Bearer not-a-token | 401 Unauthorized | P1 |
| AUTH-10 | Logout | Logged in | POST /api/auth/logout | valid token | 200/204; token/session invalidated | P2 |
| AUTH-11 | Role-based redirect after login | Accounts of each role exist | Log in as each role | submitter / approver / admin | User lands on the dashboard matching their role | P1 |

## 2. Role-Based Access Control

| ID | Title | Precondition | Steps | Test Data | Expected Result | Priority |
|----|-------|--------------|-------|-----------|-----------------|----------|
| RBAC-01 | Submitter blocked from admin routes | Logged in as Submitter | GET /api/users | submitter token | 403 Forbidden | P1 |
| RBAC-02 | Submitter blocked from approver routes | Logged in as Submitter | GET /api/approver/assigned | submitter token | 403 Forbidden | P1 |
| RBAC-03 | Approver blocked from admin routes | Logged in as Approver | GET /api/workflows | approver token | 403 Forbidden | P1 |
| RBAC-04 | Admin allowed on admin routes | Logged in as Admin | GET /api/users | admin token | 200 OK | P1 |
| RBAC-05 | Approver cannot change user roles | Logged in as Approver | PUT /api/users/:id/role | approver token | 403 Forbidden | P2 |

## 3. Document Submission (Submitter)

| ID | Title | Precondition | Steps | Test Data | Expected Result | Priority |
|----|-------|--------------|-------|-----------|-----------------|----------|
| DOC-01 | Upload PDF document | Logged in as Submitter | POST /api/documents (multipart) | title: Project Proposal, category: Business, file: sample.pdf | 201; status "Pending Approval", version v1 | P1 |
| DOC-02 | Upload DOCX / image | Logged in as Submitter | Upload with a .docx / .png file | file: sample.png | Accepted (allowed type) | P2 |
| DOC-03 | Upload with no file | Logged in as Submitter | Submit without a file | title only | Validation error (400/422) | P1 |
| DOC-04 | Upload disallowed file type | Logged in as Submitter | Upload e.g. a .exe | file: app.exe | Rejected with a file-type error | P2 |
| DOC-05 | Upload without auth | — | POST /api/documents with no token | — | 401 Unauthorized | P1 |
| DOC-06 | List own documents | Has uploaded docs | GET /api/documents | submitter token | 200; only the submitter's own documents | P1 |
| DOC-07 | Filter by status | Docs in mixed statuses | GET /api/documents?status=Approved | status=Approved | 200; only Approved documents | P2 |
| DOC-08 | Filter by category | Docs in mixed categories | GET /api/documents?category=Finance | category=Finance | 200; only Finance documents | P2 |
| DOC-09 | Search documents | Docs exist | GET /api/documents?search=Proposal | search=Proposal | 200; matching documents only | P3 |
| DOC-10 | View document details | Document exists | GET /api/documents/:id | valid id | 200; title, status, version, currentStage, fileUrl | P1 |
| DOC-11 | View non-existent document | — | GET /api/documents/99999999 | invalid id | 404 Not Found | P2 |
| DOC-12 | Download document file | Document exists | GET /api/documents/:id/download | valid id | 200 file stream (or 302 redirect) | P1 |
| DOC-13 | Submitter document stats | Submitter has docs | GET /api/documents/stats | submitter token | 200; counts scoped to submitter (total/approved/pending/revision/rejected) | P2 |
| DOC-14 | Resubmit after revision | Doc in "Revision Required" | PUT /api/documents/:id/resubmit (optional new file) | valid id | 200; status back to Pending; version increments | P1 |
| DOC-15 | Resubmit when not in revision | Doc is Pending/Approved | PUT /api/documents/:id/resubmit | valid id | Rejected (invalid state) | P3 |

## 4. Approval Workflow (Approver)

| ID | Title | Precondition | Steps | Test Data | Expected Result | Priority |
|----|-------|--------------|-------|-----------|-----------------|----------|
| APP-01 | List assigned documents | Approver has assignments | GET /api/approver/assigned | approver token | 200; only documents assigned to this approver | P1 |
| APP-02 | Filter assigned by status | Assignments exist | GET /api/approver/assigned?status=Pending | status filter | 200; filtered list | P3 |
| APP-03 | Approve advances stage | Doc pending at Initial | POST /api/documents/:id/approve | comment: "Approved for next stage." | 200; currentStage → Compliance Level; message returned | P1 |
| APP-04 | Approve at final stage | Doc pending at Final | POST /api/documents/:id/approve | final-stage doc | 200; status → Approved | P1 |
| APP-05 | Reject document | Doc pending | POST /api/documents/:id/reject | comment: "Budget incorrect." | 200; status → Rejected | P1 |
| APP-06 | Request revision | Doc pending | POST /api/documents/:id/revision | comment: "Update budget and resubmit." | 200; status → Revision Required | P1 |
| APP-07 | Approve not-assigned doc | Doc assigned to another approver | POST /api/documents/:id/approve | other approver's doc | Rejected (403 / not assigned) | P2 |
| APP-08 | Submitter cannot approve | Logged in as Submitter | POST /api/documents/:id/approve | submitter token | 403 Forbidden | P1 |
| APP-09 | Approver stats | Approver has assignments | GET /api/approver/stats | approver token | 200; totalAssigned, pending, approved, revision, rejected | P2 |
| APP-10 | History records each action | A doc has been acted on | GET /api/documents/:id/history | valid id | 200; ordered timeline (Submitted, Pending, action by user, timestamps) | P1 |

## 5. Comments

| ID | Title | Precondition | Steps | Test Data | Expected Result | Priority |
|----|-------|--------------|-------|-----------|-----------------|----------|
| CMT-01 | Add comment | Document exists | POST /api/documents/:id/comments | text: "Please review." | 200/201; comment stored | P2 |
| CMT-02 | List comments | Comments exist | GET /api/documents/:id/comments | valid id | 200; array of {name, text, time} | P2 |
| CMT-03 | Add empty comment | Document exists | POST with empty text | text: "" | Validation error (400/422) | P3 |
| CMT-04 | Comment without auth | — | POST comment with no token | — | 401 Unauthorized | P2 |

## 6. User Administration (Admin)

| ID | Title | Precondition | Steps | Test Data | Expected Result | Priority |
|----|-------|--------------|-------|-----------|-----------------|----------|
| USR-01 | List all users | Logged in as Admin | GET /api/users | admin token | 200; array of users with roles | P1 |
| USR-02 | Filter users by role | Users of mixed roles | GET /api/users?role=Approver | role filter | 200; only Approvers | P2 |
| USR-03 | Search users | Users exist | GET /api/users?search=sarah | search filter | 200; matching users | P3 |
| USR-04 | Change user role | Target user exists | PUT /api/users/:id/role | { role: "Approver" } | 200; user role updated | P1 |
| USR-05 | Change to invalid role | Target user exists | PUT /api/users/:id/role | { role: "SuperUser" } | Validation error (400/422) | P2 |
| USR-06 | User statistics | Users exist | GET /api/users/stats | admin token | 200; totalUsers, totalSubmitters, totalApprovers, totalAdmins | P2 |

## 7. Workflow Administration (Admin)

| ID | Title | Precondition | Steps | Test Data | Expected Result | Priority |
|----|-------|--------------|-------|-----------|-----------------|----------|
| WF-01 | List workflows | Workflows seeded | GET /api/workflows | admin token | 200; array with name, initial, compliance, final | P1 |
| WF-02 | Update workflow approvers | Workflow exists | PUT /api/workflows/:id | { initial, compliance, final } | 200; assignments updated | P1 |
| WF-03 | List approver users | Approvers exist | GET /api/approvers | admin token | 200; list of {id, name} for assignment dropdowns | P2 |
| WF-04 | Non-admin blocked | Logged in as non-admin | GET /api/workflows | submitter token | 403 Forbidden | P1 |
| WF-05 | Approver workload | Assignments exist | GET /api/approvers/workload | admin token | 200; per-approver assigned/pending/approved counts | P2 |

## 8. End-to-End Flows

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| E2E-01 | Full approval path | Submitter uploads → Initial approver approves → Compliance approver approves → Final approver approves | Document ends in **Approved**; history shows all three approvals in order | P1 |
| E2E-02 | Rejection path | Submitter uploads → Initial approver rejects | Document is **Rejected**; submitter sees it and the comment | P1 |
| E2E-03 | Revision loop | Submitter uploads → approver requests revision → submitter resubmits → approver approves | Status moves Pending → Revision Required → Pending → advanced; version increments | P1 |
| E2E-04 | Reassign via workflow change | Admin changes the Initial approver for a workflow → submitter uploads under that workflow | New document is assigned to the newly configured approver | P2 |
| E2E-05 | Scoping integrity | Submitter A and Submitter B each upload | Each submitter sees only their own documents; admin sees all | P1 |

## 9. Non-Functional / Edge

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| NF-01 | Large file upload | Upload a file near the size limit | Accepted if within limit; clear error if over | P3 |
| NF-02 | SQL/NoSQL injection in fields | Submit crafted strings in title/comment | Input is sanitized/escaped; no error leak | P2 |
| NF-03 | Unauthorized direct ID access | Submitter requests another user's document id | 403/404; no data leak | P1 |
| NF-04 | Concurrent approval | Two approvers act on the same doc simultaneously | Consistent final state; no duplicate stage advance | P3 |
| NF-05 | Token tamper | Modify one character of a valid token | 401 Unauthorized | P2 |

---

### Notes
- Status codes list acceptable alternatives (e.g. 200/201) because exact codes depend on the implementation.
- "Test Data" references the fixtures in `tests/fixtures/`. Upload cases use `tests/fixtures/files/sample.pdf` and `sample.png`.
- Endpoints marked *planned* in the project docs (Notifications) are intentionally excluded until persistence is added.
