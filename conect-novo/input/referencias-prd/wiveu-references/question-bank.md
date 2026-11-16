# PRD Question Bank

Detailed questions for each discovery phase. Use these as prompts during the interview — don't read them verbatim, adapt to conversation flow.

---

## Problem & Users

### Core Questions
1. "What problem are you solving? What's painful about the status quo?"
2. "Who experiences this pain most acutely? Describe them specifically."
3. "What do people do today to solve this problem? Why isn't that good enough?"
4. "Is there a secondary user type we should consider?"

### Follow-up Prompts
- "Can you give me a specific example of someone dealing with this problem?"
- "What triggers the need — when do users realize they need a solution?"
- "How often does this pain occur? Daily, weekly, occasionally?"
- "What's the cost of not solving this? (Time, money, frustration)"

### Red Flags to Probe
- User says "everyone" → "If you had to pick ONE type of person, who benefits most?"
- User describes solution before problem → "Let's back up — what's the underlying pain?"
- Problem sounds hypothetical → "Have you talked to people with this problem? What did they say?"

---

## Core Value Proposition

### Core Questions
1. "In one sentence, what makes this different from alternatives?"
2. "What's the 'aha moment' — when does a user first feel the value?"
3. "If users could only use one feature, which would it be?"

### Follow-up Prompts
- "Why would someone switch from what they're using today?"
- "What would make a user tell a friend about this?"
- "Is there something only YOU can build because of unique insight or access?"

### Red Flags to Probe
- "Better UX" as differentiator → "Better how, specifically? What interaction?"
- Too many differentiators → "Which ONE would you put on a billboard?"
- No clear hook → "Imagine explaining this at a party in 10 seconds. What do you say?"

---

## Feature Set

### Core Questions
1. "What are the 3-5 things users MUST be able to do in v1?"
2. "What are you explicitly NOT building? What's out of scope?"
3. "Are there tiers of access — free vs. paid, user roles, permissions?"
4. "Any features that need special hardware or permissions?"

### Follow-up Prompts (per feature)
- "Walk me through how this works step by step."
- "What happens at the edges? What if [edge case]?"
- "Is there a limit? How many, how often, how big?"
- "Can this be done offline? What happens when connectivity returns?"

### Prioritization Prompts
- "If you had to cut half the features to ship sooner, which survive?"
- "Which feature would cause users to complain loudest if missing?"
- "Which feature are you least certain about? Should we mark it for validation?"

### Red Flags to Probe
- Feature list too long → "That's a lot for v1. Can we phase this?"
- Vague features ("social features") → "What specifically can users do? Follow? Comment? Share?"
- No constraints → "Is there a limit? Unlimited usually means 'we haven't decided yet.'"

---

## User Flows

### Core Questions
1. "What happens when a user opens the app for the first time?"
2. "Walk me through the main thing users will do repeatedly."
3. "What happens when something goes wrong?"
4. "Are there any other critical flows beyond the core loop?"

### Onboarding Deep-Dive
- "How much setup is required before the user gets value?"
- "What permissions do you need? When do you ask for them?"
- "Can users skip setup and do it later?"
- "What data do you need from the user? What's required vs. optional?"

### Core Loop Deep-Dive
- "How does a session start? What triggers it?"
- "What's the user doing during the session?"
- "How does it end? What feedback does the user get?"
- "How long is a typical session?"

### Error Handling Deep-Dive
- "What if the network fails mid-action?"
- "What if the user makes a mistake? Can they undo?"
- "What if data conflicts? (Two devices editing the same thing)"
- "What's the worst case scenario? How do you recover?"

---

## Platform & Architecture

### Core Questions
1. "What's your tech stack? (Or what are you leaning toward?)"
2. "Does data sync across devices? How?"
3. "Does this work offline? What happens on reconnection?"
4. "Any third-party dependencies?"
5. "What's your baseline device target?"

### Tech Stack Prompts
- "Why this stack over alternatives?"
- "Any team expertise that influenced the choice?"
- "Any technical debt you're knowingly accepting?"

### Sync Strategy Prompts
- "Is there a source of truth? Server or client?"
- "What happens if two devices edit the same data?"
- "How quickly does data need to sync? Real-time or eventual?"
- "What's the offline story? Full functionality or read-only?"

### Dependency Prompts
- "What happens if [third-party service] goes down?"
- "Are you locked into any vendor? What's the switching cost?"
- "Any rate limits or usage costs to consider?"

---

## Data Model

### Core Questions
1. "What are the main 'things' in your app?"
2. "For each thing: what are the key fields? What relationships exist?"
3. "What data is user-generated vs. system-generated?"
4. "Any sensitive data requiring special handling?"

