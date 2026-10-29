import test from 'node:test';
import assert from 'node:assert/strict';
import { ZONES } from '../js/world/zones.js';
import { PROPS } from '../js/world/props.js';
import { findPath } from '../js/engine/pathfind.js';
import { canAccessBarMail } from '../js/data/mail.js';
import { freshState } from '../js/state.js';

const zone = ZONES.associates;
const walk = (x, y) => x > 0 && y > 0 && x < zone.w && y < zone.h && zone.tile(x, y) !== 'x'
  && !zone.props.some((prop) => { const def = PROPS[prop.type]; return def.solid && x >= prop.x && x < prop.x + def.w && y >= prop.y && y < prop.y + def.h; });

test('the Associates’ Floor has eight uniquely named open desks with free seats in front of them', () => {
  const desks = zone.props.filter((prop) => prop.type === 'opendesk');
  assert.equal(desks.length, 8);
  assert.equal(new Set(desks.map((d) => d.deskId)).size, 8);
  for (const desk of desks) {
    assert.equal(desk.seat.y, desk.y + 1); assert.equal(desk.seat.x, desk.x);
    assert.ok(walk(desk.seat.x, desk.seat.y), `${desk.deskId} seat must be walkable`);
    assert.equal(desk.occupant, null);
    assert.equal(desk.interact.action, 'desk_sit');
    assert.match(desk.interact.label(desk), /Sit down/);
    assert.match(desk.interact.label({ ...desk, occupant: 'Pat' }), /Pat/);
    assert.ok(findPath(walk, zone.w, zone.h, zone.spawn.x, zone.spawn.y, desk.seat.x, desk.seat.y), `${desk.deskId} reachable`);
  }
});

test('the floor connects to the main office in both directions with walkable destinations', () => {
  const toOffice = zone.portals.find((p) => p.to === 'office');
  const fromOffice = ZONES.office.portals.find((p) => p.to === 'associates');
  assert.ok(toOffice && fromOffice);
  assert.ok(walk(fromOffice.dest.x, fromOffice.dest.y));
  const officeWalk = (x, y) => x > 0 && y > 0 && x < ZONES.office.w && y < ZONES.office.h
    && !ZONES.office.props.some((prop) => { const def = PROPS[prop.type]; return def.solid && !(prop.visible && !prop.visible()) && x >= prop.x && x < prop.x + def.w && y >= prop.y && y < prop.y + def.h; });
  assert.ok(officeWalk(toOffice.dest.x, toOffice.dest.y));
  assert.ok(findPath(officeWalk, ZONES.office.w, ZONES.office.h, ZONES.office.spawn.x, ZONES.office.spawn.y, fromOffice.x, fromOffice.y));
  for (const portal of zone.portals) assert.ok(findPath(walk, zone.w, zone.h, zone.spawn.x, zone.spawn.y, portal.x, portal.y));
  assert.ok(zone.props.every((prop) => PROPS[prop.type]));
});

test('BarMail opens at a claimed open desk but nowhere else on the floor without the Work Phone', () => {
  const player = { ...freshState(), zone: 'associates' };
  assert.equal(canAccessBarMail(player), false);
  assert.equal(canAccessBarMail(player, true), true);
  assert.equal(canAccessBarMail({ ...player, zone: 'sidebar' }, true), false);
  assert.equal(canAccessBarMail({ ...player, upgrades: ['work_phone'] }), true);
});
