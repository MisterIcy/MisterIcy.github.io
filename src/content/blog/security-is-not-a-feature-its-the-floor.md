---
title: Security Is Not a Feature. It's the Foundation for Apps
description: >-
  Frontend checks without backend authorization spell broken access
  control—OWASP A01, IDOR, CWEs, rate limits, and why security is the floor.
pubDate: '2026-03-23'
updatedDate: '2026-03-24'
draft: true
category: Security
tags:
  - Security
  - Broken Access Control
  - OWASP
  - Authorization
  - Authentication
  - Laravel
  - IDOR
  - Web Application Security
  - Secure by Design
  - Software Engineering
  - CWE
excerpt: >-
  Frontend checks without backend authorization spell broken access
  control—OWASP A01, IDOR, CWEs, rate limits, and why security is the floor.
keywords:
  - broken access control
  - OWASP A01
  - missing authorization
  - authentication vs authorization
  - Laravel security
  - Blade templates
  - IDOR
  - insecure direct object reference
  - CWE-862
  - CWE-282
  - CWE-639
  - deny by default
  - secure by design
  - rate limiting
  - API security
heroImage: ../../assets/security-is-not-a-feature-its-the-floor-cover.webp
---

It is another usual day at work &mdash; not a Friday, not a Monday &mdash; and there's no deadline looming over your head. Everything goes smoothly, and even worse: Everything's on track and some of your deliverables have been delivered earlier than their original ETAs. What else could a developer ask for?

