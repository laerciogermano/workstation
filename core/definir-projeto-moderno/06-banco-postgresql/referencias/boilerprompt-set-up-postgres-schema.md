Page image: https://boilerprompt.dev/cursor/opengraph-image?6b920aa6b59c4e7a

31 Cursor Prompts: Copy-Paste Examples That Work

# Cursor prompts

Prompts for Cursor's Agent mode that ship reviewed, multi-file changes in your repo.

Cursor prompts

31 prompts, every one free to copy. Jump to: App, Backend, Design, Features, Frontend, Refactor, Testing

## What Cursor is good at

Cursor is a VS Code fork with AI built into the editing loop rather than bolted on as a sidebar. Its Agent mode plans multi-file changes, runs terminal commands, and iterates on failing tests, while Tab handles inline completions and Cmd+K rewrites a selection in place. It fits developers who want an editor-first workflow: you stay in your files, watch diffs land, and accept or reject each change. Compared with Claude Code, which lives in the terminal, Cursor keeps everything visual and reviewable in the editor. Compared with GitHub Copilot, its agent takes on larger repo-wide tasks instead of mostly completing the line you are on. Context handling is its core strength: @ mentions pull specific files, folders, or docs into a request, and rules files let a team pin conventions the model must follow. The prompts in this section are written for Agent mode, where Cursor can create files, edit across the codebase, and verify its own work.

## How to prompt Cursor

Prompts for Cursor work best between 60 and 160 words: long enough to carry constraints, short enough that nothing gets ignored. Open with the outcome, not the steps. Cursor's agent plans its own sequence, so "add rate limiting with these behaviors" beats a numbered list of file edits.

Always specify three things. First, scope: name the files or folders with @ mentions, or say explicitly "search the codebase" when you want it to find things itself. Second, constraints that are invisible in the code: framework choices, versions you are pinned to, patterns your team forbids. Third, verification: tell it to run the test suite, start the dev server, or type-check, because the agent can execute commands and will actually close the loop when asked.

Put durable conventions in a rules file (.cursor/rules) instead of repeating them per prompt. Things like "use the repository pattern" or "never use default exports" belong there.

When a task is big, ask for a plan first and approve it before edits begin. And when output drifts, do not argue through a long thread; restate the task in a fresh chat with the relevant files attached. Cursor is far better at a clean, well-scoped request than at recovering from five rounds of corrections.

## All 31 Cursor prompts

### App 3 prompts

#### Build a SaaS starter app

```
Scaffold a SaaS starter in a new project using {{language}} and {{database}}. Set up authentication with email plus password and OAuth, organizations with role-based membership (owner, admin, member), and subscription billing via {{addon}} with a webhook handler that updates the local subscription record idempotently, verifying signatures and handling out-of-order events. Build three areas: a public marketing page, an authenticated app shell with settings and team management (invite by email, revoke, change role), and a minimal admin view of organizations. Enforce authorization at the data layer, not just the UI, so a member cannot hit an owner-only endpoint directly. Write a test that requests an owner-only endpoint with a member's session token and asserts it returns 403. Seed a demo org and user, document required environment variables in .env.example, then run the test suite and the app, exercise signup through checkout in test mode, and list the directory structure you created.
```

Customize this prompt

Language / framework

TypeScript JavaScript Python Go Rust Java Ruby PHP C#

Database

PostgreSQL MySQL SQLite MongoDB Supabase Firebase an in-memory store

Add-on

input validation auth (JWT) unit tests error handling OpenAPI/Swagger docs rate limiting no extras

Your customized prompt Copy customized

```
Scaffold a SaaS starter in a new project using TypeScript and PostgreSQL. Set up authentication with email plus password and OAuth, organizations with role-based membership (owner, admin, member), and subscription billing via input validation with a webhook handler that updates the local subscription record idempotently, verifying signatures and handling out-of-order events. Build three areas: a public marketing page, an authenticated app shell with settings and team management (invite by email, revoke, change role), and a minimal admin view of organizations. Enforce authorization at the data layer, not just the UI, so a member cannot hit an owner-only endpoint directly. Write a test that requests an owner-only endpoint with a member's session token and asserts it returns 403. Seed a demo org and user, document required environment variables in .env.example, then run the test suite and the app, exercise signup through checkout in test mode, and list the directory structure you created.
```

#### Build a to-do app

```
Scaffold a to-do app in this workspace using {{language}} with {{database}} for persistence. Create three parts: a tasks table or collection with id, title, done, and created_at, a data layer in src/lib/tasks with create, toggle, and delete functions, and a single list view at the app root. The list needs an input that adds on Enter, a checkbox that toggles done with an optimistic update, and a delete button that skips confirmation but supports undo for five seconds. Handle the empty state with a short line of copy, not a blank screen. Do not add auth, folders, or tags. Write one test file covering the three data layer functions, nothing UI level. When finished, run that test file from the integrated terminal, start the dev server to confirm a clean compile, then list every file you created or changed so I can review each diff before accepting.
```

Customize this prompt

Language / framework

TypeScript JavaScript Python Go Rust Java Ruby PHP C#

Database

PostgreSQL MySQL SQLite MongoDB Supabase Firebase an in-memory store

Your customized prompt Copy customized

```
Scaffold a to-do app in this workspace using TypeScript with PostgreSQL for persistence. Create three parts: a tasks table or collection with id, title, done, and created_at, a data layer in src/lib/tasks with create, toggle, and delete functions, and a single list view at the app root. The list needs an input that adds on Enter, a checkbox that toggles done with an optimistic update, and a delete button that skips confirmation but supports undo for five seconds. Handle the empty state with a short line of copy, not a blank screen. Do not add auth, folders, or tags. Write one test file covering the three data layer functions, nothing UI level. When finished, run that test file from the integrated terminal, start the dev server to confirm a clean compile, then list every file you created or changed so I can review each diff before accepting.
```

#### Build a blog with a CMS

```
Build a blog where the CMS is the repo: posts live as Markdown files with frontmatter in content/posts, no external CMS service. Frontmatter fields are title, slug, date, draft, and tags. Generate three things: an index page listing published posts newest first, a post page at /blog/[slug] rendering Markdown with syntax highlighting for code blocks, and an RSS feed at /rss.xml. Drafts must be visible in dev and excluded from the production build, and I want a test asserting a draft slug returns 404 in production mode. Validate frontmatter at build time and fail the build with the offending filename when a field is missing. Do not add comments, search, or an admin UI. Verify with a production build in the terminal using two sample posts and one draft, then list the generated routes and every new file.
```

### Backend 8 prompts

#### Build a REST API

```
Build a REST API for managing {{resource}} records in {{language}}, using the framework already in this codebase, or scaffold a minimal new project if none exists. Implement five endpoints: GET /{{resource}} with pagination (limit and offset query params, default limit 20, max 100), GET /{{resource}}/:id, POST, PUT or PATCH, and DELETE. Validate request bodies at the boundary and return 400 with a field-level error list, 404 for unknown ids, and 201 with a Location header on create. Store data in {{database}} behind a small repository layer so handlers stay thin. Add integration tests covering the happy path plus invalid payloads and missing ids, then run the test suite and list every file you created or changed.
```

#### Build a GraphQL API

```
Add a GraphQL API to this codebase in {{language}}. Define a schema with a {{resource}} type, queries for a single item by id and a paginated list using cursor-based connections (edges, nodes, pageInfo with hasNextPage and endCursor), and mutations for create, update, and delete that return the affected object plus a userErrors array instead of throwing on validation failures. Back the resolvers with {{database}} and add a dataloader for any nested field that would otherwise trigger N+1 queries. Reject queries deeper than 6 levels and cap the first argument at 100. Enable the playground only outside production. Write resolver tests that assert the batching actually happens by counting executed queries, run them, and summarize the schema and resolver files you touched.
```

