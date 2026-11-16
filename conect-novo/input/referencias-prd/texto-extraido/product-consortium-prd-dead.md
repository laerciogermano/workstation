# Fonte: product-consortium-prd-dead.html

You spend two weeks writing a 30-page PRD. It goes through three rounds of stakeholder review. By the time engineering starts building, the market has shifted, user research has surfaced new insights, and half the assumptions are wrong. But the document is approved, so the team builds what it says. Weeks of work, instantly outdated.
The traditional PRD was designed for a world where requirements could be fully understood upfront and software was shipped in yearly releases. That world no longer exists. Modern product teams need documentation that keeps pace with what they are learning, not documents that freeze understanding at a single point in time.
The Core Idea
The traditional PRD suffers from a fundamental flaw: it assumes you know what to build before you start building. In practice, the most important learning happens during development, not before it. Teams discover edge cases, users react to prototypes, technical constraints reshape solutions. A document written before all of this learning happens is guaranteed to be wrong.
Modern alternatives replace the monolithic PRD with lighter, continuously updated formats. A one-pager captures the problem, success metrics, key assumptions, and scope in a single page. A living document evolves as the team learns, with version history showing how thinking changed over time. The goal is not to eliminate documentation but to make it a conversation rather than a contract.
“
The PRD is a document of false certainty. It assumes you know what you are building before you learn.
”
-
John Cutler
Why It Matters
Heavy specifications create false certainty and slow teams down. When a 30-page PRD is approved, teams feel locked into what was written, even when new evidence suggests a different direction. The document becomes a political artifact rather than a useful guide. PMs spend time defending the spec instead of adapting to what they are learning.
Lighter documentation also reduces cycle time dramatically. Instead of spending weeks writing and reviewing a comprehensive PRD, a PM can produce a one-pager in a few hours, get feedback the same day, and start iterating. Amazon's famous six-page narrative memo works because it forces clarity of thought in a constrained format, not because it is longer or more detailed than alternatives.
The PRD That Aged Badly
A fintech PM writes a detailed PRD for a new payment flow. It specifies every screen, every error state, every edge case. The document takes three weeks to finalise. During development, the team discovers that the third-party payment provider has a different API contract than assumed. The entire flow needs to change. But the PRD has been signed off by compliance, so changing it requires another review cycle. The team ships a compromise that satisfies the document but frustrates users. A one-pager with a clear problem statement and success metrics would have given the team room to adapt when reality differed from assumptions.
How to Apply It
Replacing the PRD does not mean abandoning documentation. It means choosing the right format for the right context and keeping documents alive as understanding evolves.
check_circle
Start every initiative with a one-pager: one sentence on the problem, three to five success metrics, key assumptions, user stories, and what is explicitly out of scope.
check_circle
Keep the document alive. Update it as the team learns. Use version history to track how thinking evolved, not to lock in an original specification.
check_circle
Use the spec as a conversation starter, not a contract. Walk through it with engineering and design before development begins. Expect it to change.
check_circle
Match the format to the context. Small features need a paragraph. Large initiatives need a one-pager. Regulated industries may need more formal documentation, but even there, keep it as lean as possible.
check_circle
Kill the approval chain for specs. If a document needs three levels of sign-off before engineering can start, you have a governance problem, not a documentation problem.
lightbulb
The Six Elements of a Good One-Pager
Problem statement (one sentence), success metrics (two to three), user stories (three to five), key assumptions (what must be true), mockups or diagrams (if helpful), and explicit out-of-scope items. If it does not fit on one page, you are over-specifying.
Common Mistakes
The shift from PRDs to lighter formats sounds simple but is surprisingly easy to get wrong.
Old wine in new bottles. Calling it a one-pager but writing 20 pages of requirements with a different header. The format change only works if the mindset changes too.
No documentation at all. Some teams overcorrect and stop writing anything down. This creates knowledge silos and makes onboarding new team members painful. The goal is lighter documentation, not zero documentation.
Still treating specs as contracts. If the team is penalised for deviating from what the one-pager says, you have not actually changed anything. The document should evolve with the work.
Over-specifying before discovery. Writing detailed user stories before talking to a single user is a PRD mindset in a one-pager format. Start with the problem and let the solution emerge from discovery.
Skipping stakeholder input. Lighter docs still need input from engineering, design, and key stakeholders. A one-pager written in isolation is just a shorter version of the same mistake.
Go Deeper
The debate about how to document product decisions is ongoing and context-dependent. These resources offer different perspectives on what works.
arrow_outward
The Beautiful Mess — John Cutler
Has written extensively about why PRDs fail and what replaces them.
arrow_outward
Continuous Discovery Habits — Teresa Torres
Shows how documentation fits into a continuous learning process.
arrow_outward
Amazon's Working Backwards process — Colin Bryar and Bill Carr
The six-page memo format as an alternative to slide decks and PRDs.
arrow_outward
Shape Up — Ryan Singer
Basecamp's approach to specifying work as shaped pitches rather than detailed requirements.
arrow_outward
Notion and Linear templates — modern product spec templates
Practical starting points for lightweight documentation.