### Per-Entity Prompts
- "What uniquely identifies a [entity]?"
- "What fields are required vs. optional?"
- "Can a [entity] be deleted? What happens to related data?"
- "Who can create/read/update/delete a [entity]?"

### Relationship Prompts
- "Can a [A] have multiple [B]s?"
- "If I delete a [A], what happens to its [B]s?"
- "Can [B] exist without [A]?"

### Sensitive Data Prompts
- "Does this include PII? (Name, email, location, etc.)"
- "Any health data? Financial data? Biometrics?"
- "What's the data retention policy?"
- "Any compliance requirements? (GDPR, HIPAA, COPPA)"

---

## Monetization

### Core Questions
1. "How will this make money?"
2. "What's free vs. paid?"
3. "Any price points in mind?"
4. "Where does the paywall appear?"

### Business Model Prompts
- "Why this model over alternatives?"
- "What does the competitive landscape charge?"
- "Is there a lifetime option? Why or why not?"
- "Any enterprise or team pricing?"

### Paywall Strategy Prompts
- "Is this a soft paywall (can dismiss) or hard paywall (must convert)?"
- "What triggers the paywall? Usage limit, feature access, time?"
- "Can users try paid features before committing?"
- "What's the conversion funnel? Free → trial → paid?"

---

## Design & UX

### Core Questions
1. "Any design inspiration? Apps you want it to feel like?"
2. "Which platform conventions to follow?"
3. "Any critical interaction patterns?"
4. "Accessibility requirements?"

### Design Reference Prompts
- "What do you like about [reference app]'s design?"
- "What should this NOT feel like?"
- "Any brand guidelines or existing design system?"

### Interaction Prompts
- "What gestures are primary? Tap, swipe, long-press?"
- "Any haptic feedback? When?"
- "Any animations that are important to the experience?"
- "How do users navigate? Tabs, drawer, stack?"

### Accessibility Prompts
- "What's the baseline? WCAG A, AA, AAA?"
- "Any specific user needs to accommodate?"
- "Will this support VoiceOver/TalkBack?"
- "Any color contrast requirements?"

---

## Success Metrics

### Core Questions
1. "How will you know if this is successful?"
2. "What's the ONE metric you'd check daily?"
3. "Any launch targets?"
4. "What does failure look like?"

### Metric Definition Prompts
- "How will you measure [metric]?"
- "What's a realistic target for month 1? Month 6?"
- "What's the baseline today? (If improving an existing product)"
- "Who's responsible for tracking this?"

### North Star Prompts
- "If only one number could go up, which matters most?"
- "Does this metric capture user value or just activity?"
- "Can this metric be gamed? How do you prevent that?"

### Failure Prompts
- "At what point would you pivot or kill this?"
- "What's the minimum viable success?"
- "What would make you confident enough to invest more?"

---

## Risks & Mitigations

### Core Questions
1. "What's the hardest technical challenge?"
2. "What assumptions are you making that might be wrong?"
3. "Any regulatory or compliance concerns?"
4. "What if a critical dependency fails?"

### Technical Risk Prompts
- "Have you validated this is technically feasible?"
- "What's your fallback if [technical approach] doesn't work?"
- "Any performance concerns? Scale concerns?"

### Assumption Risk Prompts
- "What do you believe about users that you haven't validated?"
- "What would change your approach if proven wrong?"
- "What's the cheapest way to test this assumption?"

### External Risk Prompts
- "Any platform policy risks? (App Store, Google Play)"
- "Any legal considerations?"
- "What happens if [competitor] launches something similar?"

---

## Timeline & Milestones

### Core Questions
1. "What's the target launch date?"
2. "How many people are working on this? What roles?"
3. "Can we break this into phases? What's in each?"
4. "Any hard deadlines? (Demo day, funding, seasonal)"

### Phase Planning Prompts
- "What's the minimum we could ship and get feedback?"
- "What depends on what? Any blockers between phases?"
- "What's the riskiest part? Should we tackle it first?"

### Team Prompts
- "Any skills missing on the team?"
- "Any bottlenecks? (One person who everything depends on)"
- "What's the review/approval process for shipping?"

### Deadline Prompts
- "Is [deadline] hard or soft? What happens if we miss it?"
- "Any external events to align with? (Conferences, holidays)"
- "What would you cut to hit the deadline if behind?"

---

## Open Questions Capture

Throughout the interview, note when the user says:
- "I don't know yet"
- "We haven't decided"
- "Good question, I need to think about that"
- "That depends on [unresolved thing]"

Capture each as an Open Question with:
- The question itself
- Why it matters (context)
- When it needs to be resolved (phase/date)
- Who should make the decision (if known)

Example format:
```
| Question | Context | Decision Needed By |
|---|---|---|
| Should calibration be mandatory before auto-stop? | Uncalibrated auto-stop could trigger at wrong distance, frustrating users | Phase 4 |
```
