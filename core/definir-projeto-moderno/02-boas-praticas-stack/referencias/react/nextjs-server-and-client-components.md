source_url: https://nextjs.org/docs/app/getting-started/server-and-client-components

# Server and Client Components (Next.js App Router)

By default, layouts and pages are Server Components, which lets you fetch data and render parts of your UI on the server, optionally cache the result, and stream it to the client. When you need interactivity or browser APIs, you can use Client Components to layer in functionality.

## When to use Server and Client Components?

Use **Client Components** when you need:

- State and event handlers. E.g. `onClick`, `onChange`.
- Lifecycle logic. E.g. `useEffect`.
- Browser-only APIs. E.g. `localStorage`, `window`, `navigator.geolocation`, etc.
- Custom hooks.

Use **Server Components** when you need:

- Fetch data from databases or APIs close to the source.
- Use API keys, tokens, and other secrets without exposing them to the client.
- Reduce the amount of JavaScript sent to the browser.
- Improve the First Contentful Paint (FCP), and stream content progressively to the client.

## How do Server and Client Components work in Next.js?

### On the server

- Server Components are rendered into a special data format called the React Server Component Payload (RSC Payload).
- Client Components and the RSC Payload are used to prerender HTML.

The RSC Payload contains:

- The rendered result of Server Components
- Placeholders for where Client Components should be rendered and references to their JavaScript files
- Any props passed from a Server Component to a Client Component

### On the client (first load)

1. HTML is used to immediately show a fast non-interactive preview of the route to the user.
2. RSC Payload is used to reconcile the Client and Server Component trees.
3. JavaScript is used to hydrate Client Components and make the application interactive.

### Subsequent Navigations

- The RSC Payload is prefetched and cached for instant navigation.
- Client Components are rendered entirely on the client, without the server-rendered HTML.

## Using Client Components

Add `"use client"` at the top of the file, above imports. Once a file is marked with `"use client"`, all of its imports and the components it directly renders are included in the client bundle. You don't need to add the directive to every client-intended component.

This does **not** apply to Server Components passed as children or other props — those are rendered on the server and passed as rendered output.

## Reducing JS bundle size

Add `'use client'` at the top of files that define interactive components instead of marking large parts of UI as Client Components. Keep layouts as Server Components; push interactivity to leaf Client Components (e.g. Search).

## Passing data from Server to Client Components

Pass data via props. Props must be serializable by React. Alternatively, stream data with the `use` API.

## Interleaving Server and Client Components

Pass Server Components as a prop (commonly `children`) to a Client Component. Parent Server Component renders both; Client Component never imports the Server Component module.

## Context providers

React context is not supported in Server Components. Create a Client Component provider that accepts `children`, then import it into a Server Component layout. Render providers as deep as possible in the tree.

## Third-party components

If a third-party component uses client-only features but lacks `"use client"`, wrap it in your own Client Component file. Library authors should add `"use client"` to client entry points.

## Preventing environment poisoning

Use `import 'server-only'` in modules with secrets/API keys so accidental Client Component imports fail at build time. Use `client-only` for window/DOM-only modules. Only `NEXT_PUBLIC_` env vars are included in the client bundle.
