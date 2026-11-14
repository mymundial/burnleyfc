# Burnley modal and meter border pass

- Restored a slim 1.5px light cyan outline to the power and accuracy meters, matching the Tap For Power button's border treatment, without a thick claret or purple frame.
- Merged the full-time score details into the existing larger claret modal panel: CHAMPIONSHIP, clubs, score and TURF MOOR. Removed the old EFL TROPHY label and the smaller green-blue, yellow-outlined score box.
- Removed the separate action-button backing panel; Replay controls retain their existing actions and use the same cyan gradient, claret text and outline as Tap For Power.
- Applied National 2 Compressed Bold Italic consistently to modal UI while leaving the live LED scoreboard and share-card scoreboard styling alone.
- Removed the yellow-tinted glow from the top-left of the modal.
- Disabled the obsolete pitch trophy badge behind the modal after full-time; match result handling is unchanged.

This is the complete project, with package.json at root. As in the prior ZIP, test font files are connected locally by the existing automatic font setup script when you run npm run dev and have the font archive in Downloads.
