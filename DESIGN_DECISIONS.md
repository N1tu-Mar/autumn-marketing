# Design Decisions

The reasoning behind the product. [`README.md`](README.md) covers what it does
and how to run it.

## 1. Who I designed for

The person who opens this is usually the owner of an independent hotel, or a GM
who is also the revenue manager and the marketing department. They know
hospitality extremely well. They have not spent five years inside Google Ads,
and they should not have to.

They are also not sitting down to study a dashboard. They are between a check in
and a vendor call. The realistic budget is under a minute, standing up.

That produced the rule that decided most of the rest: **Autumn should do the
analytical work so the owner does not have to.** If a number requires the reader
to compute a relationship, hold two figures in their head, or know an acronym,
the product has pushed its own job onto the customer.

## 2. The question I prioritised

> Is Autumn helping my hotel get more direct bookings and revenue?

Everything on the main screen either answers that, supports the answer, or says
what Autumn is doing about it. Anything answering a different question moved to
the second screen or came out entirely.

The corollary matters as much: the product may only say one thing loudly.

## 3. Why the main screen looks the way it does

**Revenue is the only figure at display size, and the comparison is a sentence.**
The original dashboard gives impressions, clicks, CTR, devices, page views and
revenue roughly equal weight, which asks the reader to decide which number
matters and then decide whether it is good. This answers both at once: $25,551,
then "91% more booking revenue than the same 30 days last year." A green badge
reading +91% would still need decoding. More than what, since when.

**Bookings and average booking value support rather than compete.** Three growth
badges side by side make a reader compare the badges instead of reading the
result, so the booking count is one line of body text and average booking value
is a footnote.

**The journey is a rail, not cards.** Ad appearances, then website visits, then
direct bookings, with the booking rate sitting on the connector between them.
Cards would imply four separate results. A rate explains a result; it is never
presented as one.

**The comparison is always the same period last year.** A lake town hotel in
Michigan measured against last month is being measured against the weather. This
is also why the dataset needs two full summers.

**Autumn states a conclusion.** A layer of rules reads the same queried numbers
the rest of the screen renders and says what they mean in a sentence: which
strategy carried the period, which market grew most, or what is worth watching.
Without it the product hands over facts and calls that a service.

**The team notes are history, not analysis.** They read from an `autumn_actions`
table and render separately from Autumn's take, because blurring the two would
let the product imply it acted on something it only observed. The section ends
with the sentence that is easiest to forget and most reassuring: Autumn runs
this work for you, no action needed from you.

**Concerns outrank wins.** If visits are up and the booking rate is down, that
ranks above the revenue win. A product that only reports good news stops being
trusted.

## 4. Why the second screen is booking drivers

The obvious second screen is a traffic or campaign page. I did not build one,
because it answers a question this customer never asked.

The main screen makes a claim: Autumn produced this revenue. The only natural
follow up is what drove it, and that is also what an owner needs answered before
they renew. So the second screen restates the same revenue figure in the same
words, then answers only that: which type of marketing brought in the most,
which guest markets sent them, what the path looked like, what it cost, and how
a booking gets connected to marketing at all.

The two screens are one argument in two parts. The second explains the first
rather than exposing more of the database.

## 5. Progressive disclosure

Click rate, ad clicks, campaign detail and attribution methodology are all
present and all subordinate.

- Rates sit on journey connectors, phrased as things that happened: "2.8% of ad
  appearances led to a click."
- Return on ad spend leads with "$6.49 in booking revenue for every $1 spent"
  and demotes "6.5x return on ad spend" to a footnote beneath it.
- The full campaign table sits behind "See detailed marketing numbers", with
  plain column headings and the industry term in the help text.
- Attribution gets one visible sentence. The methodology, which date a booking
  counts on, which campaign gets credit, what is excluded, sits behind "See how
  these numbers are calculated."

The test I applied: **if a label is incomprehensible without opening its tip,
the label is wrong.** Tips elaborate, they are never load bearing. That is also
why the full help text is each button's accessible name rather than living only
in the panel.

## 6. Data model

Five tables of facts: `properties`, `campaigns`, `campaign_daily_metrics`,
`bookings`, `autumn_actions`.

No table stores a dashboard metric. Every figure on both screens is aggregated
from these facts at request time by SQL functions.

This was the most consequential engineering decision and it is what makes the
demo honest. Because the store is events and facts, changing one
`booking_value` in the table editor moves the headline revenue, the average
booking value, the chart bucket, the campaign row, the market row and any
dependent insight, all on the next load. A dashboard backed by stored aggregates
looks identical in a screenshot and is a different product.

