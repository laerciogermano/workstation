# Fonte: adaline-ai-prd-sections.html

Your AI PRD Is Missing Its Hardest Sections
How to write acceptance criteria, failure modes, and behavioral constraints for an AI feature PRD.
Nilesh Barla
Mar 21, 2026
267
1
2
Share
TLDR:
This post is for product managers, builders, and teams shipping AI features. The central argument is that a PRD for an AI feature is not a specification of behavior; it is a
behavioral contract.
It is what defines
success thresholds
,
failure modes
,
fallback logic
, and
what the system is never allowed to do
. This blog breaks down five classic PRD sections that need to be rewritten for AI. It introduces a
sixth section
that no standard template includes, and walks through a concrete before-and-after example using a meeting summary feature. By the end, you will have a framework you can apply to the next AI feature PRD you write.
Consider a PM hands an engineer a PRD for an AI writing assistant. The acceptance criteria read:
the summary should be accurate and concise
. Three weeks later, the feature ships. Upon reviewing, the PM says it is broken. But the engineer says it passes the spec.
Here is the problem: they are both right.
Let me explain.
Product circles have been debating whether the PRD is dead, and the AI PRD in particular has become a flashpoint. Aakash Gupta put it clearly.
The spec did not die; it moved. The old flow was a permission document written before anyone had seen the system behave. And it took eight to twelve weeks.
The new flow is a decision record written after the prototype has shown you what you are working with,
which now takes one to two weeks.
At Anthropic, Boris Cherny’s team does not write specs at all; they run prototypes in parallel and ship dozens of pull requests every day.
OpenAI takes the opposite position. With 800 million monthly active users, a feature without a written behavior contract creates alignment problems that no amount of working code can solve.
Sean Grove made this point in his “The New Code” talk: when hundreds of engineers are building on the same system, a written spec does something working software cannot. It keeps shared intent visible and consistent across the entire team.
That framing is correct. But it sidesteps the harder question. Once the spec moves to step six, what does a PRD for an AI feature actually contain?
Especially when behavior is probabilistic, failure modes are invisible, and "accurate" is not a success criterion but an aspiration.
Here is what most teams are still missing.
Subscribe
What Can a Prototype Not Tell You?
The
prototype-first
movement is correct about sequencing. You discover things by building that no planning document would find. But a working prototype answers the wrong questions for a PRD. It essentially shows you what the system does. It cannot tell you:
Why is the change worth making?
How does the feature connect to the broader product strategy?
Who sees it first and under what release conditions?
What does “good enough to graduate” mean as an actual number?
Which tradeoffs and side effects have you decided to consciously accept?
Aakash Gupta identified those five gaps as the core value of a well-written spec in his August 2025 deep-dive on
AI PRDs
in Product Growth.
The prototype is a
discovery tool
. The PRD is an
alignment artifact
.
And PRD becomes richer and more honest once you have seen how the system behaves.
For AI features specifically, there are three additional gaps that standard PRD thinking has not yet addressed.
Eval thresholds:
You need a specific, numeric definition of what good looks like before you ship, not a general sense that the outputs “seem okay.”
Fallback behavior:
When the model gets it wrong, and it will, what does the system do? Does it fail or provide a failure response, surface uncertainty to the user, or escalate to a human? This is product logic, and it belongs in the spec.
Behavioral constraints:
A definition of what the system must never do, regardless of what the user asks. This is the boundary layer that protects users when the model is technically responsive but wrong in ways that cause harm or erode users’ trust.
The prototype shows you the feature. The PRD defines the contract.
The Sections You Need to Rewrite for a PRD for an AI Feature
The classic PRD format has
four sections
that appear in almost every template:
problem statement
,
acceptance criteria
,
success metrics
, and
definition of done
. For an AI feature, each requires a different kind of thinking than most teams currently apply.
Problem statement:
Largely unchanged, with one addition: state the cost of a wrong answer explicitly. A standard problem statement frames the user’s need.
An AI problem statement also frames the consequences of failure.
For a customer service bot, a hallucinated policy destroys trust in a way that a slow page load never does. In a clinical setting, a triage tool's wrong answer could cause direct harm. Naming that cost upfront shapes every decision that follows, from how strict the quality bar needs to be to whether the feature should exist at all.
Acceptance criteria:
This is where most AI PRDs collapse. Hamel Husain and Shreya Shankar have trained over 2,000 engineers and PMs on evaluation systems at companies including OpenAI and Anthropic. Their September 2025 guide on Lenny's Newsletter makes a point I keep coming back to: the first instinct is to reach for off-the-shelf metrics, hallucination rate, toxicity scores, numbers that look rigorous before you understand how your specific feature actually fails.
Those numbers are not wrong. They are meaningless until you have grounded them in your product’s real failure patterns. What matters is how your feature fails, not how AI systems fail in general.
Lenny's Newsletter
Building eval systems that improve your AI product
👋 Each week, I tackle reader questions about building product, driving growth, and accelerating your career. Annual subscribers get a free year of 15+ premium products: Lovable, Replit, Bolt, n8n, Wispr Flow, Descript, Linear, Gamma, Superhuman, Granola, Warp, Perplexity, Raycast, Magic Patterns, Mobbin, and ChatPRD…
Read more
a year ago · 354 likes · 10 comments · Hamel Husain and Shreya Shankar
Writing “should not hallucinate” in an AI feature acceptance criteria section is the same mistake as writing “the app should be fast.” It sounds right, but it measures nothing actionable.
This is the problem that
eval-driven development
is designed to solve: you build the measurement system alongside the feature, not after it ships broken.
The fix is
binary pass/fail
criteria tied to specific failure modes. Hamel and Shreya are direct on the scoring format in their September 2025 guide: Likert scales are a trap. The distinction between a 3 and a 4 is subjective and inconsistent.
Binary pass/fail forces clarity.
Adaline’s
eval interface in practice: every output gets a clear pass/fail verdict, plus a written reason. The reviewer never has to decide whether an output is a 3 or a 4.
The nuance belongs in a written critique explaining why the judgment was made
, detailed enough for a brand-new employee to understand it. An
LLM-as-judge
can automate this scoring at scale, but the human benchmark must come first.
The criteria also need to specify what percentage of cases must pass and who holds the final judgment. A concrete version: a senior PM reviews 20 random outputs per sprint, and if more than two fail the quality bar, the feature goes back to
prompt iteration
. That sentence is a testable contract. “Should be accurate and concise” is not.
The AI development lifecycle is a continuous cycle: iterate, evaluate, deploy, monitor, and back again. The behavioral contract you write in the PRD is what makes each stage accountable to the last.
Success metrics:
You need two explicit layers, not one.
The first layer covers model quality metrics
: output correctness, hallucination rate, LLM-as-judge pass rate, and completeness. These live upstream of the user experience and reveal whether the foundation is sound.
The second layer covers product metrics
: task completion rate, session depth, and user override rate, which is the percentage of AI outputs the user manually edits or ignores. User override rate is one of the most honest signals in an AI product. When it climbs, users have stopped trusting the feature, even if they are not explicitly saying so.
Almost every PRD I have seen contains only the second layer. Both are required.
Failure modes:
The best failure modes do not come from imagination.
They come from reviewing real outputs.
Hamel and Shreya recommend starting with a single human expert, often the PM, who sits with roughly 100 real prototype interactions and writes open notes on anything that looks or feels off.
The reason this works is captured by research on
criteria drift
cited in their guide. People are poor at articulating their full quality requirements in the abstract.
Seeing the output is what surfaces the requirement
.
Essentially, the act of
reviewing
and
annotating
is how real criteria emerge. And not imagining edge cases before anything has shipped. This is a wrong practice.
Consider an AI that summarizes incoming support tickets for customer success agents. In early prototype runs, it marked several tickets as resolved when the customer had simply stopped responding, not because the issue was actually closed. That specific constraint, “
must not infer resolution from user silence
,” would never have appeared in a PRD written before the prototype ran.
The failure makes the rule visible
.
Write your failure modes after reviewing 20 to 50 real prototype outputs and grouping what you observed into concrete categories. That is the section that earns its place in the document.
Definition of done:
In a standard PRD, done means QA sign-off. For an AI feature, done requires two additional conditions:
The specified
eval suite
must pass at the defined threshold.
The quality arbiter, in most cases the PM, must have reviewed a representative batch of outputs and signed off explicitly.
Engineering done and product done are not the same for a probabilistic system. And treating them as equivalent is how low-quality AI features get shipped without anyone being clearly responsible.
When a team ships an AI feature that only QA signed off on, and outputs start degrading in production two weeks later, the definition of done determines who owns the decision to pull it.
If that question is unanswered in the PRD, it will be unanswered at the worst possible moment.
Thanks for reading Adaline Labs! This post is public so feel free to share it.
Share
The Section That Does Not Exist in Standard PRDs
There is one section that no PRD template includes and that every AI PRD requires:
behavioral constraints
.
Behavioral constraints define what the system must never do, independent of what the user asks. They are not failure modes; failure modes describe things that go wrong unintentionally.
Behavioral constraints describe boundaries that the system must hold, even when the model is technically capable of crossing them. They are the equivalent of the system prompt in implementation: the boundary layer that the PM defines, and the engineer enforces.
Examples:
Must not fabricate citations or statistics.
Must not provide specific legal or medical advice.
Must not imply that a feature exists that is not currently offered.
Must decline politely with a specific message when the input is out of scope.
Vague behavioral constraints are functionally useless. Colin Matthews, writing about AI prototyping for Lenny’s Newsletter in January 2025, observed that the same discipline that makes AI coding tools reliable, being hyperspecific about what should change, is what makes behavioral constraints work. A vague instruction to an engineer produces the same result as a vague prompt to a model: confident-sounding noise.
Lenny's Newsletter
A guide to AI prototyping for product managers
👋 Welcome to a 🔒 subscriber-only edition 🔒 of my weekly newsletter. Each week I tackle reader questions about building product, driving growth, and accelerating your career. For more: Lennybot | Podcast | Hire your next product leader | My favorite Maven courses…
Read more
2 years ago · 712 likes · 13 comments · Colin Matthews
Here is what the difference looks like in practice. “Should not hallucinate” is not a constraint; the useful version is:
must not cite a source that was not present in the retrieved context
. “Should be helpful” measures nothing; the useful version is:
must attempt a response for any in-scope query, and must decline with a specific message for any out-of-scope query
. “Should be concise” has no edge; the useful version is:
summary output must be under 150 words unless the input exceeds 2,000 words
.
Each of those rewrites does the same thing: it gives an engineer, an automated judge, or a new hire
enough precision to make a consistent call on whether the output passes or fails
.
The PM owns this section. Engineers should not be inventing behavioral boundaries while writing code. By the time the code is being written, the constraints should already be settled.
A Worked Example: Meeting Summary for B2B SaaS
Take a concrete feature: an AI-powered meeting summary for a B2B SaaS product. Users paste in a transcript, and the feature returns a structured summary with action items. Here are two versions of the PRD for this feature, shown sequentially.
Version A: What most teams write.
The PRD describes a feature that reads transcripts and generates concise summaries with action items. The acceptance criteria read: the summary should be accurate and capture key points. The success metric is a user's thumbs-up or thumbs-down. Failure modes are not listed. The definition of done is a QA sign-off. It sounds reasonable. It produces a broken feature with no clear owner and no shared definition of good.
Version B: The behavioral contract.
This version was written after the PM reviewed 30 prototype outputs before writing a single criterion. That is the sequence: see the system fail, then write the contract.
Acceptance criteria:
An LLM-as-judge scores outputs at 4 out of 5 or higher on coherence and completeness for 90 percent of test cases. The PM reviews 15 random outputs per sprint, with fewer than 2 failures per cycle. Pass or fail is defined as: Does the summary correctly capture every action item assigned to a named person? That threshold came directly from watching prototype outputs miss action items. The PM saw the failure before writing the criterion.
Success metrics, model layer:
Hallucination rate, defined as any claim not supported by the transcript, must remain under 3 percent. Completeness score from LLM-as-judge must be above 85 percent. For a deeper breakdown of what to measure at this layer, the
PM guide to evaluating LLM outputs
covers the methodology in full.
Success metrics, product layer:
Feature activation rate and user override rate, which is the percentage of summaries the user manually edits heavily, with a target of under 20 percent.
Failure modes, drawn from reviewing 30 prototype outputs:
The model fabricated deadlines not stated in the transcript. It dropped action items from speakers whose accents the transcription engine handled poorly. It occasionally produced summaries longer than the original transcript. None of these were written from imagination. They were found.
Behavioral constraints:
Must not infer deadlines that were not explicitly stated. Must label uncertainty when speaker intent is ambiguous. Must decline if the transcript is under 100 words.
Definition of done:
The eval suite passes at the specified thresholds. The PM has reviewed one full sprint’s worth of outputs and signed off.
The difference between the two versions is not formatting. It is the work that happened before writing. The PM reviewed real outputs, found real failures, and turned those observations into a testable behavioral contract. That is what a PRD for an AI feature is supposed to do.
Conclusion
Pull out the last AI feature PRD your team wrote. Find the acceptance criteria section. Ask one question:
could a new hire with no context on this feature use these criteria to decide whether a given output passes or fails?
If the answer is no, you do not yet have acceptance criteria. You have aspirations.
The PRD is not dead. It is harder. Writing a behavioral contract for an AI feature requires you to have
seen the system fail
,
name the failure modes
,
make a judgment call about what good means
, and
document that judgment in a form that survives a sprint review
.
That work is harder than writing a feature description. It is also the work that separates a PM from a vibe coder.
There is a secondary thesis running through this post worth stating plainly:
the PM owns the quality bar for an AI feature, not the engineer
. Not because engineers cannot reason about quality, but because what “good looks” like is a product decision, not engineering.
Product decision depends on the cost of a wrong answer, the user’s tolerance for failure, and the competitive stakes of the feature. Those judgments belong in the PRD, where the PM makes them visible and accountable.
The PM’s job in AI products is to make good legible, to the team, to the evaluators who will test it, and to yourself. That work starts in the PRD, long before anything ships.
Thanks for reading Adaline Labs! Subscribe for free to receive new posts and support my work.
Subscribe
267
1
2
Share
Previous
Next
