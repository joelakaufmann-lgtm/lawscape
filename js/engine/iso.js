// Isometric projection math. 2:1 diamond tiles, 64x32 px.
export const TILE_W = 64;
export const TILE_H = 32;
const HW = TILE_W / 2, HH = TILE_H / 2;

// Grid coords (can be fractional for smooth movement) -> screen coords of the
// tile's diamond center, before camera translation.
export function gridToScreen(gx, gy) {
  return { x: (gx - gy) * HW, y: (gx + gy) * HH };
}

// Inverse: screen point (already camera-adjusted) -> fractional grid coords.
export function screenToGrid(sx, sy) {
  return { gx: (sx / HW + sy / HH) / 2, gy: (sy / HH - sx / HW) / 2 };
}

// Painter's-algorithm sort key: things further "down-screen" draw later.
export function depthOf(gx, gy) {
  return gx + gy;
}

// Trace the diamond outline of the tile whose center is at (cx, cy).
export function diamondPath(ctx, cx, cy, w = TILE_W, h = TILE_H) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy);
  ctx.lineTo(cx, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy);
  ctx.closePath();
}
