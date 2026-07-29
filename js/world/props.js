// Procedural prop art. Every world object is composed from iso "boxes" —
// extruded diamonds with three flat tones (top / left / right) that fake a
// low-poly 3D look. No image assets anywhere.
//
// Draw functions receive (ctx, ox, oy, prop, t):
//   ox, oy — screen center of the prop's anchor tile (camera already applied)
//   prop   — the zone's prop entry ({type, x, y, ...extras})
//   t      — time in seconds, for subtle animation (water, glows)

import { PAL, shade } from '../engine/palette.js';

// Screen offset of a point (u, v) tiles away from the anchor tile center.
function p(ox, oy, u, v) {
  return { x: ox + (u - v) * 32, y: oy + (u + v) * 16 };
}

// Iso box: footprint min-corner at tile offset (x, y), size w×h tiles,
// extruded z px tall, floating `lift` px above the ground.
export function box(ctx, ox, oy, x, y, w, h, z, color, lift = 0) {
  const N = p(ox, oy, x, y), E = p(ox, oy, x + w, y);
  const S = p(ox, oy, x + w, y + h), W = p(ox, oy, x, y + h);
  const top = z + lift;
  // left face (W -> S)
  ctx.fillStyle = shade(color, -0.1);
  quad(ctx, W.x, W.y - top, S.x, S.y - top, S.x, S.y - lift, W.x, W.y - lift);
  // right face (S -> E)
  ctx.fillStyle = shade(color, -0.22);
  quad(ctx, S.x, S.y - top, E.x, E.y - top, E.x, E.y - lift, S.x, S.y - lift);
  // top face
  ctx.fillStyle = shade(color, 0.08);
  quad(ctx, N.x, N.y - top, E.x, E.y - top, S.x, S.y - top, W.x, W.y - top);
}

function quad(ctx, x1, y1, x2, y2, x3, y3, x4, y4) {
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
  ctx.closePath(); ctx.fill();
}

function ball(ctx, x, y, r, color) {
  ctx.fillStyle = shade(color, -0.05);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shade(color, 0.15);
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.55, 0, Math.PI * 2); ctx.fill();
}

