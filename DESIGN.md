# Design System — Novus Classes

**Status: FINAL. Approved for implementation.** This is the source of truth for all visual and UI decisions on this project. If code disagrees with this document, the code is wrong, fix the code or raise the conflict, don't silently drift.

## Product Context

- **What this is:** A JEE/NEET coaching operations platform (novusclasses.in). Public marketing/browse site plus four dashboards: Admin, Teacher, Student, Parent.
- **Who it's for:** Primarily Indian JEE/NEET students (15-19, mobile-first, exam-stressed, budget-aware) booking sessions with verified teachers. Secondarily parents (older, less tech-fluent, the actual payer, trust-motivated) and teachers/admin (internal power users who tolerate denser UI for efficiency). Student-first was the explicit design priority; parent, teacher, and admin surfaces inherit the same system at higher information density.
- **Space/industry:** Indian JEE/NEET coaching marketplace. Category leaders (Physics Wallah, Unacademy) converge on purple/violet accents, stock cartoon-illustration heroes, and cluttered stat walls. This system deliberately does not compete in that visual register.
- **Project type:** Hybrid, creative-editorial marketing/browse pages, grid-disciplined operational dashboards. Every surface is responsive web (mobile browser + desktop browser), there is no separate native app in scope, "phone" means mobile web.
- **Reference sites:** pw.live, unacademy.com (category baseline, deliberately avoided), mathacademy.com (copy structure: direct claim, comparison-vs-alternatives, objection-handling FAQ, audience segmentation), cred.club and linear.app (visual rhythm: concentrated moments of contrast and color against an otherwise restrained canvas, not evenly distributed decoration).

## Aesthetic Direction

- **Direction:** Working Tool, Not a Toy. JEE/NEET students are quantitative and already comfortable with dev-tool-grade software (GitHub, LeetCode). Treating Novus Classes like serious software rather than a cutesy EdTech consumer app sidesteps the category's visual clichés instead of competing inside them.
- **Decoration level:** Concentrated, not evenly distributed. No custom illustration anywhere (illustration was tried repeatedly during design review and never landed, see Decisions Log). Instead, restraint is the baseline and richness happens in a small number of deliberate high-contrast moments: a full-bleed dark stats band, a full-bleed dark editorial "manifesto" passage, and a one-time bold color-splash testimonial pair. Everything else (dashboards, forms, browse grids) stays calm. This is the single biggest lesson from this design process: uniform restraint reads as bland, uniform decoration reads as noisy, the system that actually works is mostly-restrained with two or three genuinely bold beats.
- **Mood:** Confident, direct, unfussy, with real moments of drama. Should feel like it respects the user's time and intelligence, not trying to charm them with cartoon mascots, but also not afraid to be visually assertive at the right moments.
- **The memorable thing:** A verified teacher, booked in two minutes, no WhatsApp chaos.

## Brand Mark

