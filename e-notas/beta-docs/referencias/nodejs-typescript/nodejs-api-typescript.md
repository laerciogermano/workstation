---
source_url: https://nodejs.org/api/typescript.html
fetched_at: 2026-11-08
title: "Modules: TypeScript | Node.js Documentation"
---

# Modules: TypeScript

Stability: 2 - Stable

## Enabling

There are two ways to enable runtime TypeScript support in Node.js:

1. For full support of all of TypeScript's syntax and features, including using any version of TypeScript, use a third-party package.
2. For lightweight support, you can use the built-in support for type stripping.

## Full TypeScript support

Use a third-party package such as `tsx`:

```bash
npm install --save-dev tsx
npx tsx your-file.ts
# or
node --import=tsx your-file.ts
```

## Type stripping

By default Node.js will execute TypeScript files that contain only erasable TypeScript syntax. Node.js will replace TypeScript syntax with whitespace, and **no type checking is performed**. To disable this feature, use `--no-strip-types`.

Node.js ignores `tsconfig.json` files. Features that depend on tsconfig settings (paths, downleveling) are intentionally unsupported.

Recommended TypeScript 5.8+ `tsconfig.json` for type stripping:

```json
{
  "compilerOptions": {
    "noEmit": true,
    "target": "esnext",
    "module": "nodenext",
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true
  }
}
```

### Determining module system

- `.ts` files follow the same module system rules as `.js` (use `"type": "module"` for ESM).
- `.mts` always ESM; `.cts` always CommonJS; `.tsx` unsupported.
- File extensions are mandatory in `import` / `require` for TypeScript files.

### Unsupported TypeScript features under type stripping

Features that require JS code generation error:

- `enum` declarations
- `namespace` with runtime code
- parameter properties
- import aliases
- Decorators (not transformed; Stage 3)

Type-only namespaces are supported. Use `import type` / inline `type` imports with `verbatimModuleSyntax`.

### Other constraints

- Type stripping in `node_modules` is refused (discourages publishing raw TS packages).
- `tsconfig` path aliases are not transformed (use `#` subpath imports).
- Source maps are unnecessary because types are replaced with whitespace.
