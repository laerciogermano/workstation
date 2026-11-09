---
name: security-analysis-skill
description: >
  Perform a comprehensive security audit of a codebase. Use this skill whenever the user asks to:
  audit, review, scan, check, or analyze their code for security issues, vulnerabilities,
  weaknesses, or bugs. Also trigger for phrases like "is my code secure?", "security checklist",
  "OWASP", "pen test prep", "hardening", or "what vulnerabilities do I have?". Supports Laravel,
  Next.js, ASP.NET Core C# APIs, React-based applications, and GraphQL APIs. Always use this
  skill for any security-related task — even if the user only mentions one framework or one
  category of issue. For unsupported frameworks (Express, Django, etc.), only the universal
  checklist runs.
---

# Security Analysis Skill

Perform a structured, methodical security audit across a codebase. The output is a **checklist report** — not a code review. Each check is marked ✅ PASS, ❌ FAIL, ⚠️ PARTIAL, or ➖ N/A, with evidence and a remediation note for every failure.

---

## Step 1 — Identify the Stack

Before running any checks, identify which frameworks are present:

- **Laravel** → read `references/laravel.md`
- **Next.js** → read `references/nextjs.md`
- **ASP.NET Core (C#)** → read `references/aspnet.md`
- **React (any flavour)** → read `references/react.md`
- **GraphQL** → read `references/graphql.md`

Multiple frameworks may be present (e.g. Next.js front-end + ASP.NET API back-end). Load all relevant reference files.

---

## Step 2 — Gather Evidence

Before marking anything, search the codebase for evidence. Use file reads, grep-style searches, and directory listings. Do NOT make assumptions. Common entry points:

| Framework   | Key files to inspect first                                                    |
|-------------|-------------------------------------------------------------------------------|
| Laravel     | `.env`, `config/`, `routes/`, `app/Http/`, `app/Models/`, `composer.json`    |
| Next.js     | `.env*`, `next.config.*`, `pages/api/`, `app/api/`, `middleware.ts`           |
| ASP.NET C#  | `appsettings*.json`, `Program.cs`, `Controllers/`, `Startup.cs`, `*.csproj`  |
| React       | `.env*`, `src/`, `package.json`, any `fetch`/`axios` call sites               |
| GraphQL     | `schema.graphql`, `*.resolvers.*`, GraphQL server config                      |

---

## Step 3 — Run the Universal Checklist

These checks apply to **every** project regardless of framework.

### A. Secrets & Configuration
- [ ] **A1** — No secrets, API keys, or passwords hardcoded in source files
- [ ] **A2** — `.env` files excluded from version control (`.gitignore` confirmed)
- [ ] **A3** — No secrets committed in git history (check recent commits if accessible)
- [ ] **A4** — Secrets loaded from environment variables or a secrets manager at runtime
- [ ] **A5** — Different secrets for dev / staging / production environments

### B. Authentication & Session Management
- [ ] **B1** — Passwords hashed with a strong algorithm (bcrypt, Argon2 — not MD5/SHA1)
- [ ] **B2** — Sessions invalidated on logout
- [ ] **B3** — Secure, HttpOnly, SameSite cookies for session tokens
- [ ] **B4** — Brute-force protection on login (rate limiting or lockout)
- [ ] **B5** — MFA available or enforced for privileged accounts
- [ ] **B6** — JWT tokens: short expiry, signed with strong secret, not stored in localStorage

### C. Authorisation
- [ ] **C1** — Every route/endpoint has an explicit authorisation check (no trust by URL alone)
- [ ] **C2** — No Insecure Direct Object Reference (IDOR) — user IDs scoped to authenticated user
- [ ] **C3** — Horizontal privilege escalation tested (user A cannot access user B's resources)
- [ ] **C4** — Admin / privileged routes protected by role checks, not just authenticated checks

### D. Input Validation & Injection
- [ ] **D1** — All user input validated server-side (never trust client-only validation)
- [ ] **D2** — Database queries use parameterised statements / ORM — no raw string concatenation
- [ ] **D3** — No Server-Side Template Injection (SSTI) vectors
- [ ] **D4** — File uploads: type validated, size limited, stored outside web root, renamed
- [ ] **D5** — No command injection via `exec`, `shell_exec`, `Process.Start` with user input

### E. Cross-Site Scripting (XSS)
- [ ] **E1** — All user-supplied output HTML-escaped before rendering
- [ ] **E2** — No `dangerouslySetInnerHTML` or `innerHTML` with unescaped user data
- [ ] **E3** — Content Security Policy (CSP) header present and strict
- [ ] **E4** — `X-XSS-Protection` header set (legacy browsers)

### F. Cross-Site Request Forgery (CSRF)
- [ ] **F1** — CSRF tokens on all state-changing forms (POST/PUT/DELETE)
- [ ] **F2** — API endpoints validate `Origin` / `Referer` headers or use token-based CSRF protection
- [ ] **F3** — SameSite cookie attribute set to `Strict` or `Lax`

### G. Security Headers
- [ ] **G1** — `Strict-Transport-Security` (HSTS) enabled
- [ ] **G2** — `X-Frame-Options: DENY` or `SAMEORIGIN`
- [ ] **G3** — `X-Content-Type-Options: nosniff`
- [ ] **G4** — `Referrer-Policy` set appropriately
- [ ] **G5** — `Permissions-Policy` restricts camera/microphone/geolocation
- [ ] **G6** — `Cross-Origin-Opener-Policy` (COOP) header set
- [ ] **G7** — `Cross-Origin-Resource-Policy` (CORP) header set
- [ ] **G8** — CSP `frame-ancestors` directive set (modern replacement for `X-Frame-Options`)

### H. Cryptography
- [ ] **H1** — TLS 1.2+ enforced; TLS 1.0/1.1 and SSL disabled
- [ ] **H2** — No weak ciphers (RC4, DES, 3DES)
- [ ] **H3** — Sensitive data encrypted at rest (PII, financial data, health data)
- [ ] **H4** — Random tokens generated with cryptographically secure functions (not `rand()`)

### I. Dependencies & Third-Party Code
- [ ] **I1** — Dependencies audited for known CVEs (`composer audit`, `npm audit`, `dotnet list package --vulnerable`)
- [ ] **I2** — Dependency versions pinned (lockfiles committed)
- [ ] **I3** — Unused packages removed
- [ ] **I4** — No abandoned or unmaintained packages with open CVEs

### J. Error Handling & Logging
- [ ] **J1** — Stack traces / debug info not exposed to end users in production
- [ ] **J2** — Errors logged server-side with enough detail for investigation
- [ ] **J3** — No sensitive data (passwords, tokens, PII) written to logs
- [ ] **J4** — Verbose error mode disabled in production config

### K. Rate Limiting & Denial of Service
- [ ] **K1** — API endpoints rate-limited (especially auth, search, upload)
- [ ] **K2** — File upload size limits enforced
- [ ] **K3** — Pagination enforced on list endpoints (no unbounded queries)
- [ ] **K4** — Expensive operations (reports, exports) queued or throttled
- [ ] **K5** — No ReDoS-vulnerable regular expressions processing user input

### L. Server-Side Request Forgery (SSRF)
- [ ] **SSRF1** — User-supplied URLs not passed directly to server-side HTTP clients (fetch, cURL, HttpClient) without allowlist validation
- [ ] **SSRF2** — Internal/private IP ranges (127.0.0.1, 10.x, 169.254.x, ::1) blocked in outbound requests from user input
- [ ] **SSRF3** — Webhook/callback URLs validated against an allowlist of schemes and domains

### M. Open Redirects
- [ ] **M1** — Redirect targets validated against an allowlist — no `redirect($userInput)` to arbitrary URLs
- [ ] **M2** — Login/logout redirect parameters (`?next=`, `?returnUrl=`) restricted to relative paths or same-origin URLs
- [ ] **M3** — No open redirect via `Location` header set from raw user input

### N. CORS Misconfiguration
- [ ] **CORS1** — `Access-Control-Allow-Origin` is not `*` on authenticated endpoints
- [ ] **CORS2** — `Access-Control-Allow-Credentials: true` never combined with wildcard origin
- [ ] **CORS3** — Allowed origins list matches actual frontend domains only

### O. Insecure Deserialization
- [ ] **O1** — No deserialization of untrusted data with unsafe deserializers (`unserialize()`, `BinaryFormatter`, `ObjectInputStream`)
- [ ] **O2** — JSON deserialization does not allow polymorphic type handling with user-controlled type discriminators
- [ ] **O3** — Serialized session/cookie data is signed and integrity-verified before deserialization

### P. XML External Entities (XXE)
- [ ] **P1** — XML parsers configured to disable external entity resolution and DTD processing
- [ ] **P2** — No user-supplied XML parsed with default parser settings
- [ ] **P3** — If XML input is unnecessary, JSON preferred and XML endpoints removed

### Q. Exposed Files & Artifacts
- [ ] **Q1** — `.git/` directory not accessible via web
- [ ] **Q2** — No backup files (`.bak`, `.sql`, `.swp`, `.old`) accessible in the web root
- [ ] **Q3** — Debug pages (`phpinfo()`, `/elmah.axd`, `/_debugbar`) disabled or access-restricted in production
- [ ] **Q4** — Directory listing disabled on the web server

### R. Deployment & Infrastructure Hygiene
- [ ] **DEP1** — Application runs as non-root user in containers (Dockerfile `USER` directive)
- [ ] **DEP2** — Debug ports (Xdebug, remote debugger) not exposed in production
- [ ] **DEP3** — `.env` files and secrets not baked into Docker images or build artifacts
- [ ] **DEP4** — CI/CD pipeline does not leak secrets in logs or config files
- [ ] **DEP5** — Production deployments require code review / PR approval (no direct push to main)

---

## Step 4 — Run the Framework-Specific Checklist

After the universal checklist, load and run the relevant reference file(s) for framework-specific checks. Each reference file follows the same ✅/❌/⚠️/➖ format.

- Laravel → `references/laravel.md`
- Next.js → `references/nextjs.md`
- ASP.NET C# → `references/aspnet.md`
- React → `references/react.md`
- GraphQL → `references/graphql.md`

---

## Step 5 — Generate the Report

Output a structured Markdown report with:

1. **Executive Summary** — overall risk rating (Critical / High / Medium / Low / Clean), counts per severity
2. **Universal Checklist Results** — table format, one row per check
3. **Framework-Specific Results** — separate section per framework
4. **Findings Detail** — for every ❌ FAIL or ⚠️ PARTIAL:
   - **Finding ID** (e.g. `D2-LARAVEL-01`)
   - **Severity**: Critical / High / Medium / Low
   - **Evidence**: file path + line or code snippet
   - **Risk**: what an attacker could do
   - **Remediation**: concrete fix with code example where possible
5. **Passed Checks** — brief list for completeness
6. **N/A Checks** — brief list with reason

### Severity Definitions

| Severity | Criteria                                                      |
|----------|---------------------------------------------------------------|
| Critical | Remote code execution, authentication bypass, mass data leak  |
| High     | Privilege escalation, stored XSS, SQLi, IDOR                 |
| Medium   | CSRF, reflected XSS, missing headers, sensitive data exposure |
| Low      | Missing rate limits, verbose errors, dependency warnings      |

### OWASP Top 10 (2021) Mapping

| OWASP 2021                    | Checklist Sections |
|-------------------------------|--------------------|
| A01 Broken Access Control     | C, M               |
| A02 Cryptographic Failures    | A, H               |
| A03 Injection                 | D, E, P            |
| A04 Insecure Design           | B, C, F            |
| A05 Security Misconfiguration | A, G, Q, R         |
| A06 Vulnerable Components     | I                  |
| A07 Auth Failures             | B                  |
| A08 Data Integrity Failures   | O                  |
| A09 Logging Failures          | J                  |
| A10 SSRF                      | L                  |
| (Cross-cutting) CORS          | N                  |

---

## Behaviour Rules

- **Never assume a check passes** without evidence from the actual codebase.
- If a file cannot be read, mark the check ➖ N/A and note the reason.
- Be specific: cite file paths and line numbers, not vague descriptions.
- Prioritise findings by severity — Critical items first.
- If the codebase is clean on a category, say so clearly — do not invent findings.
- Keep remediation advice actionable and framework-idiomatic.