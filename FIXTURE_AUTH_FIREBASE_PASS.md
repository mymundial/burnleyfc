# Burnley Matchday — fixture registration and Firebase pass

## What changed

- Separate Firebase + Vercel projects per fixture, and server-scoped fixture IDs in entry tokens and local storage.
- Email-first registration validation. Duplicate email offers recovery; a duplicate username with new email is rejected.
- Existing sessions are validated against Firestore *before* CONTINUE starts a competition game.
- Email-link account recovery with the Firebase Authentication REST API. An original player can choose a new username **after verifying the same email**. If a requested username is taken, the player receives a short-lived verified recovery ticket to choose another without a second email.
- One score record per player plus `matchesCompleted`, and atomic per-match idempotency records + two automatically created overall counters.
- Fixture-specific, server-enforced opening and closing timestamps.
- Practice-mode gameplay and scoreboards are unchanged. Original matchday points and tie-break rules remain intact.

## Setup — TEST (burnley-competition)

1. Keep the default Firestore database in **Production mode** and deny client writes with Firestore rules. Only the Vercel backend service account writes documents.
2. In Firebase **Authentication → Sign-in method**, enable **Email/Password** and **Email link (passwordless sign-in)**. Add the exact deployed Vercel hostname under **Authentication → Settings → Authorized domains**.
3. From **Project settings → General**, copy the public **Web API key** to `FIREBASE_WEB_API_KEY` on Vercel. This is **not** the service-account private key.
4. In Vercel **Settings → Environment Variables**, set all variables from `.env.example`: existing service-account variables, `COMPETITION_TOKEN_SECRET`, unique `COMPETITION_FIXTURE_ID`, `COMPETITION_START_AT`, `COMPETITION_END_AT`, `FIREBASE_WEB_API_KEY`, `COMPETITION_PUBLIC_URL`.
5. Redeploy. For a test competition window, set start before now and end after now, with explicit UTC offsets. Use the production schedule for the actual match. Do not use a test window on the public prize deployment.
6. Do NOT manually create Firestore collections. The backend creates them with the first registration or score submission. A registered player does not count as a unique competitor until their first completed competition game.

Collections automatically created in the corresponding Firebase project:

- `burnleyMatchdayParticipants`: one record per normalised email (HMAC-derived document ID); username, email, matchesCompleted, bestScore, registration date and consent metadata.
- `burnleyMatchdayUsernames`: unique handles, atomically created/renamed.
- `burnleyMatchdaySubmissions`: one idempotency record per completed match (no shot history retained).
- `burnleyMatchdayStatistics/overall`: totalMatchesCompleted and totalUniquePlayers.
- `burnleyMatchdayRequestLimits` and `burnleyMatchdayRecoveryLimits`: server-side abuse throttling.

Only scores received within the server-defined window count. A result still in progress at close is rejected. The leaderboard remains readable after close. Each match's score contributes to match totals, but only a *strictly higher* score replaces a personal best.

## Recovery link behaviour

When a player enters an already registered email, the modal offers SEND SIGN-IN LINK. The Firebase provider sends an email link. Clicking it must reach the same deployed game with an `oobCode` and a `recoveryUsername` continue-URL parameter. The game asks the email again (works even on a different browser), verifies the single-use code through Firebase, and recovers the original player record. Do not put the email in a link URL. A different, available username overwrites the old one; scores remain intact.

**Verify the callback flow with a real test mailbox on the deployed Vercel URL before launching.** The actual Firebase email template and handler/link domain depend on your Authentication configuration; this could not be tested without your Firebase account and DNS.

## Limitations / pre-launch checks

- A client can still forge meter stop positions and submit a made-up score if they possess a valid entry token. Server recomputation alone is not an anti-cheat system. Add authoritative gameplay validation or anti-abuse controls before awarding prizes.
- The default competition session is a bearer token in local storage. Anyone with access to that token can use that participant's session; email recovery verifies ownership only when reconstructing a lost session.
- Firebase email-link delivery depends on its provider limits and configuration; it may require extra setup for the Firebase-hosted redirect/domain.
- The client and server need the match to be played online to save official results. Development mode may show an unrecorded visual preview.
- Fresh fixture projects each begin with empty player records; no carryover of registrations or best scores.
- The current game design still uses a local score calculation for display, but only the server-acknowledged result is official.
