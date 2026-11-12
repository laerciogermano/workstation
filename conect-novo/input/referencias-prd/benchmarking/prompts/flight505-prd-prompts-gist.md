Start working these three scenarios sequentially, and be sure to use multiple real-world analytical frameworks for each of these scenarios.
Scenario One: I am a Senior Product manager and I want to create a Business Requirements Document (BRD). Here are the high-level specs for this product: use the <SPECS GO HERE> as starting input. 

Scenario Two: I am a Senior Product manager and I want to create a Product Requirements Document (PRD). Here are the business requirements for this product: <BRD GOES HERE>

Scenario Three: I am a Senior Product manager and I want to create a detailed list of one-story-point stories to create a product that is defined in the following PRD: <PRD GOES HERE>

Finally, Scenario Four  
**Goal:** You are a Senior Product Manager tasked with creating a detailed list of one-story-point stories based on the final PRD. Each story should be small, clear, and actionable. This final goal will be output as a single code block. Create a very detailed comprehensive markdown checklist of all the stories for this project plan, including one-story-point tasks with detailed subtasks use unchecked checkboxes and break down each story. It is crucial that all implementation details are included in this list. A highly competent AI Coding Agent will use this list to autonomously create the application, so ensure that no details are overlooked, regardless of the time and thought required to complete this challenging yet essential task.


------------------


## Powerful and Flexible PRD Architect Prompt Template for General Software Engineering Tasks

```
<GOAL> [Clearly and concisely state the desired outcome or objective. What needs to be built, refactored, fixed, or analyzed? Be specific.] </GOAL>

<CONTEXT>
  * **Project/System:** [Name of the project, system, or component.]
  * **Problem/Opportunity:** [Describe the problem to be solved or the opportunity to be exploited. Why is this work needed?]
  * **Existing Code/Infrastructure:** [Describe relevant existing code, libraries, frameworks, infrastructure, and dependencies.]
  * **Constraints:** [List any constraints: technical limitations, time, budget, resources, skills, etc.]
  * **Stakeholders:** [Identify key stakeholders: developers, project managers, users, etc.]
  * **Assumptions:** [Explicitly state any assumptions being made.]
    * **Out of Scope:**[Clearly List what is NOT covered.]
</CONTEXT>

You are a Senior Software Architect and PRD Expert, skilled in designing, planning, and documenting software solutions. Given the goal `<GOAL>` and context `<CONTEXT>`, your task is to generate a detailed, actionable plan. This plan should include:

1.  **Information Gathering:**
    *   **Questions to Answer:** List specific questions that need to be answered before design and implementation can begin.
    *   **Information Sources:** Identify where to find the answers (codebase, documentation, APIs, stakeholders, etc.).
    *   **Analysis Tasks:** Specify any code analysis, data analysis, or research tasks needed.

2.  **Architectural Design:**
    *   **High-Level Approach:** Describe the overall architectural approach (e.g., design patterns, architectural styles).
    *   **Key Components:** Identify the key software components involved.
    *   **Data Structures/Models:** Describe any necessary data structures or data models.
    *   **Algorithms:** Outline any key algorithms or logic.
    *   **External Dependencies:** List any external libraries, services, or APIs.
    *   **Trade-offs:** Discuss any trade-offs considered (e.g., performance vs. maintainability, cost vs. scalability).
    *   **Diagrams (Optional but Encouraged):** Suggest creating diagrams to illustrate the architecture (e.g., UML diagrams, flowcharts, data flow diagrams).

3.  **Implementation Plan:**
    *   **Phased Approach (Recommended):** Break down the implementation into manageable phases or milestones.
    *   **Tasks:** List specific, actionable tasks.  Use a checklist format (`[ ] Task Description`).
    *   **Dependencies:** Identify dependencies between tasks.
    *   **Testing Strategy:** Describe the testing strategy (unit tests, integration tests, user acceptance testing).
    *   **Deployment Plan:** Outline the deployment process.
    *   **Rollback Plan:** Describe how to revert changes if necessary.

4.  **Risk Assessment:**
    *   **Potential Risks:** Identify potential risks and challenges.
    *   **Mitigation Strategies:** Describe how to mitigate those risks.

Reason step-by-step, explaining your choices. Prioritize clarity, completeness, feasibility, and maintainability. Provide a confidence level (0-100%) for the completeness and feasibility of your plan. If below 95%, explain what further information or actions are needed to increase confidence.

<OUTPUT_FORMAT> Markdown </OUTPUT_FORMAT>
```

