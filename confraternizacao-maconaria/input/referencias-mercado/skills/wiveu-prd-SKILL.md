---
name: prd
description: "Create detailed Product Requirements Documents through structured interviews. Use when the user wants to create a PRD, spec, product specification, technical requirements document, or app/feature specification. Also triggers on phrases like 'help me spec out', 'document the requirements for', 'write up the product spec', or 'I need a PRD for'. The skill guides the user through targeted questions to extract enough detail for a production-grade PRD — covering problem, users, features, architecture, data models, monetization, risks, and milestones. Works for mobile apps, web apps, SaaS products, APIs, and internal tools."
---

# PRD Creation Skill

Create production-grade Product Requirements Documents through structured discovery interviews.

## Philosophy

A good PRD is not a wish list — it's a decision log. Every section answers a specific question that will come up during development. The goal is to surface ambiguity early so the team doesn't discover it mid-sprint.

This skill uses an **interview-driven approach**: Claude asks targeted questions, synthesizes answers, and iteratively builds the document. The user shouldn't need to know PRD structure — Claude extracts what's needed through conversation.

## When to Use This Skill

- User asks for a "PRD", "product spec", "requirements doc", or "feature specification"
- User says "help me spec out [product idea]" or "document the requirements for [feature]"
- User has a product concept and needs to formalize it before development
- User wants to turn a rough idea into a structured, actionable document

## Workflow Overview

```
1. Kickoff → Understand the product at a high level
2. Discovery Interview → Deep dive into each PRD section via questions
3. Synthesis → Draft sections as answers accumulate
4. Review → Present draft, gather feedback, refine
5. Finalize → Produce the complete PRD document
```

The interview is **adaptive** — skip sections that don't apply (e.g., monetization for internal tools), go deeper on complex areas (e.g., data architecture for a sync-heavy app).

---

## Phase 1: Kickoff

Start by understanding what the user is building. Ask these questions conversationally (not as a checklist dump):

**Essential kickoff questions:**
1. What are you building? (one sentence)
2. What problem does it solve? Who has this problem?
3. What platforms? (iOS, Android, web, API, CLI, etc.)
4. Is this a new product or a feature for an existing product?
5. What's the timeline pressure? (hackathon, MVP, production-grade)

Based on answers, determine:
- **Scope**: Full product PRD vs. feature spec vs. technical design doc
- **Depth**: Quick spec (2-3 pages) vs. comprehensive PRD (10+ pages)
- **Focus areas**: Which sections need deep dives vs. which can be brief

Tell the user: "I'll ask you questions across [N] areas to build out the PRD. Feel free to say 'skip' or 'I don't know yet' — we can leave placeholders. Ready?"

---

## Phase 2: Discovery Interview

Work through each section systematically. For each area, ask 2-4 targeted questions, wait for answers, then move to the next area. Don't dump all questions at once.

### 2.1 Problem & Users

**Questions to ask:**
- What's the core pain point? What are users doing today without your product?
- Who is the primary user? (Be specific: "mobile-first millennials" not "everyone")
- Is there a secondary user type?
- What existing solutions do users try? Why do those fall short?