Customize this prompt

Language / framework

TypeScript JavaScript Python Go Rust Java Ruby PHP C#

Database

PostgreSQL MySQL SQLite MongoDB Supabase Firebase an in-memory store

Main resource / entity e.g. users, orders, posts

Your customized prompt Copy customized

```
Add a GraphQL API to this codebase in TypeScript. Define a schema with a users type, queries for a single item by id and a paginated list using cursor-based connections (edges, nodes, pageInfo with hasNextPage and endCursor), and mutations for create, update, and delete that return the affected object plus a userErrors array instead of throwing on validation failures. Back the resolvers with PostgreSQL and add a dataloader for any nested field that would otherwise trigger N+1 queries. Reject queries deeper than 6 levels and cap the first argument at 100. Enable the playground only outside production. Write resolver tests that assert the batching actually happens by counting executed queries, run them, and summarize the schema and resolver files you touched.
```

#### Add JWT authentication

```
Add JWT authentication to the existing API in this repo. Create POST /auth/register and POST /auth/login endpoints that hash passwords with bcrypt or argon2, never plaintext, then issue a short-lived access token (15 minutes) and a refresh token (7 days) stored as an httpOnly, Secure, SameSite=Strict cookie. Add middleware that verifies the access token signature and expiry, attaches the user to the request, and returns 401 with a WWW-Authenticate header on failure rather than 500. Include POST /auth/refresh with refresh token rotation and a revocation check against {{database}}. Read the signing secret from an environment variable and fail fast at startup if it is missing. Cover expired tokens, tampered signatures, and reuse of a rotated refresh token in tests, run them, and list changed files.
```

#### Set up a Postgres database schema

```
Design a Postgres schema for {{resource}} in this project and write it as versioned migrations using the migration tool already present, or add a lightweight one and note why you chose it. Use bigint identity primary keys, timestamptz created_at and updated_at with a trigger or ORM hook keeping updated_at current, NOT NULL plus CHECK constraints where the domain demands them, and foreign keys with an explicit ON DELETE choice per relationship rather than a blanket CASCADE. Add unique indexes for natural keys and partial indexes for common filtered queries, for example WHERE deleted_at IS NULL if soft deletes are used. Generate both up and down migrations, apply them to a local database, run the rollback once to prove the down path works, then print the final schema for each table.
```

Customize this prompt

Main resource / entity e.g. users, orders, posts

Your customized prompt Copy customized

```
Design a Postgres schema for users in this project and write it as versioned migrations using the migration tool already present, or add a lightweight one and note why you chose it. Use bigint identity primary keys, timestamptz created_at and updated_at with a trigger or ORM hook keeping updated_at current, NOT NULL plus CHECK constraints where the domain demands them, and foreign keys with an explicit ON DELETE choice per relationship rather than a blanket CASCADE. Add unique indexes for natural keys and partial indexes for common filtered queries, for example WHERE deleted_at IS NULL if soft deletes are used. Generate both up and down migrations, apply them to a local database, run the rollback once to prove the down path works, then print the final schema for each table.
```

#### Add rate limiting to an API

```
Add rate limiting to the API in this codebase. Implement a sliding window limiter keyed on authenticated user id when present, falling back to client IP taken from the leftmost trusted X-Forwarded-For entry only when a proxy is configured. Store counters in Redis if the project already runs it; otherwise use an in-memory store and flag in a comment that it will not work across multiple instances. Default to 100 requests per minute per key, overridable per route, with stricter caps on login and password reset endpoints to slow credential stuffing. Return 429 with Retry-After and RateLimit-Remaining headers, and exclude health check routes. Write tests that fire requests past the threshold, assert the 429 and header values, confirm the window resets, then run the full suite.
```

#### Build a file upload endpoint

```
Build a file upload endpoint in this codebase in {{language}}. Accept multipart/form-data on POST /uploads, stream the file to disk or S3-compatible storage rather than buffering it in memory, and enforce a 10 MB size cap that aborts the stream early instead of reading the whole body first. Validate file type by magic bytes, not extension or client Content-Type, allowing only png, jpeg, and pdf. Generate a random storage key, never trust the original filename, and strip path separators before persisting metadata (original name, mime type, size, storage key) to {{database}}. Return 201 with the file id and an expiring download URL, 413 for oversize, and 415 for disallowed types. Add tests uploading a valid image, an oversized file, and an exe renamed to .png, then run them and report results.
```

Customize this prompt

Language / framework

TypeScript JavaScript Python Go Rust Java Ruby PHP C#

Database

PostgreSQL MySQL SQLite MongoDB Supabase Firebase an in-memory store

Your customized prompt Copy customized

```
Build a file upload endpoint in this codebase in TypeScript. Accept multipart/form-data on POST /uploads, stream the file to disk or S3-compatible storage rather than buffering it in memory, and enforce a 10 MB size cap that aborts the stream early instead of reading the whole body first. Validate file type by magic bytes, not extension or client Content-Type, allowing only png, jpeg, and pdf. Generate a random storage key, never trust the original filename, and strip path separators before persisting metadata (original name, mime type, size, storage key) to PostgreSQL. Return 201 with the file id and an expiring download URL, 413 for oversize, and 415 for disallowed types. Add tests uploading a valid image, an oversized file, and an exe renamed to .png, then run them and report results.
```

#### Add role-based access control

```
Add role-based access control to the existing API in this repo. Read the current auth middleware first and reuse its session or token parsing, do not build a second auth path. Define three roles, admin, editor, and viewer, in a single roles module, and add a requireRole guard that returns 403 with a JSON error body when the check fails and never reveals whether the {{resource}} exists. Apply the guard so viewers get read-only access, editors can write, and only admins reach delete and user management routes. Store the role on the user record in {{database}} with a migration that defaults existing users to viewer. Write tests covering each role against one read, one write, and one delete route, run the full suite in the terminal, and show me the diff per file before I accept.
```

Customize this prompt

Database

PostgreSQL MySQL SQLite MongoDB Supabase Firebase an in-memory store

Main resource / entity e.g. users, orders, posts

Your customized prompt Copy customized

```
Add role-based access control to the existing API in this repo. Read the current auth middleware first and reuse its session or token parsing, do not build a second auth path. Define three roles, admin, editor, and viewer, in a single roles module, and add a requireRole guard that returns 403 with a JSON error body when the check fails and never reveals whether the users exists. Apply the guard so viewers get read-only access, editors can write, and only admins reach delete and user management routes. Store the role on the user record in PostgreSQL with a migration that defaults existing users to viewer. Write tests covering each role against one read, one write, and one delete route, run the full suite in the terminal, and show me the diff per file before I accept.
```

#### Integrate Stripe payments

```
Integrate Stripe checkout into this backend for a single paid {{resource}}. Three pieces only: a POST /api/checkout route that creates a Checkout Session server side with the price id from an environment variable, a success and cancel page pair, and a POST /api/webhooks/stripe handler. The webhook must verify the stripe-signature header against the raw request body, watch for framework body parsing that consumes it first, and handle checkout.session.completed idempotently so a replayed event never grants access twice. Record fulfillment in {{database}} keyed by the Stripe event id. Never treat the success page redirect as proof of payment, fulfillment happens only in the webhook. Test with the Stripe CLI: run stripe listen in the integrated terminal, trigger a test event, and show me the log line proving the handler fired exactly once. List every changed file when done.
```

Customize this prompt

Database

PostgreSQL MySQL SQLite MongoDB Supabase Firebase an in-memory store

Main resource / entity e.g. users, orders, posts

Your customized prompt Copy customized

