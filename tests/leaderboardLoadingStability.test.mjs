import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/competition/CompetitionUI.jsx", import.meta.url), "utf8");
const modal = source.split("export function CompetitionLeaderboardModal")[1];

test("leaderboard keeps MY RANKING and all five TOP 5 rows mounted while data arrives", () => {
  assert.match(modal, /className="max-h-\[calc\(100dvh-198px\)\] space-y-2 overflow-y-auto pb-0"/);
  assert.match(modal, /<LeaderboardSection title="MY RANKING">/);
  assert.match(modal, /<LeaderboardRow row=\{ownRow\} isUser \/>/);
  assert.match(modal, /<LeaderboardSection title="TOP 5">/);
  assert.match(modal, /topRows\.map\(\(row\) => <LeaderboardRow/);
});

test("leaderboard shows no unsolicited score-submission text or temporary blank overlay", () => {
  assert.doesNotMatch(modal, /SUBMITTING YOUR SCORE/i);
  assert.doesNotMatch(modal, /submitting \? "invisible"/);
  assert.doesNotMatch(modal, /aria-hidden=\{submitting\}/);
  assert.match(modal, /SCORE NOT SUBMITTED/);
  assert.match(modal, />REPLAY<\/button>/);
});
