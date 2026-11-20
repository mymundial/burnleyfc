# Fonts — Burnley vs Preston prototype

The game uses **National 2 Compressed Bold Italic** (700) for match UI and commentary,
and **IntoDotMatrix** for the scoreboard. The fonts are referenced directly via
`@font-face` rules in `src/index.css`; there are no runtime font finders or
build-time installers.

Required files in `public/fonts/`:

- `national2/TestNational2Compressed-BoldItalic.otf` (required)
- `national2/TestNational2Compressed-BlackItalic.otf` (optional legacy weight)
- `national2/TestNational2Compressed-Regular.otf`
- `national2/TestNational2Compressed-RegularItalic.otf`
- `national2/TestNational2Compressed-Bold.otf`
- `intodotmatrix-webfont.woff2` (required)
- `intodotmatrix-webfont.woff` (fallback)
- `sumpfdeutschensportschriftsdin-regular-webfont.woff2` (fallback)
- `sumpfdeutschensportschriftsdin-bold-webfont.woff2` (fallback)
- `sumpfdeutschensportschriftsdin-light-webfont.woff2` (fallback)

These files must be present on the deployed server for correct rendering.
Font binary files are not included in this distribution.

There are no local computer paths or download-folder checks.

## Terms and Conditions typography (Denim WD)

Only the **scrollable Terms and Conditions** uses Denim WD. Its numbered
headings are Light (300), uppercase; its paragraph/list text is Regular (400).
The modal title and buttons still use National 2 Compressed Bold Italic.

Add **both** licensed font files to your existing working project:

- `public/fonts/denim/DenimWD-Light.otf`
- `public/fonts/denim/DenimWD-Regular.otf`

These are the exact paths referenced by `@font-face` in `src/index.css`.
Without them, T&C text falls back to an upright system sans-serif font.
The supplied Denim WD TRIAL fonts are **personal-use evaluation only**; they
are not included in the ZIPs and require an appropriate licence for public
deployment. For local evaluation you may rename copies of the two trial files
for those paths.

See `DENIM_TERMS_FONT_UPDATE.md` for sizes and spacing.
