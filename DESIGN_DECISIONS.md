# Design Decisions

## 1. Who I designed for

The person who opens this is usually the owner of an independent hotel, or a GM
who is also the revenue manager, the marketing department and whoever covers the
front desk when someone calls in sick. They know hospitality extremely well.
They have not spent five years inside Google Ads, and they should not have to.

They are also not sitting down to study a dashboard. They are between a check-in
and a vendor call. The realistic budget is under a minute, and the realistic
posture is standing up.

That produced one rule that decided most of the rest: **Autumn should do the
analytical work so the owner does not have to.** If a number requires the reader
to compute a relationship, hold two figures in their head, or know an acronym,
the product has pushed its own job onto the customer.

## 2. The question I prioritized

> *Is Autumn helping my hotel get more direct bookings and revenue?*

Everything on the main screen either answers that, supports the answer, or says
what Autumn is doing about it. Anything that answers a different question moved
to the second screen or came out entirely.

The corollary matters as much: the product is allowed to say only one thing
loudly. Direct booking revenue is set at display size, and nothing else on the
screen is permitted to compete with it.

## 3. Why the main page looks the way it does

**Revenue is the only display-size figure, and the comparison is a sentence.**
The reference dashboard gives impressions, clicks, CTR, devices, page views and
revenue roughly equal visual weight, which asks the reader to first decide which
number matters and then decide whether it is good. The redesign answers both:
`$25,551`, then "91% more booking revenue than the same 30 days last year." A
green `+91%` badge would still require decoding — more than what, since when.

**Bookings and average booking value support rather than compete.** Three growth
badges side by side make a reader compare the badges instead of reading the
result, so the booking count is one line of body text and average booking value
is a footnote.

**The journey is a rail, not cards.** Ad appearances → website visits → direct
bookings, with the booking rate sitting *on* the connector. A rate explains a
result; it is never presented as one. Cards would imply four separate results.

**The comparison is the same period last year, always.** A lake-town hotel in
Michigan compared against last month is being measured against the weather.
Year-over-year is the only comparison that is meaningful for a seasonal
business, which is also why the dataset needs two full summers.

**Autumn states a conclusion.** A rule-based narrative layer reads the same
queried numbers the rest of the screen renders and says what they mean in a
sentence: which strategy carried the period, which market grew most, or what is
worth watching. Without it, the product hands over facts and calls that a
service.

**"From your Autumn team" is history, not analysis.** It reads from an
`autumn_actions` table and is rendered separately from Autumn's take, because
blurring them would let the product imply it acted on something it only
observed. It ends with the most useful sentence on the page and the easiest to
forget: *Autumn runs this work for you. No action needed from you.*

**Concerns outrank wins.** If visits are up and the booking rate is down, that
ranks above the revenue win. A product that only reports good news is not
trusted for long.

## 4. Why the second screen is booking drivers

The obvious second screen is a traffic or campaign page. I did not build one,
because it answers a question this customer did not ask.

The main screen makes a claim: Autumn produced this revenue. The only natural
follow-up is *what drove it* — and that is also the question an owner needs
answered before they renew. So `/dashboard/bookings` opens by restating the same
revenue figure in the same words, then answers only that: which type of
marketing brought in the most, which guest markets sent them, what the path from
ad to booking looked like, what it cost, and how a booking gets connected to
marketing at all.

The two screens are one argument in two parts. The second explains the first
rather than exposing more of the database.

## 5. Progressive disclosure

Click-through rate, ad clicks, per-campaign detail and attribution methodology
are all present and all subordinate.

- Click rate and booking rate sit on journey connectors, phrased as things that
  happened: "2.8% of ad appearances led to a click."
- ROAS leads with "$6.49 in booking revenue for every $1 spent" and demotes
  "6.5× return on ad spend" to a footnote beneath it.
- The full campaign table is behind *"See detailed marketing numbers"*, with
  natural-language column headers and the industry term in the help text.
- Attribution gets one visible plain sentence; the methodology — which date a
  booking counts on, which campaign gets credit, what is excluded — is behind
  *"See how these numbers are calculated."*

The test I applied: **if a label is incomprehensible without opening its
tooltip, the label is wrong.** Tooltips elaborate; they are never load-bearing.
That is also why the full help text is on each button's accessible name rather
than only in the panel.

## 6. Data model

Five tables of facts: `properties`, `campaigns`, `campaign_daily_metrics`
(campaign × day), `bookings` (one row per reservation), `autumn_actions`.

No table stores a dashboard metric. There is no `dashboard_metrics` row, no
stored CTR, no stored conversion rate, no stored revenue total. Every figure on
both screens is aggregated from these facts at request time by SQL functions.

This was the most consequential engineering decision, and it is what makes the
demo honest. Because the store is events and facts, changing a `booking_value`
in the Supabase table editor moves the headline revenue, the average booking
value, the chart bucket, the campaign row, the market row and any dependent
insight — all of it, on the next load. A dashboard backed by stored aggregates
looks identical in a screenshot and is a different product.

