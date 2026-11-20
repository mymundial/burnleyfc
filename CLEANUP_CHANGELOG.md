# Burnley FC matchday cleanup — November 2026

Starting point: `burnley-preston-complete-game-corrected 2.zip` supplied by the user.

- Renamed the project from the original cup prototype to `burnley-fc` in
  `package.json` and `package-lock.json`.
- Replaced the obsolete cup-final teams and venue with
  Burnley/Preston/Turf Moor; retained result-flow flags and simulated away
  penalties so the working match/modal mechanics stay unchanged.
- Repointed outdated cup and former sponsor asset mappings to the
  existing Burnley crest and Vertu logo. Historical asset aliases are retained
  solely to avoid breaking dormant generic share components.
- Replaced the former sponsor fallback in canvas export with Vertu and updated
  dormant share labels and default result filenames to Burnley FC.
- Removed historical prototype pass notes and fixture-only team definitions.
- **Not changed:** match controls, scoreboard CSS/JSX, main typography CSS,
  approved background/pitch imagery, the `efl-ball.png` file and existing
  Championship asset, game logic, goalkeeper, replay button, current crest.

The source package does not contain font binaries. When transferring these
changes into the already working game, preserve its existing `public/fonts/`
font files unchanged.