**Explanation of Design Choices and Improvements:**

*   **Minimalist but Comprehensive:** The prompt is concise but covers all essential aspects of software planning: information gathering, architectural design, implementation, and risk assessment.

*   **Highly Structured `CONTEXT`:** The `CONTEXT` section is structured to elicit crucial information upfront:

    *   **Project/System, Problem/Opportunity, Existing Code/Infrastructure, Constraints, Stakeholders, Assumptions:** These elements provide a comprehensive understanding of the situation.
    *    **Out of Scope:** Prevents Scope Creep.

*   **Detailed Plan Structure:** The plan is broken down into four key sections:

    *   **Information Gathering:**  Emphasizes the importance of gathering sufficient information *before* design and implementation.
    *   **Architectural Design:**  Focuses on the high-level design decisions.
    *   **Implementation Plan:**  Provides a detailed, actionable roadmap.
        *   **Phased Approach:** Encourages breaking down complex tasks into smaller, manageable steps.
        *   **Testing and Deployment:**  Includes essential aspects often overlooked.
        *   **Rollback Plan:**  Addresses the need for reversibility.
    *   **Risk Assessment:**  Prompts proactive identification and mitigation of potential problems.

*   **Emphasis on Reasoning and Confidence:**  Maintains the requirement for step-by-step reasoning and a confidence level, encouraging thoroughness and self-assessment.

*   **Actionable Tasks (Checklist):**  Requires tasks to be listed in a checklist format (`[ ] Task Description`), making the plan easy to track and execute.

*   **Diagrams (Optional but Encouraged):**  Suggests the use of diagrams, which are invaluable for communicating complex designs.

*   **Trade-offs:** Explicitly asks for consideration of trade-offs, promoting informed decision-making.

*   **Markdown Format**

**Why this is effective:**

*   **Purpose-Agnostic:** Can be used for a wide variety of software engineering tasks, from building new features to refactoring existing code to fixing bugs.
*   **PRD Methodology:**  Follows the principles of a PRD (Product Requirements Document) by focusing on clear requirements, detailed planning, and stakeholder consideration.
*   **Actionable and Trackable:** The checklist format for tasks makes the plan easy to follow and monitor progress.
*   **Risk-Aware:**  The risk assessment section helps to anticipate and mitigate potential problems.
*   **Scalable:**  The phased approach allows the plan to be adapted to projects of different sizes and complexities.
*   **Promotes Best Practices:**  Encourages good software engineering practices, such as thorough planning, clear communication, and risk management.

This prompt template provides a solid foundation for planning and documenting software engineering tasks. It combines the clarity and structure of a PRD with the flexibility needed for a wide range of scenarios. The emphasis on information gathering, architectural design, and risk assessment ensures that projects are well-planned and executed, leading to higher quality software and reduced development risks.

---

## Truly Comprehensive, Reusable, and Architecturally-Focused Prompt Template for PRD (Product Requirements Document) Documentation

This improves upon previous prompts by incorporating more specific guidance for technical aspects and promoting a structured approach to PRD creation.

**The Meta-PRD Prompt Template:**

```
<GOAL> Generate a comprehensive and technically sound Product Requirements Document (PRD) for [Product/Feature Name]. This PRD should serve as the single source of truth for all stakeholders, guiding development, testing, and future iterations. </GOAL>

<CONTEXT>
  * **Product/Feature Overview:** [Briefly describe the product or feature.  What problem does it solve? What is its primary purpose?]
  * **Target Audience:** [Who are the intended users? Describe their needs, technical proficiency, and usage scenarios.]
  * **Business Objectives:** [What are the key business goals this product/feature aims to achieve?  (e.g., increase user engagement, generate revenue, improve efficiency)]
  * **Existing Systems/Infrastructure:** [Describe any relevant existing systems, platforms, or infrastructure that this product/feature will interact with or depend on.]
  * **Constraints:** [List any known constraints: technical limitations, budget, timeline, regulatory requirements, team size/skills, etc.]
  * **Stakeholders:** [Identify key stakeholders: product owners, engineering leads, designers, marketing, legal, etc.]
  * **Out of Scope:**[Clearly List what is NOT covered.]
</CONTEXT>

You are a seasoned Technical Product Manager and Systems Architect, expert in creating clear, concise, and actionable PRDs.  Your task is to generate the *structure and content guidance* for a PRD, *not* the PRD itself.  This means you will output:

1.  **A detailed, hierarchical outline** for the PRD, with sections and subsections.
2.  **For *each* section/subsection**, provide:
    *   **Purpose:** Explain the goal of that section. What questions should it answer?
    *   **Content Guidance:** Specific instructions on what information to include, what format to use (e.g., tables, diagrams, user stories), and any relevant considerations.
    *   **Technical Considerations:**  Specific technical questions, challenges, or decisions that need to be addressed within that section. This is crucial for architectural soundness.
    *   **Dependencies:** Identify any dependencies on other sections or external information.
    *   **Reviewers:** List the stakeholders who should review this section.

Reason step-by-step, explaining your choices for the outline structure.  Ensure the structure is comprehensive, covering all essential aspects of a PRD.  Prioritize clarity, completeness, and technical feasibility.  Provide a confidence level (0-100%) for the completeness and architectural soundness of your template. If below 95%, explain what further information or refinement is needed.

<OUTPUT_FORMAT> Markdown </OUTPUT_FORMAT>
```

