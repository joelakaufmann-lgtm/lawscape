import test from 'node:test';
import assert from 'node:assert/strict';

import { adjacentTile, findPath } from '../js/engine/pathfind.js';

test('findPath routes around blocked tiles', () => {
  const blocked = new Set(['1,0', '1,1']);
  const walkable = (x, y) => !blocked.has(`${x},${y}`);
  const path = findPath(walkable, 4, 4, 0, 0, 2, 0);

  assert.ok(path);
  assert.deepEqual(path.at(-1), { x: 2, y: 0 });
  assert.equal(path.some(({ x, y }) => blocked.has(`${x},${y}`)), false);
});

test('findPath reports unreachable destinations', () => {
  const walkable = (x, y) => x === 0 && y === 0;
  assert.equal(findPath(walkable, 3, 3, 0, 0, 2, 2), null);
});

test('adjacentTile chooses a reachable nearby interaction tile', () => {
  const walkable = (x, y) => x >= 0 && y >= 0 && x < 5 && y < 5 && !(x === 2 && y === 1);
  assert.deepEqual(adjacentTile(walkable, 5, 5, 2, 2, 2, 0), { x: 1, y: 1 });
});