**What you're extracting:**
- Problem statement (1-2 sentences, concrete)
- Primary persona (role, context, goal)
- Secondary persona (if applicable)
- Competitive landscape (what exists, why it's insufficient)

### 2.2 Core Value Proposition

**Questions to ask:**
- In one sentence, what does your product do that nothing else does?
- What's the "aha moment" — when does a user first feel the value?
- If users could only use one feature, which would it be?

**What you're extracting:**
- Differentiator (the hook)
- Core mechanic (the fundamental interaction loop)
- Success moment (what does "working" look like for the user)

### 2.3 Feature Set

**Questions to ask:**
- What are the 3-5 things users MUST be able to do in v1?
- What features are you explicitly NOT building in v1? (Scope control)
- Are there different tiers of access? (Free/premium, roles, permissions)
- Any features that require specific hardware or OS capabilities?

**What you're extracting:**
- Must-have features (prioritized list with brief descriptions)
- Out of scope (explicit exclusions)
- Feature gating (what's free vs. paid, what's role-restricted)
- Platform dependencies (sensors, APIs, permissions)

### 2.4 User Flows

**Questions to ask:**
- Walk me through first-time setup. What does the user see/do?
- Walk me through the primary use case. Step by step.
- What happens when something goes wrong? (Error states, edge cases)
- Are there any secondary flows that are critical?

**What you're extracting:**
- Onboarding flow (step by step)
- Core loop (the repeated action pattern)
- Error handling philosophy
- Secondary flows (if critical)

### 2.5 Platform & Architecture

**Questions to ask:**
- What's your tech stack? (Or what are you leaning toward?)
- Does data need to sync across devices? How?
- Does the app work offline? What happens when connectivity returns?
- Any third-party services or APIs you'll depend on?
- What's your baseline device/OS target?

**What you're extracting:**
- Tech stack (languages, frameworks, packages)
- Sync strategy (local-first, cloud-first, hybrid)
- Offline behavior (what works, what doesn't)
- External dependencies (APIs, SDKs, services)
- Minimum targets (OS versions, device tiers)

### 2.6 Data Model

**Questions to ask:**
- What are the main "things" in your app? (Users, posts, orders, etc.)
- For each thing: what are the key fields? What relationships exist?
- What data is user-generated vs. system-generated?
- Any sensitive data that needs special handling?

**What you're extracting:**
- Entity list (record types with key fields)
- Relationships (one-to-many, many-to-many, etc.)
- Data ownership (who can create/read/update/delete)
- Sensitive data notes (PII, health data, financial data)

### 2.7 Monetization (if applicable)

**Questions to ask:**
- How will this make money? (Subscription, one-time, ads, freemium, enterprise)
- What's free vs. paid?
- Any specific price points in mind?
- Where does the paywall appear in the user experience?

**What you're extracting:**
- Business model (subscription tiers, pricing)
- Free vs. premium feature split
- Paywall placement (soft vs. hard, contextual triggers)
- Payment infrastructure (Stripe, RevenueCat, App Store IAP, etc.)

### 2.8 Design & UX Guidelines

**Questions to ask:**
- Any design inspiration? (Apps you want it to feel like)
- Platform conventions to follow? (Material Design, Apple HIG, custom)
- Any specific interaction patterns that are critical?
- Accessibility requirements?

**What you're extracting:**
- Design references (apps, styles, moods)
- Platform patterns (which guidelines to follow)
- Key interactions (gestures, animations, haptics)
- Accessibility baseline (WCAG level, specific needs)

### 2.9 Success Metrics

**Questions to ask:**
- How will you know if this product is successful?
- What's the one metric you'd check daily?
- Any targets for launch? (Users, revenue, ratings)
- What does failure look like?

**What you're extracting:**
- North star metric
- Supporting metrics (3-5 KPIs with targets and timeframes)
- Launch goals
- Failure conditions (when to pivot or kill)

### 2.10 Risks & Mitigations

**Questions to ask:**
- What's the hardest technical challenge?
- What assumptions are you making that might be wrong?
- Any regulatory, legal, or compliance concerns?
- What happens if [critical dependency] fails or changes?

**What you're extracting:**
- Technical risks (with severity and mitigation)
- Assumption risks (what needs validation)
- External risks (compliance, dependencies, market)
- Contingency plans

### 2.11 Timeline & Milestones

**Questions to ask:**
- What's the target launch date?
- How many people are working on this?
- Can you break development into phases? What's in each phase?
- Any hard deadlines? (Demo day, funding milestone, seasonal launch)

**What you're extracting:**
- Development phases (with week ranges)
- Phase deliverables (what ships in each phase)
- Team composition (roles, count)
- Hard deadlines (with context)

### 2.12 Open Questions

Throughout the interview, track anything the user says "I don't know yet" or "we need to figure out." These become the Open Questions section — explicit acknowledgment of unresolved decisions.

---

## Phase 3: Synthesis

As answers accumulate, begin drafting sections. You don't need to wait until the end — draft as you go and show the user: "Here's what I have for the Features section based on what you've told me. Does this look right?"

**Drafting principles:**
- Use the user's words when possible (reduces misinterpretation)
- Be specific — "users can upload images" → "users can upload JPG/PNG images up to 10MB"
- Include the "why" — decisions without rationale get questioned later
- Use tables for structured data (features, metrics, data models)
- Use numbered lists for sequences (flows, milestones)
- Use bullet points sparingly — prose is easier to understand

---

## Phase 4: Review & Refine

Present the full draft and ask:
- "Does anything feel wrong or missing?"
- "Are there sections you want to go deeper on?"
- "Any terminology I should change to match your team's language?"

Iterate until the user is satisfied. Common refinements:
- Adding detail to vague sections
- Removing over-specified sections that constrain unnecessarily
- Adjusting tone (more formal for stakeholder docs, more casual for internal)

---

## Phase 5: Finalize

Produce the final PRD as a Markdown file. Use the structure in `references/prd-template.md`.

**Output format:**
- Markdown (.md) by default — universally readable, easy to version control
- Can convert to .docx if user requests (use docx skill)
- Include a metadata table at the top (version, date, author, status)

**File naming:** `[ProductName]_PRD_v[Version].md` (e.g., `SPRTPlus_PRD_v1.md`)

---

## Adaptive Interview Strategies

### For Simple Products (MVP, hackathon)
- Collapse sections 2.6-2.8 into brief notes
- Skip monetization if not applicable
- Focus on: Problem, Core Features, Primary Flow, Tech Stack, Timeline

### For Complex Products (enterprise, multi-platform)
- Expand data model into full schema documentation
- Add sections for: Security, Compliance, Integration Points, Migration
- Include architecture diagrams (describe in prose, suggest tooling)

### For Features (not full products)
- Skip Problem Statement (reference existing product context)
- Focus on: Feature Description, User Flow, Data Changes, Rollout Plan
- Add: Feature Flags, A/B Testing, Success Criteria

### When User Says "I Don't Know"
- Offer options: "Most apps in this space do X or Y. Does either fit?"
- Suggest deferral: "We can mark this as TBD and flag it in Open Questions."
- Probe gently: "What's your gut instinct? We can refine later."

---

## Question Bank by Section

For detailed question lists and follow-up prompts, see `references/question-bank.md`.

---

## Example PRD Structure

See `references/prd-template.md` for the complete template with section guidance.

**Quick overview of sections:**

1. **Executive Summary** — What is it, why does it matter, who's it for
2. **Platform & Technical Requirements** — Stack, targets, architecture
3. **Core Features** — What users can do, organized by functional area
4. **User Flows** — Step-by-step journeys through key scenarios
5. **Data Model** — Entities, fields, relationships
6. **Design Guidelines** — Visual and interaction principles
7. **Monetization** — Business model, pricing, paywall strategy
8. **Success Metrics** — KPIs, targets, measurement approach
9. **Risks & Mitigations** — What could go wrong, what's the plan
10. **Development Milestones** — Phased delivery plan
11. **Future Considerations** — What's explicitly out of scope for v1
12. **Open Questions** — Unresolved decisions needing follow-up

---

## Anti-Patterns to Avoid

- **Question dump**: Don't ask all 40 questions at once. Pace the interview.
- **Premature structure**: Don't show a blank template and ask user to fill it. Extract through conversation.
- **Vague features**: "Social features" is not a feature. "Users can follow other users and see their activity in a feed" is.
- **Missing constraints**: Every feature should have scope limits. "Unlimited" is rarely true.
- **No rationale**: Decisions without "because" get revisited. Include the why.
- **Perfectionism**: A shipped 80% PRD beats a perfect PRD that blocks development. Mark unknowns as TBD and move on.

---

## Output Checklist

Before delivering the final PRD, verify:

- [ ] Problem statement is concrete and testable
- [ ] Target user is specific enough to make decisions
- [ ] Features are prioritized (must-have vs. nice-to-have)
- [ ] At least one complete user flow is documented
- [ ] Data model covers all user-generated content
- [ ] Tech stack is specified (or options are listed)
- [ ] Success metrics have numbers and timeframes
- [ ] Risks have mitigations (not just a worry list)
- [ ] Timeline is broken into phases with deliverables
- [ ] Open questions are captured (not swept under the rug)
- [ ] Metadata table is complete (version, date, author, status)
