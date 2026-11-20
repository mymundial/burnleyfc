import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/competition/CompetitionUI.jsx", import.meta.url), "utf8");
const modal = source.split("export function CompetitionLeaderboardModal")[1];

test("leaderboard keeps ranking panels mounted at the same size while submitting", () => {
  assert.match(modal, /const submitting = submitState === "submitting"/);
  assert.match(modal, /className=\{`space-y-2 \$\{submitting \? "invisible" : ""\}`\} aria-hidden=\{submitting\}/);
  assert.match(modal, /<LeaderboardSection title="MY RANKING">/);
  assert.match(modal, /<LeaderboardSection title="TOP 5">/);
  assert.match(modal, /topRows\.map\(\(row\) => <LeaderboardRow/);
});

test("submitting indicator overlays the reserved content instead of changing modal height", () => {
  assert.match(modal, /className="relative max-h-\[calc\(100dvh-198px\)\] overflow-y-auto pb-0"/);
  assert.match(modal, /\{submitting && <div role="status" aria-live="polite" className="pointer-events-none absolute inset-0/);
  assert.doesNotMatch(modal, /submitState === "submitting" && <p/);
  assert.match(modal, /SCORE NOT SUBMITTED/);
  assert.match(modal, />REPLAY<\/button>/);
});
