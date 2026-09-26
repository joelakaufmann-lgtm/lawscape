import test from 'node:test';
import assert from 'node:assert/strict';

import { ZONES } from '../js/world/zones.js';
import { PROPS } from '../js/world/props.js';
import { findPath } from '../js/engine/pathfind.js';

test('the local world contains seven playable zones including The Sidebar', () => {
  assert.deepEqual(
    Object.keys(ZONES),
    ['office', 'corner_office', 'linda_office', 'conference_room', 'courtroom', 'sidebar', 'apartment'],
  );
});

test('every zone prop has a drawable definition', () => {
  for (const zone of Object.values(ZONES)) {
    for (const prop of zone.props) {
      assert.ok(PROPS[prop.type], `${zone.id} uses undefined prop ${prop.type}`);
    }
  }
});

test('the main office connects the requested workspaces and filing cabinet', () => {
  const office = ZONES.office;
  assert.deepEqual(
    office.portals.filter((portal) => portal.to).map((portal) => portal.to),
    ['corner_office', 'linda_office', 'conference_room'],
  );
  const filingStation = office.props.find(
    (prop) => prop.type === 'filingstation' && prop.interact?.action === 'doc_review',
  );
  assert.ok(filingStation);
  assert.ok(filingStation.x <= 2, 'document review should be in the left-hand corner');
  const upgradeCabinet = office.props.find((prop) => prop.interact?.action === 'shop_office');
  assert.equal(upgradeCabinet.x, filingStation.x + 2);
  assert.ok(office.props.some(
    (prop) => prop.type === 'bookshelf' && prop.interact?.action === 'rules',
  ));
  assert.equal(office.npcs.find((npc) => npc.id === 'secretary').name, 'Liz Loza, Secretary');
  assert.equal(office.npcs.find((npc) => npc.id === 'paralegal').name, 'Riley Readsalot, Paralegal');
  for (const required of ['officechair', 'plant', 'dotpainting']) {
    assert.ok(office.props.some((prop) => prop.type === required), `missing office upgrade prop ${required}`);
  }
  assert.equal(typeof office.props.find((prop) => prop.type === 'desk').phone, 'function');
  assert.equal(office.props.some((prop) => prop.type === 'sofa'), false);
});

test('partner offices and conference room contain their defining fixtures', () => {
  assert.equal(ZONES.corner_office.npcs[0].name, 'Jim Hardsell, Managing Partner');
  assert.equal(ZONES.corner_office.npcs[0].talk, 'jim');
  assert.ok(ZONES.corner_office.props.some((prop) => prop.type === 'executivedesk'));
  assert.ok(ZONES.corner_office.props.some(
    (prop) => prop.type === 'barcart' && prop.interact?.action === 'whiskey',
  ));
  const safe = ZONES.corner_office.props.find(
    (prop) => prop.type === 'safe' && prop.interact?.action === 'moneybags_safe',
  );
  assert.ok(safe);
  assert.ok(safe.x <= 2 && safe.y >= 4, 'the safe should sit left and below the windows');
  const jimWindows = ZONES.corner_office.props.filter((prop) => prop.type === 'wallwindow');
  assert.ok(jimWindows.length >= 3);
  assert.ok(jimWindows.every((prop) => prop.y === 0));

  assert.equal(ZONES.linda_office.npcs[0].name, 'Linda Firestone, Partner');
  assert.equal(ZONES.linda_office.npcs[0].talk, 'linda');
  assert.equal(ZONES.linda_office.npcs[0].look.hair, 2);
  assert.ok(ZONES.linda_office.props.some((prop) => prop.type === 'executivedesk'));
  const lindaWindows = ZONES.linda_office.props.filter((prop) => prop.type === 'wallwindow');
  assert.ok(lindaWindows.length >= 3);
  assert.ok(lindaWindows.every((prop) => prop.y === 0));

  assert.ok(ZONES.conference_room.props.some((prop) => prop.type === 'tv'));
  assert.ok(ZONES.conference_room.props.some((prop) => prop.type === 'conftable'));
});

test('the City View Apartment upgrade adds its wall window and sofa without a television', () => {
  const cityViewProps = ZONES.apartment.props.filter(
    (prop) => ['wallwindow', 'sofa'].includes(prop.type),
  );
  assert.deepEqual(cityViewProps.map((prop) => prop.type), ['wallwindow', 'sofa']);
  assert.equal(cityViewProps.find((prop) => prop.type === 'wallwindow').y, 0);
  assert.ok(cityViewProps.every((prop) => typeof prop.visible === 'function'));
  const sofa = cityViewProps.find((prop) => prop.type === 'sofa');
  assert.equal(sofa.interact?.action, 'watch_tv');
  assert.match(sofa.interact?.label, /City View/);
  assert.equal(ZONES.apartment.props.some((prop) => prop.type === 'tv'), false);
});

test('apartment food, wardrobe, and clock fixtures match their upgraded layout', () => {
  const apartment = ZONES.apartment;
  assert.ok(apartment.props.some(
    (prop) => prop.type === 'kitchenette' && prop.interact?.action === 'eat_ramen',
  ));
  assert.ok(apartment.props.some(
    (prop) => prop.type === 'stove' && prop.interact?.action === 'cook_meal',
  ));
  assert.ok(apartment.props.some((prop) => prop.type === 'fridge'));
  assert.ok(apartment.props.some((prop) => prop.type === 'wardrobe' && prop.x <= 2));
  const clock = apartment.props.find((prop) => prop.type === 'wallclock');
  assert.ok(clock);
  assert.equal(clock.y, 0);
  assert.ok(clock.x <= 6, 'the clock should sit far enough inward to render fully');
});

test('Derek Balam is the courtroom bailiff with an interactive role and badge', () => {
  const courtroom = ZONES.courtroom;
  assert.equal(courtroom.npcs.length, 1);
  assert.equal(courtroom.npcs[0].name, 'Derek Balam, Bailiff');
  assert.equal(courtroom.npcs[0].talk, 'bailiff');
  assert.equal(courtroom.npcs[0].look.badge, true);
  for (const required of ['judgebench', 'witnessstand', 'counseltable', 'bench']) {
    assert.ok(courtroom.props.some((prop) => prop.type === required), `missing ${required}`);
  }
});

test('the new lounge and courtroom interactions are reachable from their entrances', () => {
  for (const zone of [ZONES.sidebar, ZONES.courtroom]) {
    const walk = (x, y) => x > 0 && y > 0 && x < zone.w && y < zone.h && zone.tile(x,y) !== 'x'
      && !zone.props.some((prop) => { const def = PROPS[prop.type]; return def.solid && x >= prop.x && x < prop.x+def.w && y >= prop.y && y < prop.y+def.h; });
    assert.ok(walk(zone.spawn.x,zone.spawn.y), `${zone.id} spawn`);
    for (const target of [...zone.props.filter((p) => p.interact), ...zone.npcs]) {
      const def = PROPS[target.type] || { w: 1, h: 1 };
      let reachable = false;
      for (let y=target.y-1; y<=target.y+def.h; y++) for (let x=target.x-1; x<=target.x+def.w; x++) {
        if (walk(x,y) && findPath(walk,zone.w,zone.h,zone.spawn.x,zone.spawn.y,x,y) !== null) reachable = true;
      }
      assert.ok(reachable, `${zone.id}: ${target.type || target.name}`);
    }
    for (const exit of zone.portals) assert.notEqual(findPath(walk,zone.w,zone.h,zone.spawn.x,zone.spawn.y,exit.x,exit.y), null);
  }
});
