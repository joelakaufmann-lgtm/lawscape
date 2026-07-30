import test from 'node:test';
import assert from 'node:assert/strict';

import { ZONES } from '../js/world/zones.js';
import { PROPS } from '../js/world/props.js';

test('the launch world contains all six requested playable zones', () => {
  assert.deepEqual(
    Object.keys(ZONES),
    ['office', 'corner_office', 'linda_office', 'conference_room', 'courtroom', 'apartment'],
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
  for (const required of ['officechair', 'plant', 'porthole', 'dotpainting']) {
    assert.ok(office.props.some((prop) => prop.type === required), `missing office upgrade prop ${required}`);
  }
  const liz = office.npcs.find((npc) => npc.id === 'secretary');
  const porthole = office.props.find((prop) => prop.type === 'porthole');
  assert.equal(porthole.x, 0);
  assert.ok(Math.abs(porthole.y - liz.y) <= 1, 'the porthole should be beside Liz');
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

test('the courtroom is furnished and intentionally empty', () => {
  const courtroom = ZONES.courtroom;
  assert.equal(courtroom.npcs.length, 0);
  for (const required of ['judgebench', 'witnessstand', 'counseltable', 'bench']) {
    assert.ok(courtroom.props.some((prop) => prop.type === required), `missing ${required}`);
  }
});
