# Burnley — welcome-back and registration modal layout pass

This targeted pass uses `burnley-preston-welcome-back-registration-full.zip` as its baseline.

## Visual updates

- `ENTER COMPETITION` and `WELCOME BACK` now share the same width and baseline height (408px max width; an equal responsive base height based on the existing blue button height). The registration form remains unchanged in layout and validation.
- In WELCOME BACK, the caption `READY FOR ANOTHER GO?` sits above the remembered username, both centred inside the existing dark claret panel.
- `NOT YOU?` now appears directly beneath the cyan `CONTINUE` button, outside the inner panel.
- The underlying home screen's `ENTER COMPETITION` and `PRACTICE MODE` button panel is hidden while registration or welcome-back is open. The underlying Burnley badge remains. Closing either modal with X restores the buttons.

## Preserved

- Registration logic, remembered session logic, competition/practice gameplay, scoring, leaderboard and styling, typography and approved artwork.
- `CONTINUE` enters competition; `NOT YOU?` switches only the currently remembered device player and opens registration; X closes the active modal and returns to home.
- On small screens or if validation errors add lines, modals may grow to keep their content accessible.

## Checks

- 34 automated tests passed (`npm test`).
- All 53 JavaScript, JSX and MJS files parsed without syntax errors.
- No browser-rendered visual test was performed; the local environment does not include the project build dependencies.

## Fonts

No font binaries are added to the release. Apply the update-only ZIP over your project to retain your working fonts.
