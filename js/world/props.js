// Procedural prop art. Every world object is composed from iso "boxes" —
// extruded diamonds with three flat tones (top / left / right) that fake a
// low-poly 3D look. No image assets anywhere.
//
// Draw functions receive (ctx, ox, oy, prop, t):
//   ox, oy — screen center of the prop's anchor tile (camera already applied)
//   prop   — the zone's prop entry ({type, x, y, ...extras})
//   t      — time in seconds, for subtle animation (water, glows)

import { PAL, shade } from '../engine/palette.js';
import { drawSleepingJudge } from '../entities/robots.js';

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

// Detail planes follow the actual furniture surfaces, including their perspective.
function face(ctx,ox,oy,u,v,lift,draw) {
  const at=p(ox,oy,u,v); ctx.save();ctx.transform(1,.5,0,1,at.x,at.y-lift);draw();ctx.restore();
}
function surface(ctx,ox,oy,u,v,lift,draw) {
  const at=p(ox,oy,u,v);ctx.save();ctx.transform(1,.5,-1,.5,at.x,at.y-lift);draw();ctx.restore();
}
function stroke(ctx,points,color,width=1) {
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
}
function roundRect(ctx,x,y,w,h,r,color) {ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function table(ctx,ox,oy,w,h,color=PAL.woodDark,lift=31) {
  for (const u of [-.29,w-.75]) for (const v of [-.23,h-.75]) {
    box(ctx,ox,oy,u,v,.12,.12,lift-3,color);
    box(ctx,ox,oy,u-.015,v-.015,.15,.15,3,'#a28b63');
  }
  box(ctx,ox,oy,-.34,-.29,w-.28,h-.28,4,color,lift-5);
  box(ctx,ox,oy,-.43,-.38,w-.1,h-.1,4,color,lift);
  surface(ctx,ox,oy,-.36,-.31,lift+4,()=>{
    for (let y=2;y<(h-.24)*32;y+=4) stroke(ctx,[[1,y],[(w-.25)*32,y+Math.sin(y)*.5]],'rgba(223,193,138,.12)',.6);
    ctx.strokeStyle='#d7b98155';ctx.lineWidth=.8;ctx.strokeRect(1,1,(w-.25)*32-2,(h-.25)*32-2);
  });
}
function papers(ctx,ox,oy,u,v,lift) {
  surface(ctx,ox,oy,u,v,lift,()=>{
    roundRect(ctx,0,0,15,19,1,'#c4bb9d');roundRect(ctx,-1,-2,15,19,1,'#f0ecdf');
    for (let y=2;y<12;y+=3) stroke(ctx,[[2,y],[10-(y%2)*2,y]],'#969d95',.6);
    stroke(ctx,[[11,6],[11,17]],'#253e55',1.2);
  });
}
function monitor(ctx,ox,oy,u,v,lift) {
  const c=p(ox,oy,u,v);
  surface(ctx,ox,oy,u+.1,v+.08,lift,()=>roundRect(ctx,0,0,14,8,1,'#646f73'));
  face(ctx,ox,oy,u,v,lift,()=>{
    roundRect(ctx,11,-12,3,14,1,'#7b898c');
    roundRect(ctx,-4,-37,37,26,2,'#17252d');
    roundRect(ctx,-2,-35,33,21,1,'#d3e2df');
    ctx.fillStyle='#305c63';ctx.fillRect(-2,-35,33,4);
    ctx.fillStyle='#92aaa8';ctx.fillRect(0,-29,6,13);
    for(let y=-28;y<-16;y+=4){ctx.fillStyle='#adbdb5';ctx.fillRect(9,y,18,2);ctx.fillStyle='#e8efe4';ctx.fillRect(10,y+.4,11,.6);}
    ctx.fillStyle='#90d4b2';ctx.fillRect(27,-12.5,2,1);
    stroke(ctx,[[30,-34],[24,-15]],'#ffffff33',2);
  });
  // Curved cable disappears under the desktop.
  ctx.strokeStyle='#252e3388';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(c.x+12,c.y-lift+3);ctx.quadraticCurveTo(c.x+23,c.y-lift+16,c.x+6,c.y-lift+24);ctx.stroke();
}
function workstation(ctx,ox,oy,prop={},executive=false) {
  const w=executive?3:2, lift=33;
  table(ctx,ox,oy,w,1,executive?'#70513a':'#87684d',lift);
  box(ctx,ox,oy,-.3,-.18,.5,.58,26,'#72553e',3);
  face(ctx,ox,oy,-.3,.4,3,()=>{
    for(let y=-24;y<-4;y+=8){ctx.strokeStyle='#453c31';ctx.lineWidth=.6;ctx.strokeRect(1,y,14,7);ctx.fillStyle='#bba474';ctx.fillRect(5,y+3,6,1.2);}
  });
  const monitors=typeof prop.monitors==='function'?prop.monitors():1;
  for(let i=0;i<monitors;i++)monitor(ctx,ox,oy,.25+i*.88,-.16,lift+4);
  surface(ctx,ox,oy,.28,.32,lift+5,()=>{
    roundRect(ctx,-2,0,26,9,1,'#35494b');
    for(let y=1;y<7;y+=2)for(let x=0;x<22;x+=3){ctx.fillStyle='#b7c1b8';ctx.fillRect(x,y,2,1.2);}
    roundRect(ctx,7,7,10,1,0,'#a5b4b1');roundRect(ctx,28,1,5,8,2,'#b1bab4');stroke(ctx,[[30.5,1],[30.5,4]],'#5e7576',.5);
  });
  papers(ctx,ox,oy,-.25,.17,lift+5);
  const c=p(ox,oy,w-.95,.07);
  ctx.fillStyle='#eae3cf';ctx.beginPath();ctx.ellipse(c.x,c.y-42,4,2,0,0,Math.PI*2);ctx.fill();ctx.fillRect(c.x-4,c.y-42,8,7);
  ctx.strokeStyle='#eae3cf';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(c.x+4,c.y-38,2.4,-1.6,1.6);ctx.stroke();
  if(executive){ papers(ctx,ox,oy,1.55,.12,lift+5);face(ctx,ox,oy,.8,.39,lift+4,()=>{roundRect(ctx,0,-4,26,5,1,'#b69b58');ctx.fillStyle='#423d32';ctx.font='4px Verdana';ctx.fillText('PARTNER',3,0);}); }
  if(prop.phone?.()) surface(ctx,ox,oy,1.06,.35,lift+5,()=>{roundRect(ctx,0,0,7,12,1.5,'#1d2931');roundRect(ctx,.8,1,5.4,9,1,'#6fa7a9');ctx.fillStyle='#d8e5db';ctx.fillRect(2,3,3,1);ctx.fillRect(2,5,3,1);});
}

// ---------------------------------------------------------------------------
// Prop registry. w/h = tile footprint, solid = blocks walking.
// `interactLabel` marks clickable resource nodes (main.js wires the actions).
// ---------------------------------------------------------------------------
export const PROPS = {
  scoreboard: {
    w:2,h:1,solid:true,
    draw(ctx,ox,oy,prop) {
      for(const u of [-.3,1.3])box(ctx,ox,oy,u,-.1,.12,.15,68,'#68513a');
      box(ctx,ox,oy,-.43,-.12,1.95,.25,52,'#a1844c',22);
      face(ctx,ox,oy,-.38,.13,24,()=>{
        roundRect(ctx,0,-48,59,47,1,'#213d35');ctx.fillStyle='#dfc68b';ctx.font='bold 5px Georgia';ctx.fillText('BILLABLE HOURS',5,-38);ctx.font='3.7px Verdana';ctx.fillText('HALL OF FAME',13,-31);
        const entries=(prop.entries || []).slice(0,3);
        if (!entries.length) { ctx.font='3px Verdana';ctx.fillStyle='#afc0a3';ctx.fillText('NO COMPLETED RUNS',8,-16); }
        entries.forEach((entry,i)=>{ctx.fillStyle='#d5cbaa';ctx.font='3.4px Verdana';ctx.fillText(`${i+1}  ${entry.name.slice(0,11)}`,4,-22+i*8);const minutes=Math.floor(entry.billableMs/60000);ctx.fillText(`${minutes}m`,46,-22+i*8);});
      });
    },
  },
  sidebarcounter: {
    w: 5, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -.4, -.35, 4.8, .8, 32, '#684834');
      box(ctx, ox, oy, -.48, -.43, 4.96, .96, 4, '#c7bda2', 32);
      face(ctx,ox,oy,-.4,.45,0,()=>{
        for(let x=3;x<145;x+=30){ctx.strokeStyle='#b3905a';ctx.lineWidth=1;ctx.strokeRect(x,-28,24,22);ctx.strokeStyle='#48362b';ctx.strokeRect(x+2,-26,20,18);}
        stroke(ctx,[[0,-6],[153,-6]],'#c0a26e',2);
      });
      surface(ctx,ox,oy,-.4,-.35,37,()=>{for(let x=0;x<140;x+=28)stroke(ctx,[[x,0],[x+8,8],[x+24,13]],'#ffffff35',.7);});
      for (const u of [.25, 1.4, 2.6, 3.8]) {
        box(ctx, ox, oy, u, .43, .05, .05, 25, PAL.brass, 2);
        const c = p(ox, oy, u, 0);
        ctx.fillStyle = '#e8e3d3'; ctx.fillRect(c.x - 3, c.y - 45, 6, 9);
        ctx.fillStyle = '#476858'; ctx.fillRect(c.x - 3, c.y - 41, 6, 4);
      }
    },
  },
  sidebarback: {
    w: 4, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -.35, -.3, 3.7, .65, 60, '#304d40');
      const c = p(ox, oy, 1.4, .3);
      ctx.fillStyle = '#192e29'; ctx.fillRect(c.x - 63, c.y - 67, 126, 23);
      ctx.strokeStyle = '#c1a46c'; ctx.lineWidth = 1; ctx.strokeRect(c.x - 63, c.y - 67, 126, 23);
      ctx.fillStyle = '#e4ce98'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('THE SIDEBAR', c.x, c.y - 51);
      for (let i=0; i<9; i++) {
        const b = p(ox, oy, i*.37, .35);
        ctx.fillStyle = ['#79854b','#8d6251','#b48b43'][i%3];
        ctx.fillRect(b.x-3,b.y-34,6,13); ctx.fillRect(b.x-1.5,b.y-38,3,5);
        ctx.fillStyle = PAL.parchment; ctx.fillRect(b.x-2,b.y-29,4,4);
      }
      ctx.textAlign = 'left';
    },
  },
  barstool: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -.06, -.06, .12, .12, 20, '#5e5747');
      const c = p(ox, oy, 0, 0);
      ctx.fillStyle = '#86765a'; ctx.beginPath(); ctx.ellipse(c.x,c.y-3,10,4,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#61383b'; ctx.beginPath(); ctx.ellipse(c.x,c.y-23,13,6,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#c4a263'; ctx.lineWidth = 1; ctx.stroke();
    },
  },
  topictable: {
    w: 2, h: 2, solid: true,
    draw(ctx, ox, oy, prop) {
      table(ctx,ox,oy,2,2,'#946c45',28);
      papers(ctx,ox,oy,.2,.2,33);
      const c = p(ox, oy, .5, .5);
      ctx.fillStyle = PAL.parchment; ctx.fillRect(c.x - 12,c.y - 36,24,9);
      ctx.fillStyle = '#17392e'; ctx.fillRect(c.x - 45,c.y - 48,90,14);
      ctx.fillStyle = '#ead9ac'; ctx.font = 'bold 9px Verdana'; ctx.textAlign = 'center';
      ctx.fillText(prop.label || 'DISCUSSION',c.x,c.y-38); ctx.textAlign = 'left';
    },
  },
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
    w:2,h:1,solid:true,
    draw(ctx,ox,oy) {
      for(const u of [-.3,1.2])box(ctx,ox,oy,u,-.12,.12,.5,17,'#594531');
      box(ctx,ox,oy,-.4,-.24,1.85,.62,5,'#94704a',17);
      for(const z of [24,34])box(ctx,ox,oy,-.4,-.29,1.85,.12,8,'#a07b52',z);
      for(const u of [-.39,1.34])box(ctx,ox,oy,u,-.3,.1,.15,43,'#6b4c34');
      face(ctx,ox,oy,-.38,-.17,0,()=>{for(const y of [-27,-37])stroke(ctx,[[2,y],[55,y]],'#dfc18a44',.7);});
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
  desk: { w: 2, h: 1, solid: true, draw(ctx,ox,oy,prop) { workstation(ctx,ox,oy,prop); } },
  executivedesk: { w: 3, h: 1, solid: true, draw(ctx,ox,oy,prop) { workstation(ctx,ox,oy,prop,true); } },
  filingstation: {
    w:2,h:1,solid:true,
    draw(ctx,ox,oy) {
      for(const u of [-.4,.68]) {
        box(ctx,ox,oy,u,-.3,.72,.62,48,'#7b8583',3);
        face(ctx,ox,oy,u,.32,3,()=>{
          for(let y=-45;y<-5;y+=14){
            roundRect(ctx,1,y,21,13,1,'#899591');ctx.strokeStyle='#5c6b65';ctx.lineWidth=.5;ctx.strokeRect(1,y,21,13);
            ctx.fillStyle='#deddd0';ctx.fillRect(6,y+3,11,4);ctx.fillStyle='#64746f';ctx.fillRect(8,y+4,7,.7);
            roundRect(ctx,8,y+9,8,1.5,.5,'#c2c6b3');
          }
        });
      }
      papers(ctx,ox,oy,.75,-.18,53);
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
  porthole: {
    w: 1, h: 1, solid: false, noShadow: true,
    draw(ctx, ox, oy, prop, t) {
      const glow = 0.45 + Math.sin(t * 0.7) * 0.08;
      ctx.fillStyle = PAL.brass;
      ctx.beginPath();
      ctx.arc(ox, oy - 34, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#152a43';
      ctx.beginPath();
      ctx.arc(ox, oy - 34, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(217,182,86,${glow})`;
      ctx.fillRect(ox - 3, oy - 37, 2, 3);
      ctx.fillRect(ox + 3, oy - 32, 2, 3);
    },
  },
  dotpainting: {
    w: 2, h: 1, solid: false, noShadow: true,
    draw(ctx, ox, oy) {
      const leftBottom = { x: ox - 20, y: oy - 12 };
      const rightBottom = { x: ox + 20, y: oy + 8 };
      const leftTop = { x: leftBottom.x, y: leftBottom.y - 42 };
      const rightTop = { x: rightBottom.x, y: rightBottom.y - 42 };
      ctx.fillStyle = PAL.brass;
      quad(ctx,
        leftTop.x - 3, leftTop.y - 3, rightTop.x + 3, rightTop.y - 3,
        rightBottom.x + 3, rightBottom.y + 3, leftBottom.x - 3, leftBottom.y + 3);
      ctx.fillStyle = '#faf8f0';
      quad(ctx,
        leftTop.x, leftTop.y, rightTop.x, rightTop.y,
        rightBottom.x, rightBottom.y, leftBottom.x, leftBottom.y);
      ctx.fillStyle = PAL.ink;
      ctx.beginPath();
      ctx.arc(ox, oy - 23, 6, 0, Math.PI * 2);
      ctx.fill();
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
    draw(ctx,ox,oy,prop) {
      const full=typeof prop.full==='function'?prop.full():true;
      box(ctx,ox,oy,-.4,-.22,1.8,.44,72,'#71503a',4);
      face(ctx,ox,oy,-.4,.22,4,()=>{
        ctx.fillStyle='#312c25';ctx.fillRect(3,-68,51,65);
        for(const x of [1,27,54]){ctx.fillStyle='#a78154';ctx.fillRect(x,-68,2,65);}
        for(let row=0;row<3;row++) {
          const base=-5-row*21;
          for(let i=0;i<(full?11:row===0?4:0);i++) {
            const x=4+i*4.4, height=13+(i*7+row)%5;
            ctx.fillStyle=['#703e3d','#283e51','#485943','#9a7846'][(i+row)%4];ctx.fillRect(x,base-height,3.5,height);
            ctx.fillStyle='#ddc385';ctx.fillRect(x+.3,base-height+2,2.9,.7);ctx.fillRect(x+.3,base-2,2.9,.7);
            ctx.fillStyle='#ddcda1';ctx.fillRect(x+.8,base-height+5,1.8,3);
            ctx.fillStyle='#ffffff12';ctx.fillRect(x+.3,base-height,.5,height);
          }
          ctx.fillStyle='#a37d51';ctx.fillRect(2,base,52,2);ctx.fillStyle='#483524';ctx.fillRect(2,base+2,52,1);
        }
        ctx.fillStyle='#ccb474';ctx.fillRect(13,-74,31,5);ctx.fillStyle='#302f27';ctx.font='3.4px Verdana';ctx.fillText('ETHICS TREATISES',14,-70.5);
      });
      box(ctx,ox,oy,-.46,-.27,1.92,.54,4,'#93734b',76);
      box(ctx,ox,oy,-.44,-.26,1.88,.52,5,'#71503a');
    },
  },
  clientchair: {
    w:1,h:1,solid:true,
    draw(ctx,ox,oy) {
      for(const u of [-.25,.22])for(const v of [-.22,.24])box(ctx,ox,oy,u,v,.09,.09,16,'#503e31');
      box(ctx,ox,oy,-.3,-.28,.65,.65,7,'#6f4146',16);
      box(ctx,ox,oy,-.3,-.33,.65,.12,28,'#63383f',21);
      face(ctx,ox,oy,-.25,-.2,21,()=>{roundRect(ctx,0,-25,17,21,3,'#81565a');ctx.strokeStyle='#ae818166';ctx.lineWidth=.5;ctx.strokeRect(2,-23,13,17);});
      for(const u of [-.34,.3])box(ctx,ox,oy,u,-.05,.09,.42,3,'#8b6647',28);
    },
  },
  officechair: {
    w:1,h:1,solid:true,
    draw(ctx,ox,oy) {
      const c=p(ox,oy,0,0);ctx.strokeStyle='#88958f';ctx.lineWidth=2;
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const x=c.x+Math.cos(a)*15,y=c.y+Math.sin(a)*6;stroke(ctx,[[c.x,c.y-6],[x,y]],'#87928b',2);roundRect(ctx,x-2,y-1,4,3,1,'#202b30');}
      box(ctx,ox,oy,-.05,-.05,.1,.1,20,'#87948f');
      box(ctx,ox,oy,-.3,-.25,.65,.62,7,'#344a4c',19);
      box(ctx,ox,oy,-.3,-.34,.65,.14,30,'#283c41',26);
      face(ctx,ox,oy,-.26,-.2,26,()=>{roundRect(ctx,0,-27,17,25,4,'#43595b');for(let y=-24;y<-4;y+=3)stroke(ctx,[[2,y],[15,y]],'#728b8244',.6);});
      for(const u of [-.34,.3]){box(ctx,ox,oy,u,.03,.07,.12,14,'#7a8983',16);box(ctx,ox,oy,u-.02,-.07,.13,.45,3,'#263a3e',30);}
    },
  },
  cabinet: {
    w:1,h:1,solid:true,
    draw(ctx,ox,oy) {
      box(ctx,ox,oy,-.3,-.3,.6,.6,44,'#6f7f7c',3);
      face(ctx,ox,oy,-.3,.3,3,()=>{for(const y of [-41,-28,-15]){roundRect(ctx,1,y,17,12,1,'#89938a');ctx.strokeStyle='#4c6460';ctx.lineWidth=.6;ctx.strokeRect(1,y,17,12);ctx.fillStyle='#d7d3b9';ctx.fillRect(5,y+2,9,3);ctx.fillStyle='#bac2b0';ctx.fillRect(6,y+8,7,1.5);}});
    },
  },
  safe: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      const empty = typeof prop.empty === 'function' ? prop.empty() : false;
      box(ctx, ox, oy, -0.38, -0.34, 0.76, 0.68, 48, '#343941', 7);
      const c = p(ox, oy, 0, 0.25);
      ctx.fillStyle = '#252a31';
      ctx.fillRect(c.x - 17, c.y - 46, 34, 31);
      ctx.strokeStyle = PAL.brass;
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x - 17, c.y - 46, 34, 31);
      ctx.beginPath();
      ctx.arc(c.x + 7, c.y - 31, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PAL.brassLight;
      ctx.fillRect(c.x - 11, c.y - 33, 9, 3);
      ctx.font = 'bold 7px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(empty ? 'EMPTY' : 'CLIENT', c.x, c.y - 51);
      if (!empty) {
        for (const [dx, dy] of [[-9, -11], [0, -9], [9, -12], [-3, -15], [6, -17]]) {
          ball(ctx, c.x + dx, c.y + dy, 3, PAL.brassLight);
        }
      }
    },
  },
  sofa: {
    w:2,h:1,solid:true,
    draw(ctx,ox,oy) {
      for(const u of [-.32,1.14])for(const v of [-.2,.26])box(ctx,ox,oy,u,v,.12,.12,8,'#5c4837');
      box(ctx,ox,oy,-.4,-.25,1.8,.68,8,'#243953',8);
      box(ctx,ox,oy,-.4,-.32,1.8,.17,30,'#28415e',10);
      for(const u of [-.24,.51]) {
        box(ctx,ox,oy,u,-.15,.69,.51,6,'#486681',16);
        box(ctx,ox,oy,u,-.27,.69,.14,18,'#3b5872',20);
        face(ctx,ox,oy,u,-.12,20,()=>{ctx.strokeStyle='#96aba155';ctx.lineWidth=.6;ctx.strokeRect(2,-16,17,13);});
      }
      for(const u of [-.42,1.2])box(ctx,ox,oy,u,-.22,.19,.62,18,'#395673',12);
    },
  },
  barcart: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.34, -0.3, 0.68, 0.6, 8, PAL.woodDark, 16);
      box(ctx, ox, oy, -0.34, -0.3, 0.68, 0.6, 5, PAL.brass, 31);
      const c = p(ox, oy, 0, 0);
      ctx.fillStyle = '#8a4d2e';
      ctx.beginPath();
      ctx.roundRect(c.x - 10, c.y - 56, 12, 22, 3);
      ctx.fill();
      ctx.fillStyle = PAL.brassLight;
      ctx.fillRect(c.x - 7, c.y - 60, 6, 5);
      ctx.strokeStyle = PAL.parchment;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x + 8, c.y - 49);
      ctx.lineTo(c.x + 8, c.y - 38);
      ctx.arc(c.x + 8, c.y - 52, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#b06c39';
      ctx.fillRect(c.x + 4, c.y - 51, 8, 3);
      ctx.fillStyle = PAL.ink;
      ctx.beginPath();
      ctx.arc(c.x - 15, c.y - 3, 5, 0, Math.PI * 2);
      ctx.arc(c.x + 15, c.y + 5, 5, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  paralegaldesk: { w: 2, h: 1, solid: true, draw(ctx,ox,oy) { workstation(ctx,ox,oy); } },
  conftable: {
    w:3,h:2,solid:true,
    draw(ctx,ox,oy) {
      table(ctx,ox,oy,3,2,'#6d503e',32);
      for(const [u,v] of [[0,0],[1.4,.05],[.25,.65],[1.6,.68]])papers(ctx,ox,oy,u,v,37);
      surface(ctx,ox,oy,1,.4,37,()=>{roundRect(ctx,0,0,15,11,3,'#273b3e');roundRect(ctx,3,2,9,4,1,'#77a39b');for(let x=3;x<12;x+=3){ctx.fillStyle='#abbbb0';ctx.fillRect(x,8,1,1);}});
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
    w:3,h:1,solid:true,
    draw(ctx,ox,oy,prop,t) {
      // Raised dais, dedicated chair and sleeping judge behind the woodwork.
      box(ctx,ox,oy,-.52,-.5,3.04,1,7,'#8b7559');
      const c=p(ox,oy,1,-.2);drawSleepingJudge(ctx,c.x,c.y-5,t);
      box(ctx,ox,oy,-.45,-.2,2.9,.65,43,'#765039',7);
      face(ctx,ox,oy,-.45,.45,7,()=>{
        for(const x of [4,34,64]){ctx.strokeStyle='#c89e5d';ctx.lineWidth=1;ctx.strokeRect(x,-37,23,31);ctx.strokeStyle='#4d3429';ctx.strokeRect(x+2,-35,19,27);}
      });
      box(ctx,ox,oy,-.51,-.26,3.02,.78,4,'#99724d',50);
      const g=p(ox,oy,1.9,.1);ctx.fillStyle='#bb9965';ctx.beginPath();ctx.ellipse(g.x,g.y-55,7,3,0,0,Math.PI*2);ctx.fill();stroke(ctx,[[g.x-4,g.y-58],[g.x+7,g.y-65]],'#654631',2);roundRect(ctx,g.x+3,g.y-69,9,5,1,'#5e3e28');
      face(ctx,ox,oy,.2,.45,54,()=>{roundRect(ctx,0,-1,50,9,1,'#202f36');ctx.fillStyle='#d4c392';ctx.font='4.4px Verdana';ctx.fillText('COURT NOT IN SESSION',2,5);});
    },
  },
  witnessstand: {
    w:1,h:1,solid:true,
    draw(ctx,ox,oy) {
      box(ctx,ox,oy,-.35,-.33,.75,.74,6,'#735840');
      box(ctx,ox,oy,-.3,.13,.65,.22,30,'#916945',6);
      face(ctx,ox,oy,-.3,.35,6,()=>{ctx.strokeStyle='#c8a676';ctx.lineWidth=.8;ctx.strokeRect(2,-26,16,22);});
      box(ctx,ox,oy,-.35,.1,.75,.28,3,'#ba9865',36);
      const c=p(ox,oy,0,.12);stroke(ctx,[[c.x,c.y-36],[c.x,c.y-47],[c.x+4,c.y-50]],'#273b3b',1.2);
    },
  },
  counseltable: {
    w:2,h:1,solid:true,
    draw(ctx,ox,oy) {
      table(ctx,ox,oy,2,1,'#876346',32);papers(ctx,ox,oy,-.2,.05,37);papers(ctx,ox,oy,.65,.08,37);
      const c=p(ox,oy,1.15,.15);stroke(ctx,[[c.x,c.y-37],[c.x,c.y-50],[c.x-4,c.y-54]],'#34413f',1.2);roundRect(ctx,c.x-6,c.y-55,5,2,1,'#1b292c');
    },
  },
  clerkcounter: {
    w:2,h:1,solid:true,
    draw(ctx,ox,oy){workstation(ctx,ox,oy);},
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
    w:2,h:1,solid:true,
    draw(ctx,ox,oy,prop) {
      const tier=typeof prop.tier==='function'?prop.tier():0;
      box(ctx,ox,oy,-.4,-.35,1.8,.7,11,'#66503e',4);
      box(ctx,ox,oy,-.33,-.28,1.66,.56,8,'#e1d9c5',15);
      box(ctx,ox,oy,.16,-.3,1.17,.6,3,tier?'#3d5870':'#888979',23);
      surface(ctx,ox,oy,.2,-.26,26,()=>{for(let x=2;x<32;x+=6)stroke(ctx,[[x,1],[x,16]],'#edf0dd30',.7);});
      box(ctx,ox,oy,-.26,-.2,.38,.4,4,'#f0e9d7',23);
      box(ctx,ox,oy,-.45,-.4,.12,.8,37,'#846441');
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
    draw(ctx, ox, oy, prop) {
      box(ctx, ox, oy, -0.35, -0.3, 0.7, 0.6, 54, PAL.wood);
      const c = p(ox, oy, 0, 0.3);
      ctx.strokeStyle = PAL.woodDark; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c.x, c.y - 50); ctx.lineTo(c.x, c.y - 8); ctx.stroke();
      ctx.fillStyle = PAL.brass;
      ctx.fillRect(c.x - 4, c.y - 30, 2, 5); ctx.fillRect(c.x + 2, c.y - 30, 2, 5);
      if (prop.expanded?.()) {
        ctx.fillStyle = PAL.woodDark; ctx.fillRect(c.x - 14, c.y - 48, 28, 39);
        ctx.fillStyle = PAL.brass; ctx.fillRect(c.x - 16, c.y - 47, 32, 2);
        [PAL.navy, PAL.burgundy, PAL.archiveGreen].forEach((color, index) => {
          const x = c.x - 9 + index * 9;
          ctx.strokeStyle = PAL.brass; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x,c.y-46); ctx.lineTo(x-4,c.y-40); ctx.lineTo(x+4,c.y-40); ctx.closePath(); ctx.stroke();
          ctx.fillStyle = color; ctx.fillRect(x-4,c.y-39,8,23);
          ctx.fillStyle = PAL.parchment; ctx.fillRect(x-1,c.y-39,2,7);
        });
      }
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
  stove: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.4, -0.3, 1.8, 0.6, 28, PAL.marble);
      const c = p(ox, oy, 0.5, 0);
      ctx.fillStyle = PAL.ink;
      for (const dx of [-25, 2, 25]) {
        ctx.beginPath();
        ctx.ellipse(c.x + dx, c.y - 31, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PAL.brass;
      for (const dx of [-20, -7, 6, 19]) ctx.fillRect(c.x + dx, c.y - 20, 4, 3);
    },
  },
  fridge: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy) {
      box(ctx, ox, oy, -0.34, -0.3, 0.68, 0.6, 58, PAL.marbleDark);
      const c = p(ox, oy, 0, 0.25);
      ctx.strokeStyle = PAL.stoneDark;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x - 18, c.y - 34);
      ctx.lineTo(c.x + 18, c.y - 16);
      ctx.stroke();
      ctx.fillStyle = PAL.stoneDark;
      ctx.fillRect(c.x + 8, c.y - 49, 3, 14);
      ctx.fillRect(c.x + 8, c.y - 31, 3, 11);
    },
  },
  wallclock: {
    w: 1, h: 1, solid: false, noShadow: true,
    draw(ctx, ox, oy, prop, t) {
      ctx.fillStyle = PAL.woodDark;
      ctx.beginPath();
      ctx.arc(ox, oy - 38, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.parchment;
      ctx.beginPath();
      ctx.arc(ox, oy - 38, 10, 0, Math.PI * 2);
      ctx.fill();
      const angle = (t % 60) / 60 * Math.PI * 2 - Math.PI / 2;
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, oy - 38);
      ctx.lineTo(ox + Math.cos(angle) * 7, oy - 38 + Math.sin(angle) * 7);
      ctx.moveTo(ox, oy - 38);
      ctx.lineTo(ox + 2, oy - 44);
      ctx.stroke();
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
