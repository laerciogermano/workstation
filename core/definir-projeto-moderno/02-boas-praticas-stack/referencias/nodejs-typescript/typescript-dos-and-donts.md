---
source_url: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
fetched_at: 2026-11-08
title: "TypeScript: Documentation - Do's and Don'ts"
---

# Do's and Don'ts

## General Types

- ❌ Don’t use `Number`, `String`, `Boolean`, `Symbol`, or `Object` (boxed object types)
- ✅ Do use `number`, `string`, `boolean`, `symbol`; use non-primitive `object` instead of `Object`
- ❌ Don’t have a generic type that doesn’t use its type parameter
- ❌ Don’t use `any` except during JS→TS migration; prefer `unknown` when type is truly unknown

## Callback Types

- ❌ Don’t use return type `any` for ignored callback returns → ✅ use `void`
- ❌ Don’t make callback parameters optional unless truly optional
- ❌ Don’t write separate overloads that differ only on callback arity

## Function Overloads

- Put more specific overloads before more general ones
- Prefer optional parameters over overload explosion when return types match
- Prefer union types over overloads that differ by type in one argument position
