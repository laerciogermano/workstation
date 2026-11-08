# React frontend best practices (2024–2026 / React 19 · RSC era)

Local mirrors: `e-notas/beta-docs/referencias/react/` (each file starts with `source_url:`).

## What are React.dev official recommendations for Server Components?

### Takeaway
Server Components are the default RSC unit: they render ahead of time (build or request), never ship their source to the browser, may be `async`/`await`, and gain interactivity only by composing Client Components marked with `'use client'` — not `'use server'`.

### Cited Findings
- Server Components render ahead of time, before bundling, in an environment separate from the client app or SSR server; they can run once at build time or per request on a web server. — [react.dev Server Components](https://react.dev/reference/rsc/server-components)
- RSC in React 19 is stable for app authors; bundler/framework implementation APIs do **not** follow semver and may break between 19.x minors — pin versions or use Canary if implementing a framework. — [react.dev Server Components](https://react.dev/reference/rsc/server-components)
- Prefer Server Components for static/expensive work (e.g. markdown parse libraries) so those deps stay off the client bundle and content is available on first paint instead of post-`useEffect` waterfalls. — [react.dev Server Components](https://react.dev/reference/rsc/server-components)
- With a server, Server Components can access the data layer directly (DB/FS) without building a public API, then pass data/JSX as props to Client Components. — [react.dev Server Components](https://react.dev/reference/rsc/server-components)
- There is **no** directive for Server Components; `'use server'` marks Server Functions/Actions, not SC modules. Client boundaries use `'use client'`. — [react.dev Server Components](https://react.dev/reference/rsc/server-components); [Directives](https://react.dev/reference/rsc/directives)
- Server Components cannot use interactive APIs like `useState`; compose with Client Components for events/state. — [react.dev Server Components](https://react.dev/reference/rsc/server-components); [`'use client'`](https://react.dev/reference/rsc/use-client)
- Server Components cannot *create* context, but can render a Client-exported context provider and pass server-fetched values. — [react.dev Server Components](https://react.dev/reference/rsc/server-components)
- Async Server Components may `await` during render; start lower-priority promises on the server and unwrap on the client with `use` + `Suspense` so critical content is not blocked. — [react.dev Server Components](https://react.dev/reference/rsc/server-components); [`use`](https://react.dev/reference/react/use)
- Props from Server → Client must be serializable (primitives, plain objects/arrays/Maps/Sets, Date, JSX, Promises, Server Functions); ordinary client functions/classes/instances are rejected. — [`'use client'`](https://react.dev/reference/rsc/use-client)
- RFC 0188: Server Components have zero bundle impact, access server data sources, integrate with Client Components, can dynamically choose which Client Components to download, preserve client state across SC refetch, and stream progressively with Suspense. Filename `.server.js`/`.client.js` was replaced by `'use client'`; native async/await was added. — [RFC 0188](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- React Labs (2023): RSC RFC merged; consensus on `"use client"`; async/await is primary server data-fetching model; Server Actions enable client→server mutations and progressively enhanced forms. — [React Labs March 2023](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023)

### Inferences
- Agents should default every new module to Server Component semantics and only add `'use client'` at the interactive leaf boundary.
- Prefer “await critical data on server; pass Promise + `use` for below-the-fold” over client `useEffect` fetch for initial page data.
- Treat `'use server'` exclusively as Server Action/Function marking; never as “this file is a Server Component.”

### Gaps
- React.dev does not publish a single consolidated “production checklist” equivalent to Next.js’s; production ops guidance is framework-owned.
- Exact bundler API surface for DIY RSC hosts remains intentionally unstable in React 19.x — no durable agent-facing DIY checklist beyond “use a compatible framework.”

## What Next.js docs are the practical market standard even for SPA-ish apps?

### Takeaway
Even for SPA-ish products, Next.js App Router docs are the de-facto operational standard for RSC composition, data fetching, caching/streaming, and go-live checks — Server Components by default, `'use client'` pushed to leaves, fetch on the server, and follow the production checklist.

### Cited Findings
- Layouts and pages are Server Components by default; use Client Components when you need state/events/`useEffect`/browser APIs/custom hooks. — [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- Use Server Components to fetch near the source, keep secrets server-side, shrink JS, improve FCP, and stream progressively. — [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- Rendering pipeline: SC → RSC Payload; Client Components + payload prerender HTML; first load = HTML preview → reconcile with RSC Payload → hydrate Client Components; subsequent navigations prefetch/cache RSC Payload. — [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- Place `'use client'` only on interactive entry files; keep layouts server-side; pass Server Components as `children`/slots into Client wrappers (do not import SC into Client modules). — [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components); [Composition patterns (v14)](https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns)
- Composition matrix: data/backends/secrets/large deps → Server; events/state/effects/browser APIs/class components → Client. — [Composition patterns](https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns)
- Share server data via memoized `fetch` / React `cache`, not Context (Context unsupported in SC). Mark secret modules with `server-only`. — [Composition patterns](https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns); [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- Render context providers as Client Components wrapping `{children}` as deep as possible so static SC siblings stay optimizable. — [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- Automatic defaults: Server Components, route-segment code-splitting, Link prefetch, prerender/cache. — [Production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- Data fetching checklist: fetch in Server Components; Route Handlers for Client→backend (do **not** call Route Handlers from Server Components); Streaming via `loading.tsx`/`Suspense`; parallel fetches; verify caching including non-`fetch` sources. — [Production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- Before ship: `next build` + `next start`; Lighthouse + field Core Web Vitals; `@next/bundle-analyzer`; eslint-plugin-jsx-a11y; Image/Font/Script modules; Metadata API; CSP; taint sensitive data; authz inside every Server Action (not only layout/proxy). — [Production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- React recommends full-stack frameworks (Next App Router called out historically) for RSC rather than hand-rolling Effects for data. — [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect); [Creating a React App](https://react.dev/learn/creating-a-react-app)

### Inferences
- For SPA-ish apps on Next: still keep pages/layouts as Server Components; only islands of client state — treat “SPA” as interaction density, not as “everything `'use client'`.”
- Agents should treat the production checklist as mandatory PR/release gate language (boundaries, caching, a11y lint, secrets, CWV).
- Composition “slot/children” pattern is the required way to nest server-fetched UI inside interactive shells.

### Gaps
- Current App Router docs fold many older “composition patterns” into getting-started; the richest matrix table still lives on the v14 URL — agents should prefer current getting-started + production checklist, and use v14 composition page as supplemental matrix.
- Next.js caching semantics have evolved (Cache Components / dynamic APIs); checklist text notes wrapping request-time APIs in Suspense — exact default cache behavior must be re-checked against the installed Next major when implementing.

## Accessibility, state management boundaries, and testing practices that agents must follow?

### Takeaway
Keep UI state minimal and derived during render; use Effects only to sync external systems; put interactivity behind Client boundaries; ship accessible HTML (`useId`, valid `aria-*`, labels); test with React Testing Library via role/label queries so a11y failures surface as test failures.

### Cited Findings
- Thinking in React: build a static component tree with props first; reserve state for interactive data that changes over time; identify minimal complete state; lift state so data flows down explicitly. — [Thinking in React](https://react.dev/learn/thinking-in-react)
- Escape hatches (refs/Effects) connect to systems outside React; most app logic should not depend on them. — [Escape Hatches](https://react.dev/learn/escape-hatches)
- You don’t need Effects to transform data for rendering or to handle user events; calculate during render; put event-caused work in event handlers; frameworks provide better data fetching than ad-hoc Effects. — [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- Choosing state structure: avoid redundant state; if it can be computed from props/state, don’t store it. — [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure); [Managing State](https://react.dev/learn/managing-state)
- Client boundary rule: `'use client'` creates a module-graph boundary; transitive imports become client code; Server Components can pass JSX children into Client Components without importing those modules into the client graph. — [`'use client'`](https://react.dev/reference/rsc/use-client)
- Next/React boundary for global UI state: Context lives in Client providers; server-fetched values can seed providers from SC parents. — [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- Accessibility: React supports `aria-*` with the same names as HTML; invalid ARIA props warn against the WAI-ARIA spec; prefer correct spelling (`aria-labelledby`, `role` not `aria-role`). — [Common components](https://react.dev/reference/react-dom/components/common); [invalid-aria-prop](https://react.dev/warnings/invalid-aria-prop)
- Use `useId` to generate unique IDs for accessibility relationships (e.g. `aria-describedby`) across component instances. — [`useId`](https://react.dev/reference/react/useId)
- Production a11y: enable `eslint-plugin-jsx-a11y`; provide accessible `global-error` / `global-not-found` UI. — [Production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- Testing Library guiding principle: “The more your tests resemble the way your software is used, the more confidence they can give you.” Query DOM nodes, not component instances. — [Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- Query priority for agents: `getByRole` (+ accessible name) → `getByLabelText` → placeholder/text/displayValue → alt/title → `getByTestId` last. If `getByRole` can’t find it, the UI may be inaccessible. — [About Queries](https://testing-library.com/docs/queries/about/)
- Legacy React docs recommended Jest + React Testing Library specifically because RTL nudges toward accessibility best practices. — [legacy.reactjs.org Testing](https://legacy.reactjs.org/docs/testing.html)

### Inferences
- Agent coding rules: (1) no `'use client'` until hooks/events/browser APIs require it; (2) no `useEffect` for derived state or click-driven mutations; (3) tests assert via `getByRole`/`getByLabelText`; (4) every control has an accessible name; (5) Server Actions/auth checks are per-action, not layout-only.
- State management libraries (Redux/Zustand/etc.) belong behind Client boundaries; server data should stay in SC/`cache`/DAL unless the UX truly needs client cache.

### Gaps
- react.dev no longer hosts a dedicated top-level “Accessibility” guide comparable to older React docs; a11y guidance is scattered across `useId`, DOM attribute docs, warnings, conferences, and Next’s eslint/production pages.
- Official React 19 docs do not prescribe a single global client state library; choice beyond Context + server data is ecosystem opinion, not a React canon finding.
- End-to-end testing strategy (Playwright/Cypress) is acknowledged as valuable in legacy React testing docs but left out of scope there — no single React.dev E2E standard for agents.