And yet, something's troubling you. You've been looking at a [Blade Template](https://laravel.com/docs/13.x/blade) and something feels off. Way off. In fact, you cannot understand why you need all these permission-related checks on frontend. You check whether the user has permission to upload files, to download files, to share files, to give one-time access links, the works.

## The checks are lying to you

Truth be told, this file repository SaaS application you've been maintaining is kind of old, based on an older version of Laravel &mdash; there's not enough time for updates; features need to be shipped &mdash; and the code is not the cleanest it can be. You shipped the MVP, it went well and a feature rush started; a frenzy that hasn't settled yet.

You shift around your notes: A git blame here, a check on the development documentation there, some searching through integration and E2E tests. And something ominous starts humming in the background: It's the realization that *nothing is really what it seems*.

### Trust, but verify

It has probably been a long time since you've built an affectionate relationship of trust and dependence with your codebase. You trust that it works the way it has been designed and that it handles every absurd scenario you and your colleagues could have thought of. Yet, that morning, you are so deeply troubled with the immense amount of security checking on your frontend that you'll have to do what you've been afraid of since your eyes met the first `@if` &mdash; have a look at the backend.

Paradoxically, the controller is quite clean. It follows best practices. It checks for the existence of a user session (*is the user logged in?*) and Laravel &mdash; or you, if you wired it yourself &mdash; has taken care of Cross-Site Request Forgery (CSRF; *has the user been tricked into doing something other than what they wanted from a malicious actor?*). Yet, one thing that stands out is the one that matters the most:

At no point in your controllers or the middleware they use is there a check regarding the most fundamental principle you've built your service on: *Does the user have access to perform a particular action on the requested file?*

> A wild Broken Access Control vulnerability appears!

If this hasn't been clear until now, today we are going to talk about security. We'll be talking a lot so grab your favorite beverage, get yourself comfortable, stay a while and listen...

## You can but, *are you supposed to*?

Before talking about BAC, let's explain what *Access Control* is and does.

> Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of all data or performing a business function outside the user's limits.
>
> OWASP Top10 [A01 Broken Access Control](https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/)

OWASP gives pretty detailed information about some common vulnerabilities. So, as you look at your imaginary SaaS's code, you can quickly understand that while we've imposed strict Access Control checks on the frontend layer, the backend makes no mention of checks. Which is bad. Very bad.

As usual, in such situations, shit can hit the fan faster than anyone can anticipate. You start to wonder *has it been exploited?*.

That's an answer you can't really give at the moment; it requires a careful review of your logs, access patterns, the likes. You've got to decide what's more important and set your priorities straight: Damage control vs reporting. Damage control always wins.

Now, before even patching this, you'll have to understand exactly what its impact is. As usual in such situations, you grab a colleague of yours and start [red-teaming](https://en.wikipedia.org/wiki/Red_team) the application. You log in as user A, you try to access a file from user B to no avail: The frontend enforces your security policy. However, when you request, via an API call, a file that belongs to user B &mdash; one you have no permission to view &mdash; it gets immediately downloaded to your local development environment.

### Authentication versus Authorization

There's a major difference between those two words, their meaning and what they stand for. On one hand, **authentication** is the process of proving something to be true: Your identity in our context. When you are using the correct password for a username, you are either granted access or denied: You are **authenticated** or you get a `401`.

**Authorization**, on the other hand, is the action of authorizing (giving permission) someone to do something. So when you try to download a file, you'll either get it or you'll get a `403`.

In our case, the frontend contains **all** necessary controls to disallow access to **unauthorized** actors; which is good up to a point. However, the backend cares **only about authentication**.

I'd suggest you reread MDN on [401](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401) and [403](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403); the distinction is there and is easily understandable:

> A `401 Unauthorized` is similar to the `403 Forbidden` response, **except** that a 403 is returned when a request **contains valid credentials**, but the client **does not have permissions** to perform a certain action.

In our case, a check like the following (given in pseudocode) would suffice:

```php
if ($user->canAccess($file) === false) {
    throw new ForbiddenException("You are not allowed to view this file");
}
```

### Let's start with *Why?*

While what I am about to write can be shredded into pieces, **we have been falling into our own traps**: A common mistake is that we are so blindly enforcing the *DRY* principle that we tend not to properly enforce access controls. Another mistake is failing to separate concerns; for example, each route has its own authorization logic, rather than grouping authorization logic in middleware. A missed non-functional requirement here, a case not covered by tests there: You know the drill.

But the most wicked mistake of all is lacking a **security-first mindset**. Security is not another *feature*. Security is not *nice-to-have*. Security isn't even just a *non-functional requirement*. It's a fundamental principle we need to be disciplined in, so that both we, as developers, and the organizations and the projects that we are working on, are *secure by design*.

Even if you are following a very strict procedure in your Software Development Lifecycle (SDLC), mistakes such as this are *bound* to happen, if you don't follow a *security-first, deny-by-default* approach. In our example SaaS here, it is obvious that you, as a developer, didn't lack the **skills** a developer should have with regards to security. However, the **mindset** is a very different thing.

### Always Assume Breach

While I've distanced myself from code the last few months, I still do code reviews; albeit at a limited capacity. What I've been actively looking at are three domains where I truly have both the experience and the expertise to give feedback on:

1. **Architecture**: Will the code stand the tests of time?
2. **Performance**: What happens when the Horde of Users hit us hard?
3. **Security**: Can I break it? What's the worst case scenario? What we've got to lose?

Undoubtedly, the first two domains are out of context, however the third is what we are talking about today.

When I was writing code, and when I review code nowadays, I **assume there's a breach**. There's a hole in the system that I can exploit. There's something that will allow me to utterly devastate the system.

You'd ask, *can you test all scenarios?*

Of course not. Neither am I a security expert, a penetration tester, or a bounty hunter, nor have I ever wanted to pursue such a path. But I'm conscious about my code, my choices and my feedback: I have a *security-first mindset* and always try to teach a thing or two to newer colleagues.

In our example, the Broken Access Control led to access to files from **unauthorized** users. Imagine if these files contained PII or, even worse, health records. What if then?

No matter the industry you are working in, no matter the application you develop, no matter the framework, the same basic principles apply:

1. Follow the **Least Privilege Principle**: Never give more privileges to a user than the ones that are truly required to do their job.
2. **Deny Access By Default**: No matter the case, the error, the situation, return a `403 Forbidden` and don't leak **any** sensitive detail to the client; keep the real state on the server.
3. **Assume Breach**: Work under the belief that the system you are working on is already breached, and try to red-team and mitigate any issues before they reach production.

### Assigning CWEs and Patching

You have a reproduction. You have a story you can tell in plain language: *authenticated user, wrong file, download succeeds anyway*. What you do *not* yet have is something that survives handoff — to another engineer, to a release note, to a postmortem, to a tool that only speaks in taxonomies. The gap between *I know what broke* and *we can systematically fix this class of mistake* is where good teams stop improvising and start borrowing language the industry has already agreed on.

That language is [CWE](https://cwe.mitre.org/) — Common Weakness Enumeration. A CWE is not a medal and not a verdict; it is a **label** for a *kind* of mistake, narrow enough to be actionable, broad enough to recur. When you assign one, you are doing three things at once: you force yourself to describe the failure mechanism without hiding behind euphemisms, you plug the issue into the same map scanners, auditors, and frameworks already use (including how it relates to entries like OWASP Top 10), and you open the door to **remediation guidance** that is written against weakness types, not against your feelings that morning.

Don't get me wrong — picking the wrong CWE is worse than admitting *I'm not sure yet*. The taxonomy rewards honesty. Parent/child relationships exist precisely because real incidents are messy. What matters is that you converge: *this is missing enforcement at the trust boundary*, *this is authorization versus authentication confusion*, *this is object ownership in a multi-tenant graph*. Once the label sticks, patching stops being a heroic one-off and becomes a **pattern**: enforce policy where the decision is authoritative (for a web stack, that is almost always the server), deny by default, cover the negative paths in tests, and document the invariant so the next feature rush does not carve a new hole beside the old one.

In the file-repository scenario we've been walking through, the failure is not merely *forgot an `if`* — it is that the system never properly reconciles *who may act on which resource*. That is [CWE-282: Improper Ownership Management](https://cwe.mitre.org/data/definitions/282.html) territory: the boundary between *this file exists* and *this session may touch it* was never made real on the backend. MITRE treats 282 as a parent class; for a controller that never evaluates policy at all, many incident write-ups map the same story to [CWE-862: Missing Authorization](https://cwe.mitre.org/data/definitions/862.html) — pick the narrowest label that matches your evidence, and refine as you learn. Your patch is the line that makes that boundary real — authorization as code, not as UI theatre — and your verification is the red-team script turning from *success* to *403*.

Since we've talked about CWE-282, let's move on to a more exciting case, shall we?

## When the Key is the Next Integer

Rarely does a Broken Access Control vulnerability travel alone in a product. Usually, due to insecure design and erroneous assumptions, when one is discovered &mdash; especially in cases such as the one we've been discussing &mdash; another is bound to exist. More often than not, patching one vulnerability may inadvertently patch another one &mdash; and that's why we need proper penetration testing: If the already fixed vulnerability resurfaces in a regression, everything that was coming with it, will return.

Let's go back to our scenario, to the SaaS that handles user files. Each file is uniquely identified by an ID. What could be more common than using a `BIGINT` for storing the primary key and using it as the file's identifier?

### Sequential IDs: 1, 2, 3, 4 — stairs, not secrets

Now, then, don't get me wrong; I don't **imply** that sequential IDs are bad: For starters they don't occupy much space on disk &mdash; just eight bytes &mdash; and they can be used for sorting the table in ascending or descending order when they are combined with `AUTO_INCREMENT`. They're a great tool, and that's why I **state** that they are **not** inherently bad.

So far, so reasonable &mdash; until you remember what our broken SaaS is actually missing. Let's go back to our example: An *authenticated* but *not authorized* user could download **any file** from the system. Thus they could start **enumerating** them at `1` and increasing this counter indefinitely. They'd pretty soon have an entire copy of the files you are *so securely* storing for your users.

Let's say hello to our new friend [CWE-639: Authorization Bypass Through User-Controlled Key](https://cwe.mitre.org/data/definitions/639.html).

### Insecure Direct Object Reference (IDOR)

Now we are getting serious: Any *authenticated* user has, virtually, unlimited access to **ALL** user files stored in the application. The application does not perform any check with regards to the user being **authorized** to view a file **plus** the files are linked to sequential IDs, which...

Ah, let's see a simple example here:

```shell
#!/bin/bash

FILE_ID="${1:-1}"

while true; do
    DOWNLOAD_URL="https://example.com/files/${FILE_ID}"
    curl -b "cookie-data" -H "x-csrf-token: your-token" -L -OJ "$DOWNLOAD_URL"
    FILE_ID=$((FILE_ID + 1))
done
```

Do you remember when I told you that *shit can hit the fan, faster than anyone can anticipate*? If you think that shit has really hit the fan, wait until I pull another ace from my sleeve. Just... not quite yet.

### YEAH, BUT, I NEED...

There are alternative approaches you should be aware of. In the same fashion you don't use `md5` any more for password hashing &mdash; I mean, I really hope you don't. Sequential integers are not wrong **when** authorization is bulletproof &mdash; but as **exposed** identifiers they make enumeration cheap the moment policy slips. You can switch to [ulid](https://github.com/ulid/spec) which:

- Is lexicographically sortable and allows you to easily perform an `ORDER BY id DESC`
- Includes 80 bits of randomness, which makes blind **enumeration** of valid IDs much harder than with a sequential counter. That is **defense in depth**, not a substitute for server-side authorization: if the backend still does not enforce *may this session touch this object?*, IDOR and broken access control remain.

However, next to an 8-byte `BIGINT` scalar, a canonical ULID string is 26 ASCII characters — **18 bytes longer** in that representation. (If you store the 128-bit value as binary, a ULID is 16 bytes.) Which may pose a problem, **if you still live in the 90s**.

Jokes aside, the only downside I've noticed, is when I have to perform a deep dive into a database, where I've got to paste long values, which I cannot check with a glance of my eyes &mdash; especially when the queries get more complex, it is painful.

Still, **fix authorization first** — opaque IDs do not close a hole the server never checks. Once policy is enforced correctly, prefer non-guessable identifiers (ULIDs or similar) so enumeration does not make a bad design trivial to exploit.

Basically, go for anything other than trivially sequential public keys when you want that extra friction — **after** access control is real on the backend.

## The "Uh-oh" Moment

It's almost 4PM and you haven't even touched your coffee &mdash; the situation is much worse than you've anticipated; even worse than you could possibly imagine. So, you are pen-testing this and you notice something strange: No matter how fast the bash script from above runs, the files are downloaded. No throttling, no crankiness from the servers' side, no nothing. The occasional CPU alarm here and there, but nothing that's not a part of the daily, alert fatigue routine.

So, you think to yourself: *What if I don't download one file after the other, but I get them in batches of 100?*

That's a very, very fine decision, a very wise one, because it fills your hard drive in a matter of seconds. What if a true attacker, a more sophisticated one than you, could just dump the files in an S3 bucket where they have virtually unlimited space, prior to allowing themselves to sift through them and find what they want, need or just mess around?

It's high time that we talk about rate-limiting.

### No throttle

Physics will tell you that you are not allowed to indefinitely accelerate; as you approach `c` the energy you need to overcome it is infinite. Same thing happens with computers; they have their limitations when it comes to disk and network throughput &mdash; and they, as well, are limited by the speed of light. But let's &mdash; for the sake of the argument &mdash; assume ideal conditions:

A sophisticated attacker &mdash; not the usual middle-school script kiddie &mdash; has absurd capacities in terms of network speed and disk storage: A 100 GBps connection and 2 PB of disk storage, just because they can.

Assuming that our system holds files in the order of some hundreds of terabytes, the attacker will need **less than a day** to dump our entire operation, if no throttling is applied at any level. Which can be catastrophic.

### No observability

While I cannot draw conclusions from mere assumptions, it is more likely than not that there isn't a robust observability mechanism in place. To rationalize my chain of thought here, and I hope that we can agree on this, *authorization* checks in the backend are cheaper (in terms of development effort) than implementing a *rate-limiting mechanism*, and the mechanism itself is way cheaper than building a highly sophisticated *observability system*, where you'll have an alert when it notices that there's an influx of requests from a single IP that can trigger a DoS warning or similar.

Observability, by itself, is not a *protection layer* &mdash; it is a *detection one*. How would you know when something has gone terribly wrong; for example, you are suffering an outage due to a Distributed Denial of Service attack? Lack of observability is the same as being blind; you know that something's there, but you cannot see it. And to an extent, you are not able to tell **what** it is.

### No usable trail

When you can't reconstruct a situation, you cannot fundamentally answer **what**, **when**, **how**, **for how long**, **how fast** &mdash; all these questions are equally important when you try to assess the damage an attacker dealt to your application. While it's nice to talk about writing code *security-first*, our developers being *security-aware*, and our architects *producing* *secure-by-design* specs, security is not a **magic** thing, not a **holy grail**. It's an amalgam of the things we do in our daily routines, the culmination of our failures and the sum of all the lessons we've learned on our paths.

An audit trail, proper logging and monitoring aren't *nice to have* &mdash; however, since I am a pragmatist, I'll say that there's a point in time when all these transform from soft, nice-to-have, things, to absolutely required tools in your belt.

### "We're not interesting"

Maybe you aren't. Maybe you won't be targeted. Maybe you're small enough. Maybe you'll flop. Nobody can tell.

However, your customers **may be interesting** for attackers. Your data, for reasons beyond the scope of this post **may be** targeted. Tomorrow you **will not** be small. You **may** reach S&P 500 one day. Nobody can tell.

The thought that you **may** not be the target of the next attack, malicious or not, is not pragmatism but **complacency**: You have a belief that may have applied in the past, but five years into the market with some hundreds or thousands of customers, you **may also be** a high-value **target**.

### Interaction frequency needs to be checked

[CWE-799](https://cwe.mitre.org/data/definitions/799.html) talks about this exact scenario: An actor allowed to perform actions more frequently than expected. In our case, where we have a File Service SaaS, why would someone require to download some thousands of files, in a very short amount of time? And moreover, how would a rate limiting mechanism constrain such an actor?

Rate-limiting should not only be imposed for security but for performance as well. Having someone *spamming* your APIs &mdash; literally abusing them &mdash; can cause issues to the infrastructure, your bill and potentially other customers, if you are in a multi-tenant system, such as the fictional system we are working on here.

Go easy on it, implement observability, see how many [429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429) responses you return. It would take its time but in the end, you'll have some more peace of mind &mdash; as important as a securely designed system.

## Security's not on the roadmap

Somewhere in a planning session, security earns a line on a slide &mdash; *Q3, hardening*, *after launch, backlog*, *nice-to-have when the core is stable*. As if incidents respect your quarter boundaries. As if *non-functional* were a polite synonym for *optional when we're busy*.

Don't get me wrong: roadmaps coordinate people and time. They don't grant immunity. Security is not the feature you ship when the *fun* features are done; it is part of what makes the product *legitimate* in the first place. The same instinct that keeps you from deferring *the database* to a future sprint is the one that should treat assurance as structure, not garnish.

What I have often seen under-taught in universities and bootcamps — your mileage will vary by program and region — is what the job now demands every day: **secure-by-design** &mdash; choices that still make sense when the diagram is outdated; **deny-by-default** &mdash; the closed door is the normal state until a rule opens it; **assume breach** &mdash; you build as if someone is already past the perimeter, because one day they might be. None of that arrives as a single dependency you add on Tuesday. It is a mindset you rehearse until it feels as obvious as running the tests before you merge.

After time, what people fight over is often *information*: credentials, health records, strategy, the quiet metadata that maps who talks to whom. If you sell *trust*, *reliability*, *enterprise-ready*, you are already selling security &mdash; not as a slogan, but as the promise that someone else's data will not become someone else's lesson. Skimping there is not efficiency; it is arguing with your own pitch.

Security is non-negotiable in the same way the integrity of your build is: not a checkbox for the auditor, not a paragraph copied into the RFP, but one of the foundations modern software stands on. Treat it as *truly* important &mdash; not another line item to tick and forget. Schedule it, review it, fight for it in design meetings when the room wants to move on. When you do, the roadmap stops being the place where security *appears* &mdash; it becomes the ledger of work you already assumed from day one.

> Not something you announce. Something you always uphold.
