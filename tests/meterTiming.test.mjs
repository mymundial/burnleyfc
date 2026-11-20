import test from 'node:test';
import assert from 'node:assert/strict';
import { meterValueAtTime } from '../src/logic/meterTiming.js';

test('time-based sweeps reach centre and both endpoints at expected times', () => {
  const start = 5000;
  const sweep = 1300;
  for (const [offset,expected] of [[0,0],[325,50],[650,100],[975,50],[1300,0],[1625,50],[1950,100]]) {
    assert.ok(Math.abs(meterValueAtTime(start,start+offset,sweep)-expected)<1e-9);
  }
});

test('large frame skips have no effect on tap value', () => {
  const start = 200;
  const tap = start + 281.25;
  const measured = meterValueAtTime(start,tap,1125);
  assert.equal(measured,50);
  assert.equal(meterValueAtTime(start,tap,1125),measured);
  assert.equal(meterValueAtTime(start,start+1125*4+281.25,1125),measured);
});

test('invalid timestamps are safe', () => {
  assert.equal(meterValueAtTime(null,100,500),0);
  assert.equal(meterValueAtTime(0,300,0),0);
  assert.equal(meterValueAtTime(500,400,1000),0);
});
