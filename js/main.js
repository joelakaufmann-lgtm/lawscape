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
import { createApprenticeshipUI, escapeHtml } from './ui/apprenticeship.js';
import { pendingAttempt, taskAttempts, capstoneReady } from './apprenticeship.js';
import { WRITING_TASKS, CAPSTONE } from './data/apprenticeship.js';
import { canAccessBarMail, practiceInbox, billableMessageOpen } from './data/mail.js';
import { BAR_DRINKS, orderBarDrink, movementMultiplier, archiveDisbarredRun, readBillableBoard } from './lounge.js';
import { appearanceLook, normalizeAppearance } from './data/appearance.js';
import { mountAppearanceEditor } from './ui/appearance.js';
import { SIDEBAR_ROOM, SIDEBAR_TOPICS, sidebarTopic, saveSidebarDraft } from './data/sidebar.js';
import { SCENARIOS, STREAK_HEAL } from './data/ethics.js';
import { OFFICE_UPGRADES, APARTMENT_UPGRADES, bonuses } from './data/upgrades.js';
import { RULE_LIBRARY } from './data/rules.js';
import { PRACTICE_PACKS } from './data/practice-packs.js';
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
let watchReturnPos = null;
let billableUnsavedMs = 0;

const desk = createApprenticeshipUI({
  beforeOpen: () => { closeEmail(); $('panel').classList.add('hidden'); hideDialogue(); stopDocumentReview(false); player?.stop(); },
  onChange: () => { if (player) player.look = playerLook(); updateHUD(); if (mailMode === 'inbox' && !$('email').classList.contains('hidden')) renderInbox(); },
  onPractice: (pack) => {
    if (!inGame) return;
    state.practicePack = pack;
    if (!canAccessBarMail(state)) enterZone('office');
    save(); openEmail('practice');
  },
  onWriting: (id) => openEmail('writing', id),
  onWritingExit: (next,id) => { closeEmail(); desk.open(next,id); },
  notify: toast,
});

function playerLook() {
  return appearanceLook(state, state.apprenticeship.equipped);
}

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
  if (zone.id === 'sidebar') zone.props.find((prop) => prop.type === 'scoreboard').entries = readBillableBoard();
  npcs = (zone.npcs || []).map((def) => ({
    def,
    actor: new Actor(def.x, def.y, def.look, { npc: def }),
  }));
}

