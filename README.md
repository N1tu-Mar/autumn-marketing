# Autumn — Marketing Performance

A redesign of Autumn's marketing dashboard for the person who actually reads it:
the owner of an independent hotel, between a check-in and a vendor call, who
wants to know whether Autumn is producing direct bookings.

**Live:** https://autumn-marketing.vercel.app/dashboard

Two connected screens, both backed by a hosted Postgres database:

| Route | What it answers |
|---|---|
| [`/dashboard`](https://autumn-marketing.vercel.app/dashboard) | Is Autumn getting me more direct bookings and revenue? |
| [`/dashboard/bookings`](https://autumn-marketing.vercel.app/dashboard/bookings) | What's driving those bookings? |

No login is required. The date range travels with you between the two screens.

## Screenshots

| | |
|---|---|
| [Reference dashboard](submission/screenshots/reference-dashboard.png) | The original Autumn marketing dashboard this redesign replaces |
| [Redesigned main dashboard](submission/screenshots/redesigned-main-dashboard.png) | The briefing: revenue, bookings, what changed, what Autumn is doing |
| [Connected booking detail](submission/screenshots/redesigned-booking-detail.png) | What is actually driving those direct bookings |

---

## The product decision

The original dashboard gives impressions, clicks, CTR, devices, page views and
revenue roughly equal weight. That is a growth marketer's view. Autumn's
customer is usually not a growth marketer, so the redesign puts one hierarchy in
front of them and holds to it:

> **Outcome → journey → trend → what changed → what Autumn is doing → deeper drivers.**

Concretely:

- **Direct booking revenue is the only number set at display size.** Bookings,
  the year-over-year comparison and average booking value support it rather than
  competing with it in their own cards.
- **Impressions and website visits became a journey, not cards.** A single rail
  runs ad appearances → website visits → direct bookings → revenue, with
  click-through and booking rate sitting *on* the connectors. A rate explains a
  result; it is never presented as one.
- **Comparisons default to the same period last year.** A lake-town hotel
  compared against last month is being measured against the weather.
- **Insights name concerns first.** If visits are up and the booking rate is
  down, that ranks above the revenue win.
- **Autumn states a conclusion, not just facts.** A rule-based narrative layer
  reads the same queried numbers and says what they mean in a sentence — which
  strategy carried the period, which market produced the growth, or what is
  worth watching. It is deterministic and template-based; there is no model
  behind it and the UI never suggests otherwise.
- **The leading strategy and leading market get the space.** Four campaigns at
  equal visual weight hides the one that is actually carrying the period.
- **"What Autumn is working on"** reads from an `autumn_actions` table, so the
  product feels like an operator rather than a report.

Demoted or removed from the main screen: the duplicate total-booking-value card,
the device summary, visitor demographics, pages/session, the generic events list
and the dense campaign table. Click-through rate, ad clicks, campaign detail and
the full funnel all live on the booking detail screen, where someone has already
asked the question they answer.

---

## Tech stack

- **Next.js 16** (App Router, Server Components) + **React 19** + **TypeScript**
- **Supabase** — hosted Postgres, RLS, SQL aggregation functions
- **Tailwind CSS v4**
- **Recharts** for the one chart the main screen has
- **Vercel** for deployment

---

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase values
npm run dev
```

Environment variables:

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app + seed | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | app | Publishable/anon key. Read-only through RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | seed script only | Never imported by the app, never set in Vercel |

---

## Database setup

Apply the migrations to your Supabase project, then seed it:

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/*
npm run seed              # writes 766 days of generated facts
npm run seed:verify       # asserts the data is sane, exits non-zero if not
```

If you prefer the dashboard, paste the two files in `supabase/migrations/` into
the SQL editor in order, then run `npm run seed`.

### What the tables hold

| Table | Grain | Purpose |
|---|---|---|
| `properties` | 1 row | The hotel. Name, city, timezone, room count |
| `campaigns` | 1 row per campaign | Name, type, status, run dates |
| `campaign_daily_metrics` | campaign × day | Impressions, clicks, website visits, ad spend |
| `bookings` | 1 row per booking | Value, room nights, stay dates, guest market, device, attribution |
| `autumn_actions` | 1 row per action | What Autumn changed, when, and why |

`properties` also carries `image_url` and `short_name` for presentation. Both
are nullable — with no image the header falls back to a monogram drawn from the
property name rather than to stock travel photography.

No table stores a dashboard metric. There is no `dashboard_metrics` row, no
stored CTR, no stored conversion rate, no stored revenue total. Every figure on
both screens is aggregated from these facts at request time.

### How much data

**766 consecutive days** (2024-08-01 → 2026-09-05): 3,175 daily metric rows
across 5 campaigns and 1,489 direct booking events. That is two full summers,
which is what a year-over-year comparison needs.

The dataset is generated by `supabase/generate.ts` from a fixed seed, so
`npm run seed` produces the same database every time.

### What is real and what is synthetic

The property is real: **Historic Hotel Nichols**, 201 Center Street, South
Haven, Michigan — 17 rooms and 2 suites, established 1884, independently owned
and family-operated for more than a century, listed on the National Register of
Historic Places in 2025. Its size, location, room inventory, seasonality and
publicly advertised price anchors come from public sources, cited in
[`MODEL_ASSUMPTIONS.md`](MODEL_ASSUMPTIONS.md).

**Everything the dashboard displays is synthetic.** Impressions, clicks, website
visits, bookings, booking revenue, ad spend, campaign performance, ROAS,
conversion rates, guest markets and Autumn's actions are all modeled — generated
from the property's public characteristics plus published hospitality
benchmarks (Cloudbeds, SiteMinder, Google Hotel Ads and others).

The hotel's actual occupancy, ADR, revenue, bookings, channel mix, guest origins
and advertising are **not public, are not used, and are not claimed here**. It
has no relationship with Autumn, which is a fictional product. Nothing in this
repository should be read as a statement about how that business performs.

### Hotel economics come before marketing

The generator works in one direction:

```
19 rooms → available room nights → seasonal demand → occupancy → ADR
  → sold room nights → stays → direct share → Autumn-attributed bookings
  → website visits → ad clicks → ad impressions → ad spend
```

Every stay claims inventory from a room ledger, so **no night can ever sell more
than 19 rooms**. `npm run seed` refuses to write a dataset that oversells the
property, and `npm run seed:verify` re-derives occupancy from the rows in
Postgres and fails on any violation.

Two different scopes get reported, and it is worth keeping them apart:

| Figure | Scope | Value |
|---|---|---|
| Room nights sold / available | The whole modeled hotel, every channel | 8,347 of 16,834 (49.6% occupancy) |
| Busiest night | The whole modeled hotel | 19 of 19 rooms |
| Modeled room revenue | The whole modeled hotel, every channel | $2,001,656 |
| Direct bookings stored in `bookings` | Direct channel only | 1,489 bookings, 3,389 room nights, $870,976 |
| Autumn-attributed subset | What the dashboard shows | 648 bookings, $384,268 |

The first three are seed-time figures describing the hotel the model imagines;
they are never written to a table and never rendered. Only the direct-channel
rows are stored, which is why `npm run verify:data` reports room nights in the
low thousands rather than 8,347. Autumn-attributed revenue is 19.2% of total
modeled room revenue: a subset of the business, never the whole of it.

The data has a story, including the parts that aren't flattering: a softer
autumn 2025, a budget shift out of non-brand search into metasearch, and a
spring 2026 discovery expansion that lifted visits faster than bookings, which
is what makes the "more travelers are visiting, but fewer are booking" insight
fire on real numbers.

---

## Architecture: nothing about this hotel is hardcoded

```
Supabase Postgres
      ↓  SQL aggregation functions (supabase/migrations/0002_…)
lib/data/queries.ts          one wrapper per function
      ↓
lib/analytics/metrics.ts     one definition per derived metric
lib/analytics/insights.ts    rule-based insight selection
lib/analytics/narrative.ts   the conclusion: Autumn's take
      ↓
lib/data/overview.ts | bookings.ts    parallel fetch per screen
      ↓
app/dashboard/**/page.tsx    Server Components
      ↓
components/**                presentational only, no database access
```

> All property details, revenue, booking counts, impressions, clicks, website
> visits, rates, comparisons, chart series, campaign rankings, feeder markets,
> insight values and Autumn activity records are fetched from Supabase or
> derived from queried rows. The UI contains no hardcoded dashboard metrics and
> no fallback demo values.

What *is* hardcoded, deliberately: labels, tooltip definitions, campaign-type
explanations, insight sentence templates and their thresholds, formatting, and
layout. Product language belongs in code. Business state does not.

**Try it:** change a `booking_value` in the Supabase table editor and reload —
the headline revenue, average booking value, the chart bucket containing that
booking, the campaign row, the market row and any dependent insight all move.
Change the date range and every number recalculates against a new window and a
new comparison period.

Aggregation runs in Postgres rather than in JavaScript for three reasons: both
screens share one definition of every metric, a two-year range is one round trip
instead of thousands of rows, and no query is silently truncated by a row limit.

---

## Two layers of interpretation, kept separate

**Autumn's take** (`lib/analytics/narrative.ts`) is *analysis*: a conclusion
derived from the current period's queried numbers. **From your Autumn team**
(`autumn_actions`) is *history*: work Autumn actually recorded doing. Blurring
them would let the product imply it acted on something it only observed, so
they are generated and rendered separately.

The narrative layer refuses to assert cause. It will say a market accounted for
growth; it will not say a campaign caused it. `npm test` covers the ways it
could go wrong — naming the wrong entity, inventing a cause, dividing by a zero
prior period, or dramatising a flat period.

```bash
npm test    # node:test, no framework
```

---

## Data verification

```bash
npm run verify:data
```

This runs 36 assertions against the hosted database using the same publishable
key the browser uses, so it proves what a visitor can actually reach. It checks
that the Supabase URL is a hosted project rather than a local one, that the
property the app asks for exists, that there are at least 720 distinct metric
days, that impressions ≥ clicks ≥ website visits on every row, that no night
oversells the property's 19 rooms, and that every figure on the dashboard
reconciles with the underlying rows: headline revenue against the sum of
booking rows, campaign and market totals against the same, and CTR, booking
conversion, ROAS and average booking value against their own inputs. It exits
non-zero on any failure.

## Quality checks

```bash
npm run lint          # eslint
npx tsc --noEmit      # types
npm run build         # production build
npm test              # narrative unit tests
npm run verify:data   # 36 assertions against the hosted database
```

## Assumptions

- Fictional demo property with generated data. No real hotel or guest exists here.
- **Last-touch campaign attribution**, recorded on the booking row. The seed
  assigns each booking to the campaign that produced the visit.
- Marketing performance is filtered by **when the booking was made**
  (`booked_at`), not when the guest arrives, and dates are resolved in the
  property's timezone by Postgres.
- Ranges are anchored to the most recent day of data rather than to the server
  clock, so "year to date" always describes a period that has rows in it.
- Direct bookings Autumn cannot connect to a campaign exist in the `bookings`
  table with `attributed_to_autumn = false` and are excluded from every figure —
  the attribution filter is doing real work, not decorating a query.

---

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import it in Vercel; Next.js is detected automatically.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to
   Production, Preview and Development **before** the first production deploy.
4. Deploy, then check `/dashboard` and `/dashboard/bookings` load directly.

Do not set `SUPABASE_SERVICE_ROLE_KEY` in Vercel. The application never reads it.

---

## Tradeoffs

- **Rule-based insights, not a generative layer.** The thresholds are visible in
  `lib/analytics/insights.ts` and behave the same way every load. The UI does not
  claim an AI wrote them.
- **Aggregation in SQL rather than an ORM or an API layer.** Fewer moving parts,
  and the metric definitions are reviewable in one file.
- **A native `<select>` for the date range** instead of a custom dropdown. It is
  keyboard- and screen-reader-correct for free, which mattered more than matching
  a designed popover.
- **Device breakdown is intentionally absent.** It is diagnostic, not
  executive-level; it earns space only when it explains a result.
- **One chart, two series.** Four lines on two axes is how a dashboard stops
  answering a question.
- **No custom date range picker.** Four presets cover the question this screen
  exists to answer; `?from=&to=` is supported in the URL for anything else.

## What I'd do next

- **Validate the hierarchy with actual operators.** The whole thesis is that an
  owner wants an outcome and not a metric wall. That belief is reasoned, not
  tested, and five conversations would either confirm it or reorder the page.
- **Tune the narrative thresholds from real reactions.** The numbers in
  `insights.ts` decide when the product speaks up. They are currently my
  judgment about what is worth mentioning, which is the weakest part of the
  layer.
- **Make attribution inspectable.** The methodology note explains last-touch in
  prose; an owner who disagrees with a number cannot yet click into the
  bookings behind it.
- **Support a second property without adding a switcher to this screen.** The
  schema is already property-scoped, so this is a routing and identity problem
  rather than a data one.
- **Connect a real PMS or booking engine** so the direct-booking figures come
  from the hotel's own reservations rather than from a generator.

## Documents

| File | What it is |
|---|---|
| [`MODEL_ASSUMPTIONS.md`](MODEL_ASSUMPTIONS.md) | The research and modeling audit trail behind the dataset |
| [`DESIGN_DECISIONS.md`](DESIGN_DECISIONS.md) | Why the product looks the way it does |
| [`QA_REPORT.md`](QA_REPORT.md) | The final QA pass, with evidence |
