source_url: https://react.dev/reference/rsc/directives

---
title: Directives
---

Directives are for use in React Server Components.

Directives provide instructions to bundlers compatible with React Server Components.

## Source code directives

* `'use client'` lets you mark what code runs on the client.
* `'use server'` marks server-side functions that can be called from client-side code.

Important: There is **no** directive for Server Components. Server Components are the default. `'use server'` is for Server Functions / Server Actions, not for marking Server Components.
