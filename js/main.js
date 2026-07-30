// LawScape — main game module. Boots the title flow, runs the world loop
// (click-to-walk, OSRS style), and owns every interaction: the BarMail
// ethics minigame, document review, shops, rest, rule research, travel, and
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
import { SCENARIOS, STREAK_HEAL } from './data/ethics.js';
import { OFFICE_UPGRADES, APARTMENT_UPGRADES, bonuses } from './data/upgrades.js';
import { RULE_LIBRARY } from './data/rules.js';
import {
  COFFEE_ETHICS_RESTORE,
  APARTMENT_FOOD_COST,
  RAMEN_ETHICS_RESTORE,
  COOKED_MEAL_ETHICS_RESTORE,
  DOC_REVIEW_CYCLE_MS,
  DOC_REVIEW_REWARD,
  LINDA_TIP_COST,
  RILEY_HINT_COST,
  WHISKEY_ETHICS_DAMAGE,
  WHISKEY_SLOW_MS,
  MONEYBAGS_SAFE_GOLD,
  MONEYBAGS_ETHICS_DAMAGE,
  MONEYBAGS_GRACE_PURCHASES,
  LAWYER_ASSISTANCE_PHONE,
  LAWYER_ASSISTANCE_URL,
  formatBillableTime,
  moneybagsAuditTriggered,
  rileyHintEligible,
  wrongAnswerDamage,
} from './data/work.js';
import {
  GAME_VERSION,
  HR_CATEGORIES,
  findHrCategory,
  hrIssueUrl,
  hrReportText,
} from './data/feedback.js';

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
const docReview = { active: false, cycleStartedAt: 0 };
const PLAYER_BASE_SPEED = 4;
let whiskeySlowUntil = 0;
let watchReturnPos = null;
let billableUnsavedMs = 0;

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
  if (docReview.active) stopDocumentReview(false);
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
          run: () => portal.to
            ? enterZone(portal.to, portal.dest || null)
            : openTravelMenu(),
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
  if (docReview.active) {
    stopDocumentReview();
    toast('Document review stopped. Click again to move.');
    return;
  }
  if (player.activity === 'watching') stopWatchingTV();
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
  if (!inGame || overlayOpen() || dialogueOpen() || player.walking || docReview.active) return;
  if (player.activity === 'watching') stopWatchingTV();
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
    case 'doc_review': startDocumentReview(); break;
    case 'rules': openRuleLibrary(); break;
    case 'shop_office': openShop('Office Upgrades', OFFICE_UPGRADES); break;
    case 'shop_apartment': openShop('Apartment Upgrades', APARTMENT_UPGRADES); break;
    case 'record': openRecord(); break;
    case 'rest': doRest(); break;
    case 'wardrobe': openWardrobe(); break;
    case 'flavor_coffee':
      drinkCoffee();
      break;
    case 'eat_ramen': eatApartmentFood('Ramen Noodles', RAMEN_ETHICS_RESTORE); break;
    case 'cook_meal': eatApartmentFood('Home-Cooked Meal', COOKED_MEAL_ETHICS_RESTORE); break;
    case 'watch_tv': watchTV(); break;
    case 'whiskey': offerWhiskey(); break;
    case 'moneybags_safe': openMoneybagsSafe(); break;
    default: break;
  }
}

function talkTo(def) {
  if (def.talk === 'jim') {
    const lines = [
      'Jim reminds you of his email that said “pls fix.”',
      'Jim is on a client call.',
      'Jim Hardsell does not look up from his work.',
    ];
    showDialogue({ name: def.name, text: lines[Math.floor(Math.random() * lines.length)] });
  } else if (def.talk === 'linda') {
    talkToLinda(def);
  } else if (def.talk === 'secretary') {
    if (state.moneybagsStolen) {
      showDialogue({
        name: def.name,
        text: 'Mr. Moneybags called about his gold coins. He says Jim’s safe is short. '
          + 'Mr. Hardsell told me not to put that in writing.',
      });
      return;
    }
    const lines = lizLines();
    showDialogue({ name: def.name, text: lines[Math.floor(Math.random() * lines.length)] });
  } else if (def.talk === 'paralegal') {
    const lines = [
      'I would read the treatises again if I were you.',
      'I read everything before it goes out. While I am on the team, wrong answers cost half as much Ethics.',
      'If you own the Ethics Treatise Shelf, I can research a relevant-rule hint for 100 gold.',
    ];
    showDialogue({
      name: def.name,
      text: lines[Math.floor(Math.random() * lines.length)],
    });
  } else {
    showDialogue({ name: def.name, text: '...' });
  }
}

function lizLines() {
  const paralegal = hasUpgrade('paralegal');
  const windowOwned = hasUpgrade('office_window');
  const chair = hasUpgrade('liz_chair');
  const plants = hasUpgrade('houseplants');
  const artwork = hasUpgrade('artwork');
  const improvedOffice = paralegal && windowOwned;
  const lines = [
    'You have emails to answer and documents to review.',
    'Mr. Johnson called regarding his case.',
    'Did you read Mr. Hardsell’s email?',
    'Can you help me? All Mr. Hardsell’s email said was “plz fix.”',
    'If something is broken — the printer or the game itself — Email HR from BarMail. HR has not replied since 1987, but the developers do.',
  ];

  if (!improvedOffice) lines.push('Get back to work.');
  if (!paralegal) lines.push('We should hire a paralegal.');
  if (!chair) lines.push('I sure wish I could sit down.', 'I can’t wait to go home.');
  if (plants) {
    lines.push('Can you please water the plants?', 'These plants help make this place feel like less of a prison.');
  }
  if (artwork) lines.push('This beautiful painting sure does add to the warmth of this office.');
  if (improvedOffice) {
    lines.push('Hello, how are you?', 'I’m proud of the work we do for our clients.');
  }
  return lines;
}

