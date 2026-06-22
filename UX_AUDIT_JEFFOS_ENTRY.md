# UX Audit — Selling JeffOS (the Recruiter → JeffOS entry)

> **Lens:** conversion-focused product/UX design.
> **Problem statement (from the brief):** the "Launch JeffOS" affordance in Recruiter Mode is **too subtle** — the goal is to **sell JeffOS** as the portfolio's signature flex.
> **Method:** audited all three entry points (sidebar, hero, mid-content callout) across desktop/tablet/mobile against the live render.
> **Scope:** audit + high-level design. (Implementation can follow.)

---

## The core finding: the hook is buried

JeffOS is **the most impressive, most differentiating thing in this entire portfolio** — a hand-built, 94/100-authentic macOS Tiger recreation with a windowing engine, Spotlight/Exposé/Dashboard, a real Finder, an emulator, a synth, an iPhone-OS mobile shell, a security-audited backend. *Nobody else's résumé has this.*

Yet in Recruiter Mode it is presented as the **lowest-priority element on the page.** The desktop sidebar CTA stack is:

```
┌─────────────────────────────┐
│  [ Schedule a Conversation ] │  ← primary (filled blue)
│  [ View Projects ]           │  ← secondary (outlined)
│   Launch JeffOS ↗            │  ← TERTIARY — tiny grey text link
└─────────────────────────────┘
```

So the visual hierarchy says: *"the OS is a footnote."* A recruiter scanning for 5 seconds has **no idea** that "Launch JeffOS ↗" opens a full operating system — it reads like a minor external link. **The hierarchy is inverted: the thing that wins the interview is dressed as the thing you'd ignore.**

### Why this is the wrong call (design rationale)
- **Differentiation beats convention.** "Schedule a Conversation" and "View Projects" are on every portfolio. JeffOS is on exactly one. The unique asset should get the spotlight, not the generic CTAs.
- **The medium IS the proof.** Telling a recruiter "I build production systems" is a claim. Letting them *boot an OS you wrote* is the proof. The CTA should make them want to click it — that click is the conversion.
- **Curiosity is the strongest driver here.** A recruiter doesn't *need* to schedule yet — they need a reason to remember you. "Launch JeffOS" is that reason, but only if it looks like an invitation, not a footnote.

---

## Audit of the three current entry points

| # | Location | Current treatment | Verdict |
|---|----------|-------------------|---------|
| 1 | **Sidebar** (desktop) | Tertiary grey text link "Launch JeffOS ↗" under two buttons | 🔴 Buried — weakest element on the page |
| 2 | **Hero** (tablet/mobile) | Same tertiary grey text link "Launch JeffOS →" | 🔴 Buried |
| 3 | **JeffOSCallout** (mid-content) | An accent-outlined button "Explore JeffOS — my macOS Tiger recreation" inside a card, ~2 scrolls down | 🟡 Better, but below the fold and after the résumé content — most recruiters never reach it |

**Net:** the strong pitch (#3) is hidden far down; the above-the-fold entries (#1, #2) are the weak ones. Exactly backwards.

---

## High-level design — make JeffOS the hero invitation

The goal isn't to scream; Recruiter Mode is deliberately calm and credible. It's to **promote JeffOS from "footnote" to a confident, above-the-fold invitation** that *sells the click* — while keeping "Schedule" as the business conversion.

### Move 1 — Promote the sidebar entry to a first-class, distinctive CTA
Replace the tertiary text link with a **bordered, slightly tactile "OS-chrome" button** that names the flex and hints at the payoff. It should look clearly *clickable and special* — distinct from the two standard CTAs so it reads as "the cool thing," not "a third button."

```
┌─────────────────────────────────────┐
│  [ Schedule a Conversation ]         │  primary (unchanged)
│  ┌─────────────────────────────────┐ │
│  │ ▩  Launch JeffOS                │ │  ← NEW: framed, iconified,
│  │    my macOS Tiger desktop, live │ │     two-line, subtly glossy.
│  └─────────────────────────────────┘ │     "Sells" the OS.
│   View Projects                      │  ← demote to the quiet link
└─────────────────────────────────────┘
```
- Add a tiny **OS glyph / traffic-light motif** so it visually previews "this is an OS."
- Subline: *"Boot my macOS Tiger desktop — built from scratch."* Names the payoff.
- This makes JeffOS the **#2 visual priority** (after Schedule), and demotes "View Projects" to the quiet tertiary slot (projects are *also* reachable inside the section nav + the Featured Work section, so nothing is lost).

### Move 2 — An above-the-fold hook line near the headline
One quiet line under the hero subtitle (desktop content lead + mobile hero), e.g.:
> *"PS — this whole site is a macOS Tiger desktop I built. [Take it for a spin →]"*

A single sentence, low-key, but it plants the idea **before** the recruiter scrolls — turning the OS from a hidden easter egg into an explicit, intriguing offer. The link shares Move 1's handler.

### Move 3 — Keep & strengthen the mid-content callout (#3)
It's good; leave it as the deep-dive pitch for readers who scroll. Optionally add a **1–2 frame static preview** (a small screenshot of the Tiger desktop) so the card *shows* instead of only *tells* — a thumbnail of the OS is worth a paragraph.

### Move 4 — Mobile parity
On mobile, the same promoted CTA belongs **in the Hero** (top of Home), not only in the callout far below. A phone user should see the "Launch JeffOS" invitation in the first viewport, styled as the distinctive OS button.

### What NOT to do
- ❌ Don't make it a full-bleed flashing banner — that cheapens the calm, senior-engineer tone and competes with "Schedule."
- ❌ Don't auto-launch JeffOS or interstitial-gate it — the Recruiter-first default is the right product decision; this is about the *invitation*, not forcing the OS.
- ❌ Don't remove "Schedule" as primary — booking is still the business goal; JeffOS is the *memorability/credibility* driver that makes them want to book.

---

## Priority

1. **🔴 Move 1** — promote the sidebar/hero "Launch JeffOS" to a distinctive, OS-flavored CTA (the #2 priority element); demote "View Projects" to the quiet slot. *Highest impact, smallest change.*
2. **🟡 Move 2** — the above-the-fold hook line near the headline.
3. **🟢 Move 4** — ensure the promoted CTA is in the mobile Hero (first viewport).
4. **🟢 Move 3** — add a small Tiger-desktop preview thumbnail to the callout card.

The one-sentence version: **stop hiding the best thing you built.** Make "Launch JeffOS" look like the invitation it is — the click that turns a skim into "wait, he built an *operating system*?" — and that's the moment that wins the interview.

---

*Audit against merged `main`. Live evidence: `cta-desktop` (sidebar CTA stack), `cta-mobile-home`, `cta-mobile-callout`. Analysis & high-level design only — no code changed in this pass.*
