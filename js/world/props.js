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
// The plane of constant u (a box's right face); x runs toward the back wall.
function faceU(ctx,ox,oy,u,v,lift,draw) {
  const at=p(ox,oy,u,v); ctx.save();ctx.transform(1,-.5,0,1,at.x,at.y-lift);draw();ctx.restore();
}
// Wall-mounted art sits on the back wall plane (v = -.5 from a y=1 anchor).
const WALL_V = -.49;
function frame(ctx,x,y,w,h,border,color) {
  ctx.fillStyle=shade(color,-.18);ctx.fillRect(x-border,y-border,w+border*2,h+border*2);
  ctx.fillStyle=color;ctx.fillRect(x-border+.6,y-border+.6,w+border*2-1.2,h+border*2-1.2);
  ctx.fillStyle='#00000040';ctx.fillRect(x,y,w,h);
}
function pin(ctx,x,y,color) {
  ctx.fillStyle='#00000044';ctx.beginPath();ctx.arc(x+.6,y+.8,1.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,1.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffff88';ctx.fillRect(x-.6,y-.7,.6,.6);
}
// Low cabinet with a row of drawer/door fronts on its visible face.
function credenza(ctx,ox,oy,u,v,w,d,z,color,doors=2) {
  box(ctx,ox,oy,u+.04,v+.04,w-.08,d-.08,3,'#2a1e16');
  box(ctx,ox,oy,u,v,w,d,z-5,color,3);
  box(ctx,ox,oy,u-.03,v-.03,w+.06,d+.06,2.5,shade(color,.08),z-2);
  face(ctx,ox,oy,u,v+d,3,()=>{
    const span=w*32,step=span/doors;
    for(let i=0;i<doors;i++){
      ctx.strokeStyle=shade(color,-.3);ctx.lineWidth=.7;ctx.strokeRect(i*step+2,-(z-5)+2.5,step-4,z-10);
      ctx.strokeStyle=shade(color,.18);ctx.lineWidth=.4;ctx.strokeRect(i*step+3.2,-(z-5)+3.7,step-6.4,z-12.4);
      ctx.fillStyle=PAL.brassLight;ctx.fillRect(i*step+step/2-2,-(z-5)/2-1,4,1.2);
    }
  });
}
// Stepped vertical blend; prop art sticks to flat color strings (no gradients).
function bands(ctx,x,y,w,h,top,bottom,steps=6) {
  for(let i=0;i<steps;i++){ctx.fillStyle=shade(top,(i/(steps-1))*(bottom-0));ctx.fillRect(x,y+h*i/steps,w,h/steps+.3);}
}
function glow(ctx,x,y,r,rgb,alpha) {
  for(const k of [1,.7,.45]){ctx.fillStyle=`rgba(${rgb},${alpha*(1.15-k)})`;ctx.beginPath();ctx.arc(x,y,r*k,0,Math.PI*2);ctx.fill();}
}
function bottle(ctx,x,base,color,tall=12) {
  ctx.fillStyle=shade(color,-.15);ctx.fillRect(x,base-tall,4,tall);
  ctx.fillStyle=color;ctx.fillRect(x+.6,base-tall,2.2,tall);
  ctx.fillStyle=shade(color,-.2);ctx.fillRect(x+1.2,base-tall-4,1.6,4.5);
  ctx.fillStyle='#e9dcb8';ctx.fillRect(x+.5,base-tall*.55,3,3);
  ctx.fillStyle='#ffffff40';ctx.fillRect(x+.6,base-tall+1,.6,tall-2);
}
function leaf(ctx,x,y,len,angle,color) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(len/2,0,len/2,len/4.2,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffffff26';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(1,0);ctx.lineTo(len-1,0);ctx.stroke();
  ctx.restore();
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
// `back` turns the screen toward the person seated north of the desk: the
// camera sees the panel's rear instead of the display.
function monitor(ctx,ox,oy,u,v,lift,back=false) {
  const c=p(ox,oy,u,v);
  surface(ctx,ox,oy,u+.1,v+.08,lift,()=>roundRect(ctx,0,0,14,8,1,'#646f73'));
  face(ctx,ox,oy,u,v,lift,()=>{
    roundRect(ctx,11,-12,3,14,1,'#7b898c');
    if(back){
      roundRect(ctx,-4,-37,37,26,2,'#2e3a40');
      roundRect(ctx,6,-31,18,13,1,'#3b474e');
      for(let y=-29;y<-20;y+=2.4)stroke(ctx,[[8,y],[22,y]],'#242d33',.7);
      ctx.fillStyle='#8fa3a8';ctx.beginPath();ctx.arc(14.5,-15.5,1.2,0,Math.PI*2);ctx.fill();
      return;
    }
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
  for(let i=0;i<monitors;i++)monitor(ctx,ox,oy,.25+i*.88,-.16,lift+4,prop.screen==='n');
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

// Bed art shared by the single bed and the queen. `depth` is the footprint depth
// in tiles along v; the headboard spans the full width at the west end.
function drawBed(ctx,ox,oy,{ depth, quilt, panel, pillows, throw: throwColor }) {
  const near=depth-.3, far=-.35;
  for(const [u,v] of [[-.36,far+.05],[1.28,far+.05],[-.36,near-.06],[1.28,near-.06]])box(ctx,ox,oy,u,v,.08,.08,5,'#4f3420');
  box(ctx,ox,oy,-.4,far,1.8,near-far+.05,8,'#66503e',5);           // frame
  box(ctx,ox,oy,-.34,far+.05,1.68,near-far-.05,9,'#e8e1cf',13);     // mattress
  box(ctx,ox,oy,-.4,near,1.8,.06,16,'#5a3b29',5);                   // footboard rail (south edge)
  // quilt over the foot two-thirds, with a turned-down fold near the pillows
  const qv=far+.03, qd=near-far-.08;
  box(ctx,ox,oy,.2,qv,1.18,qd,3,quilt,20);
  box(ctx,ox,oy,.2,near-.05,1.18,.05,10,shade(quilt,-.05),12);
  box(ctx,ox,oy,.2,qv,.14,qd,1,shade(quilt,.12),23);
  surface(ctx,ox,oy,.36,qv,23.5,()=>{const h=qd*32;for(let x=4;x<32;x+=7)stroke(ctx,[[x,1],[x,h-1]],'#ffffff22',.6);for(let y=4;y<h;y+=7)stroke(ctx,[[0,y],[32,y]],'#00000018',.6);});
  if(throwColor)box(ctx,ox,oy,.9,qv+.1,.48,qd-.2,1.5,throwColor,23.5);
  // pillows along the headboard
  const span=near-far-.1, pw=Math.min(.3,(span-.06*(pillows-1))/pillows);
  for(let i=0;i<pillows;i++){const v=far+.05+i*(pw+.06);box(ctx,ox,oy,-.28,v,.38,pw,4,'#d8d0bc',22);box(ctx,ox,oy,-.27,v+.01,.36,pw-.02,1.5,'#f4efe3',25);}
  // headboard: two turned posts with finials and a tall padded panel between them
  for(const v of [far-.05,near-.04]){box(ctx,ox,oy,-.5,v,.1,.1,42,'#5a3b29');const f=p(ox,oy,-.45,v+.05);ball(ctx,f.x,f.y-45,2.4,'#8a6a4a');}
  box(ctx,ox,oy,-.49,far+.05,.07,near-far-.1,34,'#5a3b29',4);
  box(ctx,ox,oy,-.49,far+.02,.08,near-far-.04,2.5,'#7a5a3e',36);     // top rail
  faceU(ctx,ox,oy,-.42,near-.05,6,()=>{
    const w=(near-far-.1)*32;
    roundRect(ctx,1.5,-30,w-3,25,3,panel);
    ctx.strokeStyle='#00000033';ctx.lineWidth=.6;ctx.strokeRect(3,-28.5,w-6,22);
    for(let x=6;x<w-3;x+=6.5)for(const y of [-23,-15]){ctx.fillStyle='#00000040';ctx.beginPath();ctx.arc(x,y,.8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff30';ctx.fillRect(x-.6,y-1.6,1.2,.6);}
    ctx.fillStyle='#ffffff14';ctx.fillRect(2.5,-29,w-5,2);
  });
}

// ---------------------------------------------------------------------------
// Prop registry. w/h = tile footprint, solid = blocks walking.
// `interactLabel` marks clickable resource nodes (main.js wires the actions).
// ---------------------------------------------------------------------------
export const PROPS = {
  scoreboard: {
    w:2,h:1,solid:true,
    draw(ctx,ox,oy,prop) {
      // A framed chalkboard hung on the back wall above a narrow ledge table.
      face(ctx,ox,oy,-.38,WALL_V,0,()=>{
        frame(ctx,2,-74,54,40,2.4,'#8a6a3e');
        bands(ctx,2,-74,54,40,'#24443a',-.06);
        ctx.fillStyle='#ffffff0d';for(const [x,y] of [[8,-66],[34,-48],[44,-62]])ctx.fillRect(x,y,9,1);
        ctx.fillStyle='#e4cf94';ctx.font='bold 5px Georgia';ctx.textAlign='center';ctx.fillText('BILLABLE HOURS',29,-66);
        ctx.font='3.3px Verdana';ctx.fillStyle='#c8b98d';ctx.fillText('HALL OF FAME',29,-61);
        stroke(ctx,[[10,-58.5],[48,-58.5]],'#c8b98d66',.5);ctx.textAlign='left';
        const entries=(prop.entries || []).slice(0,3);
        if (!entries.length) { ctx.font='3px Verdana';ctx.fillStyle='#afc0a3';ctx.fillText('NO COMPLETED RUNS',12,-47); }
        entries.forEach((entry,i)=>{ctx.fillStyle='#e8e3d3';ctx.font='3.4px Verdana';ctx.fillText(`${i+1}  ${entry.name.slice(0,11)}`,6,-52+i*6.5);const minutes=Math.floor(entry.billableMs/60000);ctx.fillText(`${minutes}m`,46,-52+i*6.5);});
        roundRect(ctx,4,-35.4,50,1.6,.5,'#6b5233');roundRect(ctx,12,-36.6,5,1.2,.4,'#ece6d6');
        for(const x of [10,48]){ctx.fillStyle=PAL.brass;ctx.fillRect(x,-77.5,1,3.5);}
      });
      table(ctx,ox,oy,2,.55,'#5a412f',24);
      papers(ctx,ox,oy,.6,-.3,29);
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
      // Brass foot rail on short standoffs along the customer side.
      for (const u of [-.2, 1.1, 2.4, 3.7]) box(ctx, ox, oy, u, .46, .05, .08, 8, PAL.brass);
      box(ctx, ox, oy, -.3, .52, 4.5, .04, 2.5, PAL.brassLight, 7);
      // Tumblers and coasters resting on the bar top.
      for (const [u, tint] of [[.3,'#b8692e'], [1.5,'#e7e3d5'], [2.7,'#8f2c38'], [3.7,'#b8692e']]) {
        surface(ctx,ox,oy,u-.1,.05,37,()=>roundRect(ctx,0,0,8,8,1,'#2c4a3f'));
        const c = p(ox, oy, u, .17);
        ctx.fillStyle = '#d8e2e0aa'; ctx.fillRect(c.x - 3, c.y - 45, 6, 8);
        ctx.fillStyle = tint; ctx.fillRect(c.x - 3, c.y - 41, 6, 4);
        ctx.fillStyle = '#ffffff99'; ctx.fillRect(c.x - 2.4, c.y - 44.5, 1, 6);
        ctx.strokeStyle = '#e9efee'; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(c.x, c.y - 45, 3, 1.2, 0, 0, Math.PI*2); ctx.stroke();
      }
    },
  },
  sidebarback: {
    w: 4, h: 1, solid: true,
    draw(ctx, ox, oy) {
      // Mirrored back bar: base cabinets, two lit shelves and a sign on the wall.
      face(ctx,ox,oy,-.4,WALL_V,0,()=>{
        frame(ctx,0,-74,121,42,2,'#6b4c33');
        bands(ctx,0,-74,121,42,'#4f6d66',-.1);
        for(const x of [18,62,96])stroke(ctx,[[x,-74],[x+14,-32]],'#ffffff18',3);
        // sign
        roundRect(ctx,28,-73,65,10,1,'#192e29');ctx.strokeStyle='#c1a46c';ctx.lineWidth=.8;ctx.strokeRect(28.5,-72.5,64,9);
        ctx.fillStyle='#e4ce98';ctx.font='bold 6.6px Georgia';ctx.textAlign='center';ctx.fillText('THE SIDEBAR',60.5,-66);ctx.textAlign='left';
        // shelves with bottles
        const colors=['#79854b','#8d6251','#b48b43','#3d5a73','#a4472f','#d9c8a0'];
        for(const [base,seed] of [[-50,0],[-35,3]]){
          for(let i=0;i<14;i++)bottle(ctx,4+i*8.3,base,colors[(i+seed)%colors.length],10+((i*5+seed)%4));
          roundRect(ctx,1,base,119,2,0,'#c4a874');ctx.fillStyle='#4a3626';ctx.fillRect(1,base+2,119,1);
          ctx.fillStyle='#f6dc9a22';ctx.fillRect(1,base-14,119,14);
        }
      });
      credenza(ctx,ox,oy,-.4,-.48,3.85,.42,30,'#3b2a20',5);
      surface(ctx,ox,oy,.2,-.44,31,()=>{roundRect(ctx,0,0,10,8,1,'#c9c3b2');roundRect(ctx,1.5,1.5,7,5,1,'#8f8a7b');});
      const s=p(ox,oy,2.6,-.28);ctx.fillStyle='#b9c4c4';ctx.fillRect(s.x-2,s.y-44,4,12);ctx.fillStyle='#7d8a8a';ctx.fillRect(s.x-2,s.y-36,4,1.5);
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
      papers(ctx,ox,oy,-.15,-.1,33);
      // Brass table lamp with a green banker's shade.
      const l = p(ox, oy, .95, -.05);
      ctx.fillStyle = '#7a5d2a'; ctx.beginPath(); ctx.ellipse(l.x, l.y - 33, 5, 2.2, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = PAL.brass; ctx.fillRect(l.x - .8, l.y - 47, 1.6, 14);
      ctx.fillStyle = '#f6dc9a33'; ctx.beginPath(); ctx.ellipse(l.x, l.y - 34, 15, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#2f6a4d'; ctx.beginPath(); ctx.moveTo(l.x - 8, l.y - 44); ctx.lineTo(l.x + 8, l.y - 44); ctx.lineTo(l.x + 5, l.y - 50); ctx.lineTo(l.x - 5, l.y - 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f6dc9a'; ctx.fillRect(l.x - 7, l.y - 44, 14, 1);
      // Two drinks.
      for (const [u, v, tint] of [[.1,.75,'#b8692e'],[.85,.85,'#8f2c38']]) {
        const g = p(ox, oy, u, v); ctx.fillStyle = '#d8e2e0aa'; ctx.fillRect(g.x - 2.5, g.y - 40, 5, 7); ctx.fillStyle = tint; ctx.fillRect(g.x - 2.5, g.y - 37, 5, 4);
      }
      // A folded table-tent card replaces the old floating sign.
      const label = prop.label || 'DISCUSSION';
      face(ctx, ox, oy, -.05, .42, 32, () => {
        ctx.fillStyle = '#00000033'; ctx.fillRect(1, -.5, 42, 1.5);
        roundRect(ctx, 0, -12, 42, 12, 1, '#17392e');
        ctx.fillStyle = shade('#17392e', .12); ctx.fillRect(0, -12, 42, 1.4);
        ctx.strokeStyle = '#c1a46c'; ctx.lineWidth = .5; ctx.strokeRect(1.5, -10.5, 39, 9);
        ctx.fillStyle = '#ead9ac'; ctx.font = `bold ${label.length > 9 ? 4.6 : 5.4}px Verdana`; ctx.textAlign = 'center';
        ctx.fillText(label, 21, -4.2); ctx.textAlign = 'left';
      });
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
  // `facing:'n'` puts the backrest on the camera side so the seat opens toward
  // the back wall (benches facing the judge, chairs facing a desk).
  bench: {
    w:2,h:1,solid:true,
    draw(ctx,ox,oy,prop) {
      const n=prop?.facing==='n';
      for(const u of [-.3,1.2])box(ctx,ox,oy,u,-.12,.12,.5,17,'#594531');
      box(ctx,ox,oy,-.4,-.24,1.85,.62,5,'#94704a',17);
      for(const z of [24,34])box(ctx,ox,oy,-.4,n?.26:-.29,1.85,.12,8,'#a07b52',z);
      for(const u of [-.39,1.34])box(ctx,ox,oy,u,n?.24:-.3,.1,.15,43,'#6b4c34');
      face(ctx,ox,oy,-.38,n?.38:-.17,0,()=>{for(const y of [-27,-37])stroke(ctx,[[2,y],[55,y]],'#dfc18a44',.7);});
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
    w: 4, h: 1, solid: true, noShadow: true,
    draw(ctx, ox, oy, prop) {
      const styles = {
        office: { wall: PAL.wood, trim: PAL.navy, sign: 'LAW OFFICE' },
        court: { wall: PAL.marble, trim: PAL.navy, sign: 'COURTHOUSE' },
        library: { wall: PAL.archiveGreen, trim: PAL.brass, sign: 'LAW LIBRARY' },
        apartment: { wall: PAL.burgundy, trim: PAL.parchment, sign: 'APARTMENTS' },
        sidebar: { wall: '#3a2f2a', trim: PAL.brass, sign: 'THE SIDEBAR' },
      };
      const s = styles[prop.style] || styles.office;
      box(ctx, ox, oy, -0.5, -0.5, 4, 1, 74, s.wall);
      // Upper-floor windows, lit, on the street-facing wall.
      face(ctx, ox, oy, -0.5, 0.5, 0, () => {
        for (let i = 0; i < 4; i++) { if (prop.style === 'court' && (i === 0 || i === 3)) continue; ctx.fillStyle = '#e9d58a'; ctx.fillRect(8 + i * 30, -66, 12, 10); ctx.fillStyle = '#00000033'; ctx.fillRect(8 + i * 30, -61, 12, 1); ctx.fillRect(13.5 + i * 30, -66, 1, 10); }
      });
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
  // Beds. The head is the west (u = -.4) end. `bed` is the starter single;
  // `bigbed` is the 2×2 queen the Better Mattress upgrade swaps in.
  bed: {
    w:2,h:1,solid:true,
    draw(ctx,ox,oy) { drawBed(ctx,ox,oy,{ depth:.7, quilt:'#888979', panel:'#6b5a4a', pillows:2 }); },
  },
  bigbed: {
    w:2,h:2,solid:true,
    draw(ctx,ox,oy) { drawBed(ctx,ox,oy,{ depth:1.7, quilt:'#3d5870', panel:'#2f4459', pillows:3, throw:'#b8912f' }); },
  },
  caseboard: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      // Cork board mounted on the back wall over a low file credenza.
      face(ctx, ox, oy, -.36, WALL_V, 0, () => {
        frame(ctx, 2, -72, 52, 32, 2.4, '#7a5534');
        ctx.fillStyle = '#b98d58'; ctx.fillRect(2, -72, 52, 32);
        for (let i = 0; i < 90; i++) { ctx.fillStyle = i % 2 ? '#a57b4b' : '#c99d67'; ctx.fillRect(2 + (i * 37) % 51, -72 + (i * 23) % 31, .9, .9); }
        const notes = [[6,-68,11,13,'#f3e9d2',-.06],[21,-64,12,10,'#e9e2b7',.05],[36,-69,12,14,'#f3e9d2',.04],[9,-52,10,10,'#d6e3dc',.07],[40,-52,11,9,'#ecd0c4',-.05],[24,-51,10,8,'#f3e9d2',0]];
        for (const [x,y,w,h,color,a] of notes) {
          ctx.save(); ctx.translate(x + w/2, y + h/2); ctx.rotate(a);
          ctx.fillStyle = '#00000030'; ctx.fillRect(-w/2 + .8, -h/2 + .8, w, h);
          ctx.fillStyle = color; ctx.fillRect(-w/2, -h/2, w, h);
          ctx.fillStyle = '#7d7a72'; for (let ly = -h/2 + 3; ly < h/2 - 1; ly += 2) ctx.fillRect(-w/2 + 1.5, ly, w - 4 - (ly % 3), .4);
          ctx.restore();
        }
        stroke(ctx, [[11.5,-67],[27,-63],[42,-68],[45,-51],[29,-50],[14,-51],[11.5,-67]], '#a12b33', .55);
        for (const [x,y,c] of [[11.5,-67,'#c0392b'],[27,-63,'#2c5085'],[42,-68,'#c0392b'],[45,-51,'#b8912f'],[29,-50,'#c0392b'],[14,-51,'#2c5085']]) pin(ctx, x, y, c);
      });
      credenza(ctx, ox, oy, -.4, -.45, 1.85, .45, 26, '#6e4e36', 3);
      papers(ctx, ox, oy, -.2, -.4, 27);
      const b = p(ox, oy, 1.05, -.25); // banker's box
      box(ctx, ox, oy, .85, -.42, .36, .3, 9, '#c9b48c', 26);
      ctx.fillStyle = '#6e5b3e'; ctx.fillRect(b.x - 4, b.y - 31, 6, 1.4);
    },
  },
  bookshelf: {
    w: 2, h: 1, solid: true,
    draw(ctx,ox,oy,prop) {
      const full=typeof prop.full==='function'?prop.full():true;
      // The face is 1.8 tiles (57.6 px) wide: a centred upright splits it into
      // two bays and books are laid out per bay so they never cross an upright.
      const W=57.6, label=prop.label||'ETHICS TREATISES';
      box(ctx,ox,oy,-.4,-.22,1.8,.44,72,'#71503a',4);
      face(ctx,ox,oy,-.4,.22,4,()=>{
        ctx.fillStyle='#312c25';ctx.fillRect(1.5,-68,W-3,65);
        for(const x of [0,W/2-1,W-2]){ctx.fillStyle='#a78154';ctx.fillRect(x,-68,2,65);}
        const bays=[[2.5,W/2-1],[W/2+1,W-2.5]];
        for(let row=0;row<3;row++) {
          const base=-5-row*21, perBay=full?5:row===0?2:0;
          bays.forEach(([left],bay)=>{
            for(let i=0;i<perBay;i++) {
              const n=bay*5+i, x=left+i*4.6, height=13+(n*7+row)%5;
              ctx.fillStyle=['#703e3d','#283e51','#485943','#9a7846'][(n+row)%4];ctx.fillRect(x,base-height,3.5,height);
              ctx.fillStyle='#ddc385';ctx.fillRect(x+.3,base-height+2,2.9,.7);ctx.fillRect(x+.3,base-2,2.9,.7);
              ctx.fillStyle='#ddcda1';ctx.fillRect(x+.8,base-height+5,1.8,3);
              ctx.fillStyle='#ffffff12';ctx.fillRect(x+.3,base-height,.5,height);
            }
          });
          ctx.fillStyle='#a37d51';ctx.fillRect(0,base,W,2);ctx.fillStyle='#483524';ctx.fillRect(0,base+2,W,1);
        }
        ctx.fillStyle='#ccb474';ctx.fillRect(W/2-17,-74,34,5);ctx.fillStyle='#302f27';ctx.font='3.4px Verdana';ctx.textAlign='center';ctx.fillText(label,W/2,-70.5);ctx.textAlign='start';
      });
      box(ctx,ox,oy,-.46,-.27,1.92,.54,4,'#93734b',76);
      box(ctx,ox,oy,-.44,-.26,1.88,.52,5,'#71503a');
    },
  },
  clientchair: {
    w:1,h:1,solid:true,
    draw(ctx,ox,oy,prop) {
      const n=prop?.facing==='n';
      for(const u of [-.25,.22])for(const v of [-.22,.24])box(ctx,ox,oy,u,v,.09,.09,16,'#503e31');
      box(ctx,ox,oy,-.3,-.28,.65,.65,7,'#6f4146',16);
      box(ctx,ox,oy,-.3,n?.21:-.33,.65,.12,28,'#63383f',21);
      if(n) face(ctx,ox,oy,-.25,.33,21,()=>{roundRect(ctx,0,-25,17,21,3,shade('#63383f',-.08));stroke(ctx,[[2,-14],[15,-14]],'#ae818133',.5);});
      else face(ctx,ox,oy,-.25,-.2,21,()=>{roundRect(ctx,0,-25,17,21,3,'#81565a');ctx.strokeStyle='#ae818166';ctx.lineWidth=.5;ctx.strokeRect(2,-23,13,17);});
      for(const u of [-.34,.3])box(ctx,ox,oy,u,-.05,.09,.42,3,'#8b6647',28);
    },
  },
  // `broken:()=>bool` draws Liz's pre-upgrade chair: a missing caster, a sagging
  // seat and a backrest that leans and is held together with tape.
  officechair: {
    w:1,h:1,solid:true,
    draw(ctx,ox,oy,prop) {
      const n=prop?.facing==='n', broken=typeof prop?.broken==='function'?prop.broken():false;
      const sag=broken?5:0, cushion=broken?'#3e4e4f':'#43595b';
      const c=p(ox,oy,0,0);ctx.strokeStyle='#88958f';ctx.lineWidth=2;
      for(let i=0;i<(broken?4:5);i++){const a=i*Math.PI*2/5;const x=c.x+Math.cos(a)*15,y=c.y+Math.sin(a)*6;stroke(ctx,[[c.x,c.y-6],[x,y]],'#87928b',2);roundRect(ctx,x-2,y-1,4,3,1,'#202b30');}
      if(broken){const l=p(ox,oy,.38,.35);roundRect(ctx,l.x-2,l.y-1,4,3,1,'#202b30');stroke(ctx,[[l.x-3,l.y+2],[l.x+4,l.y+1]],'#87928b',1.2);}
      box(ctx,ox,oy,-.05,-.05,.1,.1,20-sag,'#87948f');
      box(ctx,ox,oy,-.3,-.25,.65,.62,7,'#344a4c',19-sag);
      if(broken){ctx.save();ctx.translate(c.x,c.y);ctx.transform(1,0,-.2,1,0,0);ctx.translate(-c.x,-c.y);}
      box(ctx,ox,oy,-.3,n?.2:-.34,.65,.14,30,'#283c41',26-sag);
      if(n) face(ctx,ox,oy,-.26,.34,26-sag,()=>{roundRect(ctx,0,-27,17,25,4,shade(cushion,-.12));stroke(ctx,[[2,-15],[15,-15]],'#728b8233',.6);if(broken)roundRect(ctx,3,-18,11,2,.5,'#b8a37a');});
      else face(ctx,ox,oy,-.26,-.2,26-sag,()=>{roundRect(ctx,0,-27,17,25,4,cushion);for(let y=-24;y<-4;y+=3)stroke(ctx,[[2,y],[15,y]],'#728b8244',.6);if(broken)roundRect(ctx,3,-18,11,2,.5,'#b8a37a');});
      if(broken)ctx.restore();
      for(const u of [-.34,.3]){box(ctx,ox,oy,u,.03,.07,.12,14,'#7a8983',16-sag);box(ctx,ox,oy,u-.02,-.07,.13,.45,3,'#263a3e',30-sag);}
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
      for (const [u, v] of [[-.34,.22],[.26,.22],[-.34,-.3],[.26,-.3]]) box(ctx, ox, oy, u, v, .08, .08, 4, '#1b1e23');
      box(ctx, ox, oy, -.38, -.34, .76, .68, 46, '#3a4048', 4);
      box(ctx, ox, oy, -.4, -.36, .8, .72, 3, '#4a515a', 50);
      face(ctx, ox, oy, -.38, .34, 4, () => {
        roundRect(ctx, 2.5, -42, 19.5, 38, 1.5, '#2b3037');
        ctx.strokeStyle = '#555e68'; ctx.lineWidth = .7; ctx.strokeRect(3.3, -41.2, 17.9, 36.4);
        for (const y of [-36, -12]) roundRect(ctx, 1.4, y, 2, 5, .5, '#8b929a'); // hinges
        // combination dial
        ctx.fillStyle = '#20242a'; ctx.beginPath(); ctx.arc(11, -27, 5.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = PAL.brass; ctx.beginPath(); ctx.arc(11, -27, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = PAL.brassLight; ctx.beginPath(); ctx.arc(10.4, -27.6, 2.4, 0, Math.PI*2); ctx.fill();
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.fillStyle = '#3d3320'; ctx.fillRect(11 + Math.cos(a) * 3.3 - .2, -27 + Math.sin(a) * 3.3 - .2, .5, .5); }
        // three-spoke handle
        for (let i = 0; i < 3; i++) { const a = i * 2.09 + .4; stroke(ctx, [[11, -15], [11 + Math.cos(a) * 4, -15 + Math.sin(a) * 4]], '#c9ccd0', 1); }
        ctx.fillStyle = '#9aa1a8'; ctx.beginPath(); ctx.arc(11, -15, 1.2, 0, Math.PI*2); ctx.fill();
        roundRect(ctx, 5, -39.5, 12, 4, .5, PAL.brass);
        ctx.fillStyle = '#2b2b33'; ctx.font = 'bold 2.6px Verdana'; ctx.textAlign = 'center';
        ctx.fillText(empty ? 'EMPTY' : 'CLIENT', 11, -36.6); ctx.textAlign = 'left';
      });
      if (!empty) {
        // Coin stacks on top of the safe, not floating in front of it.
        for (const [u, v, n] of [[-.15,-.1,5],[.08,-.18,3],[.02,.08,4]]) {
          const c = p(ox, oy, u, v);
          for (let i = 0; i < n; i++) {
            ctx.fillStyle = shade(PAL.brass, -.1); ctx.beginPath(); ctx.ellipse(c.x, c.y - 54 - i * 1.6, 4, 1.8, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = PAL.brassLight; ctx.beginPath(); ctx.ellipse(c.x, c.y - 54.6 - i * 1.6, 4, 1.8, 0, 0, Math.PI*2); ctx.fill();
          }
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
      // Brass frame on wheels with two wooden trays.
      for (const [u, v] of [[-.32,-.28],[.27,-.28],[-.32,.25],[.27,.25]]) {
        const w = p(ox, oy, u + .025, v + .025);
        ctx.fillStyle = '#1d1b1f'; ctx.beginPath(); ctx.ellipse(w.x, w.y - 2, 2.6, 2.6, 0, 0, Math.PI*2); ctx.fill();
        box(ctx, ox, oy, u, v, .05, .05, 36, PAL.brass, 3);
      }
      box(ctx, ox, oy, -.34, -.3, .68, .6, 3, PAL.woodDark, 10);
      box(ctx, ox, oy, -.36, -.32, .72, .64, 3, '#6b4529', 30);
      surface(ctx, ox, oy, -.32, -.28, 33.5, () => { ctx.strokeStyle = PAL.brassLight; ctx.lineWidth = .7; ctx.strokeRect(0, 0, 21, 18); });
      box(ctx, ox, oy, .3, -.3, .04, .6, 2, PAL.brassLight, 40); // handle
      // lower shelf bottles
      for (const [u, color] of [[-.15,'#3d5a73'],[.1,'#79854b']]) { const b = p(ox, oy, u, .1); ctx.fillStyle = color; ctx.fillRect(b.x - 2, b.y - 24, 4, 11); ctx.fillRect(b.x - 1, b.y - 27, 2, 3); }
      // decanter + glasses on top
      const c = p(ox, oy, -.08, -.05);
      ctx.fillStyle = '#d8e2e0bb'; ctx.beginPath(); ctx.moveTo(c.x - 6, c.y - 34); ctx.lineTo(c.x + 6, c.y - 34); ctx.lineTo(c.x + 5, c.y - 46); ctx.lineTo(c.x - 5, c.y - 46); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a4d2e'; ctx.fillRect(c.x - 5.4, c.y - 42, 10.8, 7.5);
      ctx.fillStyle = '#d8e2e0'; ctx.fillRect(c.x - 1.5, c.y - 50, 3, 4); ctx.beginPath(); ctx.arc(c.x, c.y - 52, 2.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff99'; ctx.fillRect(c.x - 4, c.y - 45, 1, 9);
      for (const [u, v] of [[.15,.12],[.2,-.15]]) { const g = p(ox, oy, u, v); ctx.fillStyle = '#d8e2e0aa'; ctx.fillRect(g.x - 2.5, g.y - 40, 5, 6); ctx.fillStyle = '#b06c39'; ctx.fillRect(g.x - 2.5, g.y - 37, 5, 3); }
    },
  },
  paralegaldesk: { w: 2, h: 1, solid: true, draw(ctx,ox,oy) { workstation(ctx,ox,oy); } },
  // Associates' Floor open desk: a plain workstation with a brass nameplate
  // once a player has claimed it (prop.occupant is set by main.js).
  opendesk: { w: 2, h: 1, solid: true, draw(ctx,ox,oy,prop) {
    workstation(ctx,ox,oy,prop);
    face(ctx,ox,oy,.8,.39,37,()=>{
      roundRect(ctx,0,-4,26,5,1,prop.occupant?'#b69b58':'#8a7d63');
      ctx.fillStyle='#423d32';ctx.font='4px Verdana';
      ctx.fillText(String(prop.occupant||prop.deskId||'OPEN').toUpperCase().slice(0,10),3,0);
    });
  } },
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
      // Wall-mounted display over a media credenza.
      box(ctx, ox, oy, -.32, -.5, 1.65, .05, 34, '#16191e', 36);
      face(ctx, ox, oy, -.32, -.45, 0, () => {
        roundRect(ctx, 1.5, -68, 49.8, 30, 1, '#0c1824');
        bands(ctx, 1.5, -68, 49.8, 30, '#1f4766', -.07);
        ctx.fillStyle = PAL.parchment; ctx.font = 'bold 3.8px Verdana'; ctx.fillText('CASE STRATEGY', 4, -63);
        const bars = [10, 15, 12, 19, 23];
        bars.forEach((h, i) => { ctx.fillStyle = i === 4 ? PAL.brassLight : '#6ea9c8'; ctx.fillRect(5 + i * 5, -41 - h * (.9 + Math.sin(t + i) * .02), 3.2, h * (.9 + Math.sin(t + i) * .02)); });
        stroke(ctx, [[5,-41],[30,-41]], '#9fc3d6', .5);
        for (let y = -57; y < -42; y += 3.5) { ctx.fillStyle = '#9fc3d6aa'; ctx.fillRect(33, y, 15 - (y % 2) * 3, 1.1); }
        ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.sin(t) * 0.02})`; ctx.beginPath(); ctx.moveTo(30, -68); ctx.lineTo(51, -68); ctx.lineTo(51, -54); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#90d4b2'; ctx.fillRect(47, -39.3, 1.5, .8);
      });
      credenza(ctx, ox, oy, -.38, -.45, 1.8, .42, 22, '#5d4232', 3);
      const s = p(ox, oy, 1.1, -.25); roundRect(ctx, s.x - 6, s.y - 26, 12, 4, 1, '#1d2329'); ctx.fillStyle = '#7fb8a6'; ctx.fillRect(s.x - 1, s.y - 24.8, 2, .8);
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
  coffeemachine: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop, t) {
      credenza(ctx, ox, oy, -.32, -.3, .64, .6, 28, '#7a5a3f', 1);
      const owned = typeof prop.owned === 'function' ? prop.owned() : true;
      const c = p(ox, oy, 0, 0);
      if (owned) {
        // Espresso machine: steel body, portafilter, cup and drip tray.
        box(ctx, ox, oy, -.2, -.22, .36, .4, 20, '#8c949b', 29);
        box(ctx, ox, oy, -.21, -.23, .38, .42, 2, '#c1c7cc', 49);
        face(ctx, ox, oy, -.2, .18, 29, () => {
          roundRect(ctx, 1.5, -18, 8.5, 6, .8, '#2a2f35'); ctx.fillStyle = '#7fd0a0'; ctx.fillRect(3, -16.5, 2, 1); ctx.fillStyle = '#e6a64a'; ctx.fillRect(6, -16.5, 2, 1);
          roundRect(ctx, 3, -11, 6, 2, .6, '#1e2328'); stroke(ctx, [[9, -10], [13, -9]], '#1e2328', 1.3);
          roundRect(ctx, 1, -2.5, 10, 2, .4, '#3a3f45');
          ctx.fillStyle = '#f1ece0'; ctx.fillRect(4, -6.5, 4, 4); ctx.fillStyle = '#6b4529'; ctx.fillRect(4.3, -6.2, 3.4, 1);
        });
        ctx.fillStyle = `rgba(243,233,210,${0.28 + Math.sin(t * 3) * 0.12})`;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(c.x - 2 + Math.sin(t * 2 + i) * 2, c.y - 40 - i * 5 - (t * 6 % 5), 2.2 - i * .4, 0, Math.PI * 2); ctx.fill(); }
      } else {
        // Before the upgrade: a kettle and a jar of instant coffee.
        ctx.fillStyle = '#5b6168'; ctx.beginPath(); ctx.ellipse(c.x - 4, c.y - 34, 6, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#7c838b'; ctx.beginPath(); ctx.ellipse(c.x - 5.5, c.y - 35.5, 3, 3, 0, 0, Math.PI*2); ctx.fill();
        stroke(ctx, [[c.x - 9, c.y - 37], [c.x - 4, c.y - 43], [c.x + 1, c.y - 37]], '#2b2b33', 1.2);
        ctx.fillStyle = '#e8dcc0'; ctx.fillRect(c.x + 5, c.y - 37, 6, 8); ctx.fillStyle = '#6b4529'; ctx.fillRect(c.x + 5, c.y - 39, 6, 2); ctx.fillStyle = '#b8912f'; ctx.fillRect(c.x + 5, c.y - 34, 6, 2);
      }
    },
  },
  wardrobe: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      const expanded = prop.expanded?.();
      box(ctx, ox, oy, -.33, -.28, .66, .56, 4, '#4f3420');
      box(ctx, ox, oy, -.35, -.3, .7, .6, 52, PAL.wood, 4);
      box(ctx, ox, oy, -.38, -.33, .76, .66, 4, PAL.woodLight, 56);
      face(ctx, ox, oy, -.35, .3, 4, () => {
        if (expanded) {
          // Doors stand open on a rail of tailored suits.
          ctx.fillStyle = '#2a1d14'; ctx.fillRect(1.5, -50, 19.4, 46);
          ctx.fillStyle = PAL.brass; ctx.fillRect(1.5, -46, 19.4, 1.2);
          [PAL.navy, PAL.burgundy, PAL.archiveGreen, '#3a3a42'].forEach((color, i) => {
            const x = 3.4 + i * 4.4;
            stroke(ctx, [[x + 1.6, -45], [x + 1.6, -43]], PAL.brassLight, .5);
            stroke(ctx, [[x - .4, -41], [x + 1.6, -43], [x + 3.6, -41]], PAL.brassLight, .5);
            ctx.fillStyle = color; ctx.fillRect(x - .4, -41, 4, 24);
            ctx.fillStyle = PAL.parchment; ctx.fillRect(x + 1, -41, 1.2, 6);
          });
          ctx.fillStyle = '#5a3c26'; ctx.fillRect(2, -12, 18.4, 7);
        } else {
          for (const x of [1.5, 11.6]) {
            ctx.strokeStyle = PAL.woodDark; ctx.lineWidth = .8; ctx.strokeRect(x, -50, 9.3, 46);
            ctx.strokeStyle = shade(PAL.wood, .16); ctx.lineWidth = .5; ctx.strokeRect(x + 1.6, -47, 6.1, 18); ctx.strokeRect(x + 1.6, -26, 6.1, 18);
          }
          ctx.fillStyle = PAL.brassLight; ctx.fillRect(9, -30, 1.2, 4); ctx.fillRect(12.6, -30, 1.2, 4);
        }
      });
    },
  },
  kitchenette: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      const nice = typeof prop.nice === 'function' ? prop.nice() : false;
      credenza(ctx, ox, oy, -.4, -.3, 1.8, .6, 28, '#7d8a86', 3);
      box(ctx, ox, oy, -.43, -.33, 1.86, .66, 3, nice ? PAL.marble : '#c9c3b2', 26);
      // microwave
      box(ctx, ox, oy, .6, -.26, .62, .4, 15, '#d6d4cc', 29);
      face(ctx, ox, oy, .6, .14, 29, () => { roundRect(ctx, 1.5, -13, 13, 10, 1, '#1d2729'); roundRect(ctx, 16, -13, 3.5, 10, .5, '#8e938e'); ctx.fillStyle = '#7fd0a0'; ctx.fillRect(16.6, -12, 2.2, 1); });
      // ramen cup with chopsticks
      const r = p(ox, oy, -.05, .02);
      ctx.fillStyle = '#e7e0cf'; ctx.beginPath(); ctx.moveTo(r.x - 5, r.y - 39); ctx.lineTo(r.x + 5, r.y - 39); ctx.lineTo(r.x + 4, r.y - 30); ctx.lineTo(r.x - 4, r.y - 30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b23a2e'; ctx.fillRect(r.x - 4.6, r.y - 36, 9.2, 2.4);
      ctx.fillStyle = '#d9b656'; ctx.beginPath(); ctx.ellipse(r.x, r.y - 39, 5, 1.8, 0, 0, Math.PI*2); ctx.fill();
      stroke(ctx, [[r.x - 1, r.y - 39], [r.x + 6, r.y - 48]], '#a97a52', .9); stroke(ctx, [[r.x + 1, r.y - 39], [r.x + 8, r.y - 47]], '#a97a52', .9);
      if (nice) { ctx.fillStyle = PAL.brass; ctx.fillRect(r.x + 20, r.y - 36, 4, 8); }
    },
  },
  stove: {
    w: 2, h: 1, solid: true,
    draw(ctx, ox, oy) {
      // Counter run with an inset range, oven door and a simmering pot.
      credenza(ctx, ox, oy, -.4, -.3, 1.8, .6, 30, '#6f7f7c', 3);
      box(ctx, ox, oy, -.43, -.33, 1.86, .66, 3, PAL.marble, 28);
      box(ctx, ox, oy, .45, -.28, .75, .58, 28, '#d9d6cd', 3);
      box(ctx, ox, oy, .44, -.29, .77, .6, 1.5, '#2b2b33', 30);
      face(ctx, ox, oy, .45, .3, 3, () => {
        roundRect(ctx, 2, -21, 20, 13, 1, '#2b2b33'); roundRect(ctx, 4, -19, 16, 9, 1, '#3e4a50');
        ctx.fillStyle = '#e6a64a33'; ctx.fillRect(4, -14, 16, 4);
        roundRect(ctx, 4, -23.5, 16, 1.2, .5, '#9aa0a4');
        for (const x of [4, 9, 14, 19]) { ctx.fillStyle = '#4b5155'; ctx.beginPath(); ctx.arc(x, -26, 1.1, 0, Math.PI*2); ctx.fill(); }
      });
      surface(ctx, ox, oy, .5, -.24, 31.5, () => {
        for (const [x, y] of [[5, 4], [16, 4], [5, 13], [16, 13]]) { ctx.strokeStyle = '#555d63'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI*2); ctx.stroke(); ctx.strokeStyle = '#7b8389'; ctx.lineWidth = .5; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.stroke(); }
      });
      const pot = p(ox, oy, .67, -.15);
      ctx.fillStyle = '#9aa3a8'; ctx.fillRect(pot.x - 6, pot.y - 41, 12, 8);
      ctx.fillStyle = '#c4cbcf'; ctx.beginPath(); ctx.ellipse(pot.x, pot.y - 41, 6, 2.4, 0, 0, Math.PI*2); ctx.fill();
      stroke(ctx, [[pot.x + 6, pot.y - 39], [pot.x + 11, pot.y - 40]], '#2b2b33', 1.4);
      // cutting board with greens on the prep counter
      surface(ctx, ox, oy, -.3, -.2, 31.5, () => { roundRect(ctx, 0, 0, 16, 11, 1.5, '#b88a58'); for (const [x, y] of [[4,4],[7,6],[10,3],[11,7]]) { ctx.fillStyle = '#5f8d4e'; ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI*2); ctx.fill(); } });
    },
  },
  // `stocked:()=>true` draws the office snack fridge: the door is propped open
  // on a shelf of fruit, yoghurt and a sandwich.
  fridge: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop) {
      const stocked = typeof prop?.stocked === 'function' ? prop.stocked() : false;
      box(ctx, ox, oy, -.32, -.28, .64, .56, 3, '#3a3d40');
      box(ctx, ox, oy, -.34, -.3, .68, .6, 56, '#dcdad3', 3);
      face(ctx, ox, oy, -.34, .3, 3, () => {
        stroke(ctx, [[1, -37], [20.8, -37]], '#9a958c', .9);
        stroke(ctx, [[1, -37.8], [20.8, -37.8]], '#ffffffaa', .5);
        roundRect(ctx, 17, -52, 1.6, 11, .8, '#8f8a80'); roundRect(ctx, 17, -34, 1.6, 15, .8, '#8f8a80');
        if (stocked) {
          // Open lower door: a lit interior with two shelves of snacks.
          ctx.fillStyle = '#eef3f2'; ctx.fillRect(1, -35, 15.5, 31);
          ctx.fillStyle = '#c9d2cf'; ctx.fillRect(1, -21, 15.5, 1); ctx.fillRect(1, -9, 15.5, 1);
          ctx.fillStyle = '#d64545'; ctx.beginPath(); ctx.arc(4, -24, 2.2, 0, Math.PI * 2); ctx.fill(); // apple
          ctx.fillStyle = '#e8b63c'; ctx.beginPath(); ctx.ellipse(9, -24, 3, 1.6, -.5, 0, Math.PI * 2); ctx.fill(); // banana
          ctx.fillStyle = '#f4efe3'; ctx.fillRect(12, -27, 3.5, 5); ctx.fillStyle = '#6e2436'; ctx.fillRect(12, -27, 3.5, 1.4); // yoghurt
          ctx.fillStyle = '#e9d2a2'; ctx.fillRect(2.5, -14, 7, 4); ctx.fillStyle = '#3f5d4b'; ctx.fillRect(2.5, -12.6, 7, 1); // sandwich
          ctx.fillStyle = '#5b87a6'; ctx.fillRect(11, -16, 4, 6); ctx.fillStyle = '#ffffff66'; ctx.fillRect(11.6, -15, 1, 4); // juice
          ctx.fillStyle = '#ffffff55'; ctx.fillRect(1, -35, 15.5, 2);
        } else {
          // a magnet-held note and a postcard
          ctx.fillStyle = '#f3e9d2'; ctx.fillRect(4, -30, 7, 8); pin(ctx, 7.5, -29.5, '#c0392b');
          ctx.fillStyle = '#5b87a6'; ctx.fillRect(6, -48, 6, 4.5); pin(ctx, 9, -48, '#b8912f');
        }
        ctx.fillStyle = '#ffffff22'; ctx.fillRect(1.5, -55, 2, 52);
      });
      if (stocked) {
        // The open door, swung toward the camera, with a sticky note on it.
        box(ctx, ox, oy, .3, .3, .36, .06, 32, '#d3d1ca', 3);
        face(ctx, ox, oy, .3, .36, 3, () => { ctx.fillStyle = '#f6e27a'; ctx.fillRect(2, -24, 6, 6); ctx.fillStyle = '#8b7a3a'; ctx.fillRect(3, -22, 4, .7); ctx.fillRect(3, -20, 3, .7); });
      }
    },
  },
  wallclock: {
    w: 1, h: 1, solid: false, noShadow: true,
    draw(ctx, ox, oy, prop, t) {
      // Drawn on the wall plane so the face foreshortens with the wall.
      face(ctx, ox, oy, 0, .5, 0, () => {
        const cx = -4, cy = -46;
        ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.arc(cx + 1, cy + 1.5, 10.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = PAL.woodDark; ctx.beginPath(); ctx.arc(cx, cy, 10.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = PAL.brass; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = PAL.parchment; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.fillStyle = PAL.ink; ctx.fillRect(cx + Math.cos(a) * 6.5 - .4, cy + Math.sin(a) * 6.5 - .4, i % 3 ? .7 : 1.2, i % 3 ? .7 : 1.2); }
        const sec = (t % 60) / 60 * Math.PI * 2 - Math.PI / 2;
        stroke(ctx, [[cx, cy], [cx + 1.5, cy - 4.5]], PAL.ink, 1.2);
        stroke(ctx, [[cx, cy], [cx + 4, cy + 3]], PAL.ink, .9);
        stroke(ctx, [[cx, cy], [cx + Math.cos(sec) * 6.5, cy + Math.sin(sec) * 6.5]], '#a12b33', .5);
        ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(cx, cy, .8, 0, Math.PI * 2); ctx.fill();
      });
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
    draw(ctx, ox, oy, prop) {
      // Terracotta planter with a leafy fiddle-leaf fig.
      const c = p(ox, oy, 0, 0);
      ctx.fillStyle = '#9b5132'; ctx.beginPath();
      ctx.moveTo(c.x - 9, c.y - 15); ctx.lineTo(c.x + 9, c.y - 15); ctx.lineTo(c.x + 7, c.y); ctx.lineTo(c.x - 7, c.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b8653f'; ctx.beginPath(); ctx.moveTo(c.x - 9, c.y - 15); ctx.lineTo(c.x, c.y - 15); ctx.lineTo(c.x, c.y); ctx.lineTo(c.x - 7, c.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7e3f26'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 7, 2.6, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#c87650'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 15, 10, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3b2a1f'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 15, 8, 3, 0, 0, Math.PI*2); ctx.fill();
      stroke(ctx, [[c.x, c.y - 15], [c.x + 1, c.y - 30], [c.x - 1, c.y - 44]], '#5a4430', 1.4);
      const seed = (prop.x * 7 + prop.y * 3) % 5;
      const leaves = [[-3,-22,13,-2.6],[2,-24,12,-.5],[-2,-30,12,-2.4],[1,-32,13,-.7],[-1,-38,11,-2.2],[0,-41,11,-1],[-1,-45,9,-1.7],[-4,-27,10,-3],[3,-28,10,-.2]];
      leaves.forEach(([x, y, len, a], i) => leaf(ctx, c.x + x, c.y + y, len, a + (seed - 2) * .05, ['#3f6b47','#4f7f55','#335c3c'][(i + seed) % 3]));
    },
  },
  floorlamp: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop, t) {
      const c = p(ox, oy, 0, 0);
      const light = .32 + Math.sin(t * 1.3 + prop.x) * .03;
      glow(ctx, c.x, c.y - 56, 34, '246,220,154', light);
      ctx.fillStyle = '#2b2b33'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 1, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PAL.brass; ctx.beginPath(); ctx.ellipse(c.x, c.y - 2.5, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(PAL.brass, -.1); ctx.fillRect(c.x - 1, c.y - 52, 2, 50);
      ctx.fillStyle = '#e9d9b0'; ctx.beginPath(); ctx.moveTo(c.x - 7, c.y - 66); ctx.lineTo(c.x + 7, c.y - 66); ctx.lineTo(c.x + 11, c.y - 50); ctx.lineTo(c.x - 11, c.y - 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d4c191'; ctx.beginPath(); ctx.moveTo(c.x, c.y - 66); ctx.lineTo(c.x + 7, c.y - 66); ctx.lineTo(c.x + 11, c.y - 50); ctx.lineTo(c.x, c.y - 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3cf'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 50, 11, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    },
  },
  arcade: {
    w: 1, h: 1, solid: true,
    draw(ctx, ox, oy, prop, t) {
      // Upright cabinet facing the room: base, slanted control deck, screen and lit marquee.
      const body = '#3a1d27', side = '#6e2436';
      const c = p(ox, oy, 0, .2);
      for (const k of [1, .65]) { ctx.fillStyle = `rgba(120,220,180,${(.08 + Math.sin(t * 4) * .015) * (1.4 - k)})`; ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 30 * k, 14 * k, 0, 0, Math.PI * 2); ctx.fill(); }
      box(ctx, ox, oy, -.3, -.4, .6, .66, 40, body);
      box(ctx, ox, oy, -.3, .26, .6, .12, 6, '#24141a', 36); // control deck lip
      box(ctx, ox, oy, -.3, -.4, .6, .5, 42, body, 40);
      box(ctx, ox, oy, -.32, -.42, .64, .62, 3, '#1b0f14', 82);
      // side art
      faceU(ctx, ox, oy, .3, .26, 0, () => {
        ctx.fillStyle = side; ctx.fillRect(1, -40, 19, 38);
        for (const [y, col] of [[-30, PAL.brass], [-24, '#d9b656'], [-18, '#3f8f6b']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(1, y); ctx.lineTo(20, y - 8); ctx.lineTo(20, y - 6); ctx.lineTo(1, y + 2); ctx.closePath(); ctx.fill(); }
      });
      faceU(ctx, ox, oy, .3, .1, 40, () => { ctx.fillStyle = side; ctx.fillRect(1, -40, 14, 38); ctx.fillStyle = '#5fbf95'; ctx.fillRect(4, -30, 3, 3); ctx.fillStyle = PAL.brassLight; ctx.fillRect(9, -20, 3, 3); });
      // coin door and kick plate
      face(ctx, ox, oy, -.3, .26, 0, () => {
        roundRect(ctx, 0, -5, 19.2, 5, 0, '#1b0f14');
        roundRect(ctx, 5, -30, 9, 16, 1, '#2b2b33'); ctx.strokeStyle = PAL.brass; ctx.lineWidth = .6; ctx.strokeRect(5.5, -29.5, 8, 15);
        for (const x of [7, 10.5]) { roundRect(ctx, x, -27, 1.6, 4, .4, '#c0392b'); ctx.fillStyle = '#f6dc9a'; ctx.fillRect(x + .4, -21, .8, .8); }
        ctx.fillStyle = PAL.parchment; ctx.font = 'bold 2.2px Verdana'; ctx.fillText('1 TOKEN', 5.6, -16);
      });
      // control panel: joystick and two buttons on the deck
      surface(ctx, ox, oy, -.3, .26, 42, () => {
        roundRect(ctx, 1, 0, 17, 3.6, .5, '#2b2b33');
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(11, 1.8, 1.1, 0, Math.PI * 2); ctx.arc(14.5, 1.8, 1.1, 0, Math.PI * 2); ctx.fill();
      });
      const j = p(ox, oy, -.18, .33);
      stroke(ctx, [[j.x, j.y - 43], [j.x + .5, j.y - 49]], '#1d1b1f', 1.2);
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(j.x + .5, j.y - 50, 2, 0, Math.PI * 2); ctx.fill();
      // screen with an attract-mode loop of the runner game
      face(ctx, ox, oy, -.3, .1, 40, () => {
        roundRect(ctx, 1.4, -34, 16.6, 22, 1, '#0b0f12');
        bands(ctx, 2.6, -32.6, 14.2, 19, '#203a5e', .14, 4);
        ctx.fillStyle = '#152536'; for (const [x, h] of [[3, 6], [6, 9], [10, 7], [13, 10]]) ctx.fillRect(x, -17.5 - h, 3, h);
        ctx.fillStyle = '#5a7c49'; ctx.fillRect(2.6, -17.5, 14.2, 3.9);
        const phase = (t * .6) % 1, cat = 16 - phase * 15;
        ctx.fillStyle = '#7ac74f'; for (let i = 0; i < 3; i++) ctx.fillRect(cat + i * 1.2, -19, 1.1, 1.4);
        const jump = Math.max(0, Math.sin(Math.min(1, Math.max(0, (phase - .45) / .3)) * Math.PI)) * 5;
        ctx.fillStyle = '#1f3a5f'; ctx.fillRect(6, -22.5 - jump, 1.8, 4); ctx.fillStyle = '#f2d6b3'; ctx.fillRect(6.2, -24 - jump, 1.4, 1.4);
        ctx.fillStyle = '#e6a64a'; const fx = 15 - ((t * .45) % 1) * 12; ctx.fillRect(fx, -28 + Math.sin(t * 6) * 1, 1.6, 1.2);
        ctx.fillStyle = '#ffffff14'; for (let y = -32.6; y < -13.6; y += 1.2) ctx.fillRect(2.6, y, 14.2, .4);
        ctx.fillStyle = '#ffffff1f'; ctx.beginPath(); ctx.moveTo(10, -32.6); ctx.lineTo(16.8, -32.6); ctx.lineTo(16.8, -26); ctx.closePath(); ctx.fill();
      });
      // illuminated marquee
      face(ctx, ox, oy, -.3, .1, 40, () => {
        const on = .85 + Math.sin(t * 5) * .08;
        roundRect(ctx, .5, -42, 18.2, 7.4, .6, '#120a0e');
        ctx.fillStyle = `rgba(233,196,106,${on})`; ctx.fillRect(1.3, -41.3, 16.6, 6);
        ctx.fillStyle = '#3a1d27'; ctx.font = 'bold 2.5px Verdana'; ctx.textAlign = 'center';
        ctx.fillText('BRIEFCASE', 9.6, -38.6); ctx.fillText('DASH', 9.6, -35.9); ctx.textAlign = 'left';
      });
    },
  },
};
