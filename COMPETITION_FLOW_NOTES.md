> Update: The newer `REGISTRATION_TERMS_UPDATE.md` supersedes this pass’s marketing-checkbox descriptions; only a required T&Cs agreement is now collected.

# Burnley vs Preston — One-pass competition flow update

## Layout and flow

This pass uses the supplied `mondaycup-main.zip` as the code reference for the Monday Cup home, sign-up form and Weekly Challenge leaderboard. It does **not** replace the approved Burnley top bar, match scoreboard, game artwork, meters or penalty controls.

- Home: current Burnley top bar/scoreboard/pitch, floating Burnley crest above the goal, translucent claret panel, two existing-style blue buttons: `ENTER COMPETITION` / `PRACTICE MODE`. There are no button sublines.
- Registration: one modal, username (alphanumeric, max 10), email, optional marketing checkbox **unchecked** by default, `SUBMIT`. No password, tabs or account creation.
- Practice: current shootout, **existing full-time result modal**, and `REPLAY`, `HOME`, `ENTER COMPETITION` controls. No leaderboard submission.
- Competition: same shootout/1,000-point scoring engine, followed **directly by a leaderboard modal**. The result modal does not appear for competition matches.
- Leaderboard: `MY RANKING`, `TOP 5`; rank, username and best score only. `HOME` and `REPLAY` buttons. No share, change-team, result screen or extra team column.
- Competition replay: another official entry for the same registered email. **There is no one-attempt restriction.** The leaderboard uses each person's best score for this fixture. The server ranks ties by regulation goals, accuracy points, perfect hits, then earliest recorded best entry.

## Multi-user leaderboard backend: setup required before live use

`api/competition.js` is a Vercel serverless endpoint that uses Firestore's REST API with **server-only** service-account credentials. It does not reuse the Monday Cup Firebase project or its credentials. Create a Burnley Firestore database and set these five Vercel environment variables (see `.env.example`):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (full service account PEM, preserving newline escapes)
- `COMPETITION_TOKEN_SECRET` (32+ random characters)
- `COMPETITION_FIXTURE_ID` (change for the next fixture so leaderboards do not mix)

Deploy the project to Vercel. The `/api/competition` route registers players, stores participant email and opt-in privately, accepts completed scores, and returns public top-five usernames and personal rank. Firestore email/consent documents are **not** published in leaderboard responses.

The Vite development server does not emulate Vercel functions. In local `npm run dev`, an unavailable registration API permits **clearly labelled non-official visual preview**; it will not claim a leaderboard position. On a production deployment without a configured API, registration fails instead of misleading supporters into believing their entry was accepted.

## Important before offering a real prize

The current setup **is not yet tamper-proof**: the server recomputes score from submitted meter positions but cannot prove the positions were actually achieved on a real device, and username/email alone do not verify a person's identity or ownership of that address. These need a verification and anti-cheat plan before using scores to award prizes. Add competition terms, an accurate privacy notice, consent records, a prize close time and a mechanism for resolving disputed scores; have the club review marketing-consent wording and data retention. Firestore listing is intended for a first small-scale pilot, not an unbounded high-traffic competition.

No live Firestore credentials, project IDs, prize rules or email ownership verification were supplied, so **no live multi-user service was activated by this code pass**.

## Verification

- `npm test`: scoring/timing and mock-server leaderboard tests.
- All source `.js`/`.jsx` files checked with a JSX parser.
- Home, registration and leaderboard React components independently server-rendered without errors.
- `npm run build` could not complete in this environment: the supplied dependency set is missing Linux-native Rolldown/lightningcss bindings; restore dependencies on a standard development/CI installation and run the real build/phone-browser QA before deployment.

## Fonts

This complete source archive does not redistribute National 2 or IntoDotMatrix font binaries. Apply the smaller **update-only** archive on top of the user's previously working Burnley project to keep their existing working font assets and paths.
