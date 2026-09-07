# Follow Up Conversation Prep

Notes to speak from, not a script.

## The 30 second version

> Autumn's customer is a hotel owner, not a performance marketer. The existing
> dashboard treats impressions, clicks, CTR, devices and revenue as roughly
> equally important, which works only if you already know which number matters.
> So I rebuilt the main screen as a short briefing: one number, direct booking
> revenue, then the booking count, how it compares with the same period last
> year, what changed, and what Autumn is doing about it. The second screen
> answers the only natural follow up, which is what drove those bookings. Both
> are backed by a hosted Postgres database with 766 days of modeled history, and
> nothing on either screen is hardcoded. Every figure is aggregated at request
> time.

## The customer

Owner or GM of an independent hotel. Often also the revenue manager and the
marketing department. Deep hospitality expertise, no reason to know ad platform
vocabulary. Reading between a check in and a vendor call, standing up, in under
a minute.

## The core problem

The original dashboard makes the reader do two jobs before they learn anything:
work out which number matters, then work out whether it is good. My rule was
that **Autumn should do the analytical work so the owner does not have to.**

## The main screen

One figure at display size: direct booking revenue. The comparison is written as
a sentence, "91% more booking revenue than the same 30 days last year", because
a green badge reading +91% still needs decoding. More than what, since when.

Impressions and visits became a rail rather than cards, with the booking rate on
the connector. A rate explains a result; it is never presented as one. Cards
would imply four separate results.

Then a written conclusion, then what Autumn has actually been doing, ending with
the sentence that is easiest to forget and most reassuring: Autumn runs this
work for you, no action needed from you.

## Why the second screen is booking drivers

The obvious choice is a traffic or campaign page. I did not build one because it
answers a question this customer never asked. The main screen makes a claim,
that Autumn produced this revenue, and the only natural follow up is what drove
it. That is also what an owner needs answered before they renew.

So the second screen restates the same revenue figure in the same words, then
answers only that: which type of marketing brought in the most, which guest
markets sent them, what the path looked like, what it cost. The two screens are
one argument in two parts.

## What I removed and demoted

Removed: the duplicate booking value card, device breakdown, visitor
demographics, pages per session, the generic events list.

Demoted: ad clicks and click rate to the second screen's journey, the campaign
table behind a disclosure, attribution methodology behind a second disclosure,
return on ad spend to a footnote under "$6.49 in booking revenue for every $1
spent".

Each of those answers a growth marketer's question. None answers "is Autumn
working". They stay reachable so an agency can reconcile, without making the
owner walk past them.

## Why the comparison is last year

A lake town hotel in Michigan measured against last month is being measured
against the weather. Comparing with the same period last year is the only thing
that means anything for a seasonal business, which is also why the dataset needs
two full summers and 766 days rather than the minimum 720.

Where the prior year has no data, both screens say there is no comparable period
yet instead of inventing a comparison against zero.

## How the database works

Five fact tables: `properties`, `campaigns`, `campaign_daily_metrics`,
`bookings`, `autumn_actions`.

No stored dashboard metric anywhere. No stored CTR, no conversion rate, no
revenue total. SQL functions compute everything at request time, so both screens
share one definition of every metric.

**The demonstration:** change a `booking_value` in the Supabase table editor and
reload. Headline revenue, average booking value, the chart bucket, the campaign
row, the market row and any dependent insight all move. A dashboard backed by
stored aggregates looks identical in a screenshot and is a different product.

Row level security is on, the browser key can only read, and I probed that
rather than assuming it.

## Why Hotel Nichols

I needed a property whose shape was publicly documented, so the model would be
constrained by something real: 19 keys, South Haven Michigan, family operated
since 1884, in a destination whose tourism board publishes visitation data.
Eight candidates are compared in `MODEL_ASSUMPTIONS.md`. It had the best
documented room inventory of any of them.

## Real against modeled