const ETHICS_TIPS = [
  'Client consent to a conflict usually must be informed and confirmed in writing. A signature without an explanation of material risks is not enough.',
  'Advance fees belong in trust until earned. Calling money “nonrefundable” does not transform unearned money into the firm’s property.',
  'Confidentiality is broader than attorney-client privilege. Do not use the two concepts as synonyms.',
  'With an unrepresented person whose interests may conflict with your client’s, the safest legal advice is: get your own lawyer.',
  'Candor to the tribunal can require correcting a false statement even when correction hurts the client’s position.',
  'A subordinate lawyer remains responsible for a clear ethics violation even when a supervisor ordered it.',
  'Reporting misconduct requires a substantial question about honesty, trustworthiness, or fitness—not every technical rule violation.',
  'When client and third-party claims to funds conflict, keep the disputed portion separate while promptly releasing any undisputed portion.',
];

function lindaAside() {
  const lines = [
    'I sure could use a vacation.',
    'I used to think making partner meant fewer emails.',
    'If anyone asks, this is my third cup of tea, not my fifth.',
  ];
  if (!hasUpgrade('office_window')) {
    lines.push('I asked Mr. Hardsell if we could get you a window, but he said no. Sorry.');
  }
  return lines[Math.floor(Math.random() * lines.length)];
}

function talkToLinda(def) {
  if (state.moneybagsStolen) {
    showDialogue({
      name: def.name,
      text: 'Linda lowers her voice. “Mr. Moneybags called about his gold coins. '
        + 'Jim told me not to worry about it, which made me worry about it.”',
    });
    return;
  }
  const aside = lindaAside();
  if (!hasUpgrade('paralegal')) {
    showDialogue({
      name: def.name,
      text: `Linda says, “${aside}” She barely looks up. `
        + '“My advice? Hire Riley Readsalot. Then come back if you still need an ethics tip.”',
    });
    return;
  }
  if (state.gold < LINDA_TIP_COST) {
    showDialogue({
      name: def.name,
      text: `Linda says, “${aside}” She keeps typing. “I am extremely busy. `
        + `Come back with ${LINDA_TIP_COST} gold if you want an ethics tip.”`,
    });
    return;
  }
  showDialogue({
    name: def.name,
    text: `Linda says, “${aside}” She glances at the clock. “I do not have time to chat. `
      + `${LINDA_TIP_COST} gold buys one concise ethics tip.”`,
    choices: [
      {
        label: `Pay ${LINDA_TIP_COST} gold for a tip`,
        fn: () => {
          if (state.gold < LINDA_TIP_COST) return;
          state.gold -= LINDA_TIP_COST;
          state.tipsPurchased++;
          save();
          updateHUD();
          const tip = ETHICS_TIPS[Math.floor(Math.random() * ETHICS_TIPS.length)];
          showDialogue({ name: 'Linda Firestone — Ethics Tip', text: tip });
        },
      },
      { label: 'Let her work' },
    ],
  });
}

// ---------------------------------------------------------------------------
// Travel menu — the world beyond is the office complex, apartment, and court
// ---------------------------------------------------------------------------
function openTravelMenu() {
  if (docReview.active) stopDocumentReview(false);
  const choices = [];
  if (state.zone !== 'office') {
    choices.push({ label: 'Go to the Law Office', fn: () => enterZone('office') });
  }
  if (state.zone !== 'apartment') {
    choices.push({ label: 'Go to the Apartment', fn: () => enterZone('apartment') });
  }
  if (state.zone !== 'courtroom') {
    choices.push({ label: 'Go to the Empty Courtroom', fn: () => enterZone('courtroom') });
  }
  choices.push({ label: 'Stay here', fn: () => {} });
  showDialogue({
    name: 'Where to, counselor?',
    text: 'You step out to the street. Where to?',
    choices,
  });
}

// ---------------------------------------------------------------------------
// BarMail — the ethics email minigame
// ---------------------------------------------------------------------------
let currentScenario = null;
let hintPurchasedForCurrent = false;

function billableStudyActive() {
  return inGame
    && document.visibilityState === 'visible'
    && currentScenario !== null
    && !$('email').classList.contains('hidden');
}

function trackBillableStudy(dt) {
  if (!billableStudyActive()) return;
  const elapsedMs = dt * 1000;
  state.billableStudyMs = (state.billableStudyMs || 0) + elapsedMs;
  billableUnsavedMs += elapsedMs;
  if (billableUnsavedMs >= 5_000) {
    billableUnsavedMs = 0;
    save();
  }
}

function currentDifficulty() {
  if (state.casesDone < 5) return 1;
  if (state.casesDone < 12) return 2;
  return 3;
}

const PRACTICE_PACKS = new Set(['mixed', 'sqe', 'mpre', 'juris']);

function scenarioMatchesPack(scenario, pack) {
  if (pack === 'sqe') return scenario.sourceType === 'sqe-style';
  if (pack === 'mpre') return scenario.sourceType === 'mpre-style';
  if (pack === 'juris') return scenario.sourceType === 'lawscape';
  return true;
}

