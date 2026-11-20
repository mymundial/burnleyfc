# Burnley vs Preston — Practice End Modal (20 November 2026)

Scope: practice-mode end modal only. This pass leaves the competition leaderboard, registration, scoring system, match controls, global fonts and other visual elements unchanged.

- Adds a compact header with the Burnley crest, **PRACTICE** title and close X.
- The close X returns to the home screen using the existing `onHome` callback.
- Retains the football result (Burnley vs Preston and the match score).
- Removes the challenge-points pill, HOME and ENTER COMPETITION buttons from the practice result.
- Keeps a single, full-width blue REPLAY button that restarts Practice Mode via the existing `onNext` callback.
- Preserves existing victory confetti/fireworks behaviour.

Changes: `src/components/match/EndMatchModal.jsx` only, plus regression test `tests/practiceModal.test.mjs`.

Verification: `npm test` (21/21 passing); TypeScript JavaScript/JSX source parse (41 files, no parse errors). No live browser layout test was performed in this environment.

The font binaries are intentionally not included in this package. If your working local project already has the correct fonts, use the update-only ZIP.