- **Mark:** a rounded-square lettermark, the letter "N" set in Plus Jakarta Sans weight 800, white on the emerald accent (`#0F7A52`). Square viewBox 48x48, corner radius 11 (matches the system's `lg` card-radius ratio). Deliberately not an illustrated icon, same reasoning as the rest of the system: no custom illustration, typography carries the identity.
- **Lockup:** mark + wordmark, "Novus" in ink (`#101113`), "Classes" in the accent color, both weight 800, tight tracking (-0.4 letter-spacing). This is the nav/header treatment, already reflected in `design/preview.html`.
- **Files (all in `design/logo/`):**
  - `mark.svg` — icon only, emerald background, white N. Use for favicon and app icon. Legible down to 16px.
  - `mark-mono.svg` — icon only, ink background, cream N. Use on dark surfaces where the emerald mark would clash, or for single-color print contexts.
  - `lockup.svg` — full horizontal lockup, light mode. Primary nav/header logo.
  - `lockup-dark.svg` — full horizontal lockup using the dark-mode token values (`#3DBE8B` mark/accent, `#F0EFEA` wordmark ink). Swap in when `data-theme="dark"` is active.
- **Production note:** these SVGs use live `<text>` with a Plus Jakarta Sans / system-sans-serif fallback stack, which is fine for in-app rendering (the font is already loaded site-wide) but is not reliable for contexts that rasterize without loading webfonts (favicon.ico generation, app-store icon export, email client rendering). Before generating those specific assets, convert the text to outlined vector paths in a design tool (Figma "Outline stroke" / Illustrator "Create outlines") so the glyph doesn't depend on font availability. Don't skip this for the actual favicon.ico / apple-touch-icon, a missing-font fallback there would silently render the wrong letterform.
- **Never:** stretch, recolor outside the documented mark-mono/dark variants, add a drop shadow or gradient to the mark, or pair the wordmark with any icon other than the N mark.

## Typography

- **Display/Hero:** Plus Jakarta Sans, weight 800. Already shipped in this codebase, no new font dependency. Do not introduce a second display typeface (Fraunces and Cabinet Grotesk were both tried and rejected during design review, one family reads as more coherent than three).
- **Body:** Plus Jakarta Sans, weight 500 (400 for dense paragraph text if 500 feels heavy at small sizes).
- **UI/Labels:** Plus Jakarta Sans, weight 600-700.
- **Data/Tables:** IBM Plex Mono, tabular figures. Use for ranks, percentiles, prices, session counts, timestamps, and anywhere a number needs to feel precise and scannable, not decorative. Also used at large display scale as a graphic device in the stats band (see Component Patterns), numbers are allowed to be the visual centerpiece, not just data.
- **Code:** IBM Plex Mono (shared with data, no separate code font needed at this project's scale).
- **Loading:** Google Fonts only: `family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700`. No other font CDN (Fontshare was tried for a display font and dropped along with that direction, don't reintroduce it).
- **Scale (desktop / mobile under 720px):**
  - Hero headline: 68px/800, line-height 1.0, letter-spacing -0.035em → 40px/800 on mobile
  - Manifesto/editorial passage: 30px/500, line-height 1.5, centered → 22px on mobile
  - Proof-band stat numerals: 72px mono/700 → 56px on mobile
  - Section title: 32px/800, letter-spacing -0.02em (same on mobile, sections just get narrower)
  - Card title: 16-18px/700
  - Body: 16-18px/500
  - Small/meta: 13-14px/500
  - Micro-label (mono, uppercase, tracked): 11-12px/600

## Color

- **Approach:** Restrained core palette (ink, paper, one accent) plus exactly one documented exception used exactly once (the testimonial gold splash, see below). Nothing else introduces a new hue.
- **Ink (text):** `#101113` — dark mode `#F0EFEA`
- **Background:** `#FAF9F5` (warm off-white, never stark `#FFFFFF` as the page background) — dark mode `#121214`
- **Surface (cards):** `#FFFFFF` — dark mode `#1A1A1D`
- **Surface sunken (nested/inset elements):** `#F2F1EA` — dark mode `#201F22`
- **Line (borders):** `#E4E2D8` — dark mode `#2E2E31`
- **Accent (brand + verified/success, one color doing both jobs deliberately):** `#0F7A52`, hover/active `#0B5E3F`, tint `#E3F1EA` — dark mode `#3DBE8B` / `#59D3A2` / `#123526`
- **Warning:** `#8F5F08` on tint `#FBF0DC` (darkened from an initial `#B8790A`, which only cleared 3.2:1, AA-fail at body text size) — dark mode `#E0A94D` / `#332812`
- **Error:** `#C23B2B` on tint `#FBEAE6` — dark mode `#E28873` / `#331A14`
- **Ink-soft (secondary text):** `#55585E` — dark mode `#B7B5AC`
- **Proof/manifesto band colors (the dark contrast beats):** background `#101113`, foreground `#FAF9F5`, foreground-soft `rgba(250,249,245,0.62)`, accent-on-dark `#3DBE8B`. In dark mode these invert (`#F0EFEA` / `#101113` / `rgba(16,17,19,0.6)` / `#0B5E3F`) so the band is always the contrast moment relative to whatever the page background currently is, never the same color as the surrounding page.
- **The one-time gold splash `#F0B429`:** used on exactly one element, the second testimonial card background, with `#101113` ink text. Not a system color, do not reuse it on buttons, badges, charts, or anywhere else. Its entire value comes from being rare (this is the Linear technique: one bold color moment against an otherwise monochrome system reads as intentional; the same color used twice starts a palette debate). If a second use case for "bold contrast card" comes up later, that's a real design decision to make explicitly, not a default to reach for.
- **Rejected during review, do not reintroduce without explicit sign-off:** oxblood/maroon (`#7A2530`, read as an AI-design cliché), cobalt blue (`#2451C4`, didn't cohere with the rest of the system), orange (already migrated away from earlier in this project's history), gold/silver/bronze as a *general* palette (was tied to a podium concept that got cut, don't confuse this with the single approved gold splash above, that one is scoped to exactly one card).
- **Dark mode:** Supported via `[data-theme="dark"]` attribute toggle only. **Light is the hard default,** do not auto-switch on `prefers-color-scheme`, that was tried and explicitly reverted. Dark mode is opt-in.

## Accessibility

Verified WCAG contrast ratios (calculated, not eyeballed) for every color pairing used in the system:

| Pair | Ratio | Result |
|---|---|---|
| Ink on background (body text) | 17.9:1 | Pass AA |
| Ink-soft on background | 6.8:1 | Pass AA |
| White on accent (primary button) | 5.4:1 | Pass AA |
| Accent on accent-tint (badges) | 4.6:1 | Pass AA |
| Accent on background (section labels) | 5.1:1 | Pass AA |
| Red on red-tint (error alert) | 4.6:1 | Pass AA |
| Warning (`#8F5F08`) on warning-tint | 4.9:1 | Pass AA |
| White on accent-dark (button hover) | 7.8:1 | Pass AA |
| Ink on gold splash card | 10.1:1 | Pass AA |
| Proof-fg on proof-bg (stat labels) | 17.9:1 | Pass AA |
| Proof-accent on proof-bg (huge stat numerals) | 8.0:1 | Pass AA |

Given the parent audience skews older and less tech-fluent, and the product is forms-heavy (auth, booking, admin CRUD), accessibility is not optional polish here:
- Every interactive control needs a visible focus state (not just `outline: none` with nothing replacing it).
- Form errors must be announced (`aria-live` or equivalent), not color-only.
- The verified/success accent color must never be the sole signal, pair it with the word "Verified" or a check icon, not just green.
- Recommend installing the `fixing-accessibility` Claude Code skill (see Implementation Notes) before the first real accessibility pass on booking and auth flows.

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable on marketing/browse pages, compact-comfortable on the four dashboards (data-dense but not cramped).
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)
- **Section rhythm:** ~60-70px vertical padding between standard sections, 90-100px on the two full-bleed dark bands (they need more room to read as deliberate pauses, not just another section).

## Layout

- **Approach:** Hybrid. Grid-disciplined for Admin/Teacher/Student/Parent dashboards (predictable, scannable structure for schedules and data). Creative-editorial on the public marketing/browse pages, including two full-bleed (viewport-width, not container-width) dark sections that break out of the standard max-width container. Full-bleed sections must be actual siblings of the container at the DOM level, not nested inside it, nesting them inside the max-width wrapper silently clips them to 1080px and defeats the point (this happened once during design review and was caught in QA, watch for it in implementation too).
- **Grid:** 12-column on desktop, single column under 720px.
- **Max content width:** 1080px for marketing sections and for the inner content of full-bleed bands.
- **Border radius:** sm 8px (buttons, inputs), md 10px (swatches, stat tiles), lg 14px (FAQ container, dashboard panel), xl 16px (primary product cards like teacher listings, testimonial cards), full 999px (badges, pills, theme toggle).
- **Mobile (under 720px):** hero collapses to single column, hero headline drops to 40px, device mockup stacks below the copy, proof-band and testimonial grids drop to single column, manifesto text drops to 22px. Test the two full-bleed dark bands specifically on mobile, they're the highest-risk elements for looking cramped at narrow widths since they carry the largest type in the system.

## Motion

- **Approach:** Minimal-functional, with two exceptions. This audience is stressed and exam-focused, don't make them wait on animation, no scroll-driven choreography, no decorative entrance animations on most of the page.
  - Exception 1: buttons and teacher cards get a real hover state, subtle lift + shadow deepen (150ms ease-out). Small, but it's the difference between a page that feels built and one that feels like a static mockup.
  - Exception 2: the two full-bleed dark bands are allowed a subtle entrance (fade/slight rise on scroll into view) since they're the two deliberate "moment" beats in the page, everything else stays static.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- If deeper motion polish is wanted later, the `12-principles-of-animation` and `fixing-motion-performance` skills exist for that, but they're optional, not a gap in this system.

## Copy Voice

Modeled on Math Academy (direct, benefit-first) and Cred (short cascading lines for the manifesto-style passage), not on category peers:
- Direct claims, not hedged marketing language. State the benefit, then back it up.
- Name the real alternatives being replaced (WhatsApp forwards, agents who take a cut, six-month lock-in packages) instead of vague "better experience" claims.
- FAQ sections do real objection-handling ("Is the teacher actually verified?"), not generic Q&A filler.
- The manifesto passage uses short, single-clause lines with line breaks, not a dense paragraph, that's a deliberate pacing device for the one place in the page meant to be read slowly.
- Testimonials should sound like a specific person, not marketing copy: a concrete before/after ("mock scores went from 62 to 91") beats a generic superlative ("amazing teacher!").
- No em dashes, anywhere, in any copy this system produces. Use periods, colons, or the middle dot (·) for inline separators instead.
- Avoid "Built for X" / "Designed for Y" as section-heading templates, it reads as generic AI marketing copy. Prefer specific, direct phrasing ("Who Novus Classes is for" beats "Built for three kinds of families").

## Component Patterns

**Teacher card** (browse grid, listings, search results): avatar, name, subject/exam line, an expertise-tags row, then price and star rating. Deliberately does **not** show a raw session count ("312 sessions"). A volume metric reads like a gig-economy trust signal (Uber trip count), which undersells what a JEE/NEET parent or student actually wants to know: is this teacher strong in the specific chapter my kid is stuck on. Instead, teachers tag 2-3 areas of expertise they add themselves (e.g. "Rotational Mechanics," "Organic Chemistry," "Genetics," "Human Physiology"), rendered as small pill chips (`.expertise-tag`: 11px/600, `surface-sunken` background, `line` border, `ink-soft` text, not accent-colored, informational not status). Star rating stays. 3px accent-colored top border on the card. Hover: lift 3px, deepen shadow.

**Proof band** (sits directly under the hero, full-bleed dark): three huge IBM Plex Mono numerals (72px/700, e.g. "2 MIN," "₹299," "100%") each with a short caption underneath in `proof-fg-soft`. Numbers are the graphic device, no icons needed. Subtle grain/noise texture overlay (SVG feTurbulence, low opacity, `mix-blend-mode: overlay`) for tactile depth rather than a flat color fill.

**Manifesto band** (full-bleed dark, positioned further down the page, after the first comparison section): a single centered editorial passage, 30px/500, short cascading lines via `<br>`, not a paragraph. One phrase at the end gets bolded in the accent-on-dark color for emphasis. This is the "read this slowly" beat, don't add competing elements (buttons, images) inside it.

**Testimonial pair** (two cards, side by side on desktop, stacked on mobile): one card in the brand accent (`#0F7A52`, white text), one in the one-time gold splash (`#F0B429`, ink text). Real-sounding quote plus a small mono-font attribution line. This is the only place in the system where two saturated background colors appear side by side, that contrast is the point, don't soften it by adding a third neutral card into the same row.

## Implementation Notes (for the coding agent)

1. **Rebrand from "EduConnect" to "Novus Classes."** `app/layout.tsx`, `app/page.tsx`, and email templates in `lib/emails/` currently say EduConnect and reference `educonnect.in`. Replace with Novus Classes (display copy, title case, space) / novusclasses.in (the literal domain/URL, no space) throughout. Don't mix the two, "novusclasses" as a mashed-together lowercase display string was an earlier mistake, corrected in this final version.
2. **Replace the current orange CTA system.** `app/page.tsx` still uses `orange-600` for the primary CTA despite the project having already moved logo/stats-bar to slate. Fully migrate to the ink/paper/accent system above, don't leave a third color scheme half-applied.
3. **Font loading:** swap the current single Plus Jakarta Sans weight-load in `app/layout.tsx` for the fuller weight range (400/500/600/700/800) plus IBM Plex Mono. No new font vendor.
4. **Reference preview file:** `design/preview.html` in this repo is the visual source of truth alongside this document. Open it directly in a browser (`open design/preview.html`). It shows the complete system: hero, proof band, comparison block, manifesto band, testimonial pair, FAQ grid, audience segments, browse-teachers grid, and student dashboard, in both light and dark mode (toggle button, bottom-right). It's a static HTML file, not componentized, treat it as a pixel/spacing/color reference, not shippable code.
5. **Recommended Claude Code skills** (from ui-skills.com, install with `npx ui-skills add <name>` if not already present): `frontend-design` (Anthropic, keeps implementation off generic-AI-aesthetic patterns), `fixing-accessibility` (ARIA/keyboard/focus/contrast/forms, matters given the parent audience and forms-heavy flows), `emil-design-eng` (component/animation/polish craft reference). Consider `shadcn` if dashboard primitives (dialogs, dropdowns, comboboxes) get rebuilt rather than hand-rolled, Radix-backed accessibility comes close to free that way, a judgment call for whoever implements the dashboards.
6. **Four surfaces, one system, different density.** Don't design Admin/Teacher/Parent from scratch, reuse the same tokens (color, type, radius, spacing) as Student, just tighten spacing and increase information density since those are internal power-user surfaces. The two full-bleed dark bands and the testimonial splash are marketing-page-only devices, don't carry them into the dashboards, that would dilute them into decoration instead of moments.
7. **Data model implication:** the expertise-tags pattern (see Component Patterns) needs a backing field on `TeacherProfile`, e.g. `expertiseTags: string[]`, editable by the teacher in their profile/onboarding flow. Not yet in the Prisma schema as of this writing, flag it for whoever scopes the teacher-profile work, don't let it get silently dropped between design and implementation.
8. **Mobile is not optional.** This audience books sessions on a phone between study blocks (see Product Context). Every component in this document has an explicit mobile behavior specified (Typography scale, Layout). Build and test mobile-first, not desktop-first-then-shrink, the full-bleed dark bands and the giant hero type are the parts most likely to break first at narrow widths.
9. **Full-bleed sections need real QA**, not just a visual glance. Confirm in the browser inspector that `.proof-band` and `.manifesto-band` span full viewport width (100vw effectively, via being a direct child of `<body>`/outside the max-width container) at both mobile and desktop widths, this exact bug (nested inside the wrapper, silently clipped) happened once during design review.
10. **Wire up the favicon and app icon.** Use `design/logo/mark.svg` (after the outline-conversion step noted in Brand Mark) for `app/favicon.ico` and any `apple-touch-icon` / `manifest.json` icon entries. Next.js App Router picks up `app/icon.svg` automatically if present, that's the simplest path, an SVG favicon needs no separate generation step for browser tabs (though still convert to outlines per the Brand Mark note, some browsers rasterize the tab icon without loading webfonts even for inline SVG).

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-15 | Initial design system proposed: oxblood/maroon + Fraunces serif + ASCII line-art hero | First pass, aesthetic direction "Exam Room Modern" |
| 2026-07-15 | Rejected oxblood/maroon | User flagged it as an obvious AI-design cliché |
| 2026-07-15 | Rejected podium/dot-matrix ASCII hero, cobalt blue, Cabinet Grotesk | User feedback: "things are not fitting together," referenced Browserbase.com and Math Academy as inspiration |
| 2026-07-15 | Attempted Icarus dot-matrix illustration + reframed quote | Direct user request, reframed to remove death/regret imagery for a teen audience |
| 2026-07-15 | Full reset: dropped all custom illustration, dropped multi-font display treatment, single accent color (`#0F7A52`) doing brand + success duty, one type family (Plus Jakarta Sans) + mono for data | Explicit instruction to stop iterating on prior references and apply independent design judgment |
| 2026-07-15 | Darkened warning color from `#B8790A` to `#8F5F08` | Original only cleared 3.2:1 contrast against its tint background, AA-fail at body text size |
| 2026-07-15 | Retitled "Built for three kinds of families" to "Who Novus Classes is for" | Matched anti-slop guidance against "Built for X" marketing-copy templates; also mirrors Math Academy's proven heading structure |
| 2026-07-15 | Fixed missing charset on the static preview file (mojibake on ₹, ★, ·) | `<meta charset="UTF-8">` was missing from the raw HTML fragment. Preview-only bug, Next.js emits UTF-8 by default so the real app was never affected |
| 2026-07-15 | Replaced raw session-count ("312 sessions") on teacher cards with teacher-authored expertise tags | Session count reads as a gig-economy volume metric; a JEE/NEET parent or student cares more about subject-matter depth. Requires a new `TeacherProfile.expertiseTags` field, not yet in the schema |
| 2026-07-16 | Corrected brand name from mashed-together "novusclasses" to properly written "Novus Classes" in all display copy | User correction, the domain (novusclasses.in) stays unspaced since it's a URL, but display copy, logo, and headings use proper title case with a space |
| 2026-07-16 | Rejected the "flat, uniformly restrained" version as bland | Direct user feedback: "a lot more can be done than this," pushed back on over-correcting toward safety after the earlier illustration failures |
| 2026-07-16 | Added a full-bleed dark proof band (huge mono stats), bumped hero type from 44px to 68px, added card shadow depth and hover states, stacked/offset the hero device mockup for visual depth | First pass at adding real richness without reintroducing illustration risk |
| 2026-07-16 | Researched cred.club and linear.app specifically for how premium products create richness | User explicitly asked for more research before the next iteration. Finding: both concentrate richness into a few deliberate high-contrast moments rather than distributing decoration evenly |
| 2026-07-16 | Added a second full-bleed dark "manifesto" editorial passage and a two-card testimonial section with a one-time gold color splash (`#F0B429`, used nowhere else in the system) | Direct application of the Cred/Linear research: two dark "beats" instead of one for page rhythm, one deliberate bold color moment instead of reopening the whole palette |
| 2026-07-16 | **Design approved. Status set to FINAL, ready for implementation** | User: "this is it. make it happen." |
| 2026-07-16 | Added the Brand Mark: an "N" lettermark in a rounded square (emerald bg, white text) plus a full nav lockup, in `design/logo/`. No illustrated icon, kept consistent with the system's no-custom-illustration rule | User asked for a logo. Reused the existing type/color tokens rather than opening a new design decision |
