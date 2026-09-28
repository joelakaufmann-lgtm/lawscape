import { state, save } from '../state.js';
import { DOCUMENT_PACKS, WRITING_TASKS, CAPSTONE, FIRM_PACKS, COSMETICS, TRAINING_JURISDICTION, evidenceAt } from '../data/apprenticeship.js';
import { taskById, pendingAttempt, taskAttempts, returnedTasks, capstoneReady, saveDraft, commitWriting, settleReplies, submitReview, buyCosmetic, requestJurisdiction, requestIssueUrl } from '../apprenticeship.js';
import { Actor } from '../entities/actor.js';
import { appearanceLook } from '../data/appearance.js';
import { mountAppearanceEditor } from './appearance.js';
import { GLOBAL_CURRICULUM } from '../data/jurisdictions.js';
import { PRACTICE_PACKS } from '../data/practice-packs.js';

const $ = (id) => document.getElementById(id);
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const e = escapeHtml;
function linkedEvidence(text, sources) {
  return e(text).replace(/\b([LH]\d+\.\d+)\b/g, (anchor) => sources.includes(anchor)
    ? `<a href="#source-${anchor}">${anchor}</a>` : anchor);
}
const button = (text, action, value = '', extra = '') => `<button type="button" data-action="${action}" data-value="${e(value)}" ${extra}>${e(text)}</button>`;
const note = (text) => `<p class="desk-note">${e(text)}</p>`;

