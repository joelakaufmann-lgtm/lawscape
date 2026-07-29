// LawScape — main game module. Boots the title flow, runs the world loop
// (click-to-walk, OSRS style), and owns every interaction: the BarMail
// ethics minigame, shops, rest, wardrobe, travel (court is closed), and
// disbarment.

import { state, save, load, hasSave, reset,
         hasUpgrade, maxEthics, healEthics, damageEthics } from './state.js';
import { ZONES } from './world/zones.js';
import { PROPS } from './world/props.js';
import { PAL } from './engine/palette.js';
import { gridToScreen } from './engine/iso.js';
import { WorldRenderer } from './engine/renderer.js';
import { findPath, adjacentTile } from './engine/pathfind.js';
import { Actor } from './entities/actor.js';
import { updateHUD, setZoneName, toast, hoverLabel, drawMinimap } from './ui/hud.js';
import { showDialogue, hideDialogue, dialogueOpen } from './ui/dialogue.js';
import { SCENARIOS, WRONG_DMG, STREAK_HEAL } from './data/ethics.js';
import { OFFICE_UPGRADES, APARTMENT_UPGRADES, bonuses } from './data/upgrades.js';

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// World state
// ---------------------------------------------------------------------------
const canvas = $('world');
const renderer = new WorldRenderer(canvas);

let zone = null;
let player = null;
let npcs = [];
let hover = null;         // { tiles, label, run } — current mouse target
let clickFx = null;       // { x, y, at } — OSRS yellow X on click
let inGame = false;

function currentZone() { return ZONES[state.zone] || ZONES.office; }

function isWalkable(x, y) {
  if (x < 0 || y < 0 || x >= zone.w || y >= zone.h) return false;
  if (zone.tile(x, y) === 'x') return false;
  if (zone.walls && (x === 0 || y === 0)) return false;
  for (const prop of zone.props) {
    if (prop.visible && !prop.visible()) continue;
    const def = PROPS[prop.type];
    if (!def || !def.solid) continue;
    if (x >= prop.x && x < prop.x + def.w && y >= prop.y && y < prop.y + def.h) return false;
  }
  return true;
}

function buildNpcs() {
  npcs = (zone.npcs || []).map((def) => ({
    def,
    actor: new Actor(def.x, def.y, def.look, { npc: def }),
  }));
}

function enterZone(id, pos = null) {
  state.zone = id;
  zone = currentZone();
  const p = pos || zone.spawn;
  state.pos = { x: p.x, y: p.y };
  player.stop();
  player.x = p.x;
  player.y = p.y;
  buildNpcs();
  setZoneName(zone.name);
  updateQuickActions();
  hover = null;
  save();
}

// ---------------------------------------------------------------------------
// Mouse targeting
// ---------------------------------------------------------------------------
function targetAt(mx, my) {
  const g = renderer.screenToWorld(mx, my);
  const tx = Math.round(g.gx), ty = Math.round(g.gy);

  // Tall props and actors extrude up-screen from their footprint, so a click
  // on a body maps to a ground tile "behind" it. Probe the clicked tile plus
  // a couple of tiles down-screen (+1,+1 / +2,+2) to make bodies clickable.
  for (let k = 0; k <= 2; k++) {
    const cx = tx + k, cy = ty + k;

    for (const npc of npcs) {
      if (npc.def.visible && !npc.def.visible()) continue;
      if (npc.actor.tileX === cx && npc.actor.tileY === cy) {
        return {
          tiles: [{ x: cx, y: cy }],
          label: `Talk to ${npc.def.name}`,
          approach: { x: cx, y: cy },
          run: () => talkTo(npc.def),
        };
      }
    }
    for (const prop of zone.props) {
      if (!prop.interact) continue;
      if (prop.visible && !prop.visible()) continue;
      const def = PROPS[prop.type];
      if (!def) continue;
      if (cx >= prop.x && cx < prop.x + def.w && cy >= prop.y && cy < prop.y + def.h) {
        const tiles = [];
        for (let yy = prop.y; yy < prop.y + def.h; yy++)
          for (let xx = prop.x; xx < prop.x + def.w; xx++) tiles.push({ x: xx, y: yy });
        return {
          tiles,
          label: prop.interact.label,
          approach: { x: cx, y: cy },
          run: () => runAction(prop.interact.action),
        };
      }
    }
    for (const portal of zone.portals) {
      if (portal.x === cx && portal.y === cy) {
        return {
          tiles: [{ x: cx, y: cy }],
          label: portal.label,
          walkOnto: true,
          approach: { x: cx, y: cy },
          run: () => openTravelMenu(),
        };
      }
    }
  }
  if (isWalkable(tx, ty)) {
    return { tiles: null, label: null, walkOnto: true, approach: { x: tx, y: ty }, run: null };
  }
  return null;
}