```
Integrate Stripe checkout into this backend for a single paid users. Three pieces only: a POST /api/checkout route that creates a Checkout Session server side with the price id from an environment variable, a success and cancel page pair, and a POST /api/webhooks/stripe handler. The webhook must verify the stripe-signature header against the raw request body, watch for framework body parsing that consumes it first, and handle checkout.session.completed idempotently so a replayed event never grants access twice. Record fulfillment in PostgreSQL keyed by the Stripe event id. Never treat the success page redirect as proof of payment, fulfillment happens only in the webhook. Test with the Stripe CLI: run stripe listen in the integrated terminal, trigger a test event, and show me the log line proving the handler fired exactly once. List every changed file when done.
```

### Design 10 prompts

#### Build a hero section

```
In my existing repo, build a hero section for {{product}} and slot it above the first section of the landing page. Before writing anything, read one neighboring section component to learn this codebase's conventions, then match them.

File placement and integration:
- Create the component at src/components/sections/Hero.tsx, or wherever this repo keeps its section components — mirror the folder and naming pattern you find.
- Reuse the project's existing Button, Container, and heading primitives instead of inventing new ones; add local subcomponents only when nothing fits.
- Import it in the landing page and render it above the current first section. Do not edit, restyle, or reorder any sibling section, shared layout file, or global stylesheet.
- Deliver everything as one reviewable diff: the new file plus a single page-level import.

Hero anatomy — asymmetric split with copy left at roughly 55% width and the visual bleeding to the container's right edge:
- A kicker line naming the product category, then an H1 of at most nine words stating the before/after change {{product}} creates for {{audience}}.
- A one-sentence subhead that names {{audience}} explicitly and states the mechanism.
- A primary button labelled "{{cta}}" with a quieter text link beside it, then one proof line — logo strip or single stat, not both.
- The visual: a bordered 4:3 screenshot placeholder, top-aligned with the H1.

Rhythm: use the repo's spacing scale if it has one; otherwise 96px top section padding, 24px between copy blocks, 40px above the proof line. The whole section must fit a 1280x800 window with the proof line visible — no scrolling.

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Under 768px, stack copy above the visual and bring the visual back inside the container padding.

Run the dev server and verify: (1) git diff shows only the new file and one import, (2) existing sections render exactly as before, (3) the hero fits 1280x800 without scroll, (4) the primary button is the repo's own button component.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
In my existing repo, build a hero section for a project management SaaS and slot it above the first section of the landing page. Before writing anything, read one neighboring section component to learn this codebase's conventions, then match them.

File placement and integration:
- Create the component at src/components/sections/Hero.tsx, or wherever this repo keeps its section components — mirror the folder and naming pattern you find.
- Reuse the project's existing Button, Container, and heading primitives instead of inventing new ones; add local subcomponents only when nothing fits.
- Import it in the landing page and render it above the current first section. Do not edit, restyle, or reorder any sibling section, shared layout file, or global stylesheet.
- Deliver everything as one reviewable diff: the new file plus a single page-level import.

Hero anatomy — asymmetric split with copy left at roughly 55% width and the visual bleeding to the container's right edge:
- A kicker line naming the product category, then an H1 of at most nine words stating the before/after change a project management SaaS creates for engineering managers at startups.
- A one-sentence subhead that names engineering managers at startups explicitly and states the mechanism.
- A primary button labelled "start a free trial" with a quieter text link beside it, then one proof line — logo strip or single stat, not both.
- The visual: a bordered 4:3 screenshot placeholder, top-aligned with the H1.

Rhythm: use the repo's spacing scale if it has one; otherwise 96px top section padding, 24px between copy blocks, 40px above the proof line. The whole section must fit a 1280x800 window with the proof line visible — no scrolling.

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Under 768px, stack copy above the visual and bring the visual back inside the container padding.

Run the dev server and verify: (1) git diff shows only the new file and one import, (2) existing sections render exactly as before, (3) the hero fits 1280x800 without scroll, (4) the primary button is the repo's own button component.
```

#### Build a testimonials carousel

```
In this repo, add a testimonial wall section to the {{product}} landing page for {{audience}}. Treat "carousel" as the mobile fallback only — the desktop presentation is a static grid of attributed quotes. The change should touch three things at most: a new section component, a new data file, and one insertion in the page that composes sections.

Where things go:
- Component next to the existing section components, following their naming and export style.
- Testimonial entries in a typed data file — or the repo's CMS/content layer if one exists; check for a content/ or lib/data pattern first and follow it.
- Do not modify sibling sections, shared layout, or global styles. If the repo has a Card primitive, compose it instead of writing new card CSS.

Section structure: an h2 making one concrete claim about results with {{product}}; a featured blockquote at display size with cite-level attribution; then a 3-column grid of eight quote cards, using CSS columns or dense grid auto-flow so mixed-length quotes pack tightly instead of leaving equal-height gaps. Render a logos row only if the data file provides logos. End with a text link labeled "{{cta}}" that reuses the page's primary CTA target.

Quote copy: rewrite any placeholder testimonials as specific, outcome-bearing statements from plausible roles inside {{audience}} — each names a task {{product}} changed and how. Forbid superlatives without evidence. Every card needs name, role, and company.

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Spacing: adopt the vertical padding token neighboring sections use; 1.5rem grid gap; give the featured quote double that gap below it. Below the md breakpoint, swap the grid for an overflow-x scroll-snap row of the same cards — one viewport-wide card per snap stop, same markup, no carousel library.

Run the dev server after applying the diffs and check: the page composes with the new section in place and siblings unchanged; the packing shows no large vertical holes; mobile swipes through cards with snap stops; the "{{cta}}" link resolves to the hero's target; typecheck and lint pass.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
In this repo, add a testimonial wall section to the a project management SaaS landing page for engineering managers at startups. Treat "carousel" as the mobile fallback only — the desktop presentation is a static grid of attributed quotes. The change should touch three things at most: a new section component, a new data file, and one insertion in the page that composes sections.

Where things go:
- Component next to the existing section components, following their naming and export style.
- Testimonial entries in a typed data file — or the repo's CMS/content layer if one exists; check for a content/ or lib/data pattern first and follow it.
- Do not modify sibling sections, shared layout, or global styles. If the repo has a Card primitive, compose it instead of writing new card CSS.

Section structure: an h2 making one concrete claim about results with a project management SaaS; a featured blockquote at display size with cite-level attribution; then a 3-column grid of eight quote cards, using CSS columns or dense grid auto-flow so mixed-length quotes pack tightly instead of leaving equal-height gaps. Render a logos row only if the data file provides logos. End with a text link labeled "start a free trial" that reuses the page's primary CTA target.

Quote copy: rewrite any placeholder testimonials as specific, outcome-bearing statements from plausible roles inside engineering managers at startups — each names a task a project management SaaS changed and how. Forbid superlatives without evidence. Every card needs name, role, and company.

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Spacing: adopt the vertical padding token neighboring sections use; 1.5rem grid gap; give the featured quote double that gap below it. Below the md breakpoint, swap the grid for an overflow-x scroll-snap row of the same cards — one viewport-wide card per snap stop, same markup, no carousel library.

Run the dev server after applying the diffs and check: the page composes with the new section in place and siblings unchanged; the packing shows no large vertical holes; mobile swipes through cards with snap stops; the "start a free trial" link resolves to the hero's target; typecheck and lint pass.
```

#### Build a FAQ accordion

