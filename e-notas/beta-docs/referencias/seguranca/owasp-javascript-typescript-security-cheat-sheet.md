# JavaScript and TypeScript Security Cheat Sheet (OWASP)

Source: https://cheatsheetseries.owasp.org/cheatsheets/JavaScript_and_TypeScript_Security_Cheat_Sheet.html
Downloaded: 2026-11-08

## Introduction
Secure practices for JS/TS everywhere (browsers, hybrid, Node). Language-level pitfalls here; backend/runtime hardening stays in the Node.js Security Cheat Sheet.

## Highlights for agent rules
- Never build code from strings (`eval`, `new Function`, string `setTimeout`); use `JSON.parse`; lint `no-eval` / `no-implied-eval` / `no-new-func`
- Avoid ReDoS: linear patterns, cap untrusted input length
- Prefer strict mode / ES modules
- Prototype pollution: reject `__proto__`/`constructor`/`prototype`; prefer `Map` or `Object.create(null)`; schema-validate untrusted data
- DOM: prefer `textContent`/`createElement`; sanitize if HTML required; never feed untrusted data to React `dangerouslySetInnerHTML` / Vue `v-html` / Angular bypasses
- Async: handle rejections; don’t empty-catch
- `postMessage`: verify origin/source; never `targetOrigin: "*"` for sensitive data
- TypeScript: `any` is a hole; validate at trust boundaries with runtime schemas; enable `strict`
- Lockfiles + dependency advisories; SRI for CDN scripts

See also: Node.js Security Cheat Sheet for server/runtime controls.
