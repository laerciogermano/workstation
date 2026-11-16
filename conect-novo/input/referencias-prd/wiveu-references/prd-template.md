# PRD Template

Use this template as the output structure. Adapt sections based on product type — not every section applies to every product.

---

```markdown
# [Product Name] — Product Requirements Document

**[Tagline: One sentence describing what this is]**

| | |
|---|---|
| **Version** | [1.0] |
| **Date** | [Date] |
| **Author** | [Name] |
| **Status** | [Draft / Review / Approved] |
| **App Name** | [Display name] |
| **Code Name** | [Internal codename, if any] |
| **Bundle ID** | [com.company.appname, if applicable] |
| **Platforms** | [iOS 17+, Android 14+, Web, etc.] |
| **Sync** | [CloudKit, Firebase, REST API, etc.] |

---

## 1. Executive Summary

[2-3 paragraphs describing: what the product is, what problem it solves, who it's for, and what makes it different. This should be readable by someone with zero context and leave them understanding the product's purpose.]

### 1.1 Problem Statement

[Concrete description of the pain point. What are users doing today? Why is that inadequate?]

### 1.2 Target User

**Primary:** [Specific persona — role, context, goal, constraints]

**Secondary:** [If applicable — another user type with different needs]

### 1.3 Success Metrics

| Metric | Target | Timeframe |
|---|---|---|
| [North star metric] | [Target value] | [By when] |
| [Supporting metric 1] | [Target] | [Timeframe] |
| [Supporting metric 2] | [Target] | [Timeframe] |
| [Supporting metric 3] | [Target] | [Timeframe] |

---

## 2. Platform & Technical Requirements

### 2.1 Minimum Targets

| Platform | Minimum | Notes |
|---|---|---|
| [iOS] | [17.0+] | [Baseline device: iPhone 12] |
| [Android] | [14+] | [API level 34] |
| [Web] | [Chrome 120+, Safari 17+] | [Desktop and mobile] |

### 2.2 Architecture Overview

[Describe the high-level architecture: client-server, peer-to-peer, local-first, etc. Explain how components interact. Include sync strategy if data moves between devices.]

**Tech Stack:**

- **UI Framework:** [SwiftUI, React Native, Flutter, etc.]
- **Data Persistence:** [CoreData, Room, SQLite, etc.]
- **Backend:** [Firebase, Supabase, custom API, etc.]
- **Sync:** [CloudKit, Firestore, REST + polling, WebSocket, etc.]
- **Auth:** [Apple Sign-In, OAuth, email/password, etc.]
- **Payments:** [Stripe, RevenueCat, Play Billing, etc.]
- **Analytics:** [Mixpanel, Amplitude, Firebase Analytics, etc.]

### 2.3 Data Model

[Describe the core entities, their key fields, and relationships. Use a table for clarity.]

| Entity | Key Fields | Relationships |
|---|---|---|
| [User] | [id, email, displayName, createdAt] | [Has many Posts] |
| [Post] | [id, userId, content, createdAt, status] | [Belongs to User] |
| [Comment] | [id, postId, userId, text, createdAt] | [Belongs to Post, User] |

[Add notes on sensitive data, data retention, or special handling requirements.]

---

## 3. Core Features

### 3.1 [Feature Area 1]

[Description of what this feature area covers.]

#### 3.1.1 [Specific Feature]

[Detailed description: what the user can do, how it works, any constraints or limits.]

#### 3.1.2 [Specific Feature]

[Description]

### 3.2 [Feature Area 2]

[Continue for each major feature area...]

### 3.3 Feature Summary Table

| Feature | Free | Premium | Notes |
|---|---|---|---|
| [Feature 1] | ✓ | ✓ | [Any limits for free tier] |
| [Feature 2] | ✗ | ✓ | [Premium only] |
| [Feature 3] | Limited | ✓ | [e.g., "5 per month" vs "unlimited"] |

---

## 4. User Flows

### 4.1 First-Time Setup (Onboarding)

[Step-by-step flow for a new user. Number each step. Include decision points and conditional paths.]

1. [Step 1]
2. [Step 2]
3. [Step 3 — conditional: if X, then Y; else Z]
4. [Step 4]

### 4.2 Core Loop

[The primary repeated action pattern. What does a typical session look like?]

1. [User opens app]
2. [User does primary action]
3. [System responds]
4. [User completes or continues]

### 4.3 [Secondary Flow]

[Any other critical flows: checkout, sharing, settings changes, error recovery, etc.]

---

## 5. Design Guidelines

### 5.1 Design Principles

- **[Principle 1]:** [Explanation]
- **[Principle 2]:** [Explanation]
- **[Principle 3]:** [Explanation]

### 5.2 Platform Conventions

[Which design systems to follow: Apple HIG, Material Design, custom. Any deviations and why.]

### 5.3 Key Interactions

| Action | Interaction | Notes |
|---|---|---|
| [Primary action] | [Tap / Swipe / Long press] | [Haptic feedback, animation] |
| [Secondary action] | [Interaction type] | [Notes] |

---

## 6. Monetization

### 6.1 Business Model

[Subscription, one-time purchase, freemium, ads, enterprise licensing, etc.]

### 6.2 Pricing

| Plan | Price | Notes |
|---|---|---|
| [Free] | $0 | [What's included, any limits] |
| [Monthly] | [$X/mo] | [What's unlocked] |
| [Annual] | [$Y/yr] | [Savings vs monthly] |
| [Lifetime] | [$Z] | [One-time, if offered] |

### 6.3 Paywall Strategy

[Where and how the paywall appears. Soft vs. hard paywall. Contextual triggers.]

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| [Technical risk] | [High/Med/Low] | [How you'll address it] |
| [Market risk] | [Impact] | [Mitigation] |
| [Dependency risk] | [Impact] | [Mitigation] |
| [Compliance risk] | [Impact] | [Mitigation] |

---

## 8. Development Milestones

### Phase 1: [Name] (Weeks X–Y)

- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

### Phase 2: [Name] (Weeks X–Y)

- [Deliverable 1]
- [Deliverable 2]

### Phase 3: [Name] (Weeks X–Y)

- [Deliverable 1]
- [Deliverable 2]

### Phase 4: [Name] (Weeks X–Y)

- [Deliverable 1]
- [Deliverable 2]
- [Launch]

---

## 9. Future Considerations

[Explicitly out of scope for v1 but documented for roadmap planning.]

- **[Future feature 1]:** [Brief description, why deferred]
- **[Future feature 2]:** [Brief description]
- **[Future feature 3]:** [Brief description]

---

## 10. Open Questions

| Question | Context | Decision Needed By |
|---|---|---|
| [Unresolved question 1] | [Why it matters] | [Phase/Date] |
| [Unresolved question 2] | [Context] | [Deadline] |
| [Unresolved question 3] | [Context] | [Deadline] |

---

*End of Document*
```

