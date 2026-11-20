import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/competition/CompetitionUI.jsx', import.meta.url), 'utf8');
const row = source.split('function LeaderboardRow(')[1]?.split('\nexport function CompetitionLeaderboardModal')[0];
const modal = source.split('export function CompetitionLeaderboardModal')[1];

test('leaderboard uses a central 60% username column and 20% side columns, with no grid gaps', () => {
  assert.match(source, /const LB_GRID = "20% 60% 20%"/);
  assert.match(source, /function LeaderboardHeader\(\)\s*\{\s*return <div className="grid items-center gap-0/);
  assert.match(row, /className=\{`grid h-\[40px\] items-center gap-0/);
  assert.match(row, /style=\{\{ gridTemplateColumns: LB_GRID \}\}/);
});

test('MY RANKING and TOP 5 use gold, silver and bronze for positions 1-3 and cyan for user rank 4+', () => {
  assert.ok(row);
  assert.match(row, /const border = rank === 1 \? "border-\[#B98224\]/);
  assert.match(row, /rank === 2 \? "border-\[#C8C8C8\]/);
  assert.match(row, /rank === 3 \? "border-\[#CD7F32\]/);
  assert.match(row, /isUser \? "border-\[#8FD0F2\]/);
  assert.match(row, /const rankColor = rank === 1 \? "text-\[#D99A2B\]"/);
  assert.match(row, /rank === 2 \? "text-\[#C8C8C8\]"/);
  assert.match(row, /rank === 3 \? "text-\[#CD7F32\]"/);
  assert.match(row, /isUser \? "text-\[#8FD0F2\]"/);
  assert.match(modal, /<LeaderboardRow row=\{ownRow\} isUser \/>/);
  assert.match(modal, /isUser=\{Boolean\(row.isUser\)\}/);
});

test('all usernames are white, all scores yellow, and redundant best-score subtitle is removed', () => {
  assert.match(row, /truncate text-center \$\{LB_TEXT\} text-white/);
  assert.match(row, /tabular-nums \$\{LB_TEXT\} text-\[#F7D117\]/);
  assert.doesNotMatch(modal, /BEST SCORE\s*\//);
  assert.match(modal, /REPLAY<\/button>/);
});
