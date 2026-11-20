# Burnley FC vs Preston North End — matchday penalty shootout

Full React/Vite source. Run `npm install` and `npm run dev`.

Fixture: **Burnley vs Preston North End**, at **Turf Moor**. Away penalties
are simulated. The approved styling, controls, pitch, match modal, scorer
and replay flow are retained from the supplied working project.

The game loads **National 2 Compressed** for commentary and the UI and
**IntoDotMatrix** for the scoreboard. Font loading is unchanged by this
cleanup. See `FONT_SETUP.md` for the expected filenames.

This cleanup intentionally leaves older compatibility identifiers in the
underlying generic match/share components where renaming them would risk
regressions. The previous tournament badge and old sponsor references were retired;
the ball filename (`efl-ball.png`) and Championship asset are unchanged.

## Firebase matchday implementation

See `FIXTURE_AUTH_FIREBASE_PASS.md` for fixture-specific Firebase/Vercel setup, email recovery, schedule and verification requirements. The API requires all relevant environment variables before official scores can be saved.