canvas.addEventListener('mousemove', (e) => {
  if (!inGame || overlayOpen()) { hover = null; hoverLabel(null); return; }
  hover = targetAt(e.offsetX, e.offsetY);
  hoverLabel(hover && hover.label, e.offsetX, e.offsetY);
});

canvas.addEventListener('click', (e) => {
  if (!inGame || overlayOpen()) return;
  if (dialogueOpen()) hideDialogue();
  const target = targetAt(e.offsetX, e.offsetY);
  if (!target) return;

  let dest;
  if (target.walkOnto) {
    dest = target.approach;
  } else {
    dest = adjacentTile(isWalkable, zone.w, zone.h,
      target.approach.x, target.approach.y, player.tileX, player.tileY);
  }
  if (!dest) return;

  clickFx = { x: dest.x, y: dest.y, at: performance.now() };
  const run = target.run;

  if (dest.x === player.tileX && dest.y === player.tileY && !player.walking) {
    if (run) run();
    return;
  }
  const path = findPath(isWalkable, zone.w, zone.h, player.tileX, player.tileY, dest.x, dest.y);
  if (!path) { toast("You can't reach that."); return; }
  player.setPath(path, run ? () => run() : null);
});

function overlayOpen() {
  return !$('email').classList.contains('hidden')
      || !$('panel').classList.contains('hidden')
      || !$('gameover').classList.contains('hidden');
}

function moveBy(dx, dy) {
  if (!inGame || overlayOpen() || dialogueOpen() || player.walking) return;
  const dest = { x: player.tileX + dx, y: player.tileY + dy };
  if (!isWalkable(dest.x, dest.y)) return;
  player.setPath([dest]);
}

