// Actors: the player and NPCs. Position is fractional grid coords; movement
// follows an A* path of tile steps. Drawing is a layered paper-doll figure.

import { PAL, shade } from '../engine/palette.js';
import { drawRobotButler } from './robots.js';

export class Actor {
  constructor(x, y, look = {}, opts = {}) {
    this.x = x;
    this.y = y;
    this.look = look;             // { suit, skin (index), hair (index) }
    this.npc = opts.npc || null;  // zone npc def, if any
    this.speed = opts.speed || 3; // tiles per second
    this.path = [];
    this.facing = 1;              // -1 left, 1 right (screen-space flip)
    this.onArrive = null;         // callback when path completes
    this.activity = null;         // null | 'reviewing' | 'watching'
  }

  get walking() { return this.path.length > 0; }
  get tileX() { return Math.round(this.x); }
  get tileY() { return Math.round(this.y); }

  setPath(path, onArrive = null) {
    this.path = path || [];
    this.onArrive = onArrive;
  }

  stop() {
    this.path = [];
    this.onArrive = null;
  }

  update(dt) {
    if (!this.path.length) return;
    const target = this.path[0];
    const dx = target.x - this.x, dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    // screen-space horizontal direction decides the sprite flip
    const sdx = (dx - dy);
    if (Math.abs(sdx) > 0.01) this.facing = sdx > 0 ? 1 : -1;
    if (dist <= step) {
      this.x = target.x;
      this.y = target.y;
      this.path.shift();
      if (!this.path.length && this.onArrive) {
        const cb = this.onArrive;
        this.onArrive = null;
        cb();
      }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  // Original articulated figure shared by portraits, the creator and the world.
  // Adult proportions: a small head, visible neck, tapered torso and long legs.
  draw(ctx, sx, sy, t, isPlayer = false) {
    const look = this.look;
    if (look.robotButler) { drawRobotButler(ctx,sx,sy,t); return; }
    const seated = ['reviewing', 'watching', 'sitting'].includes(this.activity);
    const walking = this.walking && !seated;
    const stride = walking ? Math.sin(t * 9) : 0;
    const breath = Math.sin(t * 1.7) * 0.15;
    const skin = PAL.skin[look.skin ?? 0] || PAL.skin[0];
    const hair = PAL.hair[look.hair ?? 0] || PAL.hair[0];
    const eye = PAL.eyes[look.eye ?? 0] || PAL.eyes[0];
    const suit = look.suit || PAL.navy;
    const shirt = look.shirt || '#f3eee1';
    const tie = look.tie || PAL.burgundy;
    const style = look.hairStyle ?? 0;
    const beard = look.facialHair ?? 0;
    const face = look.faceShape ?? 0;
    const shoulder = look.silhouette === 'relaxed' ? 10.3 : look.silhouette === 'slim' ? 8.3 : 9.3;
    const waist = shoulder - 2.3;
    const skirt = look.outfit === 'skirt';
    const facing = this.facing === 0 ? 0 : 1;
    const headX = facing * 0.6;
    const lift = seated ? 18 : walking ? Math.abs(stride) * 0.6 : breath;

    const poly = (points, color) => {
      ctx.fillStyle = color; ctx.beginPath();
      points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath(); ctx.fill();
    };
    const ellipse = (x, y, rx, ry, color) => {
      ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    };
    const line = (points, color, width = 1) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    };
    const round = (x, y, w, h, radius, color) => {
      ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
    };

    ctx.save();
    ctx.translate(sx, sy);
    ellipse(0, 2, seated ? 14 : 12, 4.5, 'rgba(13,21,27,.28)');
    ctx.scale(this.facing < 0 ? -1 : 1, 1);
    if (seated && (look.previewSeat || this.activity === 'reviewing')) {
      round(-12, -39, 24, 27, 3, '#60452f');
      round(-12, -18, 24, 5, 2, '#89673f');
      line([[-10,-15],[-10,1]], '#3e342b', 2.2);
      line([[10,-15],[10,1]], '#3e342b', 2.2);
    }
    ctx.translate(0, lift);

    // Rear hair is attached to the skull and sits behind the shoulders.
    if ([1, 8, 10, 11, 15].includes(style)) {
      const length = style === 8 ? 14 : 24;
      round(-6.4, -77, 13, length, [6,6,3,3], shade(hair, -0.06));
      if ([1, 15].includes(style)) {
        for (const side of [-1,1]) {
          ctx.fillStyle = hair; ctx.beginPath();
          ctx.moveTo(side * 4.8, -74);
          ctx.bezierCurveTo(side * 9, -69, side * 3, -64, side * 8, -59);
          ctx.bezierCurveTo(side * 10, -53, side * 3, -52, side * 4, -55);
          ctx.lineTo(side * 2.8,-68); ctx.closePath(); ctx.fill();
        }
      }
      if ([10, 11].includes(style)) {
        for (const x of [-5.2,-2.8,0,2.8,5.2]) {
          line([[x,-73],[x + Math.sin(x)*1.2,-64],[x + Math.sin(x+1)*1.5,-54]], shade(hair, x > 0 ? .07 : -.05), style === 10 ? 2.5 : 2.8);
          if (style === 10) for (let y=-70;y<-55;y+=3) line([[x-0.7,y],[x+0.7,y+1.3]], shade(hair,.14),.55);
        }
      }
    }
    if ([2,9].includes(style)) {
      const rootY = style === 9 ? -77 : -69;
      const sway = walking ? stride * 1.4 : 0;
      // Curved taper grows from the back of the head; never a floating rectangle.
      ctx.fillStyle = shade(hair,-.025); ctx.beginPath();
      ctx.moveTo(-4.5,rootY-1);
      ctx.bezierCurveTo(-12,rootY-4,-11+sway,rootY+9,-8+sway,rootY+15);
      ctx.bezierCurveTo(-7+sway,rootY+19,-8+sway,rootY+22,-6+sway,rootY+22);
      ctx.bezierCurveTo(-11+sway,rootY+16,-4+sway,rootY+8,-4.5,rootY+2);
      ctx.closePath(); ctx.fill();
      ellipse(-5.3,rootY,2,1.2,'#b59458');
      line([[-7,rootY+2],[-8+sway,rootY+10],[-7+sway,rootY+17]], shade(hair,.12),.65);
    }
    if (style === 3) ellipse(-4.3,-77,3.6,3.5,hair);
    if (style === 15) ellipse(-4,-73,2.4,2.5,hair);

    // Legs articulate from the hip, with separate knee and shoe placement.
    for (const side of [-1,1]) {
      const step = side * stride;
      const footY = seated ? -lift : -Math.max(0, step) * 3.2;
      const hipX = side * 3.8;
      const kneeX = side * (seated ? 7.5 : 4.1) + step * 1.5;
      const kneeY = seated ? -30 : -17;
      const footX = side * (seated ? 8.2 : 4.4) + step * 2;
      poly([[hipX-3.1,-36],[hipX+3.1,-36],[kneeX+2.6,kneeY],[footX+2,footY-2],[footX-2.5,footY-2],[kneeX-2.8,kneeY]], skirt ? shade(skin,-.025) : shade(suit,side < 0 ? -.17 : -.085));
      if (!skirt) line([[hipX,-32],[kneeX,kneeY],[footX,footY-5]],shade(suit,side < 0 ? -.10 : .015),.6);
      round(footX-2.8,footY-3,7.8,4,1.5,'#272b30');
      line([[footX-1.6,footY-2],[footX+3,footY-2]],'#515451',.6);
    }
    if (skirt) {
      const hem = seated ? -25 : -19;
      poly([[-waist,-37],[waist,-37],[waist+2,hem],[-waist-2,hem]],shade(suit,-.08));
      poly([[1,-35],[waist,-36],[waist+2,hem],[3,hem]],shade(suit,.025));
      line([[-waist-1.5,hem],[waist+1.5,hem]],shade(suit,-.18),.8);
      line([[1,hem-6],[1,hem]],shade(suit,-.22),.65);
    }

    // Jacket shoulders taper into the waist. The shirt is a real inset layer.
    poly([[-4.5,-62],[-shoulder,-58],[-shoulder+.8,-49],[-waist,-36],[-waist-1,-32],[0,-33],[waist+1,-32],[waist,-36],[shoulder-.8,-49],[shoulder,-58],[4.5,-62]],suit);
    poly([[-shoulder,-58],[-4,-58],[-1,-42],[-2,-33],[-waist-1,-32],[-waist,-44]],shade(suit,-.13));
    poly([[4,-59],[shoulder,-57],[waist,-42],[waist+1,-32],[1,-34],[1,-47]],shade(suit,.07));
    poly([[-3.7,-61],[3.7,-61],[2.4,-42],[-2.4,-42]],shirt);
    poly([[-2.8,-60],[0,-57],[-2.1,-54],[-4.5,-60]],shade(shirt,-.1));
    poly([[2.8,-60],[0,-57],[2.1,-54],[4.5,-60]],shade(shirt,.025));
    poly([[-1.1,-56],[1.2,-56],[1.7,-44],[0,-42],[-1.7,-44]],tie);
    poly([[-1.4,-58],[1.4,-58],[1,-55],[-1,-55]],shade(tie,-.08));
    poly([[-4,-62],[-7,-57],[-4.5,-53],[-5.5,-51],[-1.5,-43],[-2,-53]],shade(suit,.15));
    poly([[4,-62],[7,-57],[4.5,-53],[5.5,-51],[1.5,-43],[2,-53]],shade(suit,.19));
    line([[.7,-42],[.7,-35]],shade(suit,-.15),.75);
    ellipse(.7,-39,.65,.65,'#b8ada0');
    line([[4.6,-48],[7.3,-48]],shade(suit,-.2),.65);
    poly([[5,-49],[6,-50.3],[7,-49]],shirt);
    line([[-6,-38],[-3,-38]],shade(suit,-.22),.65);

    // Arms, cuffs and hands are separate tapered shapes, with a restrained swing.
    for (const side of [-1,1]) {
      const swing = walking ? -side * stride * 2.8 : 0;
      const elbowX = side * (shoulder + 1.7);
      const handX = seated ? side * 6 : side * (shoulder + 1.1) + swing * .45;
      const handY = seated ? -36 : -35 + swing;
      poly([[side*(shoulder-1),-58],[side*(shoulder+2),-56],[elbowX+side*1.5,-45],[handX+side*1.6,handY],[handX-side*1.8,handY+1],[elbowX-side*2,-45]],shade(suit,side < 0 ? -.075 : .025));
      line([[handX-1.4,handY],[handX+1.5,handY]],shirt,1.5);
      ellipse(handX,handY+2.2,1.8,3,skin);
      line([[handX+.8,handY+1],[handX+.8,handY+3]],shade(skin,-.13),.5);
    }

    // Neck and jaw give the face a distinct silhouette instead of a round mask.
    round(-2,-66,4,6,1.5,shade(skin,-.09));
    ellipse(headX-5,-70.2,1.1,2.2,shade(skin,-.065));
    ellipse(headX+5,-70.2,1.1,2.2,skin);
    const jaw = face === 1 ? 4 : face === 2 ? 4.5 : 3.1;
    ctx.fillStyle = skin; ctx.beginPath();
    ctx.moveTo(headX-4.8,-74.8);
    ctx.bezierCurveTo(headX-4.8,-79,headX+4.8,-79,headX+4.8,-74.8);
    ctx.lineTo(headX+4.6,-68.5);
    ctx.quadraticCurveTo(headX+jaw,-64.7,headX+1,-64.4);
    ctx.lineTo(headX-1,-64.4);
    ctx.quadraticCurveTo(headX-jaw,-64.7,headX-4.6,-68.5);
    ctx.closePath(); ctx.fill();
    poly([[headX+3.5,-74],[headX+4.6,-71],[headX+4.3,-68],[headX+jaw*.7,-65],[headX+1.3,-65.2],[headX+2.7,-69]],shade(skin,-.07));
    ellipse(headX-2.8,-68.4,1.3,.6,shade(skin,.022));

    // Narrow almond eyes: subtle sclera, colored iris, pupil, lid and brow.
    for (const side of [-1,1]) {
      const x = headX + side * 2.05 + facing * .25;
      const width = side < 0 && facing ? 1.35 : 1.55;
      ellipse(x,-71.9,width,.69,'#ede8df');
      ellipse(x+facing*.25,-71.9,.61,.69,eye);
      ellipse(x+facing*.3,-71.9,.27,.48,'#20292b');
      ellipse(x+facing*.3-.17,-72.15,.14,.16,'#faf6ed');
      line([[x-width,-72],[x-.4,-72.57],[x+.6,-72.5],[x+width,-72]],shade(skin,-.26),.5);
      line([[x-width,-74],[x-.1,-74.3],[x+width*.8,-74]],hair,.65);
    }
    line([[headX+.4,-71],[headX+1,-68.6],[headX+.1,-68.3]],shade(skin,-.18),.55);
    line([[headX-1.25,-66.8],[headX+.3,-66.55],[headX+1.55,-66.9]],shade(skin,-.22),.65);
    line([[headX-.6,-66.05],[headX+.8,-66.05]],shade(skin,.06),.5);

    // Facial hair follows jaw contours, keeping lips and the nose readable.
    if ([1,4,5].includes(beard)) {
      ctx.save(); ctx.globalAlpha = beard === 1 ? .25 : .9;
      poly([[headX-4.4,-69.1],[headX-2.7,-67.9],[headX-1.8,-66],[headX+1.8,-66],[headX+2.7,-67.9],[headX+4.4,-69.1],[headX+4,-65.3],[headX+(beard===5?2.8:1.5),beard===5?-60.6:-64],[headX-(beard===5?2.8:1.5),beard===5?-60.6:-64],[headX-4,-65.3]],hair);
      ctx.restore();
      if (beard === 5) for (const x of [-2,0,2]) line([[headX+x,-65],[headX+x*.8,-61.6]],shade(hair,.10),.5);
    }
    if ([2,4,5,6].includes(beard)) {
      poly([[headX,-68],[headX-1.6,-68],[headX-3,-66.7],[headX-1,-67],[headX,-67.3],[headX+1,-67],[headX+3,-66.7],[headX+1.6,-68]],hair);
    }
    if ([3,6].includes(beard)) poly([[headX-1.5,-66],[headX+1.5,-66],[headX+1.8,-63],[headX,-62.2],[headX-1.8,-63]],hair);

    // Front hair: distinct original silhouettes; scalp/face remain visible.
    if (style !== 5) {
      const short = style === 6;
      ctx.fillStyle = hair; ctx.beginPath();
      ctx.moveTo(headX-5,-70.5);
      ctx.lineTo(headX-5.2,-75.5);
      ctx.bezierCurveTo(headX-4.7,short?-79:-80,headX+4.5,short?-79:-80,headX+5.1,-75.5);
      ctx.lineTo(headX+4.8,-70.5); ctx.lineTo(headX+3.6,-74.5);
      ctx.quadraticCurveTo(headX+.8,-75.1,headX-1.5,-75.2);
      ctx.lineTo(headX-3.5,-73.9); ctx.closePath(); ctx.fill();
      if ([0,7,13,14].includes(style)) {
        const drop = style === 13 ? -71.7 : -74.5;
        poly([[headX-4.7,-76],[headX-2,-79.3],[headX+4.4,-77],[headX+4.2,drop],[headX+1.3,-74.8],[headX-2.4,-75.3]],shade(hair,.055));
        line([[headX-2.7,-78],[headX-.6,-76.6],[headX+2.7,drop-.7]],shade(hair,.15),.5);
      }
      if ([4,12,14].includes(style)) {
        for (let i=0;i<7;i++) {
          const x = headX-4.5+i*1.5;
          const y = -77.2-Math.sin(i/6*Math.PI)*(style===4?3.1:1.5);
          ellipse(x,y,style===4?2.1:1.5,style===4?2.5:1.6,shade(hair,(i%3)*.03));
        }
      }
      if ([1,8,15].includes(style)) line([[headX-.5,-78],[headX-1.3,-75.5],[headX-3.5,-73.6]],shade(hair,.16),.55);
      if ([10,11].includes(style)) for (const x of [-3,-1,1,3]) line([[headX+x,-77],[headX+x*.8,-75]],shade(hair,.13),.65);
      if (style===7) for (const x of [-2,0,2]) line([[headX+x,-75.4],[headX+x-1,-77.7]],shade(hair,.13),.6);
    }
    if (look.glasses) {
      ctx.strokeStyle = '#3b3f3d'; ctx.lineWidth = .55;
      for (const x of [-2.1,2.1]) { ctx.beginPath(); ctx.roundRect(headX+x-1.75,-73,3.5,2.2,.7); ctx.stroke(); }
      line([[headX-.4,-72.4],[headX+.4,-72.4]],'#3b3f3d',.5);
      line([[headX-3.9,-72.2],[headX-5,-72.6]],'#3b3f3d',.5);
    }
    if (look.badge) {
      poly([[-6,-53],[-3,-53],[-3.2,-50],[-4.5,-49],[-5.8,-50]],'#cfaf5c');
      ellipse(-4.5,-51.5,.65,.65,'#f1dfac');
    }
    if (isPlayer && !seated) {
      const handY = -35 + (walking ? -stride*2.8 : 0);
      line([[shoulder+.1,handY+5],[shoulder+.1,handY+3],[shoulder+4.3,handY+3],[shoulder+4.3,handY+5]],'#594c38',1);
      round(shoulder-2,handY+5,11,8.5,1.2,look.briefcase || '#694c35');
      line([[shoulder-1,handY+7],[shoulder+8,handY+7]],'#aa8453',.7);
      round(shoulder+2.8,handY+7,1.6,1.5,.3,'#d1b572');
    } else if (isPlayer && this.activity === 'reviewing') {
      poly([[-11,-35],[8,-35],[12,-27],[-8,-27]],PAL.parchment);
      for (let i=0;i<3;i++) line([[-7+i,-33+i*1.5],[7+i,-33+i*1.5]],'#8b8a7f',.55);
    }
    ctx.restore();
  }
}
