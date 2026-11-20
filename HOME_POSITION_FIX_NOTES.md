# Burnley home positioning correction

Scope: **Only the two home-screen positions** (floating Burnley crest and the two-button claret panel). No changes to colours, sizes, graphics, typography, scoreboard, gameplay, registration or leaderboard behaviour.

## Why it was wrong

The competition home overlay was positioned relative to the entire `FootballGame` component (including the scoreboard), whereas the Monday Cup home overlay anchors its logo and menu to the playing pitch below the scoreboard. The Burnley panel also used a bottom-of-screen anchor instead of the Monday Cup goal-line anchor.

## Corrections

- The overlay is now rendered within the `Pitch` section, so its percentage coordinates use the same origin as the goal and penalty-area markings.
- Crest centre Y: `(goalTop + goalHeight - adBoardHeight) / 2` = 15% of pitch height, matching Monday Cup's `HOME_LOGO_CENTER_Y`.
- Menu top Y: `goalTop + goalHeight` plus 20px = `calc(38% + 20px)` from the top of the pitch, matching Monday Cup's `HOME_MENU_TOP_OFFSET`.
- Existing Burnley crest asset, panel design, blue buttons and their click handlers are unchanged.

Files changed: `src/components/competition/CompetitionUI.jsx`, `src/components/match/FootballGame.jsx`, `src/components/match/FootballGameView.jsx`.

Verification: all 10 existing automated tests pass; all three modified JSX files parse without errors using the TypeScript JSX parser. A live browser build was not completed in this environment because the required project dependencies could not be installed.

Use the **update-only** ZIP on the project that already has the working Burnley fonts; the full-source ZIP does not add any separately supplied font binaries.
