import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, state, save, load, reset, damageEthics } from '../js/state.js';
import { BAR_DRINKS, orderBarDrink, movementMultiplier, archiveDisbarredRun, readBillableBoard } from '../js/lounge.js';
import { canAccessBarMail, practiceInbox, billableMessageOpen } from '../js/data/mail.js';
import { SCENARIOS } from '../js/data/ethics.js';
import { OFFICE_UPGRADES, APARTMENT_UPGRADES } from '../js/data/upgrades.js';
import { ZONES } from '../js/world/zones.js';
import { PROPS } from '../js/world/props.js';
import { Actor } from '../js/entities/actor.js';

function storage() {
  const map = new Map([['lawscape_billable_board_v1','[]']]);
  globalThis.localStorage={getItem:(k)=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:(k)=>map.delete(k)};
  return map;
}

test('Sidebar alcohol costs no Ethics, slows for 40 seconds and cannot be ordered elsewhere',()=>{
  const player=freshState();player.gold=20;
  assert.throws(()=>orderBarDrink(player,'ale',1000),/Sidebar/);
  player.zone='sidebar';const ethics=player.ethics;
  for(const drink of BAR_DRINKS.filter((item)=>item.slows)) {
    orderBarDrink(player,drink.id,1000);
    assert.equal(player.ethics,ethics);assert.equal(movementMultiplier(player,40999),.5);assert.equal(movementMultiplier(player,41000),1);
  }
  orderBarDrink(player,'ale',10000);assert.equal(player.slowUntil,50000);
  const gold=player.gold;orderBarDrink(player,'water',12000);assert.equal(player.gold,gold);assert.equal(player.slowUntil,50000);
  player.gold=0;assert.throws(()=>orderBarDrink(player,'wine'),/gold/);
  player.apprenticeship.attempts.push({status:'pending'});assert.throws(()=>orderBarDrink(player,'water'),/partner/);
  player.apprenticeship.attempts=[];player.runStatus='ended';assert.throws(()=>orderBarDrink(player,'water'),/active run/);
});

test('work phone replaces the old office upgrade without losing progression, and slow effects survive reload',()=>{
  const store=storage();
  try {
    store.set('lawscape_save_v2',JSON.stringify({schemaVersion:4,zone:'sidebar',upgrades:['office_window','work_phone','monitor'],gold:444,ethics:90,billableStudyMs:60000,slowUntil:Date.now()+40000}));
    assert.equal(load(),true);assert.equal(state.schemaVersion,5);assert.deepEqual(state.upgrades,['work_phone','monitor']);
    assert.equal(state.gold,444);assert.equal(state.billableStudyMs,60000);assert.equal(movementMultiplier(state),.5);
    assert.equal(canAccessBarMail(state),true);
    assert.equal(OFFICE_UPGRADES.find((item)=>item.id==='work_phone').cost,2000);
    for(const zone of Object.keys(ZONES)) {
      assert.equal(canAccessBarMail({...freshState(),zone}),zone==='office');
      assert.equal(canAccessBarMail({...freshState(),zone,upgrades:['work_phone']}),true);
    }
    save();assert.equal(load(),true);assert.equal(movementMultiplier(state),.5);
  } finally { delete globalThis.localStorage; }
});

test('a terminal run is archived once, sorted into a bounded board, and its score survives the character wipe',()=>{
  const store=storage();
  try {
    reset();state.name='One run';state.gold=150;state.billableStudyMs=60000;
    assert.equal(archiveDisbarredRun(state,1).recorded,false);
    damageEthics(100);assert.equal(archiveDisbarredRun(state,2).recorded,true);
    assert.equal(archiveDisbarredRun(state,3).duplicate,true);reset();
    assert.equal(state.gold,0);assert.equal(state.billableStudyMs,0);assert.deepEqual(state.upgrades,[]);
    assert.equal(readBillableBoard().length,1);assert.equal(readBillableBoard()[0].name,'One run');
    for(let i=0;i<14;i++) archiveDisbarredRun({...freshState(),ethics:0,runStatus:'ended',name:`Run ${i}`,billableStudyMs:i*1000},i+10);
    const board=readBillableBoard();assert.equal(board.length,10);assert.equal(board[0].billableMs,60000);
    assert.ok(board.every((item,i)=>!i||board[i-1].billableMs>=item.billableMs));
    store.set('lawscape_billable_board_v1','[null,{"runId":"broken"}]');assert.deepEqual(readBillableBoard(),[]);
    localStorage.setItem=()=>{throw new Error('quota');};
    const result=archiveDisbarredRun({...freshState(),ethics:0,billableStudyMs:80000},40);
    assert.equal(result.recorded,true);assert.equal(result.persisted,false);
    assert.equal(readBillableBoard()[0].billableMs,80000, 'quota failures must preserve the session entry even if reading old storage succeeds');
    localStorage.getItem=()=>{throw new Error('blocked');};assert.equal(readBillableBoard()[0].billableMs,80000);
  } finally { delete globalThis.localStorage; }
});

test('practice inbox exposes source subjects, filters packs, excludes answered mail and counts only open messages',()=>{
  const player=freshState();player.practicePack='mpre';
  const first=practiceInbox(player,SCENARIOS);assert.ok(first.unread.length);assert.ok(first.unread.every((item)=>item.sourceType==='mpre-style'&&item.subject));
  player.seen.push(first.unread[0].id);assert.equal(practiceInbox(player,SCENARIOS).unread.some((item)=>item.id===first.unread[0].id),false);
  player.practicePack='sqe';assert.ok(practiceInbox(player,SCENARIOS).unread.every((item)=>item.sourceType==='sqe-style'));
  const active={inGame:true,visible:true,mailOpen:true,messageOpen:true};assert.equal(billableMessageOpen(active),true);
  for(const key of Object.keys(active))assert.equal(billableMessageOpen({...active,[key]:false}),false);
});

test('detailed furniture and robot characters render valid geometry with and without upgrades',()=>{
  const original=state.upgrades;let depth=0,draws=0;
  const ctx=new Proxy({}, {
    get:(_target,key)=>(...args)=>{
      if(key==='save')depth++;if(key==='restore'){depth--;assert.ok(depth>=0);}
      for(const number of args.flat())if(typeof number==='number')assert.ok(Number.isFinite(number),`${key}: invalid geometry`);
      draws++;
    },
    set:(_target,key,value)=>{if(key==='fillStyle'||key==='strokeStyle')assert.equal(typeof value,'string',`${key}: missing color`);return true;},
  });
  try {
    for(const upgrades of [[],[...OFFICE_UPGRADES,...APARTMENT_UPGRADES].map((item)=>item.id)]) {
      state.upgrades=upgrades;
      for(const zone of Object.values(ZONES))for(const prop of zone.props){PROPS[prop.type].draw(ctx,0,0,prop,.5);assert.equal(depth,0,prop.type);}
      new Actor(0,0,{robotButler:true}).draw(ctx,0,0,.5);assert.equal(depth,0);
    }
    assert.ok(draws>5000);
  }finally{state.upgrades=original;}
});