export function createApprenticeshipUI({ beforeOpen, onChange, onPractice, onWriting, onWritingExit, notify }) {
  const modal = $('apprenticeship'), body = $('desk-body');
  const home = body.parentElement;
  let writingEmbedded = false;
  let view = 'journal', selected = null, previousFocus = null, lastTick = 0;

  function drawAvatar() {
    const canvas = $('desk-portrait');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const look = appearanceLook(state, state.apprenticeship.equipped);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(2.05, 2.05);
    new Actor(0, 0, look).draw(ctx, 41, 92, 0, true);
    ctx.restore();
  }

  function render() {
    $('desk-player').textContent = state.name;
    $('desk-gold').textContent = `${Math.floor(state.gold)} gold`;
    document.querySelectorAll('[data-desk-tab]').forEach((tab) => {
      tab.setAttribute('aria-current', tab.dataset.deskTab === view ? 'page' : 'false');
    });
    if (view === 'journal') renderJournal();
    else if (view === 'writing') renderWriting();
    else if (view === 'files') renderFiles();
    else if (view === 'firm') renderFirm();
    else if (view === 'wardrobe') renderWardrobe();
    drawAvatar();
  }

  function open(next = 'journal', id = null) {
    if (state.ethics <= 0) return;
    if (next === 'writing') { onWriting(id); return; }
    if (!isOpen()) previousFocus = document.activeElement;
    beforeOpen();
    view = next; selected = id;
    state.apprenticeship.introduced = true;
    save();
    modal.classList.remove('hidden');
    render();
    $('desk-close').focus();
  }
  function close() {
    modal.classList.add('hidden');
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  function isOpen() { return !modal.classList.contains('hidden'); }
  function navigate(next, id = null) {
    if (next === 'writing' && (!writingEmbedded || !id)) { onWriting(id); return; }
    if (writingEmbedded && next !== 'writing') { onWritingExit(next,id); return; }
    view = next; selected = id; render(); body.scrollTop = 0; body.focus();
  }
  function embedWriting(host, id) {
    modal.classList.add('hidden');
    host.appendChild(body);
    writingEmbedded = true; view = 'writing'; selected = id;
    state.apprenticeship.introduced = true;
    render(); body.scrollTop = 0; body.focus();
  }
  function releaseWriting() {
    if (!writingEmbedded) return;
    home.appendChild(body); writingEmbedded = false;
  }
  function section(kicker, title, intro) { return `<header class="desk-section"><p class="desk-kicker">${e(kicker)}</p><h2>${e(title)}</h2><p>${e(intro)}</p></header>`; }

  function renderJournal() {
    const done = returnedTasks(state).length;
    const reviews = DOCUMENT_PACKS.filter((pack) => state.apprenticeship.reviews[pack.id]).length;
    const pending = pendingAttempt(state);
    const next = WRITING_TASKS.find((task) => !taskAttempts(state, task.id).length);
    const finished = taskAttempts(state, 'capstone').some((a) => a.status === 'returned');
    body.innerHTML = section('Hardsell & Firestone · First day', 'A small firm. Large expectations.', 'Inspect the record. Write something useful. Let the partner get back to you.')
      + `<div class="desk-hero"><div><span class="desk-badge">${e(TRAINING_JURISDICTION)}</span><h3>${finished ? 'Your first handoff is complete.' : 'Your apprenticeship starts here.'}</h3><p>Linda wants evidence. Jim wants it yesterday. Liz has put the files in order, which is more than can be said for the partners.</p>${button(pending ? 'Read sent correspondence' : next ? 'Continue your assignments' : 'Open the capstone', 'task', pending?.taskId || next?.id || 'capstone')}</div><canvas id="desk-portrait" width="168" height="200" aria-label="Your attorney portrait"></canvas></div>`
      + `<div class="desk-metrics"><span><b>${done}/6</b> partner replies</span><span><b>${reviews}/2</b> files reviewed</span><span><b>${finished ? 'Complete' : 'In progress'}</b> first firm day</span></div>`
      + (pending ? `<p class="desk-pending" role="status">Sent — awaiting partner review. Your submitted answer is locked. You can walk around while Linda or Jim replies.</p>` : '')
      + `<ol class="quest-path"><li><b>Read the source file</b><span>Open the exhibits and flag exact passages that need follow-up.</span>${button('Open files', 'files')}</li><li><b>Write and commit</b><span>Draft your reply, select your issue, next step and evidence. Sending locks that attempt.</span>${button('Open BarMail writing', 'writing')}</li><li><b>Read the partner’s reply</b><span>Compare the authored guidance to your prose. Study gold is based on the explicit checklist choices.</span></li><li><b>Make it your practice</b><span>Earn a 30-gold tie, improve your office, then bring both matters together.</span>${button('Open wardrobe', 'wardrobe')}</li></ol>`
      + `<details class="desk-disclosure"><summary>How this local apprenticeship works</summary><p>The new files are synthetic and governed by fictional office policies. Authored partner replies assess your three checklist choices; your prose and review notes are saved for self-comparison, not AI graded. New exercises award local study gold without Ethics damage. Existing BarMail ethics dilemmas retain full-reset disbarment at zero Ethics. Gold, drafts, quests and cosmetics are lost when that run ends.</p><p>This build stores progress in this browser. It has no accounts or shared room. Other careers, reviewed jurisdiction packs and online assessment are later releases.</p></details>`;
  }

  function renderWriting() {
    if (!selected) {
      body.innerHTML = section('BarMail · Write a reply', 'The partner inbox', 'Six assignments, two matters, one connected handoff. All replies stay inside this game.')
        + `<div class="assignment-list">${[...WRITING_TASKS, CAPSTONE].map((task, index) => {
          const attempts = taskAttempts(state, task.id), latest = attempts.at(-1);
          const locked = task.id === 'capstone' && !capstoneReady(state);
          const status = locked ? 'Complete six replies and two files' : latest?.status === 'pending' ? 'Awaiting partner' : latest ? `${latest.result.correct}/3 checklist · reply received` : state.apprenticeship.drafts[task.id] ? 'Draft saved' : 'Ready to draft';
          return `<article class="assignment-card"><span class="desk-number">${String(index + 1).padStart(2, '0')}</span><div><p class="desk-kicker">${e(task.partner)} · ${e(task.skill)}</p><h3>${e(task.title)}</h3><p>${e(status)}</p></div>${button(latest ? 'Open correspondence' : 'Open assignment', 'task', task.id, locked ? 'disabled' : '')}</article>`;
        }).join('')}</div>`;
      return;
    }
    const task = taskById(selected);
    if (!task) { selected = null; renderWriting(); return; }
    if (task.id === 'capstone' && !capstoneReady(state)) {
      body.innerHTML = section('Connected capstone', 'The partner’s desk is not ready yet.', 'Receive all six assignment replies and review both document files, then return for the final handoff.') + button('Return to assignments', 'writing');
      return;
    }
    const attempts = taskAttempts(state, selected), latest = attempts.at(-1);
    const draft = state.apprenticeship.drafts[selected];
    const composing = !latest || (latest.status === 'returned' && draft);
    body.innerHTML = button('← Assignment inbox', 'writing')
      + section(`${task.partner} · ${task.skill}`, task.title, task.prompt)
      + `<p class="desk-meta">From: ${e(task.partner)}<br>To: ${e(state.name)} · Hardsell &amp; Firestone<br>${e(TRAINING_JURISDICTION)} · Synthetic assignment, September 2026</p>`
      + `<details class="desk-sources" open><summary>Assignment record and source briefing</summary>${task.sources.map((anchor) => {
        const source = evidenceAt(anchor);
        return `<article id="source-${e(anchor)}"><strong>${e(anchor)} · ${e(source.doc.title)}</strong><p>${e(source.text)}</p></article>`;
      }).join('')}</details>`;
    if (composing) {
      const value = draft || { text: '', issue: null, action: null, evidence: '' };
      const options = (key, label, list) => `<fieldset><legend>${label}</legend>${list.map((text, index) => `<label class="desk-choice"><input type="radio" name="${key}" value="${index}" ${value[key] === index ? 'checked' : ''}>${e(text)}</label>`).join('')}</fieldset>`;
      body.innerHTML += `<form id="writing-form"><label class="desk-label" for="writing-text">Your reply <span>75–150 words suggested · flexible, 6,000 characters maximum</span></label><textarea id="writing-text" name="text" rows="7" maxlength="6000" placeholder="Explain what the record shows, what remains uncertain, and what should happen next…">${e(value.text)}</textarea><p id="draft-status" class="desk-note" role="status"></p>`
        + options('issue', 'What is the central issue?', task.issues) + options('action', 'What is your next step?', task.actions)
        + `<label class="desk-label" for="writing-evidence">${e(task.evidencePrompt || 'Choose the passage that most directly supports the central issue')}</label><select id="writing-evidence" name="evidence"><option value="">Select an evidence reference</option>${task.sources.map((anchor) => `<option value="${e(anchor)}" ${value.evidence === anchor ? 'selected' : ''}>${e(anchor)} · ${e(evidenceAt(anchor).doc.title)}</option>`).join('')}</select>`
        + note('Commit locks this reply. The partner returns in a few seconds. Gold reflects your checklist choices; the prose is for self-comparison.')
        + `<p id="writing-error" class="desk-error" role="alert"></p><button type="submit" ${pendingAttempt(state) ? 'disabled' : ''}>Commit reply & send to partner</button></form>`;
      const form = $('writing-form');
      function persist() {
        const formData = new FormData(form);
        saveDraft(state, task.id, { text: formData.get('text'), issue: formData.has('issue') ? Number(formData.get('issue')) : null, action: formData.has('action') ? Number(formData.get('action')) : null, evidence: formData.get('evidence') });
        const saved = save();
        const words = String(formData.get('text')).trim().split(/\s+/).filter(Boolean).length;
        $('draft-status').textContent = `${words} words · ${saved ? 'Draft saved in this browser' : 'Session only — browser storage is unavailable'}`;
      }
      form.addEventListener('input', persist);
      form.addEventListener('change', persist);
      form.addEventListener('submit', (event) => {
        event.preventDefault(); persist();
        try { commitWriting(state, task.id); save(); render(); onChange(); }
        catch (error) { $('writing-error').textContent = error.message; }
      });
      persist();
    }
    if (latest && !composing) {
      body.innerHTML += `<article class="sent-reply"><p class="desk-kicker">${latest.status === 'pending' ? 'Sent — awaiting partner review' : 'Your committed reply'} · Attempt ${attempts.length}</p><p class="preserve-lines">${e(latest.submission.text)}</p><dl><dt>Issue</dt><dd>${e(task.issues[latest.submission.issue])}</dd><dt>Next step</dt><dd>${e(task.actions[latest.submission.action])}</dd><dt>Evidence</dt><dd>${e(latest.submission.evidence)}</dd></dl></article>`;
      if (latest.status === 'pending') body.innerHTML += `<p class="desk-pending" role="status">Your answer is locked. Your partner will reply shortly; closing this window will not cancel the submission.</p>`;
      else {
        body.innerHTML += `<article class="partner-reply"><p class="desk-kicker">From ${e(task.partner)} · Authored practice feedback</p><h3>${latest.result.correct}/3 checklist choices · +${latest.result.gold} gold</h3><p>${linkedEvidence(task.reply, task.sources)}</p><ul>${['Issue recognition', 'Next action', 'Evidence selection'].map((label, index) => `<li>${latest.result.checks[index] ? '✓' : 'Revisit:'} ${label}</li>`).join('')}</ul><p class="desk-note">Compare your prose to this guidance. Your free text was not graded. Reward credited once when this reply arrived.</p></article>`;
        if (latest.result.correct < 3 && attempts.length < 2) body.innerHTML += button('Accept invitation to revise', 'revise', task.id) + note('One revision is available. Improving the checklist can earn up to 20% extra; your original answer remains in the correspondence.');
        else body.innerHTML += button('Return to journal', 'journal');
      }
    }
    if (attempts.length > 1 || (latest && composing)) body.innerHTML += `<details class="desk-disclosure"><summary>Earlier committed correspondence</summary>${attempts.slice(0, composing ? undefined : -1).map((a) => `<p class="preserve-lines">${e(a.submission.text)}</p><p>${a.result?.correct ?? 'Pending'}/3 checklist · ${a.result?.gold || 0} gold</p>`).join('')}</details>`;
  }

  function renderFiles() {
    const pack = DOCUMENT_PACKS.find((item) => item.id === selected);
    if (!pack) {
      body.innerHTML = section('Evidence room', 'Open the file before the opinion.', 'Two matters. Twelve original exhibits. Every passage has a stable reference you can cite.')
        + `<div class="desk-card-grid">${DOCUMENT_PACKS.map((item) => `<article class="desk-card"><p class="desk-kicker">${e(item.client)} · ${e(item.date)}</p><h3>${e(item.title)}</h3><p>${e(item.subtitle)}</p><p>${state.apprenticeship.reviews[item.id] ? 'Review complete · revisit the record anytime' : 'Six documents · up to 75 study gold'}</p>${button('Open file', 'file', item.id)}</article>`).join('')}</div>`
        + note('All exhibits are synthetic training material. Flagging a passage is an evidence exercise, not a final legal or privilege determination.');
      return;
    }
    const receipt = state.apprenticeship.reviews[pack.id];
    const draft = receipt || state.apprenticeship.reviewDrafts[pack.id] || { selected: [], notes: '' };
    body.innerHTML = button('← All files', 'files') + section('Synthetic training material · State of Juris', pack.title, pack.brief)
      + `<div class="file-workspace"><nav class="file-index" aria-label="Document list">${pack.documents.map((doc) => `<a href="#doc-${doc.id}">${e(doc.title)}</a>`).join('')}</nav><div class="file-exhibits">${pack.documents.map((doc) => `<article class="exhibit" id="doc-${doc.id}"><p class="desk-kicker">Synthetic training material · ${e(doc.date)}</p><h3>${e(doc.title)}</h3>${doc.paragraphs.map((text, index) => {
        const anchor = `${doc.id}.${index + 1}`;
        return `<div class="evidence-paragraph" id="passage-${anchor}"><label><input type="checkbox" name="finding" value="${anchor}" ${draft.selected.includes(anchor) ? 'checked' : ''} ${receipt ? 'disabled' : ''}><span>${anchor}</span><span class="sr-only">Flag this passage</span></label><p>${e(text)}</p></div>`;
      }).join('')}</article>`).join('')}</div><aside class="file-notes"><h3>Your findings</h3><p id="finding-count" role="status">${draft.selected.length} passages flagged</p><label class="desk-label" for="review-notes">Explain each flag, cite its reference, and identify the follow-up.</label><textarea id="review-notes" rows="9" maxlength="6000" ${receipt ? 'readonly' : ''}>${e(draft.notes)}</textarea>${receipt ? `<p class="desk-badge">Review credited · +${receipt.gold} gold</p>` : button('Commit file review', 'review', pack.id, pendingAttempt(state) ? 'disabled' : '')}<p id="review-error" class="desk-error" role="alert"></p>${note('Checklist gold: 15 for completion, up to 60 for supported flags. Unsupported flags reduce the bonus. Notes are for self-comparison.')}</aside></div>`;
    if (receipt) body.innerHTML += `<article class="partner-reply"><h3>Linda’s file review · ${receipt.hits.length}/3 supported flags</h3>${pack.findings.map((finding) => `<p><a href="#passage-${finding.anchor}">${finding.anchor}</a> · <b>${e(finding.label)}</b><br>${e(finding.why)}</p>`).join('')}<p>${receipt.falsePositives.length ? `Revisit these extra flags: ${receipt.falsePositives.join(', ')}. The passage may provide context, but does not itself establish one of the three requested follow-up issues.` : 'No extra flags.'}</p>${button('Take this to the partner inbox', 'writing')}</article>`;
    else {
      function persist() {
        const anchors = [...body.querySelectorAll('input[name="finding"]:checked')].map((input) => input.value);
        state.apprenticeship.reviewDrafts[pack.id] = { selected: anchors, notes: $('review-notes').value };
        save();
        $('finding-count').textContent = `${anchors.length} passages flagged · draft saved`;
      }
      body.querySelectorAll('input[name="finding"], #review-notes').forEach((input) => input.addEventListener('input', persist));
    }
  }

  function renderFirm(prefill = '') {
    body.innerHTML = section('Your firm · Jurisdictions', 'Choose your practice', 'Open a question pack in BarMail. Without a Work Phone, this takes you to your office computer.')
      + `<div class="desk-card-grid">${PRACTICE_PACKS.map(pack => `<article class="desk-card"><span class="desk-badge">${pack.count} questions · Playable</span><h3>${e(pack.label)}</h3><p>${e(pack.note)}</p>${button('Play ' + pack.label, 'practice-pack', pack.id)}</article>`).join('')}</div>`
      + note('Unofficial educational questions with authored feedback. California and New York source checks: September 27, 2026. These question packs are separate from a full jurisdiction-specific firm curriculum.')
      + `<h3 class="desk-subheading">Your fictional firm apprenticeship</h3><p>State of Juris office policies govern six writing assignments, two synthetic files and one capstone. No real jurisdiction is implied.</p>${button('Open your journal', 'journal')}`
      + `<details class="desk-disclosure"><summary>Future firm curricula and worldwide expansion</summary><p>${e(GLOBAL_CURRICULUM.mission)}</p><div class="global-regions">${GLOBAL_CURRICULUM.regions.map(region => `<article><h4>${e(region.name)}</h4><p>${region.places.map(e).join(' · ')}</p></article>`).join('')}</div><p>These are future targets. Canada is planned with province-specific review. A country may contain several legal systems.</p><div class="desk-card-grid">${FIRM_PACKS.filter(pack => pack.id !== 'juris').map(pack => `<article class="desk-card"><h4>${e(pack.label)} firm curriculum</h4><p>${e(pack.status)} · ${e(pack.note)}</p>${button('Request this curriculum', 'request-prefill', pack.label)}</article>`).join('')}</div></details>`
      + `<form id="jurisdiction-form" class="request-form"><h3>Put a jurisdiction on the wish list</h3><p>Use an exact legal system, such as a U.S. state, England & Wales, Scotland or Northern Ireland. No real client facts or private documents.</p><label class="desk-label" for="request-label">Jurisdiction</label><input id="request-label" name="label" maxlength="80" required value="${e(prefill)}"><label class="desk-label" for="request-topic">What would you like to practice?</label><textarea id="request-topic" name="topic" maxlength="500" rows="2" required></textarea><label class="desk-label" for="request-help">Optional reviewer offer or public-source links</label><textarea id="request-help" name="help" maxlength="500" rows="2"></textarea><p class="desk-note">This saves a local request draft. You can then review it on GitHub and choose whether to submit it publicly. Nothing is sent automatically.</p><p id="request-error" class="desk-error" role="alert"></p><button type="submit">Save request locally</button></form>`
      + `<h3 class="desk-subheading">Your local request drafts</h3>${state.apprenticeship.requests.length ? state.apprenticeship.requests.map((request) => `<article class="desk-card"><h4>${e(request.label)}</h4><p>${e(request.topic)}</p><p class="desk-note">${e(request.status)}</p><a class="desk-link" href="${e(requestIssueUrl(request))}" target="_blank" rel="noopener noreferrer">Review draft on GitHub ↗</a></article>`).join('') : note('No requests saved yet. A repeat request for the same jurisdiction reopens the existing local entry.')}`;
    $('jurisdiction-form').addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        requestJurisdiction(state, $('request-label').value, $('request-topic').value, $('request-help').value);
        save(); renderFirm(); notify('Jurisdiction request saved locally. Nothing has been sent.');
      } catch (error) { $('request-error').textContent = error.message; }
    });
  }

  function renderWardrobe() {
    body.innerHTML = section('The wardrobe', 'An attorney with character.', 'Change your hair, face and clothes whenever you like. Identity options are free; earned accessories stay with this character run.')
      + '<div id="wardrobe-appearance"></div>'
      + `<h3 class="desk-subheading">Earned accessories</h3><div class="desk-card-grid">${COSMETICS.map((item) => {
        const owned = state.apprenticeship.cosmetics.includes(item.id), equipped = state.apprenticeship.equipped.includes(item.id);
        return `<article class="desk-card"><span class="desk-badge">${owned ? 'Owned' : `${item.price} gold`}</span><h3>${e(item.label)}</h3><p>${e(item.note)}</p>${button(owned ? equipped ? 'Unequip' : 'Equip' : 'Purchase & wear', owned ? 'equip' : 'buy', item.id, !owned && (state.gold < item.price || pendingAttempt(state)) ? 'disabled' : '')}</article>`;
      }).join('')}</div>` + note('The earned gold tie overrides the base tie color while equipped. Selecting another tie color puts it away; it remains in your wardrobe.');
    mountAppearanceEditor($('wardrobe-appearance'), {
      prefix: 'wardrobe', read: () => state, equipped: () => state.apprenticeship.equipped,
      onChange: (key, value) => {
        state[key] = value;
        if (key === 'tieColor') state.apprenticeship.equipped = state.apprenticeship.equipped.filter((id) => id !== 'tie-brass');
        save(); onChange();
        // Keep accessory button labels in sync without remounting the editor.
        const tie = body.querySelector('[data-action="equip"][data-value="tie-brass"]');
        if (tie) tie.textContent = state.apprenticeship.equipped.includes('tie-brass') ? 'Unequip' : 'Equip';
      },
    });
  }

  body.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#source-"]')) {
      const sources = body.querySelector('.desk-sources');
      if (sources) sources.open = true;
    }
    const target = event.target.closest('button[data-action]');
    if (!target) return;
    const { action, value } = target.dataset;
    if (['journal', 'writing', 'files', 'firm', 'wardrobe'].includes(action)) navigate(action);
    else if (action === 'task') navigate('writing', value);
    else if (action === 'file') navigate('files', value);
    else if (action === 'practice-pack' && PRACTICE_PACKS.some(pack => pack.id === value)) { close(); onPractice(value); }
    else if (action === 'request-prefill') { renderFirm(value); $('request-label').focus(); }
    else if (action === 'revise') {
      const previous = taskAttempts(state, value).at(-1);
      saveDraft(state, value, { ...previous.submission }); save(); render();
    } else if (action === 'review') {
      try {
        const selectedAnchors = [...body.querySelectorAll('input[name="finding"]:checked')].map((input) => input.value);
        submitReview(state, value, selectedAnchors, $('review-notes').value); save(); render(); onChange();
      } catch (error) { $('review-error').textContent = error.message; }
    } else if (action === 'buy') {
      try { buyCosmetic(state, value); save(); onChange(); render(); }
      catch (error) { notify(error.message); }
    } else if (action === 'equip' && state.apprenticeship.cosmetics.includes(value)) {
      const worn = state.apprenticeship.equipped;
      state.apprenticeship.equipped = worn.includes(value) ? worn.filter((id) => id !== value) : [...worn, value];
      save(); onChange(); render();
    }
  });
  document.querySelectorAll('[data-desk-tab]').forEach((tab) => tab.addEventListener('click', () => navigate(tab.dataset.deskTab)));
  $('desk-close').addEventListener('click', close);
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea, select, summary, [tabindex="0"]')].filter((el) => el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  function tick(now = Date.now()) {
    if (now - lastTick < 500) return;
    lastTick = now;
    const delivered = settleReplies(state, now);
    if (delivered.length) {
      save(); onChange();
      notify(`${taskById(delivered[0].taskId).partner} replied · +${delivered[0].result.gold} gold`);
      if ((isOpen() || writingEmbedded) && (view === 'journal' || (view === 'writing' && (!selected || delivered.some((a) => a.taskId === selected))))) render();
      // Re-enable dependent actions without discarding text entered while waiting.
      body.querySelectorAll('[data-action="review"], #writing-form button[type="submit"]').forEach((el) => { el.disabled = false; });
    }
    const pending = pendingAttempt(state);
    $('quest-status').textContent = pending ? 'Partner reviewing your reply…' : delivered.length ? 'Partner reply received · Open Journal' : `First firm day · ${returnedTasks(state).length}/6 replies · Open Journal`;
  }
  return { open, close, isOpen, tick, embedWriting, releaseWriting };
}
