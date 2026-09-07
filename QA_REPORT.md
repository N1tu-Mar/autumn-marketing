# Final QA Report

Pass run against commit `6c279e5` and the production deployment at
<https://autumn-marketing.vercel.app>, with the hosted Supabase project the
application actually reads from.

Method: every row below was checked against running code, rendered output or a
live query. Nothing is marked PASS because the file exists.

---

## Assignment Requirements

| Requirement | Status | Evidence | Fix Required |
|---|---|---|---|
| Main marketing dashboard exists | PASS | `/dashboard` returns HTTP 200 in production; renders revenue, bookings, comparison, journey, chart, take, actions | None |
| Connected second screen exists | PASS | `/dashboard/bookings` returns HTTP 200; renders leading strategy, guest markets, journey, campaign detail, attribution | None |
| Navigation between them works | PASS | Hero link → `/dashboard/bookings?range=…`; breadcrumb back to `/dashboard?range=…`. Range preserved in both directions (`rangeQuery`) | None |
| Main page answers the direct bookings / revenue question | PASS | First viewport: `$25,551` at display size, `47 direct bookings`, `91% more booking revenue than the same 30 days last year` | None |
| Second page meaningfully supports the first | PASS | Restates the same headline figure, then answers "what drove it": leading strategy 46%, leading market, funnel, spend, campaign detail | None |
| Coherent hierarchy | PASS | One display figure per screen; rates live on connectors; campaign table folded behind a disclosure | None |
| Hotel owner language | PASS | Primary copy carries no CTR/CVR/ROAS/funnel/attribution/metasearch. Industry terms appear only in help text and secondary labels | None |
| Technical concepts explained | PASS | `HelpTip` on every technical column; attribution explained in one visible sentence plus a `<details>` methodology block | None |
| React | PASS | React 19.2.8 | None |
| Next.js | PASS | Next.js 16.3.4, App Router, Server Components | None |
| Real hosted database | PASS | `verify:data` asserts the URL is a hosted `*.supabase.co` project, not localhost, and connects with the app's own publishable key | None |
| No hardcoded dashboard data | PASS | See [No hardcoded business outcomes](#no-hardcoded-business-outcomes) | None |
| ≥ 720 days of history | PASS | **766 distinct metric dates**, 2024-08-01 → 2026-09-05 | None |
| Meaningful seeded data | PASS | Seasonality, campaign differentiation, 23 guest markets, capacity constrained occupancy. See [Data realism](#final-data-realism-review) | None |
| Seed script | PASS | `npm run seed` (deterministic, fixed seed), `npm run seed:verify` | None |
| Responsive | PASS | Measured at 320 / 360 / 390 / 414 / 768 / 1024 / 1440 with device emulation and tooltips forced visible: `scrollWidth == viewport` on both routes, 0 elements past either edge in all 14 combinations | Fixed, see QA-2 |
| Maintainable | PASS | Data access → metrics → narrative → components, one definition per metric; two dead exports removed | Fixed, see QA-5 |
| Loading states | PASS | `app/dashboard/loading.tsx` and `app/dashboard/bookings/loading.tsx`, each shaped like its own screen | Fixed, see QA-6 |
| Empty states | PASS | Distinguishes "no marketing ran" from "marketing ran, no bookings". Verified on `?from=2024-01-01&to=2024-01-05` | None |
| Error states | PASS | `LoadFailure` shows no RPC name, stack, path or credential, and never substitutes demo numbers | None |
| Accessibility | PASS | See [Accessibility](#accessibility) | None |
| Production deployment | PASS | Both routes live, current with `main` | None |
| README | PASS | Rewritten sections for screenshots, data verification, quality checks, scope of modeled vs stored figures | Fixed, see QA-8 |
| Database setup documented | PASS | Migrations, `db:push`, SQL editor fallback, table grain table | None |
| Seeding documented | PASS | Exact commands, determinism explained | None |
| Screenshots | PARTIAL | Main and detail captured from production. **Reference dashboard not obtainable in this environment** | See [Screenshots](#screenshots) |
| No secrets committed | PASS | See [Security](#security) | None |

---

## Build health

Run after every change in this pass, from a clean tree:

| Command | Exit | Result |
|---|---|---|
| `npm run lint` | 0 | No errors, no warnings |
| `npx tsc --noEmit` | 0 | No diagnostics |
| `npm run build` | 0 | `/dashboard` and `/dashboard/bookings` both `ƒ` (dynamic), as required for request time data |
| `npm test` | 0 | 9 tests, 9 pass, 0 fail |
| `npm run verify:data` | 0 | **All 36 checks passed** |

---

## Database

Queried live, through the publishable key the browser uses:

| Figure | Value |
|---|---|
| Properties | 1 |
| Property under test | Historic Hotel Nichols, 19 rooms, `America/Detroit` |
| Campaigns | 5 |
| Bookings | 1,489 |
| Autumn attributed bookings | 648 |
| Autumn actions | 10 |
| Campaign metric rows | 3,175 |
| Earliest metric date | 2024-08-01 |
| Latest metric date | 2026-09-05 |
| **Distinct metric dates** | **766** (requirement: ≥ 720) |

The host is a hosted `*.supabase.co` project. It is not localhost, not
`127.0.0.1`, not a local Supabase stack. The URL and keys are deliberately not
reproduced in this document.

### Metric reconciliation

`verify:data` recomputes each of these from the raw rows and compares them with
what the aggregation functions return. All matched exactly:

| Relationship | Result |
|---|---|
| Headline revenue == sum of booking rows | $384,268 == $384,268 |
| Headline bookings == attributed rows | 648 == 648 |
| Campaign revenue total == headline revenue | $384,268 == $384,268 |
| Campaign bookings total == headline bookings | 648 == 648 |
| Campaign impressions / clicks / visits / spend | Reconciled across 5 campaigns |
| Feeder market revenue and bookings | Reconciled across 23 markets |
| Feeder market room nights | 1,488 == 1,488 |
| CTR == clicks / impressions | 2.80% |
| Booking conversion == bookings / website visits | 2.85%, below 100% |
| ROAS == attributed revenue / ad spend | 6.05× on $63,567 |
| Average booking value == revenue / bookings | $593 |
| Attributed revenue ⊂ all direct booking revenue | $384,268 of $870,976 |
| Funnel ordering: impressions ≥ clicks ≥ visits | Holds on every row |

No unexplained discrepancy. The campaign table's total row recomputes its rates
from summed numerators and denominators rather than averaging the per campaign
percentages, so the footer is arithmetically true of the whole period.

### Capacity

| Check | Result |
|---|---|
| No night sells more than 19 rooms | Busiest stored night 2026-08-28, 15/19 |
| Room nights fit available inventory | 3,389 of 15,732 across 828 nights |
| Stay dates valid, `room_nights` equals stay length | Holds on all 1,489 rows |
| No booking made after its own check in | Holds |

### Row level security

RLS is enabled on all five tables, and `0001_init.sql` grants **only** `for
select` to `anon, authenticated`. No insert, update or delete policy exists.

Probed live with the application's own publishable key:

- `insert` → rejected with an error on every table.
- `update` against a row that is definitely visible → 0 rows affected, i.e.
  blocked. (Probed with a self valued write, so nothing could change either
  way.) A blanket update returns success with zero rows under RLS, so the naive
  version of this test is meaningless; this one targets a known visible row and
  reads back the affected count.
- `delete` follows from the same absence of a policy: Postgres denies any
  command with no permissive policy once RLS is on.

---

## No hardcoded business outcomes

Searched `app/`, `components/`, `lib/`, `types/` for `mockData`, `demoData`,
`sampleData`, `fakeData`, `dummyData`, `testData`, `staticData`, `hardcoded`,
JSON imports, and any import of the seed model into runtime code.

**Zero matches.** No runtime module imports `supabase/generate.ts`,
`supabase/seed-model.ts` or `supabase/seed.ts`.

Classification of what *is* constant in the UI:

| Constant | Location | Verdict |
|---|---|---|
| Metric labels, help text, campaign explanations | `lib/content/*` | SAFE, product language |
| Insight and narrative sentence templates | `lib/analytics/{insights,narrative}.ts` | SAFE, templates. Every value is interpolated from a query |
| Narrative thresholds | same | SAFE, tuning constants rather than results |
| Range presets and grain boundaries | `lib/analytics/range.ts` | SAFE, date configuration |
| Number and date formatting | `lib/analytics/format.ts` | SAFE |
| Chart colours, sizes, breakpoints | components | SAFE, interface sizing |
| Seed model assumptions | `supabase/*` | SEED_CONFIGURATION, never imported at runtime |
| Narrative fixtures | `tests/narrative.test.ts` | TEST_FIXTURE |

No headline revenue, booking total, market result, campaign result, chart
series or year over year figure is written in the UI. Every one is aggregated
in Postgres and mapped through `lib/analytics/metrics.ts`.

---

## QA findings

Every issue found in this pass, whether fixed or accepted.

### QA-1. Autumn's take called the fastest growing market the "strongest" one

- **Severity:** Medium. It is a false statement on the main screen, and it is
  exactly the stale narrative failure the brief warns about.
- **Evidence:** On Last 90 days production rendered *"Indianapolis was your
  strongest guest market, with booking revenue 625% higher…"*. Indianapolis is
  the fifth largest market by revenue; it only looked notable because it grew
  from a tiny base. On Year to date the same clause named Detroit ($17.4K) while
  the detail screen correctly led with Grand Rapids ($20.6K).
- **Cause:** `fastestGrowingMarket()` ranks by the largest absolute revenue
  *gain*, which is the right rule. The sentence attached to it claimed rank by
  size.
- **Fix:** The clause now reads *"{city} grew the most, with booking revenue
  {n}% higher than the same period last year."* Rule unchanged; the sentence
  now describes what the rule computes.
- **Verification:** Production now renders *"Grand Rapids grew the most…"* on
  Last 30 days. Checked across Last 30 / Last 90 / YTD / Last 12 months and two
  custom windows; the leading market claim on the detail screen and the
  growth claim in the take no longer contradict each other.

### QA-2. Help tooltips: three separate defects

- **Severity:** Medium. Horizontal viewport overflow is an explicit fail.

**(a) Overflow on mobile.** At a 390×844 emulated viewport,
`/dashboard/bookings` measured `documentElement.scrollWidth = 446` against a 390
viewport, with two elements past the edge, both `HelpTip` panels in the
marketing journey. The panel is 15rem wide and centred on its trigger, so a
trigger near the right edge pushes it off the page.

**(b) Clipping inside the campaign table.** The same panel opened upward from a
header cell at the top of an `overflow-x-auto` container, which has no room
above it, and the last column had none to its right.

**(c) Every tooltip opening at once.** The component used an unnamed Tailwind
`group`, which matches *any* ancestor carrying `group`. The campaign table is
wrapped in `<details className="group …">`, so hovering the disclosure opened
every header tooltip simultaneously.

**Fixes.** (b) and (c) were fixed by the author while this pass was running: the
group is now named (`group/tip`), and callers pass `placement` / `align` because
only the caller knows what would clip the panel. I extended that for (a):
`MarketingJourney`'s tips pass `align="end"`, and because no fixed anchor can
work on a phone. Centred it hangs off the right, anchored right it hangs off
the *left* at 320px once the sentence wraps. So the panel is pinned to the bottom
of the viewport below `sm` and only becomes trigger anchored at `sm` and above.
The two class sets are `sm:`-scoped so they cannot collide by source order. The
campaign table only renders at `md` and up, so the author's placement props are
unaffected.

**Verification.** Measured with every tooltip forced visible, both routes, at
320 / 360 / 390 / 414 / 768 / 1024 / 1440: `scrollWidth == viewport` and 0
elements past either edge in all 14 combinations. Computed styles confirm the
panel is `fixed` and pinned at 390 (left 16, width 358) and `absolute` and
anchored to its trigger at 1440 (240 wide), with the table's tip opening
downward as intended.

### QA-3. Chart axis printed the same label on two gridlines

- **Severity:** Low to medium. A duplicated axis label is a misleading axis.
- **Evidence:** On Last 30 days the revenue axis read `$0, $550, $1k, $2k, $2k`.
  Recharts chose ticks near 1,650 and 2,200, and both rounded to `$2k`.
- **Fix:** `axisFormat` keeps one decimal below $10k.
- **Verification:** Read the rendered axis text out of the live DOM on all four
  ranges. Last 30 days now reads `$0, $550, $1.1k, $1.6k, $2.2k`; Last 90 days
  `$0, $3.5k, $7.0k, $11k, $14k`; YTD and Last 12 months `$0, $15k, $30k, $45k,
  $60k`. No duplicate label on any range.

### QA-4. Guest market disclosure promised more than it revealed

- **Severity:** Low, but it is a small dishonesty in a product whose argument is
  trustworthiness.
- **Evidence:** The control read *"See all 23 guest markets"* and opened to 18.
  the leader and the four in the table above are already on screen.
- **Fix:** Reads *"See the other N guest markets"*, computed from what is
  actually hidden.
- **Verification:** Production renders "See the other 18 guest markets" on YTD
  and "See the other 14" on Last 30 days, matching the list length each time.

### QA-5. Terminology drift between the two screens

- **Severity:** Low.
- **Evidence:** The overview says *"47 direct bookings"*; the detail screen
  described the same number as *"47 stays booked directly"*. The component's own
  comment states that two screens describing one number should describe it
  identically.
- **Fix:** *"47 direct bookings made on Hotel Nichols's own website."*
- **Verification:** Both screens now use "direct bookings" for this figure.

### QA-6. Detail screen inherited a skeleton shaped like the overview

- **Severity:** Low.
- **Evidence:** `/dashboard/bookings` had no `loading.tsx`, so it fell back to
  the overview's, which draws a 440px card the detail screen never renders.
- **Fix:** Added `app/dashboard/bookings/loading.tsx` matching its actual shape.

### QA-7. Dead code and stale fictional identity

- **Severity:** Low.
- **Evidence:** `signedCount` (`format.ts`) and `withOtherMarkets`
  (`metrics.ts`) had zero references; the latter carried a doc comment
  describing an "Other markets" row the UI no longer has. Migration
  `0003_property_identity.sql` still ran `set short_name = 'Harborlight' where
  slug = 'harborlight-inn'`, a dead statement naming the old fictional property.
- **Fix:** All three removed. The migration keeps its column additions, which
  are `if not exists` and therefore still idempotent.

### QA-8. README reported two scopes as if they were one

- **Severity:** Low, but it makes the project look wrong to anyone who runs the
  verifier.
- **Evidence:** README stated *"8,347 room nights sold of 16,834 available"*
  while `npm run verify:data` printed *"3,389 of 15,732"*. Both are correct:
  the first describes the full modeled hotel across every channel, the second
  describes the direct bookings actually stored as rows. Nothing said so.
- **Fix:** A table in the README separates modeled hotel figures from stored
  rows, and states that the modeled figures are seed time only and never
  written or rendered.
- **Verification:** Recomputed the generator's audit in memory (no write): 19
  rooms, 8,347 of 16,834 room nights, 49.6% occupancy, peak 19/19, modeled room
  revenue $2,001,656, Autumn share 19.2%; stored rows 1,489 bookings / 3,389
  room nights / $870,976 direct / $384,268 attributed. Every published number
  reconciles.

### QA-9. Build brief committed at the repository root

- **Severity:** Low, presentation only.
- **Evidence:** `prompt(20260906-172343).md`, the 2,308-line implementation
  brief, was tracked at the repo root where a reviewer opens it first.
- **Fix:** Untracked and gitignored. The file remains on disk locally.

### QA-10. Trade vocabulary in the `autumn_actions` copy

- **Severity:** Medium for the product argument. This section renders on the
  main dashboard, so it is primary copy, and it was the last text on either
  screen that assumed the reader knows advertising.
- **Evidence:** Of ten seeded rows, eight carried terms the customer has no
  reason to know: *"shoulder-season stay messaging"*, *"Non-brand search was
  buying expensive clicks"*, *"Brand Protection now holds top position, at a
  higher cost per click"*, *"the direct rate beats the OTAs"*, *"Trimmed pacing"*,
  *"Refreshed harbor and beach creative"*, *"Moved budget from Discovery into
  Metasearch"*, *"Opened Discovery into new metros"*. `shoulder-season` was also
  the last hyphen anywhere in the rendered UI, and `in-state` was a second one
  that only surfaced on ranges covering May 2026.
- **Fix:** All ten rows rewritten in operator language, keeping the same facts,
  dates, statuses and campaign links. *"Moved budget from Discovery into
  Metasearch"* became *"Moved spending toward travelers ready to book"*;
  *"Built shoulder-season stay messaging"* became *"Wrote new ads for September
  and October"*; OTAs became "booking sites". Then `npm run seed`.
- **Why the reseed was safe:** the copy is a static array of string literals,
  and `makeActions` runs last, after every metric and booking is generated. The
  number of RNG draws is unchanged, so no other row can move.
- **Verification:** `npm run verify:data` output is **identical byte for byte** before and
  after the reseed (`diff` reports no change). Same 1,489 bookings, 648
  attributed, $384,268, 3,175 metric rows, 766 distinct dates, all 36 checks
  passing. `npm run seed:verify` passes. Production picks the copy up without a
  redeploy because both routes are `force-dynamic`. Swept six ranges across both
  routes for hyphens, em dashes and en dashes in rendered prose: **zero**.

### Accepted, not fixed

| Observation | Why it stands |
|---|---|
| The hero card's right half is empty at 1440 | Deliberate editorial whitespace. It is the single loudest signal that this is not a KPI wall, and filling it would undo the main product decision. |
| `LoadFailure` shows the eyebrow "Your direct bookings" on both routes | Reads correctly on either screen; parameterising it adds a prop for no reader benefit. |
| Campaign table shows click rate but not raw clicks | Deliberate demotion. Clicks are on the journey above; the table's job is booking outcomes. |
| Streaming makes raw HTML source order differ from DOM order | Not a defect. Confirmed by dumping the post hydration DOM: real order is correct. The raw response interleaves because the page streams through a Suspense boundary. |

---

## Date range QA

Every range exercised on production, both routes: Last 30, Last 90, Year to
date, Last 12 months, the default, two custom windows, and one window that
predates the dataset entirely.

Everything moves together: headline revenue, bookings, comparison and its
label, average booking value, chart series and grain, journey counts, campaign
ranking and revenue, leading strategy, market ranking, top market narrative,
Autumn's take, spend and ROAS, methodology dates.

The narrative genuinely decides again rather than repeating one conclusion:

| Range | Status line | Leading strategy in the take |
|---|---|---|
| Last 30 days | "You've had a strong month." | Travelers comparing hotels and prices, 46% |
| Last 90 days | "Your recent booking performance is strong." | Travelers comparing hotels and prices, 43% |
| Year to date | "You're having a strong year." | Travelers comparing hotels and prices, 41% |
| Last 12 months | "Direct bookings are well ahead of last year." | Travelers comparing hotels and prices, 40% |
| 2025 custom | "You've had a strong stretch." | Travelers already looking for your hotel, 36% |

The status line is aware of the range, so a 30 day filter never produces "a strong
year". The named market changes with the data. No stale entity survived a range
change.

Scanned every rendered range for `NaN`, `Infinity`, `undefined`, `$NaN` and
`[object Object]`, in body text and in `aria-label` and `title` attributes:
**zero occurrences.**

## Year over year QA

Comparisons are the same calendar window one year earlier, resolved by
`shiftYear`, with Feb 29 pulled back to Feb 28 rather than rolling into March.
Days are resolved in the property's own timezone by Postgres, not by the server
clock, and ranges anchor to the latest date that has data rather than to
"today", so a reviewer never lands on a half empty period.

Labels state the actual comparison, "the same 30 days last year" or "the 12
months before that", and never imply "the previous 30 days". Where the prior
year has no data, both screens say *"There is no comparable period last year
yet."* rather than inventing a comparison, and the chart's written summary says
the same thing instead of claiming a $0 prior year.

## Division by zero QA

Rates are `null`, never `0`, when the denominator is zero (`ratio()` in
`metrics.ts`). Verified on the empty window `?from=2024-01-01&to=2024-01-05`:
the overview shows the "no bookings" state, the detail screen renders `$0` with
no fabricated rates, and the journey drops the connector that would otherwise
carry an undefined percentage rather than printing a placeholder mid sentence.
No `NaN%`, no `Infinity`, no misleading `0%`.

## Accessibility

- **Headings:** exactly one `h1` per route, verified in the live DOM. Hierarchy
  descends without skipping.
- **Keyboard:** the range control is a native `<select>` with an `sr-only`
  label; disclosures are native `<details>`/`<summary>`; the chart toggle is a
  labelled `role="group"` of `aria-pressed` buttons; help tips are real
  buttons. 5 focusable controls on the overview, 14 on the detail screen, no
  keyboard traps, focus never hidden.
- **Tables:** real `<table>` markup with `<caption class="sr-only">`, `scope="col"`
  headers and `scope="row"` row headers, on both the campaign table and the
  guest market table.
- **Colour is never the only signal:** every direction is written in words
  ("91% more booking revenue than…", "9.1% less", "about level"). Clay is held
  back for drops past −8% so the palette does not react to noise.
- **Chart:** `figure`/`figcaption`, `role="img"` with an `aria-label` carrying
  the same sentence printed beneath it, and the comparison series is dashed as
  well as lighter, so the two lines separate without colour.
- **Tooltips are not load bearing:** every label reads on its own; the help text
  is an elaboration. The full text is on the button's accessible name, so it
  reaches a screen reader without the panel, and the panel is reachable by
  focus on touch.

## Console, network and performance

No console errors, warnings, exceptions, React key warnings or hydration
mismatches on either route at any of the three widths. No failed requests, no
polling, no calls to localhost from production, no third party dependency in
the render path for core metrics. Production HTML responses returned in
0.40 to 0.78s. No oversized images: the app ships no raster assets at all.

## Security

- No `SERVICE_ROLE`, `SUPABASE_SECRET` or `SECRET_KEY` reference anywhere in
  `app/`, `components/`, `lib/` or `types/`. `SUPABASE_SERVICE_ROLE_KEY` is
  read only by `supabase/seed.ts` and `supabase/verify.ts`, which are
  build time scripts, and the README says not to set it in Vercel.
- `.env*` is gitignored with an `!.env.example` exception. `.env.example`
  contains names and comments only, no values.
- Only `.env.example` is tracked. `git ls-files` finds no other env or key file.
- Scanned the full git history for JWT shaped and `sb_secret`-shaped strings:
  **zero matches**. No rotation appears necessary.
- The publishable key is client visible by design and read only through RLS,
  which is verified above rather than assumed.
- No credential value appears in this document.

## Repository hygiene

No `.DS_Store`, no debug logs, no commented out UI, no unused mock dataset, no
temporary harness, no test credentials. The only tracked file over 200KB is
`package-lock.json`. `console.log` appears only in the three CLI scripts, where
it is the output. No `TODO`, `FIXME`, `HACK` or `debugger` anywhere. The
`localhost` matches are in `verify-data.ts`, where the check exists to *reject*
a local database.

---

## Product Judgment

**What does the owner see first?** The property name and town, then one
sentence, "You've had a strong month.", then `$25,551` in direct booking
revenue, the booking count, and how that compares with the same 30 days last
year. Four facts before any metric.

**Why?** It is the only question the brief says this customer asks. An operator
between a check in and a vendor call gets an answer, not a dataset. Setting one
number at display size and writing the comparison as a sentence removes the two
interpretation steps the reference dashboard demands: find the number that
matters, then work out whether it is good.

**What did we intentionally demote?** Ad clicks and click through rate to the
detail screen's journey; the campaign table behind a disclosure; attribution
methodology behind a second disclosure; ROAS to a footnote under a plain English
restatement ("$6.49 in booking revenue for every $1 spent"). Removed outright:
the duplicate total booking value card, device breakdown, visitor demographics,
pages per session, the generic events list.

**Why?** Each of those answers a question a growth marketer asks. None answers
"is Autumn working". Keeping them reachable but subordinate preserves the
agency's ability to reconcile without making the owner walk past it.

**Is anything still visible that requires too much interpretation?** No. The
last holdout was the `autumn_actions` copy, which lives in the database rather
than the UI and still used trade vocabulary. It was rewritten and reseeded; see
QA-10.

**Does the second screen support the first?** Yes. It opens by restating the
same revenue figure in the same words, then answers only "what drove it",
which type of marketing, which guest market, what the path looked like, what it
cost. It is not a second analytics page; it does not introduce a metric the
first screen raised no question about.

**Does it show the right information rather than the most?** Yes. The overview
renders three counts, one currency figure, one comparison, one chart, one
conclusion and two team notes. Everything else is one click away.

## Design Craft

Calm: one accent, one serif display face for spoken lines, hairlines
instead of card borders, and a single card on each screen. Hospitality native:
the hotel is named before the report, the greeting is in the property's
timezone, and the product speaks in sentences. Hierarchy is unambiguous. The
only display size figure is the answer. Whitespace does real work; the empty
right half of the hero is the clearest signal that this is not a KPI wall. The
technical section is visually subordinate: smaller type, muted ink, folded away.
Mobile is intentional rather than merely narrow. The campaign table becomes
stacked cards led by booking revenue, not a shrunken grid. No generic SaaS
residue: no badges, no status pills, no icon set, no gradient.

## Engineering Quality

Real hosted Postgres, verified by a check that rejects a local URL. No hardcoded
outcomes, confirmed by search and by classification of every constant.
Responsive, measured rather than eyeballed. Types and lint clean. Build passes
with both routes dynamic. Deterministic seeding from a fixed seed. Verification
tooling that exits non zero and reconciles every displayed figure against raw
rows. RLS enabled and probed. Setup documented with commands that exist.
Production working and current with `main`.

## Data Realism

Property scale is plausible because it is real: 19 rooms, South Haven, publicly
documented. Occupancy is 49.6% across the ledger with a peak of 19/19 and no
oversell, which the seed refuses to write and the verifier recomputes from
Postgres. Seasonality is present and unflattering in places. A softer autumn
2025 sits in the data. Campaign types behave differently in the ways they
should: brand protection converts at 7.8% on 8.8K impressions, discovery at
1.0% on 151K. Markets vary and move independently year over year. 766 days
gives two full summers, which is what a seasonal year over year comparison
needs. Spend of $63,567 against $384,268 attributed revenue is a 6.05× return,
inside published ranges rather than fantasy. Attributed revenue is 44% of stored
direct revenue and 19.2% of total modeled room revenue, a subset of the
business, which is what attribution honestly is.

Genuine limitations: attribution is modeled as last touch and assigned at seed
time, so the dataset cannot express multi touch or incrementality; guest markets
are drawn from a fixed list rather than a real geographic model; and the
marketing program is reconstructed from published benchmarks, not observed.

---

## Screenshots

`submission/screenshots/`, captured from the production deployment with device
emulation at a 2× device pixel ratio:

| File | Viewport | Status |
|---|---|---|
| `redesigned-main-dashboard.png` | 1440 wide, full page (2,170px) | Captured |
| `redesigned-booking-detail.png` | 1440×1100 viewport | Captured |
| `redesigned-booking-detail-full.png` | 1440 wide, full page (2,803px) | Captured, archive |
| `main-mobile.png` | 390×844, full page | Captured, optional |
| `detail-mobile.png` | 390×844, full page | Captured, optional |
| `reference-dashboard.png` | not applicable | **Missing** |

Each capture was inspected: no loading skeleton, no open tooltip, no focus ring,
no debug overlay, no clipping, no horizontal scroll, correct property, correct
date range, readable text.

**The reference dashboard screenshot could not be produced.** The original
Autumn asset is not in this repository or anywhere in the local environment, and
recreating it would mean fabricating a screenshot of a product this project did
not build. It must be attached from the original assignment by hand. This is
tracked in `SUBMISSION_NOTES.md`.

---

# Final Autumn Checklist

## Required Product

- [x] Main dashboard
- [x] Connected detail screen
- [x] Navigation between screens
- [x] Coherent hierarchy

## Customer Experience

- [x] Main page answers direct bookings/revenue question
- [x] Hotel owner language
- [x] Technical concepts understandable
- [x] Calm rather than intimidating
- [x] Important information prioritized
- [x] Detail available without dominating

## Engineering

- [x] React
- [x] Next.js
- [x] Hosted DB
- [x] No hardcoded dashboard outcomes
- [x] ≥ 720 days
- [x] Seed script
- [x] Responsive
- [x] Maintainable
- [x] RLS reviewed
- [x] No secrets exposed
- [x] Build passes

## Data

- [x] Plausible hotel scale
- [x] Seasonality
- [x] Campaign differences
- [x] Markets
- [x] Booking events
- [x] Revenue
- [x] Comparisons
- [x] Reconciliation passes
- [x] Capacity constraints pass

## Submission

- [x] Live URL
- [x] Both routes publicly reachable
- [x] Repo URL
- [x] Setup instructions
- [x] Database setup instructions
- [x] Seeding instructions
- [ ] **Reference screenshot**, must be attached from the original assignment
- [x] Main redesign screenshot
- [x] Detail screenshot
- [x] Submission email draft
