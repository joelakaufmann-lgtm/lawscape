import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { CANADA_PACK, CANADA_SCENARIOS, CANADA_DIGEST } from '../js/data/canada.js';
import { SCENARIOS } from '../js/data/ethics.js';
import { practiceInbox, scenarioMatchesPack } from '../js/data/mail.js';
import { freshState, state, load, save, reset } from '../js/state.js';
import { canadaProgress, saveCanadaDraft, commitCanadaEmail, normalizeCanadaProgress } from '../js/canada.js';

test('Canada content has 25 distinct questions, five complete emails and reachable authority references', async () => {
  const raw=await readFile(new URL('../canada-test/pack.json',import.meta.url),'utf8');
  assert.equal(createHash('sha256').update(raw).digest('hex'),CANADA_DIGEST);
  assert.equal(CANADA_PACK.questions.length,25); assert.equal(CANADA_PACK.emails.length,5);
  const all=[...CANADA_PACK.questions,...CANADA_PACK.emails];
  assert.equal(new Set(all.map(x=>x.id)).size,30);
  for(const group of ['ON','REF','REC','SK','UND']) assert.equal(CANADA_PACK.questions.filter(q=>q.group===group).length,5);
  for(const item of all) {
    assert.ok(item.jurisdiction && item.forum && item.practitionerRole && item.status.includes('review'));
    for(const id of item.ruleIds) {
      const rule=CANADA_PACK.rules.find(r=>r.id===id); assert.ok(rule?.summary && rule?.limits);
      for(const ref of rule.sourceRefs) assert.ok(CANADA_PACK.sources.some(s=>s.id===ref.id) && ref.locator);
    }
  }
  for(const q of CANADA_PACK.questions) {
    assert.equal(q.options.length,4); assert.equal(new Set(q.options.map(o=>o.id)).size,4);
    assert.equal(q.options.filter(o=>o.id===q.answer).length,1);
    assert.ok(q.options.every(o=>o.text && o.explanation));
  }
  for(const email of CANADA_PACK.emails) {
    assert.equal(email.rubric.reduce((n,r)=>n+r.points,0),10);
    assert.ok(email.records.length>=3 && email.criticalIssues.length && email.acceptableAlternatives.length);
    const words=email.sampleResponse.split(/\s+/).length; assert.ok(words>=100 && words<=200,`${email.id}: ${words} words`);
  }
});
test('Canada is a full pack: tiered like every pack, in Mixed practice, isolated from the other jurisdictions',()=>{
  const all=[...SCENARIOS,...CANADA_SCENARIOS];
  assert.ok(CANADA_SCENARIOS.every(q=>q.sourceType==='canada-style'&&!q.isTestPack&&[35,45,60].includes(q.gold)));
  for(const [casesDone,expected] of [[0,6],[5,14],[12,5],[100,5]]) {
    const p={...freshState(),practicePack:'canada',casesDone};
    assert.equal(practiceInbox(p,all).unread.length,expected);
    const mixed=practiceInbox({...freshState(),practicePack:'mixed',casesDone},all);
    assert.ok(mixed.unread.some(q=>q.sourceType==='canada-style'),'Canada appears in Mixed');
    for(const pack of ['ca','ny','sqe','mpre','juris']) assert.ok(CANADA_SCENARIOS.every(q=>!scenarioMatchesPack(q,pack)));
    assert.ok(CANADA_SCENARIOS.every(q=>scenarioMatchesPack(q,'mixed')&&scenarioMatchesPack(q,'canada')));
    assert.ok(SCENARIOS.every(q=>!scenarioMatchesPack(q,'canada')));
  }
});
test('email commits preserve originals, remain ungraded and survive revisions without rewards',()=>{
  const p=freshState(),id=CANADA_PACK.emails[0].id;
  assert.throws(()=>commitCanadaEmail(p,id),/Write/);
  saveCanadaDraft(p,id,'Original reply'); const original=commitCanadaEmail(p,id,10);
  assert.equal(original.proseAssessed,false); assert.equal(p.gold,0); assert.equal(p.ethics,100);
  saveCanadaDraft(p,id,'Original reply'); assert.equal(commitCanadaEmail(p,id,11),original);
  saveCanadaDraft(p,id,'Revised reply'); commitCanadaEmail(p,id,12);
  assert.equal(p.canada.emailAttempts.length,2);assert.equal(original.text,'Original reply');
  p.runStatus='ended'; assert.throws(()=>commitCanadaEmail(p,id),/ended/);
});
test('old saves migrate, Canada selections persist, and changed content archives rather than regrades',()=>{
  const entries=new Map();globalThis.localStorage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)};
  try {
    const legacy={...freshState(),gold:432,ethics:62,practicePack:'canada-test'};delete legacy.canada;
    entries.set('lawscape_save_v2',JSON.stringify(legacy));assert.equal(load(),true);
    assert.equal(state.practicePack,'canada','the pre-0.8.0 pack id maps to the full pack');
    saveCanadaDraft(state,CANADA_PACK.emails[0].id,'Saved draft');
    assert.equal(save(),true);assert.equal(load(),true);assert.equal(state.practicePack,'canada');assert.equal(state.gold,432);assert.equal(state.ethics,62);
    assert.equal(state.canada.drafts[CANADA_PACK.emails[0].id],'Saved draft');
    assert.equal('questionAttempts' in state.canada,false,'questions now use the shared seen list');
    const prior={...state.canada,digest:'older-content'};const next=normalizeCanadaProgress(prior);
    assert.deepEqual(next.drafts,{});assert.equal(next.archives.length,1);assert.equal(next.archives[0].drafts[CANADA_PACK.emails[0].id],'Saved draft');
    globalThis.localStorage.setItem=()=>{throw new Error('quota');};assert.equal(save(),false);
    reset();assert.deepEqual(canadaProgress(state).drafts,{});
  } finally {delete globalThis.localStorage;}
});
test('downloaded source receipts match the exact original bytes',async()=>{
  const receipt=JSON.parse(await readFile(new URL('../canada-test/sources/receipt.json',import.meta.url),'utf8'));
  assert.equal(receipt.length,5);
  for(const source of receipt) {
    const bytes=await readFile(new URL('../canada-test/sources/'+source.file,import.meta.url));
    assert.equal(bytes.length,source.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
  }
});