```
Add a FAQ accordion section to the existing landing page for {{product}} in this repo, aimed at {{audience}}. This is a single section spliced into the current page — find the file that composes the landing sections and insert the FAQ between the last proof section and the final CTA, changing nothing else in that file beyond the import and one JSX insertion.

Placement and conventions:
- New component beside the other section components, named to match their pattern (FaqSection vs faq-section, per local convention).
- If the repo already ships an accordion primitive (shadcn/Radix, Headless UI, or similar), use it — do not vendor a second accordion. Hand-roll rows (button + aria-expanded + aria-controls, panels keyed by id) only if nothing exists.
- Keep the FAQ copy in a const array at the top of the component file so future edits are diffs to data, not markup.

Behavior spec: single-open accordion — expanding one question collapses the rest; Enter and Space toggle the focused trigger; focus order runs top to bottom through the question buttons. The section heading is an h2, and each question renders as an h3 wrapping its trigger button so the page outline stays intact.

Content spec: six questions written from {{audience}}'s objections to adopting {{product}} — cost of switching, what breaks, security posture, lock-in, proof it works, and support speed. Answers stay under 60 words and each names one concrete thing: a number, a guarantee, or a timeframe. Close the section with a muted one-liner linking to the page's primary action, labeled "{{cta}}".

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Spacing: inherit the section-padding class or spacing token neighboring sections use; divide rows with the repo's border token; cap answers near 72ch. Mobile: single column, trigger tap targets at least 44px tall.

After applying the diff, run the dev server and check: surrounding sections render exactly as before; one panel open at a time; the h1-h2-h3 outline holds; the closing "{{cta}}" link matches the hero's destination; no duplicate accordion dependency was added.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
Add a FAQ accordion section to the existing landing page for a project management SaaS in this repo, aimed at engineering managers at startups. This is a single section spliced into the current page — find the file that composes the landing sections and insert the FAQ between the last proof section and the final CTA, changing nothing else in that file beyond the import and one JSX insertion.

Placement and conventions:
- New component beside the other section components, named to match their pattern (FaqSection vs faq-section, per local convention).
- If the repo already ships an accordion primitive (shadcn/Radix, Headless UI, or similar), use it — do not vendor a second accordion. Hand-roll rows (button + aria-expanded + aria-controls, panels keyed by id) only if nothing exists.
- Keep the FAQ copy in a const array at the top of the component file so future edits are diffs to data, not markup.

Behavior spec: single-open accordion — expanding one question collapses the rest; Enter and Space toggle the focused trigger; focus order runs top to bottom through the question buttons. The section heading is an h2, and each question renders as an h3 wrapping its trigger button so the page outline stays intact.

Content spec: six questions written from engineering managers at startups's objections to adopting a project management SaaS — cost of switching, what breaks, security posture, lock-in, proof it works, and support speed. Answers stay under 60 words and each names one concrete thing: a number, a guarantee, or a timeframe. Close the section with a muted one-liner linking to the page's primary action, labeled "start a free trial".

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Spacing: inherit the section-padding class or spacing token neighboring sections use; divide rows with the repo's border token; cap answers near 72ch. Mobile: single column, trigger tap targets at least 44px tall.

After applying the diff, run the dev server and check: surrounding sections render exactly as before; one panel open at a time; the h1-h2-h3 outline holds; the closing "start a free trial" link matches the hero's destination; no duplicate accordion dependency was added.
```

#### Design a SaaS landing page

```
In this repo, build our marketing landing page for {{product}}, targeting {{audience}}. Before writing anything, detect the existing stack — framework, styling approach, component conventions — and match it exactly; do not introduce a new UI library or CSS system. Put the page at the root route and split sections into files under the components directory, following whatever naming convention neighboring files already use.

Section sequence:
1. Nav — reuse the app's existing header component if one exists; otherwise create one with logo, links, and the CTA.
2. Hero — headline formula: {{product}} plus the painful task it removes, under 10 words; subhead answers "how" in one sentence; primary CTA with a secondary link to docs.
3. Social proof — a single testimonial in its own component with a quote prop (skip logo walls unless brand assets already exist in the repo).
4. Features — three items rendered from a typed array (title, description, icon) defined in one data file, mapped rather than hand-written.
5. Product shot — a screenshot component with a bordered frame and alt text describing the actual screen.
6. Pricing teaser — the cheapest and the most popular tiers only, driven by the same data-file pattern.
7. FAQ — four items, semantic details elements or the repo's existing accordion.
8. Final CTA band and footer.

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Spacing and responsive:
- Derive spacing from the repo's existing scale or tokens; separate sections by the largest step and intra-section groups by two steps down. If no scale exists, establish 96/64/32.
- On mobile, features and pricing stack single-column and nav links move into a disclosure menu.

The primary call to action is "{{cta}}" wherever a signup button appears.

Apply everything as one reviewable set of diffs across the new files plus route registration. Afterwards verify: the app still builds with zero type errors; no new dependencies were added to package.json; the features array renders all three entries; the page inherits the repo's global layout without duplicating header or footer.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
In this repo, build our marketing landing page for a project management SaaS, targeting engineering managers at startups. Before writing anything, detect the existing stack — framework, styling approach, component conventions — and match it exactly; do not introduce a new UI library or CSS system. Put the page at the root route and split sections into files under the components directory, following whatever naming convention neighboring files already use.

Section sequence:
1. Nav — reuse the app's existing header component if one exists; otherwise create one with logo, links, and the CTA.
2. Hero — headline formula: a project management SaaS plus the painful task it removes, under 10 words; subhead answers "how" in one sentence; primary CTA with a secondary link to docs.
3. Social proof — a single testimonial in its own component with a quote prop (skip logo walls unless brand assets already exist in the repo).
4. Features — three items rendered from a typed array (title, description, icon) defined in one data file, mapped rather than hand-written.
5. Product shot — a screenshot component with a bordered frame and alt text describing the actual screen.
6. Pricing teaser — the cheapest and the most popular tiers only, driven by the same data-file pattern.
7. FAQ — four items, semantic details elements or the repo's existing accordion.
8. Final CTA band and footer.

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Spacing and responsive:
- Derive spacing from the repo's existing scale or tokens; separate sections by the largest step and intra-section groups by two steps down. If no scale exists, establish 96/64/32.
- On mobile, features and pricing stack single-column and nav links move into a disclosure menu.

The primary call to action is "start a free trial" wherever a signup button appears.

Apply everything as one reviewable set of diffs across the new files plus route registration. Afterwards verify: the app still builds with zero type errors; no new dependencies were added to package.json; the features array renders all three entries; the page inherits the repo's global layout without duplicating header or footer.
```

#### Design an agency landing page

```
In my existing repo, add a portfolio-forward landing page for {{product}}, aimed at {{audience}}. Work with the stack that is already here: detect the framework and styling approach before writing anything, follow current conventions for routing and component placement (app/(marketing)/page.tsx, src/pages/, or whatever this project uses), and split the page into section components inside the repo's components directory. Apply the whole change as one reviewable set of diffs.

Page anatomy, in order:
1. Intro band — {{product}}'s name, a specialty statement of 8–12 words, and current availability.
2. Work index — a numbered index of 6 projects (01–06); each row lists project name, client sector, year, and one metric, and hovering a row previews a thumbnail area pinned to the right.
3. Capability matrix — a 2x3 grid of service cells, each holding a term and a 12–18 word definition.
4. Working method — 4 steps as stacked rows beside a sticky left-column label that stays put while the steps scroll.
5. Manifesto + team — one pull-quote-sized statement, then names and roles on a single comma-separated line.
6. Contact block — a large mail link and a secondary anchor link back to the work index.

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Constraints:
- Reuse the repo's existing design tokens and utilities; introduce no new styling system and no new dependencies.
- Section block padding: 6rem desktop, 3.5rem mobile; work index rows keep a fixed height with a 1px divider between them.
- On mobile, the thumbnail preview disappears (rows become direct links) and the sticky method label degrades to a static heading.

The primary call to action is "{{cta}}" — one instance only, in the intro band. Derive every project name and capability definition from {{product}}'s specialty rather than lorem ipsum.

After applying the diffs, verify: the page compiles with the repo's existing build command; the dependency manifest is unchanged; the work index has 6 rows, each with a metric; the sticky label holds at desktop width; "{{cta}}" appears exactly once.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
In my existing repo, add a portfolio-forward landing page for a project management SaaS, aimed at engineering managers at startups. Work with the stack that is already here: detect the framework and styling approach before writing anything, follow current conventions for routing and component placement (app/(marketing)/page.tsx, src/pages/, or whatever this project uses), and split the page into section components inside the repo's components directory. Apply the whole change as one reviewable set of diffs.

Page anatomy, in order:
1. Intro band — a project management SaaS's name, a specialty statement of 8–12 words, and current availability.
2. Work index — a numbered index of 6 projects (01–06); each row lists project name, client sector, year, and one metric, and hovering a row previews a thumbnail area pinned to the right.
3. Capability matrix — a 2x3 grid of service cells, each holding a term and a 12–18 word definition.
4. Working method — 4 steps as stacked rows beside a sticky left-column label that stays put while the steps scroll.
5. Manifesto + team — one pull-quote-sized statement, then names and roles on a single comma-separated line.
6. Contact block — a large mail link and a secondary anchor link back to the work index.

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Constraints:
- Reuse the repo's existing design tokens and utilities; introduce no new styling system and no new dependencies.
- Section block padding: 6rem desktop, 3.5rem mobile; work index rows keep a fixed height with a 1px divider between them.
- On mobile, the thumbnail preview disappears (rows become direct links) and the sticky method label degrades to a static heading.

The primary call to action is "start a free trial" — one instance only, in the intro band. Derive every project name and capability definition from a project management SaaS's specialty rather than lorem ipsum.

After applying the diffs, verify: the page compiles with the repo's existing build command; the dependency manifest is unchanged; the work index has 6 rows, each with a metric; the sticky label holds at desktop width; "start a free trial" appears exactly once.
```

