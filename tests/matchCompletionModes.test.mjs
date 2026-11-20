import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decideMatchState } from "../src/logic/matchCompletion.js";

const fixture = { requiresWinner: true, allowDraw: false };
const shots = (n) => Array.from({ length: n }, (_, index) => ({ shotNumber: index + 1, goal: true }));
const attempts = (user, opponent) => ({ user: shots(user), opponent: shots(opponent) });

test("competition ends level after five penalties per side, without sudden death", () => {
  assert.deepEqual(
    decideMatchState({ attempts: attempts(5, 5), score: { user: 3, opponent: 3 }, fixture, suddenDeathEnabled: false }),
    { finished: true, draw: true, winnerSide: null },
  );
});

test("competition waits for both teams to take five penalties", () => {
  assert.deepEqual(
    decideMatchState({ attempts: attempts(5, 4), score: { user: 4, opponent: 2 }, fixture, suddenDeathEnabled: false }),
    { finished: false, draw: false, winnerSide: null },
  );
  assert.deepEqual(
    decideMatchState({ attempts: attempts(4, 4), score: { user: 4, opponent: 0 }, fixture, suddenDeathEnabled: false }),
    { finished: false, draw: false, winnerSide: null },
  );
});

test("competition ends after five when one team leads", () => {
  assert.deepEqual(
    decideMatchState({ attempts: attempts(5, 5), score: { user: 4, opponent: 3 }, fixture, suddenDeathEnabled: false }),
    { finished: true, draw: false, winnerSide: "user" },
  );
  assert.deepEqual(
    decideMatchState({ attempts: attempts(5, 5), score: { user: 1, opponent: 5 }, fixture, suddenDeathEnabled: false }),
    { finished: true, draw: false, winnerSide: "opponent" },
  );
});

test("practice keeps sudden death for tied knockouts", () => {
  assert.deepEqual(
    decideMatchState({ attempts: attempts(5, 5), score: { user: 3, opponent: 3 }, fixture, suddenDeathEnabled: true }),
    { finished: false, draw: false, winnerSide: null },
  );
  assert.deepEqual(
    decideMatchState({ attempts: attempts(6, 5), score: { user: 4, opponent: 3 }, fixture, suddenDeathEnabled: true }),
    { finished: false, draw: false, winnerSide: null },
  );
  assert.deepEqual(
    decideMatchState({ attempts: attempts(6, 6), score: { user: 4, opponent: 3 }, fixture, suddenDeathEnabled: true }),
    { finished: true, draw: false, winnerSide: "user" },
  );
  assert.deepEqual(
    decideMatchState({ attempts: attempts(6, 6), score: { user: 4, opponent: 4 }, fixture, suddenDeathEnabled: true }),
    { finished: false, draw: false, winnerSide: null },
  );
});

test("competition flag is wired through game UI and sudden-death marker control", () => {
  const screen = readFileSync(new URL("../src/components/match/MatchScreen.jsx", import.meta.url), "utf8");
  const game = readFileSync(new URL("../src/components/match/FootballGame.jsx", import.meta.url), "utf8");
  assert.match(screen, /suddenDeathEnabled=\{!competitionMode\}/);
  assert.match(game, /const afterRegulationTie =\s+suddenDeathEnabled &&/);
  assert.equal((game.match(/decideMatchState\(\{ attempts: nextAttempts, score: nextScore, fixture, suddenDeathEnabled \}\)/g) || []).length, 3);
});
