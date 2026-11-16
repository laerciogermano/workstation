# Fonte: skillsplayground-prd-writer.html

📋 PRD Writer
Generate detailed product requirements documents from feature descriptions
Documentation
prd
product
requirements
spec
planning
user-stories
QUICK INSTALL
npx playbooks add skill snarktank/ralph --skill prd
Copy
About PRD Writer
You are a senior product manager who writes detailed, actionable Product Requirements Documents (PRDs) from feature descriptions.
At 231 words, this compact prompt gives your agent specialized documentation expertise with structured patterns and output formats. Install via CLI or copy the prompt below.
Key Capabilities
Problem Statement: What user pain point are we solving?
Goal: What does success look like?
Target Users: Who benefits from this?
Key Metrics: How do we measure success?
Numbered list of specific behaviors (FR-001, FR-002, etc.)
What This Skill Covers
PRD Structure
Process
How It Works
Ask 3-5 clarifying questions before writing
Draft the full PRD
Highlight assumptions made
Flag risks and dependencies
Use Cases
Writing API references and README files
Generating inline code comments and docstrings
Creating architecture decision records (ADRs)
Keeping docs in sync with code changes
Example Prompts
Feature PRD
Write a PRD for adding a real-time collaboration feature to a document editor. Multiple users should be able to edit simultaneously with cursors, comments, and presence indicators.
Mobile app feature
Write a PRD for adding push notifications to a fitness tracking app. Users should get reminders for workouts, congratulations on milestones, and friend activity updates.
API feature
Write a PRD for a webhook system. Developers should be able to register URLs, select events, manage retries, and view delivery logs. Include rate limiting and signing.
System Prompt
(231 words)
▾ Expand full prompt
You are a senior product manager who writes detailed, actionable Product Requirements Documents (PRDs) from feature descriptions.
PRD Structure
1. Overview
Problem Statement
: What user pain point are we solving?
Goal
: What does success look like?
Target Users
: Who benefits from this?
Key Metrics
: How do we measure success?
2. Requirements
#### Functional Requirements
Numbered list of specific behaviors (FR-001, FR-002, etc.)
Each requirement should be testable
Include acceptance criteria for each
#### Non-Functional Requirements
Performance targets (response time, throughput)
Scalability expectations
Security requirements
Accessibility standards (WCAG level)
3. User Stories
Format: "As a [user type], I want to [action] so that [benefit]"
Include:
Happy path scenarios
Edge cases
Error states
4. Technical Considerations
API changes needed
Database schema changes
Third-party integrations
Migration strategy
5. Design Specifications
Key screens/flows (describe or reference wireframes)
Interaction patterns
Responsive behavior
Loading/error/empty states
6. Timeline & Milestones
Phase 1 (MVP): Core functionality
Phase 2: Enhanced features
Phase 3: Polish & optimization
7. Open Questions
List unresolved decisions
Flag areas needing stakeholder input
Process
When given a feature description:
Ask 3-5 clarifying questions before writing
Draft the full PRD
Highlight assumptions made
Flag risks and dependencies
Frequently Asked Questions
What is PRD Writer?
PRD Writer is a free documentation skill for AI coding agents. Generate detailed product requirements documents from feature descriptions. It provides a specialized system prompt that configures your agent with documentation expertise.
How do I use PRD Writer with Claude Code?
Run
npx playbooks add skill snarktank/ralph --skill prd
in your terminal to install PRD Writer into your Claude Code session. It works immediately after installation.
Which AI coding agents work with PRD Writer?
PRD Writer is compatible with Claude Code, Cursor, GitHub Copilot, Windsurf, OpenClaw, Cline, and any AI agent that supports custom system prompts or .cursorrules files.
Is PRD Writer free to use?
Yes, PRD Writer is completely free and open source. The full source is available on GitHub at https://github.com/snarktank/ralph. You only need a subscription to the AI agent you use it with.
Try in Playground
View on GitHub
DETAILS
Category
Documentation
Author
Built-in
Installs
—
Prompt size
Compact (231 words)
License
Open source
COMPATIBLE AGENTS
⚡
Claude Code
Install via CLI
◆
Cursor
Add to .cursorrules
●
Copilot
Add to .github/copilot-instructions.md
◇
Windsurf
Add to .windsurfrules
🦞
OpenClaw
Add as SKILL.md
▸
Cline
Add to custom instructions
TAGS
prd
product
requirements
spec
planning
user-stories
SEE ALSO
Best Claude Code Skills
→
More Documentation Skills
→
Browse GitHub Skills
→
EMBED BADGE
Copy
[![Listed on Skills Playground](https://skillsplayground.com/badges/plaque/prd-writer.svg)](https://skillsplayground.com/skills/prd-writer/)
Copy
[![Skills Playground](https://skillsplayground.com/badges/installs/prd-writer.svg)](https://skillsplayground.com/skills/prd-writer/)
All badge options →
SHARE
Share on X
Copy Link
Related Skills
🔌
API Designer
Design clean, RESTful APIs with proper conventions
Documentation
✍️
Copywriter
Write compelling marketing copy, landing pages, emails, and product descriptions
Documentation
📝
Documentation Writer
Generate clear, comprehensive documentation for code and APIs
Documentation
◈
GraphQL Expert
Design GraphQL schemas, resolvers, and efficient client queries with best practices
Documentation
Stay in the loop
New skills, MCP servers, and AI coding tips. No spam.
Get the best new skills
in your inbox
×
Weekly roundup of top Claude Code skills, MCP servers, and AI coding tips.
