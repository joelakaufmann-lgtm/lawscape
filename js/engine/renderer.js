// World renderer: ground diamonds, back walls, then a single depth-sorted
// pass of props + actors (painter's algorithm). Also owns the camera.

import { TILE_W, TILE_H, gridToScreen, screenToGrid, diamondPath } from './iso.js';
import { PAL, shade } from './palette.js';
import { PROPS, shadow } from '../world/props.js';

const TILE_COLORS = {
  '.': PAL.grass,
  ',': PAL.grassDark,
  '#': PAL.stone,
  'm': PAL.marble,
  'M': PAL.marbleDark,
  'w': PAL.wood,
  'r': PAL.burgundy,
  'g': '#5e7a68',
};

const WALL_COLORS = {
  wood: '#7a6248',
  marble: PAL.marbleDark,
  green: PAL.archiveGreen,
  burgundy: '#5d3540',
  navy: PAL.navy,
};

export class WorldRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cam = { x: 0, y: 0 };
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.dpr = dpr;
  }

  // Mouse (CSS px) -> fractional grid coords, using the current camera.
  screenToWorld(mx, my) {
    return screenToGrid(mx - this.cam.x, my - this.cam.y);
  }

  render(zone, player, npcs, hover, t) {
    const { ctx } = this;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = zone.outdoor ? '#2a3441' : '#17141c';
    ctx.fillRect(0, 0, w, h);

    // camera follows the player, offset a bit upward so UI has room
    const pp = gridToScreen(player.x, player.y);
    this.cam.x = w / 2 - pp.x;
    this.cam.y = h / 2 - pp.y + 40;
    ctx.translate(this.cam.x, this.cam.y);

    // ---- ground ----
    for (let y = 0; y < zone.h; y++) {
      for (let x = 0; x < zone.w; x++) {
        const ch = zone.tile(x, y);
        if (ch === 'x') continue;
        const c = TILE_COLORS[ch] || PAL.stone;
        const s = gridToScreen(x, y);
        diamondPath(ctx, s.x, s.y);
        // tiny per-tile variation keeps large floors from looking flat
        ctx.fillStyle = shade(c, ((x * 31 + y * 17) % 5) * 0.008 - 0.016);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,20,30,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // ---- portal glow tiles ----
    for (const portal of zone.portals) {
      const s = gridToScreen(portal.x, portal.y);
      const pulse = 0.45 + Math.sin(t * 2.2) * 0.15;
      diamondPath(ctx, s.x, s.y);
      ctx.fillStyle = `rgba(217,182,86,${pulse})`;
      ctx.fill();
      ctx.strokeStyle = PAL.brass;
      ctx.lineWidth = 2;
      ctx.stroke();
      // floating chevron
      ctx.fillStyle = PAL.brassLight;
      const cy = s.y - 16 - Math.sin(t * 2.2) * 3;
      ctx.beginPath();
      ctx.moveTo(s.x - 6, cy);
      ctx.lineTo(s.x + 6, cy);
      ctx.lineTo(s.x, cy + 7);
      ctx.closePath();
      ctx.fill();
    }

    // ---- hover highlight (under the target) ----
    if (hover && hover.tiles) {
      ctx.strokeStyle = PAL.brassLight;
      ctx.lineWidth = 2.5;
      for (const tile of hover.tiles) {
        const s = gridToScreen(tile.x, tile.y);
        diamondPath(ctx, s.x, s.y);
        ctx.stroke();
      }
    }

    // ---- depth-sorted drawables ----
    const drawables = [];

    if (zone.walls) {
      const wallColor = WALL_COLORS[zone.walls] || PAL.stone;
      for (let x = 0; x < zone.w; x++) {
        drawables.push({ depth: x - 0.6, kind: 'wall', x, y: 0, color: wallColor });
      }
      for (let y = 1; y < zone.h; y++) {
        drawables.push({ depth: y - 0.6, kind: 'wall', x: 0, y, color: wallColor });
      }
    }

    for (const prop of zone.props) {
      if (prop.visible && !prop.visible()) continue;
      const def = PROPS[prop.type];
      if (!def) continue;
      drawables.push({
        depth: (prop.x + def.w - 1) + (prop.y + def.h - 1) - 0.1,
        kind: 'prop', prop, def,
      });
    }

    for (const npc of npcs) {
      if (npc.def.visible && !npc.def.visible()) continue;
      drawables.push({ depth: npc.actor.x + npc.actor.y, kind: 'npc', npc });
    }
    drawables.push({ depth: player.x + player.y, kind: 'player' });

    drawables.sort((a, b) => a.depth - b.depth);

    for (const d of drawables) {
      if (d.kind === 'wall') {
        this.drawWall(d, zone);
      } else if (d.kind === 'prop') {
        const s = gridToScreen(d.prop.x, d.prop.y);
        shadow(ctx, s.x, s.y, d.def.w, d.def.h);
        d.def.draw(ctx, s.x, s.y, d.prop, t);
      } else if (d.kind === 'npc') {
        const s = gridToScreen(d.npc.actor.x, d.npc.actor.y);
        d.npc.actor.draw(ctx, s.x, s.y, t, false);
        this.drawIndicator(d.npc.def, s, t);
      } else {
        const s = gridToScreen(player.x, player.y);
        player.draw(ctx, s.x, s.y, t, true);
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawWall(d, zone) {
    const { ctx } = this;
    const s = gridToScreen(d.x, d.y);
    const zc = 78;
    // reuse the box helper's geometry via a simple extrusion
    const half = TILE_W / 2, hh = TILE_H / 2;
    const N = { x: s.x, y: s.y - hh }, E = { x: s.x + half, y: s.y },
          S = { x: s.x, y: s.y + hh }, W = { x: s.x - half, y: s.y };
    ctx.fillStyle = shade(d.color, -0.08);
    ctx.beginPath();
    ctx.moveTo(W.x, W.y - zc); ctx.lineTo(S.x, S.y - zc);
    ctx.lineTo(S.x, S.y); ctx.lineTo(W.x, W.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(d.color, -0.2);
    ctx.beginPath();
    ctx.moveTo(S.x, S.y - zc); ctx.lineTo(E.x, E.y - zc);
    ctx.lineTo(E.x, E.y); ctx.lineTo(S.x, S.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(d.color, 0.05);
    ctx.beginPath();
    ctx.moveTo(N.x, N.y - zc); ctx.lineTo(E.x, E.y - zc);
    ctx.lineTo(S.x, S.y - zc); ctx.lineTo(W.x, W.y - zc);
    ctx.closePath(); ctx.fill();
    // wainscot stripe
    ctx.fillStyle = shade(d.color, -0.32);
    ctx.beginPath();
    ctx.moveTo(W.x, W.y - 18); ctx.lineTo(S.x, S.y - 18);
    ctx.lineTo(S.x, S.y - 14); ctx.lineTo(W.x, W.y - 14);
    ctx.closePath(); ctx.fill();
  }

  // Overhead icon: gold § = task giver, parchment dot = dialogue.
  drawIndicator(def, s, t) {
    const { ctx } = this;
    if (!def.icon) return;
    const y = s.y - 58 - Math.sin(t * 2.5) * 3;
    if (def.icon === 'task') {
      ctx.fillStyle = PAL.brass;
      ctx.beginPath(); ctx.arc(s.x, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PAL.parchment;
      ctx.font = 'bold 13px Georgia';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('§', s.x, y + 1);
    } else {
      ctx.fillStyle = PAL.parchment;
      ctx.beginPath(); ctx.arc(s.x, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.textBaseline = 'alphabetic';
  }
}