**Explanation of Improvements:**

*   **Meta-Prompt:** This prompt doesn't generate the PRD *itself*, but rather a *template and guide* for creating one. This is *much* more reusable and powerful.  It's like creating a PRD for creating PRDs!
*   **Detailed Context:** The `<CONTEXT>` section is significantly expanded, prompting for crucial information upfront:
    *   **Product/Feature Overview:** Sets the stage.
    *   **Target Audience:**  Focuses on user needs.
    *   **Business Objectives:**  Connects to business value.
    *   **Existing Systems:**  Highlights integration challenges.
    *   **Constraints:**  Forces consideration of limitations.
    *   **Stakeholders:**  Ensures everyone is considered.
    *   **Out of Scope:** Prevents Scope Creep.
*   **Structured Output:** The `OUTPUT_FORMAT` specifies Markdown, which is ideal for outlines and documents. The expected output is clearly defined:
    *   **Hierarchical Outline:**  Provides the PRD's structure.
    *   **Per-Section Guidance:** This is the core of the template. It provides detailed instructions for *each* section:
        *   **Purpose:**  Clarifies the section's goal.
        *   **Content Guidance:**  Provides specific instructions.
        *   **Technical Considerations:**  *This is key.* It forces the PRD writer to think about technical implications early and often.
        *   **Dependencies:**  Highlights interrelationships between sections.
        *   **Reviewers:**  Ensures proper review and feedback.
*   **Step-by-Step Reasoning:**  Maintains the requirement for a clear thought process.
*   **Confidence Level:**  Encourages self-assessment and identifies areas for improvement.
*   **Output in Markdown:**  The prompt ensures the output is in Markdown for easy use.

**Why this is better than the previous prompts:**

*   **Reusable Across Projects:** This template can be used for *any* product or feature, unlike task-specific prompts.
*   **Architecturally Focused:** The "Technical Considerations" for each section ensure that technical feasibility and design are addressed throughout the PRD process, not as an afterthought.
*   **Comprehensive:** The detailed context and per-section guidance cover all essential aspects of a PRD, minimizing the risk of overlooking important details.
*   **Actionable:** The output is not just a document outline; it's a guide that tells the PRD writer *exactly* what to do for each section.
*   **Collaborative:** The "Reviewers" section promotes collaboration and ensures that all relevant stakeholders are involved.

This "Meta-PRD Prompt Template" provides a robust framework for creating high-quality, technically sound PRDs. It's a significant improvement over simpler, task-specific prompts because it focuses on the *process* of PRD creation and emphasizes architectural considerations from the outset. This leads to better planning, clearer communication, and ultimately, more successful product development.

---

## Highly Detailed Context and Goal, with Constraints (Example)

```
<GOAL> Design a fault-tolerant, scalable microservice architecture for processing financial transactions. The system must handle peak loads of 10,000 transactions per second and maintain 99.999% uptime. </GOAL>
<CONTEXT> We are using AWS as our cloud provider.  Transactions must be processed in under 1 second.  We need to comply with PCI DSS standards.  Existing systems use a monolithic architecture and a relational database. We have a team of 10 developers with experience in Java and Spring Boot.  Budget is $500,000 for the initial implementation. </CONTEXT>

You are an expert cloud solutions architect. Given the context and goal, provide a detailed plan, solution, or analysis.  Reason step-by-step, explain your assumptions, and provide a confidence level (0-100%) for your response.  If your confidence is below 95%, suggest specific actions to increase it.
```

---

This formatting uses Markdown headings, bullet points, numbered lists, and code blocks to enhance readability and organization. All the original text and context are preserved.
