---
name: prd
description: Create a concise product requirements document or specification from conversation and repository evidence. Use when the user asks for a PRD, feature definition, product spec, or product-and-engineering plan before implementation breakdown.
---

# PRD

Turn settled direction into a concise product contract that can govern implementation.

- **Synthesize:** Preserve settled decisions from the conversation. Inspect current behavior, docs, code, and tests as needed to replace assumptions with evidence and use the project's language.
- **Ground:** Define the actual user and problem. Trace each key journey from trigger or root cause through product state and experience to a successful next or recovery action.
- **Decide:** State the desired outcome, scope, non-goals, proposed behavior, and important tradeoffs. Distinguish facts, decisions, assumptions, and unresolved questions.
- **Shape:** Identify existing public interfaces, ownership seams, sequencing constraints, and risky assumptions. Reuse existing concepts and states; add new ones only when real journeys require them.
- **Prove:** Write acceptance criteria as observable user or system behavior. Define validation through relevant public interfaces and real product journeys.
- **Resolve:** Ask only when a missing decision would materially change the PRD. Ask one concise question at a time with a recommended answer.
- **Confirm:** Review the proposed shape and key decisions with the user before saving it.
- **Record:** Preserve an existing local PRD format; otherwise use the contract below in the repository's natural specifications location.

## PRD Contract

- **Problem and user:** Who is affected, what happens today, and why it matters
- **Outcome:** What should become true
- **Current journeys:** Real triggers, states, experiences, and recovery paths
- **Proposed behavior:** The product experience and system response
- **Scope and decisions:** In scope, out of scope, tradeoffs, and governing decisions
- **Engineering shape:** Existing seams, sequencing constraints, risks, and assumptions
- **Acceptance and proof:** Observable completion criteria and validation
- **Open decisions:** Only questions that block a reliable implementation plan

Stop before implementation decomposition. The PRD is ready when another agent or collaborator can plan the next tranche without reopening product direction.