function updateQuickActions() {
  const mail = $('btn-mail');
  if (!mail) return;
  const inOffice = state.zone === 'office';
  mail.disabled = !inOffice;
  mail.title = inOffice ? 'Open BarMail (B)' : 'BarMail is on your office computer';
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------
function runAction(action) {
  switch (action) {
    case 'email': openEmail(); break;
    case 'shop_office': openShop('Office Upgrades', OFFICE_UPGRADES); break;
    case 'shop_apartment': openShop('Apartment Upgrades', APARTMENT_UPGRADES); break;
    case 'record': openRecord(); break;
    case 'rest': doRest(); break;
    case 'wardrobe': openWardrobe(); break;
    case 'flavor_books':
      showDialogue({
        name: 'Ethics Treatises',
        text: hasUpgrade('subscription')
          ? 'Rows of well-thumbed professional-responsibility treatises. BarMail now shows you which rule each scenario implicates.'
          : 'A mostly empty shelf: a bar directory and one lonely pamphlet, "So You Passed: Now Don’t Get Disbarred." The Ethics Treatise Shelf upgrade would fill this.',
      });
      break;
    case 'flavor_coffee':
      showDialogue({
        name: 'Coffee Machine',
        text: 'It hums with quiet integrity. Streak heals restore +5 extra Ethics while you own it.',
      });
      break;
    default: break;
  }
}

function talkTo(def) {
  if (def.talk === 'partner') {
    const lines = [
      'Check your BarMail, associate. The inbox never sleeps, and neither does the disciplinary judge.',
      'Gold pays the rent. Ethics keeps the license that earns the gold. Lose the second and the first is decor.',
      'Some of my emails are... tests. Some are me on a bad day. Answer the rule, not the sender.',
    ];
    showDialogue({ name: def.name, text: lines[Math.floor(Math.random() * lines.length)] });
  } else if (def.talk === 'paralegal') {
    showDialogue({
      name: def.name,
      text: 'I read everything before it goes out. If you send something truly catastrophic, I’ll soften the blow — that’s why very wrong answers only cost you 15 Ethics now.',
    });
  } else {
    showDialogue({ name: def.name, text: '...' });
  }
}

// ---------------------------------------------------------------------------
// Travel menu — the world beyond is Office, Apartment, and a closed courthouse
// ---------------------------------------------------------------------------
function openTravelMenu() {
  const choices = [];
  if (state.zone !== 'office') {
    choices.push({ label: 'Go to the Law Office', fn: () => enterZone('office') });
  }
  if (state.zone !== 'apartment') {
    choices.push({ label: 'Go to the Apartment', fn: () => enterZone('apartment') });
  }
  choices.push({
    label: 'Go to Court',
    fn: () => showDialogue({
      name: 'Courthouse Doors',
      text: 'The courthouse is CLOSED. A brass sign reads: "Court is not in session. '
        + 'No hearings today, counselor." (Court simulation is planned for a future '
        + 'edition — see ROADMAP.md.)',
      choices: [{ label: 'Head back' }],
    }),
  });
  choices.push({ label: 'Stay here', fn: () => {} });
  showDialogue({
    name: state.zone === 'office' ? 'Leaving the Office' : 'Leaving the Apartment',
    text: 'You step out to the street. Where to?',
    choices,
  });
}

// ---------------------------------------------------------------------------
// BarMail — the ethics email minigame
// ---------------------------------------------------------------------------
let currentScenario = null;

function pickScenario() {
  let pool = SCENARIOS.filter((s) => !state.seen.includes(s.id));
  if (!pool.length) { state.seen = []; pool = SCENARIOS; }
  return pool[Math.floor(Math.random() * pool.length)];
}

function openEmail() {
  currentScenario = pickScenario();
  const s = currentScenario;
  const b = bonuses(state.upgrades);

  $('email-subject').textContent = s.subject;
  $('email-from').textContent = `From: ${s.from} — ${s.role}`;
  $('email-text').textContent = s.body;

  const ruleEl = $('email-rule');
  if (b.showRule) {
    ruleEl.textContent = `⚖ ${s.rule}`;
    ruleEl.classList.remove('hidden');
  } else {
    ruleEl.classList.add('hidden');
  }

  const wrap = $('email-choices');
  wrap.innerHTML = '';
  const shuffled = [...s.choices].sort(() => Math.random() - 0.5);
  for (const choice of shuffled) {
    const btn = document.createElement('button');
    btn.className = 'email-choice';
    btn.textContent = choice.text;
    btn.onclick = () => answerEmail(choice);
    wrap.appendChild(btn);
  }

  $('email-replies').classList.remove('hidden');
  $('email-result').classList.add('hidden');
  $('email').classList.remove('hidden');
  hoverLabel(null);
}

function answerEmail(choice) {
  const s = currentScenario;
  const b = bonuses(state.upgrades);
  const verdictEl = $('email-verdict');
  const explainEl = $('email-explain');
  const deltaEl = $('email-delta');
  let disbarred = false;

  state.casesDone++;
  if (choice.grade === 'correct') {
    const earned = Math.round(s.gold * b.goldMult + b.goldFlat);
    state.gold += earned;
    state.streak++;
    state.correctDone++;
    let healed = 0;
    if (state.streak >= 2) {
      const before = state.ethics;
      healEthics(STREAK_HEAL + b.streakHealBonus);
      healed = state.ethics - before;
    }
    verdictEl.textContent = '✔ Sound professional judgment.';
    verdictEl.className = 'good';
    explainEl.textContent = `${s.rule}. That is the defensible course — engagement decisions, `
      + 'trust money, and candor calls like this one are exactly where licenses are won and lost.';
    deltaEl.innerHTML = `<span class="gain">+${earned} gold</span>`
      + (healed > 0 ? ` &nbsp; <span class="gain">+${healed} Ethics (streak x${state.streak}!)</span>`
                    : ` &nbsp; <span class="muted">streak x${state.streak} — one more for an Ethics heal</span>`);
  } else {
    const dmg = choice.grade === 'very_wrong' ? b.veryWrongDmg : WRONG_DMG;
    state.streak = 0;
    disbarred = damageEthics(dmg);
    verdictEl.textContent = choice.grade === 'very_wrong'
      ? '✖ Serious ethics violation.'
      : '✖ Ethically wrong.';
    verdictEl.className = 'bad';
    explainEl.textContent = `Why you lost Ethics — ${choice.why}`;
    deltaEl.innerHTML = `<span class="loss">−${dmg} Ethics</span> &nbsp; <span class="muted">streak reset</span>`;
  }

  if (!state.seen.includes(s.id)) state.seen.push(s.id);
  updateHUD();
  save();

  $('email-replies').classList.add('hidden');
  $('email-result').classList.remove('hidden');
  $('email-continue').onclick = () => {
    if (disbarred) { closeEmail(); gameOver(); } else { openEmail(); }
  };
  if (disbarred) $('email-continue').textContent = 'Face the Disciplinary Judge';
  else $('email-continue').textContent = 'Next Email';
}

function closeEmail() {
  $('email').classList.add('hidden');
  currentScenario = null;
}
$('email-close').addEventListener('click', closeEmail);

// ---------------------------------------------------------------------------
// Disbarment
// ---------------------------------------------------------------------------
function gameOver() {
  inGame = false;
  $('hud').classList.add('hidden');
  hideDialogue();
  $('gameover').classList.remove('hidden');
}

$('gameover-restart').addEventListener('click', () => {
  $('gameover').classList.add('hidden');
  reset();                       // wipe everything — you keep nothing
  $('title-screen').classList.remove('hidden');
  refreshTitleButtons();
});

// ---------------------------------------------------------------------------
// Shops, record, rest, wardrobe, help
// ---------------------------------------------------------------------------
function openPanel(title) {
  $('panel-title').textContent = title;
  $('panel-tabs').innerHTML = '';
  $('panel-body').innerHTML = '';
  $('panel').classList.remove('hidden');
  hoverLabel(null);
  return $('panel-body');
}
$('panel-close').addEventListener('click', () => $('panel').classList.add('hidden'));

function openShop(title, catalog) {
  const body = openPanel(title);
  for (const u of catalog) {
    const row = document.createElement('div');
    row.className = 'row-item';
    const owned = hasUpgrade(u.id);
    row.innerHTML = `<div class="grow"><h4>${u.name}</h4><p>${u.desc}</p></div>
      <div class="meta">🪙 ${u.cost}</div>`;
    const btn = document.createElement('button');
    btn.className = 'small';
    if (owned) {
      btn.textContent = 'Owned';
      btn.disabled = true;
    } else {
      btn.textContent = 'Buy';
      btn.disabled = state.gold < u.cost;
      btn.onclick = () => {
        if (state.gold < u.cost) return;
        state.gold -= u.cost;
        state.upgrades.push(u.id);
        save();
        updateHUD();
        toast(`Purchased: ${u.name}`);
        openShop(title, catalog);   // re-render with new state
      };
    }
    row.appendChild(btn);
    body.appendChild(row);
  }
}

function openRecord() {
  const body = openPanel('Your Professional Record');
  const acc = state.casesDone ? Math.round((state.correctDone / state.casesDone) * 100) : 0;
  const pronouns = { male: 'he/him', female: 'she/her', nonbinary: 'they/them' }[state.gender] || 'they/them';
  body.innerHTML = `
    <div class="row-item"><div class="grow"><h4>${state.name} (${pronouns})</h4>
      <p>Attorney at law, State of Juris. License status: ${state.ethics > 0 ? 'ACTIVE' : 'REVOKED'}</p></div></div>
    <div class="row-item"><div class="grow"><h4>Scenarios answered</h4></div><div class="meta">${state.casesDone}</div></div>
    <div class="row-item"><div class="grow"><h4>Answered correctly</h4></div><div class="meta">${state.correctDone} (${acc}%)</div></div>
    <div class="row-item"><div class="grow"><h4>Current streak</h4></div><div class="meta">x${state.streak}</div></div>
    <div class="row-item"><div class="grow"><h4>Gold</h4></div><div class="meta">🪙 ${Math.floor(state.gold)}</div></div>
    <div class="row-item"><div class="grow"><h4>Ethics</h4></div><div class="meta">⚖ ${state.ethics}/${maxEthics()}</div></div>
    <div class="row-item"><div class="grow"><h4>Upgrades owned</h4></div><div class="meta">${state.upgrades.length}</div></div>`;
}

function doRest() {
  const b = bonuses(state.upgrades);
  const since = Date.now() - state.lastRestAt;
  if (since < b.restCooldownMs) {
    const wait = Math.ceil((b.restCooldownMs - since) / 1000);
    toast(`You're not tired yet. Rest again in ${wait}s.`);
    return;
  }
  if (state.ethics >= maxEthics()) {
    toast('Your conscience is already spotless. (Ethics is full.)');
    return;
  }
  state.lastRestAt = Date.now();
  const before = state.ethics;
  healEthics(b.restHeal);
  save();
  updateHUD();
  toast(`You rest and reflect on your professional obligations. +${state.ethics - before} Ethics.`);
}

function openWardrobe() {
  if (!hasUpgrade('wardrobe_rack')) {
    toast('A single suit hangs here. The Wardrobe Rack upgrade unlocks more colors.');
    return;
  }
  const names = ['Navy', 'Charcoal', 'Burgundy', 'Archive Green', 'Oak Brown'];
  showDialogue({
    name: 'Wardrobe',
    text: 'Pick a suit. Dress for the discipline hearing you never want to attend.',
    choices: PAL.suits.map((c, i) => ({
      label: names[i] || c,
      fn: () => { state.suitColor = c; player.look.suit = c; save(); toast(`Suited up in ${names[i] || c}.`); },
    })),
  });
}

function openHelp() {
  const body = openPanel('How LawScape Works');
  body.innerHTML = `
    <div class="help-lede">Your first goal: open <b>BarMail</b>, answer an ethics dilemma, and earn your first gold.</div>
    <div class="row-item"><div class="grow"><h4>💻 BarMail</h4>
      <p>Click your office computer or use the BarMail quick action. Partners and clients send
      requests — many of them unethical. Choose your reply.</p></div></div>
    <div class="row-item"><div class="grow"><h4>🖱 Movement</h4>
      <p>Click or tap a floor tile to walk. You can also use WASD or the arrow keys. Select
      a highlighted person or object to walk over and interact.</p></div></div>
    <div class="row-item"><div class="grow"><h4>🪙 Gold</h4>
      <p>Correct answers earn gold. Spend it on office and apartment upgrades (filing cabinet
      in the office, furniture catalog at home).</p></div></div>
    <div class="row-item"><div class="grow"><h4>⚖ Ethics Bar</h4>
      <p>Wrong answers damage your Ethics — the game explains the violated rule every time.
      Two correct answers in a row start healing it. Resting in your bed helps too.</p></div></div>
    <div class="row-item"><div class="grow"><h4>☠ Disbarment</h4>
      <p>Ethics at zero = YOU GOT DISBARRED — GAME OVER. You restart from nothing: no gold,
      no items, no upgrades.</p></div></div>
    <div class="row-item"><div class="grow"><h4>🏛 Court</h4>
      <p>Closed for now — court simulation is on the roadmap (ROADMAP.md).</p></div></div>`;
}

$('btn-help').addEventListener('click', openHelp);
$('btn-mail').addEventListener('click', () => {
  if (state.zone === 'office') openEmail();
  else toast('Your secure BarMail terminal is at the office.');
});
$('btn-record').addEventListener('click', openRecord);
$('btn-travel').addEventListener('click', openTravelMenu);

document.addEventListener('keydown', (event) => {
  const target = event.target;
  const typing = target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement;
  if (typing) return;

  if (event.key === 'Escape') {
    if (!$('email').classList.contains('hidden')) closeEmail();
    else if (!$('panel').classList.contains('hidden')) $('panel').classList.add('hidden');
    else if (dialogueOpen()) hideDialogue();
    return;
  }

  if (!inGame || event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key.toLowerCase();
  const moves = {
    arrowup: [0, -1], w: [0, -1],
    arrowdown: [0, 1], s: [0, 1],
    arrowleft: [-1, 0], a: [-1, 0],
    arrowright: [1, 0], d: [1, 0],
  };
  if (moves[key]) {
    event.preventDefault();
    moveBy(...moves[key]);
  } else if (key === 'b' && state.zone === 'office' && !overlayOpen()) {
    openEmail();
  } else if (key === 'r' && !overlayOpen()) {
    openRecord();
  } else if (key === 't' && !overlayOpen()) {
    openTravelMenu();
  } else if ((key === 'h' || key === '?') && !overlayOpen()) {
    openHelp();
  }
});

// ---------------------------------------------------------------------------
// Title flow + attorney creator
// ---------------------------------------------------------------------------
function refreshTitleButtons() {
  $('btn-continue').classList.toggle('hidden', !hasSave());
  $('btn-reset').classList.toggle('hidden', !hasSave());
}

const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'nonbinary', label: 'Non-binary' },
];
const HAIR_STYLES = ['Short', 'Long', 'Ponytail', 'Bun', 'Curly', 'Bald'];

