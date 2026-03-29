---
title: The Power of Post-Mortems
description: >-
  How post-mortems power teams: consequences after failure, what to document,
  blameless review, and tracked follow-ups that turn write-ups into change.
pubDate: '2026-03-27'
updatedDate: '2026-03-27'
draft: false
category: People & Teams
tags:
  - Post-Mortem
  - Incident Management
  - Engineering Management
  - Software Reliability
  - Blameless Culture
  - Accountability
  - Delegation
  - Site Reliability Engineering
  - DevOps Culture
  - Knowledge Sharing
excerpt: >-
  Why post-mortems matter beyond the template: accountability, catharsis, what
  belongs in the doc, and how stakeholder review plus owned action items beat
  paper theater.
keywords:
  - post-mortem
  - incident post-mortem
  - engineering post-mortem
  - blameless post-mortem
  - incident report
  - root cause analysis
  - software accountability
  - delegation and ownership
  - engineering management
  - production outage
  - near-miss analysis
  - incident response documentation
  - retrospective vs post-mortem
  - action items
  - organizational learning
heroImage: ../../assets/the-power-of-post-mortems-cover.webp
---

I've had my fair share of odd jobs over the twenty years I've been in the workforce, and I'm proud of that pile &mdash; seriously. Blue-collar work, a helping hand in olive gathering, warehouse shifts &mdash; it gave me a perspective I couldn't have taken any other way. Now that I'm an engineering manager I still reach for those years when I apply principles and draw parallels. One parallel that stuck: *Were we on a factory floor &mdash; where mistakes are not easily forgiven; you can lose a limb or worse &mdash; the cost would be absurd.* Even when our mistakes land in a production system instead of a shop floor, that still does not let us off the hook for care, or for taking errors seriously.

## A little story