#### Design a pricing section

```
Add a pricing section to the existing marketing page for {{product}} in this repo — a section within the page for {{audience}} to scan, not a standalone pricing page (if one exists, leave it alone).

Before writing code, read the file that composes the landing sections and match its conventions: same component directory (components/marketing/ or app/(marketing)/_components/ or wherever siblings live), same styling system as neighboring sections, same export pattern. Create PricingSection there plus a colocated tiers config (three tiers: name, positioning line, monthly and yearly prices, feature list, button label). Insert the section into the page's sequence right after features. Do not reorder or restyle any sibling section, and do not introduce a new UI dependency if the repo already has button and card primitives.

Section anatomy:
- An h2 (the page already owns the h1) stating the outcome {{product}} prices against, plus one supporting line.
- Billing toggle with a single state source; annual displays its effective monthly price.
- Three tier cards; the middle one is recommended — badge plus heavier border, and its button is the sole primary variant, labeled "{{cta}}". Outer tiers use the repo's secondary button variant.
- Feature lists: base tier complete, upper tiers "Everything in X, plus" with 3–4 deltas; keep every bullet under eight words.

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Spacing: reuse the page's existing section-padding utility or token rather than inventing a new value; card gap one step tighter than section padding. Mobile: cards stack with the recommended tier first — reorder with order utilities, not duplicated markup.

Apply the change as a small diff set, run the dev server, and verify: the new section renders between its intended neighbors; toggling billing rerenders all prices; heading levels stay h1 then h2; adjacent sections show no visual diff; lint and typecheck pass.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
Add a pricing section to the existing marketing page for a project management SaaS in this repo — a section within the page for engineering managers at startups to scan, not a standalone pricing page (if one exists, leave it alone).

Before writing code, read the file that composes the landing sections and match its conventions: same component directory (components/marketing/ or app/(marketing)/_components/ or wherever siblings live), same styling system as neighboring sections, same export pattern. Create PricingSection there plus a colocated tiers config (three tiers: name, positioning line, monthly and yearly prices, feature list, button label). Insert the section into the page's sequence right after features. Do not reorder or restyle any sibling section, and do not introduce a new UI dependency if the repo already has button and card primitives.

Section anatomy:
- An h2 (the page already owns the h1) stating the outcome a project management SaaS prices against, plus one supporting line.
- Billing toggle with a single state source; annual displays its effective monthly price.
- Three tier cards; the middle one is recommended — badge plus heavier border, and its button is the sole primary variant, labeled "start a free trial". Outer tiers use the repo's secondary button variant.
- Feature lists: base tier complete, upper tiers "Everything in X, plus" with 3–4 deltas; keep every bullet under eight words.

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Spacing: reuse the page's existing section-padding utility or token rather than inventing a new value; card gap one step tighter than section padding. Mobile: cards stack with the recommended tier first — reorder with order utilities, not duplicated markup.

Apply the change as a small diff set, run the dev server, and verify: the new section renders between its intended neighbors; toggling billing rerenders all prices; heading levels stay h1 then h2; adjacent sections show no visual diff; lint and typecheck pass.
```

#### Design a bento grid section

```
In this repo, add a bento grid section to the landing page for {{product}}. Before writing code, open the landing page file and two existing section components to learn the local conventions — container component, spacing scale, heading levels, card primitives — and match them.

Placement and safety:
- New file: src/components/sections/BentoFeatures.tsx, or this repo's equivalent section folder; follow what you find.
- Insert its import and render call immediately after the hero in the page file. Do not renumber, restyle, or re-space any neighboring section; the only page-file change is one import and one JSX line.
- Reuse the repo's Card or Panel primitive for cells if one exists; otherwise define a single local Cell subcomponent inside the new file.

The grid — 4 columns, six cells, one claim per cell, gap taken from the repo's spacing scale (default 16px):
- One 2x2 anchor: the capability that best explains why {{audience}} picks {{product}} over the incumbent, with a media placeholder sized to the cell.
- One 2x1: a horizontal before/after strip — the old way struck through, the {{product}} way beside it.
- Two 1x1 stats: different units, each a number plus a caption under six words.
- One 1x1 quote with attribution.
- One 1x1 action card linking out, labelled "{{cta}}" — built from the repo's own link or button component.

Above the grid: an overline plus an H2 under nine words, using the same heading component sibling sections use, 48px above the grid. Section vertical padding equals whatever the neighboring sections use — read it, don't invent it.

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Responsive: 2 columns at tablet with the anchor spanning both, 1 column on phones with the anchor first and the action card last.

Run the dev server and verify: (1) git diff touches only the new file and two lines of the page file, (2) sections above and below sit at unchanged offsets — compare screenshots if unsure, (3) all six cells render with no grid holes at three breakpoints, (4) the action card uses the repo's own interactive component.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
In this repo, add a bento grid section to the landing page for a project management SaaS. Before writing code, open the landing page file and two existing section components to learn the local conventions — container component, spacing scale, heading levels, card primitives — and match them.

Placement and safety:
- New file: src/components/sections/BentoFeatures.tsx, or this repo's equivalent section folder; follow what you find.
- Insert its import and render call immediately after the hero in the page file. Do not renumber, restyle, or re-space any neighboring section; the only page-file change is one import and one JSX line.
- Reuse the repo's Card or Panel primitive for cells if one exists; otherwise define a single local Cell subcomponent inside the new file.

The grid — 4 columns, six cells, one claim per cell, gap taken from the repo's spacing scale (default 16px):
- One 2x2 anchor: the capability that best explains why engineering managers at startups picks a project management SaaS over the incumbent, with a media placeholder sized to the cell.
- One 2x1: a horizontal before/after strip — the old way struck through, the a project management SaaS way beside it.
- Two 1x1 stats: different units, each a number plus a caption under six words.
- One 1x1 quote with attribution.
- One 1x1 action card linking out, labelled "start a free trial" — built from the repo's own link or button component.

Above the grid: an overline plus an H2 under nine words, using the same heading component sibling sections use, 48px above the grid. Section vertical padding equals whatever the neighboring sections use — read it, don't invent it.

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Responsive: 2 columns at tablet with the anchor spanning both, 1 column on phones with the anchor first and the action card last.

Run the dev server and verify: (1) git diff touches only the new file and two lines of the page file, (2) sections above and below sit at unchanged offsets — compare screenshots if unsure, (3) all six cells render with no grid holes at three breakpoints, (4) the action card uses the repo's own interactive component.
```

