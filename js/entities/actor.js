// Actors: the player and NPCs. Position is fractional grid coords; movement
// follows an A* path of tile steps. Drawing is a layered paper-doll figure.

import { PAL, shade } from '../engine/palette.js';

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

  // Draw at screen point (sx, sy) = center of the tile under the feet.
  draw(ctx, sx, sy, t, isPlayer = false) {
    const bob = this.walking ? Math.sin(t * 12) * 1.6 : 0;
    const f = this.facing;
    const suit = this.look.suit || PAL.navy;
    const skin = PAL.skin[this.look.skin ?? 0] || PAL.skin[0];
    const hair = PAL.hair[this.look.hair ?? 0] || PAL.hair[0];
    const eye = PAL.eyes[this.look.eye ?? 0] || PAL.eyes[0];
    const style = this.look.hairStyle ?? 0;
    // Silhouette: suit cut varies slightly by gender.
    const hw = this.look.gender === 'male' ? 8.5
             : this.look.gender === 'female' ? 7.2 : 8;

    // shadow
    ctx.fillStyle = 'rgba(20,20,28,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const y0 = sy - bob;
    // legs
    ctx.fillStyle = shade(suit, -0.25);
    const stride = this.walking ? Math.sin(t * 12) * 3 : 0;
    ctx.fillRect(sx - 5, y0 - 12 + Math.max(0, stride), 4, 12 - Math.max(0, stride));
    ctx.fillRect(sx + 1, y0 - 12 + Math.max(0, -stride), 4, 12 - Math.max(0, -stride));
    // body (suit)
    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.roundRect(sx - hw, y0 - 30, hw * 2, 20, 4);
    ctx.fill();
    // lapel / shirt
    ctx.fillStyle = PAL.parchment;
    ctx.beginPath();
    ctx.moveTo(sx, y0 - 29);
    ctx.lineTo(sx + 3 * f, y0 - 24);
    ctx.lineTo(sx, y0 - 19);
    ctx.lineTo(sx - 3 * f, y0 - 24);
    ctx.closePath();
    ctx.fill();
    // tie
    ctx.fillStyle = this.npc ? shade(suit, -0.3) : PAL.burgundy;
    ctx.fillRect(sx - 1, y0 - 25, 2, 7);
    // arms
    ctx.fillStyle = shade(suit, -0.12);
    ctx.fillRect(sx - hw - 2, y0 - 28, 3, 14);
    ctx.fillRect(sx + hw - 1, y0 - 28, 3, 14);

    // curly/afro halo sits behind the head
    if (style === 4) {
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(sx, y0 - 39, 9.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(sx, y0 - 37, 7, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = eye;
    ctx.fillRect(sx - 3.6 + f, y0 - 38.2, 2.2, 2.2);
    ctx.fillRect(sx + 1.4 + f, y0 - 38.2, 2.2, 2.2);
    // hair style (drawn over the head)
    ctx.fillStyle = hair;
    switch (style) {
      case 0: // short
        ctx.beginPath();
        ctx.arc(sx, y0 - 39, 7, Math.PI, Math.PI * 2);
        ctx.fill();
        break;
      case 1: // long — cap plus falls over the shoulders
        ctx.beginPath();
        ctx.arc(sx, y0 - 39, 7, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(sx - 9, y0 - 41, 4, 18, 2);
        ctx.roundRect(sx + 5, y0 - 41, 4, 18, 2);
        ctx.fill();
        break;
      case 2: // ponytail — cap plus a tail behind the facing direction
        ctx.beginPath();
        ctx.arc(sx, y0 - 39, 7, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(sx - f * 10 - 1.5, y0 - 40, 3, 13, 1.5);
        ctx.fill();
        ctx.fillStyle = PAL.brass;
        ctx.fillRect(sx - f * 10 - 1.5, y0 - 34, 3, 1.6);
        break;
      case 3: // bun
        ctx.beginPath();
        ctx.arc(sx, y0 - 39, 7, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, y0 - 46.5, 3.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 4: // curly — front cap over the halo drawn earlier
        ctx.beginPath();
        ctx.arc(sx, y0 - 39.5, 7.6, Math.PI, Math.PI * 2);
        ctx.fill();
        break;
      case 5: // bald — nothing
      default:
        break;
    }

    // briefcase for the player
    if (isPlayer) {
      ctx.fillStyle = PAL.woodDark;
      ctx.beginPath();
      ctx.roundRect(sx + 9 * f - 4, y0 - 16, 9, 7, 1.5);
      ctx.fill();
      ctx.fillStyle = PAL.brass;
      ctx.fillRect(sx + 9 * f - 1, y0 - 14, 3, 2);
    }
  }
}
