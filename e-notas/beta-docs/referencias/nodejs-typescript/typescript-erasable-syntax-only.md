---
source_url: https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html
fetched_at: 2026-11-08
title: "TypeScript: TSConfig Option: erasableSyntaxOnly"
---

# erasableSyntaxOnly

Node.js can run TypeScript via type stripping, but only erasable syntax (no runtime semantics) is supported.

Unsupported constructs:

- `enum` declarations
- `namespace` / `module` with runtime code
- parameter properties in classes
- Non-ECMAScript `import =` / `export =`
- `<Type>`-style type assertions

`--erasableSyntaxOnly` makes TypeScript error on most TS constructs with runtime behavior.

Typically combine with `--verbatimModuleSyntax` so imports are not elided and match Node runtime behavior.