#### Design a footer section

```
Add a production-quality footer to the existing landing page for {{product}} in this repo. Before writing code, read the page file and two existing section components to learn the conventions — container width, spacing scale, export style — and match them exactly. Create the footer as a new component beside the other sections (components/sections/Footer.tsx if that is the pattern), then apply a minimal diff to the page: one import, one render after the last section. Do not modify any other section, do not touch global styles, and reuse the existing container wrapper rather than introducing a new max-width.

Anatomy of the section:
- Row 1: newsletter capture with a promise line derived from {{product}} — name the actual thing {{audience}} gets by subscribing. Style the submit as the codebase's secondary button variant; the primary variant stays reserved for "{{cta}}", which appears once more here as a small text link under the form for bottom-of-page converts.
- Row 2: 3-4 link columns whose contents come from the product's real site map — read the routes or pages directory and link only to routes that exist, grouped under plain headings.
- Row 3: legal line (copyright, privacy, terms) plus social icons from whatever icon library the repo already depends on — add no new dependency.
- Optional, behind row 3: the product name at display scale, clipped by the section's overflow hidden, at very low contrast.

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Spacing and responsive:
- Use the spacing scale already in the codebase: top padding equal to the largest section gap on the page, interior gaps one and two steps down.
- Mobile: columns drop to 2-up, the form stacks, the legal row wraps — confirm nothing overlaps the section above at 375px wide.

After applying the diff, verify: git diff shows only the new footer file plus the import and render lines, every footer link resolves to an existing route, no dependency was added, the section above the footer renders exactly as before, and the clipped wordmark introduces no horizontal scroll.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
Add a production-quality footer to the existing landing page for a project management SaaS in this repo. Before writing code, read the page file and two existing section components to learn the conventions — container width, spacing scale, export style — and match them exactly. Create the footer as a new component beside the other sections (components/sections/Footer.tsx if that is the pattern), then apply a minimal diff to the page: one import, one render after the last section. Do not modify any other section, do not touch global styles, and reuse the existing container wrapper rather than introducing a new max-width.

Anatomy of the section:
- Row 1: newsletter capture with a promise line derived from a project management SaaS — name the actual thing engineering managers at startups gets by subscribing. Style the submit as the codebase's secondary button variant; the primary variant stays reserved for "start a free trial", which appears once more here as a small text link under the form for bottom-of-page converts.
- Row 2: 3-4 link columns whose contents come from the product's real site map — read the routes or pages directory and link only to routes that exist, grouped under plain headings.
- Row 3: legal line (copyright, privacy, terms) plus social icons from whatever icon library the repo already depends on — add no new dependency.
- Optional, behind row 3: the product name at display scale, clipped by the section's overflow hidden, at very low contrast.

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Spacing and responsive:
- Use the spacing scale already in the codebase: top padding equal to the largest section gap on the page, interior gaps one and two steps down.
- Mobile: columns drop to 2-up, the form stacks, the legal row wraps — confirm nothing overlaps the section above at 375px wide.

After applying the diff, verify: git diff shows only the new footer file plus the import and render lines, every footer link resolves to an existing route, no dependency was added, the section above the footer renders exactly as before, and the clipped wordmark introduces no horizontal scroll.
```

#### Design an animated hero background

```
Add an animated background layer behind the existing hero in this repo for {{product}}. First locate the hero: search for the component rendering the landing page's top section — likely named Hero, Banner, or similar under src/components — and read it before editing anything.

Scope of change, kept minimal and reviewable:
- New file: src/components/fx/HeroBackdrop.tsx, or whichever folder matches this repo's conventions for presentational components.
- In the hero component: add relative positioning and overflow-hidden to the root only if absent, insert <HeroBackdrop /> as the first child, and raise the existing content's stacking context only if the layer would cover it. Do not reorder, rename, or restyle any existing child, and do not touch global styles or shared layout files.

Technique selection by visual direction: blurred drifting gradient fields for soft directions, a lightweight canvas particle layer for dark or technical directions, slow rotating geometric strokes for editorial or brutalist directions. Implement it in whatever styling system the repo already uses.

Hard requirements:
- Transform and opacity animation only; a single rAF loop at most, cancelled on unmount.
- prefers-reduced-motion renders a static composition — check for an existing motion-preference hook or utility in the repo before writing a new one.
- pointer-events none on the layer; every existing hero control keeps working, including the primary button labelled "{{cta}}".
- A quiet margin of about 64px around the headline block so copy aimed at {{audience}} never sits on a busy area; scrim it if contrast dips below 4.5:1.

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Map motion to intensity: element count, drift distance, and speed move together.

Below 768px, halve the element count and slow everything down.

Run the dev server and verify: (1) git diff shows the new file plus a few lines in the hero component and nothing else, (2) the hero renders identically with the layer removed — no layout shift either way, (3) reduced-motion emulation freezes it, (4) all hero links and buttons still click.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
Add an animated background layer behind the existing hero in this repo for a project management SaaS. First locate the hero: search for the component rendering the landing page's top section — likely named Hero, Banner, or similar under src/components — and read it before editing anything.

Scope of change, kept minimal and reviewable:
- New file: src/components/fx/HeroBackdrop.tsx, or whichever folder matches this repo's conventions for presentational components.
- In the hero component: add relative positioning and overflow-hidden to the root only if absent, insert <HeroBackdrop /> as the first child, and raise the existing content's stacking context only if the layer would cover it. Do not reorder, rename, or restyle any existing child, and do not touch global styles or shared layout files.

Technique selection by visual direction: blurred drifting gradient fields for soft directions, a lightweight canvas particle layer for dark or technical directions, slow rotating geometric strokes for editorial or brutalist directions. Implement it in whatever styling system the repo already uses.

Hard requirements:
- Transform and opacity animation only; a single rAF loop at most, cancelled on unmount.
- prefers-reduced-motion renders a static composition — check for an existing motion-preference hook or utility in the repo before writing a new one.
- pointer-events none on the layer; every existing hero control keeps working, including the primary button labelled "start a free trial".
- A quiet margin of about 64px around the headline block so copy aimed at engineering managers at startups never sits on a busy area; scrim it if contrast dips below 4.5:1.

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Map motion to intensity: element count, drift distance, and speed move together.

Below 768px, halve the element count and slow everything down.

Run the dev server and verify: (1) git diff shows the new file plus a few lines in the hero component and nothing else, (2) the hero renders identically with the layer removed — no layout shift either way, (3) reduced-motion emulation freezes it, (4) all hero links and buttons still click.
```

#### Design a feature grid section

```
In this repo, add a feature grid section to the {{product}} landing page. Work like a contributor, not a generator: open the page file and the two sections adjacent to the insertion point, note the container component, spacing scale, and heading levels, then build to those conventions. New files: the section component beside its siblings, plus the six feature entries in the repo's content or data location if one exists — otherwise as a const above the JSX.

The layout is a uniform grid, which is not a bento: every card occupies exactly one cell, all cells equal height, three across on desktop. Bentos mix spans to spotlight a favorite feature; this section refuses favorites, which is why it suits capability lists read by {{audience}} while comparing options. Do not let any card grow a screenshot or a double span.

Per card: an icon from the icon dependency already in package.json (install nothing), a title of 2-3 words, and a one-line benefit. Write all six benefits from {{product}}'s real functionality with outcome-first phrasing — lead with what the user can now do, keep each under 12 words, and vary the opening verbs so the grid doesn't chant.

The heading block above the grid follows the page's existing hierarchy — if sections open with h2, use h2. Below the grid, render the page's standard link component carrying "{{cta}}" as its label.

Hover: reuse the card hover treatment if one already exists anywhere in the codebase; otherwise a single subtle elevation on the card root, nothing per-child.

Visual direction:
{{style}}

Palette: {{palette}}
Typography: {{type}}
Motion: {{motion}}

Spacing and responsive:
- Take section vertical padding verbatim from the neighboring sections' classes; grid gap one step below the page's section gap.
- Collapse 3 to 2 to 1 columns at the breakpoints the codebase already defines — no custom breakpoint values.

Before finishing, verify: git diff contains only the new files and the insertion edit, both neighboring sections render identically to before, no package was installed, cards hold equal height with the real copy in place, and heading levels continue the page's hierarchy without skips.
```

