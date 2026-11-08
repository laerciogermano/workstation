---
source_url: https://nodejs.org/learn/typescript/run-natively
fetched_at: 2026-11-08
title: "Running TypeScript Natively | Node.js Learn"
---

# Running TypeScript Natively

You can write code that's valid TypeScript directly in Node.js without the need to transpile it first.

Node.js runs TypeScript through a lightweight process called **type stripping**. It removes erasable TypeScript syntax, such as type annotations and interfaces, then runs the remaining JavaScript.

If you are using v22.18.0 or later and your source code contains only erasable TypeScript syntax:

```bash
node example.ts
```

Older versions: `node --experimental-strip-types example.ts`.

**Node.js does not type check** your code when it runs TypeScript files. Use the TypeScript compiler separately:

```bash
npx tsc --noEmit
```

## Constraints

### Type stripping

Works for erasable syntax only: type annotations, interfaces, type aliases, `import type`.

Not handled alone: `enum`, parameter properties, namespaces with runtime code, import aliases. Use a runner or separate transpilation for those.

### Type checking

Running `.ts` with `node` ≠ running `tsc`. Common setup: Node for quick feedback; `tsc --noEmit` in CI for type checking.

### Configuration

Amaro (Node TypeScript loader) does not use `tsconfig.json`. Configure editor/`tsc` to reflect Node behavior; TypeScript 5.7+ recommended.