let pick = { suit: PAL.suits[0], gender: 'nonbinary', skin: 1, hairColor: 0, hairStyle: 0, eye: 0 };

function swatchRow(el, colors, selectedIdx, onPick, round = false) {
  el.innerHTML = '';
  colors.forEach((c, i) => {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'swatch' + (round ? ' round' : '') + (selectedIdx === i ? ' selected' : '');
    sw.style.background = c;
    sw.setAttribute('aria-label', `${el.getAttribute('aria-label') || 'Color'} option ${i + 1}`);
    sw.setAttribute('aria-pressed', selectedIdx === i ? 'true' : 'false');
    sw.onclick = () => onPick(i);
    el.appendChild(sw);
  });
}

function pillRow(el, labels, isSelected, onPick) {
  el.innerHTML = '';
  labels.forEach((label, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pill' + (isSelected(i) ? ' selected' : '');
    b.textContent = label;
    b.setAttribute('aria-pressed', isSelected(i) ? 'true' : 'false');
    b.onclick = () => onPick(i);
    el.appendChild(b);
  });
}

function pickLook() {
  return {
    suit: pick.suit, gender: pick.gender, skin: pick.skin,
    hair: pick.hairColor, hairStyle: pick.hairStyle, eye: pick.eye,
  };
}

function drawCreatorPreview() {
  const canvas = $('c-preview');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const model = new Actor(0, 0, pickLook());
  ctx.save();
  ctx.scale(2.4, 2.4);
  model.draw(ctx, canvas.width / 4.8, 66, 0, true);
  ctx.restore();
}

