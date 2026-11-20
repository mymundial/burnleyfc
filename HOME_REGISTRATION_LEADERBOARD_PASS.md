# Burnley home, competition registration and leaderboard — targeted update

Base: `burnley-preston-home-position-corrected-full.zip` (the latest supplied correction).
Reference: uploaded `mondaycup-main.zip`, specifically the team-selection badge shadow and Weekly Challenge podium borders.

## Home screen
- Home menu panel keeps the existing layout, claret colour and blue buttons; background opacity reduced from 85% to 24% and the 7px backdrop blur removed.
- Floating Burnley crest retains its exact centre: halfway between the bottom of the commentary bar (pitch top) and the top of the Vertu advertising board (30% down the pitch). Uses the Monday Cup selection badge shadow: `drop-shadow(0 10px 24px rgba(0,0,0,0.33))`.
- Home-only commentary: `PLAY TO WIN A CLUB SHOP VOUCHER!`. Normal football commentary resumes in both match modes.

## Registration modal
- Username and email placeholders in uppercase; both fields render typed content in uppercase. Username state is uppercase. Email remains case-insensitively canonicalised to lowercase when submitted to the API; its *visible presentation* is uppercase.
- Marketing checkbox and label centred as a group. Removed the word `OPTIONAL` from the label; consent remains optional and initially unchecked.
- No new fields, password or changes to registration submission logic.

## Competition leaderboard
- Header title is now `LEADERBOARD`.
- Top 5 always presents places #1–#5, with empty positions showing a dash for username and score and no fabricated results.
- Gold, silver and bronze outline/ring values taken directly from the Monday Cup Weekly Challenge component, including when the entrant is in the Top 3. Current player's row remains highlighted in `MY RANKING`.
- Username header and usernames are centred in their column.
- Removed `NO LIVE SCORES IN PREVIEW` and `PREVIEW ONLY · NOT ENTERED`. If the live leaderboard is actually unavailable, the UI explicitly says that the score was not submitted, rather than implying it counts towards a prize.
- HOME and REPLAY remain unchanged. Competition match still goes directly to this modal; practice retains the original result modal.

## Scope and verification
Changed: `src/components/competition/CompetitionUI.jsx`, `src/components/match/FootballGame.jsx`; added `src/logic/leaderboardDisplay.js` and three display tests.
Automated tests: 13 pass; 44 JS/JSX/MJS files parse successfully.
This environment cannot complete the Vite browser build from the supplied source because the required platform-native dependency is absent. The visual result should be checked in the running app.
Live score submissions still require the Firebase environment variables documented in `COMPETITION_FLOW_NOTES.md` and `.env.example`.
