// A* over a zone's walkability grid. 4-directional movement keeps paths
// readable on the iso grid and avoids corner-clipping through solid props.

// walkable: (x, y) => boolean. Returns array of {x, y} from start (exclusive)
// to goal (inclusive), or null if unreachable.
export function findPath(walkable, w, h, sx, sy, gx, gy) {
  if (sx === gx && sy === gy) return [];
  if (!inBounds(gx, gy, w, h) || !walkable(gx, gy)) return null;

  const key = (x, y) => y * w + x;
  const open = [{ x: sx, y: sy, f: 0 }];
  const gScore = new Map([[key(sx, sy), 0]]);
  const came = new Map();
  const closed = new Set();
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (open.length) {
    // Small maps (< ~500 tiles): a linear scan beats heap bookkeeping.
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur.x, cur.y);
    if (closed.has(ck)) continue;
    closed.add(ck);

    if (cur.x === gx && cur.y === gy) {
      const path = [];
      let k = ck;
      while (came.has(k)) {
        path.push({ x: k % w, y: Math.floor(k / w) });
        k = came.get(k);
      }
      return path.reverse();
    }

    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!inBounds(nx, ny, w, h) || !walkable(nx, ny)) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      const g = gScore.get(ck) + 1;
      if (g < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, g);
        came.set(nk, ck);
        open.push({ x: nx, y: ny, f: g + Math.abs(gx - nx) + Math.abs(gy - ny) });
      }
    }
  }
  return null;
}

// Nearest walkable tile adjacent to (tx, ty), preferring the one closest to (fx, fy).
export function adjacentTile(walkable, w, h, tx, ty, fx, fy) {
  let best = null, bestD = Infinity;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const x = tx + dx, y = ty + dy;
    if (!inBounds(x, y, w, h) || !walkable(x, y)) continue;
    const d = Math.abs(x - fx) + Math.abs(y - fy);
    if (d < bestD) { bestD = d; best = { x, y }; }
  }
  return best;
}

function inBounds(x, y, w, h) {
  return x >= 0 && y >= 0 && x < w && y < h;
}
