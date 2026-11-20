# Burnley FC Penalty Challenge — registration terms update

This is a targeted update on top of `burnley-preston-home-claret-gradient-full.zip`.

- Home-only commentary: `WIN A BURNLEY FC E-GIFT CARD!`
- The previous marketing checkbox has been replaced with one required `I AGREE TO THE TERMS AND CONDITIONS` checkbox. Only the `TERMS AND CONDITIONS` words are a blue, underlined button opening the terms view. Reading the terms does **not** check the box.
- Terms view is the **same claret modal** in a taller (up to 90% viewport height) version, containing a scrolling body for all 15 clauses. Header, crest and close control remain in place. A blue `BACK TO COMPETITION ENTRY` button returns to the form without changing acceptance; input values are retained. The X exits without registering.
- Terms include Sunday 6 December 2026, 10am–2pm GMT; free entry for UK residents aged 13+; unlimited competition attempts with best score counting; 1,000-point engine; ranking and tie-breakers; £20/£15/£10 E-Gift Cards (product 2500360), online redemption; 12-month card validity (proposed, pending Burnley approval); 14-day claim period; Burnley privacy notice hyperlink.
- Client submission requires explicit checking; the API also rejects registrations without `termsAccepted: true` and records an acceptance timestamp and draft terms version. Marketing consent is **no longer collected** in this workflow.
- The precise wording of the terms remains a **draft requiring Burnley FC approval** prior to live deployment. The proposed validity and online redemption arrangement, promoter/data-processing roles and privacy coverage also need approval.
- This does not introduce closing-time enforcement or identity/score tamper-proofing. Those are still necessary before using the game for a real prize award.
- No changes to the leaderboard, scoring, match visuals, or layout outside the registration/terms and home commentary.

## Verification

`node --test tests/*.test.mjs` and JSX syntax parsing with TypeScript were performed. Browser visual QA and a full Vite production build were not completed in this environment.

## Fonts

The full-source archive intentionally preserves the previous set of font paths without adding copyrighted binaries. Apply the update-only archive to the user's already-working project to retain local fonts.
