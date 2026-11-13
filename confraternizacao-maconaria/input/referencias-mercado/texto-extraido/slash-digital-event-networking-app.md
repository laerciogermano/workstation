# slash-digital-event-networking-app

Fonte bruta: `raw-html/slash-digital-event-networking-app.html`

---

Event networking app: how to build one that works 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 Skip to content 
 
 
 
 
 
 
 S / ash Digital Lab 
 
 
 Services 
 
 
 
 
 Artificial intelligence  → 
 Slash AI Lab 
 AI agents 
 AI chatbots 
 AI consulting 
 AI training 
 Fine-tuning & RAG 
 Computer vision 
 
 
 
 Digital product & software  → 
 Custom software 
 Web applications 
 Mobile apps 
 
 
 
 Data & automation  → 
 Automation 
 
 
 
 DOOH & experiences  → 
 Interactive experiences 
 
 
 
 Cybersecurity  → 
 Pentest Colombia 
 
 
 
 
 5 families · 18 services 
 All services  → 
 AI, digital product, data, DOOH and cybersecurity: everything we do, on one page. 
 
 
 
 
 Work 
 AI Lab 
 Pentest 
 
 About 
 
 About 
 Team 
 Clients 
 Company facts 
 Environmental pledge 
 
 
 
 Insights 
 
 
 Start a project 
 
 
 
 
 
 
 
 
 
 
 
 ES EN FR 
 
 
 
 
 
 
 
 
 
 Services 01 
 
 
 Artificial intelligence  → 
 Slash AI Lab 
 AI agents 
 AI chatbots 
 AI consulting 
 AI training 
 Fine-tuning & RAG 
 Computer vision 
 
 
 
 Digital product & software  → 
 Custom software 
 Web applications 
 Mobile apps 
 
 
 
 Data & automation  → 
 Automation 
 
 
 
 DOOH & experiences  → 
 Interactive experiences 
 
 
 
 Cybersecurity  → 
 Pentest Colombia 
 
 
 All services  → 
 
 
 Work 02 
 AI Lab 03 
 Pentest 04 
 
 About 05 
 
 About 
 Team 
 Clients 
 Company facts 
 Environmental pledge 
 
 
 
 Insights 06 
 Start a project 
 Slash Digital Lab. AI in production, no promises

 
 
 
 
 
 
 
 
 Home / Insights / Event networking app 
 Strategy and regulation · October 2026 From agenda to meeting: how to build a great event networking app

 We built the apps for Colombia Tech Week 2026 and its festival, Colombia Tech Fest, and the native app of Réseau Mazette. Here is what works, screen by screen, and what Apple, Google and the law require before doors open.

 Aug 13–14, 2026 Colombia Tech Fest, Bogotá 30 min slots for 1:1 meeting requests 2 stores one Flutter codebase (Mazette) 
 
 Start a project 
 All insights 
 
 
 
 
 
 
 
 
 
 Jean Martial CEO and co-founder, Slash Digital Lab 
 
 
 Published October 8, 2026 
 Reading time 7 min 
 Topic Strategy and regulation 
 
 
 In this article 
 What makes an event networking app work? 
 Open signup or invitation-only access? 
 What should the home screen show? 
 How do you turn a directory into meetings? 
 What happens when the venue network fails? 
 What changes when the app must live all year? 
 Where does AI help in a networking app? 
 Should you build your own app or rent an event platform? 
 
 
 
 
 
 
 In short 
 A great event networking app turns an agenda and a guest list into meetings that actually happen. It needs controlled access, a home screen that answers “what's next for me”, a directory that leads to a meeting request and a 1:1 chat, screens that survive a failing venue network, and the safety and privacy rules Apple and Google require.

 
 
 For your company 
 AI inside your mobile app? Slash Digital Lab builds mobile apps from Bogotá, with embedded AI where it adds value.

 Mobile apps → 
 
 
 What makes an event networking app work?

 It works when meetings happen; map, notifications and sponsors serve that goal. Plan for three moments: before (invitation, profile, agenda), during (what's next, where, with whom) and after (contacts and follow-up).

 Colombia Tech Week 2026 ran in Bogotá from August 10 to 16, and its festival, Colombia Tech Fest, was held open-air at Parque El Chicó on August 13 and 14. We were a Gold Sponsor of the week and built its official app for thousands of attendees and the festival's attendee app , invitation-only and owned by the festival. We also built the native Flutter app of Réseau Mazette , a network of French-speaking professionals and entrepreneurs in Spain.

 Two jobs, two designs. Criterion Event app (Colombia Tech Week, Colombia Tech Fest) Community app (Réseau Mazette) Lifespan One week, reusable All year Access Invitation only Members only Core screens Home, map, agenda, networking, chat, calendar Members, events, resources, messages, Mia How people meet Meeting requests, 30-minute slots, 1:1 chat Events by city, circles, messages Where AI sits Search and filters do the work Mia, a copilot in its own tab Who owns it The festival (Colombia Tech Fest) The network 
 Planning one? See how we build mobile apps with built-in AI .

 Open signup or invitation-only access?

 For a closed guest list, invitation-only: the organizer knows who gets in, the directory stays trustworthy and there is no open signup to moderate.

 In the Colombia Tech Fest app, a first-time guest pastes the emailed code or opens the organizer's link, then follows numbered steps: invitation, privacy, password, profile, agenda. The login screen states “Sin registro público” (no public signup). The Mazette app is members-only, with the website's credentials.

 Make consent its own step. Colombia's Law 1581 of 2012 requires prior, express and informed authorization that can be consulted later (Articles 3 and 9), with a copy kept (Article 17). The GDPR requires a legal basis and data protection by design and by default (Article 25).

 Build in the store rules. If people can create an account, Apple requires in-app deletion (guideline 5.1.1(v)) and Google Play also wants a web link to request it; in our reading, activating an invitation counts as creating one. Adding social login (Google, LinkedIn) would bring in Apple's guideline 4.8, which requires an equivalent option limited to name and email that can hide the email; apps that use only their own accounts, like these two, are exempt.

 
 
 
 (enlarge) 
 Invitation-only access 
 
 
 (enlarge) 
 Members only 
 
 
 Colombia Tech Fest and Réseau Mazette apps (2026). 
 
 What should the home screen show?

 What's next for this person, first. The Colombia Tech Fest home greets the guest by first name and opens on “Próximo en tu día” (next in your day): the time and zone of the next session. Below: shortcuts to map, agenda, networking and calendar, day tabs and a search by title, speaker or company.

 The agenda filters by zone and category (fireside chat, panel, keynote, workshop); a star saves a session to favorites, which feed the personal calendar, and the agenda updates live. The map shows the venue's two zones and its open-access food and brand spaces.

 Our recommendation: design for ten-second glances between sessions, with time, place and one action per card. Give sponsors a visible slot, like the home carousel, not a step in the attendee's path; a sponsor who wants more deserves a live experience at the venue (see generative AI in brand experiences ).

 
 
 
 (enlarge) 
 What's next, first 
 
 
 (enlarge) 
 Agenda with filters and favorites 
 
 
 (enlarge) 
 Venue map 
 
 
 Colombia Tech Fest, July 2026 test build; profile photo blurred. 
 
 How do you turn a directory into meetings?

 With a short path: find someone, see when they are free, ask, talk. In the apps we built for Colombia Tech Week and Colombia Tech Fest, it takes five steps:

 Profile : role, industry, company and availability in 30-minute blocks.
 Search : by name, company or role, with filters; on a tablet, industry chips such as Fintech or Healthtech.
 Request : one profile button asks for a meeting, another blocks the user.
 Chat : a conversation starts as a request, under “Solicitudes enviadas” (sent) for the sender and “Invitaciones” for the recipient, so both can agree to meet.
 Calendar : “Mi calendario” brings together favorite sessions and meetings, with a “Solicitar reunión” (request a meeting) button.
 
 The stores require a safety layer. Apple's guideline 1.2 asks apps with user-generated content to filter objectionable material, act on reports promptly, offer a way to block abusive users and publish contact details; Google Play requires accepted terms, in-app reporting and blocking, and blocking in one-to-one messaging.

 
 
 
 (enlarge) 
 Searchable directory with filters 
 
 
 (enlarge) 
 Requests before the chat 
 
 
 (enlarge) 
 Sessions and meetings together 
 
 
 Colombia Tech Fest, July 2026 test build; attendees' names, photos and messages blurred. 
 
 What happens when the venue network fails?

 The app must stay useful. Colombia Tech Fest was an open-air festival in a park, and its app had to hold up when most guests connect at once: it has offline maps and a live agenda, and it was built for that peak. Our recommendations:

 Store on the phone the agenda, map, calendar and profiles of the people each attendee will meet.
 Queue offline actions (favorites, messages, requests) and sync them when the network returns.
 Load-test the peak: everyone signing in and searching within the same minutes.
 Give organizers admin tools, like Colombia Tech Fest's, for last-minute changes.
 
 Notifications need permission. Since Android 13 (API level 33), apps need the POST_NOTIFICATIONS permission, which Android suggests requesting after a user action, for example. iOS apps must ask too, and Apple recommends asking in context, such as after the person schedules a first task. Our equivalent: after the first favorite, not at launch.

 Field test we recommend The day before, walk the venue with a phone in airplane mode: agenda, map, calendar and meetings must open. Then reconnect and check that pending actions sync.

 
 What changes when the app must live all year?

 The job changes: the app must give members reasons to return between events, not carry them through one week. Réseau Mazette holds events in cities such as Málaga, Barcelona, Valencia and Madrid; its app combines events by city, discussion circles by topic and city, shared resources, messaging, memberships and Mia.

 Home greets the member with upcoming events and the newest members. Event cards show a poster, place or “online”, date and price. Resources hold searchable replays of webinars and talks, and the profile shows membership status and directory visibility.

 Two decisions carry the rest: the same login and brand as the website, and one Flutter codebase on the App Store and Google Play, so every member gets the same full product.

 An event app's job ends with the event, yet Colombia Tech Fest owns its app, ready for future editions. Our recommendation: if your event repeats, budget for an app you reopen, not rebuild.

 
 
 
 (enlarge) 
 Events filtered by city 
 
 
 (enlarge) 
 Circles by topic and city 
 
 
 Réseau Mazette app; message previews blurred. 
 
 Where does AI help in a networking app?

 Where the question is open and the answer is spread across screens, like Mia's sample question: “What are the upcoming events and who is attending?” Where a list or a filter already works, a copilot adds little.

 In the Mazette app, Mia has a dedicated tab and answers about events, participants, shared resources, the member directory and practical information. The screen asks for precise requests (city, topic, first name) and states that Mia follows the same visibility rules as the website: the main lesson. Our recommendations:

 Inherit the app's permissions : a member hidden from the directory must never appear in an answer.
 Treat member-written text as untrusted : profiles and messages can carry instructions aimed at the model (see prompt injection and agent security ).
 Say it is an AI : since August 2, 2026, Article 50(1) of the EU AI Act requires telling people they are interacting with an AI system unless it is obvious (see our 2026 regulatory map ).
 Explain suggestions and keep them opt-in : if the app proposes whom to meet, it says why.
 
 Our rule If a person cannot see a piece of data in the app, the assistant cannot either. Enforce permissions on the server, before the model receives any context, not in the prompt.

 
 
 
 
 (enlarge) 
 Mia, the network's copilot 
 
 
 
 Should you build your own app or rent an event platform?

 Our rule of thumb: rent a white-label platform if your event fits its template and you won't reuse the product; build your own to own the product and its data, reuse it each edition or run custom flows (invitations, zones, sponsors).

 No prices: cost depends on scope. Criterion Own app Event platform (white-label SaaS) Ownership and reuse Yours, reusable Licensed from the vendor Brand Yours everywhere Depends on the plan Data control You set hosting, retention and deletion Set by the contract Custom flows Whatever the event needs What the platform allows Time to launch Longer the first time Shorter if the template fits Cost model Build and maintenance across editions License per event, attendee or year 
 Before doors open: the checklist

 Invitations tested end to end: email, code, link, resend.
 Consent as its own step, with a record, and in-app account deletion (plus Google Play's web link).
 Block and report on profiles and chat, published contact, a named moderator.
 Agenda, map and calendar offline; offline actions queued.
 Notification permission requested in context.
 A peak load test and admin access for last-minute changes.
 Review buffer: Apple says it typically reviews at least 50% of submissions in under 24 hours and 90% in under 48, and accepts expedited requests tied to an event.
 Test tracks: TestFlight takes up to 10,000 external testers once App Review approves a first build; on Google Play, personal accounts created after November 13, 2023 need a closed test with at least 12 testers for at least 14 days before production.
 On-site help for lost invitations and forgotten passwords.
 After the event: contact export or follow-up, and a date for deleting data.
 
 In Colombia , the Superintendence of Industry and Commerce (SIC) supervises Law 1581 of 2012: keep proof of every authorization.

 In Europe , under GDPR Article 25, personal data must not by default be made accessible to an indefinite number of people without the person's intervention: make directory visibility a choice. An AI assistant also falls under Article 50 of the AI Act. General information, not legal advice.

 
 
 Key takeaways

 Measure a networking app in meetings that happen; design the path from profile to meeting first.
 Invitation-only access keeps the directory trustworthy; make consent its own step.
 Home answers “what's next for me”; favorites feed one personal calendar.
 Plan for the venue: offline agenda and map, queued actions and a peak load test.
 An AI copilot inherits the app's permissions, distrusts member text and says it is an AI.
 
 
 
 Sources

 App Review Guidelines (1.2 User-Generated Content, 4.8 Login Services, 5.1.1(v) Account Sign-In) · Apple Developer, 2026-10 
 Understanding Google Play's app account deletion requirements · Google Play Console Help, 2026-10 
 User Generated Content · Google Play Developer Policy Center, 2026-10 
 App Review (review times and expedited reviews) · Apple Developer, 2026-10 
 TestFlight · Apple Developer, 2026-10 
 App testing requirements for new personal developer accounts · Google Play Console Help, 2026-10 
 Notification runtime permission · Android Developers, 2026-10 
 Asking permission to use notifications · Apple Developer Documentation, 2026-10 
 Regulation (EU) 2016/679 (GDPR), Articles 6 and 25 · EUR-Lex, 2016-04-27 
 Ley Estatutaria 1581 de 2012 (protección de datos personales) · Función Pública, Gestor Normativo, 2012-10-17 
 AI Act, Article 50: transparency obligations for providers and deployers of certain AI systems · European Commission, AI Act Service Desk, 2026-07-27 
 Colombia Tech Fest 2026 llega a Bogotá: el festival de tecnología a cielo abierto más grande del país · Noticias RCN, 2026-08-11 
 
 
 Editorial note: this analysis reflects the public information available on the review date. Models, prices and rules change fast; every third-party figure links to its source, and our opinions are labeled as such. Spotted an error? Write to contact@slash-digital.io.

 
 
 
 
 
 
 
 
 Frequently asked questions 
 
 The questions we hear often

 
 
 
 What features does an event networking app need? At minimum: controlled access, a home screen with what's next, an agenda with filters and favorites, a venue map, a searchable directory, meeting requests, 1:1 chat, a personal calendar and notifications. Add offline access for the venue, and blocking, reporting and account deletion for the stores.

 
 Open signup or invitation? For a closed guest list, invitation: the organizer knows who gets in and there is no open signup to moderate. For a membership network, a members-only login with the website's credentials, as in the Réseau Mazette app.

 
 Must attendees be able to delete their account in the app? Yes, if the app supports account creation: Apple requires in-app account deletion (guideline 5.1.1(v)), and Google Play requires an in-app path plus a web link to request deletion.

 
 How long does publishing on the App Store and Google Play take? Apple says it typically reviews at least 50% of submissions in under 24 hours and 90% in under 48, and accepts expedited requests for releases tied to an event. On Google Play, a personal developer account created after November 13, 2023 first needs a closed test with at least 12 testers for at least 14 days. Our advice: leave weeks, not days.

 
 How much does an event networking app cost? It depends on the platforms, custom flows (invitations, zones, sponsors), integrations, offline mode, AI features, on-site support and maintenance between editions. Slash has not published prices for this service; we quote after a free first read.

 
 
 
 
 
 
 Keep reading 
 
 More analysis to read next

 
 
 
 
 
 Cybersecurity 
 Guardrails that work in production

 The seven layers of a guardrail stack, the 2026 guard models compared, how to measure them in your languages and two reference architectures.

 Updated Oct 30, 2026 9 min Rémy Sanchez 
 
 
 Strategy and regulation 
 The real cost of AI

 How AI is billed now, why cost per solved task beats price per token, savings levers with figures, hidden costs and a worked local vs API break-even.

 Updated Oct 28, 2026 9 min Esteban Zuleta 
 
 
 Agents and engineering 
 Chatbot vs AI agent: which one your business needs

 A chatbot answers, an agent acts. Definitions from Anthropic and OpenAI, a decision table, agent washing, costs, risks and when a plain workflow or form is the better buy.

 Oct 12, 2026 8 min Rémy Sanchez 
 
 
 
 
 
 
 Related capabilities 
 
 Where to next

 
 
 
 
 Mobile 
 Mobile apps

 Production iOS/Android apps: native or cross-platform, AI included.

 Learn more → 
 
 
 Phygital 
 Interactive experiences

 Physical + digital: boothless photobooth, brand mosaics and WebGL moments.

 Learn more → 
 
 
 CO-NECT 
 CO-NECT × Heavent 2026

 AI trade portraits that light up the LED wall for CO-NECT's 70th

 Learn more → 
 
 
 
 
 
 
 Talk to Slash 
 Let's put it in production

 Tell us your challenge. We reply within 24 business hours with an honest first read: if we can help, we'll say how; if not, we'll say who can.

 
 Start a project 
 Direct WhatsApp to Esteban 
 
 I reply personally. No endless forms, no canned replies.

 
 
 
 
 
 
 
 
 
 
 
 
 S / ash Digital Lab 
 A digital and AI lab founded in 2022. Digital products, applied AI, DOOH and cybersecurity for brands that can't afford to fail.

 
 Carrera 8A 97-07 · Bogotá, Colombia 
 contact@slash-digital.io 
 +57 312 697 5726 
 
 
 
 
 
 
 
 
 Services

 Artificial intelligence 
 Digital product & software 
 Data & automation 
 DOOH & experiences 
 Cybersecurity 
 Pentest Colombia 
 Nearshore development 
 All services  → 
 
 Company

 About 
 Team 
 Clients 
 Case studies 
 Slash AI Lab 
 Insights 
 Company facts 
 Contact 
 
 Legal & transparency

 Privacy notice 
 ri-PITE privacy policy 
 Cookie policy 
 Environmental pledge 

 Cookie preferences 

 security.txt 

 llms.txt 

 sitemap.xml 
 
 
 
 
 © 2026 Slash Digital Lab SAS · NIT 901670192-8 · Bogotá, Colombia

 ES EN FR 
 Message Esteban 
 Made in Bogotá · Spoken in Spanish, English and French

 
 
 
 Message Esteban
