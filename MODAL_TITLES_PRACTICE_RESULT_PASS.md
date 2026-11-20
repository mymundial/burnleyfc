# Burnley vs Preston — modal titles and Practice result panel

## Changes

- The four modal headings — **PRACTICE**, **LEADERBOARD**, **ENTER COMPETITION**, and **TERMS AND CONDITIONS** — now share the same larger responsive type size (`clamp(21px, 6.3vw, 28px)`). Their National 2 Compressed Bold Italic styling remains unchanged.
- The Terms view currently displays `TERMS AND CONDITIONS` following the latest wording update; the underlying section structure remains unchanged.
- Gave the **Practice** football result a rounded inner panel with the same background colour, transparency, border, radius and inset highlight as the established leaderboard panel. The score, crests, team labels, navigation and REPLAY button are unchanged.

No changes to competition scoring, leaderboard content, gameplay, registration, T&Cs body, fonts, or other pages.

## Verification

- `npm test` — 23 passing tests, including 2 focused regression tests for this pass.
- JS/JSX syntax parsed with TypeScript (TSX mode) in the build environment.
- Source change scope checked against the last Practice End Modal full ZIP.
- Package ZIP integrity checked after writing.

**Font assets:** Continue using your existing font files. Licensed National and Denim font binaries are not added to these ZIPs.

**Visual validation:** This environment does not have the project frontend dependencies installed, so a live Vite/browser render was not completed.
