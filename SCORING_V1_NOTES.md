# Burnley FC — Matchday scoring V1

This pass changes only meter timing and competition scoring, plus one compact score readout on the existing end-match modal.

- Five Burnley regulation penalties count (five × 200 maximum = 1,000).
- Each stopped power or accuracy meter uses half-step scoring precision: 100 - 2 × abs(round(position × 2) / 2 - 50); endpoints 0, centre 100. This permits odd integer points (49.5 = 99). The original whole-number meter values continue to control shot outcomes.
- Goals scored, goals conceded and match outcome have **no effect on points**.
- Sudden-death shots do **not** add points.
- Tie-break order: regulation goals scored, accuracy subtotal, then perfect centre hits.
- The score is reconstructed from the recorded five attempts; a `matchdayScore` object is available on the completed result and active snapshots.
- Power and accuracy sweeps now use the elapsed time since start instead of accumulating animation-frame deltas; tap values are measured at the time of the event rather than the last frame.
- The end-match modal displays the final numeric challenge score in a small dark/amber LED capsule.

To run the automated tests: `npm test`. No account registration, online leaderboard, database writes or score anti-tamper verification were added in this pass. The game still needs server-side verification before using these scores for real-world prizes.

Existing user-supplied font binary files are not repackaged in this archive; this source keeps its existing `public/fonts/` references. Apply the update-only ZIP over your working game folder if you want to retain your installed font assets.
