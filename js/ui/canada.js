import { CANADA_PACK } from '../data/canada.js';
import { canadaProgress } from '../canada.js';
import { dispatch } from '../progress.js';

export function escapeCanadaHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function canadaRulesHtml(ruleIds) {
  const e = escapeCanadaHtml;
  return ruleIds.map(id => {
    const rule = CANADA_PACK.rules.find(r => r.id === id);
    return `<article class="canada-rule"><h4>${e(rule.title)}</h4><p>${e(rule.summary)}</p><p class="canada-note">${e(rule.limits)}</p>${rule.sourceRefs.map(ref => {
      const source = CANADA_PACK.sources.find(s => s.id === ref.id);
      return `<p class="canada-note"><a href="${e(source.url)}" target="_blank" rel="noopener noreferrer">${e(source.title)}</a> · ${e(ref.locator)}</p>`;
    }).join('')}</article>`;
  }).join('');
}
export function renderCanadaEmail(container, id, player, back) {
  const task = CANADA_PACK.emails.find(item => item.id === id);
  if (!task) { back(); return; }
  const e = escapeCanadaHtml, progress = canadaProgress(player);
  const attempts = progress.emailAttempts.filter(a => a.taskId === id), latest = attempts.at(-1);
  const composing = !latest || Object.hasOwn(progress.drafts, id);
  container.innerHTML = `<section class="canada-email"><p class="canada-banner">CANADA TEST PACK · Practitioner review required · No Ethics or gold effects</p><h2>${e(task.title)}</h2><p><b>To:</b> ${e(task.to)} · <b>Role:</b> ${e(task.practitionerRole)}</p><p>${e(task.jurisdiction)} · ${e(task.forum)}</p><p class="canada-note">${e(task.setting)}. All people and records are fictional.</p><p>${e(task.prompt)}</p><details open><summary>Assignment record</summary>${task.records.map(r=>`<p><b>${e(r.id)}</b> ${e(r.text)}</p>`).join('')}</details><details><summary>Relevant rules and scope</summary>${canadaRulesHtml(task.ruleIds)}</details><p class="canada-note">Your prose is for self-comparison and practitioner review. The partner guidance is prewritten. This is a local exercise; no email is sent.</p><div id="canada-compose"></div><div id="canada-correspondence"></div><p id="canada-save-status" role="status"></p><p><a href="canada-test/review.html#${e(id)}" target="_blank" rel="noopener">Open practitioner review for this assignment</a></p><button id="canada-back" type="button">Back to inbox</button></section>`;
  container.querySelector('#canada-back').onclick = back;
  const status = container.querySelector('#canada-save-status');
  const saveStatus = (ok) => { status.textContent = ok ? 'Saved.' : 'Session only — storage is unavailable. Copy your reply or export it before closing.'; return ok; };
  const rerender = () => renderCanadaEmail(container, id, player, back);
  if (composing) {
    container.querySelector('#canada-compose').innerHTML = `<form id="canada-email-form"><label for="canada-email-text">Your reply · 100–200 words suggested</label><textarea id="canada-email-text" rows="9" maxlength="6000">${e(progress.drafts[id] || '')}</textarea><p id="canada-word-count" class="canada-note"></p><p id="canada-email-error" role="alert"></p><button type="submit">Commit practice reply · local only</button></form>`;
    const form=container.querySelector('#canada-email-form'), input=container.querySelector('#canada-email-text');
    const changed=()=>{container.querySelector('#canada-word-count').textContent=`${input.value.trim().split(/\s+/).filter(Boolean).length} words`;dispatch({type:'canada_draft',id,text:input.value},{coalesce:500}).then(()=>saveStatus(true),()=>saveStatus(false));};
    input.addEventListener('input',changed);
    form.onsubmit=event=>{event.preventDefault();dispatch({type:'canada_draft',id,text:input.value}).then(()=>dispatch({type:'canada_commit_email',id})).then(()=>{rerender();container.querySelector('#canada-save-status').textContent='Reply committed and saved.';}).catch(error=>{container.querySelector('#canada-email-error').textContent=error.message;});};
  }
  if (latest) {
    container.querySelector('#canada-correspondence').innerHTML = `<h3>Correspondence · ${attempts.length} committed ${attempts.length===1?'reply':'replies'}</h3>${attempts.map((a,i)=>`<details ${i===attempts.length-1?'open':''}><summary>Committed reply ${i+1}</summary><p class="preserve-lines">${e(a.text)}</p></details>`).join('')}<details id="canada-partner"><summary>Read authored partner guidance and sample response</summary><p>${e(task.partnerReply)}</p><h3>One acceptable response</h3><p class="preserve-lines">${e(task.sampleResponse)}</p><h3>Human review rubric</h3><p>${e(task.rubricScale)}</p><ul>${task.rubric.map(r=>`<li>${e(r.criterion)} — ${r.points} points</li>`).join('')}</ul><h4>Discuss any critical issues</h4><ul>${task.criticalIssues.map(s=>`<li>${e(s)}</li>`).join('')}</ul><h4>Other acceptable approaches</h4><ul>${task.acceptableAlternatives.map(s=>`<li>${e(s)}</li>`).join('')}</ul></details>${!composing?'<button id="canada-revise" type="button">Draft a revision · keep the original</button>':''}<button id="canada-export" type="button">Export Canada practice responses</button>`;
    const revise=container.querySelector('#canada-revise');if(revise)revise.onclick=()=>{dispatch({type:'canada_draft',id,text:latest.text}).then(rerender).catch(()=>{});};
    container.querySelector('#canada-export').onclick=()=>{
      const payload={packVersion:CANADA_PACK.version,notice:'Local practice responses, not practitioner approval or AI grading.',...canadaProgress(player)};
      const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='lawscape-canada-practice-responses.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
  }
  if (progress.archives.length) status.textContent='Earlier content-version responses are preserved in the response export; they are not regraded against this version.';
}
