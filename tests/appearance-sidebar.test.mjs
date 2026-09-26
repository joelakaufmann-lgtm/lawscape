import test from 'node:test';
import assert from 'node:assert/strict';
import { Actor } from '../js/entities/actor.js';
import { PAL } from '../js/engine/palette.js';
import { normalizeAppearance, appearanceLook, HAIR_STYLES, FACIAL_HAIR, HAIR_COLORS, TIE_COLORS } from '../js/data/appearance.js';
import { SIDEBAR_ROOM, sidebarTopic, saveSidebarDraft } from '../js/data/sidebar.js';
import { freshState, state, save, load, reset } from '../js/state.js';

test('appearance migration preserves existing styles and defaults all genders to trousers', () => {
  for (const gender of ['female', 'male', 'nonbinary']) {
    for (let hairStyle = 0; hairStyle < 6; hairStyle++) {
      const migrated = normalizeAppearance({ gender, hairStyle, hair: hairStyle, skin: 4, suitColor: PAL.suits[3], glasses: true });
      assert.equal(migrated.outfit, 'trousers');
      assert.equal(migrated.hairStyle, hairStyle);
      assert.equal(migrated.hair, hairStyle);
      assert.equal(migrated.suitColor, PAL.suits[3]);
      assert.equal(migrated.glasses, true);
      assert.equal(normalizeAppearance({ ...migrated, gender, outfit: 'skirt' }).outfit, 'skirt');
    }
  }
  assert.equal(HAIR_STYLES[2], 'Low ponytail');
  assert.equal(HAIR_COLORS.length, PAL.hair.length);
  assert.equal(TIE_COLORS.length, PAL.ties.length);
  assert.deepEqual(normalizeAppearance({ hair: -1, hairStyle: 1000, facialHair: '5', eye: NaN, outfit: 'invalid', tieColor: 'url(bad)' }), normalizeAppearance());
});

test('custom colors and accessories map consistently to the world and preview', () => {
  const input = { ...normalizeAppearance(), hairStyle: 15, hair: 17, facialHair: 6, eye: 4, outfit: 'skirt', tieColor: PAL.ties[5], shirtColor: PAL.shirts[2] };
  const look = appearanceLook(input);
  assert.equal(look.tie, PAL.ties[5]); assert.equal(look.shirt, PAL.shirts[2]);
  assert.equal(look.hairStyle, 15); assert.equal(look.facialHair, 6); assert.equal(look.outfit, 'skirt');
  assert.equal(appearanceLook(input, ['tie-brass']).tie, '#cba64b');
  assert.equal(input.tieColor, PAL.ties[5], 'equipping a reward must preserve the chosen base color');
});

test('all hair, beard, outfit and pose branches render finite coordinates with balanced canvas state', () => {
  let depth = 0, calls = 0;
  const context = new Proxy({}, {
    get: (_target, key) => (...args) => {
      if (key === 'save') depth++;
      if (key === 'restore') { depth--; assert.ok(depth >= 0); }
      for (const value of args.flat()) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${key} received ${value}`);
      if (key === 'ellipse') assert.ok(args[2] >= 0 && args[3] >= 0);
      calls++;
    },
    set: (_target, key, value) => { if (key === 'fillStyle' || key === 'strokeStyle') assert.equal(typeof value, 'string'); return true; },
  });
  for (let hairStyle=0; hairStyle<HAIR_STYLES.length; hairStyle++) for (let facialHair=0; facialHair<FACIAL_HAIR.length; facialHair++) {
    for (const outfit of ['trousers','skirt']) for (const pose of ['stand','walk','sit']) for (const facing of [-1,0,1]) {
      const actor = new Actor(0,0,{ ...appearanceLook({ hairStyle, facialHair, outfit, hair: hairStyle % PAL.hair.length, faceShape: facialHair % 3, glasses: facialHair % 2 === 1 }), previewSeat: true, badge: true });
      actor.facing = facing;
      if (pose === 'walk') actor.setPath([{x:1,y:0}]);
      if (pose === 'sit') actor.activity = 'sitting';
      actor.draw(context,0,0,.8,true);
      assert.equal(depth,0);
    }
  }
  assert.ok(calls > 10000);
});

test('local lounge drafts stay separate per topic, are bounded, and migrate with appearance', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (key) => store.get(key) ?? null, setItem: (key,value) => store.set(key,value), removeItem: (key) => store.delete(key) };
  try {
    reset();
    Object.assign(state, { gender: 'female', gold: 87, hairStyle: 9, hair: 9, facialHair: 2, eye: 2, outfit: 'skirt', tieColor: PAL.ties[5] });
    const result = saveSidebarDraft(state, 'agents', 'A question about source checks.');
    assert.equal(result.status, 'local-draft');
    saveSidebarDraft(state, 'writing', 'x'.repeat(700));
    assert.equal(state.sidebar.drafts.writing.length,500);
    assert.equal(state.sidebar.drafts.agents,'A question about source checks.');
    assert.equal(SIDEBAR_ROOM.mode, 'local-preview');
    assert.equal(sidebarTopic('unknown').id, 'commons');
    assert.equal(save(),true);
    state.outfit = 'trousers'; state.sidebar = { topic:'commons',drafts:{} };
    assert.equal(load(),true);
    assert.equal(state.outfit,'skirt'); assert.equal(state.gender,'female'); assert.equal(state.gold,87);
    assert.equal(state.hairStyle,9); assert.equal(state.hair,9); assert.equal(state.facialHair,2); assert.equal(state.tieColor,PAL.ties[5]);
    assert.equal(state.sidebar.drafts.agents,'A question about source checks.');
    store.set('lawscape_save_v2',JSON.stringify({schemaVersion:3,gender:'female',gold:120,hairStyle:2,hair:4,upgrades:['wardrobe_rack']}));
    assert.equal(load(),true); assert.equal(state.outfit,'trousers'); assert.equal(state.gold,120);
    assert.equal(state.hairStyle,2); assert.equal(state.hair,4); assert.deepEqual(state.upgrades,['wardrobe_rack']);
    assert.deepEqual(state.sidebar,freshState().sidebar);
    reset(); assert.deepEqual(state.sidebar.drafts,{}); assert.equal(state.facialHair,0);
  } finally { delete globalThis.localStorage; }
});
