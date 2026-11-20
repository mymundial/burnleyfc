import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const competition = readFileSync(new URL("../src/components/competition/CompetitionUI.jsx", import.meta.url), "utf8");
const match = readFileSync(new URL("../src/components/match/FootballGame.jsx", import.meta.url), "utf8");

test("registration, homepage ticker and terms return text match requested copy", () => {
  assert.match(competition, /BACK TO COMPETITION ENTRY<\/button>/);
  assert.match(match, /PLAY TO WIN A BURNLEY FC E-GIFT CARD!/);
  assert.match(competition, /maxLength=\{12\}/);
  assert.match(competition, /\.slice\(0, 12\)/);
});

test("leaderboard X goes home and footer contains only a full-width replay button", () => {
  const leaderboard = competition.split("export function CompetitionLeaderboardModal")[1];
  assert.ok(leaderboard, "leaderboard component exists");
  assert.match(leaderboard, /<ModalHeader title="LEADERBOARD" onClose=\{onHome\}/);
  assert.match(leaderboard, /<button type="button" onClick=\{onReplay\} className=\{`\$\{BLUE_BUTTON\} mt-2`\}>REPLAY<\/button>/);
  assert.doesNotMatch(leaderboard, /onClick=\{onHome\}[^\n]*>HOME<\/button>/);
  assert.doesNotMatch(leaderboard, /grid-cols-2/);
  assert.doesNotMatch(leaderboard, /LIVE LEADERBOARD UNAVAILABLE/);
  assert.match(leaderboard, /RETRY SUBMISSION/);
});