Aggregation runs in Postgres rather than JavaScript for three reasons: both
screens share one definition of every metric, a two-year range is one round trip
instead of thousands of rows, and no query is silently truncated by a row limit.

The date range is server state living in the URL, so both screens share a window
and every query re-runs when it changes. Ranges anchor to the latest date that
has data rather than to the server clock, so a reviewer never lands on a
half-empty period.

## 7. Data realism

The property is real and publicly documented: Historic Hotel Nichols, 201 Center
Street, South Haven, Michigan — 17 rooms and 2 suites, family-operated since
1884, on the National Register of Historic Places. Its size, location, room
inventory, seasonality and advertised rate band come from public sources, all
cited in `MODEL_ASSUMPTIONS.md`.

**Everything the dashboard displays is synthetic.** The hotel's actual
occupancy, revenue, bookings, channel mix and advertising are not public, are
not used, and are not claimed. It has no relationship with Autumn, which is a
fictional product.

The generator runs hotel economics *before* marketing:

```
19 rooms → available room nights → seasonal demand → occupancy → ADR
  → sold room nights → stays → direct share → attributed bookings
  → website visits → ad clicks → ad impressions → ad spend
```

Every stay claims inventory from a room ledger, so no night can sell more than
19 rooms. This ordering is the point. Generating marketing metrics first and
deriving revenue from them produces a hotel that sells 40 rooms on a Tuesday in
February, which is exactly the tell that a dataset was written to make a
dashboard look good.

The data also has unflattering stretches on purpose: a softer autumn 2025, a
budget shift out of non-brand search, and a spring 2026 discovery expansion that
lifted visits faster than bookings — which is what makes the "more travelers are
reaching your website, but fewer are booking" insight fire on real numbers
rather than on a hypothetical.

## 8. Tradeoffs

- **One property in the UI, though the schema is property-scoped.** A switcher
  would add a control that the customer this is designed for would use once.
  The architecture supports multi-property; the interface deliberately does not
  advertise it.
- **Deterministic synthetic data rather than an ingestion layer.** Building a
  connector would have consumed the time that went into the two screens, and
  would have demonstrated plumbing rather than judgment.
- **Last-touch attribution, stated plainly, rather than a pretence of solving
  incrementality.** The methodology note says exactly what it does and does not
  count. Modeling multi-touch would have been a bigger lie in a nicer costume.
- **Rule-based narrative rather than a generative one.** Thresholds are visible
  in `lib/analytics/insights.ts` and behave identically on every load. An LLM in
  the render path would be non-deterministic, slower, and able to assert a cause
  the data does not support.
- **Two polished surfaces rather than five adequate ones.** The brief rewards
  showing the right information to the right customer, which is a claim you can
  only make convincingly at depth.
- **A native `<select>` for the date range.** Keyboard- and screen-reader-correct
  for free, which mattered more than matching a designed popover.
- **One chart, two series.** Four lines on two axes is how a dashboard stops
  answering a question.

## 9. What I learned

**The terminology was the product problem, not a copy problem.** I started by
renaming labels — "Impressions" to "Times your ads were shown" — and it did not
work, because a renamed metric is still a metric the reader has to interpret.
The change that worked was moving interpretation into the product: putting rates
on connectors as things that happened, writing comparisons as sentences, and
adding a layer whose only job is to state a conclusion. Customer language ended
up being an architectural layer (`lib/content/`), not a pass over strings.

**Precision gets harder as language gets plainer, not easier.** "406,000
travelers saw your ads" is friendlier than "406,357 impressions" and it is
false — impressions are appearances, not people. Every plain-language rewrite
had to be re-checked against what the column actually holds. Impressions are not
people, bookings are not guests, visits are not visitors, and attributed revenue
is not hotel revenue.

**A rate with no denominator needed a word, not a dash.** Replacing the `—`
placeholder with "Not available" immediately exposed a sentence reading "Not
available of ad appearances led to a click" — a bug the punctuation had been
hiding for the whole build. Writing things out makes latent nonsense visible.

**Measure responsive behaviour; do not look at it.** A screenshot at a 390px
window looked broken in a way that was an artifact of the capture, and the real
defect — tooltips pushing the page 56px wider than the viewport — was invisible
until I queried `scrollWidth` under actual device emulation.

## 10. What I'd do next

1. **Validate the hierarchy with five real operators.** The entire thesis is a
   belief about what an owner wants first. It is reasoned, not tested.
2. **Tune the narrative thresholds from real reactions.** The constants decide
   when the product speaks up; they are currently my judgment and are the
   weakest part of an otherwise deterministic layer.
3. **Make attribution inspectable.** An owner who doubts a number should be able
   to click into the bookings behind it, not just read how attribution works.
4. **Connect a real PMS or booking engine**, so direct-booking figures come from
   the hotel's own reservations.
5. **Second property without a switcher on this screen** — routing and identity,
   not a data problem.
