import test from 'node:test';
import assert from 'node:assert/strict';
import { precisionPoints, scoringMeterStop, scoreMatchdayAttempts, compareMatchdayScores } from '../src/logic/matchdayScoring.js';
import { meterValueAtTime } from '../src/logic/meterTiming.js';
import { readFileSync } from 'node:fs';

const shot = (powerValue, accuracyValue, goal = false) => ({powerValue, accuracyValue, goal});

test('zero to fifty to zero triangle, half-step scoring precision', () => {
  for (const [meter,expected] of [[0,0],[0.5,1],[25,50],[49,98],[49.5,99],[50,100],[50.5,99],[51,98],[75,50],[99.5,1],[100,0]]) {
    assert.equal(precisionPoints(meter),expected);
  }
  assert.equal(precisionPoints(null),0);
  assert.equal(precisionPoints(undefined),0);
  assert.equal(precisionPoints('invalid'),0);
  assert.equal(precisionPoints(49.7),99);
  assert.equal(scoringMeterStop(49.7),49.5);
  assert.equal(scoringMeterStop(49.8),50);
  assert.deepEqual(new Set(Array.from({ length: 201 }, (_, i) => precisionPoints(i / 2))).size, 101);
});

test('five perfect regulation shots = 1000, no bonus for goals', () => {
  const five = Array.from({length:5},()=>shot(50,50,true));
  const score = scoreMatchdayAttempts({user:five,opponent:five});
  assert.equal(score.points,1000);
  assert.equal(score.powerTotal,500);
  assert.equal(score.accuracyTotal,500);
  assert.equal(score.goalsScored,5);
  assert.equal(score.perfectHits,10);
  assert.equal(score.shotsScored,5);
  const missed = scoreMatchdayAttempts({user:five.map(s=>({...s,goal:false}))});
  assert.equal(missed.points,1000);
});

test('sudden death and goals conceded do not affect score or tie breaks', () => {
  const base = Array.from({length:5},()=>shot(48,49,true));
  const regular = scoreMatchdayAttempts({user:base,opponent:[]});
  const extra = scoreMatchdayAttempts({user:[...base,shot(50,50,true),shot(50,50,true)],opponent:Array.from({length:7},()=>shot(50,50,true))});
  assert.deepEqual(extra,regular);
  assert.equal(regular.points,970);
});

test('goals, accuracy then perfect hits resolve tied totals', () => {
  const a = {points:480,goalsScored:4,accuracyTotal:242,perfectHits:2};
  const b = {points:480,goalsScored:3,accuracyTotal:250,perfectHits:5};
  assert.ok(compareMatchdayScores(a,b)<0);
  assert.ok(compareMatchdayScores({...a,goalsScored:3},b)>0);
  assert.equal(compareMatchdayScores(a,{...a}),0);
});

test('zero attempts, incomplete attempts, and extreme values', () => {
  assert.equal(scoreMatchdayAttempts({}).points,0);
  assert.equal(scoreMatchdayAttempts({user:[shot(0,100)]}).points,0);
  assert.equal(scoreMatchdayAttempts({user:[shot(50,undefined)]}).points,100);
});

test('odd points survive a five-penalty total and only first five penalties count', () => {
  const five = [shot(49.5, 50, true), ...Array.from({length:4}, () => shot(50,50,true))];
  const result = scoreMatchdayAttempts({ user:[...five,shot(50,50,true)] });
  assert.equal(result.points, 999);
  assert.equal(result.powerTotal, 499);
  assert.equal(result.accuracyTotal, 500);
  assert.equal(result.shotsScored, 5);
  assert.equal(result.shots[0].power, 99);
});

test('tap-time sweep precision can award 99 while shot outcomes keep integer meter rules', () => {
  const raw = meterValueAtTime(1000, 1321.75, 1300);
  assert.equal(raw, 49.5);
  assert.equal(Math.round(raw), 50);
  assert.equal(scoringMeterStop(raw), 49.5);
  assert.equal(precisionPoints(scoringMeterStop(raw)), 99);
});

test('competition taps retain half-step scoring values without changing shot outcome precision', () => {
  const source = readFileSync(new URL('../src/components/match/FootballGame.jsx', import.meta.url), 'utf8');
  assert.match(source, /const finalPower = displayedMeterValue\(rawPower\)/);
  assert.match(source, /lockedPowerScoringRef\.current = competitionMode \? scoringMeterStop\(rawPower\) : null/);
  assert.match(source, /const finalAccuracy = displayedMeterValue\(rawAccuracy\)/);
  assert.match(source, /const scoredAccuracy = competitionMode \? scoringMeterStop\(rawAccuracy\) : null/);
  assert.match(source, /powerValue: scoredPower/);
  assert.match(source, /accuracyValue: scoredAccuracy/);
});
