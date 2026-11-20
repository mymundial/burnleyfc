import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const assets = readFileSync(resolve(root, 'src/data/assets.js'), 'utf8');

test('home HTML preloads exactly the match ball image used by the game', () => {
  const path = '/assets/game/efl-ball.png';
  assert.match(assets, /ball: "\/assets\/game\/efl-ball\.png"/);
  assert.match(html, /<link rel="preload" href="\/assets\/game\/efl-ball\.png" as="image"/);
  assert.equal((html.match(/<link rel="preload" href="\/assets\/game\/efl-ball\.png"/g) || []).length, 1);
  assert.ok(statSync(resolve(root, `public${path}`)).size > 0);
});
