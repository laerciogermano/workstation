# Beyond Gherkin: ADR, SHALL, OpenAPI, and the rest of the specs pack

Source: https://suherman.net/articles/beyond-gherkin-adr-shall-openapi
Date: 5 Oct 2026
Downloaded: 2026-11-08

## Layered specs pack

- Product story (`specs/product`) — who, in/out of scope, demo journey
- SHALL requirements (`specs/requirements`) — durable product rules with IDs
- Domain notes (`specs/domain`) — vocabulary
- OpenAPI (`specs/api/openapi.yaml`) — HTTP shapes (language-neutral)
- ADRs (`specs/adr`) — why architecture choices so agents do not “improve” them away
- Gherkin (`specs/acceptance`) — executable Given/When/Then proving SHALLs
- Regeneration (`specs/regeneration`) — prompts to rebuild apps/ from the contract

## Roles
- ADR = why the architecture looks like this
- Gherkin = how we prove a user/API behaviour
- SHALL = the product rule both serve
- OpenAPI/FormSpec = shared shapes that are not scenarios

Keep ADRs short: Decision / Why / Consequences.

Bottom line: Gherkin is proof; ADR is guardrail; SHALL is product truth; OpenAPI is shared shape.