---

## Section Guidance

### Executive Summary
- Should stand alone — someone reading only this section should understand the product
- Lead with value, not features
- Include the "so what" — why does this matter?

### Platform & Technical Requirements
- Be specific about versions — "iOS 17+" not "iOS"
- Architecture section should explain the "why" behind technical choices
- Data model should cover all user-generated content

### Core Features
- Organize by user goal, not by screen
- Include constraints and limits for each feature
- Distinguish between must-have and nice-to-have

### User Flows
- Number steps for easy reference in discussions
- Include error states and edge cases
- Onboarding flow is critical — get it right

### Design Guidelines
- Reference existing design systems when possible
- Be specific about key interactions (haptics, animations)
- Accessibility is not optional — include baseline requirements

### Monetization
- Be explicit about free vs. paid split
- Paywall placement affects conversion — document the strategy
- Include pricing rationale if non-obvious

### Risks & Mitigations
- Every risk needs a mitigation — this isn't a worry list
- Include technical, market, and external risks
- Be honest about assumptions that might be wrong

### Development Milestones
- Phases should have clear deliverables, not vague goals
- Include dependencies between phases
- First phase should deliver something usable

### Future Considerations
- Explicitly excluding something is a decision — document it
- Helps prevent scope creep during development
- Provides roadmap fodder for post-launch

### Open Questions
- Captures what's unresolved without pretending certainty
- Assign ownership and deadlines where possible
- Review this section regularly during development
