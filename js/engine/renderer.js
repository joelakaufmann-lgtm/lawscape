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
  'p': '#b3ada0',   // street pavement
  'a': '#454a52',   // street asphalt
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

  render(zone, player, npcs, hover, t, remotes = []) {
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

    // ---- distant skyline behind an outdoor zone ----
    if (zone.outdoor) this.drawSkyline(zone);

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
        this.drawFloorDetail(zone, ch, x, y, s, c);
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
    for (const remote of remotes) {
      drawables.push({ depth: remote.actor.x + remote.actor.y, kind: 'remote', remote });
    }
    drawables.push({ depth: player.x + player.y, kind: 'player' });

    drawables.sort((a, b) => a.depth - b.depth);

    for (const d of drawables) {
      if (d.kind === 'wall') {
        this.drawWall(d, zone);
      } else if (d.kind === 'prop') {
        const s = gridToScreen(d.prop.x, d.prop.y);
        if (!d.def.noShadow) shadow(ctx, s.x, s.y, d.def.w, d.def.h);
        d.def.draw(ctx, s.x, s.y, d.prop, t);
      } else if (d.kind === 'npc') {
        const s = gridToScreen(d.npc.actor.x, d.npc.actor.y);
        d.npc.actor.draw(ctx, s.x, s.y, t, false);
        this.drawIndicator(d.npc.def, s, t);
      } else if (d.kind === 'remote') {
        const s = gridToScreen(d.remote.actor.x, d.remote.actor.y);
        d.remote.actor.draw(ctx, s.x, s.y, t, false);
      } else {
        const s = gridToScreen(player.x, player.y);
        player.draw(ctx, s.x, s.y, t, true);
      }
    }

    // Name tags last, so another attorney's name is never hidden behind furniture.
    for (const remote of remotes) this.drawNameTag(remote, gridToScreen(remote.actor.x, remote.actor.y));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Parchment tag above another player's head: display name plus status line.
  drawNameTag(remote, s) {
    const { ctx } = this;
    const name = String(remote.name || 'Attorney');
    const label = String(remote.label || '');
    ctx.font = 'bold 11px Verdana, sans-serif';
    const nameWidth = ctx.measureText(name).width;
    ctx.font = '10px Verdana, sans-serif';
    const labelWidth = label ? ctx.measureText(label).width : 0;
    const width = Math.max(nameWidth, labelWidth) + 12;
    const height = label ? 30 : 18;
    const x = s.x - width / 2, y = s.y - 92 - height;
    ctx.fillStyle = 'rgba(243,233,210,0.92)';
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, width, height, 3); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PAL.ink;
    ctx.font = 'bold 11px Verdana, sans-serif';
    ctx.fillText(name, s.x, y + 13);
    if (label) {
      ctx.fillStyle = '#52635a';
      ctx.font = '10px Verdana, sans-serif';
      ctx.fillText(label, s.x, y + 25);
    }
    ctx.textAlign = 'start';
  }

  // A seeded row of dark towers along the back of the street so the empty
  // background reads as a city block rather than a void.
  drawSkyline(zone) {
    const { ctx } = this;
    for (let x = -4; x <= zone.w + 4; x++) {
      const seed = (x * 73 + 11) % 17;
      const s = gridToScreen(x, -1.5);
      const height = 90 + seed * 9, width = 26 + (seed % 4) * 6;
      ctx.fillStyle = seed % 3 === 0 ? '#1f2730' : '#232c36';
      ctx.fillRect(s.x - width / 2, s.y - height - 40, width, height);
      ctx.fillStyle = 'rgba(233,213,138,0.35)';
      for (let wy = 0; wy < height - 20; wy += 14) if ((seed + wy) % 5 !== 0) ctx.fillRect(s.x - width / 2 + 6, s.y - height - 32 + wy, 4, 5);
    }
  }

  // Surface detail in tile space: x runs along +u, y along +v, 32 units per tile.
  drawFloorDetail(zone, ch, x, y, s, base) {
    const { ctx } = this;
    ctx.save();
    ctx.transform(1, 0.5, -1, 0.5, s.x, s.y - TILE_H / 2);
    if (ch === 'p') {
      // Paving slabs with seams, and a kerb edge where the pavement meets the road.
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 15.5, 32, 0.8); ctx.fillRect(15.5, 0, 0.8, 32);
      if (y + 1 < zone.h && zone.tile(x, y + 1) === 'a') { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, 28, 32, 4); }
    } else if (ch === 'a') {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 3; i++) ctx.fillRect((x * 13 + y * 7 + i * 11) % 30, (x * 5 + i * 9) % 30, 1.5, 1.5);
      if (y > 0 && zone.tile(x, y - 1) === 'a' && (y + 1 >= zone.h || zone.tile(x, y + 1) !== 'a')) { ctx.fillStyle = '#d9c98a'; ctx.fillRect(6, 0, 14, 1.4); }
    } else if (ch === 'w') {
      // Four boards per tile, each with its own tone, seams and staggered end joints.
      for (let row = 0; row < 4; row++) {
        const n = (x * 7 + y * 13 + row * 5) % 7;
        ctx.fillStyle = shade(base, (n - 3) * 0.012);
        ctx.fillRect(0, row * 8, 32, 8);
        ctx.fillStyle = 'rgba(255,230,190,0.05)';
        ctx.fillRect(0, row * 8 + 2 + (n % 3), 32, 0.6);
        ctx.fillStyle = 'rgba(30,16,8,0.32)';
        ctx.fillRect(0, row * 8 + 7.4, 32, 0.6);
        const joint = ((x * 11 + y * 5 + row * 19) % 4) * 8 + 4;
        ctx.fillRect(joint, row * 8, 0.6, 8);
      }
    } else if (ch === 'r') {
      // Rug: pile texture, a border wherever the rug meets bare floor, and a medallion motif.
      const rug = (tx, ty) => tx >= 0 && ty >= 0 && tx < zone.w && ty < zone.h && zone.tile(tx, ty) === 'r';
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let i = 0; i < 32; i += 3) ctx.fillRect(0, i, 32, 0.5);
      const edges = { top: !rug(x, y - 1), bottom: !rug(x, y + 1), left: !rug(x - 1, y), right: !rug(x + 1, y) };
      const band = (bx, by, bw, bh, color) => { ctx.fillStyle = color; ctx.fillRect(bx, by, bw, bh); };
      const dark = shade(base, -0.16), gold = 'rgba(217,182,86,0.75)';
      if (edges.left) { band(0, 0, 5, 32, dark); band(5.5, 0, 1, 32, gold); }
      if (edges.right) { band(27, 0, 5, 32, dark); band(26, 0, 1, 32, gold); }
      if (edges.top) { band(0, 0, 32, 5, dark); band(edges.left ? 5.5 : 0, 5.5, 32 - (edges.left ? 5.5 : 0) - (edges.right ? 5.5 : 0), 1, gold); }
      if (edges.bottom) { band(0, 27, 32, 5, dark); band(edges.left ? 5.5 : 0, 25.5, 32 - (edges.left ? 5.5 : 0) - (edges.right ? 5.5 : 0), 1, gold); }
      ctx.fillStyle = shade(base, 0.07);
      ctx.beginPath(); ctx.moveTo(16, 10); ctx.lineTo(22, 16); ctx.lineTo(16, 22); ctx.lineTo(10, 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(217,182,86,0.35)';
      ctx.fillRect(15.3, 15.3, 1.4, 1.4);
    } else if (ch === 'm' || ch === 'M') {
      ctx.strokeStyle = 'rgba(120,110,95,0.18)';
      ctx.lineWidth = 0.5;
      if ((x * 3 + y * 7) % 4 === 0) {
        ctx.beginPath(); ctx.moveTo(2, 6 + (x % 3) * 6); ctx.bezierCurveTo(10, 2, 18, 22, 30, 14 + (y % 3) * 4); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.moveTo(0.5, 31.5); ctx.lineTo(0.5, 0.5); ctx.lineTo(31.5, 0.5); ctx.stroke();
    }
    ctx.restore();
    if (ch !== 'w' && ch !== 'r') {
      diamondPath(ctx, s.x, s.y);
      ctx.strokeStyle = 'rgba(20,20,30,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawWall(d, zone) {
    const { ctx } = this;
    const s = gridToScreen(d.x, d.y);
    const zc = 78;
    const half = TILE_W / 2, hh = TILE_H / 2;
    const N = { x: s.x, y: s.y - hh }, E = { x: s.x + half, y: s.y },
          S = { x: s.x, y: s.y + hh }, W = { x: s.x - half, y: s.y };
    const quad = (a, b, z0, z1, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y - z1); ctx.lineTo(b.x, b.y - z1);
      ctx.lineTo(b.x, b.y - z0); ctx.lineTo(a.x, a.y - z0);
      ctx.closePath(); ctx.fill();
    };
    const left = shade(d.color, -0.08), right = shade(d.color, -0.2);
    quad(W, S, 0, zc, left);
    quad(S, E, 0, zc, right);
    ctx.fillStyle = shade(d.color, 0.05);
    ctx.beginPath();
    ctx.moveTo(N.x, N.y - zc); ctx.lineTo(E.x, E.y - zc);
    ctx.lineTo(S.x, S.y - zc); ctx.lineTo(W.x, W.y - zc);
    ctx.closePath(); ctx.fill();

    // Millwork on the face that looks into the room: baseboard, wainscot
    // panels, chair rail and crown molding.
    const faces = [];
    if (d.y === 0) faces.push([W, S, d.color, -0.08]);
    if (d.x === 0 && d.y > 0) faces.push([S, E, d.color, -0.2]);
    if (d.x === 0 && d.y === zone.h - 1) faces.push([W, S, d.color, -0.08]);
    for (const [a, b, color, tone] of faces) {
      const t = (amt) => shade(color, tone + amt);
      const lerp = (k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
      quad(a, b, 0, 7, t(-0.24));
      quad(a, b, 7, 8, t(0.06));
      quad(a, b, 8, 30, t(-0.06));
      const p0 = lerp(0.12), p1 = lerp(0.88);
      quad(p0, p1, 12, 26, t(-0.1));
      quad(p0, p1, 25, 26, t(0.04));
      quad(p0, p1, 12, 13, t(-0.16));
      quad(a, b, 30, 33, t(0.08));
      quad(a, b, 29, 30, t(-0.22));
      quad(a, b, 70, 71, t(-0.18));
      quad(a, b, 71, 78, t(0.07));
      quad(a, b, 77, 78, t(0.14));
    }
  }

  // Overhead icon: gold § = task giver, parchment dot = dialogue.
  drawIndicator(def, s, t) {
    const { ctx } = this;
    if (!def.icon) return;
    const y = s.y - 91 - Math.sin(t * 2.5) * 3;
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
