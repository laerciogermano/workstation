---
source_url: https://adr.github.io/adr-templates/
title: ADR Templates — adr.github.io
downloaded: 2026-11-08
---

# ADR Templates — adr.github.io

ADR Templates | Architectural Decision Records Light Dark System ADR Templates Contents ADR Templates 

The following UML class diagram shows that many templates for ADR capturing exist, including (but not limited to) MADR, Nygardian ADRs, and Y-Statements:

 ---
 config:
 class:
 hideEmptyMembersBox: true
---
classDiagram
 direction TB
 class ADR {
 <<abstract>>
 }
 ADR <|-- MADR
 ADR <|-- NygardADR
 ADR <|-- Y-Statement
 ADR <|-- OtherADRTemplate
 
## Markdown Architectural Decision Records (MADR) 

MADR is about architectural decisions that matter ( [ˈmæɾɚ] ). Olaf Zimmermann’s MADR Template Primer covers it in more depth. You can use MADR without installing software by populating the template in any text editor. Additionally, a VS Code extension is available, though it may be outdated and lack support for the latest features. Other tools are also available.

MADR provides a full and a minimal template, both of which now come in an annotated and a bare format. The rationale for this decision is documented in the template decisions .

We think that the considered options with their pros and cons are crucial to understand the reasons for choosing a particular design. Therefore, the Markdown Architectural Decision Records (MADR) project in this organization includes such tradeoff analysis information. It also suggests metadata such as decision makers and confirmation in addition to decision status.

## Nygard ADR 

An ADR consists of title, status, context, decision, and consequences according to “Documenting Architecture Decisions” by @mtnygard .

The original blog post from 2011 suggests this structure, and a Markdown rendering is also available.

## Y-Statement 

In short, the Y-statement is as follows:
 

In the context of <use case/user story> , facing <concern> we decided for <option> to achieve <quality> , accepting <downside> .
 

The long form of it is as follows (extra section “because”):
 

In the context of <use case/user story> , facing <concern> , we decided for <option> and neglected <other options> , to achieve <system qualities/desired consequences> , accepting <downside/undesired consequences> , because <additional rationale> .
 

cards42 has adopted the Y-statement template in its German ADR card ; the English version is similar, but adds state information. Finally, you can find more explanations and examples on Medium: Y-Statements - A Light Template for Architectural Decision Capturing .

## Other ADR templates 

Numerous other ADR formats exist, many of which are also featured in @joelparkerhenderson’s GitHub repository .

The template for ISO/IEC/IEEE 42010:2011 , the international standard for architecture descriptions of systems and software engineering, suggests nine information items for ADRs its Appendix A. It also identifies areas to consider when identifying key decisions.
 adr This post is licensed under CC BY 4.0 by the author. Share 
## Recently Updated
 ADR Templates Decision Capturing Tools AD Practices 
## Contents
 
### Further Reading
 New content available Update
