# Burnley vs Preston — Firebase / Vercel integration

**Current setup instructions are in [`FIXTURE_AUTH_FIREBASE_PASS.md`](./FIXTURE_AUTH_FIREBASE_PASS.md).**

The competition API now supports fixture-isolated sessions, email-first account
recovery, per-player completed-match counters, one highest score per player,
server-enforced competition opening/closing times, and automatic overall totals.

Do not use an older setup guide that lists only four Vercel environment variables:
`COMPETITION_START_AT`, `COMPETITION_END_AT`, `FIREBASE_WEB_API_KEY`, and
`COMPETITION_PUBLIC_URL` are also required for this pass.

No Firestore collections need to be created manually. Do not upload service
account JSON or private keys to source control. All live functionality must be
tested against the `burnley-competition` TEST Firebase project before launch.