function enterZone(id, pos = null) {
  if (docReview.active) stopDocumentReview(false);
  stopWatchingTV();
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
  hoverLabel(null);
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
  // three tiles down-screen to include the adult figure's head.
  for (let k = 0; k <= 3; k++) {
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
          run: () => runAction(prop.interact.action, prop),
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
  if (['watching', 'sitting'].includes(player.activity)) stopWatchingTV();
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
  return desk.isOpen() || !$('email').classList.contains('hidden')
      || !$('panel').classList.contains('hidden')
      || !$('gameover').classList.contains('hidden');
}

function moveBy(dx, dy) {
  if (!inGame || overlayOpen() || dialogueOpen() || player.walking || docReview.active) return;
  if (['watching', 'sitting'].includes(player.activity)) stopWatchingTV();
  const dest = { x: player.tileX + dx, y: player.tileY + dy };
  if (!isWalkable(dest.x, dest.y)) return;
  player.setPath([dest]);
}

function updateQuickActions() {
  const mail = $('btn-mail');
  if (!mail) return;
  const access = canAccessBarMail(state);
  mail.disabled = !access;
  mail.title = hasUpgrade('work_phone') ? 'Open BarMail on your work phone (B)' : access ? 'Open BarMail on your office computer (B)' : 'Buy the Work Phone to use BarMail outside the office';
  const room = $('room-action');
  room.classList.toggle('hidden', !['sidebar', 'courtroom'].includes(state.zone));
  room.textContent = state.zone === 'sidebar' ? 'The Sidebar · Table notes' : 'Talk to Derek Balam';
  $('room-service').classList.toggle('hidden', !['sidebar','courtroom'].includes(state.zone));
  $('room-service').textContent = state.zone === 'sidebar' ? 'Order a drink' : 'Sleeping AI judge';
  $('room-board').classList.toggle('hidden', state.zone !== 'sidebar');
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------
function runAction(action, prop = null) {
  switch (action) {
    case 'email': openEmail(); break;
    case 'doc_review': desk.open('files'); break;
    case 'rules': openRuleLibrary(); break;
    case 'shop_office': openShop('Office Upgrades', OFFICE_UPGRADES); break;
    case 'shop_apartment': openShop('Apartment Upgrades', APARTMENT_UPGRADES); break;
    case 'record': openRecord(); break;
    case 'rest': doRest(); break;
    case 'wardrobe': openWardrobe(); break;
    case 'sidebar_chat': openSidebar(prop?.topic); break;
    case 'sidebar_sit': sitInSidebar(prop); break;
    case 'bartender': openBartender(); break;
    case 'high_scores': openHighScores(); break;
    case 'judge': openJudgeStatus(); break;
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
  if (def.talk === 'bailiff') {
    showDialogue({
      name: def.name,
      text: 'Derek Balam checks the courtroom clock. “Counselor, welcome. I keep order here. The hearing calendar is still being built, so today you can explore the room. Please keep your briefcase out of the aisle.”',
      choices: [
        { label: 'What is planned for court?', fn: () => showDialogue({ name: def.name,
          text: '“Hearings, witnesses, and opportunities to think before you speak. Future exercises will identify the jurisdiction and the record you are working from. For now, practice your written work with Linda and Jim in the journal.”',
          choices: [{ label: 'Open my journal', fn: () => desk.open() }, { label: 'Thank you, Derek.' }] }) },
        { label: 'Visit The Sidebar', fn: () => enterZone('sidebar') },
        { label: 'I will take a look around.' },
      ],
    });
  } else if (def.talk === 'sidebar_host') {
    openBartender();
  } else if (def.talk === 'jim') {
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
  const phoneOwned = hasUpgrade('work_phone');
  const chair = hasUpgrade('liz_chair');
  const plants = hasUpgrade('houseplants');
  const artwork = hasUpgrade('artwork');
  const improvedOffice = paralegal && phoneOwned;
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
  if (!hasUpgrade('work_phone')) {
    lines.push('I asked Jim to get you a work phone. He said the office computer has a perfectly good cord.');
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
          if (pendingAttempt(state)) { toast('Wait for the partner reply before making purchases.'); return; }
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
    choices.push({ label: 'Go to the Courtroom', fn: () => enterZone('courtroom') });
  }
  if (state.zone !== 'sidebar') {
    choices.push({ label: 'Go to The Sidebar', fn: () => enterZone('sidebar') });
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
  return billableMessageOpen({ inGame, visible: document.visibilityState === 'visible', mailOpen: !$('email').classList.contains('hidden'), messageOpen: !!currentScenario || (mailMode === 'writing' && !!writingTaskId) });
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

const VALID_PACKS = new Set(PRACTICE_PACKS.map(pack => pack.id));

let mailMode = 'inbox', mailFolder = 'all', writingTaskId = null, questionAnswered = false;

function openEmail(folder = 'all', taskId = null) {
  if (!canAccessBarMail(state)) {
    toast('BarMail is on your office computer. The Work Phone unlocks access everywhere.');
    return;
  }
  if (docReview.active) stopDocumentReview(false);
  desk.close(); desk.releaseWriting(); hideDialogue(); player?.stop();
  $('panel').classList.add('hidden');
  $('email').classList.remove('hidden');
  $('email-appname').textContent = hasUpgrade('work_phone') && state.zone !== 'office'
    ? 'BarMail — Work Phone' : 'BarMail — Office Computer';
  mailFolder = folder;
  mailMode = taskId ? 'writing' : 'inbox';
  writingTaskId = taskId;
  currentScenario = null;
  $('email-pack').value = VALID_PACKS.has(state.practicePack) ? state.practicePack : 'mixed';
  for (const id of ['email-difficulty','email-source','email-hint','email-rule','email-body','email-writing-body']) $(id).classList.add('hidden');
  $('email-inbox').classList.toggle('hidden', !!taskId);
  if (taskId) {
    $('email-writing-body').classList.remove('hidden');
    desk.embedWriting($('email-writing-body'),taskId);
  } else { renderInbox(); $('email-inbox-open').focus(); }
  hoverLabel(null);
}

function renderInbox() {
  const pool = practiceInbox(state,SCENARIOS);
  const showPractice = mailFolder !== 'writing', showWriting = mailFolder !== 'practice';
  const e = escapeHtml;
  $('email-inbox').innerHTML = `<header class="mail-inbox-heading"><div><span class="mail-eyebrow">HARDSELL &amp; FIRESTONE · INTERNAL MAIL</span><h2>${showPractice && showWriting ? 'Your inbox' : showWriting ? 'Writing assignments' : 'Ethics practice inbox'}</h2><p>Open a subject line to read and reply. All senders and correspondence are synthetic.</p></div><span class="mail-device">${hasUpgrade('work_phone') ? 'Work phone connected' : 'Office terminal'}</span></header>`
    + (pendingAttempt(state) ? '<p class="mail-notice">A partner reply is pending. You can read your mail; another graded submission waits for that reply.</p>' : '')
    + (showWriting ? `<h3 class="mail-group-title">Partner correspondence · Writing</h3><div class="mail-list">${[...WRITING_TASKS,CAPSTONE].map((task) => {
      const latest = taskAttempts(state,task.id).at(-1);
      const locked = task.id === 'capstone' && !capstoneReady(state);
      const status = locked ? 'Complete six replies and two files' : latest?.status === 'pending' ? 'Sent · awaiting partner' : latest ? 'Partner replied' : state.apprenticeship.drafts[task.id] ? 'Draft saved' : 'New assignment';
      return `<button type="button" class="mail-row" data-writing="${task.id}" ${locked ? 'disabled' : ''}><span class="mail-sender">${e(task.partner)}</span><span class="mail-subject">${e(task.title)}<small>${e(task.skill)} · ${e(task.prompt.slice(0,105))}…</small></span><span class="mail-status">${status}</span></button>`;
    }).join('')}</div>` : '')
    + (showPractice ? `<h3 class="mail-group-title">Ethics practice · ${pool.levelLabel} · ${pool.unread.length} unanswered</h3><div class="mail-list">${pool.unread.map((s) => `<button type="button" class="mail-row" data-scenario="${e(s.id)}"><span class="mail-sender">${e(s.from)}<small>${e(s.role)}</small></span><span class="mail-subject">${e(s.subject)}<small>${e(s.body.slice(0,95))}…</small></span><span class="mail-status">${s.jurisdiction || (s.sourceType === 'mpre-style' ? 'MPRE-style' : s.sourceType === 'sqe-style' ? 'SQE-style' : 'LawScape original')}</span></button>`).join('')}</div>${!pool.unread.length ? '<p class="mail-notice">You have answered this tier’s mail for this practice pack.</p><button type="button" id="mail-new-round">Start another study round</button>' : ''}` : '');
  $('email-inbox').querySelectorAll('[data-writing]').forEach((row) => row.onclick = () => openEmail('writing',row.dataset.writing));
  $('email-inbox').querySelectorAll('[data-scenario]').forEach((row) => row.onclick = () => openScenario(row.dataset.scenario));
  if ($('mail-new-round')) $('mail-new-round').onclick = () => {
    const ids = new Set(pool.eligible.map((item) => item.id));
    state.seen = state.seen.filter((id) => !ids.has(id)); save(); renderInbox();
  };
}

function openScenario(id) {
  if (!canAccessBarMail(state)) return;
  const scenario = practiceInbox(state,SCENARIOS).unread.find((item) => item.id === id);
  if (!scenario) return;
  desk.releaseWriting();
  currentScenario = scenario; mailMode = 'practice'; writingTaskId = null; questionAnswered = false;
  $('email-inbox').classList.add('hidden');
  $('email-writing-body').classList.add('hidden');
  $('email-body').classList.remove('hidden');
  $('email-difficulty').classList.remove('hidden');
  hintPurchasedForCurrent = false;
  const s = currentScenario;

  $('email-subject').textContent = s.subject;
  const jurisdiction = s.jurisdiction ? `${s.jurisdiction} · unofficial ethics practice` : s.sourceType === 'sqe-style' ? 'England & Wales · SQE-style study' : s.sourceType === 'mpre-style' ? 'US MPRE-style · model-rule study' : 'LawScape original · mixed Arizona/Nevada sources';
  $('email-from').textContent = `From: ${s.from} — ${s.role} · ${jurisdiction}`;
  $('email-text').textContent = s.body;
  $('email-pack').value = VALID_PACKS.has(state.practicePack) ? state.practicePack : 'mixed';
  const advancedLabel = s.sourceType === 'sqe-style'
    ? 'SQE+'
    : s.sourceType === 'mpre-style' ? 'MPRE+' : 'EXPERT';
  const levelNames = { 1: 'FOUNDATION', 2: 'PRACTICE', 3: advancedLabel };
  $('email-difficulty').textContent = `LEVEL ${s.difficulty} · ${levelNames[s.difficulty]}`;

  const sourceEl = $('email-source');
  if (s.sourceUrl) {
    sourceEl.textContent = s.jurisdiction || (s.sourceType === 'sqe-style' ? 'ENGLAND & WALES · SQE-STYLE' : 'MPRE-STYLE');
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
  if (pendingAttempt(state)) { toast('Wait for the partner reply before making purchases.'); return; }
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
  if (!currentScenario || questionAnswered) return;
  if (pendingAttempt(state)) { toast('Wait for the pending partner reply before submitting another answer.'); return; }
  questionAnswered = true;
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
    explainEl.textContent = `${s.rule}. ${s.explanation || successContext}`;
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

  if (s.sourceUrl) {
    appendScenarioSource(explainEl, s);
  }

  if (!state.seen.includes(s.id)) state.seen.push(s.id);
  updateHUD();
  save();

  $('email-replies').classList.add('hidden');
  $('email-result').classList.remove('hidden');
  $('email-continue').onclick = () => {
    if (disbarred) { closeEmail(); gameOver(); } else { openEmail(mailFolder); }
  };
  if (disbarred) $('email-continue').textContent = 'Face the Disciplinary Judge';
  else $('email-continue').textContent = 'Back to inbox';
  if (disbarred) gameOver(`${DEFAULT_GAMEOVER_TEXT} ${choice.why || ''} ${s.rule}`);
}

function appendScenarioSource(container, scenario) {
  const isSqe = scenario.sourceType === 'sqe-style';
  const source = document.createElement('div');
  source.className = 'scenario-source';
  source.append('Source note: ');
  const local = document.createElement('a');
  local.href = scenario.localSourceFile
    || (isSqe ? 'content/questions/england-wales/SQE_Ethics_Email_Scenarios_UK.md' : 'content/questions/mpre/MPRE_Associate_Email_Scenarios.md');
  local.target = '_blank';
  local.rel = 'noopener';
  local.textContent = scenario.sourceLabel || (isSqe ? 'SQE questions and answer key' : 'MPRE questions and answer key');
  source.append(local, ' · ');
  const official = document.createElement('a');
  official.href = scenario.sourceUrl;
  official.target = '_blank';
  official.rel = 'noopener';
  official.textContent = scenario.officialSourceLabel || (isSqe ? 'SRA SQE1 sample questions' : 'NCBE preparation page');
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
  desk.releaseWriting(); mailMode = 'inbox'; writingTaskId = null;
  $('email').classList.add('hidden');
  currentScenario = null;
  billableUnsavedMs = 0;
  if (inGame) save();
}
$('email-close').addEventListener('click', closeEmail);
$('email-pack').addEventListener('change', (event) => {
  state.practicePack = VALID_PACKS.has(event.target.value) ? event.target.value : 'mixed';
  save();
  openEmail('practice');
});
$('email-inbox-open').addEventListener('click', () => openEmail());
$('email-back').addEventListener('click', () => openEmail(mailFolder));

// ---------------------------------------------------------------------------
// Disbarment
// ---------------------------------------------------------------------------
const DEFAULT_GAMEOVER_TEXT = 'Your Ethics reached zero. The Presiding Disciplinary Judge '
  + 'has entered an order of disbarment. Your license, your office, your gold, and your '
  + 'upgrades are forfeit.';

function gameOver(reason = DEFAULT_GAMEOVER_TEXT) {
  const archived = archiveDisbarredRun(state);
  desk.releaseWriting();
  writingTaskId = null;
  const scoreNote = archived.recorded ? ` Your ${formatBillableTime(state.billableStudyMs)} billable time was recorded on the ${archived.persisted ? 'local' : 'session-only'} Sidebar board.` : '';
  stopDocumentReview(false);
  inGame = false;
  desk.close();
  $('hud').classList.add('hidden');
  $('email').classList.add('hidden');
  $('panel').classList.add('hidden');
  currentScenario = null;
  hideDialogue();
  $('gameover-text').textContent = reason + scoreNote;
  $('gameover').classList.remove('hidden');
  reset(); // End this run immediately; closing/reloading cannot revive it.
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
  player?.stop();
  hideDialogue();
  $('panel-inner').classList.remove('sidebar-panel');
  $('panel-title').textContent = title;
  $('panel-tabs').innerHTML = '';
  $('panel-body').innerHTML = '';
  $('panel').classList.remove('hidden');
  hoverLabel(null);
  return $('panel-body');
}
$('panel-close').addEventListener('click', () => $('panel').classList.add('hidden'));

function openSidebar(topicId = state.sidebar.topic) {
  const topic = sidebarTopic(topicId);
  state.sidebar.topic = topic.id;
  save();
  const body = openPanel(`${SIDEBAR_ROOM.title} — Table notes`);
  $('panel-inner').classList.add('sidebar-panel');
  body.innerHTML = `
    <div class="sidebar-banner"><span class="sidebar-mode">LOCAL PREVIEW</span><h2>A place to talk shop.</h2><p>A quiet corner of the firm. Pull up a chair and choose a table.</p></div>
    <div class="sidebar-layout"><aside><h3>Conversation tables</h3><nav class="sidebar-topics" aria-label="Conversation tables">${SIDEBAR_TOPICS.map((item) => `<button type="button" data-topic="${item.id}" aria-pressed="${item.id === topic.id}">${item.label}</button>`).join('')}</nav>
      <h3>In this local room</h3><p class="sidebar-person"><strong>${escapeHtml(state.name)}</strong><span>You · local player</span></p><p class="sidebar-person"><strong>B.A.R.T.</strong><span>Robot butler · scripted NPC</span></p><p class="sidebar-offline">Multiplayer is not connected. The future Cloudflare pilot is planned for ${SIDEBAR_ROOM.participantLimit} invited people, with clearly labeled AI agents.</p></aside>
      <section class="sidebar-conversation" aria-labelledby="sidebar-topic-title"><h3 id="sidebar-topic-title">${topic.label}</h3><p>${topic.prompt}</p>
        <blockquote><span>B.A.R.T. · scripted welcome</span>“No billable clock at this table. Bring a question, a useful observation, or an idea worth testing.”</blockquote>
        <p class="sidebar-empty">No shared messages yet. Your draft stays in this browser.</p>
        <label for="sidebar-draft">Your conversation draft</label><textarea id="sidebar-draft" maxlength="500" rows="4" placeholder="Draft an introduction or a question…" aria-describedby="sidebar-draft-help"></textarea>
        <p id="sidebar-draft-help">Saved drafts are private to this local save. They will not be sent automatically when multiplayer launches.</p>
        <div class="sidebar-compose-actions"><button type="button" id="sidebar-save-draft">Save draft locally</button><button type="button" disabled title="Cloudflare multiplayer is not connected">Send · coming with multiplayer</button></div>
        <p id="sidebar-draft-status" role="status"></p>
      </section></div>`;
  const draft = $('sidebar-draft');
  draft.value = String(state.sidebar.drafts[topic.id] || '').slice(0, 500);
  const persist = () => {
    saveSidebarDraft(state, topic.id, draft.value);
    const saved = save();
    $('sidebar-draft-status').textContent = saved ? `Saved locally · ${draft.value.length}/500 characters · nothing sent` : 'Kept for this session only · browser storage unavailable · nothing sent';
  };
  draft.addEventListener('input', persist);
  $('sidebar-save-draft').onclick = persist;
  body.querySelectorAll('[data-topic]').forEach((button) => {
    button.onclick = () => { openSidebar(button.dataset.topic); body.querySelector(`[data-topic="${button.dataset.topic}"]`).focus(); };
  });
}

function sitInSidebar(prop) {
  if (!prop || state.zone !== 'sidebar') return;
  stopWatchingTV();
  watchReturnPos = { x: player.x, y: player.y };
  player.stop();
  player.x = prop.x; player.y = prop.y; player.activity = 'sitting';
  showDialogue({ name: 'The Sidebar', text: 'You take a seat at the bar. A little distance from the inbox can help.',
    choices: [{ label: 'Open room & chat', fn: () => openSidebar() }, { label: 'Stand up', fn: stopWatchingTV }],
  });
}

function openBartender() {
  if (state.zone !== 'sidebar') return;
  const body = openPanel('B.A.R.T. — Robotic Butler & Bartender');
  body.innerHTML = `<div class="help-lede"><b>“Good evening, counselor. Your usual has been calculated.”</b><p>B.A.R.T. adjusts a bow tie and polishes a glass with a white glove.</p><p>Alcohol served here costs <b>zero Ethics</b> and halves walking speed for 40 seconds. Another drink refreshes the timer. Sparkling water has no effect.</p></div>`
    + BAR_DRINKS.map((drink) => `<article class="row-item"><div class="grow"><h4>${drink.name}</h4><p>${drink.note}</p><p>${drink.slows ? '0 Ethics damage · slow walking for 40 seconds' : 'No effect on Ethics or movement'}</p></div><button type="button" data-drink="${drink.id}" ${state.gold < drink.cost || pendingAttempt(state) ? 'disabled' : ''}>Order · ${drink.cost ? `${drink.cost} gold` : 'free'}</button></article>`).join('')
    + '<p id="bar-order-status" role="status"></p><button id="bar-scores" type="button">View billable-hours board</button>';
  body.querySelectorAll('[data-drink]').forEach((button) => button.onclick = () => {
    try {
      const { drink } = orderBarDrink(state,button.dataset.drink);
      save(); updateHUD(); openBartender();
      $('bar-order-status').textContent = `${drink.name} served. Ethics unchanged at ${state.ethics}. ${drink.slows ? 'Walking at half speed for 40 seconds.' : 'Enjoy your water.'}`;
    } catch (error) { $('bar-order-status').textContent = error.message; }
  });
  $('bar-scores').onclick = openHighScores;
}

function openHighScores() {
  const entries = readBillableBoard();
  const body = openPanel('The Sidebar — Billable Hours Hall of Fame');
  body.innerHTML = `<div class="help-lede"><h3>The hours outlive the office.</h3><p>Top 10 completed runs, ranked by billable time before disbarment. This board belongs to this browser; it is not an online or verified ranking.</p></div><p class="board-current">Current run: <b>${escapeHtml(state.name)}</b> · ${formatBillableTime(state.billableStudyMs)} · still practicing</p>`
    + (entries.length ? `<table class="score-table"><caption>Completed local runs</caption><thead><tr><th scope="col">Rank</th><th scope="col">Attorney</th><th scope="col">Billable time</th></tr></thead><tbody>${entries.map((entry,index) => `<tr><td>${index+1}</td><th scope="row">${escapeHtml(entry.name)}</th><td>${formatBillableTime(entry.billableMs)}</td></tr>`).join('')}</tbody></table>` : '<p class="board-empty">No completed runs yet. A score is recorded when an attorney is disbarred.</p>')
    + '<p class="board-note">The clock counts visible time inside an open ethics email or writing assignment, including its feedback. It pauses in the inbox list, other windows, and hidden tabs. Scores survive character resets; gold, inventory and progress do not. Shared scores will require the future server-backed multiplayer build.</p>';
}

function openJudgeStatus() {
  showDialogue({ name: 'The Honorable A.I. — Standby Judge',
    text: 'The judge is asleep in a high-backed chair behind the bench. A small light reads STANDBY. Court is not in session. This is a scripted preview: no AI judge is connected and no hearing or grading is taking place.',
    choices: [{ label: 'Read the future court docket', fn: () => showDialogue({ name: 'Future court docket',
      text: 'A later build will connect different AI judge agents to reviewed hearing records and jurisdiction-specific court exercises. Judge profiles, evidence-grounded rulings, review controls and evaluation are roadmap work. For now, let the judge sleep.',
    }) }, { label: 'Quietly step away.' }],
  });
}

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
  if (pendingAttempt(state)) { toast('Wait for the partner reply before making purchases.'); return; }
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
        if (pendingAttempt(state)) { toast('Wait for the partner reply before making purchases.'); return; }
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
        updateHUD(); updateQuickActions();
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
    <div class="row-item"><div class="grow"><h4>${escapeHtml(state.name)} (${pronouns})</h4>
      <p>Attorney at law, State of Juris. License status: ${state.ethics > 0 ? 'ACTIVE' : 'REVOKED'}</p></div></div>
    <div class="row-item"><div class="grow"><h4>Scenarios answered</h4></div><div class="meta">${state.casesDone}</div></div>
    <div class="row-item"><div class="grow"><h4>Answered correctly</h4></div><div class="meta">${state.correctDone} (${acc}%)</div></div>
    <div class="row-item"><div class="grow"><h4>Billable study time</h4>
      <p>Visible time in open BarMail questions, writing assignments and feedback</p></div><div class="meta">⏱ ${formatBillableTime(state.billableStudyMs)}</div></div>
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
  if (pendingAttempt(state)) { toast('Wait for the partner reply before making purchases.'); return; }
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
  if (!player || !['watching', 'sitting'].includes(player.activity)) return;
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
  if (pendingAttempt(state)) { toast('Your partner has a pending reply. Even Jim can wait five seconds.'); return; }
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
          state.slowUntil = Date.now() + WHISKEY_SLOW_MS; save();
          toast('Your movement is impaired for 40 seconds.');
        },
      },
    ],
  });
}

function openWardrobe() {
  desk.open('wardrobe');
}

function openHelp() {
  const body = openPanel('How to play');
  body.innerHTML = `
    <div class="row-item"><div class="grow"><h4>Your first five minutes</h4><p>Open <b>Journal</b> for a guided firm assignment, or <b>BarMail</b> in your office for a quick ethics question. Open a subject line, read the facts, choose a response and read the explanation.</p></div></div>
    <div class="row-item"><div class="grow"><h4>Choose your practice</h4><p>Use <b>Journal → Firm jurisdictions</b> or BarMail’s practice selector: California, New York, US MPRE-style, England &amp; Wales SQE-style, or LawScape original dilemmas. Mixed practice includes all five. The inbox shows your current difficulty tier.</p></div></div>
    <div class="row-item"><div class="grow"><h4>Move, explore, customize</h4><p>Click or tap to walk and interact; WASD and arrow keys also move. Use <b>Travel</b> for locations and <b>Journal → Wardrobe</b> to change your attorney. The Work Phone unlocks BarMail outside your office.</p></div></div>
    <div class="row-item"><div class="grow"><h4>Gold and Ethics</h4><p>Correct ethics answers earn gold. Repeated wrong answers cause increasing Ethics damage. Correct streaks and resting in your apartment help restore Ethics. At zero Ethics the character run ends: gold, upgrades and drafts are reset. Read feedback before the next reply.</p></div></div>
    <div class="row-item"><div class="grow"><h4>Your first firm day</h4><p>Read the two synthetic files, flag evidence and complete six writing assignments to unlock the capstone. Committing locks each reply until the partner responds. Checklist choices receive authored feedback and study gold without Ethics damage; your prose is saved for self-comparison, not graded by live AI.</p></div></div>
    <div class="row-item"><div class="grow"><h4>Research and local play</h4><p>The Ethics Treatise Shelf upgrade opens Nevada, Arizona and California reference material. Progress and Sidebar table notes stay in this browser, with no account or cross-device sync. The Sidebar has scripted characters; shared chat and live courtroom hearings are planned.</p></div></div>
    <div class="row-item"><div class="grow"><h4>Need help?</h4><p><a href="docs/PLAYING.html" target="_blank" rel="noopener">Player guide</a> · <a href="docs/JURISDICTIONS.html" target="_blank" rel="noopener">Jurisdictions and sources</a>. <b>Email HR · Report a bug</b> prepares a GitHub report for you to review and submit. Nothing is sent automatically. This is unofficial educational practice, not legal advice.</p></div></div>`;
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
$('email-writing').addEventListener('click', () => openEmail('writing'));
$('btn-journal').addEventListener('click', () => desk.open());
$('quest-status').addEventListener('click', () => desk.open());
$('btn-mail').addEventListener('click', () => {
  openEmail();
});
$('btn-record').addEventListener('click', openRecord);
$('btn-travel').addEventListener('click', openTravelMenu);
$('room-action').addEventListener('click', () => {
  if (state.zone === 'sidebar') openSidebar();
  else if (state.zone === 'courtroom') talkTo(zone.npcs.find((npc) => npc.id === 'derek_balam'));
});
$('room-service').addEventListener('click', () => state.zone === 'sidebar' ? openBartender() : openJudgeStatus());
$('room-board').addEventListener('click', openHighScores);

$('email').addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeEmail(); $('btn-mail').focus(); }
  if (event.key !== 'Tab') return;
  const focusable = [...$('email').querySelectorAll('button:not(:disabled), a[href], input, textarea, select, summary, [tabindex="0"]')].filter((el) => el.getClientRects().length);
  if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
  else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0]?.focus(); }
});

