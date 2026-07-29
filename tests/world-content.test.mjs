import test from 'node:test';
import assert from 'node:assert/strict';

import { ZONES } from '../js/world/zones.js';

test('the launch world contains all six requested playable zones', () => {
  assert.deepEqual(
    Object.keys(ZONES),
    ['office', 'corner_office', 'linda_office', 'conference_room', 'courtroom', 'apartment'],
  );
});

test('the main office connects the requested workspaces and filing cabinet', () => {
  const office = ZONES.office;
  assert.deepEqual(
    office.portals.filter((portal) => portal.to).map((portal) => portal.to),
    ['corner_office', 'linda_office', 'conference_room'],
  );
  assert.ok(office.props.some(
    (prop) => prop.type === 'filingstation' && prop.interact?.action === 'doc_review',
  ));
  assert.ok(office.props.some(
    (prop) => prop.type === 'bookshelf' && prop.interact?.action === 'rules',
  ));
  assert.equal(office.npcs.find((npc) => npc.id === 'secretary').name, 'Liz Loza, Secretary');
  assert.equal(office.npcs.find((npc) => npc.id === 'paralegal').name, 'Riley Readsalot, Paralegal');
});

test('partner offices and conference room contain their defining fixtures', () => {
  assert.equal(ZONES.corner_office.npcs[0].name, 'Jim Hardsell, Managing Partner');
  assert.equal(ZONES.corner_office.npcs[0].talk, 'jim');
  assert.ok(ZONES.corner_office.props.some((prop) => prop.type === 'executivedesk'));
  assert.ok(ZONES.corner_office.props.filter((prop) => prop.type === 'citywindow').length >= 3);

  assert.equal(ZONES.linda_office.npcs[0].name, 'Linda Firestone, Partner');
  assert.equal(ZONES.linda_office.npcs[0].talk, 'linda');
  assert.ok(ZONES.linda_office.props.some((prop) => prop.type === 'executivedesk'));

  assert.ok(ZONES.conference_room.props.some((prop) => prop.type === 'tv'));
  assert.ok(ZONES.conference_room.props.some((prop) => prop.type === 'conftable'));
});

test('the courtroom is furnished and intentionally empty', () => {
  const courtroom = ZONES.courtroom;
  assert.equal(courtroom.npcs.length, 0);
  for (const required of ['judgebench', 'witnessstand', 'counseltable', 'bench']) {
    assert.ok(courtroom.props.some((prop) => prop.type === required), `missing ${required}`);
  }
});
