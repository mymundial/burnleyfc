# Burnley FC — home border, registration submit position and terms copy

This pass is based on `burnley-preston-modal-titles-practice-result-full.zip`.

## Changes

1. All game-facing references to the document now read **TERMS AND CONDITIONS** rather than using an ampersand. This includes the modal title, clickable consent link, validation message and references within the published draft text. The competition rules themselves are unchanged.
2. The home-screen button panel uses the same **1.5px `#934D7B` claret border** as the unselected directional controls in the match. Its size, position, background gradient, opacity, blue buttons and crest are unchanged.
3. The registration modal keeps the username, email and terms checkbox within the rounded information panel. **SUBMIT** is now a sibling below that panel, but still inside the same registration `<form>`, preserving validation and submission behaviour. The blue button treatment is unchanged.

Leaderboard ranking, highlighting and server logic are **not modified**. Revisit player-highlight colours after live leaderboard setup.

## Verification

- 26 automated tests passed (`node --test tests/*.test.mjs`), including three new targeted tests.
- 50 JavaScript/JSX/MJS files passed TypeScript syntax parsing.
- Archive integrity and scope compared with the previous full-source ZIP.
- No live Vite/browser render has been completed in this environment.

## Fonts

The ZIPs do not include licensed National or Denim font binaries. Use the update-only ZIP over the existing working project to retain font assets.
