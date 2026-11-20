# Burnley FC – Registration and leaderboard UI pass (20 November 2026)

Changes from `burnley-preston-terms-typography-spacing-full.zip`:

- Terms modal button: BACK TO COMPETITION ENTRY.
- Home scoreboard commentary: PLAY TO WIN A BURNLEY FC E-GIFT CARD!
- Registration usernames allow 1–12 uppercase letters/digits, consistently in the form, API validation and leaderboard output.
- Removed the development-only `LIVE LEADERBOARD UNAVAILABLE · SCORE NOT SUBMITTED` message. An actual failed live submission still shows an actionable error and retry control.
- Leaderboard X retains its existing home navigation. Removed footer HOME button and the two-button enclosing box. REPLAY is now one full-width existing blue-styled button.
- No change to competition scoring, registration terms, fonts, match visuals, ranking logic or practice mode.

Tests: `npm test` passed all 19 tests. All 50 JS/JSX/MJS source and test files passed a TypeScript syntax parse. Full Vite build not performed: local node_modules do not contain vite; install dependencies before building.

Font files are not bundled. Retain your licensed font files when applying the update-only ZIP.
