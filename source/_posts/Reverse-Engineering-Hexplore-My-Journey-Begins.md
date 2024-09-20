---
title: 'Reverse Engineering Hexplore: My Journey Begins'
tags:
  - Baby Steps
  - Reverse Engineering
  - Assembly
  - Ghidra
  - C++
categories:
  - Reverse Engineering
  - Hexplore
date: 2024-09-20 11:44:47
---


Recently, I came across a game that's nearly a quarter of a century old: [Hexplore](https://www.gog.com/en/game/hexplore). It's an Action / Adventure game with RPG elements and the GOG description reads:

> Immerse yourself in a medieval world. A world where Garkham, Grand Master of the Black Magicians, has sworn to take possession of the Book of Hexplore. From this moment, the whole world is in great peril. For this manuscript will most certainly lead those who find it to the Garden of Eden, resting place of the Divine Power.

![Hexplore Screenshot](./images/hexplore.jpg)

Back in those days, I was the proud owner of an AMD K6 with a super-noisy 2GB hard drive, 32MB of RAM, and a VGA card capable of displaying 256 colors at 640x480 resolution on a 14-inch CRT monitor. Now _that’s_ what I call a gaming setup!

Nostalgia aside, it’s a game I spent countless hours playing, fighting monsters and solving riddles and puzzles. It was nowhere near Diablo, either in terms of hack-and-slash combat or RPG elements, but it had its moments. Over the years, I’ve revisited it occasionally &mdash; not just for nostalgia, but for its unique design and gameplay.

Unfortunately, even with its GOG re-release, the game feels nearly unplayable on modern systems. It was designed for 640x480 resolution with 256 colors, and as you can imagine, running that on a 32-inch 4K monitor is far from ideal.

So, I thought:

> _Can I do something about it?_

Being me, with my crazy ideas about impossible things, I figured I _might_ be able to make the game playable again. Unfortunately, this is a long and difficult project that could take years, and the most likely outcome is that it may never be finished. But I’ve started. And this is my journal of reverse engineering a 90s game.

## First things first: Baby Steps

