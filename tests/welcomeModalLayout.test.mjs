import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const ui = source("../src/components/competition/CompetitionUI.jsx");
const app = source("../src/App.jsx");
const match = source("../src/components/match/MatchScreen.jsx");
const game = source("../src/components/match/FootballGame.jsx");
const welcome = ui.split("export function CompetitionWelcomeBackModal")[1].split("export function CompetitionRegistrationModal")[0];
const registration = ui.split("  return <ModalFrame label=\"Competition registration\"")[1].split("const LB_GRID")[0];
const home = ui.split("export function CompetitionHomeOverlay")[1].split("function FormInput")[0];

test("welcome back fits its contents while registration retains its original base height", () => {
  assert.match(ui, /function ModalFrame\(\{ children, label, expanded = false, entrySized = false \}\)/);
  assert.match(ui, /max-w-\[408px\]/);
  assert.match(ui, /minHeight: "calc\(260px \+ clamp\(48px, 5\.6dvh, 62px\)\)"/);
  assert.match(welcome, /<ModalFrame label="Welcome back to the competition">/);
  assert.doesNotMatch(welcome, /entrySized|flex-1|min-h-0/);
  assert.match(welcome, /<div className="flex flex-col gap-2">/);
  assert.match(registration, / entrySized>/);
});

test("welcome username panel has greeting, NOT YOU appears below CONTINUE", () => {
  const panelStart = welcome.indexOf("${INNER}");
  const panelEnd = welcome.indexOf("</div>", panelStart);
  const greeting = welcome.indexOf("READY FOR ANOTHER GO?");
  const username = welcome.indexOf("{username}");
  const continueButton = welcome.indexOf("onClick={onContinue}");
  const switchButton = welcome.indexOf(">NOT YOU?</button>");
  assert.ok(panelStart !== -1 && panelEnd !== -1);
  assert.ok(panelStart < greeting && greeting < username && username < panelEnd);
  assert.ok(panelEnd < continueButton && continueButton < switchButton);
  assert.match(welcome, /\$\{INNER\} flex flex-col items-center justify-center gap-2 p-4/);
  assert.match(welcome, /home-copy-bold text-center text-\[17px\] uppercase leading-tight text-\[#F5F1E8\]\/60">READY FOR ANOTHER GO\?/);
  assert.match(welcome, /onClick=\{onContinue\}/);
  assert.match(welcome, /onClick=\{onSwitchPlayer\}/);
});

test("home panel buttons hide during both entry modals while badge stays visible", () => {
  assert.match(app, /homeMenuVisible=\{!registrationOpen && !welcomeOpen && !recoveryLink && !availability\}/);
  assert.match(match, /homeMenuVisible=\{homeMenuVisible\}/);
  assert.match(game, /showButtons=\{homeMenuVisible\}/);
  assert.match(home, /showButtons = true/);
  const logoIndex = home.indexOf("<img src={BURNLEY_CREST}");
  const menuIndex = home.indexOf("{showButtons && <div");
  assert.ok(logoIndex >= 0 && menuIndex > logoIndex, "logo stays visible while only menu/buttons toggle");
  assert.match(app, /onClose=\{\(\) => setRegistrationOpen\(false\)\}/);
  assert.match(app, /onClose=\{\(\) => setWelcomeOpen\(false\)\}/);
  assert.match(app, /const goHome = \(\) => resetMatch\("home"\)/);
});