function buildCreator() {
  pillRow($('c-gender'), GENDERS.map((g) => g.label),
    (i) => GENDERS[i].id === pick.gender,
    (i) => { pick.gender = GENDERS[i].id; buildCreator(); });
  pillRow($('c-hairstyles'), HAIR_STYLES,
    (i) => pick.hairStyle === i,
    (i) => { pick.hairStyle = i; buildCreator(); });
  swatchRow($('c-skins'), PAL.skin, pick.skin,
    (i) => { pick.skin = i; buildCreator(); });
  swatchRow($('c-haircolors'), PAL.hair, pick.hairColor,
    (i) => { pick.hairColor = i; buildCreator(); });
  swatchRow($('c-eyes'), PAL.eyes, pick.eye,
    (i) => { pick.eye = i; buildCreator(); }, true);
  swatchRow($('c-suits'), PAL.suits, PAL.suits.indexOf(pick.suit),
    (i) => { pick.suit = PAL.suits[i]; buildCreator(); });
  drawCreatorPreview();
}

$('btn-new').addEventListener('click', () => {
  $('title-screen').classList.add('hidden');
  buildCreator();
  $('creator').classList.remove('hidden');
});

$('btn-creator-back').addEventListener('click', () => {
  $('creator').classList.add('hidden');
  $('title-screen').classList.remove('hidden');
});