Customize this prompt

Product / industry e.g. a project management SaaS Audience e.g. engineering managers at startups

Visual style

Minimal dark Swiss editorial Neo-brutalist Bento grid Glassmorphic Warm & organic Retro terminal High-contrast mono

Color direction

Monochrome + one accent Deep navy + electric blue Warm cream + ink Black + acid green Muted earth tones

Type pairing

Geometric sans throughout Serif display + sans body Mono display + sans body Grotesk + humanist

Motion level

None Subtle fades on scroll Scroll-driven parallax Heavy, animation-led

Primary CTA goal e.g. "start a free trial"

Your customized prompt Copy customized

```
In this repo, add a feature grid section to the a project management SaaS landing page. Work like a contributor, not a generator: open the page file and the two sections adjacent to the insertion point, note the container component, spacing scale, and heading levels, then build to those conventions. New files: the section component beside its siblings, plus the six feature entries in the repo's content or data location if one exists — otherwise as a const above the JSX.

The layout is a uniform grid, which is not a bento: every card occupies exactly one cell, all cells equal height, three across on desktop. Bentos mix spans to spotlight a favorite feature; this section refuses favorites, which is why it suits capability lists read by engineering managers at startups while comparing options. Do not let any card grow a screenshot or a double span.

Per card: an icon from the icon dependency already in package.json (install nothing), a title of 2-3 words, and a one-line benefit. Write all six benefits from a project management SaaS's real functionality with outcome-first phrasing — lead with what the user can now do, keep each under 12 words, and vary the opening verbs so the grid doesn't chant.

The heading block above the grid follows the page's existing hierarchy — if sections open with h2, use h2. Below the grid, render the page's standard link component carrying "start a free trial" as its label.

Hover: reuse the card hover treatment if one already exists anywhere in the codebase; otherwise a single subtle elevation on the card root, nothing per-child.

Visual direction:
Minimal dark style. Near-black canvas (#0A0A0B) with one elevated surface tone (#141416) for cards — never more than two surface steps. Hairline borders (1px, white at 8% opacity) instead of shadows; if a shadow is unavoidable use 0 1px 2px rgba(0,0,0,0.4) and nothing softer. Text in exactly three steps: white at 92% for headings, 60% for body, 40% for captions. Generous negative space — section padding at least 120px on desktop, 64px on mobile. The accent color appears only on interactive elements and one hero highlight, nowhere else.

Palette: a strict neutral ramp (white, #F5F5F5, #E5E5E5, #737373, #171717) carries the entire interface; pick one accent and use it only for primary CTAs, active states, and a single hero highlight. If the accent appears more than five times per viewport it stops being an accent. Keep semantic colors (success, error) desaturated so the accent stays in charge.
Typography: one geometric sans (a Futura/Poppins-class face) at three weights maximum (400/500/700). Scale: 64-88px hero, 32px section heads, 18px lede, 16px body, 13px caps labels with 0.08em tracking. Tight headline leading (1.05-1.1), relaxed body (1.6). Let the geometry carry the personality — no italics; weight and size do all hierarchy.
Motion: none. Zero scroll animations, zero entrance effects — the page is fully composed the instant it paints. Spend the motion budget on input feedback instead: 120-150ms ease-out color and transform transitions on hover and press states only. Hold this constraint absolutely; it is a statement, not an omission.

Spacing and responsive:
- Take section vertical padding verbatim from the neighboring sections' classes; grid gap one step below the page's section gap.
- Collapse 3 to 2 to 1 columns at the breakpoints the codebase already defines — no custom breakpoint values.

Before finishing, verify: git diff contains only the new files and the insertion edit, both neighboring sections render identically to before, no package was installed, cards hold equal height with the real copy in place, and heading levels continue the page's hierarchy without skips.
```

### Features 3 prompts

```
Add search for {{resource}} to this app end to end. Backend: a GET /search endpoint taking q, limit, and offset that uses {{database}} full-text search (tsvector with a GIN index in Postgres, or the configured engine's equivalent) rather than LIKE '%term%' table scans, escapes user input, and returns ranked results with a total count. Frontend: a search input with a 300ms debounce, cancellation of stale in-flight requests so a fast typist never sees older results overwrite newer ones, a loading indicator, an empty state that echoes the query, and keyboard navigation through results. Enforce a two character minimum on both client and server. Add a test for ranking (exact title match beats body match) and one for the debounce, then run everything and list the endpoints and components you touched.
```

Customize this prompt

Database

PostgreSQL MySQL SQLite MongoDB Supabase Firebase an in-memory store

Main resource / entity e.g. users, orders, posts

Your customized prompt Copy customized

```
Add search for users to this app end to end. Backend: a GET /search endpoint taking q, limit, and offset that uses PostgreSQL full-text search (tsvector with a GIN index in Postgres, or the configured engine's equivalent) rather than LIKE '%term%' table scans, escapes user input, and returns ranked results with a total count. Frontend: a search input with a 300ms debounce, cancellation of stale in-flight requests so a fast typist never sees older results overwrite newer ones, a loading indicator, an empty state that echoes the query, and keyboard navigation through results. Enforce a two character minimum on both client and server. Add a test for ranking (exact title match beats body match) and one for the debounce, then run everything and list the endpoints and components you touched.
```

#### Integrate an LLM chatbot

```
Integrate an LLM chatbot into this app behind a single POST /api/chat endpoint. Keep the provider API key server side, read it from an environment variable, and fail with a clear message at startup if it is missing rather than at the first request. Stream tokens to the client over server-sent events and render them incrementally in a chat panel component, with a stop button that aborts the fetch. Persist conversation history per session in {{database}} and send only the last ten messages as context. Put the system prompt in its own versioned file, prompts/chat-system.txt, not inline in code. Add one test that mocks the provider and asserts the endpoint streams and stores messages. Run lint and tests in the terminal, then list changed files with a one-line reason for each.
```

Customize this prompt

Database

PostgreSQL MySQL SQLite MongoDB Supabase Firebase an in-memory store

Your customized prompt Copy customized

```
Integrate an LLM chatbot into this app behind a single POST /api/chat endpoint. Keep the provider API key server side, read it from an environment variable, and fail with a clear message at startup if it is missing rather than at the first request. Stream tokens to the client over server-sent events and render them incrementally in a chat panel component, with a stop button that aborts the fetch. Persist conversation history per session in PostgreSQL and send only the last ten messages as context. Put the system prompt in its own versioned file, prompts/chat-system.txt, not inline in code. Add one test that mocks the provider and asserts the endpoint streams and stores messages. Run lint and tests in the terminal, then list changed files with a one-line reason for each.
```

#### Add email notifications

```
Add transactional email notifications to this app for three events: signup welcome, password reset, and a weekly summary of {{resource}} activity. Build a thin mailer module with one send function so the provider SDK is imported in exactly one file and stays swappable. Templates are code, not strings inside handlers: one file per email under emails/, each exporting a subject and HTML plus a plain text fallback. In development, send nothing, write each rendered email to .dev-mail/ as an HTML file I can open. Sending must be fire-and-forget from request handlers, a failed send may never fail the user's request, log it instead. The weekly summary runs from its own cron entry point script, not inside the web process. Add tests asserting each template renders with sample data. Run the tests, then list new files and every handler you modified.
```