function pickScenario() {
  const difficulty = currentDifficulty();
  const selectedPack = PRACTICE_PACKS.has(state.practicePack) ? state.practicePack : 'mixed';
  const packPool = SCENARIOS.filter((scenario) => scenarioMatchesPack(scenario, selectedPack));
  const preferredDifficulty = packPool.filter((scenario) => scenario.difficulty === difficulty);
  const eligible = preferredDifficulty.length ? preferredDifficulty : packPool;
  let pool = eligible.filter((scenario) => !state.seen.includes(scenario.id));
  if (!pool.length) {
    const eligibleIds = new Set(eligible.map((scenario) => scenario.id));
    state.seen = state.seen.filter((id) => !eligibleIds.has(id));
    pool = eligible;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function openEmail() {
  if (docReview.active) stopDocumentReview(false);
  currentScenario = pickScenario();
  hintPurchasedForCurrent = false;
  const s = currentScenario;

  $('email-subject').textContent = s.subject;
  $('email-from').textContent = `From: ${s.from} — ${s.role}`;
  $('email-text').textContent = s.body;
  $('email-pack').value = PRACTICE_PACKS.has(state.practicePack) ? state.practicePack : 'mixed';
  const advancedLabel = s.sourceType === 'sqe-style'
    ? 'SQE+'
    : s.sourceType === 'mpre-style' ? 'MPRE+' : 'EXPERT';
  const levelNames = { 1: 'FOUNDATION', 2: 'PRACTICE', 3: advancedLabel };
  $('email-difficulty').textContent = `LEVEL ${s.difficulty} · ${levelNames[s.difficulty]}`;

  const sourceEl = $('email-source');
  if (s.sourceType === 'mpre-style' || s.sourceType === 'sqe-style') {
    sourceEl.textContent = s.sourceType === 'sqe-style' ? 'UK SQE-STYLE' : 'MPRE-STYLE';
    sourceEl.title = s.sourceNote;
    sourceEl.classList.remove('hidden');
    sourceEl.classList.toggle('sqe-source', s.sourceType === 'sqe-style');
  } else {
    sourceEl.classList.add('hidden');
    sourceEl.classList.remove('sqe-source');
  }

  const ruleEl = $('email-rule');
  ruleEl.textContent = '';
  ruleEl.classList.add('hidden');

  const hintEl = $('email-hint');
  const canAskRiley = rileyHintEligible(state.upgrades);
  hintEl.textContent = `Ask Riley for Hint · ${RILEY_HINT_COST} gold`;
  hintEl.disabled = state.gold < RILEY_HINT_COST;
  hintEl.title = hintEl.disabled
    ? `You need ${RILEY_HINT_COST} gold for Riley to research this rule.`
    : 'Pay Riley to research the relevant rule before you answer.';
  hintEl.classList.toggle('hidden', !canAskRiley);

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

function buyEthicsHint() {
  if (!currentScenario || hintPurchasedForCurrent) return;
  if (!rileyHintEligible(state.upgrades)) {
    toast('Riley needs both the Paralegal Upgrade and Ethics Treatise Shelf.');
    return;
  }
  if (state.gold < RILEY_HINT_COST) {
    toast(`You need ${RILEY_HINT_COST} gold for an ethics hint.`);
    return;
  }
  state.gold -= RILEY_HINT_COST;
  state.hintsPurchased++;
  hintPurchasedForCurrent = true;
  save();
  updateHUD();
  $('email-hint').classList.add('hidden');
  $('email-rule').textContent = `Riley’s research: ${currentScenario.rule}`;
  $('email-rule').classList.remove('hidden');
  toast(`Riley finds the relevant rule. −${RILEY_HINT_COST} gold.`);
}

$('email-hint').addEventListener('click', buyEthicsHint);

function answerEmail(choice) {
  const s = currentScenario;
  const b = bonuses(state.upgrades);
  const verdictEl = $('email-verdict');
  const explainEl = $('email-explain');
  const deltaEl = $('email-delta');
  let disbarred = false;

  $('email-hint').classList.add('hidden');
  state.casesDone++;
  if (choice.grade === 'correct') {
    const earned = Math.round(s.gold * b.goldMult + b.goldFlat);
    state.gold += earned;
    state.streak++;
    state.wrongStreak = 0;
    state.correctDone++;
    let healed = 0;
    if (state.streak >= 2) {
      const before = state.ethics;
      healEthics(STREAK_HEAL + b.streakHealBonus);
      healed = state.ethics - before;
    }
    verdictEl.textContent = '✔ Sound professional judgment.';
    verdictEl.className = 'good';
    const successContext = s.sourceType === 'sqe-style'
      ? 'That is the defensible course under the SRA framework — careful judgment on client, '
        + 'court, money, and compliance duties is how practising certificates stay safe.'
      : 'That is the defensible course — engagement decisions, trust money, and candor calls '
        + 'like this one are exactly where licenses are won and lost.';
    explainEl.textContent = `${s.rule}. ${successContext}`;
    deltaEl.innerHTML = `<span class="gain">+${earned} gold</span>`
      + (healed > 0 ? ` &nbsp; <span class="gain">+${healed} Ethics (streak x${state.streak}!)</span>`
                    : ` &nbsp; <span class="muted">streak x${state.streak} — one more for an Ethics heal</span>`);
  } else {
    state.wrongStreak++;
    const dmg = wrongAnswerDamage(state.wrongStreak, hasUpgrade('paralegal'));
    state.streak = 0;
    disbarred = damageEthics(dmg);
    verdictEl.textContent = choice.grade === 'very_wrong'
      ? '✖ Serious ethics violation.'
      : '✖ Ethically wrong.';
    verdictEl.className = 'bad';
    explainEl.textContent = `Why you lost Ethics — ${choice.why}`;
    const rileyNote = hasUpgrade('paralegal') ? ' · Riley cut the damage in half' : '';
    deltaEl.innerHTML = `<span class="loss">−${dmg} Ethics</span> &nbsp; `
      + `<span class="muted">wrong-answer streak x${state.wrongStreak}${rileyNote}</span>`;
  }

  if (s.sourceType === 'mpre-style' || s.sourceType === 'sqe-style') {
    appendScenarioSource(explainEl, s);
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

function appendScenarioSource(container, scenario) {
  const isSqe = scenario.sourceType === 'sqe-style';
  const source = document.createElement('div');
  source.className = 'scenario-source';
  source.append('Source note: ');
  const local = document.createElement('a');
  local.href = scenario.localSourceFile
    || (isSqe ? 'SQE_Ethics_Email_Scenarios_UK.md' : 'MPRE_Associate_Email_Scenarios.md');
  local.target = '_blank';
  local.rel = 'noopener';
  local.textContent = scenario.localSourceFile
    || (isSqe ? 'UK SQE Ethics Email Pack' : 'MPRE Associate Email Scenarios');
  source.append(local, ' · ');
  const official = document.createElement('a');
  official.href = scenario.sourceUrl;
  official.target = '_blank';
  official.rel = 'noopener';
  official.textContent = isSqe ? 'SRA SQE1 sample questions' : 'NCBE preparation page';
  source.append(official);
  if (scenario.studyGuideUrl) {
    const guide = document.createElement('a');
    guide.href = scenario.studyGuideUrl;
    guide.target = '_blank';
    guide.rel = 'noopener';
    guide.textContent = 'SQE1 ethics revision guide';
    source.append(' · ', guide);
  }
  source.append(document.createElement('br'), scenario.sourceNote);
  container.appendChild(source);
}

function closeEmail() {
  $('email').classList.add('hidden');
  currentScenario = null;
  billableUnsavedMs = 0;
  if (inGame) save();
}
$('email-close').addEventListener('click', closeEmail);
$('email-pack').addEventListener('change', (event) => {
  state.practicePack = PRACTICE_PACKS.has(event.target.value) ? event.target.value : 'mixed';
  save();
  openEmail();
});

// ---------------------------------------------------------------------------
// Disbarment
// ---------------------------------------------------------------------------
const DEFAULT_GAMEOVER_TEXT = 'Your Ethics reached zero. The Presiding Disciplinary Judge '
  + 'has entered an order of disbarment. Your license, your office, your gold, and your '
  + 'upgrades are forfeit.';

function gameOver(reason = DEFAULT_GAMEOVER_TEXT) {
  stopDocumentReview(false);
  inGame = false;
  $('hud').classList.add('hidden');
  $('email').classList.add('hidden');
  $('panel').classList.add('hidden');
  currentScenario = null;
  hideDialogue();
  $('gameover-text').textContent = reason;
  $('gameover').classList.remove('hidden');
}

$('gameover-restart').addEventListener('click', () => {
  $('gameover').classList.add('hidden');
  reset();                       // wipe everything — you keep nothing
  $('gameover-text').textContent = DEFAULT_GAMEOVER_TEXT;
  $('title-screen').classList.remove('hidden');
  refreshTitleButtons();
});

// ---------------------------------------------------------------------------
// Shops, record, rest, wardrobe, help
// ---------------------------------------------------------------------------
function openPanel(title) {
  if (docReview.active) stopDocumentReview(false);
  $('panel-title').textContent = title;
  $('panel-tabs').innerHTML = '';
  $('panel-body').innerHTML = '';
  $('panel').classList.remove('hidden');
  hoverLabel(null);
  return $('panel-body');
}
$('panel-close').addEventListener('click', () => $('panel').classList.add('hidden'));

function openRuleLibrary() {
  if (!hasUpgrade('subscription')) {
    showDialogue({
      name: 'Ethics Treatise Shelf',
      text: 'The shelf holds only a bar directory. Buy the Ethics Treatise Shelf upgrade to unlock the searchable rule library.',
    });
    return;
  }

  const body = openPanel('Ethics Treatise Rule Library');
  const tabs = $('panel-tabs');

  function selectSet(set) {
    for (const button of tabs.querySelectorAll('button')) {
      button.classList.toggle('active', button.dataset.set === set.id);
    }
    body.innerHTML = '';

    const tools = document.createElement('div');
    tools.className = 'rule-tools';
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = `Search ${set.citation} rules`;
    search.setAttribute('aria-label', `Search ${set.title}`);
    const official = document.createElement('a');
    official.href = set.officialUrl;
    official.target = '_blank';
    official.rel = 'noopener';
    official.textContent = 'Current official source ↗';
    tools.append(search, official);
    body.appendChild(tools);

    const note = document.createElement('div');
    note.className = 'rule-library-note';
    note.textContent = `${set.snapshot}. ${set.note}`;
    body.appendChild(note);

    if (set.resources?.length) {
      const heading = document.createElement('h3');
      heading.className = 'rule-resource-heading';
      heading.textContent = 'California reference files';
      body.appendChild(heading);

      const resources = document.createElement('div');
      resources.className = 'rule-resources';
      for (const resource of set.resources) {
        const link = document.createElement('a');
        link.className = 'rule-resource-link';
        link.href = resource.href;
        link.target = '_blank';
        link.rel = 'noopener';
        const title = document.createElement('strong');
        title.textContent = resource.title;
        const description = document.createElement('span');
        description.textContent = resource.description;
        link.append(title, description);
        resources.appendChild(link);
      }
      body.appendChild(resources);
    }

    const results = document.createElement('div');
    body.appendChild(results);

    function renderRules() {
      const query = search.value.trim().toLowerCase();
      const matching = set.rules.filter((rule) => {
        if (!query) return true;
        return `${rule.number} ${rule.title} ${rule.text}`.toLowerCase().includes(query);
      });
      results.innerHTML = '';

      if (!matching.length) {
        const empty = document.createElement('div');
        empty.className = 'rule-empty';
        empty.textContent = 'No rules match that search.';
        results.appendChild(empty);
        return;
      }

      for (const rule of matching) {
        const card = document.createElement('details');
        card.className = 'rule-card';
        const summary = document.createElement('summary');
        summary.textContent = `${set.citation} ${rule.number} — ${rule.title}`;
        card.appendChild(summary);

        if (rule.text) {
          const text = document.createElement('div');
          text.className = 'rule-text';
          text.textContent = rule.text;
          card.appendChild(text);
        } else {
          const indexOnly = document.createElement('div');
          indexOnly.className = 'rule-index-only';
          indexOnly.textContent = rule.title === '[Reserved]'
            ? 'This rule is reserved.'
            : 'This local authoring file contains the rule index but not this rule’s full text. ';
          card.appendChild(indexOnly);
        }

        const link = document.createElement('a');
        link.className = 'rule-source-link';
        link.href = rule.url || set.officialUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Open current official rule ↗';
        (card.lastElementChild || card).appendChild(link);
        results.appendChild(card);
      }
    }

    search.addEventListener('input', renderRules);
    renderRules();
    search.focus();
  }

  for (const set of RULE_LIBRARY) {
    const button = document.createElement('button');
    button.dataset.set = set.id;
    button.textContent = set.tabLabel
      || (set.id === 'nevada' ? 'Nevada NRPC' : 'Arizona ER');
    button.onclick = () => selectSet(set);
    tabs.appendChild(button);
  }
  selectSet(RULE_LIBRARY[0]);
}

function startDocumentReview() {
  if (state.zone !== 'office') {
    toast('The active files are in the main office.');
    return;
  }
  hideDialogue();
  player.stop();
  player.activity = 'reviewing';
  docReview.active = true;
  docReview.cycleStartedAt = performance.now();
  $('work-status').classList.remove('hidden');
  updateDocumentReview(docReview.cycleStartedAt);
  toast(`Document review started. Each one-minute cycle earns ${DOC_REVIEW_REWARD} gold.`);
}

function stopDocumentReview(showMessage = true) {
  if (!docReview.active) return;
  docReview.active = false;
  if (player) player.activity = null;
  $('work-status').classList.add('hidden');
  if (showMessage) toast('You close the file and stand up.');
}

function updateDocumentReview(now) {
  if (!docReview.active) return;
  let elapsed = now - docReview.cycleStartedAt;
  while (elapsed >= DOC_REVIEW_CYCLE_MS) {
    state.gold += DOC_REVIEW_REWARD;
    state.documentsReviewed++;
    docReview.cycleStartedAt += DOC_REVIEW_CYCLE_MS;
    elapsed -= DOC_REVIEW_CYCLE_MS;
    save();
    updateHUD();
    toast(`Document review cycle complete. +${DOC_REVIEW_REWARD} gold.`);
  }
  const remainingMs = Math.max(0, DOC_REVIEW_CYCLE_MS - elapsed);
  const seconds = Math.ceil(remainingMs / 1000);
  $('review-progress-fill').style.width = `${Math.min(100, (elapsed / DOC_REVIEW_CYCLE_MS) * 100)}%`;
  $('review-time').textContent = `Next cycle in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · ${state.documentsReviewed} completed`;
}

$('btn-stop-review').addEventListener('click', () => stopDocumentReview());

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
        const previousMax = maxEthics();
        state.gold -= u.cost;
        state.upgrades.push(u.id);
        const addedEthicsCapacity = maxEthics() - previousMax;
        if (addedEthicsCapacity > 0) healEthics(addedEthicsCapacity);
        if (state.moneybagsStolen) {
          state.moneybagsPurchases = (state.moneybagsPurchases || 0) + 1;
        }
        save();
        updateHUD();
        if (state.moneybagsStolen && moneybagsAuditTriggered(state.moneybagsPurchases)) {
          state.ethics = 0;
          save();
          updateHUD();
          gameOver(
            `Your third purchase after taking Mr. Moneybags’s gold triggered a trust-account audit. `
            + `The coins were traced from Jim Hardsell’s safe into your spending. The Presiding `
            + `Disciplinary Judge ordered immediate disbarment. ${u.name} was not worth it.`,
          );
          return;
        }
        if (state.moneybagsStolen) {
          const escaped = Math.min(state.moneybagsPurchases, MONEYBAGS_GRACE_PURCHASES);
          toast(`Purchased: ${u.name}. Nobody has noticed the Moneybags gold — yet. (${escaped}/2)`);
        } else {
          toast(`Purchased: ${u.name}`);
        }
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
    <div class="row-item"><div class="grow"><h4>Billable study time</h4>
      <p>Visible time with BarMail open</p></div><div class="meta">⏱ ${formatBillableTime(state.billableStudyMs)}</div></div>
    <div class="row-item"><div class="grow"><h4>Current streak</h4></div><div class="meta">x${state.streak}</div></div>
    <div class="row-item"><div class="grow"><h4>Wrong-answer streak</h4></div><div class="meta">x${state.wrongStreak}</div></div>
    <div class="row-item"><div class="grow"><h4>Document-review cycles</h4></div><div class="meta">${state.documentsReviewed}</div></div>
    <div class="row-item"><div class="grow"><h4>Linda’s ethics tips</h4></div><div class="meta">${state.tipsPurchased}</div></div>
    <div class="row-item"><div class="grow"><h4>Riley’s rule hints</h4></div><div class="meta">${state.hintsPurchased}</div></div>
    <div class="row-item"><div class="grow"><h4>Emails to HR</h4></div><div class="meta">${state.hrEmailsSent || 0} sent · 0 answered</div></div>
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

function drinkCoffee() {
  if (!hasUpgrade('coffee')) {
    toast('The counter is empty. Buy the Coffee Machine from the furniture catalog first.');
    return;
  }
  if (state.ethics >= maxEthics()) {
    toast('Your Ethics is already full. Save the coffee for a harder day.');
    return;
  }
  const before = state.ethics;
  healEthics(COFFEE_ETHICS_RESTORE);
  save();
  updateHUD();
  toast(`You drink a strong cup of coffee. +${state.ethics - before} Ethics.`);
}

function eatApartmentFood(name, ethicsRestore) {
  if (state.ethics >= maxEthics()) {
    toast('Your Ethics is already full. Save the food for a harder day.');
    return;
  }
  if (state.gold < APARTMENT_FOOD_COST) {
    toast(`You need ${APARTMENT_FOOD_COST} gold for ${name.toLowerCase()}.`);
    return;
  }
  state.gold -= APARTMENT_FOOD_COST;
  const before = state.ethics;
  healEthics(ethicsRestore);
  save();
  updateHUD();
  showDialogue({
    name,
    text: `You spend ${APARTMENT_FOOD_COST} gold and restore `
      + `${state.ethics - before} Ethics.`,
  });
}

function watchTV() {
  if (!hasUpgrade('cityview')) return;
  watchReturnPos = { x: player.x, y: player.y };
  player.stop();
  player.x = 4.5;
  player.y = 5;
  player.activity = 'watching';
  showDialogue({
    name: 'City View Apartment',
    text: 'You settle onto the couch and watch the city lights flicker beyond the window.',
    choices: [{ label: 'Stand up', fn: stopWatchingTV }],
  });
}

function stopWatchingTV() {
  if (!player || player.activity !== 'watching') return;
  player.activity = null;
  if (watchReturnPos) {
    player.x = watchReturnPos.x;
    player.y = watchReturnPos.y;
  }
  watchReturnPos = null;
}

function openMoneybagsSafe() {
  if (state.moneybagsStolen) {
    showDialogue({
      name: 'Mr. Hardsell’s Safe',
      text: `The safe is empty. You have made ${state.moneybagsPurchases || 0} upgrade `
        + `${state.moneybagsPurchases === 1 ? 'purchase' : 'purchases'} since taking the client’s gold.`,
    });
    return;
  }
  showDialogue({
    name: 'Mr. Hardsell’s Safe',
    text: 'Jim Hardsell calls over, “Feel free to take some of those gold coins out of there. '
      + 'They belong to our client Mr. Moneybags, and he will never notice.”',
    choices: [
      {
        label: `Take ${MONEYBAGS_SAFE_GOLD.toLocaleString()} client gold`,
        fn: takeMoneybagsGold,
      },
      { label: 'Leave the client’s gold alone' },
    ],
  });
}

function takeMoneybagsGold() {
  if (state.moneybagsStolen) return;
  state.moneybagsStolen = true;
  state.moneybagsPurchases = 0;
  state.gold += MONEYBAGS_SAFE_GOLD;
  const disbarred = damageEthics(MONEYBAGS_ETHICS_DAMAGE);
  save();
  updateHUD();
  if (disbarred) {
    gameOver(
      'Taking Mr. Moneybags’s client funds exhausted your remaining Ethics. '
      + 'The trust-account theft resulted in immediate disbarment.',
    );
    return;
  }
  showDialogue({
    name: 'Client Trust Catastrophe',
    text: `You take ${MONEYBAGS_SAFE_GOLD.toLocaleString()} gold and instantly lose `
      + `${MONEYBAGS_ETHICS_DAMAGE} Ethics. Your Ethics maximum is permanently capped at 50. `
      + 'The first two upgrade purchases may pass unnoticed. '
      + 'A third will expose the missing client funds.',
  });
}

function offerWhiskey() {
  if (state.whiskeyDrinks > 0) {
    showDialogue({
      name: 'A Professional Warning',
      text: `A second drink at work is a warning sign. Substance use can impair a lawyer’s competence and judgment. `
        + `Confidential help for Nevada lawyers is available from Lawyers Concerned for Lawyers at ${LAWYER_ASSISTANCE_PHONE}.`,
      choices: [
        {
          label: 'Open confidential help page',
          fn: () => window.open(LAWYER_ASSISTANCE_URL, '_blank', 'noopener'),
        },
        { label: 'Step away from the cart' },
      ],
    });
    return;
  }
  showDialogue({
    name: 'Jim Hardsell’s Bar Cart',
    text: 'Mr. Hardsell insists that you pour yourself a glass.',
    choices: [
      { label: 'Yes, pour a glass', fn: drinkWhiskey },
      { label: 'No, stay sharp' },
    ],
  });
}

function drinkWhiskey() {
  state.whiskeyDrinks++;
  const disbarred = damageEthics(WHISKEY_ETHICS_DAMAGE);
  save();
  updateHUD();
  if (disbarred) {
    gameOver();
    return;
  }
  showDialogue({
    name: 'Professional Judgment',
    text: `The drink slows your movement for 40 seconds and costs ${WHISKEY_ETHICS_DAMAGE} Ethics. `
      + 'Pressure from a supervisor does not excuse impaired professional judgment.',
    choices: [
      {
        label: 'Walk it off',
        fn: () => {
          whiskeySlowUntil = performance.now() + WHISKEY_SLOW_MS;
          toast('Your movement is impaired for 40 seconds.');
        },
      },
    ],
  });
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
    <div class="help-lede">Your first goal: answer a <b>BarMail</b> dilemma or complete a one-minute document-review cycle to earn gold.</div>
    <div class="row-item"><div class="grow"><h4>💻 BarMail</h4>
      <p>Click your office computer or use the BarMail quick action. Partners and clients send
      requests — many of them unethical. Choose Mixed Inbox, UK SQE Ethics, US MPRE, or
      State of Juris in the toolbar. Questions advance from Foundation to Practice to the
      advanced tier as your record grows.</p></div></div>
    <div class="row-item"><div class="grow"><h4>⏱ Billable Hours</h4>
      <p>The HUD timer records visible time spent with BarMail open, including reading the
      question, choosing an answer, and studying the explanation. Exploring the office,
      leaving the tab, and other activities do not count.</p></div></div>
    <div class="row-item"><div class="grow"><h4>🗄 Document Review</h4>
      <p>Use the filing cabinet in the main office. Your attorney sits and reviews files;
      every uninterrupted one-minute cycle earns 5 gold.</p></div></div>
    <div class="row-item"><div class="grow"><h4>📚 Ethics Treatises</h4>
      <p>Buy the Ethics Treatise Shelf upgrade, then use the bookshelf to search the bundled
      Nevada, Arizona, and California references.</p></div></div>
    <div class="row-item"><div class="grow"><h4>🖱 Movement</h4>
      <p>Click or tap a floor tile to walk. You can also use WASD or the arrow keys. Select
      a highlighted person or object to walk over and interact.</p></div></div>
    <div class="row-item"><div class="grow"><h4>🪙 Gold</h4>
      <p>Correct answers earn gold. Spend it on office and apartment upgrades (filing cabinet
      in the office, furniture catalog at home).</p></div></div>
    <div class="row-item"><div class="grow"><h4>⚖ Ethics Bar</h4>
      <p>Wrong answers damage your Ethics — the game explains the violated rule every time.
      Damage rises from 30 to 45 and then 60 as wrong answers pile up; Riley halves it.
      Three straight mistakes can end a brand-new attorney, so read before you reply.
      Two correct answers in a row start healing Ethics. Resting in your bed helps too.</p></div></div>
    <div class="row-item"><div class="grow"><h4>🥃 Professional Wellbeing</h4>
      <p>Jim’s office bar cart demonstrates how alcohol can impair judgment and movement.
      Returning for another drink provides a confidential lawyer-assistance resource.</p></div></div>
    <div class="row-item"><div class="grow"><h4>☠ Disbarment</h4>
      <p>Ethics at zero = YOU GOT DISBARRED — GAME OVER. You restart from nothing: no gold,
      no items, no upgrades.</p></div></div>
    <div class="row-item"><div class="grow"><h4>🏛 Court</h4>
      <p>The furnished courtroom is open to explore, but no matters or court personnel are
      on calendar yet.</p></div></div>
    <div class="row-item"><div class="grow"><h4>✍ Email HR</h4>
      <p>Found a bug, or ready to complain about the working conditions at Hardsell &amp;
      Firestone? Open BarMail and press <b>Email HR</b>. HR will not read it — but your
      message becomes a prefilled report you can file with the developers on GitHub.</p></div></div>
    <div class="row-item"><div class="grow"><h4>🌍 Why LawScape Exists</h4>
      <p>The thesis: legal learning should be fun — and it should be fun to learn how
      lawyers in other countries answer the same questions. The practice-pack selector
      (UK SQE, US MPRE, State of Juris) is the first step; a full jurisdiction selector
      (California, Nevada, Arizona) and a Global Law Firm mode with BarMail arriving from
      around the world are on the roadmap.</p></div></div>`;
}

// ---------------------------------------------------------------------------
// Email HR — bug reports and working-conditions complaints, in character.
// Nothing is transmitted anywhere: the player's text becomes a prefilled
// GitHub issue they may open (and edit) themselves, or copy to the clipboard.
// ---------------------------------------------------------------------------
function hrContext() {
  return {
    version: GAME_VERSION,
    zone: state.zone,
    casesDone: state.casesDone,
    ethics: state.ethics,
    ethicsMax: maxEthics(),
    gold: Math.floor(state.gold),
    upgrades: state.upgrades.length,
    userAgent: navigator.userAgent,
  };
}

function openHrEmail() {
  const body = openPanel('✉ New Message — To: hr@hardsell-firestone.example');

  const intro = document.createElement('div');
  intro.className = 'help-lede';
  intro.innerHTML = '<b>Human Resources — Hardsell &amp; Firestone.</b> Serving the firm’s '
    + 'humans since 1987 with one (1) unattended inbox. Bug reports and complaints about '
    + 'the working conditions of this virtual law firm are equally welcome and equally unread.';
  body.appendChild(intro);

  const form = document.createElement('div');
  form.className = 'hr-form';

  const categoryLabel = document.createElement('label');
  categoryLabel.textContent = 'Nature of grievance';
  const category = document.createElement('select');
  for (const option of HR_CATEGORIES) {
    const el = document.createElement('option');
    el.value = option.id;
    el.textContent = option.label;
    category.appendChild(el);
  }
  categoryLabel.appendChild(category);

  const subjectLabel = document.createElement('label');
  subjectLabel.textContent = 'Subject';
  const subject = document.createElement('input');
  subject.type = 'text';
  subject.maxLength = 80;
  subject.placeholder = 'e.g., The coffee machine took my gold and poured nothing';
  subjectLabel.appendChild(subject);

  const messageLabel = document.createElement('label');
  messageLabel.textContent = 'Your email to HR';
  const message = document.createElement('textarea');
  message.maxLength = 2000;
  message.placeholder = 'Describe the bug (what you did, what happened, what should have '
    + 'happened) — or the working conditions. Liz still remembers when the complaint '
    + 'pile was short enough to see over.';
  messageLabel.appendChild(message);

  const note = document.createElement('p');
  note.className = 'hr-fine-print';
  note.textContent = 'Privacy notice: nothing leaves your browser when you press Send. '
    + '“File with the Developers” opens a prefilled GitHub issue in a new tab that you '
    + 'review, edit, and submit yourself (GitHub account required).';

  const send = document.createElement('button');
  send.type = 'button';
  send.textContent = 'Send to HR';
  send.onclick = () => {
    const messageText = message.value.trim();
    if (!messageText) {
      toast('HR requires at least one sentence of grievance.');
      message.focus();
      return;
    }
    const subjectText = subject.value.trim() || 'No subject (HR expected nothing less)';
    state.hrEmailsSent = (state.hrEmailsSent || 0) + 1;
    save();
    showHrAutoReply(body, findHrCategory(category.value), subjectText, messageText);
  };

  form.append(categoryLabel, subjectLabel, messageLabel, note, send);
  body.appendChild(form);
  subject.focus();
}

function showHrAutoReply(body, category, subjectText, messageText) {
  body.innerHTML = '';
  const ticket = String(state.hrEmailsSent || 1).padStart(4, '0');

  const reply = document.createElement('div');
  reply.className = 'hr-reply';
  const head = document.createElement('h4');
  head.textContent = `Auto-reply — RE: ${subjectText}`;
  const text = document.createElement('p');
  text.textContent = category.reply;
  const meta = document.createElement('p');
  meta.className = 'hr-ticket';
  meta.textContent = `Ticket HR-${ticket} · Estimated HR response time: 6–8 business years. `
    + 'The developers, however, read their docket.';
  reply.append(head, text, meta);
  body.appendChild(reply);

  const actions = document.createElement('div');
  actions.className = 'hr-actions';

  const file = document.createElement('button');
  file.type = 'button';
  file.textContent = '📮 File with the Developers (GitHub)';
  file.onclick = () => {
    window.open(hrIssueUrl(category, subjectText, messageText, hrContext()), '_blank', 'noopener');
  };

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'small';
  copy.textContent = '📋 Copy report';
  copy.onclick = async () => {
    const report = hrReportText(category, subjectText, messageText, hrContext());
    try {
      await navigator.clipboard.writeText(report);
      toast('Report copied. Paste it anywhere HR is not.');
    } catch {
      showHrCopyFallback(actions, report);
    }
  };

  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'small';
  done.textContent = 'Return to billable work';
  done.onclick = () => $('panel').classList.add('hidden');

  actions.append(file, copy, done);
  body.appendChild(actions);
}

function showHrCopyFallback(actionsEl, report) {
  if (actionsEl.parentElement.querySelector('.hr-copy-fallback')) return;
  const fallback = document.createElement('textarea');
  fallback.className = 'hr-copy-fallback';
  fallback.readOnly = true;
  fallback.value = report;
  actionsEl.parentElement.appendChild(fallback);
  fallback.focus();
  fallback.select();
  toast('Clipboard unavailable — the report is selected below. Copy it manually.');
}

$('email-hr-open').addEventListener('click', () => {
  closeEmail();
  openHrEmail();
});

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
      hair: state.hair, hairStyle: state.hairStyle, eye: state.eye }, { speed: PLAYER_BASE_SPEED });
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
      name: 'Liz Loza, Secretary',
      text: `Welcome to Hardsell & Firestone, ${state.name}. BarMail is on your computer, `
        + 'the filing cabinet has documents to review, and Mr. Johnson called about his case. '
        + 'Jim Hardsell is busy. Linda Firestone charges for advice. Get to work.',
      choices: [{ label: 'On it.' }],
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
    player.speed = now < whiskeySlowUntil ? PLAYER_BASE_SPEED / 2 : PLAYER_BASE_SPEED;
    player.update(dt);
    updateDocumentReview(now);
    trackBillableStudy(dt);
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
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' && inGame) save();
});

refreshTitleButtons();
document.documentElement.dataset.lawscapeReady = 'true';
schedule();

// Debug hook (harmless in production; used by tests).
window.LS = {
  get state() { return state; },
  get player() { return player; },
  get zone() { return zone; },
  targetAt, isWalkable, renderer,
  currentDifficulty,
  billableStudyActive,
  formatBillableTime,
  openMoneybagsSafe,
  get docReview() { return { ...docReview }; },
  get inGame() { return inGame; },
};
