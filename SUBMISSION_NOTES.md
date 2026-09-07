# Autumn Submission

## Live URL

Main dashboard: <https://autumn-marketing.vercel.app/dashboard>

Booking detail: <https://autumn-marketing.vercel.app/dashboard/bookings>

## Repository

<https://github.com/N1tu-Mar/autumn-marketing>

> **Check before sending:** confirm this repository is public, or that the
> Autumn reviewers have been granted access. A private repo is the most common
> way a submission stalls.

## Screenshots

In `submission/screenshots/`:

| File                                 | What it shows                                                 |
| ------------------------------------ | ------------------------------------------------------------- |
| `redesigned-main-dashboard.png`      | Redesigned main dashboard, 1440 wide, full page, Last 30 days |
| `redesigned-booking-detail.png`      | Connected booking detail screen, 1440×1100                    |
| `redesigned-booking-detail-full.png` | Same screen, full page — archive/optional                     |
| `main-mobile.png`                    | Main dashboard at 390×844 — optional responsive evidence      |
| `detail-mobile.png`                  | Detail screen at 390×844 — optional responsive evidence       |
| `reference-dashboard.png`            | **Not present. See below.**                                   |

All captures are from the live production deployment at a 2× device pixel ratio.

### Outstanding: reference dashboard screenshot

**The original Autumn reference dashboard image must be attached by hand from
the assignment.** It is not in this repository and was not available in the
build environment. It was deliberately not recreated or approximated, because a
fabricated "before" screenshot would misrepresent a product this project did not
build.

Save it as `submission/screenshots/reference-dashboard.png`, or attach it
directly to the submission email.

## Setup

See [`README.md`](README.md) — local setup, environment variables, database
migrations, seeding, data verification and deployment, with the exact commands.

## Demo credentials

No login required. Both routes are publicly reachable.

## Submission checklist

- [x] Live URL works
- [x] Main dashboard works
- [x] Detail screen works
- [ ] Repo accessible — **confirm it is public**
- [x] README complete
- [x] DB setup documented
- [x] Seed setup documented
- [ ] Reference screenshot attached — **from the original assignment**
- [x] Main redesign screenshot attached
- [x] Detail screenshot attached

## Final state

| Command               | Result                      |
| --------------------- | --------------------------- |
| `npm run lint`        | Clean                       |
| `npx tsc --noEmit`    | Clean                       |
| `npm run build`       | Passes, both routes dynamic |
| `npm test`            | 9/9                         |
| `npm run verify:data` | All 36 checks passed        |

766 days of history (requirement: 720). Production current with `main`.