### Frontend 3 prompts

#### Build a dashboard UI

```
Build a dashboard page in this codebase using the existing component library and styling approach; check for Tailwind, CSS modules, or styled-components before writing anything. Lay out a header with a date range picker, four stat cards showing {{resource}} metrics with a delta versus the previous period, one line chart, and a recent activity table with client-side sorting. Fetch data through a single typed hook per widget so each region renders independently with its own skeleton state, an error state with a retry button, and an empty state with real copy rather than a blank div. Collapse the grid to one column below 768px. Do not add a charting library if one is already installed. When done, start the dev server, verify there are no console errors, and list the components you added.
```

Customize this prompt

Main resource / entity e.g. users, orders, posts

Your customized prompt Copy customized

```
Build a dashboard page in this codebase using the existing component library and styling approach; check for Tailwind, CSS modules, or styled-components before writing anything. Lay out a header with a date range picker, four stat cards showing users metrics with a delta versus the previous period, one line chart, and a recent activity table with client-side sorting. Fetch data through a single typed hook per widget so each region renders independently with its own skeleton state, an error state with a retry button, and an empty state with real copy rather than a blank div. Collapse the grid to one column below 768px. Do not add a charting library if one is already installed. When done, start the dev server, verify there are no console errors, and list the components you added.
```

#### Build a landing page

```
Build a single landing page at the site root for {{resource}}. Structure: a hero with one headline, one subline, and one primary call to action, a three-item feature section, a short how-it-works list, and a footer with links. Pull colors and spacing from the existing Tailwind config or CSS variables in this repo, do not introduce a second design system. All copy must be real text I gave you or a clearly marked TODO comment, never lorem ipsum. Make it responsive down to 360px wide with the hero readable without scrolling on a laptop viewport. No carousel, no animation library, no cookie banner. Verify by running the production build in the terminal and confirming it exits with code zero and no errors or warnings in the build output, then show me the component tree you created as a list so I can review the diffs in order.
```

#### Build a pricing page

```
Build a pricing page at /pricing driven entirely by one config file, src/pricing.config.ts, so plan changes never touch markup. The config defines three tiers with name, monthly and annual prices, a feature list, and a call-to-action href, plus one tier flagged as highlighted. Render tier cards from that config with a monthly and annual toggle that swaps prices without layout shift, reserve width for the longest price string. Below the cards, generate a feature comparison table from the same config, with an accessible caption and proper th scope attributes. The highlighted tier gets its visual treatment from existing theme tokens in this repo, not new colors. No modal, no currency switcher, no fake countdown. Verify by editing one price in the config and confirming both the card and the table update, run the production build, and list the files you created.
```

### Refactor 2 prompts

#### Refactor a large component

```
Refactor the large component I point you at without changing its observable behavior. Start by listing its responsibilities; anything beyond rendering (data fetching, form state, derived calculations, event wiring) becomes a candidate for extraction. Pull data access into a custom hook, move pure logic into plain functions in a separate file so they are testable without a DOM, and split the JSX into child components only where a chunk has a clear name and owns its props. Keep prop drilling shallow; introduce context only when three or more levels pass the same value. Preserve the public props interface exactly so no call sites change. If tests exist, run them before and after and diff the results; if none exist, write a characterization test for the main render states first. Finish with a summary of extracted files and line counts before and after.
```

#### Migrate JavaScript to TypeScript

```
Migrate this repo from JavaScript to TypeScript incrementally, not in one pass. Start by adding tsconfig.json with allowJs true and strict false, wire the build so mixed JS and TS compiles, and commit that as the baseline. Then convert files in dependency order, leaf utilities first, entry points last, renaming to .ts or .tsx and typing exported function signatures fully while letting locals stay inferred. Never use any to silence an error, use unknown plus a narrowing check or a TODO type alias I can grep for. Do not change runtime behavior, if a refactor is tempting, leave a comment instead. After each batch of about ten files, run tsc --noEmit and the test suite in the terminal and stop if either fails. Finish by flipping strict to true and reporting every remaining error grouped by file.
```

### Testing 2 prompts

#### Write unit tests

```
Write unit tests for the module I have open, or ask me which file if nothing is selected. First read the module and its imports to map every branch: happy paths, error paths, boundary values, and early returns. Use the test runner already configured in this repo and match its existing describe and naming conventions. Mock only true externals such as network, clock, and filesystem; do not mock the module under test or pure helpers it calls. Cover at minimum each public function, one edge case per conditional (empty input, null, zero, largest allowed value), and thrown errors asserted by type and message. Avoid snapshot tests for logic. Run the suite with coverage, report uncovered lines, and add cases until every branch of the public API is exercised or you explain why a line is unreachable.
```

#### Write end-to-end tests

```
Write end-to-end tests for the critical paths of this app using Playwright. First read the routing and the auth flow, then propose the flows before writing any code. I expect signup, login, the primary create flow for {{resource}}, and logout at minimum. Put specs in e2e/, one file per flow, using data-testid selectors, and add those attributes to components where stable selectors are missing, never select on text or CSS classes. Seed and clean test data through the app's own API in beforeEach, not direct database writes. Each spec must pass headless and leave no residue rows. Add a fixture for an authenticated context so login runs once, not per test. Run the whole suite from the integrated terminal, paste the summary output, and list every component you touched to add test ids so I can check nothing user-visible changed.
```

Customize this prompt

Main resource / entity e.g. users, orders, posts

Your customized prompt Copy customized

```
Write end-to-end tests for the critical paths of this app using Playwright. First read the routing and the auth flow, then propose the flows before writing any code. I expect signup, login, the primary create flow for users, and logout at minimum. Put specs in e2e/, one file per flow, using data-testid selectors, and add those attributes to components where stable selectors are missing, never select on text or CSS classes. Seed and clean test data through the app's own API in beforeEach, not direct database writes. Each spec must pass headless and leave no residue rows. Add a fixture for an authenticated context so login runs once, not per test. Run the whole suite from the integrated terminal, paste the summary output, and list every component you touched to add test ids so I can check nothing user-visible changed.
```

## Prompting patterns that work in Cursor

### Scope with @ mentions

Attach the exact files and folders the task touches with @file and @folder before you describe the change. The agent reads what you attach first, so scoping cuts wrong guesses about where code lives. For repo-wide questions, skip the mentions and tell it to search instead.

### Plan, then execute

For multi-file work, end your prompt with "propose a plan and wait for my approval before editing." You catch bad architecture at the plan stage, where it costs one message to fix instead of a pile of rejected diffs.

### Verification clause

Finish every agent prompt with how to prove the change works: run the tests, run the type checker, start the server and hit the endpoint. Cursor can execute commands, and asking it to verify turns a plausible diff into a checked one.

### Rules over repetition

Move any instruction you have typed twice into a .cursor/rules file. Conventions such as naming, error handling style, or forbidden libraries then apply to every request without eating prompt space, and teammates inherit them through the repo.

## Common mistakes

### Prompting without context attached

Asking "fix the auth bug" with nothing attached forces Cursor to guess from a semantic search, and it often picks the wrong module. Attach the failing test or the suspect file, or paste the stack trace so the agent has an anchor.

### Accepting diffs without reading them

Agent mode can touch a dozen files in one pass, and a plausible-looking run sometimes rewrites code it should not. Review the diff per file, and keep the working tree clean before big requests so git diff shows exactly what changed.

### One giant prompt for a whole feature

A 500-word prompt covering schema, API, UI, and tests overloads a single agent run, and the later items get shallow treatment. Split the feature into sequenced requests, each with its own verification step, and feed the output of one into the next.