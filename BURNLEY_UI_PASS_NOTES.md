# Burnley UI polish pass

Starting point: `efltrophy-main-burnley-brand-pass.zip`.

## Implemented (code only)

- Match header now reads **BURNLEY FC** with no left/right logos; existing dark grey background retained.
- Scoreboard pill shows **CHAMPIONSHIP**; underlying match-stage/gameplay logic left unchanged.
- Scoreboard club crests increased from 20px to 30px.
- Burnley primary brand claret uses exact sampled flat fill of supplied crest: `#5F0041` (formerly `#320524`). The cyan remains `#7EC6F1`.
- Direction and confirmation buttons now have prominent white outlines, claret default fills and cyan selected/confirm fills.
- Shot power and accuracy meters now use dark-grey containers, claret ideal zones, white fixed centre lines and cyan moving markers.
- In-goal aim target changed from yellow to cyan.
- A shadow gradient inside the game pitch now fades the first 56px of the crowd beneath the commentary strip, reducing its hard cutoff.
- The ball's coloured circular container/border was removed, and a soft ground shadow is shown while the ball is resting.
- The existing goalkeeper glove icon remains but its coloured circular badge/border has been removed. A true goalkeeper sprite set and replacement goal artwork are **not** included; they require new assets.

## Preserved

- Existing grass and crowd artwork, goal/marking geometry, goal-line position and ball resting/flight coordinates.
- Existing controls' sizes and positions; shot power, accuracy, saves, scoring and animations.
- Current scoreboard LED styling and penalty marker rules.
- Existing Vertu adverts, logos, outward claret gradient and Blackburn commentary colours.

## Validation

- Code/file consistency assertions and basic JS syntax checks completed.
- Full Vite build/browser verification **not completed** because npm dependencies are not available in this execution environment and network resolution failed.
