BURNLEY FC GAME — COMPLETE PROJECT (SOURCE + ASSETS)

This ZIP contains the COMPLETE npm/Vite game project, not a patch.
The package.json file is at the root of this ZIP.

RUN THE GAME ON MAC
1. Extract the ZIP to its own folder.
2. Open Terminal in the extracted folder (the folder containing package.json).
3. Run:
   npm install
   npm run dev
4. Open the localhost URL shown in Terminal.

INSTALL YOUR OWN FONTS FOR THE CORRECT APPEARANCE (RECOMMENDED)
The original fonts and the personal-use National 2 demo font files are not
redistributed in this ZIP. The game runs without them using fallback fonts,
but to see the original dot-matrix scoreboard and National 2 typography:

  sh setup-local-fonts.sh ~/Downloads/efltrophy-main-burnley-buttons-meters-pass.zip ~/Downloads/national-2-compressed-font-family-1794652907-0.zip

Do that inside the extracted game folder. The script reads those two ZIPs
on YOUR Mac, installs only the needed font files locally, and does not
upload or share them. Run it before starting the Vite server, or refresh
once copied.

If your ZIPs have different names or are stored elsewhere, provide their
full paths as arguments to setup-local-fonts.sh.

Check font licensing before publishing/deploying. The National 2 files
are marked personal-use test fonts. This archive does not include them.

This build contains the Burnley UI and gradient pass including the
new wordmark, retained CSS pitch markings/grass, crowd art, scoreboard
changes, end-match modal, 3D meters and goalkeeper badge reinstatement.
