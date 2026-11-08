source_url: https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns

# Server and Client Composition Patterns (Next.js)

When building React applications, you will need to consider what parts of your application should be rendered on the server or the client. This page covers recommended composition patterns when using Server and Client Components.

## When to use Server and Client Components?

| What do you need to do? | Server Component | Client Component |
| --- | --- | --- |
| Fetch data | ✓ | ✗ |
| Access backend resources (directly) | ✓ | ✗ |
| Keep sensitive information on the server (access tokens, API keys, etc) | ✓ | ✗ |
| Keep large dependencies on the server / Reduce client-side JavaScript | ✓ | ✗ |
| Add interactivity and event listeners (`onClick()`, `onChange()`, etc) | ✗ | ✓ |
| Use State and Lifecycle Effects (`useState()`, `useReducer()`, `useEffect()`, etc) | ✗ | ✓ |
| Use browser-only APIs | ✗ | ✓ |
| Use custom hooks that depend on state, effects, or browser-only APIs | ✗ | ✓ |
| Use React Class components | ✗ | ✓ |

## Server Component Patterns

### Sharing data between components

Instead of React Context (not available on the server) or prop-drilling shared server data, use `fetch` or React's `cache` function in each component that needs the data. React extends `fetch` to automatically memoize requests; `cache` covers non-fetch sources.

### Keeping Server-only Code out of the Client Environment

Use `import 'server-only'` in modules with secrets so Client Component imports fail at build time. Pair with `client-only` for browser-only modules.

### Third-party packages and providers

Wrap third-party client-only components missing `"use client"` in your own Client Component. Context providers must live in Client Components; render them as deep as possible wrapping `{children}` only.

## Client Components

### Moving Client Components Down the Tree

To reduce the Client JavaScript bundle size, move Client Components down the tree. Keep Layout as Server Component; extract interactive SearchBar as Client Component.

### Passing props from Server to Client (Serialization)

Props must be serializable. For non-serializable client needs, fetch on the client or via a Route Handler.

## Interleaving Server and Client Components

- Unsupported: importing a Server Component into a Client Component module.
- Supported: pass Server Components as `children`/props from a parent Server Component into a Client Component "slot".
- During a request, code moves server → client; accessing server resources from the client requires a new request.
- All Server Components render first (including those nested via children slots); RSC Payload holds Client Component placeholders; client reconciles the tree.