$('btn-continue').addEventListener('click', () => {
  if (!load()) return;
  $('title-screen').classList.add('hidden');
  startGame();
});

$('btn-reset').addEventListener('click', () => {
  reset();
  refreshTitleButtons();
  toast('Save wiped. A fresh start awaits.');
});

$('btn-start').addEventListener('click', () => {
  reset();
  state.name = $('c-name').value.trim() || 'Alex Barrister';
  state.gender = pick.gender;
  state.suitColor = pick.suit;
  state.skin = pick.skin;
  state.hair = pick.hairColor;
  state.hairStyle = pick.hairStyle;
  state.eye = pick.eye;
  save();
  $('creator').classList.add('hidden');
  startGame();
});

function startGame() {
  player = new Actor(state.pos.x, state.pos.y,
    { suit: state.suitColor, gender: state.gender, skin: state.skin,
      hair: state.hair, hairStyle: state.hairStyle, eye: state.eye }, { speed: 4 });
  zone = currentZone();
  if (!isWalkable(player.tileX, player.tileY)) {
    state.pos = { ...zone.spawn };
    player.x = zone.spawn.x;
    player.y = zone.spawn.y;
  }
  buildNpcs();
  setZoneName(zone.name);
  updateQuickActions();
  updateHUD();
  $('hud').classList.remove('hidden');
  inGame = true;
  if (state.casesDone === 0) {
    showDialogue({
      name: 'Marcus Hargrove, Senior Partner',
      text: `Welcome to the firm, ${state.name}. Your inbox is on the computer — BarMail. `
        + 'Answer well and the gold flows. Answer badly and the Ethics bar drops. '
        + 'At zero, the Bar takes your license. No pressure.',
      choices: [{ label: 'Understood.' }],
    });
  }
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------
let lastT = performance.now();
let rafId = 0, fallbackId = 0;

// Schedule the next frame via rAF, with a timer fallback so the game keeps
// running (at reduced rate) when the tab is occluded and rAF is suspended.
function schedule() {
  rafId = requestAnimationFrame(loop);
  fallbackId = setTimeout(() => {
    cancelAnimationFrame(rafId);
    loop(performance.now());
  }, 100);
}

function loop(now) {
  clearTimeout(fallbackId);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;

  if (inGame) {
    player.update(dt);
    state.pos = { x: player.tileX, y: player.tileY };
    const t = now / 1000;
    renderer.render(zone, player, npcs, hover, t);
    drawClickFx(now);
    drawMinimap(zone, player, isWalkable);
    updateHUD();
  }
  schedule();
}

// OSRS-style yellow X where you clicked, fading out.
function drawClickFx(now) {
  if (!clickFx) return;
  const age = now - clickFx.at;
  if (age > 500) { clickFx = null; return; }
  const ctx = renderer.ctx;
  const s = gridToScreen(clickFx.x, clickFx.y);
  const a = 1 - age / 500;
  ctx.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);
  ctx.translate(renderer.cam.x, renderer.cam.y);
  ctx.strokeStyle = `rgba(255,222,0,${a})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x - 7, s.y - 5); ctx.lineTo(s.x + 7, s.y + 5);
  ctx.moveTo(s.x + 7, s.y - 5); ctx.lineTo(s.x - 7, s.y + 5);
  ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

window.addEventListener('beforeunload', () => { if (inGame) save(); });

refreshTitleButtons();
document.documentElement.dataset.lawscapeReady = 'true';
schedule();

// Debug hook (harmless in production; used by tests).
window.LS = {
  get state() { return state; },
  get player() { return player; },
  get zone() { return zone; },
  targetAt, isWalkable, renderer,
  get inGame() { return inGame; },
};
