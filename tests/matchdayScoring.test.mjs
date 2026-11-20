import test from 'node:test';
import assert from 'node:assert/strict';
import { precisionPoints, scoreMatchdayAttempts, compareMatchdayScores } from '../src/logic/matchdayScoring.js';

const shot = (powerValue, accuracyValue, goal = false) => ({powerValue, accuracyValue, goal});

test('zero to fifty to zero triangle, integer display precision', () => {
  for (const [meter,expected] of [[0,0],[25,25],[49,49],[50,50],[51,49],[75,25],[100,0]]) {
    assert.equal(precisionPoints(meter),expected);
  }
  assert.equal(precisionPoints(null),0);
  assert.equal(precisionPoints(undefined),0);
  assert.equal(precisionPoints('invalid'),0);
  assert.equal(precisionPoints(49.7),50);
});

test('five perfect regulation shots = 500, no bonus for goals', () => {
  const five = Array.from({length:5},()=>shot(50,50,true));
  const score = scoreMatchdayAttempts({user:five,opponent:five});
  assert.equal(score.points,500);
  assert.equal(score.powerTotal,250);
  assert.equal(score.accuracyTotal,250);
  assert.equal(score.goalsScored,5);
  assert.equal(score.perfectHits,10);
  assert.equal(score.shotsScored,5);
  const missed = scoreMatchdayAttempts({user:five.map(s=>({...s,goal:false}))});
  assert.equal(missed.points,500);
});

test('sudden death and goals conceded do not affect score or tie breaks', () => {
  const base = Array.from({length:5},()=>shot(48,49,true));
  const regular = scoreMatchdayAttempts({user:base,opponent:[]});
  const extra = scoreMatchdayAttempts({user:[...base,shot(50,50,true),shot(50,50,true)],opponent:Array.from({length:7},()=>shot(50,50,true))});
  assert.deepEqual(extra,regular);
  assert.equal(regular.points,485);
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
  assert.equal(scoreMatchdayAttempts({user:[shot(50,undefined)]}).points,50);
});