Software is not automatically harmless because it is intangible. Out here, in the world, it rides on machines that touch bodies. If you need a scene to anchor that &mdash; not for drama, for gravity &mdash; imagine the treatment room: the weight of a day pressing on a technician, a cursor hopping on a VT100-style terminal, a machine that is supposed to heal, humming like any other Tuesday. The [Therac-25](https://en.wikipedia.org/wiki/Therac-25) was that kind of object: a computer-controlled radiation-therapy linear accelerator &mdash; a design in which more of the safety story had migrated off electromechanical interlocks and into software on a PDP-11, leaving fewer of the old physical stops that simply *banged* shut when something was out of place.

The failures were not a single typo in isolation. Investigators found a pattern:

- **Race conditions and concurrency bugs**: Programming errors allowed operator workflows to move faster than the software’s safety checks, meaning an experienced hand could edit fields too quickly for the machine to register reality.
- **Safety logic moved from hardware to software**: Critical physical interlocks and hardware stops were replaced by digital checks—which could silently fail while the interface continued to display normal operation.
- **Operator interface weaknesses**: Sometimes the equipment simply *paused*, but manuals and training taught staff to press on, masking underlying issues.
- **Misleading or absent feedback**:
  - Patients reported violent, inappropriate sensations during overdoses even as staff stared at calm readouts.
  - **Dosimeters and radiation monitors could show little or no delivery when a catastrophic beam had in fact fired.**
  - **Ionization chambers could become saturated** and deliver inaccurate or misleading feedback to technicians.
  - **Treatment printouts were not always enabled**, leaving some hospitals without a hard record when it was most needed.
- **Magnitude of the overdoses**: The record includes beams **hundreds of times** higher than intended in typical failures, with some reconstructions suggesting even higher exposures.
- **Scale of the disaster**: At least **six** major accidents occurred between **1985** and **1987**; **multiple patients died** from these overdoses and others suffered lifelong injury.

Most of us do not ship into that exact corridor every day. Do not mistake distance for innocence. When stakes are high, a bug stops being a thought experiment and becomes dose, burn, paralysis &mdash; whatever your domain uses to measure harm that cannot be rolled back. Mistakes have consequences.

**Post-mortems** sit in that chain &mdash; the natural consequence when something goes wrong.

### And one more related to me

So, here I am, new in my role, new in my shoes, sifting through emails and tasks, on a release day. We had done the *release conversation* a couple of times, and frankly I was starting to think that this wouldn't lead us anywhere: Without autonomy there is no ownership, and without ownership there's no responsibility. Ergo, I gave the autonomy to the team and my blessings for the release, and jumped into another meeting.

Thankfully we release and deploy to a canary subset of our infrastructure, thus we were able to spot the error before it affected everyone. Unfortunately, there was no standard procedure for rolling back, handling the error and the likes. As you've already guessed, all hell broke loose, not because the team didn't have the capacity or the knowledge to address the issue, but because they hadn't been given, in the past, the autonomy, the ownership, and the responsibility to do so.

Then, me be me, I joined a call, assisted debugging, we found the issue, we pinpointed the root-cause and discussed remediation. Acting as a parent, I requested that the release manager write a post-mortem about what went wrong. Here come consequences. And responsibility without consequences, is not responsibility. It's an illusion.

## The Aenaon Cycle of Consequences

In corporate jargon, the words **accountability** and **ownership** come up a lot &mdash; and more often than not, it's excruciatingly frustrating to understand these *abstract* concepts without concrete examples and patterns to follow.

For me, things are pretty simple &mdash; we'll discuss, from a more philosophical angle, how to make those abstractions concrete.

### Delegation

Delegation is the act of *entrusting* a task or duty to another person, typically one who is less senior than oneself.

It all starts with *delegation*: A task or duty you hold at hand and decide &mdash; for a reason or another &mdash; to hand it over to a colleague of yours; typically a direct report. It is something absolutely natural; we delegate tasks and responsibilities every day, even for the simplest things.

*You'll cook dinner tonight* is the usual textbook example: the missus does the cooking, but from time to time, for this reason or that, she'll delegate cooking to me.

When cooking is delegated, a certain level of autonomy needs to be given to me, so that I am able to perform my task.

### Autonomy

*Autonomy* comes from Greek, a fusion of the words autós (αυτός: self, same, by its own) and nomos (νόμος: law, custom). In our context, *autonomy* means that one has the ability to manage oneself; thus a level of freedom and control over a task, duty or territory.

Proper *delegation* requires a certain level of *autonomy*. Without it, you are not delegating &mdash; you are *renting* someone's hands while you keep their judgement in a cage. Call it what you want on a slide; in the room, that's *micro-management* with better lighting. The difficult part is not drawing a line on an org chart. It is the hand on the throat relaxing. *Awarding* autonomy means accepting that someone else's tempo will not match yours beat for beat.

I'll be blunt: **my** performance is nothing but the weighted sum of **their** work. I manage engineers. They carry the concrete weight &mdash; the debugging, the patches, the proof that the thing actually runs, the nights when the alert will not shut up. I carry the abstract load: direction, sequencing, shielding nonsense, making a space where concentration is still possible. The organization has given me *autonomy* to run my team as *I* see fit. Strip that away and the title is costume jewellery; as we'll see below, the circle does not close, because the middle link is missing.

The same geometry repeats one floor up. I manage managers: I have delegated duties to them and given them *autonomy* to carry those duties out *as they see fit* &mdash; not as whim, as *mandate*. If I had not given them that room, their roles would be theatre too: authority printed on the card, none in the room where the trade-offs actually land.

### Ownership

When you have been given a task or duty and you've been provided enough control over it so that you can perform it autonomously, you have *ownership* of it. On an abstract level, it's difficult to define ownership, but it's not that complicated.

In Greek popular memory, the emotional template for this is cinematic and a little unhinged &mdash; which is why it stuck. In Pantelis Voulgaris's *[Όλα είναι δρόμος](https://el.wikipedia.org/wiki/%CE%8C%CE%BB%CE%B1_%CE%B5%CE%AF%CE%BD%CE%B1%CE%B9_%CE%B4%CF%81%CF%8C%CE%BC%CE%BF%CF%82)* (*It's a Long Road*, 1998), the **Vietnam** part follows Makis Tsetsenglou into a [skiladiko](https://en.wikipedia.org/wiki/Skiladiko) &mdash; one of those fraying night joints at the edge of a town, all smoke, bouzouki, and bruised pride.

Drunk and loud, he asks what the *magazi* (venue) would cost; the owner names a band in the **twenty-to-twenty-five million drachmas** range; Μάκης offers **thirty million** on the spot. When the owner asks whether he means to *operate* the place, Μάκης says he will **demolish** it. Absurd, cruel, funny: a cult scene that lodged in the culture. I borrow only the shell. The **venue** is the patch of road you actually hold. I am not handing you the deed to the whole highway; I am handing you the keys to *your* magazi.

What I say to **anyone** I delegate to &mdash; engineer, lead, manager &mdash; compresses into this:

> Take the keys for the venue and run it as you see fit. In the end, we'll do the math.

*We'll do the math* is not a threat in my mouth; it is the honest half of the bargain. When the cycle turns &mdash; review season, or an incident with your name on the blast radius &mdash; we reconcile outcomes with expectations: what held, what cracked, what we change next.

Autonomy has **walls**: a backend lead does not get to annex infra strategy, rewrite org-wide cost rules, or swallow another team's mandate without the formal handrails that make that *legal* in a company, not merely *bold*. If you ran the venue **in good faith** and it still caught fire, we write a **post-mortem** and follow the smoke.

Long story short: rules, sign-offs, and operating parameters are the **lease** on the building &mdash; they define what *your* magazi is. Inside that footprint, though, who is better placed to run the floor than you? Me?

### Accountability

*Accountability* is a fancier term for *responsibility*. Sticking with the **magazi** image from above, it sounds like this:

1. You **can** act **inside the lease** you were handed. The organization pre-authorized a lane when it gave you the keys &mdash; you are not expected to ring the landlord for every price you chalk on the board, only when you are about to swing at a **load-bearing** wall: someone else's infra, org-wide cost, another team's mandate. That is not rogue autonomy; it is *authorized* judgement, with **your** name still on the door when the inspector walks in.
2. You *have* **real** control &mdash; hands on the register, not commentary from a balcony. When the rush hits, you are the one in the room.
3. It is your **duty** to **run** the place: openings, closings, restocking, the dull glue &mdash; the recurring heartbeat of *this* magazi. Not a single parcel of work you can drop on the pavement and forget.
4. When you lock up and *we do the math*, you **take** the praise or wear the blame for **this** store's line on the ledger &mdash; not the whole strip, not a faceless *someone should have*, **you**.

When you are given the necessary autonomy and you have assumed ownership of a task or a duty &mdash; you are ultimately accountable for the outcome.

Why *accountability* instead of *responsibility*, then? Short answer: semantics &mdash; nothing fancier hiding behind the syllables.

*Responsibility* can be used interchangeably both with *accountability* and with *duty*. Semantically, they are not the same: You have tasks &mdash; units of work that can be completed once-off &mdash; and duties &mdash; recurring units of work, process enforcement, etc. These are your *responsibilities*. You are *answerable* about those &mdash; their progress, their success, their failure, etc. &mdash; therefore, *accountable*.

### Consequences

Here's another misunderstood word: *consequence* is the outcome, or if you prefer, the effect of a cause. On the **magazi** floor, that is never a dead line in a textbook &mdash; it is whatever lands after you *lock up*. A good stretch: the till makes sense, the landlord's voice softens, maybe straight **praise**. A bad one: **scolding**, empty chairs, the weight you carry into the next shift.

Without consequences nothing works. Why run the counter in good faith if *we never do the math* &mdash; if a packed night and a dead one both stamped the same invisible wage? Why be accountable when nothing **follows** from how you ran the room? A consequence of working is getting paid; can you imagine someone working without getting paid? And no, I am not talking about hobbyists, contributors to open source, volunteering, and the like. You do a job to make ends meet and have something to eat.

The chain is only honest when it closes: *delegation* grants *autonomy*, *autonomy* makes *ownership* real, *ownership* makes *accountability* unavoidable, and *consequences* are what keep *accountability* from being a smoke screen &mdash; the moment the tally **bites**, so nobody can pretend the magazi was a dress rehearsal. Then the next handoff, the next release, the next dinner rotation; **another key** turns, and the loop starts clean.

## What's a Post-Mortem

If you are a police-procedural aficionado like I am, you already know what a *post-mortem* is in the literal sense. In our daily routines we dissect a block of code, a process, or an outcome to understand what happened. In engineering orgs, the written **post-mortem** is usually tied to **incidents**: **outages**, **production failures**, **security events**, and **near-misses** &mdash; moments when the system behaved in a way you did not expect or risk showed its teeth. The worst day qualifies, but so does the bullet that grazed you. When you want to squeeze more out of a win, teams often use a different ritual name (*retrospective*, launch review); the terse corporate thread that still says *post-mortem* means something happened to reliability, not a generic pat on the back.

It usually begins with an email &mdash; short, cold, corporate: *Kindly compile a post-mortem for X by Y*.

A post-mortem is a consequence that **not only** verifies the chain, but also leads to catharsis; much like a confession or therapy. It enables us to poke ourselves, a situation, a process, a chain of events, and relieve any burden we may have accumulated. It provides a lot of insight into the *what*, allows us to think *how* to improve something and improves &mdash; mainly psychological, but not only &mdash; *safety*, so that we are ready to take on the same actions, with better results next time.

I jokingly tell my team, *your punishment for this, is to produce a post-mortem*. Part of that is just my sense of humour; part of it is how the word *consequence* lands in my head.

In Greek, [συνέπεια](https://el.wiktionary.org/wiki/συνέπεια) is dictionary-neutral &mdash; among its senses is simply *result*, *outcome* &mdash; yet in live speech the plural *συνέπειες* often shows up in the same frames as English *consequences* in a warning: fallout, accountability, trouble, unless you explicitly steer it positive (for example *ευεργετικές συνέπειες*). Greek usage writing notes that reference works **disagree** on whether the word is strictly negative or polar; I'm not claiming a peer-reviewed law for the whole Balkans. I *am* saying that growing up in **south-eastern Europe** tuned my ear so *consequence* sits closer to *punishment* than to *bravo* &mdash; and that bleeds into how I tease the team.

### Kick-off

The first question that lands for the reader &mdash; and in my team, especially team leads &mdash; is *when* a post-mortem should be compiled. The answer is blunt: when something didn't go **as expected**, or did not meet certain **operational parameters**.

Maybe a deployment went bad. A fix that broke something else. An update that caused issues. A change in a pipeline that was undocumented and caused frustration. An internal process not followed. The list could go on forever; with a little critical thinking you know when something is a quiet word with one person and when it needs a post-mortem &mdash; compiled, reviewed, approved &mdash; so concrete change follows and the same mistake is less likely to repeat. We will make new mistakes anyway; we'll **kick off** new post-mortems when we do.

### The content

There are many templates out there that assist in post-mortem creation. If you pick one, fine &mdash; keep the document itself simple.

The post-mortem is not another tech-heavy document, and &mdash; at least for me &mdash; it needs to be understood by non-technical stakeholders, so that they are informed about the malfunction or the deviation, and they can contribute to the discussion and improvements.

Start with **what**: a simple, very high-level explanation of **what** happened. *Executive summary* is the label that usually gets pasted on that block; the point is that a non-technical stakeholder can speed-read it and still have a true picture of the situation if someone corners them with a question or two.

Proceed with **when**: Give an analytical timeline going as far back in time as necessary. Explain the build-up of the situation and the decisions or driving factors that led us to that point.

Focus on **how**: Explain the intricacies of the failure (or success, if you are writing a post-mortem for it). Give details so that no assumptions can be made. Don't just write them, but re-read them and question them. If you want to persuade others, you first need to persuade yourself.

Put the **blame** on the system: Rarely, if ever, is a single person solely at fault for an *internal* failure &mdash; and when one person did something malicious, HR and policy handle the person; the post-mortem still asks what *systems* allowed harm. After a security breach, serious response still **grounds itself in facts about the adversary and the intrusion**: attribution where it is knowable, **threat intelligence**, **IOCs**, **TTPs**, timelines, and evidence &mdash; otherwise you are storytelling while the same gap welcomes a repeat visit. None of that contradicts blameless learning: the learning document should still obsess over what *we* failed to prevent, detect, or contain &mdash; controls, monitoring, segmentation, response playbooks, handoffs between humans. Scapegoating one engineer on a slide is the easy out; fixing the wiring is the job. Conducting a *blameless* review is one of the hardest things I've been asked to do: we naturally blame people because systems are built by people. But hear me out: If your code does not validate whether an authenticated user may access a resource, it's not one person's fault. Somebody reviewed that code, somebody tested it, somebody approved it. The system is problematic, not the output of `git blame`.

Learn your **lesson(s)**: A post-mortem without admittance of lessons learned is an incomplete one. **The next two sentences are deliberate hyperbole &mdash; a stress test, not a logical theorem:** it's *almost* impossible that we botched a deployment and learned *literally* nothing; *almost* impossible that we fought a performance fire through investigation and remediation and took away *zero* new signal. If either were truly true, the process was hollow. It may be difficult, harsh even, to admit how little you still know, yet post-mortems also exist to repay any knowledge debt a team or an organization has. Use them.

Propose **next steps**: Conclude with what needs to be done going forward so the same failure is less likely to recur. You need to place safeguards? Do so, but in an organized manner. You need to improve processes? Propose with justification. You need to close the knowledge gap, provide training, inform the team about something? Note it down. It's important that you know where you are at the time of writing the post-mortem and where you want to be going forward.

### Reviewing

Writing a post-mortem just for the sake of it makes no sense. A post-mortem is another artifact: it needs review &mdash; and that review is **editorial** as well as **factual**. You are checking whether the story is clear *and* whether the record matches what actually happened.

I do not run this through a single gatekeeper. The review is done by the stakeholders who are interested and need to be informed: the engineering team first, and when the incident touched the edges of the product or customer experience, people from support, product, or elsewhere who must be able to explain what broke, how we responded, what we fixed, how long it took, and what we are doing so it is less likely next time. There is no prescribed reading order; the goal is engagement from the right people, not a routing slip.

That openness collides with a habit we have as builders: we are trained to review **code**. We look for null checks, race conditions, naming. A post-mortem is tired prose written under pressure. Two conscientious reviewers can both miss a line that is wrong, or *technically* defensible but misleading, because neither is listening for narrative failure the way they listen for a bad condition. Sometimes it takes a more experienced eye &mdash; someone who has read enough of these to hear when the timeline does not support the summary, or when the lesson and the facts are not the same thing.

Action items are where good intentions evaporate unless you **track** them. Every item needs an owner; whether you also commit to a hard date or to a priority band depends on severity, but *some* external handle matters &mdash; a ticket, a board, a recurring check-in, anything that lives outside the document. Without that, you have **nothing**: the room nods, the file is closed, nothing moves.

The post-mortem earns its keep when something in the real world moves. Until then, it's paper.

Paper without motion is just another illusion.

