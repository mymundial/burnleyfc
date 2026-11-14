#!/usr/bin/env node
// Locally install user-provided font files before running Vite.
// No font binaries are included in this project archive.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const downloads = path.join(os.homedir(), 'Downloads');
const fontDir = path.join(projectRoot, 'public', 'fonts');
const n2Dir = path.join(fontDir, 'national2');
fs.mkdirSync(n2Dir, { recursive: true });

function zipCandidates(explicit, regex) {
  const roots = [projectRoot, path.dirname(projectRoot), downloads];
  const found = [];
  if (explicit) found.push(path.resolve(explicit));
  for (const folder of roots) {
    if (!fs.existsSync(folder)) continue;
    for (const name of fs.readdirSync(folder)) {
      if (regex.test(name)) found.push(path.join(folder, name));
    }
  }
  return [...new Set(found)].filter(p => fs.existsSync(p) && fs.statSync(p).isFile());
}

function unzipEntry(zip, filename) {
  try {
    return execFileSync('unzip', ['-p', zip, filename], { maxBuffer: 1024 * 1024 * 2, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (err) { return null; }
}

function install(archive, sourceName, destination) {
  if (fs.existsSync(destination) && fs.statSync(destination).size > 0) return true;
  const bytes = unzipEntry(archive, sourceName);
  if (!bytes || !bytes.length) return false;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
  return true;
}

const n2Names = ['TestNational2Compressed-BlackItalic.otf', 'TestNational2Compressed-BoldItalic.otf'];
const n2Archives = zipCandidates(process.env.BURNLEY_FONT_ZIP, /^national-2-compressed-font-family.*\.zip$/i);
let n2Archive = null;
for (const zip of n2Archives) {
  if (n2Names.every(name => unzipEntry(zip, name)?.length)) { n2Archive = zip; break; }
}
let installedN2 = 0;
for (const name of n2Names) {
  const dest = path.join(n2Dir, name);
  if (n2Archive && install(n2Archive, name, dest) || fs.existsSync(dest) && fs.statSync(dest).size > 0) installedN2++;
}

const legacyNames = [
  'intodotmatrix-webfont.woff2', 'intodotmatrix-webfont.woff',
  'sumpfdeutschensportschriftsdin-bold-webfont.woff2',
  'sumpfdeutschensportschriftsdin-bold-webfont.woff',
  'sumpfdeutschensportschriftsdin-regular-webfont.woff2',
  'sumpfdeutschensportschriftsdin-regular-webfont.woff',
  'sumpfdeutschensportschriftsdin-light-webfont.woff2',
  'sumpfdeutschensportschriftsdin-light-webfont.woff',
];
const legacyArchives = zipCandidates(process.env.BURNLEY_BASE_GAME_ZIP, /^(efltrophy-main(?:-burnley-(?:buttons-meters-pass|ui-polish-pass|brand-pass))?|efltrophy-main-pitch-no-shading)\.zip$/i);
let originalArchive = null;
for (const zip of legacyArchives) {
  if (unzipEntry(zip, 'efltrophy-main/public/fonts/intodotmatrix-webfont.woff2')?.length) { originalArchive = zip; break; }
}
let installedLegacy = 0;
for (const name of legacyNames) {
  const dest = path.join(fontDir, name);
  if (originalArchive && install(originalArchive, `efltrophy-main/public/fonts/${name}`, dest) || fs.existsSync(dest) && fs.statSync(dest).size > 0) installedLegacy++;
}

if (installedN2 === 2) {
  console.log('✓ National 2 Compressed Black Italic + Bold Italic connected to game UI.');
} else {
  console.warn('⚠ National 2 Compressed not installed. Keep your supplied national-2-compressed-font-family-*.zip in Downloads and run npm run dev again.');
  console.warn('  Alternatively set BURNLEY_FONT_ZIP=/path/to/your/archive.zip.');
}
if (installedLegacy === legacyNames.length) {
  console.log('✓ Existing dot-matrix scoreboard fonts connected unchanged.');
} else {
  console.warn('⚠ Original scoreboard font archive not found; keep efltrophy-main-burnley-buttons-meters-pass.zip in Downloads to restore it.');
}
