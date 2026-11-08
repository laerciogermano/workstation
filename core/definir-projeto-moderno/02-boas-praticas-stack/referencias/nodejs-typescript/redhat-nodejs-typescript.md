---
source_url: https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/development/typescript.md
fetched_at: 2026-11-08
title: "TypeScript · Node.js Reference Architecture"
---

# Typescript

TypeScript brings compile-time error detection, editor help, and safer refactoring. It does **not** provide runtime type checking — validate data with libraries such as **ajv**.

## Transpilers

Recommend `tsc` for Node (type check + emit). Avoid Babel-only TypeScript for Node (no type checking). Avoid mixing transpilers. Jest may default to Babel — watch for unintentional mixes.

## Development

`tsc -w` + nodemon/concurrently for restart. If Babel is used, run `tsc --noEmit` periodically / pre-push.

## Ship JavaScript not TypeScript for deployment

1. Type errors caught before deploy
2. Faster startup (no transpile)
3. Smaller containers (no transpiler)

## Recommended configuration

Use [tsconfig/bases](https://github.com/tsconfig/bases/) for Node targets.

```json
{
  "compilerOptions": {
    "isolatedModules": true,
    "strict": true,
    "esModuleInterop": true
  }
}
```

Hierarchical configs via npm-published base `extends`. Publish `.d.ts` for libraries (`declaration: true` + `types` in package.json).
