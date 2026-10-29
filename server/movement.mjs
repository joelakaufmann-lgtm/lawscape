// Server-side walkability and path validation for the shared firm rooms.
//
// Mirrors `isWalkable` in js/main.js, except that props with a `visible`
// function are skipped: those are per-player upgrades (plants, a second
// paralegal desk) that other players may not have, so the shared floor
// treats them as walkable.

import { ZONES } from '../js/world/zones.js';
import { PROPS } from '../js/world/props.js';
import { LIMITS } from '../js/online/protocol.js';

// The client walks at PLAYER_BASE_SPEED (4 tiles/s); a bar drink halves it.
export const TILES_PER_SECOND = 4;

export function walkable(zoneId, x, y) {
  const zone = ZONES[zoneId];
  if (!zone || !Number.isInteger(x) || !Number.isInteger(y)) return false;
  if (x < 0 || y < 0 || x >= zone.w || y >= zone.h) return false;
  if (zone.tile(x, y) === 'x') return false;
  if (zone.walls && (x === 0 || y === 0)) return false;
  for (const prop of zone.props) {
    if (typeof prop.visible === 'function') continue;
    const def = PROPS[prop.type];
    if (!def || !def.solid) continue;
    if (x >= prop.x && x < prop.x + def.w && y >= prop.y && y < prop.y + def.h) return false;
  }
  return true;
}

const chebyshev = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));

// Where the player is right now, interpolated along the last accepted path at
// TILES_PER_SECOND since `pathAt`. `player.x/y` hold the destination tile;
// `pathFrom` is the tile the path started from.
export function expectedPosition(player, now) {
  const path = Array.isArray(player.path) ? player.path : [];
  if (!path.length) return { x: player.x, y: player.y };
  const elapsed = Math.max(0, (now - (player.pathAt ?? now)) / 1000);
  const index = Math.floor(elapsed * TILES_PER_SECOND);
  if (index >= path.length) return { x: player.x, y: player.y };
  if (index === 0) return { x: player.pathFrom?.[0] ?? player.x, y: player.pathFrom?.[1] ?? player.y };
  return { x: path[index - 1][0], y: path[index - 1][1] };
}

// Tiles the player may plausibly be standing on: the expected tile plus any
// earlier tile of the in-flight path (a slowed client lags the 4 t/s clock,
// and nobody is allowed to be ahead of it).
export function plausiblePositions(player, now) {
  const expected = expectedPosition(player, now);
  const path = Array.isArray(player.path) ? player.path : [];
  const tiles = [expected];
  if (!path.length) return tiles;
  if (player.pathFrom) tiles.push({ x: player.pathFrom[0], y: player.pathFrom[1] });
  for (const [x, y] of path) {
    tiles.push({ x, y });
    if (x === expected.x && y === expected.y) break;
  }
  return tiles;
}

// `expected` may be a single {x, y} or a list of plausible tiles.
export function validatePath(zoneId, expected, path) {
  if (!ZONES[zoneId]) return { ok: false, code: 'bad_zone' };
  if (!Array.isArray(path) || !path.length || path.length > LIMITS.pathSteps) return { ok: false, code: 'bad_move', detail: 'path length' };
  let prev = null;
  for (const step of path) {
    if (!Array.isArray(step) || step.length !== 2) return { ok: false, code: 'bad_move', detail: 'malformed step' };
    const [x, y] = step;
    if (!walkable(zoneId, x, y)) return { ok: false, code: 'bad_move', detail: `tile ${x},${y} is not walkable` };
    if (prev && Math.abs(prev[0] - x) + Math.abs(prev[1] - y) !== 1) return { ok: false, code: 'bad_move', detail: 'non-adjacent step' };
    prev = step;
  }
  const anchors = Array.isArray(expected) ? expected : [expected];
  const [fx, fy] = path[0];
  if (!anchors.some((tile) => chebyshev(tile.x, tile.y, fx, fy) <= 1)) {
    return { ok: false, code: 'bad_move', detail: 'path does not start near the player' };
  }
  return { ok: true };
}

export function near(a, b, tiles) {
  return chebyshev(a.x, a.y, b.x, b.y) <= tiles;
}
