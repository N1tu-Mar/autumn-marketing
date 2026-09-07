# Autumn Marketing Dashboard

A redesign of Autumn's marketing dashboard for the person who actually opens it:
the owner of an independent hotel who wants to know whether Autumn is producing
direct bookings.

**Live:** <https://autumn-marketing.vercel.app/dashboard> (no login)

| Screen | The question it answers |
|---|---|
| [`/dashboard`](https://autumn-marketing.vercel.app/dashboard) | Is Autumn getting me more direct bookings and revenue? |
| [`/dashboard/bookings`](https://autumn-marketing.vercel.app/dashboard/bookings) | What is driving those bookings? |

Both screens read from a hosted Postgres database at request time. Nothing on
either screen is a stored total.

---

## Why it looks like this

Autumn's customer is usually not a growth marketer. They are an innkeeper, a
GM, or an owner who is also the revenue manager and covers the front desk when
someone calls in sick. They know hospitality. They have no reason to know what
CTR, ROAS, metasearch or attribution mean, and they are reading between a check
in and a vendor call.

The original dashboard gives impressions, clicks, CTR, devices, page views and
revenue roughly equal weight. That asks the reader to do two jobs before they
learn anything: work out which number matters, then work out whether it is good.

So the product does that work instead. One rule decided most of the rest:

> **Autumn should do the analytical work so the owner does not have to.**

In practice that means:

- **One number is set at display size.** Direct booking revenue. Nothing else on
  the screen is allowed to compete with it.
- **The comparison is a sentence, not a badge.** "91% more booking revenue than
  the same 30 days last year" needs no decoding. A green `+91%` still does.
- **Rates sit on connectors, never in cards.** A rate explains a result. It is
  never presented as one.
- **Comparisons default to the same period last year.** A lake town hotel
  measured against last month is being measured against the weather.
- **Autumn states a conclusion.** A layer of rules reads the same queried
  numbers and says what they mean in a sentence.
- **Concerns outrank wins.** If visits are up and the booking rate is down, that
  ranks above the revenue win.

Removed from the main screen: the duplicate booking value card, device
breakdown, visitor demographics, pages per session, the generic events list.
Demoted to the second screen: ad clicks, click rate, campaign detail,
attribution methodology.

## What is on each screen

**`/dashboard`** opens with the property and town, then a spoken line ("You've
had a strong month."), then revenue, the booking count and the comparison. Below
that: a three step journey from ad appearances to website visits to direct
bookings, one chart of revenue against the same period last year, Autumn's
written conclusion, and what the Autumn team has been doing.

**`/dashboard/bookings`** restates the same revenue figure in the same words,
then answers only what drove it: which type of marketing brought in the most,
which guest markets sent them, the full path from ad to booking, what it cost,
and how a booking gets connected to marketing at all.

The date range lives in the URL, so it travels with you between the screens and
every query rebuilds when it changes. Four presets cover the usual questions,
and `?from=&to=` handles anything else.

## The question marks

Small circled question marks sit beside anything that uses a technical term.
They appear on the six column headers of the detailed marketing table, on the
two journey connectors that carry a rate, and beside the return on ad spend
footnote. Their text comes from one file, `lib/content/metric-language.ts`, so
the same metric is explained the same way everywhere.

Two rules govern them.

**A label must read on its own.** If a label only makes sense once you open its
tip, the label is wrong. The tips elaborate; they are never the thing that makes
a heading comprehensible. "Times your ads were shown" already works. The tip
adds that this counts appearances rather than people, because one traveler can
see an ad several times.

**The text is not trapped behind hover.** The full explanation is the button's
accessible name, so a screen reader gets it without the panel ever opening, and
the button is focusable, so it works on a phone where there is no hover at all.

The panel opens above its trigger on desktop. Callers say where it should go,
because only the caller knows what would clip it: the table headers open
downward, since a header at the top of a scrolling box has no room above it, and
the last column opens leftward. Below the small breakpoint no anchor works at
all, because the trigger lands wherever the sentence happens to wrap, so the
panel pins to the bottom of the viewport instead.

## Motion

Motion is used to settle the page, never to decorate it. The whole inventory:

| What | Where | Why |
|---|---|---|
| `rise`, a 420ms fade and 6px lift, once | The hero card and the booking summary figure | One quiet settle on entry. It runs once so the numbers are readable immediately. |
| `help-pulse`, an 8s loop | The question mark rings | The tips are quiet by design, which makes them easy to miss. Once every eight seconds the ring expands and fades, long enough to notice and short enough not to nag. Hover and focus stop it, so the cue never competes with the state it advertises. |
| `animate-pulse` skeletons | Both loading screens | Each skeleton is shaped like the screen it precedes, so nothing jumps when data lands. |
| Colour transitions | Links, buttons, the range selector, disclosure summaries | Ordinary hover feedback. |
| Opacity transition | The help panel | Fades rather than snapping. |
| A 2px nudge | The arrow on "See what's driving your bookings" | Signals direction on hover. |
| A rotated caret | The detailed marketing disclosure | Shows open and closed state. |

Two deliberate absences. **The chart does not animate.** Recharts draws with
`isAnimationActive={false}`, because a line sweeping into place delays the
answer and makes a page feel slower than it is. And every animation and
transition is reduced to almost nothing under `prefers-reduced-motion`, which is
handled globally in `app/globals.css`.

## Architecture

```
Supabase Postgres
  5 fact tables, RLS enabled, select only for the browser key
      |
      |  5 SQL aggregation functions (supabase/migrations/0002_...)
      |  overview_metrics, performance_trend, campaign_performance,
      |  feeder_markets, latest_data_date
      v
lib/data/queries.ts        one typed wrapper per function
      v
lib/analytics/             metrics.ts   one definition per derived metric
                           insights.ts  which observation is worth showing
                           narrative.ts the conclusion, Autumn's take
                           range.ts     date windows and their comparisons
                           format.ts    how figures read
lib/content/               metric-language.ts, campaign-copy.ts
                           every customer facing word, in one place
      v
lib/data/overview.ts | bookings.ts     one parallel fetch per screen
      v
app/dashboard/**/page.tsx  Server Components, force-dynamic
      v
components/**              presentational only, no database access
```

Three things about this shape matter.

**No table stores a dashboard metric.** There is no stored CTR, no stored
conversion rate, no stored revenue total. Every figure is aggregated from facts
on each request. Change a `booking_value` in the Supabase table editor and
reload: the headline revenue, the average booking value, the chart bucket, the
campaign row, the market row and any dependent insight all move together.

**Aggregation happens in Postgres, not in JavaScript.** Both screens share one
definition of every metric, a two year range is one round trip instead of
thousands of rows, and no query is silently cut off by a row limit.

**Customer language is a layer, not a pass over strings.** Renaming labels was
not enough, because a renamed metric is still a metric the reader has to
interpret. `lib/content/` holds the vocabulary and `lib/analytics/narrative.ts`
holds the interpretation, so the two can be reviewed and tested separately.

Autumn's take is deterministic. It is built from templates and thresholds that
are visible in the source, it behaves identically on every load, and it refuses
to assert cause: it will say a market grew, never that a campaign caused it.
There is no model in the render path and the interface never suggests there is.

## Infrastructure

| Piece | Choice |
|---|---|
| Framework | Next.js 16.3.4, App Router, Server Components |
| UI | React 19.2.8, TypeScript, Tailwind CSS v4 |
| Type | Instrument Sans for figures, Instrument Serif for the one spoken line per screen |
| Chart | Recharts, one chart, two series |
| Database | Supabase hosted Postgres with row level security |
| Hosting | Vercel |
| Tests | `node:test`, no framework |

Both routes are `force-dynamic`, so every load is a fresh read.

**Security.** Row level security is on for all five tables, and the only
policies granted to the browser key are `select`. The publishable key is
visible to the client by design and cannot write. The service role key is used
by the seed script alone, is never imported by the application, and is never set
in Vercel.

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app and seed | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | app | Read only through RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | seed script only | Never in Vercel |

## Running it

```bash
npm install
cp .env.example .env.local   # fill in your Supabase values
npm run dev
```

Database, once per project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push     # applies supabase/migrations/*
npm run seed         # writes 766 days of generated facts
npm run seed:verify  # asserts the data is sane, exits non zero if not
```

If you prefer the Supabase dashboard, paste the files in `supabase/migrations/`
into the SQL editor in order, then run `npm run seed`. The generator uses a
fixed seed, so seeding twice produces the same database.

### The tables

| Table | Grain | Holds |
|---|---|---|
| `properties` | 1 row | The hotel: name, city, timezone, room count |
| `campaigns` | 1 per campaign | Name, type, status, run dates |
| `campaign_daily_metrics` | campaign by day | Impressions, clicks, website visits, ad spend |
| `bookings` | 1 per reservation | Value, room nights, stay dates, guest market, attribution |
| `autumn_actions` | 1 per action | What Autumn changed, when, and why |

## Checking that it is real

```bash
npm run verify:data
```

36 assertions against the hosted database, using the same publishable key the
browser uses, so it proves what a visitor can actually reach. It checks that the
database is hosted rather than local, that there are at least 720 distinct days
of history, that impressions are never below clicks and clicks never below
visits, that no night oversells the property, and that every figure on the
dashboard reconciles with the rows beneath it: headline revenue against the sum
of booking rows, campaign and market totals against the same, and CTR, booking
conversion, return on ad spend and average booking value against their own
inputs. It exits non zero on any failure.

```bash
npm run lint         # eslint
npx tsc --noEmit     # types
npm run build        # production build
npm test             # narrative rules
npm run verify:data  # 36 assertions against the hosted database
```

## The data

**766 consecutive days**, 2024-08-01 to 2026-09-05: 3,175 daily metric rows
across 5 campaigns, 1,489 direct bookings, 23 guest markets. Two full summers,
which is what a comparison against last year needs.

The property is real and publicly documented: **Historic Hotel Nichols**, 201
Center Street, South Haven, Michigan. 17 rooms and 2 suites, family operated
since 1884, on the National Register of Historic Places. Its size, location,
room inventory, seasonality and advertised rates come from public sources, all
cited in [`MODEL_ASSUMPTIONS.md`](MODEL_ASSUMPTIONS.md).

**Everything the dashboard displays is synthetic.** The hotel's actual
occupancy, revenue, bookings, channel mix and advertising are not public, are
not used, and are not claimed here. It has no relationship with Autumn, which
is a fictional product.

The generator runs hotel economics before marketing:

```
19 rooms -> available room nights -> seasonal demand -> occupancy -> ADR
  -> sold room nights -> stays -> direct share -> attributed bookings
  -> website visits -> ad clicks -> ad impressions -> ad spend
```

Every stay claims inventory from a room ledger, so no night can sell more than
19 rooms. This order is the point. Generating marketing metrics first and
deriving revenue from them produces a hotel that sells 40 rooms on a Tuesday in
February, which is the clearest sign that a dataset was written to flatter a
dashboard.

Two scopes get reported and they are easy to confuse:

| Figure | Scope | Value |
|---|---|---|
| Room nights sold of available | The whole modeled hotel, every channel | 8,347 of 16,834, 49.6% occupancy |
| Busiest night | The whole modeled hotel | 19 of 19 rooms |
| Modeled room revenue | The whole modeled hotel, every channel | $2,001,656 |
| Direct bookings stored in `bookings` | Direct channel only | 1,489 bookings, $870,976 |
| The subset Autumn is credited with | What the dashboard shows | 648 bookings, $384,268 |

The first three describe the hotel the model imagines. They are seed time
figures, never written to a table and never rendered, which is why
`verify:data` reports room nights in the low thousands rather than 8,347.

The data has unflattering stretches on purpose: a softer autumn in 2025, a
budget shift away from broad search, and a discovery expansion in spring 2026
that lifted visits faster than bookings. That last one is what makes the "more
travelers are reaching your website, but fewer are booking" insight fire on real
numbers rather than on a hypothetical.

## Screenshots

In [`submission/screenshots/`](submission/screenshots): the redesigned main
dashboard, the connected booking detail screen, and both screens at phone width.
All captured from production.

## Tradeoffs

- **Rules rather than a generative layer.** Thresholds are visible in
  `lib/analytics/insights.ts` and behave the same way every load. A model in the
  render path would be slower, non deterministic, and able to claim a cause the
  data does not support.
- **One property, though the schema is property scoped.** A switcher adds a
  control this customer would use once.
- **Last touch attribution, stated plainly.** Modeling multi touch would be a
  bigger lie in a nicer costume.
- **One chart, two series.** Four lines on two axes is how a dashboard stops
  answering a question.

The reasoning behind each of these, what I learned, and what I would build next
are in [`DESIGN_DECISIONS.md`](DESIGN_DECISIONS.md).

## Documents

| File | What it is |
|---|---|
| [`DESIGN_DECISIONS.md`](DESIGN_DECISIONS.md) | Why the product is shaped this way |
| [`MODEL_ASSUMPTIONS.md`](MODEL_ASSUMPTIONS.md) | The research and modeling audit trail, with citations |
| [`QA_REPORT.md`](QA_REPORT.md) | The final QA pass and every defect it found |
| [`SUBMISSION_NOTES.md`](SUBMISSION_NOTES.md) | Submission checklist and outstanding items |
