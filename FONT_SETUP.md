# National 2 Compressed — connected automatically for local development

The game now loads **National 2 Compressed Black Italic (900)** and **Bold Italic (700)** from `public/fonts/national2/` when the locally supplied test font ZIP is available. The game's existing **IntoDotMatrix scoreboard** remains unchanged.

**No separate installation step is required.** The `npm run dev` and `npm run build` commands automatically run `scripts/prepare-fonts.cjs`, which searches Downloads and the project folder for `national-2-compressed-font-family-*.zip` and copies the two test styles into the correct local folder. The script also restores the existing dot-matrix/SportsDIN fonts from your earlier `efltrophy-main-burnley-buttons-meters-pass.zip` if present in Downloads.

### Start the game

1. Extract the complete game ZIP in Downloads.
2. Keep your supplied font archive in Downloads.
3. Run `npm install` and `npm run dev` inside the extracted game folder.

You'll see `National 2 Compressed ... connected` in Terminal when it is active. There is no extra font setup command.

You can point to another archive path through `BURNLEY_FONT_ZIP=/path/to/archive.zip` and optionally `BURNLEY_BASE_GAME_ZIP=/path/to/older_game.zip`.

Fonts are brought into **your own local copy** at launch. The distributable game ZIP does not contain the font binaries. Do not publish the test fonts without the appropriate licensing permissions.
