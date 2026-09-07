# Autumn Submission

## Live URL

Main dashboard: <https://autumn-marketing.vercel.app/dashboard>

Booking detail: <https://autumn-marketing.vercel.app/dashboard/bookings>

No login. Both routes are publicly reachable.

## Repository

<https://github.com/N1tu-Mar/autumn-marketing>

> **Check before sending:** confirm the repository is public, or that the Autumn
> reviewers have been given access. A private repo is the most common way a
> submission stalls.

## Screenshots

In `submission/screenshots/`, all captured from production at twice the device
pixel ratio:

| File | What it shows |
|---|---|
| `redesigned-main-dashboard.png` | Main dashboard, 1440 wide, full page, Last 30 days |
| `redesigned-booking-detail.png` | Booking detail screen, 1440 by 1100 |
| `redesigned-booking-detail-full.png` | The same screen, full page. Archive copy |
| `main-mobile.png` | Main dashboard at 390 by 844. Optional |
| `detail-mobile.png` | Detail screen at 390 by 844. Optional |
| `reference-dashboard.png` | **Not present, see below** |

### Outstanding: the reference dashboard screenshot

**The original Autumn reference image has to be attached by hand from the
assignment.** It is not in this repository and was not available in the build
environment. It was deliberately not recreated, because a fabricated "before"
screenshot would misrepresent a product this project did not build.

Save it as `submission/screenshots/reference-dashboard.png`, or attach it
directly to the email.

## Setup

See [`README.md`](README.md) for local setup, environment variables, database
migrations, seeding and verification, with the exact commands.

## Checklist

- [x] Live URL works
- [x] Main dashboard works
- [x] Detail screen works
- [ ] Repo accessible. **Confirm it is public**
- [x] README complete
- [x] Database setup documented
- [x] Seeding documented
- [ ] Reference screenshot attached, **from the original assignment**
- [x] Main redesign screenshot attached
- [x] Detail screenshot attached

## Final state

| Command | Result |
|---|---|
| `npm run lint` | Clean |
| `npx tsc --noEmit` | Clean |
| `npm run build` | Passes, both routes dynamic |
| `npm test` | 9 of 9 |
| `npm run verify:data` | All 36 checks passed |

766 days of history, against a requirement of 720. Production is current with
`main`.
