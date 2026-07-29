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
  assert.ok(office.props.some(
    (prop) => prop.type === 'bookshelf' && prop.interact?.action === 'rules',
  ));
  assert.equal(office.npcs.find((npc) => npc.id === 'secretary').name, 'Liz Loza, Secretary');
  assert.equal(office.npcs.find((npc) => npc.id === 'paralegal').name, 'Riley Readsalot, Paralegal');
  for (const required of ['officechair', 'plant', 'porthole', 'dotpainting']) {
    assert.ok(office.props.some((prop) => prop.type === required), `missing office upgrade prop ${required}`);
  }
  assert.equal(office.props.some((prop) => prop.type === 'sofa'), false);
});

test('partner offices and conference room contain their defining fixtures', () => {
  assert.equal(ZONES.corner_office.npcs[0].name, 'Jim Hardsell, Managing Partner');
  assert.equal(ZONES.corner_office.npcs[0].talk, 'jim');
  assert.ok(ZONES.corner_office.props.some((prop) => prop.type === 'executivedesk'));
  assert.ok(ZONES.corner_office.props.some(
    (prop) => prop.type === 'barcart' && prop.interact?.action === 'whiskey',
  ));
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

test('the City View Apartment upgrade adds its wall window, television, and sofa', () => {
  const cityViewProps = ZONES.apartment.props.filter(
    (prop) => ['wallwindow', 'tv', 'sofa'].includes(prop.type),
  );
  assert.deepEqual(cityViewProps.map((prop) => prop.type), ['wallwindow', 'tv', 'sofa']);
  assert.equal(cityViewProps.find((prop) => prop.type === 'wallwindow').y, 0);
  assert.ok(cityViewProps.every((prop) => typeof prop.visible === 'function'));
  const tv = cityViewProps.find((prop) => prop.type === 'tv');
  const sofa = cityViewProps.find((prop) => prop.type === 'sofa');
  assert.ok(sofa.y > tv.y, 'the couch should sit in front of the TV');
  assert.equal(sofa.interact?.action, 'watch_tv');
});

test('apartment upgrades add a stove, fridge, and wall-mounted clock', () => {
  const apartment = ZONES.apartment;
  assert.ok(apartment.props.some((prop) => prop.type === 'stove'));
  assert.ok(apartment.props.some((prop) => prop.type === 'fridge'));
  const clock = apartment.props.find((prop) => prop.type === 'wallclock');
  assert.ok(clock);
  assert.equal(clock.y, 0);
});

test('the courtroom is furnished and intentionally empty', () => {
  const courtroom = ZONES.courtroom;
  assert.equal(courtroom.npcs.length, 0);
  for (const required of ['judgebench', 'witnessstand', 'counseltable', 'bench']) {
    assert.ok(courtroom.props.some((prop) => prop.type === required), `missing ${required}`);
  }
});