Aggregation runs in Postgres rather than JavaScript for three reasons: both
screens share one definition of every metric, a two year range is one round trip
rather than thousands of rows, and no query is silently truncated by a row limit.

The date range is server state living in the URL, so both screens share a window
and every query reruns when it changes. Ranges anchor to the most recent day
that has data rather than to the server clock, so a reviewer never lands on a
half empty period.

## 7. Data realism

The property is real and publicly documented: Historic Hotel Nichols, South
Haven, Michigan. 17 rooms and 2 suites, family operated since 1884, on the
National Register of Historic Places. Size, location, inventory, seasonality and
advertised rates come from public sources, cited in
[`MODEL_ASSUMPTIONS.md`](MODEL_ASSUMPTIONS.md).

Everything the dashboard displays is synthetic. The hotel's actual occupancy,
revenue, bookings, channel mix and advertising are not public, are not used and
are not claimed. It has no relationship with Autumn, which is fictional.

The generator runs hotel economics before marketing, and every stay claims
inventory from a room ledger, so no night can sell more than 19 rooms. That
ordering is the point. Generating marketing metrics first and deriving revenue
from them produces a hotel that sells 40 rooms on a Tuesday in February, which
is the clearest sign a dataset was written to flatter a dashboard.

The data has unflattering stretches on purpose: a softer autumn in 2025, a
budget shift away from broad search, and a discovery expansion in spring 2026
that lifted visits faster than bookings. That last one is what makes the "more
travelers are reaching your website, but fewer are booking" insight fire on real
numbers.

## 8. Tradeoffs

- **One property in the interface, though the schema is property scoped.** A
  switcher would add a control this customer uses once. The architecture
  supports more; the interface deliberately does not advertise it.
- **Deterministic synthetic data rather than an ingestion layer.** A connector
  would have consumed the time that went into the two screens and demonstrated
  plumbing rather than judgment.
- **Last touch attribution, stated plainly, rather than pretending to solve
  incrementality.** The methodology note says exactly what it does and does not
  count. Modeling multi touch would be a bigger lie in a nicer costume.
- **Rules rather than a generative layer.** Thresholds are visible in the source
  and behave identically on every load. A model in the render path would be non
  deterministic, slower, and able to assert a cause the data does not support.
- **Two polished surfaces rather than five adequate ones.**

## 9. What I learned

**The terminology was the product problem, not a copy problem.** I started by
renaming labels, "Impressions" to "Times your ads were shown", and it did not
work, because a renamed metric is still a metric the reader has to interpret.
What worked was moving the interpretation into the product: rates on connectors
phrased as events, comparisons written as sentences, and a layer whose only job
is to state a conclusion. Customer language became an architectural layer,
`lib/content/`, rather than a pass over strings.

**Precision gets harder as language gets plainer.** "406,000 travelers saw your
ads" is friendlier than "406,357 impressions" and it is false, because
impressions are appearances rather than people. Every plain language rewrite had
to be rechecked against what the column actually holds. Impressions are not
people, bookings are not guests, visits are not visitors, and attributed revenue
is not hotel revenue.

**A rate with no denominator needed a word, not a dash.** Replacing the em dash
placeholder with "Not available" immediately exposed a sentence reading "Not
available of ad appearances led to a click", a bug the punctuation had hidden
for the whole build. Writing things out makes latent nonsense visible.

**Measure responsive behaviour, do not look at it.** A screenshot at a 390px
window looked broken in a way that turned out to be an artifact of the capture,
while the real defect, tooltips pushing the page 56px wider than the viewport,
stayed invisible until I queried `scrollWidth` under real device emulation.

**The language layer could not reach the database.** The team notes render on
the main screen but their text is data, so eight of ten rows still spoke
advertising long after the interface had stopped. Fixing it meant editing the
generator and reseeding.

## 10. What I would do next

1. **Test the hierarchy with five real operators.** The whole thesis is a belief
   about what an owner wants first. It is reasoned, not tested, and it is the
   thing most worth trying to falsify.
2. **Tune the narrative thresholds from real reactions.** They decide when the
   product speaks up and they are currently my judgment, which makes them the
   weakest part of an otherwise deterministic layer.
3. **Make attribution inspectable.** An owner who doubts a number should be able
   to click into the bookings behind it.
4. **Connect a real booking engine**, so the figures come from actual
   reservations.

What I would not do is add more charts. The main screen has one because a second
would start competing with the answer.
