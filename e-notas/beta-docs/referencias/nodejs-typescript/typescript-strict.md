---
source_url: https://www.typescriptlang.org/tsconfig/strict.html
fetched_at: 2026-11-08
title: "TypeScript: TSConfig Option: strict"
---

# strict

The `strict` flag enables a wide range of type checking behavior that results in stronger guarantees of program correctness. Turning this on is equivalent to enabling **all of the strict mode family options**. You can then turn off individual strict mode family checks as needed.

Future versions of TypeScript may introduce additional stricter checking under this flag, so upgrades of TypeScript might result in new type errors in your program. When appropriate and possible, a corresponding flag will be added to disable that behavior.

Strict family (enabled by `strict: true`) includes at minimum:

- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noImplicitThis`
- `alwaysStrict`
- `useUnknownInCatchVariables` (newer TS versions)
