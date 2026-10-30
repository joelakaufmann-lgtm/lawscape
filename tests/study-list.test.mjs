import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState } from '../js/state.js';
import { ALL_MAIL_SCENARIOS } from '../js/data/mail.js';
import { missedScenarios, buildStudyList } from '../js/study-list.js';
import { actorDepth } from '../js/engine/renderer.js';
import { ZONES } from '../js/world/zones.js';

test('the study list renders newest-first Markdown with the chosen and preferred replies', () => {
  const p = freshState(); p.name = 'Jordan Case';
  const [a, b] = ALL_MAIL_SCENARIOS.filter((s) => s.choices.some((c) => c.grade !== 'correct')).slice(0, 2);
  const wrongA = a.choices.findIndex((c) => c.grade !== 'correct'), wrongB = b.choices.findIndex((c) => c.grade !== 'correct');
  p.missed = [{ id: a.id, choiceIndex: wrongA, at: 1 }, { id: 'gone', choiceIndex: 0, at: 2 }, { id: b.id, choiceIndex: wrongB, at: 3 }];
  assert.deepEqual(missedScenarios(p, ALL_MAIL_SCENARIOS).map((item) => item.scenario.id), [b.id, a.id], 'unknown ids are skipped, newest first');
  const md = buildStudyList(p, ALL_MAIL_SCENARIOS, Date.UTC(2026, 9, 30));
  assert.match(md, /^# LawScape study list — Jordan Case/);
  assert.match(md, /2 questions to review · exported 2026-10-30/);
  assert.ok(md.indexOf(`## 1. ${b.subject}`) < md.indexOf(`## 2. ${a.subject}`));
  assert.match(md, new RegExp(`\\*\\*Your reply:\\*\\* ${a.choices[wrongA].text.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(md, new RegExp(`\\*\\*Preferred reply:\\*\\* ${a.choices.find((c) => c.grade === 'correct').text.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(md, /\*\*Rule:\*\*/);
  assert.match(buildStudyList(freshState(), ALL_MAIL_SCENARIOS, 0), /0 questions to review/);
});

test('a figure seated inside a solid prop footprint draws after that prop', () => {
  const apartment = ZONES.apartment;
  const sofa = apartment.props.find((prop) => prop.type === 'sofa');
  const sofaDepth = (sofa.x + 2 - 1) + (sofa.y + 1 - 1) - 0.1;
  assert.ok(actorDepth(apartment, { x: 4.5, y: 5 }) < sofaDepth, 'without the sofa visible the figure keeps its own depth');
  const visible = apartment.props.map((prop) => prop === sofa ? { ...prop, visible: () => true } : prop);
  assert.ok(actorDepth({ ...apartment, props: visible }, { x: 4.5, y: 5 }) > sofaDepth, 'on the couch the figure draws over it');
  assert.equal(actorDepth(apartment, { x: 4, y: 7 }), 11, 'open floor keeps x + y');
  const office = ZONES.office;
  const chair = office.props.find((prop) => prop.type === 'officechair' && prop.x === 1);
  assert.ok(actorDepth(office, { x: 1, y: 9 }) > (chair.x + chair.y - 0.1), 'Liz draws over her chair');
});