It’s been a very long time since I last touched C++ or read x86 Assembly. To tackle a project like this, you not only need a copy of [Ghidra](https://ghidra-sre.org/), but you also need to know a thing or two about how those ~~magnificent~~ hellish machines, operating systems, and APIs work. Being a firm believer in RTFM[^1], I knew I had to start by getting my hands on some good documentation.

> Enter the world of software archaeology

Hexplore was released in August 1998, the same year as Windows 98. Given that the company that developed the game was formed around [1996](https://rpgwatch.com/developers/heliovisions-productions-1069.html) and that the typical development cycle for a game was around one year[^2], I estimate that it took about 12 to 18 months to develop. So, we can safely say that development likely began in late 1996 or early 1997.

Assuming they used whatever cutting-edge technology was available at the time, we can make the following guesses:

1. There was no [MMX](https://en.wikipedia.org/wiki/MMX_(instruction_set)) or [3DNow!](https://en.wikipedia.org/wiki/3DNow!); the world ran on the good old x86-32 instruction set.
2. Development was likely done on Windows 95/NT4, as both were released in 1995.
3. The code was probably written in Visual C++ 4.0, which was released in late 1995.
4. The game probably uses Microsoft's DirectX 5.0.

For the time being, we need the following resources:

- [x86 Instruction Set](https://www.felixcloutier.com/x86/) (_I don’t suggest Intel’s or AMD’s PDFs, as they are ginormous._)
- [Win32 API](https://learn.microsoft.com/en-us/windows/win32/api/)
- [DirectX 5 Documentation](https://library.thedatadungeon.com/directx5/)

Also, I should get a [book](https://www.amazon.com/x64-Assembly-Language-Step-Step-dp-1394155247/dp/1394155247) or [two](https://www.amazon.com/Learn-Program-Assembly-Foundational-Programmers/dp/1484274369/) on x86 Assembly. Besides the instruction set, I need to understand how things work in order to reverse-engineer and rewrite them effectively.

And thus, armed with the forbidden manuscripts, patience, and a cup of coffee, I'll delve into the ancient art of reverse engineering. For it is not enough to merely read the cryptic runes of `REPNE SCASB ES:EDI` from dusty tomes of knowledge; no, I must grasp their very essence, to unweave the fabric of the machine and forge it anew in a higher tongue. Only then can I hope to resurrect the relics of the past, breathing life into the forgotten code once more.

## The lair of Ghidra

For the record, let me state that I am not a beginner in either reverse engineering or assembly. I had a pretty solid knowledge of how _stuff_ works. And I’m using the past tense because I haven’t touched either assembly or reverse engineering in a very long time. Yet, I still remember a trick or two.

Ghidra, besides being a [disassembler](https://en.wikipedia.org/wiki/Disassembler), is also a [decompiler](https://en.wikipedia.org/wiki/Decompiler). It can not only translate machine code into Assembly, but it can also (try to) reconstruct a C representation of the program we are working on. This is both a curse and a blessing.

### Blessings...

It’s a blessing for those of us who can use our heads as a C interpreter &mdash; _shift by eight bits and **and** it with `0xff`_ &mdash; however, the following simple snippet requires a translator for those who are not accustomed to reading assembly:

```assembly
MOV ECX, 0x08
SHR EAX, ECX
MOV ECX, 0xff
AND EAX, ECX
```

### ...and curses

And it’s a curse, a terrible curse that can sometimes frustrate you so much that you’ll want to punch your shiny, curved screen right in the middle. I won’t tell you the reason before giving you a real-life example that I’ve come across countless times:

```assembly
MOV EDI, dword ptr [PTR_DAT_00590108]
OR ECX, 0xffffffff
XOR EAX, EAX
MOV dword ptr [ESP + local_248], EDI
REPNE SCASB ES:EDI
NOT ECX
DEC ECX
MOV EBP, ECX
```

Let's see, what does this do?

The first four instructions are not a big deal; we load the value of a pointer into the `EDI` register, we 
set the `ECX` register to `0xffffffff`, we clear the `EAX` register and we move the value of `EDI` into our stack, on the position specifed by `ESP + local_248`. However, the fifth instruction is pretty interesting. It [scans](https://www.felixcloutier.com/x86/scas:scasb:scasw:scasd) a byte in `EDI` and compares it with the value stored in `AL`. It [repeats](https://www.felixcloutier.com/x86/rep:repe:repz:repne:repnz) that scanning until either the zero flag (`ZF`) is set or `ECX` is 0. 
Does it start making sense?

After scanning the string, it `NOT`s the `ECX` register and decrements it by one, effectively giving us the number of bytes the string contains, or simply `strlen`.

But why, Ghidra, doesn’t it simply translate this to `strlen` and instead translates it to (more or less) the following gibberish?

```c
uVar1 = 0xffffffff;
local_248 = (WCHAR *)PTR_DAT_00590108;
pcVar10 = PTR_DAT_00590108;
do {
    if (uVar1 == 0) break;
    uVar1 = uVar1 - 1;
    cVar7 = *pcVar10;
    pcVar10 = pcVar10 + 1;
} while (cVar7 != '\0');
pCVar9 = (LPSTR)(~uVar1 - 1);
```

It’s quite possible that the compiler performs aggressive optimization by inlining the `strlen` function (i.e., replacing the function call with the body of the function), which effectively eliminates the overhead of calling the function. Alternatively, it could be due to decompilation limitations, which may not map the assembly code directly to a function call. Whatever the case, we know that we cannot truly rely on the decompiler and definitely need to understand assembly.

That's where a reference to assembly instructions comes in handy &mdash; and more than that, it is the go-to resource when something doesn’t make any sense.

## Verifying our claims

After loading and analyzing the executable, we can see that Ghidra has identified a couple of VC++ library functions, such as `_strlen`, `_memcmp`, and `_rand`. This strongly indicates that the game was written in C/C++ and compiled with Microsoft's compiler. The exact version is not known, but it is likely one of Visual C++ 4.0, 5.0, or 6.0. And since the world hadn't yet discovered the marvels of [SIMD](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data), we’ll be working with fewer instructions, fewer registers, and less complex stuff. _Everything is awesome!_

By navigating Ghidra's **Symbol Table**, we can see calls to `DirectDrawCreate` (that's DirectX's DirectDraw 😉), `DirectSoundCreate` (🎧), `_SmackOpen` (that's [Smacker Video](https://en.wikipedia.org/wiki/Smacker_video) 🎥), and various other Win32 API calls. Hexplore also uses [SecuROM](https://en.wikipedia.org/wiki/SecuROM), and I'm sure I'll find some code related to it as well.

With our resources ready to be consumed, the executable disassembled, and a fresh cup of coffee, we are ready to get into some serious software archaeology and reverse engineering. But before diving deep into the obscure world of x86, let's cover a few final things &mdash; which, I believe, I should have stated earlier in this post.

## What now?

As you have undoubtedly guessed, this is the first part in a series of posts focused on both reverse engineering and the methods used to understand and re-implement something, as well as on the specific game &mdash; which I enjoyed playing both as a kid and as an adult. The posts will follow a _diary format_. I do not intend to write a book on RE, nor tutorials on the subject. I merely want to document a long journey I’ve decided to embark upon in order to expand my knowledge, have some fun tinkering with an old game, and, why not, produce something useful &mdash; either for myself or for others.

This journey had some milestones set from its inception stage &mdash;that is, when I first thought, _why not reverse engineer Hexplore?_. The first milestone has been reached: researching the resources I’ll need to start working on it. I might not know everything, and I am sure weird things will come up along the way, but I have a solid stash of information I can use to understand and re-implement the things I want to. Hexplore uses a [voxel](https://en.wikipedia.org/wiki/Voxel) engine, which (most probably, needs to be verified) was implemented in software. Considering the limitations of the software and hardware that existed back then, everything was new: 32-bit Windows, DirectX, hardware accelerators (nVidia’s Riva, 3dfx’s Voodoo, and ATI’s RAGE are some examples) were just becoming affordable for home computers—you name it. _Could I re-implement this voxel engine in a modern API, say, Vulkan?_

I honestly don't know. Thus, I’ve set the project's milestones and will try to reach them:

- [X] Investigate the game and gather necessary resources for reverse engineering
- [ ] Reverse engineer the game's data file formats and produce documentation for them
- [ ] Craft tools for viewing (and possibly manipulating) the game's assets
- [ ] Imagine something bigger.

Understanding the game's data file formats, although it sounds simple, will be both a difficult and time-consuming task &mdash; as such, it must not be underestimated. I've already started looking into the files that hold the game's texts (i.e., the `st1` files) and made some progress, but that's a story for another post.

## Closing words

The next time we meet, I'll be making a deep dive into the game's data file formats. Expect some frustration, as the developers have taken some clever measures against people like me (which is not unheard of). We'll also get our hands dirty with some C++, talk about developer decisions, and continue our journey into the abyss. And as those who have played Hexplore vividly remember:

> You must gather your party before venturing forth.

[^1]: Read(ing) the fucking manual.
[^2]: id Software began working on Doom [after the release of Spear of Destiny](https://5years.doomworld.com/interviews/johnromero/), and the game was released on [December 10, 1993](https://en.wikipedia.org/wiki/Doom_(1993_video_game)).