Real: identity, room count, location, ownership, historic status, destination
seasonality and where visitors come from. All cited.

Modeled: every booking, impression, click, visit and dollar.

The hotel's actual occupancy, revenue and advertising are not public, are not
used, and are not claimed. It has no relationship with Autumn, which is
fictional. That boundary is stated in the README and in `MODEL_ASSUMPTIONS.md`,
and deliberately kept out of the dashboard, where a disclaimer would be noise.

## Biggest technical tradeoff

Aggregating in Postgres rather than in application code. Upside: one definition
of each metric shared by both screens, a two year range in a single round trip,
and no query silently truncated by a row limit. Downside: the metric logic lives
in SQL migrations, which is harder to unit test than TypeScript, and changing a
definition means a migration.

I took that trade because two screens disagreeing about what booking revenue
means would be the worst possible bug in a product whose entire pitch is
trustworthiness.

## Biggest product tradeoff

Showing one property with no switcher, when the schema is fully property scoped.
A switcher is the obvious enterprise move and it adds a control this customer
uses once. The architecture supports more; the interface deliberately does not
advertise it.

## What changed along the way

The most useful thing I learned is that **the terminology was the product
problem, not a copy problem.** I started by renaming labels, "Impressions" to
"Times your ads were shown", and it did not really work, because a renamed
metric is still a metric the reader has to interpret. What worked was moving the
interpretation into the product: rates on connectors phrased as events,
comparisons written as sentences, and a layer whose only job is to state a
conclusion. Customer language became an architectural layer rather than a pass
over strings.

Second: **plain language makes precision harder, not easier.** "406,000
travelers saw your ads" is friendlier than "406,357 impressions" and it is
false, because impressions are appearances rather than people. Every rewrite had
to be rechecked against what the column actually holds.

A concrete example I like: replacing the em dash placeholder with the words "Not
available" instantly exposed a sentence reading "Not available of ad appearances
led to a click", a bug the punctuation had hidden for the whole build. Now a
rate with no denominator drops its whole clause.

And in final QA, Autumn's take was calling the fastest growing market the
"strongest" one, which on a 90 day window named the fifth largest market. The
rule was right; the sentence attached to it was making a different claim.

## Questions I should be ready for

**"Why not put Autumn's take at the top?"** I tried it. It pushes the number
down, and the take is only credible once you have seen the figure it is
interpreting. Leading with the conclusion works when the reader already trusts
the source, and this product has not earned that in the first two seconds.

**"Isn't the hero card mostly empty?"** Yes, and that is the loudest signal that
this is not a wall of metrics. Filling it would undo the main decision.

**"How do I know the data really comes from a database?"** Change a row and
reload. Or run `npm run verify:data`: 36 assertions against the hosted database,
including that headline revenue equals the sum of booking rows and that return
on ad spend equals revenue over spend.

**"What is still weak?"** The narrative thresholds. They decide when the product
speaks up and they are my judgment rather than anything observed. Attribution is
explained but not auditable either: you can read how a booking gets credited,
but you cannot click a number and see the bookings behind it.

The last copy problem is worth mentioning too. The team notes render on the main
screen but their text is data, so eight of ten rows still spoke advertising long
after the interface had stopped. Fixing it meant editing the generator and
reseeding, and the reason that was safe is worth saying out loud: the copy is a
static array and the actions are generated last, so the reseed reproduced every
number exactly. I diffed the verifier output before and after to prove it.

## What I would do with another week

1. **Talk to five operators.** The whole hierarchy is a belief about what an
   owner wants first. It is reasoned, not tested, and it is the thing most worth
   trying to falsify.
2. **Tune the narrative thresholds from real reactions.**
3. **Make attribution inspectable**, so a doubted number can be opened.
4. **Connect a real booking engine**, so the figures come from actual
   reservations.

What I would not do is add more charts. The main screen has one because a second
would start competing with the answer.