document.addEventListener('keydown', (event) => {
  if (desk.isOpen()) return;
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
  } else if (key === 'j' && !overlayOpen()) {
    desk.open();
  } else if (key === 'b' && canAccessBarMail(state) && !overlayOpen()) {
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
let pick = { ...normalizeAppearance(), gender: 'nonbinary', skin: 1 };
let creatorEditor = null;

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

function buildCreator() {
  creatorEditor?.destroy();
  function genderControls() {
    pillRow($('c-gender'), GENDERS.map((g) => g.label),
      (i) => GENDERS[i].id === pick.gender,
      (i) => { pick.gender = GENDERS[i].id; genderControls(); });
  }
  genderControls();
  creatorEditor = mountAppearanceEditor($('c-appearance'), {
    prefix: 'creator', read: () => pick,
    onChange: (key, value) => { pick[key] = value; },
  });
}

$('btn-new').addEventListener('click', () => {
  $('title-screen').classList.add('hidden');
  buildCreator();
  $('creator').classList.remove('hidden');
});

$('btn-creator-back').addEventListener('click', () => {
  creatorEditor?.destroy();
  $('creator').classList.add('hidden');
  $('title-screen').classList.remove('hidden');
});

$('btn-continue').addEventListener('click', () => {
  if (!load()) { toast('This save could not be loaded. It has not been changed.'); return; }
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
  Object.assign(state, normalizeAppearance(pick));
  creatorEditor?.destroy();
  save();
  $('creator').classList.add('hidden');
  startGame();
});

function startGame() {
  if (state.ethics <= 0 || state.runStatus === 'ended') { gameOver(); return; }
  player = new Actor(state.pos.x, state.pos.y,
    playerLook(), { speed: PLAYER_BASE_SPEED });
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
  desk.tick();
  if (!state.apprenticeship.introduced) {
    showDialogue({
      name: 'Liz Loza, Secretary',
      text: `Welcome to Hardsell & Firestone, ${state.name}. Two files are on your desk. `
        + 'Linda wants a useful reply. Jim wants it yesterday. Open your journal to inspect the record and begin your first firm day.',
      choices: [{ label: 'Open my apprenticeship journal', fn: () => desk.open() }, { label: 'Let me look around first.' }],
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
    desk.tick();
    player.speed = PLAYER_BASE_SPEED * movementMultiplier(state);
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

// Another tab must not continue spending or reviving an out-of-date character.
window.addEventListener('storage', (event) => {
  if (event.key !== 'lawscape_save_v2' || !inGame) return;
  inGame = false;
  desk.close();
  stopDocumentReview(false);
  closeEmail();
  hideDialogue();
  $('panel').classList.add('hidden');
  $('hud').classList.add('hidden');
  $('title-screen').classList.remove('hidden');
  refreshTitleButtons();
  toast('Your save changed in another tab. Continue to load the current character.');
});
