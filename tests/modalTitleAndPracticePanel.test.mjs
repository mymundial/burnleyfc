import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const competition = readFileSync(new URL('../src/components/competition/CompetitionUI.jsx', import.meta.url), 'utf8');
const matchModal = readFileSync(new URL('../src/components/match/EndMatchModal.jsx', import.meta.url), 'utf8');
const practice = matchModal.split('if (isPractice && twoPlayerMode) {')[1]?.split('\n  return (\n    <div className="burnley-end-modal')[0];

const titleClass = 'text-[clamp(21px,6.3vw,28px)]';
const innerPanelClass = 'rounded-[1.35rem] border border-[#F5F1E8]/14 bg-[#21091B]/30 p-2.5';

test('competition, leaderboard and terms use the same larger modal title style as practice', () => {
  assert.match(competition, /<ModalHeader title="ENTER COMPETITION"/);
  assert.match(competition, /<ModalHeader title="LEADERBOARD"/);
  assert.match(competition, /<ModalHeader title="TERMS AND CONDITIONS"/);
  assert.doesNotMatch(competition, /title="TERMS & CONDITIONS"/);
  const competitionTitle = competition.match(/function ModalHeader\([^)]*\)\s*\{[\s\S]*?<\/div>;/)?.[0];
  assert.ok(competitionTitle, 'shared competition modal header exists');
  assert.ok(competitionTitle.includes(titleClass));
  assert.ok(practice?.includes(titleClass));
  assert.match(practice, /<h2[^>]*>PRACTICE<\/h2>/);
});

test('practice result uses exactly the existing leaderboard inner-panel colours, corners and border', () => {
  assert.ok(practice?.includes(innerPanelClass), 'practice has a styled result panel');
  assert.ok(competition.includes(innerPanelClass), 'panel matches existing inner box component');
  assert.match(practice, /\{result\.homeGoals\}-\{result\.awayGoals\}/);
  assert.match(practice, /Replay practice shootout/);
  assert.match(practice, /Close practice and return home/);
  assert.doesNotMatch(practice, /scoreMatchdayAttempts|matchdayScore|>HOME<|ENTER COMPETITION/);
});