export function shadow(ctx, ox, oy, w = 1, h = 1) {
  ctx.fillStyle = 'rgba(20,20,28,0.25)';
  ctx.beginPath();
  const c = p(ox, oy, (w - 1) / 2 + 0.5 - 0.5, (h - 1) / 2 + 0.5 - 0.5);
  ctx.ellipse(c.x, c.y, w * 26, h * 13, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Books along a shelf face for bookshelves / library stacks.
function spines(ctx, x, y, count, seed) {
  const colors = [PAL.burgundy, PAL.navy, PAL.archiveGreen, PAL.brass, PAL.stone];
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[(seed + i * 3) % colors.length];
    ctx.fillRect(x + i * 6, y - 10 + ((seed + i) % 3), 4, 10 - ((seed + i) % 3));
  }
}

// ---------------------------------------------------------------------------
// Prop registry. w/h = tile footprint, solid = blocks walking.
// `interactLabel` marks clickable resource nodes (main.js wires the actions).
// ---------------------------------------------------------------------------
export const PROPS = {
  // ---- Justice Square -----------------------------------------------------
  fountain: {
    w: 2, h: 2, solid: true,
    draw(ctx, ox, oy, prop, t) {
      box(ctx, ox, oy, -0.5, -0.5, 2, 2, 10, PAL.stone);
      // water surface with a shimmer
      const c = p(ox, oy, 0.5, 0.5);
      ctx.fillStyle = PAL.water;
      ctx.beginPath(); ctx.ellipse(c.x, c.y - 10, 44, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(c.x + Math.sin(t * 1.5) * 6, c.y - 12, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      box(ctx, ox, oy, 0.28, 0.28, 0.44, 0.44, 34, PAL.marble);
      ball(ctx, c.x, c.y - 44 - Math.abs(Math.sin(t * 2)) * 2, 7, PAL.brass);
    },
  },
  noticeboard: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.4, -0.15, 0.18, 0.3, 42, PAL.woodDark);
      box(ctx, ox, oy, 1.25, -0.15, 0.18, 0.3, 42, PAL.woodDark);
      box(ctx, ox, oy, -0.45, -0.1, 1.9, 0.22, 30, PAL.wood, 16);
      // pinned notices
      const a = p(ox, oy, 0.5, 0);
      ctx.fillStyle = PAL.parchment;
      ctx.fillRect(a.x - 34, a.y - 40, 12, 15);
      ctx.fillRect(a.x - 14, a.y - 36, 13, 16);
      ctx.fillRect(a.x + 8, a.y - 44, 12, 14);
      ctx.fillRect(a.x + 26, a.y - 38, 11, 15);
      ctx.fillStyle = PAL.brass;
      ctx.fillRect(a.x - 30, a.y - 41, 3, 3); ctx.fillRect(a.x - 9, a.y - 37, 3, 3);
      ctx.fillRect(a.x + 12, a.y - 45, 3, 3); ctx.fillRect(a.x + 30, a.y - 39, 3, 3);
    },
  },
  bench: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.35, -0.2, 1.7, 0.5, 6, PAL.wood, 10);
      box(ctx, ox, oy, -0.35, -0.25, 1.7, 0.12, 26, PAL.wood, 10);
      box(ctx, ox, oy, -0.3, 0, 0.12, 0.35, 10, PAL.stoneDark);
      box(ctx, ox, oy, 1.2, 0, 0.12, 0.35, 10, PAL.stoneDark);
    },
  },
  lamppost: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop, t) {
      box(ctx, ox, oy, -0.1, -0.1, 0.2, 0.2, 58, PAL.ink);
      const c = p(ox, oy, 0, 0);
      const glow = 0.5 + Math.sin(t * 3 + ox) * 0.08;
      ctx.fillStyle = `rgba(217,182,86,${glow * 0.35})`;
      ctx.beginPath(); ctx.arc(c.x, c.y - 62, 13, 0, Math.PI * 2); ctx.fill();
      ball(ctx, c.x, c.y - 62, 6, PAL.brassLight);
    },
  },
  tree: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.12, -0.12, 0.24, 0.24, 26, PAL.woodDark);
      const c = p(ox, oy, 0, 0);
      ball(ctx, c.x, c.y - 44, 20, PAL.grassDark);
      ball(ctx, c.x - 8, c.y - 52, 12, PAL.grass);
    },
  },
  planter: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.3, -0.3, 0.6, 0.6, 12, PAL.stone);
      const c = p(ox, oy, 0, 0);
      ball(ctx, c.x, c.y - 20, 12, PAL.archiveGreen);
    },
  },
  // Building facades framing the square. Doorway gap is drawn dark; the
  // actual portal is the glowing tile in front (renderer draws that).
  facade: {
    w: 4, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      const styles = {
        office: { wall: PAL.wood, trim: PAL.navy, sign: 'LAW OFFICE' },
        court: { wall: PAL.marble, trim: PAL.navy, sign: 'COURTHOUSE' },
        library: { wall: PAL.archiveGreen, trim: PAL.brass, sign: 'LAW LIBRARY' },
        apartment: { wall: PAL.burgundy, trim: PAL.parchment, sign: 'APARTMENTS' },
      };
      const s = styles[prop.style] || styles.office;
      box(ctx, ox, oy, -0.5, -0.5, 4, 1, 74, s.wall);
      // doorway (dark opening) on the south-west face, centered
      const d1 = p(ox, oy, 1.4, 0.5), d2 = p(ox, oy, 2.6, 0.5);
      ctx.fillStyle = shade(PAL.ink, -0.05);
      quad(ctx, d1.x, d1.y - 46, d2.x, d2.y - 46, d2.x, d2.y, d1.x, d1.y);
      // sign band
      const m = p(ox, oy, 2, 0.5);
      ctx.fillStyle = s.trim;
      ctx.fillRect(m.x - 52, m.y - 70, 104, 15);
      ctx.fillStyle = prop.style === 'apartment' ? PAL.ink : PAL.parchment;
      ctx.font = 'bold 10px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(s.sign, m.x, m.y - 59);
      // courthouse columns
      if (prop.style === 'court') {
        for (const u of [0.6, 3.4]) {
          box(ctx, ox, oy, u - 0.14, 0.42, 0.28, 0.22, 70, PAL.marble);
        }
        const t1 = p(ox, oy, 0.2, 0.5), t2 = p(ox, oy, 3.8, 0.5);
        ctx.fillStyle = shade(PAL.marble, -0.06);
        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y - 74); ctx.lineTo(t2.x, t2.y - 74);
        ctx.lineTo((t1.x + t2.x) / 2, t1.y - 96);
        ctx.closePath(); ctx.fill();
      }
    },
  },
  scales: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.25, -0.25, 0.5, 0.5, 8, PAL.marble);
      box(ctx, ox, oy, -0.08, -0.08, 0.16, 0.16, 46, PAL.marbleDark);
      const c = p(ox, oy, 0, 0);
      ctx.strokeStyle = PAL.brass; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x - 16, c.y - 52); ctx.lineTo(c.x + 16, c.y - 52);
      ctx.moveTo(c.x - 16, c.y - 52); ctx.lineTo(c.x - 16, c.y - 44);
      ctx.moveTo(c.x + 16, c.y - 52); ctx.lineTo(c.x + 16, c.y - 44);
      ctx.stroke();
      ctx.fillStyle = PAL.brass;
      ctx.beginPath(); ctx.ellipse(c.x - 16, c.y - 43, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + 16, c.y - 43, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ball(ctx, c.x, c.y - 55, 3, PAL.brassLight);
    },
  },

  // ---- Law Office ----------------------------------------------------------
  desk: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      const tier = typeof prop.tier === 'function' ? prop.tier() : (prop.tier || 0);
      const col = [PAL.stone, PAL.wood, PAL.woodDark][tier] || PAL.wood;
      box(ctx, ox, oy, -0.4, -0.35, 1.8, 0.7, 22, col);
      const c = p(ox, oy, 0.5, 0);
      // monitors: 1 by default, 2 with the Second Monitor upgrade
      const monitors = typeof prop.monitors === 'function' ? prop.monitors() : 1;
      for (let i = 0; i < monitors; i++) {
        const mx = c.x - 10 + i * 22;
        ctx.fillStyle = PAL.ink;
        ctx.fillRect(mx - 8, c.y - 44, 17, 12);
        ctx.fillStyle = '#bcd8e8';
        ctx.fillRect(mx - 6, c.y - 42, 13, 8);
        ctx.fillStyle = PAL.ink;
        ctx.fillRect(mx - 1, c.y - 32, 3, 4);
      }
      // papers
      ctx.fillStyle = PAL.parchment;
      ctx.fillRect(c.x - 30, c.y - 27, 12, 7);
      if (tier >= 2) { ctx.fillStyle = PAL.brass; ctx.fillRect(c.x + 18, c.y - 29, 8, 4); }
    },
  },
  executivedesk: {
    w: 3, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      box(ctx, ox, oy, -0.42, -0.36, 2.84, 0.72, 26, PAL.woodDark);
      const c = p(ox, oy, 1, 0);
      ctx.fillStyle = PAL.parchment;
      ctx.fillRect(c.x - 34, c.y - 32, 17, 9);
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(c.x + 2, c.y - 49, 25, 17);
      ctx.fillStyle = '#bcd8e8';
      ctx.fillRect(c.x + 5, c.y - 46, 19, 11);
      ctx.fillStyle = PAL.brass;
      ctx.fillRect(c.x - 2, c.y - 30, 10, 3);
      if (prop.nameplate) {
        ctx.fillStyle = PAL.brassLight;
        ctx.fillRect(c.x - 12, c.y - 37, 22, 5);
      }
    },
  },
  filingstation: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy, prop, t) {
      box(ctx, ox, oy, -0.4, -0.3, 0.72, 0.62, 44, PAL.stoneDark);
      box(ctx, ox, oy, 0.68, -0.3, 0.72, 0.62, 44, PAL.stoneDark);
      const c = p(ox, oy, 0.5, 0.25);
      ctx.fillStyle = PAL.brass;
      for (const offset of [-28, -17, -6]) {
        ctx.fillRect(c.x - 39, c.y + offset, 10, 2);
        ctx.fillRect(c.x + 18, c.y + offset, 10, 2);
      }
      ctx.fillStyle = PAL.parchment;
      ctx.fillRect(c.x - 8, c.y - 48, 21, 13);
      ctx.strokeStyle = `rgba(110,36,54,${0.45 + Math.sin(t * 2) * 0.12})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(c.x - 8, c.y - 48, 21, 13);
    },
  },
  wallwindow: {
    w: 2, h: 1, solid: false, noShadow: true,
    draw(ctx, ox, oy, prop, t) {
      // This parallelogram follows the y=0 wall plane. Unlike the former
      // front-facing rectangle, it reads as part of the isometric wall.
      const leftBottom = { x: ox - 24, y: oy + 4 };
      const rightBottom = { x: ox + 24, y: oy + 28 };
      const leftTop = { x: leftBottom.x, y: leftBottom.y - 60 };
      const rightTop = { x: rightBottom.x, y: rightBottom.y - 60 };
      ctx.fillStyle = '#152a43';
      quad(ctx,
        leftTop.x, leftTop.y, rightTop.x, rightTop.y,
        rightBottom.x, rightBottom.y, leftBottom.x, leftBottom.y);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftTop.x, leftTop.y);
      ctx.lineTo(rightTop.x, rightTop.y);
      ctx.lineTo(rightBottom.x, rightBottom.y);
      ctx.lineTo(leftBottom.x, leftBottom.y);
      ctx.closePath();
      ctx.clip();

      const glow = 0.55 + Math.sin(t * 0.7 + prop.x) * 0.08;
      const buildings = [[-23, 25], [-12, 38], [0, 30], [11, 46], [22, 34]];
      ctx.fillStyle = '#0e1828';
      for (const [x, height] of buildings) {
        ctx.fillRect(ox + x, oy + 26 - height, 9, height + 18);
      }
      ctx.fillStyle = `rgba(217,182,86,${glow})`;
      for (let x = -19; x < 24; x += 11) {
        for (let y = -42; y < 18; y += 12) {
          if ((x + y + prop.x) % 3) ctx.fillRect(ox + x, oy + y, 2, 3);
        }
      }
      ctx.restore();

      ctx.strokeStyle = PAL.brass;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftTop.x, leftTop.y);
      ctx.lineTo(rightTop.x, rightTop.y);
      ctx.lineTo(rightBottom.x, rightBottom.y);
      ctx.lineTo(leftBottom.x, leftBottom.y);
      ctx.closePath();
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((leftTop.x + rightTop.x) / 2, (leftTop.y + rightTop.y) / 2);
      ctx.lineTo((leftBottom.x + rightBottom.x) / 2, (leftBottom.y + rightBottom.y) / 2);
      ctx.moveTo(leftTop.x, leftTop.y + 30);
      ctx.lineTo(rightTop.x, rightTop.y + 30);
      ctx.stroke();
    },
  },
  caseboard: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.35, -0.1, 1.7, 0.2, 40, PAL.wood, 12);
      const c = p(ox, oy, 0.5, 0);
      ctx.fillStyle = '#c9a86a';
      ctx.fillRect(c.x - 44, c.y - 48, 88, 32);
      ctx.fillStyle = PAL.parchment;
      ctx.fillRect(c.x - 36, c.y - 44, 10, 12); ctx.fillRect(c.x - 16, c.y - 40, 10, 12);
      ctx.fillRect(c.x + 6, c.y - 44, 10, 12); ctx.fillRect(c.x + 24, c.y - 38, 10, 12);
      ctx.strokeStyle = PAL.burgundy; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x - 31, c.y - 40); ctx.lineTo(c.x - 11, c.y - 36);
      ctx.lineTo(c.x + 11, c.y - 40); ctx.lineTo(c.x + 29, c.y - 34);
      ctx.stroke();
    },
  },
  bookshelf: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      const full = typeof prop.full === 'function' ? prop.full() : true;
      box(ctx, ox, oy, -0.4, -0.15, 1.8, 0.35, 56, PAL.wood);
      const c = p(ox, oy, 0.5, 0.2);
      spines(ctx, c.x - 38, c.y - 40, full ? 12 : 5, 2);
      if (full) spines(ctx, c.x - 38, c.y - 24, 12, 7);
    },
  },
  clientchair: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.28, -0.28, 0.56, 0.56, 14, PAL.burgundy);
      box(ctx, ox, oy, -0.28, -0.32, 0.56, 0.14, 34, PAL.burgundy);
    },
  },
  cabinet: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.3, -0.3, 0.6, 0.6, 40, PAL.stoneDark);
      const c = p(ox, oy, 0, 0.3);
      ctx.fillStyle = PAL.brass;
      ctx.fillRect(c.x - 8, c.y - 34, 8, 2); ctx.fillRect(c.x - 8, c.y - 24, 8, 2);
      ctx.fillRect(c.x - 8, c.y - 14, 8, 2);
    },
  },
  sofa: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.4, -0.25, 1.8, 0.6, 14, PAL.navy);
      box(ctx, ox, oy, -0.4, -0.3, 1.8, 0.16, 30, PAL.navy);
      box(ctx, ox, oy, -0.4, -0.25, 0.16, 0.6, 22, PAL.navyLight);
      box(ctx, ox, oy, 1.24, -0.25, 0.16, 0.6, 22, PAL.navyLight);
    },
  },
  paralegaldesk: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.4, -0.3, 1.6, 0.6, 20, PAL.woodLight);
      const c = p(ox, oy, 0.4, 0);
      ctx.fillStyle = PAL.ink; ctx.fillRect(c.x - 7, c.y - 40, 14, 10);
      ctx.fillStyle = '#bcd8e8'; ctx.fillRect(c.x - 5, c.y - 38, 10, 6);
      ctx.fillStyle = PAL.parchment;
      ctx.fillRect(c.x + 12, c.y - 26, 14, 8);
    },
  },
  conftable: {
    w: 3, h: 2, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.35, -0.2, 2.7, 1.4, 22, PAL.woodDark);
      const c = p(ox, oy, 1, 0.5);
      ctx.fillStyle = PAL.parchment;
      ctx.fillRect(c.x - 20, c.y - 28, 12, 7); ctx.fillRect(c.x + 8, c.y - 24, 12, 7);
    },
  },
  tv: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy, prop, t) {
      const c = p(ox, oy, 0.5, 0);
      box(ctx, ox, oy, -0.42, -0.1, 1.84, 0.2, 56, PAL.ink);
      ctx.fillStyle = '#101d31';
      ctx.fillRect(c.x - 42, c.y - 65, 84, 42);
      ctx.fillStyle = `rgba(100,174,211,${0.22 + Math.sin(t) * 0.05})`;
      ctx.fillRect(c.x - 38, c.y - 61, 76, 34);
      ctx.fillStyle = PAL.parchment;
      ctx.font = 'bold 8px Verdana';
      ctx.textAlign = 'center';
      ctx.fillText('CASE STRATEGY', c.x, c.y - 43);
    },
  },
  aiworkstation: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop, t) {
      box(ctx, ox, oy, -0.35, -0.35, 0.7, 0.7, 24, PAL.ink);
      const c = p(ox, oy, 0, 0);
      const g = 0.5 + Math.sin(t * 2.5) * 0.2;
      ctx.fillStyle = `rgba(120,220,180,${g})`;
      ctx.fillRect(c.x - 10, c.y - 44, 20, 14);
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(c.x - 12, c.y - 46, 24, 2);
    },
  },

  // ---- Courthouse ----------------------------------------------------------
  judgebench: {
    w: 3, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.45, -0.4, 2.9, 0.8, 40, PAL.woodDark);
      box(ctx, ox, oy, 0.85, -0.5, 0.3, 0.2, 56, PAL.woodDark);
      const c = p(ox, oy, 1, 0);
      ctx.fillStyle = PAL.brass;
      ctx.fillRect(c.x - 26, c.y - 46, 52, 3);
      // gavel block
      ctx.fillStyle = PAL.woodLight; ctx.fillRect(c.x + 14, c.y - 45, 8, 4);
    },
  },
  witnessstand: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.3, -0.3, 0.6, 0.6, 28, PAL.wood);
      const c = p(ox, oy, 0, 0);
      ctx.fillStyle = PAL.brass; ctx.fillRect(c.x - 10, c.y - 32, 20, 2);
    },
  },
  counseltable: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.35, -0.25, 1.7, 0.5, 20, PAL.wood);
      const c = p(ox, oy, 0.5, 0);
      ctx.fillStyle = PAL.parchment;
      ctx.fillRect(c.x - 18, c.y - 26, 12, 7); ctx.fillRect(c.x + 6, c.y - 24, 12, 7);
    },
  },
  clerkcounter: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.4, -0.3, 1.8, 0.6, 26, PAL.marbleDark);
      const c = p(ox, oy, 0.5, 0);
      ctx.fillStyle = PAL.parchment; ctx.fillRect(c.x - 12, c.y - 32, 11, 6);
      ctx.fillStyle = PAL.brass; ctx.fillRect(c.x + 6, c.y - 33, 10, 4);
    },
  },

  // ---- Law Library ----------------------------------------------------------
  shelfstack: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      box(ctx, ox, oy, -0.42, -0.2, 1.84, 0.4, 64, PAL.archiveGreen);
      const c = p(ox, oy, 0.5, 0.2);
      spines(ctx, c.x - 40, c.y - 52, 13, prop.x + prop.y);
      spines(ctx, c.x - 40, c.y - 36, 13, prop.x * 2 + 1);
      spines(ctx, c.x - 40, c.y - 20, 13, prop.y * 3 + 2);
    },
  },
  readingtable: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.35, -0.25, 1.7, 0.5, 20, PAL.wood);
      const c = p(ox, oy, 0.5, 0);
      // banker's lamp
      ctx.fillStyle = PAL.brass; ctx.fillRect(c.x - 2, c.y - 34, 3, 9);
      ctx.fillStyle = PAL.archiveGreenLight;
      ctx.beginPath(); ctx.ellipse(c.x, c.y - 35, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PAL.parchment;
      ctx.fillRect(c.x - 24, c.y - 26, 13, 8); ctx.fillRect(c.x + 10, c.y - 25, 13, 8);
    },
  },
  pedestal: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop, t) {
      box(ctx, ox, oy, -0.22, -0.22, 0.44, 0.44, 34, PAL.marble);
      const c = p(ox, oy, 0, 0);
      const g = 0.35 + Math.sin(t * 2) * 0.12;
      ctx.fillStyle = `rgba(217,182,86,${g})`;
      ctx.beginPath(); ctx.arc(c.x, c.y - 44, 16, 0, Math.PI * 2); ctx.fill();
      // the rare authority: a fat glowing tome
      ctx.fillStyle = PAL.burgundy; ctx.fillRect(c.x - 9, c.y - 48, 18, 7);
      ctx.fillStyle = PAL.parchment; ctx.fillRect(c.x - 8, c.y - 50, 16, 3);
    },
  },

  // ---- Apartment -------------------------------------------------------------
  bed: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      const tier = typeof prop.tier === 'function' ? prop.tier() : 0;
      box(ctx, ox, oy, -0.4, -0.35, 1.8, 0.7, 10, PAL.woodDark);
      box(ctx, ox, oy, -0.32, -0.28, 1.64, 0.56, 8, tier >= 1 ? PAL.navy : PAL.stone, 10);
      box(ctx, ox, oy, -0.28, -0.22, 0.4, 0.44, 5, PAL.parchment, 18);
      box(ctx, ox, oy, -0.44, -0.4, 0.12, 0.8, 34, PAL.woodDark);
    },
  },
  coffeemachine: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop, t) {
      box(ctx, ox, oy, -0.3, -0.3, 0.6, 0.6, 22, PAL.stoneDark);
      const owned = typeof prop.owned === 'function' ? prop.owned() : true;
      const c = p(ox, oy, 0, 0);
      if (owned) {
        ctx.fillStyle = PAL.ink; ctx.fillRect(c.x - 7, c.y - 40, 14, 16);
        ctx.fillStyle = PAL.brass; ctx.fillRect(c.x - 4, c.y - 28, 8, 3);
        // steam
        ctx.fillStyle = `rgba(243,233,210,${0.3 + Math.sin(t * 3) * 0.15})`;
        ctx.beginPath(); ctx.arc(c.x + Math.sin(t * 2) * 2, c.y - 46, 3, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = PAL.parchment; ctx.fillRect(c.x - 8, c.y - 30, 16, 8);
      }
    },
  },
  wardrobe: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.35, -0.3, 0.7, 0.6, 54, PAL.wood);
      const c = p(ox, oy, 0, 0.3);
      ctx.strokeStyle = PAL.woodDark; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c.x, c.y - 50); ctx.lineTo(c.x, c.y - 8); ctx.stroke();
      ctx.fillStyle = PAL.brass;
      ctx.fillRect(c.x - 4, c.y - 30, 2, 5); ctx.fillRect(c.x + 2, c.y - 30, 2, 5);
    },
  },
  kitchenette: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      const nice = typeof prop.nice === 'function' ? prop.nice() : false;
      box(ctx, ox, oy, -0.4, -0.3, 1.8, 0.6, 24, nice ? PAL.marble : PAL.stone);
      const c = p(ox, oy, 0.5, 0);
      ctx.fillStyle = PAL.ink;
      ctx.beginPath(); ctx.ellipse(c.x - 12, c.y - 27, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      if (nice) { ctx.fillStyle = PAL.brass; ctx.fillRect(c.x + 8, c.y - 32, 4, 8); }
    },
  },
  homedesk: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.32, -0.28, 0.64, 0.56, 20, PAL.woodLight);
      const c = p(ox, oy, 0, 0);
      ctx.fillStyle = PAL.ink; ctx.fillRect(c.x - 6, c.y - 36, 12, 9);
      ctx.fillStyle = '#bcd8e8'; ctx.fillRect(c.x - 4, c.y - 34, 8, 5);
    },
  },
  plant: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.18, -0.18, 0.36, 0.36, 10, '#b0623d');
      const c = p(ox, oy, 0, 0);
      ball(ctx, c.x, c.y - 22, 10, PAL.archiveGreen);
    },
  },
};
